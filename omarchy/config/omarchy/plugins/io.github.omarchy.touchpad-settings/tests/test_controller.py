import importlib.machinery
import importlib.util
import json
import os
import stat
import subprocess
import tempfile
import unittest
from pathlib import Path

PLUGIN = Path(__file__).parents[1]
CTL = PLUGIN / "controller/touchpadctl"
TOUCHPAD = "elan0676:00-04f3:3195-touchpad"
TRACKPOINT = "tpps/2-elan-trackpoint"
COMPANION_MOUSE = "elan0676:00-04f3:3195-mouse"

SETTINGS = {
    "touchpad_sensitivity": 0.15,
    "scroll_factor": 0.4,
    "natural_scroll": False,
    "tap_to_click": True,
    "clickfinger_behavior": True,
    "disable_while_typing": True,
    "tap_and_drag": True,
    "middle_button_emulation": False,
    "trackpoint_sensitivity": -0.25,
    "trackpoint_middle_scroll": True,
}

LIVE_OPTIONS = {
    "input:sensitivity": {"float": 0.35},
    "input:touchpad:scroll_factor": {"float": 0.7},
    "input:touchpad:natural_scroll": {"bool": True},
    "input:touchpad:tap-to-click": {"bool": True},
    "input:touchpad:clickfinger_behavior": {"bool": False},
    "input:touchpad:disable_while_typing": {"bool": True},
    "input:touchpad:tap-and-drag": {"bool": False},
    "input:touchpad:middle_button_emulation": {"bool": True},
}

HYPRCTL = r"""#!/usr/bin/env python3
import json
import os
import sys

args = sys.argv[1:]
with open(os.environ["HYPR_LOG"], "a") as log:
    log.write(json.dumps(args) + "\n")

if args == ["devices", "-j"]:
    print(os.environ["HYPR_DEVICES"])
    raise SystemExit(0)

if args[:1] == ["getoption"]:
    options = json.loads(os.environ["HYPR_OPTIONS"])
    value = options.get(args[1])
    if value is None:
        print("unknown option", file=sys.stderr)
        raise SystemExit(1)
    print(json.dumps({"option": args[1], **value}))
    raise SystemExit(0)

failure = os.environ.get("HYPR_FAIL_CONTAINS")
if failure and failure in " ".join(args):
    print("forced hyprctl failure", file=sys.stderr)
    raise SystemExit(1)

if args[:1] in (["eval"], ["keyword"]):
    print("ok")
    raise SystemExit(0)

print("unexpected hyprctl call", file=sys.stderr)
raise SystemExit(2)
"""


def load_controller():
    loader = importlib.machinery.SourceFileLoader("touchpadctl_test_module", str(CTL))
    spec = importlib.util.spec_from_loader(loader.name, loader)
    module = importlib.util.module_from_spec(spec)
    loader.exec_module(module)
    return module


class ControllerTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        directory = Path(self.temporary.name)
        self.log = directory / "hyprctl.log"
        executable_directory = directory / "bin"
        executable_directory.mkdir()
        hyprctl = executable_directory / "hyprctl"
        hyprctl.write_text(HYPRCTL)
        hyprctl.chmod(hyprctl.stat().st_mode | stat.S_IEXEC)
        self.state_path = (
            directory / "config" / "omarchy" / "touchpad-settings.json"
        )
        self.env = {
            **os.environ,
            "PATH": str(executable_directory)
            + os.pathsep
            + os.environ.get("PATH", ""),
            "HYPR_LOG": str(self.log),
            "HYPR_OPTIONS": json.dumps(LIVE_OPTIONS),
            "HYPR_DEVICES": json.dumps(
                {
                    "mice": [
                        {"name": COMPANION_MOUSE},
                        {"name": TOUCHPAD},
                        {"name": TRACKPOINT},
                    ]
                }
            ),
            "XDG_CONFIG_HOME": str(directory / "config"),
        }

    def tearDown(self):
        self.temporary.cleanup()

    def invoke(self, *arguments):
        return subprocess.run(
            [str(CTL), *arguments],
            text=True,
            capture_output=True,
            env=self.env,
        )

    def calls(self):
        if not self.log.exists():
            return []
        return [json.loads(line) for line in self.log.read_text().splitlines()]

    def clear_calls(self):
        self.log.write_text("")

    def mutations(self):
        return [
            call
            for call in self.calls()
            if call and call[0] in ("eval", "keyword")
        ]

    def write_saved(self, settings=SETTINGS, schema=2):
        self.state_path.parent.mkdir(parents=True, exist_ok=True)
        self.state_path.write_text(
            json.dumps({"schemaVersion": schema, "settings": settings})
        )

    def test_first_status_uses_schema_2_defaults_and_live_global_values(self):
        result = self.invoke("status", "--json")

        self.assertEqual(result.returncode, 0, result.stderr)
        payload = json.loads(result.stdout)
        self.assertEqual(payload["schemaVersion"], 2)
        self.assertTrue(payload["ok"])
        self.assertEqual(
            payload["settings"],
            {
                "touchpad_sensitivity": 0.35,
                "scroll_factor": 0.7,
                "natural_scroll": True,
                "tap_to_click": True,
                "clickfinger_behavior": False,
                "disable_while_typing": True,
                "tap_and_drag": False,
                "middle_button_emulation": True,
                "trackpoint_sensitivity": 0.35,
                "trackpoint_middle_scroll": True,
            },
        )
        queried = [call[1] for call in self.calls() if call[0] == "getoption"]
        self.assertEqual(queried, list(LIVE_OPTIONS))
        self.assertFalse(self.mutations())
        self.assertFalse(self.state_path.exists())

    def test_saved_status_owns_only_per_device_values(self):
        self.write_saved()

        result = self.invoke("status", "--json")

        self.assertEqual(result.returncode, 0, result.stderr)
        settings = json.loads(result.stdout)["settings"]
        self.assertEqual(settings["touchpad_sensitivity"], 0.15)
        self.assertEqual(settings["trackpoint_sensitivity"], -0.25)
        self.assertTrue(settings["trackpoint_middle_scroll"])
        self.assertEqual(settings["scroll_factor"], 0.7)
        self.assertTrue(settings["natural_scroll"])
        queried = [call[1] for call in self.calls() if call[0] == "getoption"]
        self.assertNotIn("input:sensitivity", queried)

    def test_apply_selects_exact_devices_and_enables_middle_scroll(self):
        result = self.invoke("apply", "--json", json.dumps(SETTINGS))

        self.assertEqual(result.returncode, 0, result.stderr)
        payload = json.loads(result.stdout)
        self.assertEqual(payload["schemaVersion"], 2)
        self.assertEqual(payload["settings"], SETTINGS)
        self.assertTrue(payload["saved"])
        calls = self.calls()
        self.assertEqual(
            calls,
            [
                ["devices", "-j"],
                [
                    "eval",
                    'hl.device({ name = "elan0676:00-04f3:3195-touchpad", '
                    "sensitivity = 0.15 })",
                ],
                [
                    "eval",
                    'hl.device({ name = "tpps/2-elan-trackpoint", '
                    'sensitivity = -0.25, scroll_method = "on_button_down" })',
                ],
                ["keyword", "input:touchpad:scroll_factor", "0.4"],
                ["keyword", "input:touchpad:natural_scroll", "false"],
                ["keyword", "input:touchpad:tap-to-click", "true"],
                ["keyword", "input:touchpad:clickfinger_behavior", "true"],
                ["keyword", "input:touchpad:disable_while_typing", "true"],
                ["keyword", "input:touchpad:tap-and-drag", "true"],
                ["keyword", "input:touchpad:middle_button_emulation", "false"],
            ],
        )
        eval_calls = [call for call in calls if call[0] == "eval"]
        self.assertFalse(any(COMPANION_MOUSE in call[1] for call in eval_calls))
        self.assertFalse(
            any(
                call[0] == "keyword" and "scroll_method" in call[1]
                for call in calls
            )
        )
        self.assertFalse(any("scroll_button" in part for call in calls for part in call))
        self.assertEqual(
            json.loads(self.state_path.read_text()),
            {"schemaVersion": 2, "settings": SETTINGS},
        )

    def test_apply_disables_middle_scroll_with_no_scroll(self):
        settings = {**SETTINGS, "trackpoint_middle_scroll": False}

        result = self.invoke("apply", "--json", json.dumps(settings))

        self.assertEqual(result.returncode, 0, result.stderr)
        trackpoint_call = [
            call for call in self.calls() if call[0] == "eval" and TRACKPOINT in call[1]
        ]
        self.assertEqual(len(trackpoint_call), 1)
        self.assertIn('scroll_method = "no_scroll"', trackpoint_call[0][1])
        self.assertNotIn("on_button_down", trackpoint_call[0][1])
        self.assertFalse(
            any("scroll_button" in part for call in self.calls() for part in call)
        )

    def test_missing_required_device_fails_before_any_mutation(self):
        cases = (
            (
                [{"name": COMPANION_MOUSE}, {"name": TRACKPOINT}],
                f"required touchpad device not found: {TOUCHPAD}",
            ),
            (
                [{"name": COMPANION_MOUSE}, {"name": TOUCHPAD}],
                f"required TrackPoint device not found: {TRACKPOINT}",
            ),
        )
        for mice, message in cases:
            with self.subTest(message=message):
                self.env["HYPR_DEVICES"] = json.dumps({"mice": mice})
                self.clear_calls()

                result = self.invoke("apply", "--json", json.dumps(SETTINGS))

                self.assertNotEqual(result.returncode, 0)
                self.assertEqual(json.loads(result.stdout)["error"], message)
                self.assertEqual(self.calls(), [["devices", "-j"]])
                self.assertFalse(self.state_path.exists())

    def test_malformed_or_unsafe_device_data_fails_before_any_mutation(self):
        cases = (
            "not json",
            json.dumps([]),
            json.dumps({"mice": {}}),
            json.dumps({"mice": [None]}),
            json.dumps({"mice": [{}]}),
            json.dumps(
                {
                    "mice": [
                        {"name": TOUCHPAD},
                        {"name": TRACKPOINT},
                        {"name": "bad\nname"},
                    ]
                }
            ),
        )
        for devices in cases:
            with self.subTest(devices=devices):
                self.env["HYPR_DEVICES"] = devices
                self.clear_calls()

                result = self.invoke("apply", "--json", json.dumps(SETTINGS))

                self.assertNotEqual(result.returncode, 0)
                self.assertEqual(self.calls(), [["devices", "-j"]])
                self.assertFalse(self.mutations())
                self.assertFalse(self.state_path.exists())

    def test_device_names_are_quoted_and_control_characters_are_rejected(self):
        controller = load_controller()

        self.assertEqual(
            controller.lua_quote('Key "board" \\ 1'),
            '"Key \\"board\\" \\\\ 1"',
        )
        self.assertEqual(
            controller.device_call('Key "board" \\ 1', 0.25),
            'hl.device({ name = "Key \\"board\\" \\\\ 1", sensitivity = 0.25 })',
        )
        for unsafe in ("", "bad\nname", "bad\tname", "bad\x7fname", None):
            with self.subTest(unsafe=unsafe):
                self.assertFalse(controller.safe_name(unsafe))
                with self.assertRaises(ValueError):
                    controller.lua_quote(unsafe)

    def test_invalid_settings_are_rejected_before_device_discovery(self):
        invalid = (
            {**SETTINGS, "touchpad_sensitivity": 1.05},
            {**SETTINGS, "trackpoint_sensitivity": -1.05},
            {**SETTINGS, "scroll_factor": 0.15},
            {**SETTINGS, "tap_to_click": 1},
            {**SETTINGS, "trackpoint_middle_scroll": 1},
            {**SETTINGS, "unexpected": True},
            {key: value for key, value in SETTINGS.items() if key != "scroll_factor"},
        )
        for settings in invalid:
            with self.subTest(settings=settings):
                self.clear_calls()

                result = self.invoke("apply", "--json", json.dumps(settings))

                self.assertNotEqual(result.returncode, 0)
                self.assertEqual(self.calls(), [])
                self.assertFalse(self.state_path.exists())

    def test_missing_restore_is_a_read_only_default_status(self):
        result = self.invoke("restore", "--json")

        self.assertEqual(result.returncode, 0, result.stderr)
        payload = json.loads(result.stdout)
        self.assertFalse(payload["restored"])
        self.assertFalse(payload["saved"])
        self.assertFalse(self.mutations())
        self.assertFalse(any(call[0] == "devices" for call in self.calls()))

    def test_restore_validates_devices_then_reapplies_saved_settings(self):
        self.write_saved()

        result = self.invoke("restore", "--json")

        self.assertEqual(result.returncode, 0, result.stderr)
        payload = json.loads(result.stdout)
        self.assertTrue(payload["restored"])
        self.assertTrue(payload["saved"])
        self.assertEqual(payload["settings"], SETTINGS)
        self.assertEqual(self.calls()[0], ["devices", "-j"])
        self.assertEqual(
            json.loads(self.state_path.read_text()),
            {"schemaVersion": 2, "settings": SETTINGS},
        )

    def test_rejects_unsupported_saved_document_without_hyprctl_calls(self):
        for document in (
            [],
            {"schemaVersion": 1, "settings": SETTINGS},
            {"schemaVersion": 2, "settings": {**SETTINGS, "extra": True}},
        ):
            with self.subTest(document=document):
                self.state_path.parent.mkdir(parents=True, exist_ok=True)
                self.state_path.write_text(json.dumps(document))
                self.clear_calls()

                result = self.invoke("restore", "--json")

                self.assertNotEqual(result.returncode, 0)
                self.assertEqual(self.calls(), [])

    def test_failed_apply_does_not_persist_settings(self):
        self.env["HYPR_FAIL_CONTAINS"] = "input:touchpad:natural_scroll"

        result = self.invoke("apply", "--json", json.dumps(SETTINGS))

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("forced hyprctl failure", json.loads(result.stdout)["error"])
        self.assertFalse(self.state_path.exists())


if __name__ == "__main__":
    unittest.main()
