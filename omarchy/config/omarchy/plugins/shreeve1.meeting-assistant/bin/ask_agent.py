"""Long-lived `omp --mode rpc` driver for the Ask feature.

Frame shapes were read from tests/fixtures/ask_turn.jsonl and
tests/fixtures/ask_busy_send.jsonl (recorded omp streams). A queued follow-up
starts at its user message_start; prompt_result closes a turn; only
session_settled means idle. Abort ordering and rejected prompts are [inferred].
"""

import asyncio
import contextlib
import json
import os
import signal
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Callable, Optional

from ask_pure import ALLOWLIST

MARKER_COMMAND = "meeting-assistant-ask-context"
EXTENSION_MISSING = "ask-context extension did not load"
EXITED_MESSAGE = "Ask agent exited"
START_TIMEOUT = 30.0
FRAME_LIMIT = 1 << 27  # omp maxReassembledFrameBytes is 64 MiB
PREVIEW_CHARS = 60
BUSY_SLASH_MESSAGE = "Wait for the current reply before running a slash command"


class AskState(Enum):
    STOPPED = "stopped"
    STARTING = "starting"
    IDLE = "idle"
    BUSY = "busy"
    ERROR = "error"


@dataclass
class Turn:
    n: int
    text: str
    queued: bool = False
    status: Optional[str] = None
    reply: list = field(default_factory=list)
    user_seen: bool = False
    output: list = field(default_factory=list)
    agent_started: bool = False

    @property
    def is_open(self) -> bool:
        # no_response is a notice, not an end: frames may still arrive.
        return self.status in (None, "no_response")

    @property
    def partial(self) -> str:
        return "".join(self.reply)


@dataclass
class _Pending:
    kind: str
    turn: Optional[Turn] = None
    on_accepted: Optional[Callable[[], None]] = None
    future: Optional[asyncio.Future] = None
    dropped: list = field(default_factory=list)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def _preview(text: str) -> str:
    return text[:PREVIEW_CHARS] + " ..."


def _is_local_command(text: str) -> bool:
    tokens = text.split(None, 1)
    return bool(tokens) and tokens[0].startswith("/") and tokens[0][1:].lower() in ALLOWLIST


def _message_text(content) -> str:
    if isinstance(content, str):
        return content
    if not isinstance(content, list):
        return ""
    return "".join(
        part["text"]
        for part in content
        if isinstance(part, dict) and part.get("type") == "text" and isinstance(part.get("text"), str)
    )


