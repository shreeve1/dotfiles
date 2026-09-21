#!/usr/bin/env python3
"""Install the tracked projectlean Hermes profile.

Python-stdlib installer. Requires the ``hermes`` CLI on PATH and Python 3.9+.
Git is only required for downstream merge packaging (never invoked here).

The installer is intentionally create-only by default: if the target profile
exists and is not yet marked as projectlean-managed the installer refuses
to mutate it. ``--adopt-unmanaged`` permits that path and creates a complete
timestamped backup of the existing config/skills/SOUL state before any
mutation. A managed profile is updated idempotently: the same source
manifest is installed on every run, and any failure during mutation
restores the previous state from a snapshot.

The installer never writes ``SOUL.md`` or any project instruction file
(``.hermes.md`` / ``HERMES.md`` / ``AGENTS.md`` / ``CLAUDE.md`` /
``.cursorrules``). Those copies are a separate human-approved action.
"""
from __future__ import annotations

import argparse
import datetime as _dt
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Callable, Iterable, Optional


ROOT = Path(__file__).resolve().parents[1]
SKILLS = ROOT / "skills"
TEMPLATES = ROOT / "templates"
SOUL_TEMPLATE = TEMPLATES / "projectlean-soul.md.template"
CONFIG_TEMPLATE = TEMPLATES / "projectlean-config.json.template"
MANIFEST_FILE = ROOT / "manifest.json"
MANAGED_MARKER = "projectlean.managed.json"
DEFAULT_PROFILE = "projectlean"
DEFAULT_CLONE_FROM = "default"

REQUIRED_SKILLS = (
    "independent-reviewer",
    "grill-me",
    "handoff",
    "hermes-agent",
    "llm-wiki-setup",
    "wiki-update",
)

CLI_TOOLSETS = ("file", "terminal", "vision", "skills")

# Recovered, non-configurable CLI toolsets that the picker omits but prompt
# assembly still pulls from the CLI composite. Subtracted from the disabled
# list so the lean prompt surface stays genuinely lean.
RECOVERED_TOOLSETS = ("kanban", "messaging")

# Full explicit disabled list. Kept conservative: a single unrecognised
# toolset here is fine; missing one means a leaked toolset in the prompt.
DISABLED_TOOLSETS = (
    "web", "browser", "code_execution", "video", "image_gen", "video_gen",
    "x_search", "tts", "stt", "memory", "todo", "session_search",
    "connections", "clarify", "delegation", "cronjob", "homeassistant",
    "spotify", "yuanbao", "computer_use", "a2a",
    *RECOVERED_TOOLSETS,
)


# ---------------------------------------------------------------------------
# Generic helpers
# ---------------------------------------------------------------------------


def _die(msg: str, code: int = 1) -> "None":
    print(f"projectlean install: {msg}", file=sys.stderr)
    raise SystemExit(code)


def _run(command: Iterable[str], *, env: Optional[dict] = None,
         check: bool = True) -> subprocess.CompletedProcess:
    return subprocess.run(list(command), text=True,
                          stdout=subprocess.PIPE,
                          stderr=subprocess.PIPE,
                          env=env, check=check)


def _python_tree_hash(directory: Path) -> str:
    digest = hashlib.sha256()
    for path in sorted(p for p in directory.rglob("*")
                       if p.is_file()
                       and "__pycache__" not in p.parts
                       and p.suffix != ".pyc"):
        digest.update(path.relative_to(directory).as_posix().encode() + b"\0")
        digest.update(path.read_bytes())
    return digest.hexdigest()


def _portable_config() -> dict:
    try:
        raw = json.loads(CONFIG_TEMPLATE.read_text())
    except (OSError, json.JSONDecodeError) as exc:
        _die(f"portable config template unreadable: {exc}")
    if not isinstance(raw, dict) or not all(
        isinstance(k, str) and isinstance(v, str) for k, v in raw.items()
    ):
        _die("portable config template must be a string-to-string object")
    return raw


def _project_root_arg(repo: Path) -> Path:
    repo = repo.expanduser().resolve()
    if not repo.exists() or not repo.is_dir():
        _die(f"--repo target does not exist: {repo}")
    return repo


def _is_beneath(path: Path, parent: Path) -> bool:
    try:
        path.resolve().relative_to(parent.resolve())
        return True
    except ValueError:
        return False


def _private_dir(path: Path) -> Path:
    path.mkdir(parents=True, exist_ok=True)
    if os.name == "posix":
        path.chmod(0o700)
    return path


