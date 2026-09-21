from __future__ import annotations

import sys
import threading
import time
import types
import unittest
from pathlib import Path

DAEMON_DIR = Path(__file__).resolve().parents[1] / "daemon"
sys.path.insert(0, str(DAEMON_DIR))

from profiles import PROFILES, normalize  # noqa: E402
from voice import Voice  # noqa: E402


class FakeHermesVoice(types.ModuleType):
    def __init__(self):
        super().__init__("hermes_cli.voice")
        self.active = False
        self.starts = 0
        self.force_transcribe_calls: list[bool] = []
        self.callbacks: dict[str, object] = {}
        self.start_error: Exception | None = None
        self._continuous_stopping = False
        self._continuous_recorder = None

    def start_continuous(self, **kwargs):
        if self.start_error:
            raise self.start_error
        if self.active:
            return True
        self.active = True
        self.starts += 1
        self.callbacks = kwargs
        kwargs["on_status"]("listening")
        return True

    def stop_continuous(self, force_transcribe=False):
        self.force_transcribe_calls.append(force_transcribe)
        if not self.active:
            return
        self.active = False
        self.callbacks["on_status"]("transcribing" if force_transcribe else "idle")
        if force_transcribe:
            self.callbacks["on_status"]("idle")

    def silent_limit(self):
        self.active = False
        self.callbacks["on_silent_limit"]()
        self.callbacks["on_status"]("idle")

    def stop_phrase(self):
        self.active = False
        self.callbacks["on_stop_phrase"]("stop")
        self.callbacks["on_status"]("idle")


class VoiceTests(unittest.TestCase):
    def setUp(self):
        self.fake = FakeHermesVoice()
        package = types.ModuleType("hermes_cli")
        package.voice = self.fake
        sys.modules["hermes_cli"] = package
        sys.modules["hermes_cli.voice"] = self.fake
        self.original_warm = Voice._warm_stt
        Voice._warm_stt = staticmethod(lambda: None)
        self.listening_changes: list[bool] = []
        self.statuses: list[str] = []
        self.requests: list[str] = []
        self.voice = Voice(
            on_request=self.requests.append,
            on_status=self.statuses.append,
            on_listening=self.listening_changes.append,
        )

    def tearDown(self):
        self.voice.shutdown(timeout=1)
        Voice._warm_stt = staticmethod(self.original_warm)

    def wait_for(self, predicate, timeout=1.0):
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            if predicate():
                return
            time.sleep(0.01)
        self.fail("condition was not reached before timeout")

    def test_listen_toggle_flushes_and_reports_lifecycle(self):
        self.assertTrue(self.voice.listen())
        self.wait_for(lambda: self.fake.starts == 1)
        self.assertTrue(self.voice.listening)
        self.assertFalse(self.voice.listen())

        self.assertTrue(self.voice.stop_listening())
        self.wait_for(lambda: not self.voice.listening)

        self.assertIn(True, self.listening_changes)
        self.assertEqual(self.listening_changes[-1], False)
        self.assertIn(True, self.fake.force_transcribe_calls)

    def test_silent_limit_rearms_without_ending_explicit_session(self):
        self.assertTrue(self.voice.listen())
        self.wait_for(lambda: self.fake.starts == 1)

        self.fake.silent_limit()
        self.wait_for(lambda: self.fake.starts == 2)

        self.assertTrue(self.voice.listening)
        self.assertNotIn(False, self.listening_changes)

    def test_spoken_stop_ends_session_without_rearming(self):
        self.assertTrue(self.voice.listen())
        self.wait_for(lambda: self.fake.starts == 1)

        self.fake.stop_phrase()
        self.wait_for(lambda: not self.voice.listening)

        self.assertEqual(self.fake.starts, 1)
        self.assertEqual(self.listening_changes[-1], False)

    def test_failed_start_does_not_publish_false_listening_state(self):
        self.fake.start_error = RuntimeError("recorder unavailable")

        with self.assertLogs("companion.voice", level="ERROR"):
            self.assertFalse(self.voice.listen())
        self.wait_for(lambda: not self.voice.listening)

        self.assertNotIn(True, self.listening_changes)
        self.assertEqual(self.listening_changes[-1], False)
        self.assertIn("error", self.statuses)

    def test_approval_capture_is_rejected_while_listener_owns_recorder(self):
        self.assertTrue(self.voice.listen())
        self.wait_for(lambda: self.fake.starts == 1)

        result = self.voice.listen_for(0.1, lambda text: text)

        self.assertIsNone(result)
        self.assertEqual(self.fake.starts, 1)

    def test_listener_is_rejected_while_approval_capture_owns_recorder(self):
        result: list[object] = []
        thread = threading.Thread(
            target=lambda: result.append(self.voice.listen_for(0.1, lambda text: text))
        )
        thread.start()
        self.wait_for(lambda: self.voice.capturing)

        self.assertFalse(self.voice.listen())
        thread.join(timeout=1)
        self.assertFalse(thread.is_alive())
        self.assertEqual(result, [""])


class ProfileTests(unittest.TestCase):
    def test_expected_profiles_and_safe_default(self):
        self.assertEqual(list(PROFILES), ["Coding", "Meeting", "Quiet"])
        self.assertEqual(normalize("Meeting"), "Meeting")
        self.assertEqual(normalize("unknown"), "Coding")
        self.assertTrue(PROFILES["Coding"].eyes)
        self.assertFalse(PROFILES["Meeting"].speech)
        self.assertFalse(PROFILES["Quiet"].eyes)


if __name__ == "__main__":
    unittest.main()
