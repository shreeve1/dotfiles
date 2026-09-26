#!/usr/bin/env python3
"""Checks for the multi-line `response` excerpt shown in expanded cards."""

import importlib.util
import json
import os
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("agent_ctl_under_test", os.path.join(ROOT, "agent_ctl.py"))
assert spec and spec.loader
ac = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ac)


class TestResponseExcerpt(unittest.TestCase):
    def test_preserves_newlines_and_collapses_blank_runs(self):
        out = ac.extract_response_excerpt("First line  \n\n\n\nSecond\n  - item\r\nthird")
        self.assertEqual(out, "First line\n\nSecond\n  - item\nthird")

    def test_strips_ansi_control_and_fences(self):
        out = ac.extract_response_excerpt("\x1b[31mred\x1b[0m\x07\n```bash\nls\n```")
        self.assertNotIn("\x1b", out)
        self.assertNotIn("\x07", out)
        self.assertNotIn("```", out)
        self.assertIn("red", out)
        self.assertIn("ls", out)

    def test_redacts_secrets(self):
        key = "sk-ant-" + "a" * 40
        out = ac.extract_response_excerpt(f"Your key is {key}\nok")
        self.assertNotIn(key, out)

    def test_caps_with_ellipsis(self):
        out = ac.extract_response_excerpt("x" * (ac.RESPONSE_MAX_CHARS + 50))
        self.assertEqual(len(out), ac.RESPONSE_MAX_CHARS)
        self.assertTrue(out.endswith("…"))

    def test_status_payload_keeps_response_multiline(self):
        resp = "line one\nline two\n" + "y" * 800
        payload = {
            "ok": True,
            "summary": {"total": 1},
            "agents": [{"title": "t", "detail": "d\ne", "response": resp}],
            "workspaces": [],
        }
        agent = json.loads(ac.dump_status_json(payload))["agents"][0]
        self.assertEqual(agent["response"], resp)      # not flattened, not clipped to 400
        self.assertEqual(agent["detail"], "d e")       # other fields still flattened


if __name__ == "__main__":
    unittest.main()
