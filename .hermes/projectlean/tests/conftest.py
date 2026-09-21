"""Hermetic test harness for the projectlean package.

Builds a fake ``hermes`` CLI on a temporary PATH and an isolated
profile / config root. Each test gets its own ``tmp_path`` and the
harness resets fake-hermes state per test.

The fake hermes intentionally implements ONLY the verbs the package
calls. Any other invocation is a fail-closed error.
"""
from __future__ import annotations

import importlib.util
import json
import os
import shutil
import sys
import textwrap
import unittest
from pathlib import Path
from typing import Optional


PACKAGE_ROOT = Path(__file__).resolve().parents[1]


def _load(module_name: str, script_path: Path):
    spec = importlib.util.spec_from_file_location(module_name, script_path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    spec.loader.exec_module(module)
    return module


INSTALL = _load("_projectlean_install",
                PACKAGE_ROOT / "bin" / "install-projectlean.py")
VERIFY = _load("_projectlean_verify",
               PACKAGE_ROOT / "bin" / "verify-projectlean.py")
PREPARE = _load("_projectlean_prepare",
                PACKAGE_ROOT / "bin" / "prepare-context-candidates.py")


FAKE_HERMES_SHIM = r'''#!/usr/bin/env python3
"""Hermetic test stand-in for the subset of the hermes CLI used by projectlean."""
import json
import os
import sys
from pathlib import Path

ROOT = Path(os.environ["HERMES_FAKE_ROOT"])
PROFILES = Path(os.environ["HERMES_FAKE_PROFILES"])
CLI_TOOLS = json.loads(os.environ["HERMES_FAKE_CLI_TOOLS"])
PROMPT_EXTRA = json.loads(os.environ["HERMES_FAKE_PROMPT_EXTRA"])
FAIL_KEY = os.environ.get("HERMES_FAKE_FAIL_KEY", "")
VERSION = os.environ["HERMES_FAKE_VERSION"]
ENABLED_TICK = "\u2713"
DISABLED_CROSS = "\u2717"


def fail(msg):
    sys.stderr.write(msg + "\n")
    sys.exit(1)


def profile_dir(name):
    return PROFILES / name


def parse_args(argv):
    opts = {}
    i = 0
    while i < len(argv):
        a = argv[i]
        if a == "--profile" and i + 1 < len(argv):
            opts["profile"] = argv[i + 1]
            i += 2
        elif a.startswith("--profile="):
            opts["profile"] = a.split("=", 1)[1]
            i += 1
        elif a in ("--force", "--json", "--no-alias", "--no-skills"):
            opts[a.lstrip("-")] = True
            i += 1
        elif a.startswith("--") and "=" not in a:
            opts[a.lstrip("-")] = True
            i += 1
        elif a.startswith("--") and "=" in a:
            k, v = a.lstrip("-").split("=", 1)
            opts[k] = v
            i += 1
        else:
            i += 1
    return opts


def emit_set_value(cfg_path, key, value):
    if not cfg_path.is_file():
        fail("profile not found")
    lines = cfg_path.read_text().splitlines()
    out = []
    replaced = False
    for line in lines:
        if ":" in line:
            k, _, _ = line.partition(":")
            if k.strip() == key:
                out.append(key + ': "' + value + '"')
                replaced = True
                continue
        out.append(line)
    if not replaced:
        out.append(key + ': "' + value + '"')
    cfg_path.write_text("\n".join(out) + "\n")


def emit_get_value(cfg_path, key):
    if not cfg_path.is_file():
        fail("profile not found")
    for line in cfg_path.read_text().splitlines():
        if line.startswith(key + ":") or line.startswith(key + " :"):
            return line.split(":", 1)[1].strip().strip('"')
    return ""


def main():
    argv = sys.argv[1:]
    if not argv:
        fail("usage")
    opts = parse_args(argv)
    if argv[0] == "--version":
        sys.stdout.write(VERSION + "\n")
        return 0
    if argv[0] == "profile":
        if len(argv) >= 3 and argv[1] == "create":
            name = argv[2]
            clone_from = opts.get("clone-from")
            pdir = profile_dir(name)
            pdir.mkdir(parents=True, exist_ok=True)
            (pdir / "config.yaml").write_text(
                "model:\n  provider: fake\n  name: fake-model\n")
            if not opts.get("no-skills"):
                (pdir / "skills").mkdir(exist_ok=True)
            sys.stdout.write(json.dumps({"created": name,
                                          "clone_from": clone_from}) + "\n")
            return 0
        fail("unknown profile subcommand")
    if "profile" in opts:
        profile = opts["profile"]
        if "config" in argv:
            if "path" in argv:
                sys.stdout.write(str(profile_dir(profile) / "config.yaml")
                                  + "\n")
                return 0
            if "get" in argv:
                idx = argv.index("get")
                key = argv[idx + 1]
                value = emit_get_value(profile_dir(profile) / "config.yaml",
                                        key)
                sys.stdout.write(value + "\n")
                return 0
            if "set" in argv:
                idx = argv.index("set")
                kv = argv[idx + 1:]
                if kv and kv[0] == "--force":
                    kv = kv[1:]
                if len(kv) < 2:
                    fail("set needs KEY VALUE")
                key = kv[0]
                value = kv[1]
                if FAIL_KEY and FAIL_KEY == key:
                    fail("injected failure on set " + key)
                emit_set_value(profile_dir(profile) / "config.yaml",
                                key, value)
                sys.stdout.write("ok\n")
                return 0
            fail("unknown config subcommand")
        if "tools" in argv and "list" in argv:
            sys.stdout.write("Built-in toolsets (cli):\n")
            for name, state in CLI_TOOLS:
                tick = ENABLED_TICK if state == "enabled" else DISABLED_CROSS
                sys.stdout.write("  " + tick + " " + state + "  " + name
                                  + "  label\n")
            return 0
        if "prompt-size" in argv:
            enabled = [n for n, s in CLI_TOOLS if s == "enabled"]
            total_count = PROMPT_EXTRA.get("total_count", 12)
            total_bytes = PROMPT_EXTRA.get("total_bytes", 16213)
            report = {
                "platform": "cli",
                "model": "fake",
                "system_prompt": {"chars": 14107, "bytes": 14107},
                "skills_index": {"chars": 583, "bytes": 583},
                "memory": {"chars": 0, "bytes": 0},
                "user_profile": {"chars": 0, "bytes": 0},
                "tools": {"count": total_count,
                          "json_bytes": total_bytes},
                "toolsets_breakdown": [
                    {"toolset": n, "tool_count": 1, "json_bytes": 1200}
                    for n in enabled
                ],
            }
            extra = PROMPT_EXTRA.get("extra") or {}
            report.update(extra)
            sys.stdout.write(json.dumps(report) + "\n")
            return 0
        fail("unknown --profile subcommand")
    fail("unrecognised command")


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as exc:
        sys.stderr.write(str(exc) + "\n")
        sys.exit(2)
'''


class HermesFake:
    """In-memory fake of the Hermes CLI subset used by the package."""

    def __init__(self, root: Path):
        self.root = root
        self.bin_dir = root / "bin"
        self.bin_dir.mkdir(parents=True, exist_ok=True)
        self.profiles_dir = root / "profiles"
        self.profiles_dir.mkdir(parents=True, exist_ok=True)
        self.bin_path = self.bin_dir / "hermes"

        self.version_banner = (
            "Hermes Agent vFAKE.1.0 (2026.1.1) - upstream deadbeef - "
            "local cafef00d (+0 carried commits)"
        )
        self.cli_tools = [
            ("file", "enabled"),
            ("terminal", "enabled"),
            ("vision", "enabled"),
            ("skills", "enabled"),
            ("web", "disabled"),
            ("memory", "disabled"),
            ("todo", "disabled"),
            ("kanban", "disabled"),
            ("delegation", "disabled"),
            ("messaging", "disabled"),
            ("cronjob", "disabled"),
            ("browser", "disabled"),
        ]
        self.prompt_size_extra: dict = {}
        self.fail_on_config_set_key: Optional[str] = None

        self._write_shim()

    def _write_shim(self) -> None:
        self.bin_path.write_text(FAKE_HERMES_SHIM)
        self.bin_path.chmod(0o755)

    def install_on_path(self) -> dict:
        env = os.environ.copy()
        env["HERMES_FAKE_ROOT"] = str(self.root)
        env["HERMES_FAKE_PROFILES"] = str(self.profiles_dir)
        env["HERMES_FAKE_CLI_TOOLS"] = json.dumps(self.cli_tools)
        env["HERMES_FAKE_PROMPT_EXTRA"] = json.dumps(self.prompt_size_extra)
        env["HERMES_FAKE_FAIL_KEY"] = self.fail_on_config_set_key or ""
        env["HERMES_FAKE_VERSION"] = self.version_banner
        # Prepend fake bin, then keep real PATH so python3 shebang works.
        env["PATH"] = str(self.bin_dir) + os.pathsep + env.get("PATH", "")
        return env

    def profile_dir(self, profile: str) -> Path:
        return self.profiles_dir / profile

    def seed_profile(self, profile: str, *, with_skills: bool = False,
                     with_soul: bool = False,
                     config_yaml: Optional[str] = None) -> Path:
        pdir = self.profile_dir(profile)
        pdir.mkdir(parents=True, exist_ok=True)
        (pdir / "config.yaml").write_text(config_yaml or textwrap.dedent("""\
            model:
              provider: fake
              name: fake-model
            """))
        if with_skills:
            (pdir / "skills").mkdir(exist_ok=True)
        if with_soul:
            (pdir / "SOUL.md").write_text("# stock SOUL\n")
        return pdir


def _run_capture(env: dict, script: Path, *args: str):
    import subprocess
    return subprocess.run([sys.executable, str(script), *args],
                          env=env, text=True,
                          stdout=subprocess.PIPE, stderr=subprocess.PIPE)


def run_installer(env: dict, *args: str) -> dict:
    proc = _run_capture(env, PACKAGE_ROOT / "bin" / "install-projectlean.py",
                        *args)
    if proc.returncode != 0:
        raise AssertionError(
            f"installer failed (rc={proc.returncode}): "
            f"stdout={proc.stdout!r}\nstderr={proc.stderr!r}")
    return json.loads(proc.stdout)


def run_installer_expect_failure(env: dict, *args: str) -> str:
    proc = _run_capture(env, PACKAGE_ROOT / "bin" / "install-projectlean.py",
                        *args)
    assert proc.returncode != 0, (
        f"installer unexpectedly succeeded: {proc.stdout!r}")
    return proc.stderr + proc.stdout


def run_verifier(env: dict, *args: str) -> dict:
    proc = _run_capture(env, PACKAGE_ROOT / "bin" / "verify-projectlean.py",
                        *args)
    if proc.returncode != 0:
        raise AssertionError(
            f"verifier failed (rc={proc.returncode}): "
            f"stdout={proc.stdout!r}\nstderr={proc.stderr!r}")
    return json.loads(proc.stdout)


def run_verifier_expect_failure(env: dict, *args: str) -> str:
    proc = _run_capture(env, PACKAGE_ROOT / "bin" / "verify-projectlean.py",
                        *args)
    assert proc.returncode != 0, (
        f"verifier unexpectedly succeeded: {proc.stdout!r}")
    return proc.stderr + proc.stdout


def run_prepare(env: dict, *args: str) -> dict:
    proc = _run_capture(env,
                        PACKAGE_ROOT / "bin" / "prepare-context-candidates.py",
                        *args)
    if proc.returncode != 0:
        raise AssertionError(
            f"prepare failed (rc={proc.returncode}): "
            f"stdout={proc.stdout!r}\nstderr={proc.stderr!r}")
    return json.loads(proc.stdout)


def run_prepare_expect_failure(env: dict, *args: str) -> str:
    proc = _run_capture(env,
                        PACKAGE_ROOT / "bin" / "prepare-context-candidates.py",
                        *args)
    assert proc.returncode != 0, (
        f"prepare unexpectedly succeeded: {proc.stdout!r}")
    return proc.stderr + proc.stdout


class ProjectleanTestBase(unittest.TestCase):
    hermes: HermesFake

    def setUp(self) -> None:
        import tempfile
        self.tmp = Path(tempfile.mkdtemp(prefix="projectlean-test-"))
        self.state = Path(tempfile.mkdtemp(prefix="projectlean-state-"))
        self.env_root = self.tmp / "fake-root"
        self.env_root.mkdir(parents=True, exist_ok=True)
        self.hermes = HermesFake(self.env_root)
        self.env = self.hermes.install_on_path()
        self.env["XDG_STATE_HOME"] = str(self.state)

    def tearDown(self) -> None:
        shutil.rmtree(self.tmp, ignore_errors=True)
        shutil.rmtree(self.state, ignore_errors=True)
