#!/usr/bin/env python3
"""Hermetic tests for remote source parsing and identity boundaries."""

import importlib.util
import io
import json
import os
import subprocess
import sys
import unittest
from unittest import mock

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("agent_ctl_under_test", os.path.join(ROOT, "agent_ctl.py"))
assert spec and spec.loader
ac = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ac)


class TestHerdrMachineConfig(unittest.TestCase):
    def test_enabled_saved_machine_becomes_remote_source(self):
        machines = [
            {"id": "m1", "label": "Dev", "target": "dev", "session": "default", "enabled": True},
            {"id": "m2", "label": "Off", "target": "off", "session": "default", "enabled": False},
        ]
        self.assertEqual(ac.parse_herdr_machine_list(machines), [
            {"id": "m1", "label": "Dev", "target": "dev", "session": "default"}
        ])

    def test_machine_without_public_target_uses_id_as_safe_label(self):
        self.assertEqual(
            ac.parse_herdr_machine_list([{"id": "opaque-id", "enabled": True}]),
            [{"id": "opaque-id", "label": "opaque-id", "target": "", "session": "default"}],
        )

    def test_remote_command_requires_opaque_machine_id(self):
        with self.assertRaises(ValueError):
            ac.remote_herdr_command({"id": "dev; touch /tmp/pwned"})

    def test_remote_command_uses_public_machine_forwarding(self):
        args = ac.remote_herdr_command({"id": "opaque-id", "target": "ssh://user@example.test:2222"})
        self.assertEqual(args, ["herdr", "--machine", "opaque-id", "api", "snapshot"])

    def test_remote_target_identity_is_machine_qualified(self):
        self.assertEqual(ac.remote_herdr_target_id("m1", "default", "p7"), "herdr-remote:m1:default|p7")

    def test_remote_control_targets_are_rejected(self):
        target = "herdr-remote:m1:default|w1:p1"
        self.assertFalse(ac.focus_pane(target)["ok"])
        self.assertFalse(ac.kill_target(target)["ok"])


class TestHermesRegistrySafety(unittest.TestCase):
    def test_registry_rows_never_expose_secret_or_token(self):
        registry = {
            "connections": [
                {"id": "r1", "kind": "remote", "label": "Infra", "url": "http://host:9120", "authMode": "oauth", "token": {"value": "secret"}},
                {"id": "local", "kind": "local", "label": "Local"},
            ]
        }
        rows = ac.sanitize_hermes_registry_connections(registry)
        self.assertEqual(rows[0], {"id": "r1", "kind": "remote", "label": "Infra", "url": "http://host:9120", "auth_mode": "oauth"})
        self.assertNotIn("token", rows[0])


class TestRemoteSnapshotTransport(unittest.TestCase):
    def test_snapshot_uses_machine_and_session_identity(self):
        fake = json.dumps({"id": "x", "result": {"snapshot": {"version": "0.9.1", "workspaces": [], "tabs": [], "panes": [], "agents": []}}})
        with mock.patch.object(ac, "run_bounded_remote_command", return_value=fake) as run:
            result = ac.query_remote_herdr_snapshot({"id": "m1", "target": "dev", "session": "agents"})
        self.assertEqual(result["result"]["snapshot"]["agents"], [])
        args = run.call_args.args[0]
        self.assertEqual(args, ["herdr", "--machine", "m1", "api", "snapshot"])

    def test_remote_agent_read_uses_bounded_detection_command(self):
        with mock.patch.object(ac, "run_bounded_remote_command", return_value="Ready for prompt") as run:
            self.assertEqual(
                ac.query_remote_herdr_agent_read({"id": "m1", "target": "dev", "session": "agents"}, "w1:p1"),
                "Ready for prompt",
            )
        self.assertEqual(run.call_args.args[0], ["herdr", "--machine", "m1", "agent", "read", "w1:p1", "--source", "detection"])


