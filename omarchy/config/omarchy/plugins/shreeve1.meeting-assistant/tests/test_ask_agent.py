import asyncio
import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
PLUGIN_DIR = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(PLUGIN_DIR, "bin"))

import ask_agent  # noqa: E402
from ask_agent import AskAgent, AskState  # noqa: E402

FAKE = os.path.join(HERE, "ask_fake_omp.py")
WAIT = 3.0
ANCHOR_IGNORED = (
    "queue_update",
    "ready",
    "extension_ui_request",
    "advisor_cost_changed",
    "available_commands_update",
    "response",
)


class AskAgentCase(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.dir = tempfile.mkdtemp(prefix="ask-agent-test-")
        self.addCleanup(shutil.rmtree, self.dir, True)
        self.events = []

    def make(self, scenario=None, timeout=30.0):
        path = os.path.join(self.dir, "scenario.json")
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(scenario or {}, fh)
        agent = AskAgent(
            emit=self.events.append,
            argv=[sys.executable, FAKE, path],
            env=dict(os.environ),
            cwd=self.dir,
            timeout=timeout,
        )
        self.addAsyncCleanup(agent.close)
        return agent

    def of(self, type_):
        return [e for e in self.events if e["type"] == type_]

    def received(self):
        path = os.path.join(self.dir, "received.jsonl")
        if not os.path.exists(path):
            return []
        with open(path, encoding="utf-8") as fh:
            return [json.loads(line) for line in fh if line.strip()]

    def prompts(self):
        return [m for m in self.received() if m.get("type") == "prompt"]

    def aborts(self):
        return [m for m in self.received() if m.get("type") == "abort_and_restore_queue"]

    def fake_pid(self):
        with open(os.path.join(self.dir, "pid"), encoding="utf-8") as fh:
            return int(fh.read())

    async def until(self, predicate, what=""):
        loop = asyncio.get_running_loop()
        deadline = loop.time() + WAIT
        while not predicate():
            if loop.time() > deadline:
                self.fail(f"timed out waiting for {what or predicate}; events={self.events}")
            await asyncio.sleep(0.01)

    async def until_end(self, turn, count=1):
        await self.until(
            lambda: len([e for e in self.of("ask_end") if e["turn"] == turn]) >= count,
            f"ask_end turn {turn}",
        )

    async def until_state(self, state):
        await self.until(lambda: self.agent_state(state), f"state {state}")

    def agent_state(self, state):
        return self.current.state is state

    async def started(self, scenario=None, timeout=30.0):
        self.current = self.make(scenario, timeout)
        await self.current.open()
        return self.current


class StreamTests(AskAgentCase):
    async def test_deltas_concatenate_to_end_text_and_tools_keep_fixture_order(self):
        agent = await self.started({"deltas": ["do", "n", "e"]})
        self.assertIs(agent.state, AskState.IDLE)
        await agent.send("hi")
        await self.until_end(1)
        await self.until_state(AskState.IDLE)
        deltas = [e["text"] for e in self.of("ask_delta")]
        self.assertEqual(deltas, ["do", "n", "e"])
        end = self.of("ask_end")[0]
        self.assertEqual(end["text"], "done")
        self.assertEqual(end["status"], "completed")
        self.assertEqual(end["turn"], 1)
        tools = [(e["name"], e["phase"]) for e in self.of("ask_tool")]
        self.assertEqual(tools, [("read", "start"), ("read", "end")])
        order = [
            e["type"] for e in self.events if e["type"] in ("ask_tool", "ask_delta", "ask_end")
        ]
        self.assertEqual(
            order, ["ask_tool", "ask_tool", "ask_delta", "ask_delta", "ask_delta", "ask_end"]
        )
        users = self.of("ask_user")
        self.assertEqual([(u["turn"], u["text"], u["queued"]) for u in users], [(1, "hi", False)])
        self.assertTrue(users[0]["id"] and users[0]["at"].endswith("Z"))

    async def test_status_events_only_on_change(self):
        agent = await self.started()
        await agent.open()
        await agent.send("hi")
        await self.until_end(1)
        await self.until_state(AskState.IDLE)
        states = [(e["state"], e["turn"]) for e in self.of("ask_status")]
        self.assertEqual(states, [("starting", None), ("idle", None), ("busy", 1), ("idle", None)])

    async def test_commands_are_stored(self):
        agent = await self.started()
        self.assertIn("meeting-assistant-ask-context", [c["name"] for c in agent.commands])

    async def test_invalid_json_line_is_tolerated(self):
        agent = await self.started({"deltas": ["ok"], "invalid_line_at": 3})
        await agent.send("hi")
        await self.until_end(1)
        self.assertEqual(self.of("ask_end")[0]["text"], "ok")
        self.assertEqual(self.of("ask_end")[0]["status"], "completed")
        self.assertEqual(self.of("ask_error"), [])

    async def test_text_is_written_byte_for_byte(self):
        agent = await self.started({"thin": True})
        text = "/skill:x  keep\ttabs\nand \u00e9\u4e2d trailing  "
        await agent.send(text)
        await self.until_end(1)
        self.assertEqual(self.prompts()[0]["message"], text)
        self.assertEqual(self.prompts()[0]["type"], "prompt")
        self.assertEqual(self.of("ask_user")[0]["text"], text)
        await agent.send("/skill:x")
        await self.until_end(2)
        self.assertEqual(self.prompts()[1]["message"], "/skill:x")


def collapsed_frames(frames):
    sequence = []
    for frame in frames:
        kind = frame.get("type")
        if kind in ANCHOR_IGNORED:
            continue
        if kind in ("message_start", "message_end"):
            key = (kind, frame["message"]["role"])
        elif kind == "message_update":
            key = (kind, frame["assistantMessageEvent"]["type"])
        else:
            key = (kind, None)
        if key[1] == "text_delta" and sequence and sequence[-1] == key:
            continue
        sequence.append(key)
    return sequence


class FakeAnchorTests(unittest.TestCase):
    def test_busy_send_frames_match_recorded_omp_sequence(self):
        tmp = tempfile.mkdtemp(prefix="ask-fake-anchor-")
        self.addCleanup(shutil.rmtree, tmp, True)
        scenario = os.path.join(tmp, "scenario.json")
        with open(scenario, "w", encoding="utf-8") as fh:
            json.dump(
                {
                    "no_tools": True,
                    "delta_delay": 0.03,
                    "replies": {"A": ["a"] * 12, "B": ["b"], "C": ["c"]},
                },
                fh,
            )
        proc = subprocess.Popen(
            [sys.executable, FAKE, scenario],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            text=True,
        )
        self.addCleanup(proc.wait)
        self.addCleanup(proc.kill)
        frames = []

        def read_until(predicate):
            while True:
                line = proc.stdout.readline()
                self.assertTrue(line, f"fake exited early; frames={frames}")
                frame = json.loads(line)
                frames.append(frame)
                if predicate(frame):
                    return

        def send(prompt_id, text, follow_up):
            message = {"id": prompt_id, "type": "prompt", "message": text}
            if follow_up:
                message["streamingBehavior"] = "followUp"
            proc.stdin.write(json.dumps(message) + "\n")
            proc.stdin.flush()

        send("A", "A", False)
        read_until(
            lambda f: (
                f.get("type") == "message_update"
                and f["assistantMessageEvent"]["type"] == "text_delta"
            )
        )
        send("B", "B", True)
        send("C", "C", True)
        read_until(lambda f: f.get("type") == "session_settled")
        proc.stdin.close()
        proc.stdout.close()
        with open(os.path.join(HERE, "fixtures", "ask_busy_send.jsonl"), encoding="utf-8") as fh:
            recorded = [json.loads(line) for line in fh if line.strip()]
        self.assertEqual(collapsed_frames(frames), collapsed_frames(recorded))
        self.assertEqual(
            [
                (f["id"], f["success"])
                for f in frames
                if f.get("type") == "response" and f.get("command") == "prompt"
            ],
            [("A", True), ("B", True), ("C", True)],
        )
        self.assertEqual(
            [f["id"] for f in frames if f.get("type") == "prompt_result"], ["B", "C", "A"]
        )


class LocalAnchorTests(unittest.TestCase):
    def test_local_builtin_frames_match_recorded_omp_sequence(self):
        tmp = tempfile.mkdtemp(prefix="ask-fake-anchor-")
        self.addCleanup(shutil.rmtree, tmp, True)
        scenario = os.path.join(tmp, "scenario.json")
        with open(scenario, "w", encoding="utf-8") as fh:
            json.dump({}, fh)
        proc = subprocess.Popen(
            [sys.executable, FAKE, scenario],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            text=True,
        )
        self.addCleanup(proc.wait)
        self.addCleanup(proc.kill)
        proc.stdin.write(json.dumps({"id": "L0", "type": "prompt", "message": "/dirs"}) + "\n")
        proc.stdin.flush()
        frames = []
        while True:
            line = proc.stdout.readline()
            self.assertTrue(line, f"fake exited early; frames={frames}")
            frame = json.loads(line)
            frames.append(frame)
            if frame.get("type") == "response" and frame.get("id") == "L0":
                break
        proc.stdin.close()
        proc.stdout.close()
        with open(
            os.path.join(HERE, "fixtures", "ask_local_builtins.jsonl"), encoding="utf-8"
        ) as fh:
            recorded = [json.loads(line) for line in fh if line.strip()]
        end = next(
            i for i, f in enumerate(recorded) if f.get("type") == "response" and f.get("id") == "L0"
        )
        self.assertEqual(collapsed_frames(frames), collapsed_frames(recorded[: end + 1]))
        self.assertEqual(collapsed_frames(frames), [("command_output", None)])
        self.assertEqual(frames[-1]["data"], recorded[end]["data"])
        self.assertEqual(frames[-1]["success"], recorded[end]["success"])


def without_thinking(sequence):
    return [key for key in sequence if not (key[1] or "").startswith("thinking_")]


class AbortAnchorTests(unittest.TestCase):
    def test_abort_run_frames_match_recorded_omp_sequence(self):
        tmp = tempfile.mkdtemp(prefix="ask-fake-anchor-")
        self.addCleanup(shutil.rmtree, tmp, True)
        scenario = os.path.join(tmp, "scenario.json")
        with open(scenario, "w", encoding="utf-8") as fh:
            json.dump({"no_tools": True, "replies": {"A": ["a", "b"]}, "hang_after": 4}, fh)
        proc = subprocess.Popen(
            [sys.executable, FAKE, scenario],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            text=True,
        )
        self.addCleanup(proc.wait)
        self.addCleanup(proc.kill)
        frames = []

        def read_until(predicate):
            while True:
                line = proc.stdout.readline()
                self.assertTrue(line, f"fake exited early; frames={frames}")
                frame = json.loads(line)
                frames.append(frame)
                if predicate(frame):
                    return

        def write(message):
            proc.stdin.write(json.dumps(message) + "\n")
            proc.stdin.flush()

        def prompt(prompt_id, follow_up):
            message = {"id": prompt_id, "type": "prompt", "message": prompt_id}
            if follow_up:
                message["streamingBehavior"] = "followUp"
            write(message)

        prompt("A", False)
        read_until(
            lambda f: (
                f.get("type") == "message_update"
                and f["assistantMessageEvent"]["type"] == "text_delta"
            )
        )
        prompt("B", True)
        prompt("C", True)
        write({"id": "X", "type": "abort_and_restore_queue"})
        read_until(lambda f: f.get("type") == "session_settled")
        prompt("D", False)
        read_until(lambda f: f.get("type") == "session_settled")
        proc.stdin.close()
        proc.stdout.close()
        with open(
            os.path.join(HERE, "fixtures", "ask_abort_restore.jsonl"), encoding="utf-8"
        ) as fh:
            recorded = [json.loads(line) for line in fh if line.strip()]
        self.assertEqual(
            without_thinking(collapsed_frames(frames)), without_thinking(collapsed_frames(recorded))
        )
        for run in (frames, recorded):
            [response] = [f for f in run if f.get("command") == "abort_and_restore_queue"]
            self.assertEqual((response["id"], response["success"]), ("X", True))
            self.assertEqual(response["data"]["steering"], [])
            queued = [
                f["followUp"] for f in run if f.get("type") == "queue_update" and f["followUp"]
            ][-1]
            self.assertEqual([item["text"] for item in response["data"]["followUp"]], queued)
            kinds = [f.get("type") for f in run]
            self.assertLess(kinds.index("agent_end"), run.index(response))
            self.assertLess(run.index(response), kinds.index("prompt_result"))
            self.assertEqual(
                [f["id"] for f in run if f.get("type") == "prompt_result"], ["B", "C", "A", "D"]
            )


class StopTests(AskAgentCase):
    async def test_no_delta_after_stop_and_turn_ends_aborted(self):
        agent = await self.started(
            {"thin": True, "deltas": ["a", "b"], "hang_after": 4, "leak_after_abort": True}
        )
        await agent.send("hi")
        await self.until(lambda: len(self.of("ask_delta")) == 1, "first delta")
        await agent.stop()
        await self.until_state(AskState.IDLE)
        await asyncio.sleep(0.2)
        self.assertEqual([e["text"] for e in self.of("ask_delta")], ["a"])
        ends = self.of("ask_end")
        self.assertEqual([(e["turn"], e["status"], e["text"]) for e in ends], [(1, "aborted", "a")])
        [abort] = self.aborts()
        self.assertRegex(abort["id"], r"^ask-\d+$")

    async def test_stop_without_turn_is_noop(self):
        agent = await self.started()
        await agent.stop()
        self.assertEqual(self.aborts(), [])
        self.assertEqual(self.of("ask_end"), [])


BUSY_REPLIES = {
    "A": ["a1 ", "a2 ", "a3 ", "a4 ", "a5 ", "a6 ", "a7 ", "a8"],
    "B": ["bee"],
    "C": ["sea"],
}
BUSY_SCENARIO = {"no_tools": True, "delta_delay": 0.04, "replies": BUSY_REPLIES}
A_TEXT = "a1 a2 a3 a4 a5 a6 a7 a8"


class BusySendTests(AskAgentCase):
    async def send_three(self, scenario=None, first="A"):
        agent = await self.started(scenario or BUSY_SCENARIO)
        await agent.send(first)
        await self.until(lambda: len(self.of("ask_delta")) >= 1, "first delta")
        await agent.send("B")
        await agent.send("C")
        await self.until_state(AskState.IDLE)
        return agent

    def index_of(self, predicate):
        for index, event in enumerate(self.events):
            if predicate(event):
                return index
        self.fail(f"no matching event; events={self.events}")

    async def test_each_turn_ends_once_with_only_its_own_text(self):
        await self.send_three()
        ends = [(e["turn"], e["status"], e["text"]) for e in self.of("ask_end")]
        self.assertEqual(
            ends, [(1, "completed", A_TEXT), (2, "completed", "bee"), (3, "completed", "sea")]
        )
        deltas = {}
        for event in self.of("ask_delta"):
            deltas.setdefault(event["turn"], []).append(event["text"])
        self.assertEqual(deltas, {1: BUSY_REPLIES["A"], 2: ["bee"], 3: ["sea"]})
        self.assertEqual(self.of("ask_error"), [])

    async def test_user_message_content_as_plain_string_is_matched(self):
        await self.send_three({**BUSY_SCENARIO, "string_content": True})
        ends = [(e["turn"], e["text"]) for e in self.of("ask_end")]
        self.assertEqual(ends, [(1, A_TEXT), (2, "bee"), (3, "sea")])

    async def test_queued_false_lands_between_previous_end_and_own_first_delta(self):
        await self.send_three()
        for turn, previous in ((2, 1), (3, 2)):
            released = self.index_of(
                lambda e: e["type"] == "ask_queued" and e["turn"] == turn and e["queued"] is False
            )
            previous_end = self.index_of(lambda e: e["type"] == "ask_end" and e["turn"] == previous)
            first_delta = self.index_of(lambda e: e["type"] == "ask_delta" and e["turn"] == turn)
            self.assertLess(previous_end, released)
            self.assertLess(released, first_delta)
        queued = [(q["turn"], q["queued"]) for q in self.of("ask_queued")]
        self.assertEqual(queued, [(2, True), (3, True), (2, False), (3, False)])

    async def test_status_goes_idle_once_after_the_last_end(self):
        await self.send_three()
        statuses = self.of("ask_status")
        self.assertEqual(
            [(e["state"], e["turn"]) for e in statuses],
            [
                ("starting", None),
                ("idle", None),
                ("busy", 1),
                ("busy", 2),
                ("busy", 3),
                ("idle", None),
            ],
        )
        idle = self.index_of(lambda e: e is statuses[-1])
        last_end = self.index_of(lambda e: e["type"] == "ask_end" and e["turn"] == 3)
        self.assertLess(last_end, idle)

    async def test_slash_prompt_without_user_message_still_splits_at_queued_text(self):
        await self.send_three(
            {**BUSY_SCENARIO, "replies": {**BUSY_REPLIES, "/skill:x": BUSY_REPLIES["A"]}},
            first="/skill:x",
        )
        ends = [(e["turn"], e["text"]) for e in self.of("ask_end")]
        self.assertEqual(ends, [(1, A_TEXT), (2, "bee"), (3, "sea")])

    async def test_duplicate_text_is_not_split_at_the_first_prompts_own_message(self):
        agent = await self.started(
            {
                "no_tools": True,
                "delta_delay": 0.04,
                "replies": {"same": ["x1 ", "x2 ", "x3 ", "x4"]},
            }
        )
        await agent.send("same")
        await self.until(lambda: len(self.of("ask_delta")) >= 1, "first delta")
        await agent.send("same")
        await self.until_state(AskState.IDLE)
        self.assertEqual(
            [(e["turn"], e["text"]) for e in self.of("ask_end")],
            [(1, "x1 x2 x3 x4"), (2, "x1 x2 x3 x4")],
        )

    async def test_error_result_for_boundary_ended_turn_emits_one_ask_error(self):
        await self.send_three({**BUSY_SCENARIO, "result_status": {"B": "error"}})
        self.assertEqual(
            self.of("ask_error"),
            [
                {
                    "type": "ask_error",
                    "message": "Ask prompt failed",
                    "retry": True,
                    "retry_preview": "B ...",
                }
            ],
        )
        self.assertEqual(
            [(e["turn"], e["status"]) for e in self.of("ask_end")],
            [(1, "completed"), (2, "completed"), (3, "completed")],
        )

    async def test_aborted_result_for_boundary_ended_turn_emits_one_ask_error(self):
        await self.send_three({**BUSY_SCENARIO, "result_status": {"A": "aborted"}})
        errors = self.of("ask_error")
        self.assertEqual(
            [(e["message"], e["retry_preview"]) for e in errors],
            [("Ask prompt was aborted", "A ...")],
        )

    async def test_error_result_for_open_turn_ends_it_with_that_status(self):
        agent = await self.started(
            {"thin": True, "deltas": ["p"], "result_status": {"solo": "error"}}
        )
        await agent.send("solo")
        await self.until_state(AskState.IDLE)
        self.assertEqual(
            [(e["turn"], e["status"], e["text"]) for e in self.of("ask_end")], [(1, "error", "p")]
        )
        self.assertEqual(self.of("ask_error"), [])

    async def test_stop_mid_stream_drops_queue_and_ends_aborted(self):
        agent = await self.started(BUSY_SCENARIO)
        await agent.send("A")
        await self.until(lambda: len(self.of("ask_delta")) >= 1, "first delta")
        await agent.send("B")
        await agent.stop()
        await self.until_state(AskState.IDLE)
        await asyncio.sleep(0.3)
        self.assertEqual([(e["turn"], e["status"]) for e in self.of("ask_end")], [(1, "aborted")])
        self.assertEqual(
            [(q["turn"], q["queued"]) for q in self.of("ask_queued")], [(2, True), (2, False)]
        )
        self.assertEqual({e["turn"] for e in self.of("ask_delta")}, {1})
        self.assertEqual(self.of("ask_error"), [])


RESTORE_SCENARIO = {"no_tools": True, "replies": {"A": ["a1 ", "a2"]}, "hang_after": 4}


class RestoreTests(AskAgentCase):
    async def stopped_with_queue(self, scenario=None, queued=("B", "C")):
        agent = await self.started(scenario or RESTORE_SCENARIO)
        await agent.send("A")
        await self.until(lambda: len(self.of("ask_delta")) == 1, "first delta")
        for text in queued:
            await agent.send(text)
        await agent.stop()
        return agent

    def restored(self, *pairs):
        return [{"type": "ask_restored", "messages": [{"turn": n, "text": t} for n, t in pairs]}]

    async def test_stop_returns_the_queued_messages_once_in_order(self):
        agent = await self.stopped_with_queue()
        await self.until_state(AskState.IDLE)
        await asyncio.sleep(0.3)
        self.assertEqual(self.of("ask_restored"), self.restored((2, "B"), (3, "C")))
        self.assertEqual([(e["turn"], e["status"]) for e in self.of("ask_end")], [(1, "aborted")])
        self.assertEqual({e["turn"] for e in self.of("ask_delta")}, {1})
        self.assertEqual(self.of("ask_error"), [])
        self.assertEqual([p["message"] for p in self.prompts()], ["A", "B", "C"])
        [abort] = self.aborts()
        self.assertRegex(abort["id"], r"^ask-\d+$")
        await agent.send("D")
        await self.until_end(4)
        self.assertEqual(
            [(e["turn"], e["status"]) for e in self.of("ask_end")],
            [(1, "aborted"), (4, "completed")],
        )
        self.assertEqual([p["message"] for p in self.prompts()], ["A", "B", "C", "D"])
        self.assertEqual(len(self.of("ask_restored")), 1)

    async def test_duplicate_texts_match_turns_first_unmatched_first(self):
        await self.stopped_with_queue(queued=("same", "same"))
        await self.until(lambda: self.of("ask_restored"), "ask_restored")
        self.assertEqual(self.of("ask_restored"), self.restored((2, "same"), (3, "same")))

    async def test_rejected_command_restores_from_the_local_queue(self):
        await self.stopped_with_queue({**RESTORE_SCENARIO, "restore_reject": True})
        await self.until_state(AskState.IDLE)
        await asyncio.sleep(0.3)
        self.assertEqual(self.of("ask_restored"), self.restored((2, "B"), (3, "C")))
        self.assertEqual([(e["turn"], e["status"]) for e in self.of("ask_end")], [(1, "aborted")])

    async def test_stop_with_nothing_queued_emits_no_restore(self):
        await self.stopped_with_queue(queued=())
        await self.until_state(AskState.IDLE)
        await asyncio.sleep(0.3)
        self.assertEqual(self.of("ask_restored"), [])
        self.assertEqual(len(self.aborts()), 1)

    async def test_rejected_command_with_nothing_queued_emits_no_restore(self):
        await self.stopped_with_queue({**RESTORE_SCENARIO, "restore_reject": True}, queued=())
        await self.until_state(AskState.IDLE)
        await asyncio.sleep(0.3)
        self.assertEqual(self.of("ask_restored"), [])

    async def test_process_dying_before_the_reply_restores_from_local_state(self):
        agent = await self.stopped_with_queue({**RESTORE_SCENARIO, "exit_on_abort": True})
        await self.until_state(AskState.STOPPED)
        await asyncio.sleep(0.3)
        self.assertEqual(self.of("ask_restored"), self.restored((2, "B"), (3, "C")))
        self.assertEqual([(e["turn"], e["status"]) for e in self.of("ask_end")], [(1, "aborted")])
        self.assertEqual(self.of("ask_error"), [])


class QueueTests(AskAgentCase):
    async def test_second_send_while_busy_is_follow_up(self):
        agent = await self.started(
            {"thin": True, "deltas": ["x"], "hang_after": 3, "hang_release": "followup"}
        )
        await agent.send("one")
        await self.until(lambda: len(self.of("ask_tool")) == 2, "tool frames")
        await agent.send("two")
        await self.until_end(2)
        first, second = self.prompts()
        self.assertEqual(first["message"], "one")
        self.assertNotIn("streamingBehavior", first)
        self.assertEqual(second["message"], "two")
        self.assertEqual(second["streamingBehavior"], "followUp")
        users = [(u["turn"], u["text"], u["queued"]) for u in self.of("ask_user")]
        self.assertEqual(users, [(1, "one", False), (2, "two", True)])
        queued = [(q["turn"], q["text"], q["queued"]) for q in self.of("ask_queued")]
        self.assertEqual(queued, [(2, "two", True), (2, "two", False)])
        ends = [(e["turn"], e["status"], e["text"]) for e in self.of("ask_end")]
        self.assertEqual(ends, [(1, "completed", "x"), (2, "completed", "x")])
        await self.until_state(AskState.IDLE)


class TimeoutTests(AskAgentCase):
    async def test_fires_once_when_silent_and_stays_busy(self):
        agent = await self.started({"thin": True, "deltas": ["p"], "hang_after": 4}, timeout=0.4)
        await agent.send("hi")
        await self.until_end(1)
        end = self.of("ask_end")[0]
        self.assertEqual((end["status"], end["text"]), ("no_response", "p"))
        await asyncio.sleep(1.0)
        self.assertEqual(len(self.of("ask_end")), 1)
        self.assertIs(agent.state, AskState.BUSY)
        os.kill(self.fake_pid(), 0)

    async def test_does_not_fire_while_frames_keep_arriving(self):
        agent = await self.started(
            {"thin": True, "deltas": ["a", "b"], "frame_delay": 0.2}, timeout=0.4
        )
        await agent.send("hi")
        await self.until_end(1)
        ends = self.of("ask_end")
        self.assertEqual([(e["status"], e["text"]) for e in ends], [("completed", "ab")])

    async def test_clock_restarts_after_late_frame(self):
        agent = await self.started({"thin": True, "deltas": ["a"], "hang_after": 4}, timeout=0.4)
        await agent.send("hi")
        await self.until_end(1)
        self.assertEqual(self.of("ask_end")[0]["status"], "no_response")
        await agent.stop()
        await self.until_state(AskState.IDLE)
        self.assertEqual([e["status"] for e in self.of("ask_end")], ["no_response", "aborted"])


class ProcessTests(AskAgentCase):
    async def test_exit_mid_turn_reports_error_and_next_send_relaunches(self):
        agent = await self.started(
            {"thin": True, "deltas": ["z"], "first_launch": {"exit_after": 3}}
        )
        await agent.send("hello")
        await self.until_state(AskState.STOPPED)
        ends = self.of("ask_end")
        self.assertEqual([(e["turn"], e["status"]) for e in ends], [(1, "error")])
        errors = self.of("ask_error")
        self.assertEqual(
            errors,
            [
                {
                    "type": "ask_error",
                    "message": "Ask agent exited",
                    "retry": True,
                    "retry_preview": "hello ...",
                }
            ],
        )
        self.assertTrue(agent.interrupted)
        types = [
            e["type"] for e in self.events if e["type"] in ("ask_end", "ask_error", "ask_status")
        ]
        self.assertEqual(types[-3:], ["ask_end", "ask_error", "ask_status"])
        self.assertEqual(self.of("ask_status")[-1]["state"], "stopped")
        await agent.send("again")
        await self.until_end(2)
        self.assertEqual(self.of("ask_end")[-1]["status"], "completed")
        self.assertEqual(self.of("ask_end")[-1]["text"], "z")
        with open(os.path.join(self.dir, "launches"), encoding="utf-8") as fh:
            self.assertEqual(fh.read(), "2")

    async def test_missing_marker_command_is_error(self):
        agent = self.make({"drop_marker": True})
        await agent.open()
        self.assertIs(agent.state, AskState.ERROR)
        self.assertEqual(agent.detail, "ask-context extension did not load")
        status = self.of("ask_status")[-1]
        self.assertEqual(
            (status["state"], status["detail"]), ("error", "ask-context extension did not load")
        )
        with self.assertRaises(ProcessLookupError):
            os.kill(self.fake_pid(), 0)

    async def test_close_leaves_no_orphan(self):
        agent = await self.started()
        pid = self.fake_pid()
        os.kill(pid, 0)
        await agent.close()
        self.assertIs(agent.state, AskState.STOPPED)
        with self.assertRaises(ProcessLookupError):
            os.kill(pid, 0)

    async def test_close_aborts_running_turn_and_kills_hung_process(self):
        agent = await self.started({"thin": True, "hang_after": 2})
        await agent.send("hi")
        await self.until(lambda: self.of("ask_status")[-1]["state"] == "busy", "busy")
        pid = self.fake_pid()
        await agent.close()
        self.assertEqual([e["status"] for e in self.of("ask_end")], ["aborted"])
        with self.assertRaises(ProcessLookupError):
            os.kill(pid, 0)

    async def test_shutdown_for_new_returns_when_process_is_gone(self):
        agent = await self.started()
        pid = self.fake_pid()
        await agent.shutdown_for_new()
        self.assertIs(agent.state, AskState.STOPPED)
        with self.assertRaises(ProcessLookupError):
            os.kill(pid, 0)

    async def test_open_is_idempotent(self):
        agent = await self.started()
        await agent.open()
        with open(os.path.join(self.dir, "launches"), encoding="utf-8") as fh:
            self.assertEqual(fh.read(), "1")

    async def test_send_opens_when_stopped(self):
        agent = self.make({"thin": True})
        self.assertIs(agent.state, AskState.STOPPED)
        await agent.send("hi")
        await self.until_end(1)
        self.assertEqual(self.of("ask_end")[0]["status"], "completed")


class CallbackTests(AskAgentCase):
    async def test_before_send_precedes_prompt_and_on_accepted_follows_success(self):
        agent = await self.started({"thin": True})
        seen = []

        def before(retry):
            seen.append(("before", retry, len(self.prompts())))

        def accepted():
            seen.append(("accepted", len(self.prompts()), len(self.of("ask_end"))))

        await agent.send("hi", before_send=before, on_accepted=accepted)
        await self.until_end(1)
        self.assertEqual(seen, [("before", False, 0), ("accepted", 1, 0)])

    async def test_failed_prompt_reports_error_and_skips_on_accepted(self):
        agent = await self.started({"prompt_fail": True})
        accepted = []
        await agent.send("hello there", on_accepted=lambda: accepted.append(1))
        await self.until_end(1)
        self.assertEqual(self.of("ask_end")[0]["status"], "error")
        errors = self.of("ask_error")
        self.assertEqual(len(errors), 1)
        self.assertTrue(errors[0]["retry"])
        self.assertEqual(errors[0]["retry_preview"], "hello there ...")
        self.assertEqual(accepted, [])
        await self.until_state(AskState.IDLE)

    async def test_retry_resends_same_text_with_fresh_turn_and_retry_flag(self):
        agent = await self.started({"thin": True})
        flags = []
        await agent.send("again please", before_send=flags.append)
        await self.until_end(1)
        await agent.retry()
        await self.until_end(2)
        self.assertEqual([p["message"] for p in self.prompts()], ["again please", "again please"])
        self.assertEqual(flags, [False, True])
        self.assertEqual([u["turn"] for u in self.of("ask_user")], [1, 2])


class LocalBuiltinTests(AskAgentCase):
    def local_events(self, start):
        return [
            (e["type"], e.get("text"), e.get("status") or e.get("state"))
            for e in self.events[start:]
            if e["type"] in ("ask_user", "ask_status", "ask_delta", "ask_end", "ask_error")
        ]

    async def test_local_command_alone_streams_output_and_goes_idle_once(self):
        agent = await self.started({"local_output": {"/dirs": "workspace: one"}})
        start = len(self.events)
        await agent.send("/dirs")
        await self.until_end(1)
        await self.until_state(AskState.IDLE)
        self.assertEqual(
            self.local_events(start),
            [
                ("ask_user", "/dirs", None),
                ("ask_status", None, "busy"),
                ("ask_delta", "workspace: one", None),
                ("ask_end", "workspace: one", "completed"),
                ("ask_status", None, "idle"),
            ],
        )
        self.assertEqual(self.of("ask_error"), [])

    async def test_ordinary_prompt_after_local_command_runs_without_stop(self):
        agent = await self.started({"thin": True, "deltas": ["fine"]})
        await agent.send("/dirs")
        await self.until_end(1)
        await self.until_state(AskState.IDLE)
        await agent.send("hello")
        await self.until_end(2)
        await self.until_state(AskState.IDLE)
        ends = [(e["turn"], e["status"], e["text"]) for e in self.of("ask_end")]
        self.assertEqual(ends, [(1, "completed", "output of /dirs"), (2, "completed", "fine")])
        self.assertNotIn("streamingBehavior", self.prompts()[1])
        self.assertEqual(self.aborts(), [])

    async def test_prompt_sent_before_local_response_is_advanced_to(self):
        agent = await self.started({"thin": True, "deltas": ["fine"]})
        await agent.send("/dirs")
        await agent.send("hello")
        await self.until_end(2)
        await self.until_state(AskState.IDLE)
        ends = [(e["turn"], e["status"], e["text"]) for e in self.of("ask_end")]
        self.assertEqual(ends, [(1, "completed", "output of /dirs"), (2, "completed", "fine")])
        self.assertEqual([e["state"] for e in self.of("ask_status")][-1], "idle")

    async def test_five_local_commands_in_a_row_each_complete(self):
        commands = ["/dirs", "/context", "/tools", "/jobs", "/changelog last 1"]
        agent = await self.started(
            {"local_output": {"/changelog last 1": ["line one", "line two"]}}
        )
        for number, command in enumerate(commands, 1):
            await agent.send(command)
            await self.until_end(number)
            await self.until_state(AskState.IDLE)
        ends = [(e["turn"], e["status"], e["text"]) for e in self.of("ask_end")]
        self.assertEqual(
            ends,
            [
                (1, "completed", "output of /dirs"),
                (2, "completed", "output of /context"),
                (3, "completed", "output of /tools"),
                (4, "completed", "output of /jobs"),
                (5, "completed", "line one\nline two"),
            ],
        )
        for turn, _, text in ends:
            self.assertEqual(
                "".join(e["text"] for e in self.of("ask_delta") if e["turn"] == turn), text
            )
        idles = [e for e in self.of("ask_status") if e["state"] == "idle"]
        self.assertEqual(len(idles), 1 + len(commands))

    async def test_later_prompt_result_for_a_local_prompt_is_ignored(self):
        agent = await self.started()
        await agent.send("/dirs")
        await self.until_end(1)
        await self.until_state(AskState.IDLE)
        prompt_id = self.prompts()[0]["id"]
        late = {
            "type": "prompt_result",
            "id": prompt_id,
            "agentInvoked": False,
            "status": "completed",
        }
        agent._on_line((json.dumps(late) + "\n").encode())
        agent._on_line(b'{"type":"session_settled"}\n')
        self.assertEqual(len(self.of("ask_end")), 1)
        self.assertIs(agent.state, AskState.IDLE)

    async def test_command_output_with_no_send_in_flight_is_one_standalone_end(self):
        agent = await self.started()
        start = len(self.events)
        agent._on_line(b'{"type":"command_output","text":"unsolicited"}\n')
        self.assertEqual(
            [(e["type"], e["turn"], e["status"], e["text"]) for e in self.events[start:]],
            [("ask_end", 1, "completed", "unsolicited")],
        )
        self.assertIs(agent.state, AskState.IDLE)
        await agent.send("/dirs")
        await self.until_end(2)
        self.assertEqual([e["turn"] for e in self.of("ask_end")], [1, 2])

    async def test_local_command_while_busy_is_refused_and_not_sent(self):
        agent = await self.started(BUSY_SCENARIO)
        await agent.send("A")
        await self.until(lambda: len(self.of("ask_delta")) >= 1, "first delta")
        await agent.send("/dirs")
        self.assertEqual(
            self.of("ask_error"),
            [
                {
                    "type": "ask_error",
                    "message": "Wait for the current reply before running a slash command",
                    "retry": False,
                    "retry_preview": None,
                }
            ],
        )
        await self.until_state(AskState.IDLE)
        self.assertEqual([p["message"] for p in self.prompts()], ["A"])
        self.assertEqual([e["turn"] for e in self.of("ask_user")], [1])
        self.assertEqual([(e["turn"], e["text"]) for e in self.of("ask_end")], [(1, A_TEXT)])


class ModuleTests(unittest.TestCase):
    def test_states(self):
        self.assertEqual(
            [s.value for s in AskState], ["stopped", "starting", "idle", "busy", "error"]
        )

    def test_turn_shape(self):
        turn = ask_agent.Turn(1, "t")
        self.assertEqual(
            (turn.n, turn.text, turn.queued, turn.status, turn.reply), (1, "t", False, None, [])
        )


if __name__ == "__main__":
    unittest.main()