def _default_backups_root(profile: str) -> Path:
    state_home = Path(os.environ.get("XDG_STATE_HOME", "~/.local/state"))
    return (state_home.expanduser() / "hermes" / "projectlean" /
            profile / "backups")


def _backup_root(value: Optional[Path], profile: str, repo: Path) -> Path:
    root = (value or _default_backups_root(profile)).expanduser().resolve()
    if _is_beneath(root, ROOT) or _is_beneath(root, repo):
        _die("backup directory must be outside the package and target repo")
    return _private_dir(root)


# ---------------------------------------------------------------------------
# Manifest
# ---------------------------------------------------------------------------


def build_manifest() -> dict:
    missing = [s for s in REQUIRED_SKILLS
               if not (SKILLS / s / "SKILL.md").is_file()]
    if missing:
        _die(f"missing skill assets: {', '.join(missing)}")
    if not SOUL_TEMPLATE.is_file() or not CONFIG_TEMPLATE.is_file():
        _die("missing SOUL/config template assets")

    skill_hashes = {name: _python_tree_hash(SKILLS / name)
                    for name in REQUIRED_SKILLS}
    soul_bytes = SOUL_TEMPLATE.read_bytes()
    config = _portable_config()

    manifest = {
        "schema_version": 1,
        "name": "projectlean",
        "skills": skill_hashes,
        "soul_template": {
            "bytes": len(soul_bytes),
            "sha256": hashlib.sha256(soul_bytes).hexdigest(),
        },
        "portable_config": config,
        "cli_toolsets": sorted(CLI_TOOLSETS),
        "disabled_toolsets": sorted(DISABLED_TOOLSETS),
    }
    manifest["manifest_sha256"] = hashlib.sha256(
        json.dumps({k: v for k, v in manifest.items() if k != "manifest_sha256"},
                   sort_keys=True).encode()
    ).hexdigest()
    return manifest


def write_manifest(manifest: dict, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n")


def check_manifest(manifest: dict) -> None:
    if not MANIFEST_FILE.is_file():
        _die(f"missing tracked manifest: {MANIFEST_FILE}")
    tracked = json.loads(MANIFEST_FILE.read_text())
    derived = {k: v for k, v in tracked.items() if k != "manifest_sha256"}
    derived["manifest_sha256"] = hashlib.sha256(
        json.dumps(derived, sort_keys=True).encode()).hexdigest()
    if derived != manifest:
        _die("on-disk assets diverge from tracked manifest.json")


# ---------------------------------------------------------------------------
# Profile discovery
# ---------------------------------------------------------------------------


def profile_dir(hermes: str, profile: str) -> Optional[Path]:
    proc = _run([hermes, "--profile", profile, "config", "path"],
                check=False)
    if proc.returncode != 0:
        return None
    candidate = Path(proc.stdout.strip()).parent
    return candidate if candidate.is_dir() else None


def profile_exists(hermes: str, profile: str) -> bool:
    return profile_dir(hermes, profile) is not None


def marker_path(pdir: Path) -> Path:
    return pdir / MANAGED_MARKER


def is_managed(pdir: Path) -> bool:
    return marker_path(pdir).is_file()


def _backup_one(src: Path, dst: Path) -> None:
    if not src.exists():
        return
    if src.is_dir():
        shutil.copytree(src, dst)
    else:
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)


def _restrict_backup_tree(path: Path) -> None:
    """Keep copied profile material private, including a possible .env."""
    if os.name != "posix":
        return
    for item in path.rglob("*"):
        if not item.is_symlink():
            item.chmod(0o700 if item.is_dir() else 0o600)
    path.chmod(0o700)


def _rm(path: Path) -> None:
    if path.is_dir() and not path.is_symlink():
        shutil.rmtree(path)
    elif path.exists() or path.is_symlink():
        path.unlink()


