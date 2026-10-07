import importlib.machinery
import importlib.util
from pathlib import Path
import subprocess
import sys
import tempfile
import time
import unittest
from unittest.mock import Mock, patch

ROOT = Path(__file__).resolve().parents[1]
loader = importlib.machinery.SourceFileLoader("helper", str(ROOT / "bin/voxtype-meeting-tray"))
spec = importlib.util.spec_from_loader(loader.name, loader)
helper = importlib.util.module_from_spec(spec)
loader.exec_module(helper)

class HelperTests(unittest.TestCase):
    def test_normalizes_service_session(self):
        result = helper.normalize_session({"id":"a", "title":"Demo", "started_at":"2026-08-29T10:00:00Z", "duration_secs":12, "ui_status":"complete"})
        self.assertEqual(result["title"], "Demo")
        self.assertEqual(result["durationSecs"], 12)
        self.assertEqual(result["status"], "complete")
        self.assertEqual(result["exportedPath"], "")

    def test_safe_name(self):
        self.assertEqual(helper.safe_name("Weekly / Planning?", "2026-08-29T12:30:00Z"), "2026-08-29_14-30_weekly-planning.md")

    def test_start_renames_session(self):
        replies = iter([{"ok":True,"session_id":"abc"}, {"ok":True}])
        with patch.object(helper, "request", side_effect=lambda _: next(replies)) as call:
            result = helper.action("start", "Design review")
        self.assertTrue(result["ok"])
        self.assertEqual(call.call_args_list[1].args[0]["title"], "Design review")

    def test_start_sends_language(self):
        payloads = []
        replies = iter([{"ok":True,"session_id":"abc"}, {"ok":True}])
        def fake(payload):
            payloads.append(payload)
            return next(replies)
        with patch.object(helper, "request", side_effect=fake):
            result = helper.action("start", "Design review", "fr")
        self.assertTrue(result["ok"])
        self.assertEqual(payloads[0]["op"], "start_recording")
        self.assertEqual(payloads[0]["language"], "fr")

    def test_pause_uses_service_operation(self):
        with patch.object(helper, "request", return_value={"ok":True}) as call:
            result = helper.action("pause", "")
        self.assertEqual(call.call_args.args[0]["op"], "pause_recording")
        self.assertEqual(result["message"], "Meeting paused")

    def test_settings_are_capture_only(self):
        with patch.object(helper, "request", return_value={"ok":True}) as call:
            result = helper.save_options('{"source":"mic","retainAudio":true,"micDevice":"default","loopbackDevice":"default"}')
        audio = call.call_args.args[0]["config"]["audio"]
        self.assertEqual(audio["source"], "mic")
        self.assertTrue(audio["retain_audio"])
        self.assertTrue(result["ok"])

    def test_device_options_include_default_and_preserve_configured(self):
        items = [{"id":"alsa_input.usb", "description":"USB Microphone"}]
        options = helper.device_options(items, "missing-device")
        self.assertEqual(options[0], {"value":"default", "label":"System default"})
        self.assertIn({"value":"alsa_input.usb", "label":"USB Microphone"}, options)
        self.assertIn({"value":"missing-device", "label":"missing-device"}, options)

    def test_whisper_languages_match_voxtype_tui(self):
        expected = ["auto", "en", "fr", "de", "it", "es", "pt", "nl", "pl", "zh", "ja", "ko", "ru", "ar"]
        for model in ("base.en", "small", "large-v3"):
            values = [item["value"] for item in helper.available_languages("whisper", model)]
            self.assertEqual(values, expected)
        self.assertEqual(helper.available_languages("whisper", "base.en")[0]["label"], "AUTO")
        self.assertEqual(helper.available_languages("whisper", "base.en")[1]["label"], "EN")

    def test_sensevoice_languages_include_auto(self):
        values = [item["value"] for item in helper.available_languages("sensevoice", "sensevoice-small")]
        self.assertEqual(values, ["auto", "zh", "en", "ja", "ko", "yue"])

    def test_normalize_language_code_from_array(self):
        self.assertEqual(helper.normalize_language_code(["en", "fr"]), "en")
        self.assertEqual(helper.normalize_language_code("FR"), "fr")
        self.assertEqual(helper.normalize_language_code("en,fr,de"), "en")

    def test_apply_language_override_replaces_whisper_assignment(self):
        source = 'engine = "whisper"\n[whisper]\nmodel = "small"\n# Language for transcription\nlanguage = "en"\n'
        updated = helper.apply_language_override(source, "whisper", "fr")
        self.assertIn('language = "fr"', updated)
        self.assertNotIn('language = "en"', updated)
        self.assertIn("# Language for transcription", updated)

    def test_set_voxtype_language_writes_config(self):
        with tempfile.TemporaryDirectory() as tmp:
            cfg = Path(tmp) / "config.toml"
            cfg.write_text('engine = "whisper"\n[whisper]\nmodel = "small"\nlanguage = "en"\n', encoding="utf-8")
            with patch.object(helper, "voxtype_config_path", return_value=cfg):
                with patch.object(helper, "restart_voxtype_daemon", return_value={"ok": True}) as restart:
                    result = helper.set_voxtype_language("fr")
            restart.assert_called_once()
            self.assertTrue(result["ok"])
            self.assertEqual(result["language"], "fr")
            self.assertIn('language = "fr"', cfg.read_text(encoding="utf-8"))
            self.assertNotIn('language = "en"', cfg.read_text(encoding="utf-8"))

    def test_set_voxtype_language_refuses_symlink_config(self):
        with tempfile.TemporaryDirectory() as tmp:
            real = Path(tmp) / "real.toml"
            real.write_text('engine = "whisper"\n[whisper]\nmodel = "small"\nlanguage = "en"\n', encoding="utf-8")
            link = Path(tmp) / "config.toml"
            link.symlink_to(real)
            with patch.object(helper, "voxtype_config_path", return_value=link):
                result = helper.set_voxtype_language("fr")
            self.assertFalse(result["ok"])
            self.assertIn("Could not read Voxtype configuration", result["error"])
            self.assertIn('language = "en"', real.read_text(encoding="utf-8"))

    def test_set_voxtype_language_rejects_english_only_model(self):
        with tempfile.TemporaryDirectory() as tmp:
            cfg = Path(tmp) / "config.toml"
            cfg.write_text('engine = "whisper"\n[whisper]\nmodel = "base.en"\nlanguage = "en"\n', encoding="utf-8")
            with patch.object(helper, "voxtype_config_path", return_value=cfg):
                result = helper.set_voxtype_language("fr")
            self.assertFalse(result["ok"])
            self.assertIn("English-only", result["error"])
            self.assertIn('language = "en"', cfg.read_text(encoding="utf-8"))

    def test_exported_path_round_trip(self):
        with tempfile.TemporaryDirectory() as tmp:
            session_dir = Path(tmp)
            exported = session_dir / "notes.md"
            exported.write_text("hello", encoding="utf-8")
            helper.write_exported_path(str(session_dir), exported)
            result = helper.normalize_session({"id": "a", "title": "Demo", "session_dir": str(session_dir)})
            self.assertEqual(result["exportedPath"], str(exported))

    def test_exported_path_missing_file_is_empty(self):
        with tempfile.TemporaryDirectory() as tmp:
            session_dir = Path(tmp)
            helper.write_exported_path(str(session_dir), session_dir / "gone.md")
            result = helper.normalize_session({"id": "a", "title": "Demo", "session_dir": str(session_dir)})
            self.assertEqual(result["exportedPath"], "")

    def test_open_meeting_reuses_export_without_copy(self):
        with tempfile.TemporaryDirectory() as tmp:
            session_dir = Path(tmp)
            exported = session_dir / "meeting.md"
            exported.write_text("notes", encoding="utf-8")
            helper.write_exported_path(str(session_dir), exported)
            session = {"id": "abc", "session_dir": str(session_dir), "transcript_md": str(session_dir / "transcript.md")}
            with patch.object(helper, "request", return_value={"ok": True, "sessions": [session]}):
                with patch.object(helper, "open_path", return_value=None) as opener:
                    result = helper.open_meeting("abc")
            self.assertTrue(result["ok"])
            self.assertEqual(result["path"], str(exported))
            opener.assert_called_once_with(exported)

    def test_open_path_uses_omarchy_editor(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "notes.md"
            path.write_text("hello", encoding="utf-8")
            with patch.object(helper.shutil, "which", side_effect=lambda name: "/usr/bin/omarchy-launch-editor" if name == "omarchy-launch-editor" else None):
                with patch.object(helper.subprocess, "Popen") as popen:
                    result = helper.open_path(path)
            self.assertIsNone(result)
            popen.assert_called_once()
            self.assertEqual(popen.call_args.args[0], ["/usr/bin/omarchy-launch-editor", str(path)])
            self.assertTrue(popen.call_args.kwargs.get("start_new_session"))

    def test_open_export_folder_uses_nautilus(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp) / "Meetings"

            def which(name):
                if name == "uwsm-app":
                    return "/usr/bin/uwsm-app"
                if name == "nautilus":
                    return "/usr/bin/nautilus"
                return None

            with patch.object(helper.shutil, "which", side_effect=which):
                with patch.object(helper.subprocess, "Popen") as popen:
                    result = helper.open_export_folder(str(folder))
            self.assertTrue(result["ok"])
            self.assertTrue(folder.is_dir())
            self.assertEqual(result["path"], str(folder))
            popen.assert_called_once()
            self.assertEqual(
                popen.call_args.args[0],
                ["/usr/bin/uwsm-app", "--", "/usr/bin/nautilus", "--new-window", str(folder)],
            )

    def test_open_export_folder_falls_back_to_xdg_open(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp) / "Meetings"

            def which(name):
                return "/usr/bin/xdg-open" if name == "xdg-open" else None

            with patch.object(helper.shutil, "which", side_effect=which):
                with patch.object(helper.subprocess, "Popen") as popen:
                    result = helper.open_export_folder(str(folder))
            self.assertTrue(result["ok"])
            self.assertEqual(popen.call_args.args[0], ["/usr/bin/xdg-open", str(folder)])

    def test_request_rejects_oversized_payload(self):
        result = helper.request({"op": "x" * (helper.CONTROL_MAX_LINE_BYTES + 1)})
        self.assertFalse(result["ok"])
        self.assertIn("protocol maximum", result["error"])

    def test_request_rejects_oversized_response_while_streaming(self):
        class FakeSocket:
            def __init__(self):
                self.timeouts = []
                self._chunks = [b"x" * 4096] * 20

            def settimeout(self, value):
                self.timeouts.append(value)

            def connect(self, _path):
                return None

            def sendall(self, _data):
                return None

            def recv(self, size):
                if not self._chunks:
                    return b""
                return self._chunks.pop(0)[:size]

            def __enter__(self):
                return self

            def __exit__(self, *_args):
                return False

        fake_path = Mock()
        fake_path.exists.return_value = True
        sock = FakeSocket()
        with patch.object(helper, "runtime_socket", return_value=fake_path):
            with patch.object(helper.socket, "socket", return_value=sock):
                result = helper.request({"op": "status"})
        self.assertFalse(result["ok"])
        self.assertIn("protocol maximum", result["error"])
        self.assertTrue(sock.timeouts)
        self.assertLessEqual(max(sock.timeouts), helper.CONTROL_IDLE_TIMEOUT_SECS)

    def test_run_capped_captures_small_output(self):
        result = helper.run_capped(
            [sys.executable, "-c", "import sys; sys.stdout.write('ready'); sys.stderr.write('warn')"],
            timeout=2,
            max_bytes=4096,
        )
        self.assertEqual(result.returncode, 0)
        self.assertEqual(result.stdout, "ready")
        self.assertEqual(result.stderr, "warn")

    def test_run_capped_rejects_overflow_while_streaming(self):
        start = time.monotonic()
        with self.assertRaises(helper.SubprocessLimitError) as raised:
            helper.run_capped(
                [sys.executable, "-c", "import sys, time; sys.stdout.buffer.write(b'x' * (512 * 1024)); sys.stdout.flush(); time.sleep(10)"],
                timeout=5,
                max_bytes=8192,
            )
        self.assertEqual(raised.exception.kind, "overflow")
        self.assertLess(time.monotonic() - start, 4)

    def test_run_capped_timeout_kills_process_group(self):
        script = (
            "import subprocess, time\n"
            "subprocess.Popen(['sleep', '30'])\n"
            "time.sleep(30)\n"
        )
        start = time.monotonic()
        with self.assertRaises(subprocess.TimeoutExpired):
            helper.run_capped(
                [sys.executable, "-c", script],
                timeout=0.4,
                max_bytes=4096,
            )
        self.assertLess(time.monotonic() - start, 4)

    def test_language_write_does_not_leave_predictable_tmp(self):
        with tempfile.TemporaryDirectory() as tmp:
            cfg = Path(tmp) / "config.toml"
            cfg.write_text('engine = "whisper"\n[whisper]\nmodel = "small"\nlanguage = "en"\n', encoding="utf-8")
            with patch.object(helper, "voxtype_config_path", return_value=cfg):
                with patch.object(helper, "restart_voxtype_daemon", return_value={"ok": True}):
                    result = helper.set_voxtype_language("fr")
            self.assertTrue(result["ok"])
            self.assertFalse((Path(tmp) / "config.toml.tmp").exists())
            leftovers = list(Path(tmp).glob(".config.toml.*.tmp"))
            self.assertEqual(leftovers, [])

    def test_read_private_file_refuses_symlink(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            real = root / "real.toml"
            real.write_text("engine = 'whisper'\n", encoding="utf-8")
            link = root / "config.toml"
            link.symlink_to(real)
            with self.assertRaises(OSError):
                helper.read_private_file(link, max_bytes=4096)

    def test_copy_private_file_refuses_symlink_source(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            real = root / "real.md"
            real.write_text("secret", encoding="utf-8")
            link = root / "transcript.md"
            link.symlink_to(real)
            dest = root / "out.md"
            with self.assertRaises(OSError):
                helper.copy_private_file(link, dest, max_bytes=4096)
            self.assertFalse(dest.exists())
            self.assertEqual(real.read_text(encoding="utf-8"), "secret")

    def test_copy_private_file_skips_existing_destination(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            source = root / "transcript.md"
            source.write_text("notes", encoding="utf-8")
            dest = root / "meeting.md"
            dest.write_text("old", encoding="utf-8")
            written = helper.copy_private_file(source, dest, max_bytes=4096)
            self.assertEqual(written.name, "meeting-2.md")
            self.assertEqual(dest.read_text(encoding="utf-8"), "old")
            self.assertEqual(written.read_text(encoding="utf-8"), "notes")

    def _session(self, sid, status="complete", transcript_exists=True,
                 ended_at="2026-09-01T12:00:00Z", session_dir=""):
        return {"id": sid, "title": "Meeting " + sid,
                "started_at": "2026-08-30T10:00:00Z", "ended_at": ended_at,
                "ui_status": status, "transcript_md": str(Path(session_dir or "/tmp") / "transcript.md"),
                "transcript_exists": transcript_exists, "session_dir": session_dir}

    def test_pending_export_sessions_filters(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            exported_dir = root / "exported"
            exported_dir.mkdir()
            exported = exported_dir / "one.md"
            exported.write_text("done", encoding="utf-8")
            helper.write_exported_path(str(exported_dir), exported)
            sessions = [
                self._session("a", status="transcribing", session_dir=str(root / "a")),
                self._session("b", transcript_exists=False, session_dir=str(root / "b")),
                self._session("c", session_dir=str(exported_dir)),
                self._session("d", session_dir=str(root / "d")),
            ]
            eligible = helper.pending_export_sessions(sessions, "")
            self.assertEqual([item["id"] for item in eligible], ["d"])
            self.assertEqual(eligible[0]["status"], "complete")
            self.assertTrue(eligible[0]["transcriptExists"])
            self.assertEqual(eligible[0]["exportedPath"], "")

    def test_pending_export_sessions_respects_since(self):
        sessions = [
            self._session("old", ended_at="2026-08-01T10:00:00Z"),
            self._session("new", ended_at="2026-09-05T10:00:00Z"),
            self._session("missing", ended_at=""),
            self._session("bad", ended_at="not-a-date"),
        ]
        eligible = helper.pending_export_sessions(sessions, "2026-09-01T00:00:00Z")
        self.assertEqual([item["id"] for item in eligible], ["new"])
        eligible = helper.pending_export_sessions(sessions, "")
        self.assertEqual(sorted(item["id"] for item in eligible), ["bad", "missing", "new", "old"])

    def test_export_pending_end_to_end(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            session_dir = root / "sessions" / "abc"
            session_dir.mkdir(parents=True)
            transcript = session_dir / "transcript.md"
            transcript.write_text("# Notes\n", encoding="utf-8")
            target = root / "out"
            session = self._session("abc", ended_at="2026-09-01T11:00:00Z", session_dir=str(session_dir))
            session["title"] = "Design Review"
            session["transcript_md"] = str(transcript)
            with patch.object(helper, "request", return_value={"ok": True, "sessions": [session]}):
                result = helper.export_pending(str(target), "2020-01-01T00:00:00Z")
            self.assertTrue(result["ok"])
            self.assertEqual(result["message"], "1 transcript(s) auto-exported")
            self.assertEqual(result["failed"], [])
            self.assertEqual(len(result["exported"]), 1)
            self.assertEqual(result["exported"][0]["meetingId"], "abc")
            written = Path(result["exported"][0]["path"])
            self.assertEqual(written.parent, target)
            self.assertTrue(written.is_file())
            self.assertEqual(written.read_text(encoding="utf-8"), "# Notes\n")
            self.assertEqual(helper.normalize_session(session)["exportedPath"], str(written))
            with patch.object(helper, "request", return_value={"ok": True, "sessions": [session]}):
                again = helper.export_pending(str(target), "2020-01-01T00:00:00Z")
            self.assertTrue(again["ok"])
            self.assertEqual(again["message"], "Nothing to auto-export")
            self.assertEqual(again["exported"], [])
            self.assertEqual(again["failed"], [])

    def test_export_pending_partial_failure(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            good_dir = root / "good"
            good_dir.mkdir()
            bad_dir = root / "bad"
            bad_dir.mkdir()
            transcript = good_dir / "transcript.md"
            transcript.write_text("notes", encoding="utf-8")
            target = root / "out"
            sessions = [
                self._session("good", ended_at="2026-09-01T11:00:00Z", session_dir=str(good_dir)),
                self._session("bad", ended_at="2026-09-02T11:00:00Z", session_dir=str(bad_dir)),
            ]
            sessions[0]["transcript_md"] = str(transcript)
            sessions[1]["transcript_md"] = str(bad_dir / "missing.md")
            with patch.object(helper, "request", return_value={"ok": True, "sessions": sessions}):
                result = helper.export_pending(str(target), "2020-01-01T00:00:00Z")
            self.assertTrue(result["ok"])
            self.assertEqual(len(result["exported"]), 1)
            self.assertEqual(result["exported"][0]["meetingId"], "good")
            self.assertEqual(len(result["failed"]), 1)
            self.assertEqual(result["failed"][0]["meetingId"], "bad")
            self.assertIn("still being prepared", result["failed"][0]["error"])

    def test_export_pending_passes_through_service_failure(self):
        with patch.object(helper, "request", return_value={"ok": False, "error": "Service not running."}):
            result = helper.export_pending("/tmp/out", "2020-01-01T00:00:00Z")
        self.assertFalse(result["ok"])
        self.assertEqual(result["error"], "Service not running.")

    def test_auto_export_since_seeds_and_stays_stable(self):
        with tempfile.TemporaryDirectory() as tmp:
            anchor = Path(tmp) / "auto-export-since"
            with patch.object(helper, "AUTO_EXPORT_SINCE", anchor):
                first, error = helper._auto_export_since()
            self.assertIsNone(error)
            self.assertIsNotNone(helper._parse_rfc3339(first))
            self.assertTrue(anchor.is_file())
            with patch.object(helper, "AUTO_EXPORT_SINCE", anchor):
                second, error = helper._auto_export_since()
            self.assertIsNone(error)
            self.assertEqual(first, second)

    def test_auto_export_since_write_failure_is_an_error(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            root.chmod(0o500)
            anchor = root / "auto-export-since"
            try:
                with patch.object(helper, "AUTO_EXPORT_SINCE", anchor):
                    value, error = helper._auto_export_since()
                self.assertEqual(value, "")
                self.assertIn("Could not save the auto-export cutoff", error)
                self.assertFalse(anchor.exists())
            finally:
                root.chmod(0o700)

    def test_auto_export_since_invalid_value_is_an_error(self):
        with tempfile.TemporaryDirectory() as tmp:
            anchor = Path(tmp) / "auto-export-since"
            anchor.write_text("not-a-date\n", encoding="utf-8")
            with patch.object(helper, "AUTO_EXPORT_SINCE", anchor):
                value, error = helper._auto_export_since()
            self.assertEqual(value, "")
            self.assertIn("invalid", error)
            self.assertEqual(anchor.read_text(encoding="utf-8"), "not-a-date\n")

    def test_auto_export_since_empty_value_is_not_first_use(self):
        for content in ("", "   \n", "\n"):
            with tempfile.TemporaryDirectory() as tmp:
                anchor = Path(tmp) / "auto-export-since"
                anchor.write_text(content, encoding="utf-8")
                with patch.object(helper, "AUTO_EXPORT_SINCE", anchor):
                    value, error = helper._auto_export_since()
                self.assertEqual(value, "")
                self.assertIn("invalid", error)
                self.assertEqual(anchor.read_text(encoding="utf-8"), content)

    def test_export_pending_no_since_uses_anchor_file(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            session_dir = root / "sessions" / "abc"
            session_dir.mkdir(parents=True)
            transcript = session_dir / "transcript.md"
            transcript.write_text("# Notes\n", encoding="utf-8")
            target = root / "out"
            session = self._session("abc", ended_at="2026-09-01T11:00:00Z", session_dir=str(session_dir))
            session["title"] = "Design Review"
            session["transcript_md"] = str(transcript)
            anchor = root / "config" / "auto-export-since"
            with patch.object(helper, "AUTO_EXPORT_SINCE", anchor):
                with patch.object(helper, "request", return_value={"ok": True, "sessions": [session]}):
                    result = helper.export_pending(str(target), "")
                self.assertTrue(result["ok"])
                self.assertEqual(result["message"], "Nothing to auto-export")
                self.assertEqual(result["exported"], [])
                self.assertTrue(anchor.is_file())

    def test_export_pending_all_failed_reports_each_error(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            target = root / "out"
            sessions = [
                self._session("one", ended_at="2026-09-01T11:00:00Z", session_dir=str(root / "one")),
                self._session("two", ended_at="2026-09-02T11:00:00Z", session_dir=str(root / "two")),
            ]
            sessions[0]["transcript_md"] = str(root / "one" / "missing.md")
            sessions[1]["transcript_md"] = str(root / "two" / "missing.md")
            with patch.object(helper, "request", return_value={"ok": True, "sessions": sessions}):
                result = helper.export_pending(str(target), "2020-01-01T00:00:00Z")
            self.assertTrue(result["ok"])
            self.assertEqual(result["exported"], [])
            self.assertEqual(len(result["failed"]), 2)
            self.assertEqual(result["failed"][0]["meetingId"], "one")
            self.assertEqual(result["failed"][1]["meetingId"], "two")
            self.assertIn("still being prepared", result["failed"][0]["error"])
            self.assertEqual(result["message"], "2 export(s) failed")
            self.assertFalse(target.exists())

if __name__ == "__main__": unittest.main()
