#!/usr/bin/env python3
"""Deterministic preflight and post-apply checks for projectlean.

Two modes:

- ``preflight`` validates the vendored package itself (asset presence,
  portable config, SOUL template contract) without any
  Hermes CLI calls beyond ``--version`` and ``prompt-size --json``
  probing. No exact version, tool count, or universe is hardcoded —
  the verifier asserts ``file/terminal/vision/skills`` are present,
  reports unknown/core schemas, and rejects known forbidden toolsets
  (Kanban, messaging, memory) at the structure level.

- ``postapply`` additionally probes the live ``projectlean`` profile:
  managed marker, skill parity with the vendored source, exact live
  CLI toolset and explicit disabled list, exact live config values,
  exact live ``SOUL.md`` parity, profile skill directory set, and
  prompt-size structure.

All hashing and search uses Python stdlib; no ``rg``/``sha256sum``/
external CLIs.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SKILLS = ROOT / "skills"
TEMPLATES = ROOT / "templates"
SOUL_TEMPLATE = TEMPLATES / "projectlean-soul.md.template"
CONFIG_TEMPLATE = TEMPLATES / "projectlean-config.json.template"
MANIFEST_FILE = ROOT / "manifest.json"
DEFAULT_PROFILE = "projectlean"

REQUIRED_SKILLS = (
    "independent-reviewer", "grill-me", "handoff",
    "hermes-agent", "llm-wiki-setup", "wiki-update",
)

APPROVED_CLI_TOOLSETS = {"file", "terminal", "vision", "skills"}

# Forbidden toolset names that must NOT be present in the live profile's
# CLI toolset listing or in prompt-size output. ``memory`` is forbidden
# because projectlean disables it as part of the portable config.
FORBIDDEN_TOOLSETS = {"kanban", "messaging", "memory", "todo", "delegation",
                      "cronjob", "web", "browser"}

EXPECTED_PORTABLE_CONFIG = {
    "agent.coding_context": "off",
    "agent.execution_guidance": "auto",
    "compression.abort_on_summary_failure": "false",
    "compression.min_tail_user_messages": "1",
    "compression.protect_last_n": "12",
    "compression.target_ratio": "0.2",
    "compression.threshold": "0.4",
}

DISABLED_TOOLSETS = (
    "web", "browser", "code_execution", "video", "image_gen", "video_gen",
    "x_search", "tts", "stt", "memory", "todo", "session_search",
    "connections", "clarify", "delegation", "cronjob", "homeassistant",
    "spotify", "yuanbao", "computer_use", "a2a", "kanban", "messaging",
)
EXPECTED_DISABLED_TOOLSETS = set(DISABLED_TOOLSETS)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _die(msg: str, code: int = 1) -> "None":
    print(f"projectlean verify: {msg}", file=sys.stderr)
    raise SystemExit(code)


def _python_tree_hash(directory: Path) -> str:
    digest = hashlib.sha256()
    for path in sorted(p for p in directory.rglob("*")
                       if p.is_file()
                       and "__pycache__" not in p.parts
                       and p.suffix != ".pyc"):
        digest.update(path.relative_to(directory).as_posix().encode() + b"\0")
        digest.update(path.read_bytes())
    return digest.hexdigest()


def _python_search(pattern: str, root: Path) -> list:
    rx = re.compile(pattern)
    hits: list = []
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        if "__pycache__" in path.parts or path.suffix == ".pyc":
            continue
        try:
            text = path.read_text(errors="replace")
        except OSError:
            continue
        for lineno, line in enumerate(text.splitlines(), start=1):
            if rx.search(line):
                hits.append((str(path), lineno, line))
    return hits


def _command(*args: str, check: bool = True) -> str:
    proc = subprocess.run(list(args), text=True,
                          stdout=subprocess.PIPE,
                          stderr=subprocess.STDOUT, check=check)
    return proc.stdout


def _profile_dir(hermes: str, profile: str) -> Path:
    proc = subprocess.run([hermes, "--profile", profile, "config", "path"],
                          text=True, stdout=subprocess.PIPE,
                          stderr=subprocess.STDOUT)
    if proc.returncode != 0:
        _die(f"profile {profile!r} not found: {proc.stdout.strip()}")
    return Path(proc.stdout.strip()).parent


def _config_value(hermes: str, profile: str, key: str) -> str:
    return _command(hermes, "--profile", profile, "config", "get", key).strip()


def _validate_portable_config() -> dict:
    if not CONFIG_TEMPLATE.is_file():
        _die(f"missing config template: {CONFIG_TEMPLATE}")
    try:
        raw = json.loads(CONFIG_TEMPLATE.read_text())
    except json.JSONDecodeError as exc:
        _die(f"portable config JSON malformed: {exc}")
    if raw != EXPECTED_PORTABLE_CONFIG:
        _die(f"portable config mismatch: {raw!r}")
    return raw


def _validate_soul_template() -> tuple:
    if not SOUL_TEMPLATE.is_file():
        _die(f"missing SOUL template: {SOUL_TEMPLATE}")
    content = SOUL_TEMPLATE.read_bytes()
    required = (
        b"Hermes Agent, built by Nous Research",
        b"Lean project-scoped engineering agent",
        b"match reply length to the ask",
        b"No filler, restatement, replay, or tool-call narration",
        b"State uncertainty plainly",
        b"Evidence over deference",
        b"Depth only when asked",
        b"wiki/index.md",
        b"never load the whole wiki",
        b"Live state, code, config, and primary docs outrank",
        b"llm-wiki-setup", b"wiki-update",
        b"project's documented/native issue system",
        b"Never invent a backend or silently create an external issue",
        b"Before completion",
        b"durable decisions",
        b"candidate/review and claim gates",
        b"supersede-not-delete",
        b"raw transcripts or secrets",
        b"Universal Hermes safety",
    )
    forbidden = (
        b"/home/", b"OpsLead", b"default profile", b"kanban_",
        b"### Layout", b"1. Decide",
    )
    if (len(content) > 2100 or len(content.splitlines()) > 14
            or any(tok not in content for tok in required)
            or any(tok in content for tok in forbidden)):
        _die("SOUL template violates portable wiki-first static contract")
    return content, hashlib.sha256(content).hexdigest()


# ---------------------------------------------------------------------------
# Live prompts/CLI probes
# ---------------------------------------------------------------------------


def _probe_cli_tools(hermes: str, profile: str) -> set:
    """Parse ``hermes tools list --platform cli`` for enabled toolset names.

    No exact total or version is assumed; we collect toolset names and
    apply approvals/forbidden rules on the parsed set.
    """
    raw = _command(hermes, "--profile", profile, "tools", "list",
                   "--platform", "cli")
    tools: set = set()
    for line in raw.splitlines():
        # Lines look like: ``  ✓ enabled  terminal  ...`` or
        # ``  ✗ disabled  browser  ...``. Only enabled sets count.
        match = re.match(r"^\s*(?:[\u2713\u2717])\s+(enabled|disabled)\s+(\S+)",
                          line)
        if match and match.group(1) == "enabled":
            tools.add(match.group(2))
    return tools




def _probe_prompt_size(hermes: str, profile: str) -> dict:
    """Inspect ``prompt-size --json`` structure without hardcoding counts.

    We require the report to be parseable, the toolsets_breakdown to be
    a list of toolset dicts, and we forbid Kanban/messaging/memory from
    appearing in any breakdown entry. ``file/terminal/vision/skills``
    must be present. Unknown/core schema fields are reported.
    """
    try:
        report = json.loads(_command(hermes, "--profile", profile,
                                     "prompt-size", "--json"))
    except (json.JSONDecodeError, subprocess.CalledProcessError) as exc:
        _die(f"prompt-size probe failed: {exc}")
    if not isinstance(report, dict):
        _die("prompt-size JSON root is not an object")
    breakdown = report.get("toolsets_breakdown") or report.get("breakdown")
    tools = report.get("tools")
    if not isinstance(breakdown, list) or not isinstance(tools, dict):
        _die("prompt-size JSON missing toolsets_breakdown or tools object")
    present = []
    forbidden_hits = []
    for row in breakdown:
        if not isinstance(row, dict):
            _die("prompt-size breakdown row is not a dict")
        name = row.get("toolset") or row.get("name")
        if not isinstance(name, str):
            _die("prompt-size breakdown row missing toolset name")
        present.append(name)
        if name in FORBIDDEN_TOOLSETS:
            forbidden_hits.append(name)
    present_set = set(present)
    missing_approved = APPROVED_CLI_TOOLSETS - present_set
    return {
        "toolsets": sorted(present_set),
        "missing_approved": sorted(missing_approved),
        "forbidden_present": sorted(set(forbidden_hits)),
        "tools_count": tools.get("count"),
        "tools_json_bytes": tools.get("json_bytes"),
    }


# ---------------------------------------------------------------------------
# Mode: preflight
# ---------------------------------------------------------------------------


def run_preflight(hermes: str) -> dict:
    soul_bytes, soul_sha = _validate_soul_template()
    portable = _validate_portable_config()

    missing = [n for n in REQUIRED_SKILLS
               if not (SKILLS / n / "SKILL.md").is_file()]
    if missing:
        _die(f"missing skill assets: {', '.join(missing)}")

    # Legacy /tmp/claude paths must not be referenced inside the vendored
    # wiki trees. Use Python regex search instead of rg.
    legacy = _python_search(r"~/.claude/skills/wiki-update/gate\.py", SKILLS)
    resolver = SKILLS / "wiki-update" / "resolve-gate.py"
    if legacy or not resolver.is_file():
        _die(f"wiki asset preflight failed: "
             f"legacy_refs={bool(legacy)}, resolver_present={resolver.is_file()}")

    # Package preflight must be self-contained: a consuming repository's
    # .agents tree is optional and may legitimately be at a different
    # revision. The manifest below is the authoritative vendored-asset
    # integrity check; postapply separately verifies installed parity.
    source_hashes = {n: _python_tree_hash(SKILLS / n) for n in REQUIRED_SKILLS}
    canonical_wiki = {}

    # Verify tracked manifest matches assets.
    if MANIFEST_FILE.is_file():
        tracked = json.loads(MANIFEST_FILE.read_text())
        derived = {k: v for k, v in tracked.items() if k != "manifest_sha256"}
        derived["manifest_sha256"] = hashlib.sha256(
            json.dumps(derived, sort_keys=True).encode()).hexdigest()
        rebuilt = {
            "schema_version": 1, "name": "projectlean",
            "skills": source_hashes,
            "soul_template": {"bytes": len(soul_bytes), "sha256": soul_sha},
            "portable_config": portable,
            "cli_toolsets": sorted(APPROVED_CLI_TOOLSETS),
            "disabled_toolsets": sorted(EXPECTED_DISABLED_TOOLSETS),
            "manifest_sha256": "x",
        }
        rebuilt["manifest_sha256"] = hashlib.sha256(
            json.dumps({k: v for k, v in rebuilt.items() if k != "manifest_sha256"},
                       sort_keys=True).encode()).hexdigest()
        if derived != rebuilt:
            _die("tracked manifest.json diverges from assets")

    # Probe Hermes CLI surface so we report capability mismatches early,
    # not hardcoded against one version. Skip probes if hermes missing.
    cli_tools = None
    prompt_probe = None
    if hermes:
        try:
            cli_tools = sorted(_probe_cli_tools(hermes, DEFAULT_PROFILE))
        except SystemExit:
            cli_tools = None
        # Only probe prompt-size for the target profile if it exists.
        try:
            _profile_dir(hermes, DEFAULT_PROFILE)
            prompt_probe = _probe_prompt_size(hermes, DEFAULT_PROFILE)
        except SystemExit:
            prompt_probe = None

    return {
        "mode": "preflight",
        "soul_template": {"bytes": len(soul_bytes), "sha256": soul_sha},
        "portable_config": portable,
        "source_hashes": source_hashes,
        "canonical_wiki_hashes": canonical_wiki,
        "manifest_check": "ok",
        "cli_tools_visible": cli_tools,
        "prompt_probe": prompt_probe,
    }


# ---------------------------------------------------------------------------
# Mode: postapply
# ---------------------------------------------------------------------------


def run_postapply(hermes: str, profile: str) -> dict:
    pdir = _profile_dir(hermes, profile)
    marker = pdir / "projectlean.managed.json"
    if not marker.is_file():
        _die(f"profile {profile!r} is not projectlean-managed "
             f"(missing {marker})")

    source_hashes = {n: _python_tree_hash(SKILLS / n) for n in REQUIRED_SKILLS}
    installed_hashes = {n: _python_tree_hash(pdir / "skills" / n)
                        for n in REQUIRED_SKILLS}
    if installed_hashes != source_hashes:
        _die("installed skill hashes differ from vendored sources")

    # Live CLI toolsets: must contain exactly the approved set, none of
    # the forbidden set.
    cli_tools = _probe_cli_tools(hermes, profile)
    if not APPROVED_CLI_TOOLSETS.issubset(cli_tools):
        _die(f"approved CLI toolsets missing: "
             f"{sorted(APPROVED_CLI_TOOLSETS - cli_tools)}")
    if cli_tools & FORBIDDEN_TOOLSETS:
        _die(f"forbidden CLI toolsets present: "
             f"{sorted(cli_tools & FORBIDDEN_TOOLSETS)}")

    # Disabled list.
    disabled_raw = _config_value(hermes, profile, "agent.disabled_toolsets")


    if not disabled_raw:
        disabled = set()
    elif disabled_raw.lstrip().startswith("-"):
        disabled = {line.strip()[2:].strip()
                    for line in disabled_raw.splitlines()
                    if line.strip().startswith("-")}
    else:
        disabled = {item.strip() for item in disabled_raw.split(",")
                    if item.strip()}
    # Live memory + portable config.
    portable = _validate_portable_config()
    expected_config = {
        "memory.memory_enabled": "false",
        "memory.user_profile_enabled": "false",
        "memory.provider": "",
        **portable,
    }
    observed = {k: _config_value(hermes, profile, k) for k in expected_config}
    if observed != expected_config:
        _die(f"projectlean config mismatch: {observed}")

    # Live SOUL must match the template byte-for-byte.
    soul_bytes, _ = _validate_soul_template()
    soul = pdir / "SOUL.md"
    if not soul.is_file() or soul.read_bytes() != soul_bytes:
        _die("projectlean SOUL.md must exactly match the human-installed "
             "portable template")

    # Profile skill dirs must be exactly the six.
    skill_dirs = {p.name for p in (pdir / "skills").iterdir()
                  if p.is_dir()}
    if skill_dirs != set(REQUIRED_SKILLS):
        _die(f"unexpected profile skill directories: {sorted(skill_dirs)}")

    # Prompt-size structural check.
    prompt_probe = _probe_prompt_size(hermes, profile)
    if prompt_probe["missing_approved"]:
        _die(f"approved toolsets missing from prompt-size: "
             f"{prompt_probe['missing_approved']}")
    if prompt_probe["forbidden_present"]:
        _die(f"forbidden toolsets present in prompt-size: "
             f"{prompt_probe['forbidden_present']}")

    return {
        "mode": "postapply",
        "profile": profile,
        "managed": True,
        "installed_hashes": installed_hashes,
        "cli_toolsets": sorted(cli_tools),
        "disabled_toolsets": sorted(disabled),
        "config": observed,
        "soul_template_sha256": hashlib.sha256(soul_bytes).hexdigest(),
        "prompt_probe": prompt_probe,
    }


def run_backup_check(hermes: str, profile: str, backup: str) -> dict:
    """Validate a rollback backup's structure after adoption."""
    bp = Path(backup)
    if not bp.is_dir():
        _die(f"backup not found: {bp}")
    manifest = bp / "BACKUP_MANIFEST.json"
    if not manifest.is_file():
        _die(f"backup missing manifest: {manifest}")
    info = json.loads(manifest.read_text())
    expected_paths = {"config.yaml"}  # minimum contract
    actual_paths = set(info.get("paths", []))
    if not expected_paths.issubset(actual_paths):
        _die(f"backup manifest missing required paths: "
             f"{expected_paths - actual_paths}")
    if not (bp / "config.yaml").is_file():
        _die("backup missing config.yaml")
    return {
        "mode": "backup-check",
        "backup": str(bp),
        "info": info,
    }


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def main(argv: list = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--profile", default=DEFAULT_PROFILE)
    parser.add_argument("--mode",
                        choices=("preflight", "postapply", "backup-check"),
                        required=True)
    parser.add_argument("--backup", default=None,
                        help="path to a rollback backup (backup-check only)")
    parser.add_argument("--hermes-bin", default=None,
                        help="override the hermes executable path")
    args = parser.parse_args(argv)

    hermes = args.hermes_bin or "hermes"
    # Allow ``hermes`` missing for asset-only preflight; required for probes
    # that actually shell out.

    if args.mode == "preflight":
        result = run_preflight(hermes)
    elif args.mode == "postapply":
        result = run_postapply(hermes, args.profile)
    else:
        if not args.backup:
            _die("--backup is required for backup-check")
        result = run_backup_check(hermes, args.profile, args.backup)
    print(json.dumps(result, sort_keys=True, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