def backup_profile(pdir: Path, label: str, backups_root: Path) -> Path:
    """Snapshot every profile asset we may touch.

    Includes ``config.yaml``, ``.env`` (if present), the full ``skills/``
    tree (only if it exists), and ``SOUL.md`` (only if present). Each
    backup is timestamped so concurrent runs do not collide.
    """
    stamp = _dt.datetime.now(_dt.timezone.utc).strftime("%Y%m%dT%H%M%S.%fZ")
    target = backups_root / f"{label}-{stamp}"
    target.mkdir(parents=True, exist_ok=True)

    _backup_one(pdir / "config.yaml", target / "config.yaml")
    _backup_one(pdir / ".env", target / ".env")
    if (pdir / "skills").exists():
        _backup_one(pdir / "skills", target / "skills")
    if (pdir / "SOUL.md").exists():
        _backup_one(pdir / "SOUL.md", target / "SOUL.md")

    (target / "BACKUP_MANIFEST.json").write_text(json.dumps({
        "label": label, "stamped_at": stamp, "source_profile": str(pdir),
        "paths": sorted(p.name for p in target.iterdir()
                        if p.name != "BACKUP_MANIFEST.json"),
    }, indent=2, sort_keys=True) + "\n")
    _restrict_backup_tree(target)
    return target


def restore_profile(pdir: Path, backup: Path) -> None:
    """Replace the profile state with the contents of ``backup``."""
    for name in ("config.yaml", ".env", "skills", "SOUL.md"):
        candidate = pdir / name
        if candidate.exists() or candidate.is_symlink():
            _rm(candidate)
    config_yaml = backup / "config.yaml"
    if config_yaml.is_file():
        shutil.copy2(config_yaml, pdir / "config.yaml")
    env = backup / ".env"
    if env.is_file():
        shutil.copy2(env, pdir / ".env")
    skills = backup / "skills"
    if skills.is_dir():
        shutil.copytree(skills, pdir / "skills")
    soul = backup / "SOUL.md"
    if soul.is_file():
        shutil.copy2(soul, pdir / "SOUL.md")


# ---------------------------------------------------------------------------
# Install / adopt logic
# ---------------------------------------------------------------------------


def _create_profile(hermes: str, profile: str, clone_from: str) -> Path:
    proc = _run([hermes, "profile", "create", profile,
                 "--clone-from", clone_from, "--no-alias",
                 "--no-skills"],
                check=False)
    if proc.returncode != 0:
        _die(f"hermes profile create failed: {proc.stderr.strip() or proc.stdout.strip()}")
    pdir = profile_dir(hermes, profile)
    if pdir is None:
        _die("hermes profile create reported success but config path is unreadable")
    return pdir