class AskAgent:
    def __init__(self, *, emit: Callable[[dict], None], argv: list, env: dict, cwd: str, timeout: float):
        self._emit = emit
        self._argv = list(argv)
        self._env = env
        self._cwd = cwd
        self._timeout = timeout
        self.start_timeout = START_TIMEOUT
        self.state = AskState.STOPPED
        self.detail: Optional[str] = None
        self.commands: list = []
        self.interrupted = False
        self._reported = None
        self._proc: Optional[asyncio.subprocess.Process] = None
        self._reader: Optional[asyncio.Task] = None
        self._watchdog: Optional[asyncio.Task] = None
        self._cur: Optional[Turn] = None
        self._queue: list = []
        self._pending: dict = {}
        self._sent: dict = {}
        self._turn_seq = 0
        self._rpc_seq = 0
        self._frame_seq = 0
        self._fired_seq = -1
        self._last_frame = 0.0
        self._wake = asyncio.Event()
        self._open_lock = asyncio.Lock()
        self._send_lock = asyncio.Lock()
        self._last_send = None

    def _event(self, type_: str, **fields) -> None:
        self._emit({"type": type_, **fields})

    def _transition(self, state: AskState, detail: Optional[str] = None) -> None:
        self.state = state
        self.detail = detail
        turn = self._cur.n if self._cur is not None else None
        key = (state, turn, detail)
        if key == self._reported:
            return
        self._reported = key
        self._event("ask_status", state=state.value, turn=turn, detail=detail)

    def _touch(self) -> None:
        self._frame_seq += 1
        self._last_frame = asyncio.get_running_loop().time()
        self._wake.set()

    def _next_rpc(self, kind: str, turn=None, on_accepted=None):
        self._rpc_seq += 1
        rid = f"ask-{self._rpc_seq}"
        future = asyncio.get_running_loop().create_future() if kind == "commands" else None
        self._pending[rid] = _Pending(kind, turn, on_accepted, future)
        return rid, future

    def _resolve_pending(self, restore: bool = True) -> None:
        pending = list(self._pending.values())
        self._pending.clear()
        self._sent.clear()
        for item in pending:
            if item.future is not None and not item.future.done():
                item.future.set_result(None)
            elif item.kind == "abort" and restore:
                self._restore(item.dropped, None)

    def _restore(self, dropped: list, data) -> None:
        if not isinstance(data, dict):
            texts = [t.text for t in dropped]
        else:
            texts = []
            for key in ("steering", "followUp"):
                items = data.get(key) if isinstance(data, dict) else None
                for item in items if isinstance(items, list) else []:
                    text = item.get("text") if isinstance(item, dict) else item
                    if isinstance(text, str):
                        texts.append(text)
        unmatched = list(dropped)
        messages = []
        for text in texts:
            turn = next((t for t in unmatched if t.text == text), None)
            if turn is not None:
                unmatched.remove(turn)
            messages.append({"turn": turn.n if turn is not None else None, "text": text})
        if messages:
            self._event("ask_restored", messages=messages)

    async def _write(self, obj: dict) -> bool:
        proc = self._proc
        if proc is None or proc.stdin is None:
            return False
        try:
            proc.stdin.write((json.dumps(obj) + "\n").encode("utf-8"))
            await proc.stdin.drain()
        except OSError:
            return False
        return True

    @staticmethod
    async def _cancel(task: Optional[asyncio.Task]) -> None:
        if task is None or task is asyncio.current_task() or task.done():
            return
        task.cancel()
        await asyncio.gather(task, return_exceptions=True)

    @staticmethod
    async def _reap(proc, grace: float) -> None:
        with contextlib.suppress(OSError, AttributeError):
            proc.stdin.close()
        if grace > 0:
            with contextlib.suppress(asyncio.TimeoutError):
                await asyncio.wait_for(proc.wait(), grace)
        with contextlib.suppress(ProcessLookupError, PermissionError):
            os.killpg(proc.pid, signal.SIGKILL)
        await proc.wait()

    async def open(self) -> None:
        async with self._open_lock:
            if self.state in (AskState.IDLE, AskState.BUSY):
                return
            await self._launch()

    async def _launch(self) -> None:
        self._transition(AskState.STARTING)
        try:
            proc = await asyncio.create_subprocess_exec(
                *self._argv,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.DEVNULL,
                env=self._env,
                cwd=self._cwd,
                start_new_session=True,
                limit=FRAME_LIMIT,
            )
        except OSError as exc:
            self._transition(AskState.ERROR, f"Ask agent failed to start: {exc}")
            return
        self._proc = proc
        self._reader = asyncio.create_task(self._read_loop(proc))
        self._watchdog = asyncio.create_task(self._watch(proc))
        rid, future = self._next_rpc("commands")
        response = None
        if await self._write({"id": rid, "type": "get_available_commands"}):
            with contextlib.suppress(asyncio.TimeoutError):
                response = await asyncio.wait_for(future, self.start_timeout)
        failure = self._check_commands(response)
        if failure is not None:
            await self._abandon(proc, failure)
            return
        self._transition(AskState.IDLE)

    def _check_commands(self, response) -> Optional[str]:
        if response is None:
            return "Ask agent did not answer get_available_commands"
        if response.get("success") is not True:
            return str(response.get("error") or "get_available_commands failed")
        data = response.get("data")
        commands = data.get("commands") if isinstance(data, dict) else None
        self.commands = [c for c in commands if isinstance(c, dict)] if isinstance(commands, list) else []
        if MARKER_COMMAND not in {c.get("name") for c in self.commands}:
            return EXTENSION_MISSING
        return None

    async def _abandon(self, proc, detail: str) -> None:
        if self._proc is proc:
            self._proc = None
        self._resolve_pending()
        await self._cancel(self._watchdog)
        await self._reap(proc, 0)
        await self._cancel(self._reader)
        self._transition(AskState.ERROR, detail)

    async def _read_loop(self, proc) -> None:
        try:
            while True:
                line = await proc.stdout.readline()
                if not line:
                    break
                if proc is self._proc:
                    self._on_line(line)
        except asyncio.CancelledError:
            raise
        except Exception as exc:
            await self._crash(proc, f"Ask reader failed: {exc}")
            return
        try:
            await self._on_exit(proc)
        except Exception as exc:
            await self._crash(proc, f"Ask reader failed: {exc}")

    def _on_line(self, raw: bytes) -> None:
        text = raw.decode("utf-8", errors="replace").strip()
        if not text:
            return
        try:
            frame = json.loads(text)
        except ValueError:
            return
        if not isinstance(frame, dict):
            return
        self._touch()
        kind = frame.get("type")
        if kind == "response":
            self._on_response(frame)
        elif kind == "agent_start":
            self._on_agent_start()
        elif kind == "command_output":
            self._on_command_output(frame)
        elif kind == "message_update":
            self._on_message_update(frame)
        elif kind in ("tool_execution_start", "tool_execution_end"):
            self._on_tool(frame, "start" if kind == "tool_execution_start" else "end")
        elif kind == "message_start":
            self._on_message_start(frame)
        elif kind == "prompt_result":
            self._on_prompt_result(frame)
        elif kind == "session_settled":
            self._on_settled()

    def _on_response(self, frame: dict) -> None:
        pending = self._pending.pop(frame.get("id"), None)
        if pending is None:
            return
        if pending.kind == "commands":
            if not pending.future.done():
                pending.future.set_result(frame)
            return
        if pending.kind == "abort":
            self._restore(pending.dropped, frame.get("data") if frame.get("success") is True else None)
            return
        if frame.get("success") is True:
            data = frame.get("data")
            if isinstance(data, dict) and data.get("agentInvoked") is False:
                self._finish_local(frame.get("id"), pending.turn)
                return
            if pending.on_accepted is not None:
                pending.on_accepted()
            return
        self._reject(pending.turn, str(frame.get("error") or "Prompt rejected"))  # [inferred] error field

    def _on_command_output(self, frame: dict) -> None:
        text = frame.get("text")
        if not isinstance(text, str):
            return
        cur = self._cur
        if cur is not None and cur.is_open and not cur.agent_started:
            cur.output.append(text)
            return
        self._turn_seq += 1
        self._event("ask_end", turn=self._turn_seq, status="completed", text=text)

    def _finish_local(self, rid, turn: Turn) -> None:
        self._sent.pop(rid, None)
        was_current = turn is self._cur
        if turn in self._queue:
            self._queue.remove(turn)
            self._event("ask_queued", turn=turn.n, text=turn.text, queued=False)
        if turn.is_open:
            text = "\n".join(turn.output)
            if text:
                turn.reply.append(text)
                self._event("ask_delta", turn=turn.n, text=text)
            self._end_turn(turn, "completed")
        if was_current:
            self._advance()

    def _on_agent_start(self) -> None:
        if self._cur is not None:
            self._cur.agent_started = True
        if self._cur is not None or self.state is not AskState.IDLE:
            return
        self._turn_seq += 1
        self._cur = Turn(self._turn_seq, "", False)
        self._touch()
        self._transition(AskState.BUSY)

    def _on_message_update(self, frame: dict) -> None:
        event = frame.get("assistantMessageEvent")
        cur = self._cur
        if not isinstance(event, dict) or event.get("type") != "text_delta":
            return
        delta = event.get("delta")
        if cur is None or not cur.is_open or not isinstance(delta, str) or not delta:
            return
        cur.reply.append(delta)
        self._event("ask_delta", turn=cur.n, text=delta)

    def _on_tool(self, frame: dict, phase: str) -> None:
        cur = self._cur
        if cur is None or not cur.is_open:
            return
        self._event("ask_tool", turn=cur.n, name=frame.get("toolName"), phase=phase)

    def _on_message_start(self, frame: dict) -> None:
        message = frame.get("message")
        cur = self._cur
        if not isinstance(message, dict) or message.get("role") != "user":
            return
        text = _message_text(message.get("content"))
        own_first_message = cur is not None and not cur.user_seen and text == cur.text
        if self._queue and text == self._queue[0].text and not own_first_message:
            if cur is not None and cur.is_open:
                self._end_turn(cur, "completed")
            self._start_queued()
        elif cur is not None:
            cur.user_seen = True

    def _start_queued(self) -> None:
        nxt = self._queue.pop(0)
        nxt.queued = False
        nxt.user_seen = True
        nxt.agent_started = True
        self._cur = nxt
        self._event("ask_queued", turn=nxt.n, text=nxt.text, queued=False)
        self._touch()
        self._transition(AskState.BUSY)

    def _advance(self) -> None:
        if self._queue:
            self._start_queued()
        else:
            self._cur = None
            self._transition(AskState.IDLE)

    def _on_prompt_result(self, frame: dict) -> None:
        turn = self._sent.pop(frame.get("id"), None)
        if turn is None:
            return
        status = frame.get("status")
        if status not in ("completed", "aborted", "error"):
            status = "completed"
        if turn.is_open:
            self._end_turn(turn, status)
        elif status != "completed" and turn.status == "completed":
            self._event(
                "ask_error",
                message=f"Ask prompt {'was aborted' if status == 'aborted' else 'failed'}",
                retry=True,
                retry_preview=_preview(turn.text),
            )

    def _on_settled(self) -> None:
        cur = self._cur
        if cur is not None and cur.is_open:
            self._end_turn(cur, "completed")
        stranded = self._queue
        self._queue = []
        for turn in stranded:
            self._event("ask_queued", turn=turn.n, text=turn.text, queued=False)
            self._event(
                "ask_error", message="Ask prompt was never delivered", retry=True, retry_preview=_preview(turn.text)
            )
        self._advance()

    def _end_turn(self, turn: Turn, status: str) -> None:
        turn.status = status
        self._event("ask_end", turn=turn.n, status=status, text=turn.partial)

    def _drop_queue(self) -> list:
        dropped = self._queue
        self._queue = []
        gone = {t.n for t in dropped}
        self._pending = {k: p for k, p in self._pending.items() if p.turn is None or p.turn.n not in gone}
        self._sent = {k: t for k, t in self._sent.items() if t.n not in gone}
        for turn in dropped:
            self._event("ask_queued", turn=turn.n, text=turn.text, queued=False)
        return dropped

    def _reject(self, turn: Turn, message: str) -> None:
        self._sent = {k: t for k, t in self._sent.items() if t is not turn}
        was_current = turn is self._cur
        ended = False
        if turn in self._queue:
            self._queue.remove(turn)
            self._event("ask_queued", turn=turn.n, text=turn.text, queued=False)
        elif was_current and turn.is_open:
            self._end_turn(turn, "error")
            ended = True
        self._event("ask_error", message=message, retry=True, retry_preview=_preview(turn.text))
        if ended:
            self._advance()

    async def _watch(self, proc) -> None:
        try:
            loop = asyncio.get_running_loop()
            while proc is self._proc:
                cur = self._cur
                if cur is None or self._fired_seq == self._frame_seq:
                    self._wake.clear()
                    await self._wake.wait()
                    continue
                remaining = self._last_frame + self._timeout - loop.time()
                if remaining > 0:
                    await asyncio.sleep(remaining)
                    continue
                self._fired_seq = self._frame_seq
                if cur.is_open:
                    cur.status = "no_response"
                    self._event("ask_end", turn=cur.n, status="no_response", text=cur.partial)
                else:
                    self._advance()
        except asyncio.CancelledError:
            raise
        except Exception as exc:
            await self._crash(proc, f"Ask watchdog failed: {exc}")

    def _fail_open_turns(self) -> Optional[Turn]:
        cur = self._cur
        failed = None
        if cur is not None and cur.is_open:
            self._end_turn(cur, "error")
            failed = cur
        self._drop_queue()
        self._cur = None
        return failed

    async def _on_exit(self, proc) -> None:
        if proc is not self._proc:
            return
        if self.state is AskState.STARTING:
            self._resolve_pending()
            return
        self._proc = None
        self._resolve_pending()
        await self._cancel(self._watchdog)
        failed = self._fail_open_turns()
        if failed is not None:
            self.interrupted = True
            self._event("ask_error", message=EXITED_MESSAGE, retry=True, retry_preview=_preview(failed.text))
        self._transition(AskState.STOPPED)
        await self._reap(proc, 0)

    async def _crash(self, proc, message: str) -> None:
        if proc is not self._proc:
            return
        if self.state is AskState.STARTING:
            self._resolve_pending()
            return
        self._proc = None
        self._resolve_pending()
        failed = self._fail_open_turns()
        self._event(
            "ask_error",
            message=message,
            retry=True,
            retry_preview=_preview(failed.text) if failed is not None else None,
        )
        self._transition(AskState.ERROR, message)
        await self._reap(proc, 0)
        await self._cancel(self._watchdog)
        await self._cancel(self._reader)

    async def send(self, text: str, *, before_send=None, on_accepted=None) -> None:
        self._last_send = (text, before_send, on_accepted)
        await self._send(text, before_send, on_accepted, retry=False)

    async def retry(self) -> None:
        if self._last_send is not None:
            await self._send(*self._last_send, retry=True)

    async def _send(self, text, before_send, on_accepted, *, retry: bool) -> None:
        if self.state not in (AskState.IDLE, AskState.BUSY):
            await self.open()
        async with self._send_lock:
            if self.state not in (AskState.IDLE, AskState.BUSY):
                self._event(
                    "ask_error",
                    message=self.detail or "Ask agent unavailable",
                    retry=True,
                    retry_preview=_preview(text),
                )
                return
            queued = self.state is AskState.BUSY
            if queued and _is_local_command(text):
                self._event("ask_error", message=BUSY_SLASH_MESSAGE, retry=False, retry_preview=None)
                return
            self._turn_seq += 1
            turn = Turn(self._turn_seq, text, queued)
            rid, _ = self._next_rpc("prompt", turn, on_accepted)
            self._sent[rid] = turn
            self._event("ask_user", id=str(uuid.uuid4()), at=_now(), turn=turn.n, text=text, queued=queued)
            frame = {"id": rid, "type": "prompt", "message": text}
            if queued:
                self._queue.append(turn)
                self._event("ask_queued", turn=turn.n, text=text, queued=True)
                frame["streamingBehavior"] = "followUp"
            else:
                self._cur = turn
                self._touch()
                self._transition(AskState.BUSY)
            if before_send is not None:
                try:
                    before_send(retry)
                except Exception as exc:
                    self._pending.pop(rid, None)
                    self._sent.pop(rid, None)
                    self._reject(turn, f"before_send failed: {exc}")
                    return
            await self._write(frame)

    async def stop(self) -> None:
        cur = self._cur
        if self._proc is None or cur is None or not cur.is_open:
            return
        # The turn closes now; the process may still emit frames until it settles [inferred].
        self._end_turn(cur, "aborted")
        dropped = self._drop_queue()
        rid, _ = self._next_rpc("abort")
        self._pending[rid].dropped = dropped
        if not await self._write({"id": rid, "type": "abort_and_restore_queue"}):
            self._pending.pop(rid, None)
            self._restore(dropped, None)

    async def _terminate(self, grace: float) -> None:
        await self.stop()
        proc = self._proc
        self._proc = None
        self._resolve_pending(restore=False)
        await self._cancel(self._watchdog)
        self._drop_queue()
        self._cur = None
        if proc is not None:
            await self._reap(proc, grace)
        await self._cancel(self._reader)
        self._transition(AskState.STOPPED)

    async def close(self) -> None:
        await self._terminate(2.0)

    async def shutdown_for_new(self) -> None:
        await self._terminate(3.0)
