"""Runs the real omp with the real ask-context.ts. Skipped unless MEETING_ASSISTANT_LIVE_OMP=1 and ~/.local/bin/omp exists.

Scenario: A is running a long reply, B and C are queued as follow-ups, and the helper-side cards file
is written the way the helper writes it before each send. The session .jsonl is the evidence.
"""

import json
import os
import queue
import shutil
import subprocess
import tempfile
import threading
import time
import unittest

PLUGIN_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OMP = os.path.expanduser("~/.local/bin/omp")
MODEL = "openrouter/deepseek/deepseek-v4-flash-0731"
LONG_PROMPT = "Write the numbers 1 to 40, one per line, each followed by a short fruit name. Nothing else."
SETTLE_TIMEOUT_S = 240

ENABLED = os.environ.get("MEETING_ASSISTANT_LIVE_OMP") == "1" and os.path.exists(OMP)


def entry(entry_id, text, marker):
    card = json.dumps({"question": f"question {marker}", "answer": f"answer {marker}", "sources": []})
    return {"id": entry_id, "text": text, "header": "Cards since your last message:", "cards": [card]}


@unittest.skipUnless(ENABLED, "set MEETING_ASSISTANT_LIVE_OMP=1 with ~/.local/bin/omp present to run against real omp")
class LiveCardsQueueTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp(prefix="ma-live-")
        self.addCleanup(shutil.rmtree, self.tmp, True)
        self.cards_file = os.path.join(self.tmp, "cards-pending.json")
        self.session_dir = os.path.join(self.tmp, "chat")
        self.cwd = os.path.join(self.tmp, "cwd")
        os.makedirs(self.cwd)
        os.makedirs(self.session_dir)
        self.frames = queue.Queue()
        env = dict(os.environ, MEETING_ASSISTANT_CARDS_FILE=self.cards_file)
        self.proc = subprocess.Popen(
            [OMP, "--mode", "rpc", "--cwd", self.cwd, "--session-dir", self.session_dir, "--continue",
             "--model", MODEL, "--thinking", "low",
             "--config", os.path.join(PLUGIN_DIR, "ask-overlay.yml"),
             "-e", os.path.join(PLUGIN_DIR, "ask-context.ts")],
            stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, env=env, text=True)
        self.addCleanup(self.shutdown)
        threading.Thread(target=self.pump, daemon=True).start()

    def pump(self):
        for line in self.proc.stdout:
            try:
                self.frames.put(json.loads(line))
            except ValueError:
                continue
        self.frames.put(None)

    def shutdown(self):
        if self.proc.poll() is None:
            self.proc.kill()
        self.proc.wait()
        self.proc.stdin.close()
        self.proc.stdout.close()

    def send(self, frame):
        self.proc.stdin.write(json.dumps(frame) + "\n")
        self.proc.stdin.flush()

    def wait_frame(self, match, what, timeout=SETTLE_TIMEOUT_S):
        deadline = time.monotonic() + timeout
        while True:
            try:
                frame = self.frames.get(timeout=max(0.1, deadline - time.monotonic()))
            except queue.Empty:
                frame = False
            if frame is None:
                self.fail(f"omp exited while waiting for {what}")
            if frame is not False and match(frame):
                return frame
            if time.monotonic() > deadline:
                self.fail(f"timed out waiting for {what}")

    def write_entries(self, entries):
        tmp = self.cards_file + ".tmp"
        with open(tmp, "w") as f:
            json.dump({"entries": entries}, f)
        os.replace(tmp, self.cards_file)

    def session_sequence(self):
        paths = [os.path.join(root, n) for root, _, names in os.walk(self.session_dir) for n in names
                 if n.endswith(".jsonl")]
        self.assertEqual(len(paths), 1, paths)
        sequence = []
        with open(paths[0]) as f:
            for line in f:
                try:
                    item = json.loads(line)
                except ValueError:
                    continue
                if item.get("type") == "custom_message" and item.get("customType") == "meeting-assistant-cards":
                    sequence.append(("cards", item["content"]))
                    continue
                message = item.get("message")
                if isinstance(message, dict) and message.get("role") == "user":
                    content = message.get("content")
                    text = content if isinstance(content, str) else "".join(
                        p.get("text", "") for p in content if isinstance(p, dict))
                    sequence.append(("user", text))
        return sequence

    def run_scenario(self, write_for_b, write_for_c):
        self.send({"id": "A", "type": "prompt", "message": LONG_PROMPT})
        self.wait_frame(lambda f: f.get("type") == "message_update", "A streaming")
        write_for_b()
        self.send({"id": "B", "type": "prompt", "message": "Reply with only the word two.",
                   "streamingBehavior": "followUp"})
        self.wait_frame(lambda f: f.get("type") == "response" and f.get("id") == "B", "B accepted")
        write_for_c()
        self.send({"id": "C", "type": "prompt", "message": "Reply with only the word three.",
                   "streamingBehavior": "followUp"})
        self.wait_frame(lambda f: f.get("type") == "response" and f.get("id") == "C", "C accepted")
        self.wait_frame(lambda f: f.get("type") == "session_settled", "session_settled")
        return self.session_sequence()

    def assert_users_unchanged(self, sequence):
        users = [text for kind, text in sequence if kind == "user"]
        self.assertEqual(users, [LONG_PROMPT, "Reply with only the word two.", "Reply with only the word three."])

    def test_c_without_cards_does_not_cost_b_its_cards(self):
        b = entry("id-b", "Reply with only the word two.", "BBB")
        sequence = self.run_scenario(lambda: self.write_entries([b]), lambda: None)
        cards = [text for kind, text in sequence if kind == "cards"]
        self.assertEqual(len(cards), 1)
        self.assertIn("answer BBB", cards[0])
        self.assert_users_unchanged(sequence)

    def test_c_with_newer_cards_keeps_each_entry_for_its_own_message(self):
        b = entry("id-b", "Reply with only the word two.", "BBB")
        c = entry("id-c", "Reply with only the word three.", "CCC")
        sequence = self.run_scenario(lambda: self.write_entries([b]), lambda: self.write_entries([b, c]))
        cards = [text for kind, text in sequence if kind == "cards"]
        self.assertEqual(len(cards), 2)
        self.assertIn("answer BBB", cards[0])
        self.assertNotIn("answer CCC", cards[0])
        self.assertIn("answer CCC", cards[1])
        self.assertNotIn("answer BBB", cards[1])
        self.assert_users_unchanged(sequence)


if __name__ == "__main__":
    unittest.main()