def _apply_to_profile(pdir: Path, manifest: dict, hermes: str,
                      profile: str, failure_hook: Optional[Callable[[], None]],
                      backups_root: Path,
                      label: str) -> Path:
    """Install the manifest into ``pdir``.

    Every mutation is staged in a temp dir, copied into place as a final
    step, and a failure hook can be invoked mid-flight to exercise the
    restore path from tests. ``SOUL.md`` and any project instruction
    file are explicitly NOT written by this function.
    """
    pdir = pdir.expanduser().resolve()
    pdir.mkdir(parents=True, exist_ok=True)

    snapshot = backup_profile(pdir, label, backups_root)
    staged = tempfile.mkdtemp(prefix="projectlean-staged-")
    staged_root = Path(staged) / "payload"
    staged_root.mkdir()

    skills_target = staged_root / "skills"
    skills_target.mkdir()
    for name in REQUIRED_SKILLS:
        shutil.copytree(SKILLS / name, skills_target / name)

    staged_hashes = {n: _python_tree_hash(skills_target / n)
                     for n in REQUIRED_SKILLS}
    if staged_hashes != manifest["skills"]:
        shutil.rmtree(staged, ignore_errors=True)
        _die("staged skill parity check failed")

    if failure_hook is not None:
        failure_hook()

    target_skills = pdir / "skills"
    if target_skills.exists():
        shutil.rmtree(target_skills)
    shutil.copytree(skills_target, target_skills)

    config_keys = {
        "memory.memory_enabled": "false",
        "memory.user_profile_enabled": "false",
        "memory.provider": "",
        "platform_toolsets.cli": json.dumps(list(CLI_TOOLSETS)),
        "agent.disabled_toolsets": json.dumps(list(DISABLED_TOOLSETS)),
        **manifest["portable_config"],
    }
    for key, value in config_keys.items():
        proc = _run([hermes, "--profile", profile, "config", "set",
                     "--force", key, value],
                    check=False)
        if proc.returncode != 0:
            restore_profile(pdir, snapshot)
            _die(f"hermes config set {key} failed: "
                 f"{proc.stderr.strip() or proc.stdout.strip()}")

    installed_hashes = {n: _python_tree_hash(pdir / "skills" / n)
                        for n in REQUIRED_SKILLS}
    if installed_hashes != manifest["skills"]:
        restore_profile(pdir, snapshot)
        _die("post-install skill parity mismatch")

    shutil.rmtree(staged, ignore_errors=True)

    marker = {
        "managed_by": "projectlean",
        "installed_at": _dt.datetime.now(_dt.timezone.utc)
        .isoformat(timespec="seconds"),
        "source_manifest_sha256": manifest["manifest_sha256"],
        "source_root": str(ROOT),
        "profile": profile,
    }
    marker_path(pdir).write_text(json.dumps(marker, indent=2, sort_keys=True) + "\n")
    return snapshot


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def main(argv: Optional[list] = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--profile", default=DEFAULT_PROFILE,
                        help=f"target Hermes profile (default: {DEFAULT_PROFILE})")
    parser.add_argument("--clone-from", default=DEFAULT_CLONE_FROM,
                        help="source profile to clone from when creating (default: default)")
    parser.add_argument("--repo", default=".", type=Path,
                        help="project repo path (used in human guidance only; "
                             "no protected file is written)")
    parser.add_argument("--adopt-unmanaged", action="store_true",
                        help="permit adoption of an existing unmanaged profile "
                             "(creates a complete timestamped backup first)")
    parser.add_argument("--backup-dir", type=Path, default=None,
                        help="private backup directory; must be outside package "
                             "and target repo (default: XDG state directory)")
    parser.add_argument("--check-manifest", action="store_true",
                        help="verify on-disk assets match the tracked manifest "
                             "and exit (no hermes calls)")
    parser.add_argument("--dry-run", action="store_true",
                        help="print the manifest that would be installed and exit")
    parser.add_argument("--failure-hook-step", default=None,
                        choices=("after-stage",),
                        help="INTERNAL: trigger a synthetic failure inside the "
                             "install pipeline (used by tests).")
    args = parser.parse_args(argv)

    manifest = build_manifest()
    if args.dry_run:
        print(json.dumps({"profile": args.profile,
                          "manifest": manifest,
                          "mode": "dry-run"}, sort_keys=True))
        return 0
    if args.check_manifest:
        check_manifest(manifest)
        print(json.dumps({"manifest_check": "ok",
                          "manifest_sha256": manifest["manifest_sha256"]},
                         sort_keys=True))
        return 0

    hermes_bin = shutil.which("hermes")
    if not hermes_bin:
        _die("hermes CLI required on PATH")
    hermes = hermes_bin
    repo = _project_root_arg(args.repo)

    backups_root = _backup_root(args.backup_dir, args.profile, repo)

    existing = profile_dir(hermes, args.profile)
    if existing is not None and not is_managed(existing):
        label = "adopt"
    elif existing is not None:
        label = "update"
    else:
        label = "fresh"

    def _hook():
        if args.failure_hook_step == "after-stage":
            raise RuntimeError(
                "projectlean: injected failure after staging (test hook)")

    if existing is None:
        try:
            existing = _create_profile(hermes, args.profile, args.clone_from)
        except SystemExit:
            raise
        snapshot = _apply_to_profile(existing, manifest, hermes,
                                     args.profile, _hook,
                                     backups_root, label="fresh")
    elif not is_managed(existing):
        if not args.adopt_unmanaged:
            _die(f"profile {args.profile!r} exists but is not managed by "
                 f"projectlean; rerun with --adopt-unmanaged to take it over")
        snapshot = _apply_to_profile(existing, manifest, hermes,
                                     args.profile, _hook,
                                     backups_root, label="adopt")
    else:
        snapshot = _apply_to_profile(existing, manifest, hermes,
                                     args.profile, _hook,
                                     backups_root, label="update")

    print(json.dumps({
        "profile": args.profile,
        "mode": label if label != "fresh" else "created",
        "managed": True,
        "manifest_sha256": manifest["manifest_sha256"],
        "backup": str(snapshot),
        "toolsets": sorted(CLI_TOOLSETS),
        "repo": str(repo),
    }, sort_keys=True))
    print(
        f"Manual protected steps (not automated): after human approval, "
        f"copy {TEMPLATES / 'project-hermes-router.md.template'} to "
        f"{repo / '.hermes.md'}; back up the profile SOUL.md then copy "
        f"{SOUL_TEMPLATE} to that protected SOUL.md. Roll back by restoring "
        f"the backup at {snapshot}.",
        file=sys.stderr,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