class TestHerdrReadPreview(unittest.TestCase):
    def test_boxed_render_uses_latest_user_and_assistant_turn(self):
        sample = """╭────────────────────────────────────╮
│ ● You: what is bitwarden secrets manager? │
│ ◆ Hermes: Bitwarden Secrets Manager (BWS) │
│ a separate Bitwarden product.             │
│ ● You: yes lets move to bws. I though bw was for automations │
│ ◆ Hermes: Reasonable confusion — `bw` CLI can do automation │
╰────────────────────────────────────╯"""
        title, detail = ac.parse_herdr_read_preview(sample)
        self.assertEqual(title, "yes lets move to bws. I though bw was for automations")
        self.assertTrue(detail.startswith("Reasonable confusion"))

    def test_empty_garbage_and_user_only_are_safe(self):
        self.assertEqual(ac.parse_herdr_read_preview("garbage without turns"), (None, None))
        self.assertEqual(ac.parse_herdr_read_preview("│ ○ You: only this prompt │"), ("only this prompt", None))

    def test_bullet_and_header_marker_form(self):
        # Real Hermes TUI on aidev: user prompts are bare "● <text>" and the
        # assistant is a standalone "⚕ Hermes" header followed by body lines.
        # Tool rows ("┊ …"), the model status footer, and the input hint ("❯")
        # must not be mistaken for turns.
        sample = "\n".join([
            "│ ● proceed with your recommendations │",
            "│ ⚕ Hermes │",
            "│ Both recommendations are routed. │",
            "│ Kanban contract follows. │",
            "│ ┊ ⚡ kanban_co   0.0s │",
            "│ ⚕ claude-opus-4-8 · ~27% · ◎ 77% · 2.1d │",
            "│ ❯ Explain this error │",
        ])
        title, detail = ac.parse_herdr_read_preview(sample)
        self.assertEqual(title, "proceed with your recommendations")
        self.assertEqual(detail, "Both recommendations are routed. Kanban contract follows.")

    def test_remote_panes_keep_distinct_previews_and_reply_metadata(self):
        snapshot = {"version": "0.9.1", "workspaces": [], "tabs": [], "panes": [], "agents": [
            {"pane_id": "w1:p1", "agent": "hermes", "agent_status": "idle", "cwd": "/tmp/one"},
            {"pane_id": "w1:p2", "agent": "hermes", "agent_status": "idle", "cwd": "/tmp/two"},
        ]}
        reads = {
            "w1:p1": "│ ● You: first remote task │\n│ ◆ Hermes: first response │",
            "w1:p2": "│ ● You: second remote task │\n│ ◆ Hermes: second response │",
        }
        machine = {"id": "m1", "label": "Dev", "target": "dev", "session": "default"}
        with mock.patch.object(ac, "get_herdr_server_pids", return_value=[]), \
             mock.patch.object(ac, "herdr_session_sockets", return_value=[]), \
             mock.patch.object(ac, "herdr_machine_list", return_value=[machine]), \
             mock.patch.object(ac, "query_remote_herdr_snapshot", return_value={"result": {"snapshot": snapshot}}), \
             mock.patch.object(ac, "query_remote_herdr_agent_read", side_effect=lambda _machine, pane: reads[pane]) as read, \
             mock.patch.object(ac, "scan_orca_agents", return_value=[]), \
             mock.patch.object(ac, "scan_standalone_agents", return_value=[]), \
             mock.patch.object(ac, "query_orca_terminals", return_value=[]):
            data = ac.fetch_all_agents()
        cards = {agent["reply_target"]: agent for agent in data["agents"]}
        self.assertEqual((cards["w1:p1"]["title"], cards["w1:p1"]["detail"]), ("first remote task", "first response"))
        self.assertEqual((cards["w1:p2"]["title"], cards["w1:p2"]["detail"]), ("second remote task", "second response"))
        self.assertEqual(read.call_count, 2)
        for card in cards.values():
            self.assertTrue(card["can_reply"])
            self.assertEqual(card["reply_machine_id"], "m1")

    def test_remote_prompt_without_reply_does_not_use_cwd_as_activity(self):
        snapshot = {"version": "0.9.1", "workspaces": [], "tabs": [], "panes": [], "agents": [
            {"pane_id": "w1:p1", "agent": "hermes", "agent_status": "done", "cwd": "/home/test/.hermes"},
        ]}
        machine = {"id": "m1", "label": "n8n", "target": "n8n", "session": "default"}
        with mock.patch.object(ac, "get_herdr_server_pids", return_value=[]), \
             mock.patch.object(ac, "herdr_session_sockets", return_value=[]), \
             mock.patch.object(ac, "herdr_machine_list", return_value=[machine]), \
             mock.patch.object(ac, "query_remote_herdr_snapshot", return_value={"result": {"snapshot": snapshot}}), \
             mock.patch.object(ac, "query_remote_herdr_agent_read", return_value="│ ○ You: will update rewrite skills? │"), \
             mock.patch.object(ac, "scan_orca_agents", return_value=[]), \
             mock.patch.object(ac, "scan_standalone_agents", return_value=[]), \
             mock.patch.object(ac, "query_orca_terminals", return_value=[]):
            card = ac.fetch_all_agents()["agents"][0]
        self.assertEqual(card["title"], "will update rewrite skills?")
        self.assertEqual(card["detail"], "")
        self.assertEqual(card["cwd"], "/home/test/.hermes")


    def test_reply_capability_is_version_gated_per_snapshot(self):
        self.assertFalse(ac.herdr_replies_supported("0.8.2"))
        self.assertTrue(ac.herdr_replies_supported("0.9.1"))
        self.assertFalse(ac.herdr_replies_supported("not-a-version"))

    def test_target_and_message_validation(self):
        self.assertEqual(ac.parse_reply_target("herdr:default|w1:p1")["pane_id"], "w1:p1")
        self.assertEqual(ac.parse_reply_target("herdr-remote:m1:agents|w1:p1")["machine_id"], "m1")
        for value in ("", " \t\n", "x\x00y", "x\x01y", "é" * (ac.HERDR_REPLY_MAX_BYTES // 2 + 1)):
            with self.assertRaises(ValueError):
                ac.validate_reply_text(value)
        for target in (
            "herdr-remote:label;rm -rf:default|w1:p1",
            "herdr:../default|w1:p1",
            "herdr:default|../w1:p1",
            "herdr-remote:m1:default|w1:p1\x00",
        ):
            with self.assertRaises(ValueError):
                ac.parse_reply_target(target)

    def test_stdin_protocol_rejects_malformed_and_oversized_requests(self):
        for payload in (b"not-json\n", b"x" * ac.HERDR_REPLY_MAX_LINE):
            fake_stdin = mock.Mock(buffer=io.BytesIO(payload))
            with mock.patch.object(ac.sys, "stdin", fake_stdin):
                self.assertEqual(ac.reply_from_stdin()["code"], "invalid_request")

    def test_local_reply_re_resolves_and_routes_exact_session(self):
        snapshot = {"result": {"snapshot": {"version": "0.9.1", "agents": [{"pane_id": "w1:p1", "agent_status": "idle"}]}}}
        with mock.patch.object(ac, "herdr_session_sockets", return_value=[("agents", "/tmp/live.sock")]), \
             mock.patch.object(ac, "query_herdr_socket", return_value=snapshot), \
             mock.patch.object(ac, "_run_reply_command", return_value={"ok": True, "state": "submitted"}) as run:
            result = ac.submit_reply({"target_id": "herdr:agents|w1:p1", "text": "continue"})
        self.assertEqual(result, {"ok": True, "state": "submitted"})
        self.assertEqual(run.call_args.args[0], ["herdr", "--session", "agents", "agent", "prompt", "w1:p1", "continue"])

    def test_unknown_named_session_does_not_validate_against_default(self):
        with mock.patch.object(ac, "herdr_session_sockets", return_value=[("default", "/tmp/default.sock")]), \
             mock.patch.object(ac, "query_herdr_socket") as query, \
             mock.patch.object(ac, "_run_reply_command") as run:
            result = ac.submit_reply({"target_id": "herdr:missing|w1:p1", "text": "continue"})
        self.assertEqual(result["code"], "agent_unavailable")
        query.assert_not_called()
        run.assert_not_called()

    def test_remote_failure_never_falls_back_local_and_blocked_never_submits(self):
        with mock.patch.object(ac, "herdr_machine_list", return_value=[]), mock.patch.object(ac, "query_herdr_socket") as local:
            result = ac.submit_reply({"target_id": "herdr-remote:m1:default|w1:p1", "text": "x"})
        self.assertEqual(result["code"], "machine_unavailable")
        local.assert_not_called()

        snapshot = {"result": {"snapshot": {"version": "0.9.1", "agents": [{"pane_id": "w1:p1", "agent_status": "blocked"}]}}}
        with mock.patch.object(ac, "herdr_session_sockets", return_value=[("default", "/tmp/live.sock")]), \
             mock.patch.object(ac, "query_herdr_socket", return_value=snapshot), \
             mock.patch.object(ac, "_run_reply_command") as run:
            result = ac.submit_reply({"target_id": "herdr:default|w1:p1", "text": "x"})
        self.assertEqual(result["code"], "agent_blocked")
        run.assert_not_called()

    def test_remote_reply_uses_exact_profile_and_rejects_session_mismatch(self):
        machine = {"id": "m1", "label": "Dev", "target": "dev", "session": "agents"}
        snapshot = json.dumps({"result": {"snapshot": {"version": "0.9.1", "agents": [{"pane_id": "w1:p1", "agent_status": "working"}]}}})
        with mock.patch.object(ac, "herdr_machine_list", return_value=[machine]), \
             mock.patch.object(ac, "run_bounded_remote_command", return_value=snapshot), \
             mock.patch.object(ac, "_run_reply_command", return_value={"ok": True, "state": "submitted"}) as run:
            result = ac.submit_reply({"target_id": "herdr-remote:m1:agents|w1:p1", "text": "next"})
        self.assertTrue(result["ok"])
        self.assertEqual(run.call_args.args[0], ["herdr", "--machine", "m1", "agent", "prompt", "w1:p1", "next"])

        with mock.patch.object(ac, "herdr_machine_list", return_value=[machine]), \
             mock.patch.object(ac, "run_bounded_remote_command") as snapshot_run, \
             mock.patch.object(ac, "_run_reply_command") as prompt_run:
            result = ac.submit_reply({"target_id": "herdr-remote:m1:default|w1:p1", "text": "next"})
        self.assertEqual(result["code"], "machine_unavailable")
        snapshot_run.assert_not_called()
        prompt_run.assert_not_called()

    def test_reply_command_maps_blocked_and_timeout_without_retry(self):
        blocked = ac._run_reply_command([sys.executable, "-c", "import sys; print('agent_blocked', file=sys.stderr); raise SystemExit(1)"])
        self.assertEqual(blocked["code"], "agent_blocked")
        with mock.patch.object(ac, "HERDR_REPLY_TIMEOUT", 0.02):
            timed_out = ac._run_reply_command([sys.executable, "-c", "import time; time.sleep(1)"])
        self.assertEqual(timed_out["code"], "delivery_ambiguous")
        self.assertIn("may have succeeded", timed_out["message"])


if __name__ == "__main__":
    unittest.main()
