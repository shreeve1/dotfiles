"""Hermes port of the Pi session-log extension."""
from __future__ import annotations

import atexit
import hashlib
import os
import re
import threading
from datetime import datetime
from pathlib import Path
from typing import Any

_LOCK = threading.Lock()
_SESSIONS: dict[str, tuple[Path, int, str, str, str]] = {}
_TITLE_THREADS: list[threading.Thread] = []


def _join_title_threads() -> None:
    # Best effort on normal interpreter exit. One-shot `hermes -z` hard-exits via
    # os._exit and skips atexit, so those logs keep the session-id filename.
    for thread in list(_TITLE_THREADS):
        try:
            thread.join(6.0)
        except Exception:
            pass


atexit.register(_join_title_threads)


def _root(cwd: str) -> Path:
    original = Path(cwd or os.getcwd()).expanduser().resolve()
    cur = original
    while True:
        if (cur / ".git").exists():
            return cur
        if cur.parent == cur:
            return original
        cur = cur.parent


def _text(value: Any) -> str:
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, list):
        parts = []
        for block in value:
            if isinstance(block, dict) and block.get("type") == "text" and isinstance(block.get("text"), str):
                parts.append(block["text"])
        return "\n".join(parts).strip()
    return ""


def _slug(value: str) -> str:
    return re.sub(r"-+$", "", re.sub(r"^-+|-+$", "", re.sub(r"[^a-z0-9]+", "-", value.lower())))[:40].rstrip("-")


def _make_slug(prompt: str, answer: str) -> str | None:
    try:
        from agent.auxiliary_client import call_llm
        response = call_llm(
            task="title_generation",
            messages=[
                {"role": "system", "content": "Respond with only a concise 3 to 6 word lowercase title. No punctuation or explanation."},
                {"role": "user", "content": f"PROMPT:\n{prompt[:600]}\n\nRESPONSE:\n{answer[:600]}"},
            ],
            max_tokens=32,
            timeout=15,
            reasoning_config={"enabled": False},
        )
        text = getattr(response.choices[0].message, "content", "") or ""
        title = _text(text)
        return _slug(title) or None
    except Exception:
        return None


def _rename_after_title(path: Path, date: str, hash6: str, prompt: str, answer: str) -> None:
    slug = _make_slug(prompt, answer)
    if not slug:
        return
    target = path.with_name(f"{date}_{slug}-{hash6}.md")
    with _LOCK:
        try:
            if path.exists() and not target.exists():
                path.rename(target)
                for sid, item in list(_SESSIONS.items()):
                    if item[0] == path:
                        _SESSIONS[sid] = (target, item[1], item[2], item[3], item[4])
        except Exception:
            pass


def _record(**kwargs: Any) -> None:
    try:
        session_id = str(kwargs.get("session_id") or "")
        platform = str(kwargs.get("platform") or "").lower()
        if not session_id or platform not in {"cli", "tui"}:
            return
        prompt = _text(kwargs.get("user_message"))
        answer = _text(kwargs.get("assistant_response"))
        if not answer:
            return
        cwd = os.environ.get("TERMINAL_CWD") or os.getcwd()
        root = _root(cwd)
        directory = root / ".sessions"
        now = datetime.now().astimezone()
        iso = now.isoformat(timespec="seconds")
        date = now.date().isoformat()
        hash6 = hashlib.sha1(session_id.encode()).hexdigest()[:6]
        with _LOCK:
            item = _SESSIONS.get(session_id)
            if item:
                path, number, old_date, old_prompt, old_answer = item
                number += 1
            else:
                path = None
                for candidate in directory.iterdir() if directory.exists() else []:
                    if candidate.is_file() and (candidate.name.endswith(f"-{hash6}.md") or candidate.name.endswith(f"_{session_id}.md")):
                        path = candidate
                        break
                number = 1
                if path is None:
                    path = directory / f"{date}_{session_id}.md"
                if path.exists():
                    number = sum(1 for line in path.read_text(encoding="utf-8").splitlines() if line.startswith("## Turn ")) + 1
            directory.mkdir(parents=True, exist_ok=True)
            content = ""
            if number == 1 and not path.exists():
                content += f"# Session {session_id}\n\n- cwd: {cwd}\n- started: {iso}\n- harness: hermes\n"
            content += f"\n## Turn {number} — {iso}\n\n**Prompt:**\n\n{prompt}\n\n**Response:**\n\n{answer}\n\n---\n"
            with path.open("a", encoding="utf-8") as handle:
                handle.write(content)
            _SESSIONS[session_id] = (path, number, date, prompt, answer)
            first = number == 1
        if first:
            thread = threading.Thread(target=_rename_after_title, args=(path, date, hash6, prompt, answer), daemon=True)
            _TITLE_THREADS.append(thread)
            thread.start()
    except Exception:
        pass


def _post_llm_call(**kwargs: Any) -> None:
    # Delegated children run with platform="subagent" (tools/delegate_tool.py) and
    # cron/gateway use their own platform names, so the cli/tui filter in _record
    # is what keeps logging to interactive parent sessions.
    _record(**kwargs)


def register(ctx) -> None:
    ctx.register_hook("post_llm_call", _post_llm_call)
