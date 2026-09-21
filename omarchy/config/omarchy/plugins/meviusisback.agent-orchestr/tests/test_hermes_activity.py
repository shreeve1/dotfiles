#!/usr/bin/env python3
"""Regression checks for Hermes profile scoping and Herdr activity status."""

import importlib.util
import json
import os
import sqlite3
import tempfile
import unittest
from unittest import mock

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("agent_ctl_under_test", os.path.join(ROOT, "agent_ctl.py"))
assert spec and spec.loader
ac = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ac)


class TestHermesActivity(unittest.TestCase):
    def test_process_home_reads_real_nul_delimiters(self):
        handle = mock.mock_open(read_data=b"HOME=/tmp" + b"\0" + b"HERMES_HOME=/tmp/hermes" + b"\0")
        with mock.patch("builtins.open", handle):
            self.assertEqual(ac.get_process_hermes_home(123), "/tmp/hermes")

    def test_profile_db_is_selected_for_concurrent_process(self):
        with mock.patch.object(ac.os.path, "exists", return_value=True):
            rows = ac.get_all_hermes_dbs("/tmp/hermes", "fable")
        self.assertEqual(rows, [("/tmp/hermes/profiles/fable/state.db", "fable")])

    def test_missing_requested_profile_does_not_fallback_to_other_databases(self):
        with mock.patch.object(ac.os.path, "exists", side_effect=lambda path: path.endswith("/state.db") and "missing" not in path):
            self.assertEqual(ac.get_all_hermes_dbs("/tmp/hermes", "missing"), [])

    def test_desktop_child_server_is_labeled_desktop_not_herdr(self):
        processes = {
            200: {"pid": 200, "ppid": 1, "cmd": "/opt/Hermes --disable-setuid-sandbox", "argv": ["/opt/Hermes"], "cwd": "/tmp", "state": "S"},
            201: {"pid": 201, "ppid": 200, "cmd": "python -m hermes_cli.main --profile fable serve --host 127.0.0.1", "argv": ["python", "-m", "hermes_cli.main", "--profile", "fable", "serve", "--host", "127.0.0.1"], "cwd": "/tmp", "state": "S"},
        }
        with mock.patch.object(ac.glob, "glob", return_value=["/proc/201"]), \
             mock.patch.object(ac, "get_process_info", return_value=processes[201]), \
             mock.patch.object(ac, "get_process_ancestors", return_value=[processes[200]]), \
             mock.patch.object(ac, "get_process_hermes_home", return_value="/tmp/hermes"), \
             mock.patch.object(ac, "get_process_start_time", return_value=0), \
             mock.patch.object(ac, "extract_hermes_session_info", return_value=(None, None, None, None, "Ready", "idle", False)):
            rows = ac.scan_standalone_agents([], set(), set())
        self.assertEqual(rows[0]["origin"], "desktop")
        self.assertEqual(rows[0]["origin_label"], "Hermes Desktop")
        self.assertEqual(rows[0]["agent_display"], "Hermes Desktop")
        self.assertEqual(rows[0]["tab"], "Hermes Desktop (PID 201)")

    def test_unknown_origin_is_not_herdr_summary_category(self):
        model = os.path.join(ROOT, "Model.js")
        with open(model, encoding="utf-8") as handle:
            text = handle.read()
        self.assertIn('var unknownCount = 0', text)
        self.assertIn('unknownCount++', text)
        self.assertIn('unknown agents', text)

    def test_profile_flag_forms_are_parsed(self):
        for argv in (["hermes", "--profile", "fable"], ["hermes", "--profile=fable"], ["hermes", "-p", "fable"], ["hermes", "-pfable"]):
            self.assertEqual(ac.hermes_profile_from_argv(argv), "fable")

    def test_herdr_status_mapping_preserves_unknown_and_blocked_attention(self):
        self.assertEqual(ac.normalize_herdr_status("blocked"), "waiting")
        self.assertEqual(ac.normalize_herdr_status("unknown"), "unknown")
        self.assertEqual(ac.normalize_herdr_status("new_status"), "unknown")

    def test_hermes_tui_label_and_screen_status_are_normalized(self):
        self.assertEqual(ac.normalize_hermes_agent("hermes tui"), "hermes")
        self.assertEqual(ac.hermes_screen_status("\u23f3 Running tool: terminal"), "working")
        self.assertEqual(ac.hermes_screen_status("Ready for prompt"), "idle")
        self.assertEqual(ac.hermes_screen_status("Enter to confirm"), "waiting")

    def test_remote_hermes_screen_overrides_stale_idle_detector(self):
        snapshot = {
            "workspaces": [{"workspace_id": "w1", "label": "Remote"}],
            "tabs": [{"tab_id": "w1:t1", "label": "1"}],
            "panes": [{"pane_id": "w1:p1", "workspace_id": "w1", "tab_id": "w1:t1", "cwd": "/tmp"}],
            "agents": [{"pane_id": "w1:p1", "agent": "hermes tui", "agent_status": "idle"}],
        }
        machine = {"id": "m1", "label": "Dev", "target": "dev", "session": "default"}
        response = {"result": {"snapshot": snapshot}}
        with mock.patch.object(ac, "get_herdr_server_pids", return_value=[]), \
             mock.patch.object(ac, "herdr_session_sockets", return_value=[]), \
             mock.patch.object(ac, "herdr_machine_list", return_value=[machine]), \
             mock.patch.object(ac, "query_remote_herdr_snapshot", return_value=response), \
             mock.patch.object(ac, "query_remote_herdr_agent_read", return_value="⏳ Running tool"), \
             mock.patch.object(ac, "scan_orca_agents", return_value=[]), \
             mock.patch.object(ac, "scan_standalone_agents", return_value=[]), \
             mock.patch.object(ac, "query_orca_terminals", return_value=[]):
            data = ac.fetch_all_agents()
        self.assertEqual(data["agents"][0]["agent"], "hermes")
        self.assertEqual(data["agents"][0]["status"], "working")

    def test_herdr_pane_pid_accepts_foreground_hermes_and_rejects_bad_echo(self):
        payload = {"result": {"pane_id": "w1:p1", "process_info": {
            "foreground_processes": [{"pid": 321, "cmd": "python -m hermes_cli.main"}],
            "foreground_process_group_id": 321,
        }}}
        with mock.patch.object(ac, "run_bounded_remote_command", return_value=json.dumps(payload)):
            self.assertEqual(ac.herdr_pane_pid("w1:p1"), 321)
        payload["result"]["pane_id"] = "w1:p2"
        with mock.patch.object(ac, "run_bounded_remote_command", return_value=json.dumps(payload)):
            self.assertIsNone(ac.herdr_pane_pid("w1:p1"))
        with mock.patch.object(ac, "run_bounded_remote_command", return_value="not json"):
            self.assertIsNone(ac.herdr_pane_pid("w1:p1"))

    def test_hermes_session_for_pid_uses_lease_then_nearest_started_session(self):
        with tempfile.TemporaryDirectory() as tmp:
            db = os.path.join(tmp, "state.db")
            conn = sqlite3.connect(db)
            conn.executescript("""
                CREATE TABLE session_turn_leases (conversation_id TEXT, holder TEXT, expires_at REAL);
                CREATE TABLE sessions (id TEXT, source TEXT, cwd TEXT, started_at REAL, last_activity_at REAL);
            """)
            conn.execute("INSERT INTO session_turn_leases VALUES (?, ?, ?)", ("leased", "worker pid=321", 9999999999))
            conn.execute("INSERT INTO sessions VALUES (?, ?, ?, ?, ?)", ("near", "cli", "/tmp/shared", 1990, 2000))
            conn.commit(); conn.close()
            with mock.patch.object(ac, "HERMES_STATE_DB", db), \
                 mock.patch.object(ac, "get_process_info", return_value={"cwd": "/tmp/shared"}), \
                 mock.patch.object(ac, "get_process_start_time", return_value=2000):
                self.assertEqual(ac.hermes_session_for_pid(321), "leased")
            conn = sqlite3.connect(db)
            conn.execute("DELETE FROM session_turn_leases")
            conn.execute("INSERT INTO sessions VALUES (?, ?, ?, ?, ?)", ("far-future", "cli", "/tmp/shared", 2400, 2400))
            conn.commit(); conn.close()
            with mock.patch.object(ac, "HERMES_STATE_DB", db), \
                 mock.patch.object(ac, "get_process_info", return_value={"cwd": "/tmp/shared"}), \
                 mock.patch.object(ac, "get_process_start_time", return_value=2000):
                self.assertEqual(ac.hermes_session_for_pid(321), "near")

    def test_herdr_local_unassigned_panes_get_distinct_previews(self):
        snapshot = {"workspaces": [], "tabs": [], "panes": [], "agents": [
            {"pane_id": "w1:p1", "agent": "hermes", "agent_status": "idle", "cwd": "/tmp/shared"},
            {"pane_id": "w1:p2", "agent": "hermes", "agent_status": "idle", "cwd": "/tmp/shared"},
        ]}
        response = {"result": {"snapshot": snapshot}}
        previews = {"session-one": ("Prompt one", "Model one", None, None, "Detail one", "idle", False),
                    "session-two": ("Prompt two", "Model two", None, None, "Detail two", "idle", False)}
        with mock.patch.object(ac, "get_herdr_server_pids", return_value=[]), \
             mock.patch.object(ac, "herdr_session_sockets", return_value=[("default", "/tmp/herdr.sock")]), \
             mock.patch.object(ac, "query_herdr_socket", return_value=response), \
             mock.patch.object(ac, "query_herdr_pane_detection", return_value="Ready for prompt"), \
             mock.patch.object(ac, "herdr_pane_pid", side_effect=[101, 102]), \
             mock.patch.object(ac, "hermes_session_for_pid", side_effect=["session-one", "session-two"]), \
             mock.patch.object(ac, "extract_hermes_session_info", side_effect=lambda **kw: previews[kw["specific_session_id"]]), \
             mock.patch.object(ac, "herdr_machine_list", return_value=[]), \
             mock.patch.object(ac, "scan_orca_agents", return_value=[]), \
             mock.patch.object(ac, "scan_standalone_agents", return_value=[]), \
             mock.patch.object(ac, "query_orca_terminals", return_value=[]):
            data = ac.fetch_all_agents()
        self.assertEqual([(a["title"], a["detail"]) for a in data["agents"]],
                         [("Prompt one", "Detail one"), ("Prompt two", "Detail two")])

        snapshot = {
            "version": "0.9.1",
            "workspaces": [],
            "tabs": [],
            "panes": [],
            "agents": [
                {
                    "pane_id": "w1:p1",
                    "agent": "hermes",
                    "agent_status": "idle",
                    "cwd": "/tmp/shared",
                    "agent_session": {"source": "herdr:hermes", "value": "session-one"},
                },
                {
                    "pane_id": "w1:p2",
                    "agent": "hermes",
                    "agent_status": "idle",
                    "cwd": "/tmp/shared",
                    "agent_session": {"source": "herdr:hermes", "value": "session-two"},
                },
            ],
        }
        response = {"result": {"snapshot": snapshot}}

        def session_info(**kwargs):
            previews = {
                "session-one": ("Prompt one", "Model one", None, None, "Detail one", "idle", False),
                "session-two": ("Prompt two", "Model two", None, None, "Detail two", "idle", False),
            }
            return previews[kwargs["specific_session_id"]]

        with mock.patch.object(ac, "get_herdr_server_pids", return_value=[]), \
             mock.patch.object(ac, "herdr_session_sockets", return_value=[("default", "/tmp/herdr.sock")]), \
             mock.patch.object(ac, "query_herdr_socket", return_value=response), \
             mock.patch.object(ac, "query_herdr_pane_detection", return_value="Ready for prompt"), \
             mock.patch.object(ac, "extract_hermes_session_info", side_effect=session_info) as extract, \
             mock.patch.object(ac, "herdr_machine_list", return_value=[]), \
             mock.patch.object(ac, "scan_orca_agents", return_value=[]), \
             mock.patch.object(ac, "scan_standalone_agents", return_value=[]), \
             mock.patch.object(ac, "query_orca_terminals", return_value=[]):
            data = ac.fetch_all_agents()

        self.assertEqual([call.kwargs["specific_session_id"] for call in extract.call_args_list], ["session-one", "session-two"])
        self.assertEqual([(agent["title"], agent["detail"]) for agent in data["agents"]], [
            ("Prompt one", "Detail one"),
            ("Prompt two", "Detail two"),
        ])

    def test_unresolvable_local_hermes_pane_gets_no_borrowed_preview(self):
        # When a local CLI pane cannot be mapped to its own session (no
        # agent_session, pid/session resolution fails), it must NOT fall back to
        # the global "best" Hermes session (which would show borrowed, wrong
        # text). extract_hermes_session_info must not run for it, and the card
        # title falls back to the pane's real terminal title.
        snapshot = {"workspaces": [], "tabs": [], "panes": [
            {"pane_id": "w1:p1", "terminal_title": "hermes: task alpha", "cwd": "/tmp/shared"},
        ], "agents": [
            {"pane_id": "w1:p1", "agent": "hermes", "agent_status": "idle",
             "cwd": "/tmp/shared", "terminal_title": "hermes: task alpha"},
        ]}
        response = {"result": {"snapshot": snapshot}}
        with mock.patch.object(ac, "get_herdr_server_pids", return_value=[]), \
             mock.patch.object(ac, "herdr_session_sockets", return_value=[("default", "/tmp/herdr.sock")]), \
             mock.patch.object(ac, "query_herdr_socket", return_value=response), \
             mock.patch.object(ac, "query_herdr_pane_detection", return_value="Ready for prompt"), \
             mock.patch.object(ac, "herdr_pane_pid", return_value=None), \
             mock.patch.object(ac, "hermes_session_for_pid", return_value=None), \
             mock.patch.object(ac, "extract_hermes_session_info") as extract, \
             mock.patch.object(ac, "herdr_machine_list", return_value=[]), \
             mock.patch.object(ac, "scan_orca_agents", return_value=[]), \
             mock.patch.object(ac, "scan_standalone_agents", return_value=[]), \
             mock.patch.object(ac, "query_orca_terminals", return_value=[]):
            data = ac.fetch_all_agents()
        extract.assert_not_called()
        self.assertEqual(len(data["agents"]), 1)
        self.assertNotIn(data["agents"][0]["title"], ("Prompt one", "Prompt two"))


if __name__ == "__main__":
    unittest.main()
