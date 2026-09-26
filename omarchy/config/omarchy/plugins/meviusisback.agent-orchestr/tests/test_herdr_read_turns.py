#!/usr/bin/env python3
"""Herdr detection-read parsing on real-shaped Hermes TUI renders.

Fixtures mirror three live captures: a narrow remote pane whose reply header
scrolled off (n8n), a `╭─ ☤ Hermes ─╮` boxed reply (aidev), and a wide local
pane with a `⚕ Hermes` box title.
"""

import importlib.util
import os
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("agent_ctl_under_test", os.path.join(ROOT, "agent_ctl.py"))
assert spec and spec.loader
ac = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ac)

W = 70  # pane / box width for the narrow fixture


def box(title: str, rows):
    return ["╭─ " + title + " " + "─" * (W - len(title) - 5) + "╮", *rows, "╰" + "─" * (W - 2) + "╯"]


class TestHerdrReadTurns(unittest.TestCase):
    def test_header_scrolled_off_narrow_pane_is_rejoined(self):
        # Header row is off-screen; body is hard-wrapped at W: once mid-word
        # (full row) and once at a dropped space (row one column short).
        para = "The main risk is one shared workspace holding every client's data, so I will raise it."
        full = para[:W]
        rest = para[W:]
        short = "Until I run the audit, a specialist can read an entry I have not rev"
        short = short[: W - 1]
        rows = [
            full, rest,
            "",
            short.rsplit(" ", 1)[0], short.rsplit(" ", 1)[1] + "iewed.",
            "",
            "Reply \"go\" and I'll start.",
            "╰" + "─" * (W - 2) + "╯",
            " ☤ claude-opus-5-5 │ ~177K/1M │ [██░░] ~18% │ ◎ 96.9%",
            "─" * W,
            "❯ Research this topic and write me a brief",
            "─" * W,
        ]
        prompt, reply = ac.parse_herdr_read_turns("\n".join(rows))
        self.assertIsNone(prompt)
        self.assertIn("one shared workspace", reply)
        self.assertIn(para, reply.replace("\n", " "))
        self.assertTrue(reply.rstrip().endswith("I'll start."))
        self.assertIn("\n\n", reply)                       # paragraphs kept
        self.assertNotIn("Research this topic", reply)     # input hint excluded
        self.assertNotIn("claude-opus", reply)             # status footer excluded

    def test_boxed_title_reply_latest_wins_and_tools_excluded(self):
        lines = [
            "● can you check if its actually firing",
            "─" * 40,
            *box("☤ Hermes", ["Checking logs."]),
            "  ┊ 💻 $         ls ~/.hermes/logs/  0.1s",
            *box("☤ Hermes", ["Yes, it's firing.", "", "- Log matches.", "- No failures."]),
            " ☤ claude-opus-5-5 │ ~50.7K/1M │ [░░] ~5% │ ◎ 86.1%",
            "❯ Plan a feature, then build it step by step",
        ]
        prompt, reply = ac.parse_herdr_read_turns("\n".join(lines))
        self.assertEqual(prompt, "can you check if its actually firing")
        self.assertEqual(reply, "Yes, it's firing.\n\n- Log matches.\n- No failures.")

    def test_initializing_banner_is_not_part_of_prompt(self):
        text = "\n".join(["● lookup the companion plugin", "Initializing agent...", "─" * 40,
                          *box("⚕ Hermes", ["Found it."])])
        prompt, reply = ac.parse_herdr_read_turns(text)
        self.assertEqual(prompt, "lookup the companion plugin")
        self.assertEqual(reply, "Found it.")

    def test_wide_rows_are_not_joined(self):
        # Rows shorter than the box border are real line breaks, not wraps.
        text = "\n".join(box("⚕ Hermes", ["Location: a/b", "Service: active"]))
        self.assertEqual(ac.parse_herdr_read_turns(text)[1], "Location: a/b\nService: active")

    def test_preview_wrapper_stays_single_line(self):
        text = "\n".join(box("☤ Hermes", ["Line one.", "", "Line two."]))
        _, detail = ac.parse_herdr_read_preview(text)
        self.assertEqual(detail, "Line one. Line two.")


if __name__ == "__main__":
    unittest.main()
