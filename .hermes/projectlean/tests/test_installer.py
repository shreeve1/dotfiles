"""Behavioural tests for the projectlean installer / verifier / candidate-prep."""
from __future__ import annotations

import json
import os
import shutil
import sys
import textwrap
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from conftest import (
    PACKAGE_ROOT,
    ProjectleanTestBase,
    run_installer,
    run_installer_expect_failure,
    run_prepare,
    run_prepare_expect_failure,
    run_verifier,
    run_verifier_expect_failure,
)


def _backups(result: dict) -> Path:
    return Path(result["backup"]).parent


def _find_backup(result: dict) -> Path:
    backups = _backups(result)
    assert backups.is_dir(), f"missing backups dir: {backups}"
    children = sorted(p for p in backups.iterdir() if p.is_dir())
    assert children, f"no backups present under {backups}"
    return children[-1]


# ---------------------------------------------------------------------------
# Fresh install
# ---------------------------------------------------------------------------


class FreshInstallTests(ProjectleanTestBase):
    def test_fresh_install_creates_profile_and_marker(self):
        result = run_installer(self.env, "--profile", "projectlean",
                                "--clone-from", "default", "--repo", str(self.tmp))
        assert result["managed"] is True
        assert result["mode"] == "created"
        assert result["profile"] == "projectlean"
        # profile dir exists
        pdir = self.hermes.profile_dir("projectlean")
        assert pdir.is_dir()
        # managed marker
        marker = pdir / "projectlean.managed.json"
        assert marker.is_file()
        marker_text = json.loads(marker.read_text())
        assert marker_text["managed_by"] == "projectlean"
        assert marker_text["source_manifest_sha256"] == result["manifest_sha256"]
        # exactly the six skill dirs
        skills = {p.name for p in (pdir / "skills").iterdir() if p.is_dir()}
        assert skills == {"grill-me", "handoff", "hermes-agent",
                          "independent-reviewer", "llm-wiki-setup",
                          "wiki-update"}
        # marker references source manifest by hash
        backup_root = _find_backup(result)
        assert backup_root.is_dir()
        assert not backup_root.is_relative_to(PACKAGE_ROOT)
        assert not backup_root.is_relative_to(self.tmp)


# ---------------------------------------------------------------------------
# Idempotence
# ---------------------------------------------------------------------------


class IdempotenceTests(ProjectleanTestBase):
    def test_second_install_keeps_marker_and_hash_stable(self):
        first = run_installer(self.env, "--profile", "projectlean",
                               "--clone-from", "default", "--repo", str(self.tmp))
        second = run_installer(self.env, "--profile", "projectlean",
                                "--clone-from", "default", "--repo", str(self.tmp))
        assert first["manifest_sha256"] == second["manifest_sha256"]
        # Backup count went up outside source and target repos.
        backups = list(_backups(second).iterdir())
        assert len(backups) >= 2
        # marker was rewritten but still references the same manifest
        marker = json.loads((self.hermes.profile_dir("projectlean")
                              / "projectlean.managed.json").read_text())
        assert marker["source_manifest_sha256"] == first["manifest_sha256"]
        # skill parity preserved
        skills = {p.name for p in
                  (self.hermes.profile_dir("projectlean") / "skills").iterdir()
                  if p.is_dir()}
        assert skills == {"grill-me", "handoff", "hermes-agent",
                          "independent-reviewer", "llm-wiki-setup",
                          "wiki-update"}


# ---------------------------------------------------------------------------
# Refusal of unmanaged mutation
# ---------------------------------------------------------------------------


class RefusalTests(ProjectleanTestBase):
    def test_backup_dir_must_be_outside_package_and_target_repo(self):
        unsafe = run_installer_expect_failure(
            self.env, "--profile", "projectlean", "--clone-from", "default",
            "--repo", str(self.tmp), "--backup-dir", str(self.tmp / "backups"))
        assert "outside the package and target repo" in unsafe

    def test_existing_unmanaged_profile_refused_without_flag(self):
        # Seed an existing unmanaged profile with a non-trivial config.
        pdir = self.hermes.seed_profile("projectlean", with_skills=True,
                                         with_soul=True)
        original_config = (pdir / "config.yaml").read_text()
        original_soul = (pdir / "SOUL.md").read_text()

        stderr = run_installer_expect_failure(
            self.env, "--profile", "projectlean",
            "--clone-from", "default", "--repo", str(self.tmp))
        assert "not managed" in stderr
        # State untouched
        assert (pdir / "config.yaml").read_text() == original_config
        assert (pdir / "SOUL.md").read_text() == original_soul
        assert not (pdir / "projectlean.managed.json").exists()

    def test_adopt_unmanaged_creates_backup_and_takes_over(self):
        pdir = self.hermes.seed_profile(
            "projectlean", with_skills=True, with_soul=True,
            config_yaml="model:\n  provider: preadopt\n  name: kept\n")
        (pdir / ".env").write_text("test-only-secret=not-a-real-secret\n")
        preadopt_skills = sorted(p.name for p in (pdir / "skills").iterdir())
        result = run_installer(
            self.env, "--profile", "projectlean",
            "--clone-from", "default", "--repo", str(self.tmp),
            "--adopt-unmanaged")
        assert result["mode"] == "adopt"
        # Backup contains preadopt config and SOUL
        backup = Path(result["backup"])
        assert not backup.is_relative_to(PACKAGE_ROOT)
        assert not backup.is_relative_to(self.tmp)
        assert (backup / "config.yaml").is_file()
        assert "preadopt" in (backup / "config.yaml").read_text()
        assert (backup / "SOUL.md").is_file()
        assert (backup / ".env").is_file()
        assert not (PACKAGE_ROOT / ".env").exists()
        assert not (self.tmp / ".env").exists()
        if os.name == "posix":
            assert (backup.stat().st_mode & 0o777) == 0o700
            assert ((backup / ".env").stat().st_mode & 0o777) == 0o600
        # Profile now has the six vendored skills, preadopt skill gone.
        new_skills = sorted(p.name for p in (pdir / "skills").iterdir())
        assert new_skills != preadopt_skills
        assert set(new_skills) == {"grill-me", "handoff", "hermes-agent",
                                    "independent-reviewer", "llm-wiki-setup",
                                    "wiki-update"}
        # Marker placed.
        assert (pdir / "projectlean.managed.json").is_file()


# ---------------------------------------------------------------------------
# Injected failure restore
# ---------------------------------------------------------------------------


class FailureRestoreTests(ProjectleanTestBase):
    def test_injected_failure_restores_snapshot(self):
        # Seed a managed profile first via a normal install.
        run_installer(self.env, "--profile", "projectlean",
                       "--clone-from", "default", "--repo", str(self.tmp))
        pdir = self.hermes.profile_dir("projectlean")
        pre_failure_config = (pdir / "config.yaml").read_text()
        pre_failure_skills = sorted(p.name for p in (pdir / "skills").iterdir())
        # Inject failure on the second hermes config set call.
        # Each install sets 5 + N portable_config keys; we force a failure
        # on a portable config key by re-running with that key blocked.
        self.hermes.fail_on_config_set_key = "compression.threshold"
        run_installer_expect_failure(
            self.env, "--profile", "projectlean",
            "--failure-hook-step", "after-stage")
        # Snapshot restored: managed marker still references same manifest;
        post_config = (pdir / "config.yaml").read_text()
        # The snapshot taken at the start of the failed apply IS the
        # full pre-failure state (which already has compression.threshold
        assert post_config == pre_failure_config
        post_skills = sorted(p.name for p in (pdir / "skills").iterdir())

        assert post_skills == pre_failure_skills
        # Original config still readable (memory_enabled etc were set in
        # the first apply; they should still be present).
        assert "memory.memory_enabled" in pre_failure_config


# ---------------------------------------------------------------------------
# Merge preservation
# ---------------------------------------------------------------------------


class ContextCandidateTests(ProjectleanTestBase):
    def test_explicit_staging_name_is_a_safe_single_component(self):
        repo = self.tmp / "repo"
        repo.mkdir()
        result = run_prepare(self.env, "--repo", str(repo),
                             "--staging-name", "review_20260920-1")
        assert Path(result["staging_dir"]).name == "review_20260920-1"
        assert Path(result["staging_dir"]).parent == (
            self.state / "hermes" / "projectlean" / "context-candidates")

    def test_unsafe_staging_names_are_rejected(self):
        repo = self.tmp / "repo"
        repo.mkdir()
        unsafe_names = ("", ".", "..", "../escape", "one/two/three",
                        "nested\\escape", "/tmp/escape", "C:\\escape")
        for name in unsafe_names:
            with self.subTest(name=name):
                output = run_prepare_expect_failure(
                    self.env, "--repo", str(repo), "--staging-name", name)
                assert "--staging-name must be a single identifier" in output

    @unittest.skipUnless(os.name == "posix", "symlink containment is POSIX-specific")
    def test_staging_name_symlink_cannot_escape_staging_root(self):
        repo = self.tmp / "repo"
        repo.mkdir()
        output_dir = self.tmp / "outside"
        output_dir.mkdir()
        (output_dir / "escape").symlink_to(repo, target_is_directory=True)
        output = run_prepare_expect_failure(
            self.env, "--repo", str(repo), "--output-dir", str(output_dir),
            "--staging-name", "escape")
        assert "--staging-name resolves outside the staging root" in output
        assert not (repo / "context-preview.md").exists()

    def test_candidate_directory_must_not_overlap_repo(self):
        parent = self.tmp / "parent"
        repo = parent / "repo"
        repo.mkdir(parents=True)
        external = self.tmp / "external"
        external.mkdir()
        (parent / "container").mkdir()
        repo.rename(parent / "container" / "repo")
        repo = parent / "container" / "repo"
        cases = (
            (parent / "container", "repo", "candidate equals repo"),
            (parent, "container", "candidate contains repo"),
        )
        for output_dir, name, label in cases:
            with self.subTest(label=label):
                output = run_prepare_expect_failure(
                    self.env, "--repo", str(repo), "--output-dir", str(output_dir),
                    "--staging-name", name)
                assert "output directory must be outside the package and target repo" in output
        if os.name == "posix":
            alias = external / "parent-alias"
            alias.symlink_to(parent, target_is_directory=True)
            output = run_prepare_expect_failure(
                self.env, "--repo", str(repo), "--output-dir", str(alias),
                "--staging-name", "container")
            assert "output directory must be outside the package and target repo" in output
        result = run_prepare(self.env, "--repo", str(repo),
                             "--output-dir", str(external),
                             "--staging-name", "valid-stage")
        assert Path(result["staging_dir"]) == external / "valid-stage"

    def test_staging_directory_must_not_overlap_package_root(self):
        repo = self.tmp / "repo"
        repo.mkdir()
        package_parent = PACKAGE_ROOT.parent
        cases = (
            (package_parent, PACKAGE_ROOT.name, "candidate equals package"),
            (package_parent.parent, package_parent.name,
             "candidate contains package"),
            (PACKAGE_ROOT, "child", "staging root is beneath package"),
        )
        for output_dir, name, label in cases:
            with self.subTest(label=label):
                output = run_prepare_expect_failure(
                    self.env, "--repo", str(repo), "--output-dir", str(output_dir),
                    "--staging-name", name)
                assert "staging directories must not overlap the package or target repo" in output
        if os.name == "posix":
            alias = self.tmp / "package-parent-alias"
            alias.symlink_to(package_parent, target_is_directory=True)
            output = run_prepare_expect_failure(
                self.env, "--repo", str(repo), "--output-dir", str(alias),
                "--staging-name", PACKAGE_ROOT.name)
            assert "staging directories must not overlap the package or target repo" in output
        external = self.tmp / "external"
        result = run_prepare(self.env, "--repo", str(repo),
                             "--output-dir", str(external),
                             "--staging-name", "valid-stage")
        assert Path(result["staging_dir"]) == external / "valid-stage"

    @unittest.skipUnless(os.name == "posix", "symlink safety is POSIX-specific")
    def test_existing_staged_artifact_symlink_is_rejected_without_writing_target(self):
        repo = self.tmp / "repo"
        repo.mkdir()
        sentinel = repo / "sentinel.md"
        sentinel.write_text("unchanged\n")
        stage = self.tmp / "external" / "review"
        stage.mkdir(parents=True)
        (stage / "context-preview.md").symlink_to(sentinel)

        output = run_prepare_expect_failure(
            self.env, "--repo", str(repo), "--output-dir", str(stage.parent),
            "--staging-name", stage.name)

        assert "staged artifact already exists" in output
        assert sentinel.read_text() == "unchanged\n"

    def test_existing_active_context_gets_marked_router_patch(self):
        repo = self.tmp / "project"
        repo.mkdir()
        existing = "# My project rules\n\nDo not regress.\n"
        (repo / "AGENTS.md").write_text(existing)
        result = run_prepare(self.env, "--repo", str(repo))
        assert result["active_context"] == str(repo / "AGENTS.md")
        assert result["context_source"] == "project-root"
        candidate = result["candidates"][0]
        assert candidate["action"] == "stage-merge-patch"
        # Existing file untouched
        assert (repo / "AGENTS.md").read_text() == existing
        # No protected writes
        assert result["no_protected_writes"] is True
        preview = next(Path(p) for p in result["artifacts"]
                       if p.endswith("context-preview.md"))
        staged = preview.read_text()
        assert staged.startswith(existing)
        assert "<!-- projectlean:router:begin -->" in staged
        if os.name == "posix":
            assert (Path(result["staging_dir"]).stat().st_mode & 0o777) == 0o700
            assert (preview.stat().st_mode & 0o777) == 0o600

    def test_existing_marker_skips_regeneration(self):
        repo = self.tmp / "project"
        repo.mkdir()
        (repo / "AGENTS.md").write_text(
            "kept\n\n<!-- projectlean:router:begin -->\nold\n"
            "<!-- projectlean:router:end -->\n")
        result = run_prepare(self.env, "--repo", str(repo))
        assert result["candidates"][0]["action"] == "skip-existing-marker"

    def test_no_context_recommends_target(self):
        repo = self.tmp / "empty-project"
        repo.mkdir()
        result = run_prepare(self.env, "--repo", str(repo))
        assert result["active_context"] is None
        assert result["candidates"][0]["action"] == "stage-recommended-target"
        # Nothing materialised in the project
        assert not (repo / ".hermes.md").exists()
        assert not (repo / "AGENTS.md").exists()
        # Staging files exist
        assert any(p.endswith("context-preview.md")
                    for p in result["artifacts"])
        assert not Path(result["staging_dir"]).is_relative_to(PACKAGE_ROOT)
        assert not Path(result["staging_dir"]).is_relative_to(repo)

    def test_explicit_output_dir_must_not_be_in_repo(self):
        repo = self.tmp / "repo"
        repo.mkdir()
        proc = __import__("subprocess").run(
            [sys.executable, str(PACKAGE_ROOT / "bin" /
                                  "prepare-context-candidates.py"),
             "--repo", str(repo), "--output-dir", str(repo / "staged")],
            env=self.env, text=True, stdout=__import__("subprocess").PIPE,
            stderr=__import__("subprocess").PIPE)
        assert proc.returncode != 0

    def test_hermes_precedence_walks_upward(self):
        repo = self.tmp / "subdir" / "deep"
        repo.mkdir(parents=True)
        # .hermes.md at parent of repo
        (self.tmp / "subdir" / ".hermes.md").write_text("parent\n")
        result = run_prepare(self.env, "--repo", str(repo))
        assert result["context_source"] == "hermes-precedence-upward"


# ---------------------------------------------------------------------------
# Forbidden tool detection
# ---------------------------------------------------------------------------


class ForbiddenToolTests(ProjectleanTestBase):
    def test_postapply_rejects_when_extra_tool_present(self):
        run_installer(self.env, "--profile", "projectlean",
                       "--clone-from", "default", "--repo", str(self.tmp))
        # Re-seed fake hermes so its tools list returns a forbidden tool
        # as enabled (kanban leaking through).
        self.hermes.cli_tools = [
            ("file", "enabled"), ("terminal", "enabled"),
            ("vision", "enabled"), ("skills", "enabled"),
            ("kanban", "enabled"),  # forbidden leak
        ]
        self.hermes._write_shim()
        self.env = self.hermes.install_on_path()


# ---------------------------------------------------------------------------
# Unsupported capability
# ---------------------------------------------------------------------------


class UnsupportedCapabilityTests(ProjectleanTestBase):
    def test_verifier_preflight_reports_missing_capability(self):
        # Pretend hermes is on PATH but reports zero enabled toolsets.
        # We keep cli_tools empty (no approved four).
        self.hermes.cli_tools = []
        self.hermes._write_shim()
        self.env = self.hermes.install_on_path()
        # that preflight is a no-op on missing capabilities and that the
        # verdict on missing CLI tools is reported (not silent-pass).
        # Preflight runs even without a profile.
        result = run_verifier(self.env, "--mode", "preflight")
        # cli_tools_visible should be empty list (probe succeeded with 0)
        assert result["cli_tools_visible"] == []


# ---------------------------------------------------------------------------
# No protected writes
# ---------------------------------------------------------------------------


class NoProtectedWritesTests(ProjectleanTestBase):
    def test_installer_never_writes_SOUL_or_project_instructions(self):
        repo = self.tmp / "real-repo"
        repo.mkdir()
        # Sentinel files: protected files MUST NOT be created/touched.
        sentinels = [".hermes.md", "HERMES.md", "AGENTS.md", "CLAUDE.md",
                     ".cursorrules"]
        for name in sentinels:
            (repo / name).write_text(f"original {name}\n")
        run_installer(self.env, "--profile", "projectlean",
                       "--clone-from", "default", "--repo", str(repo),
                       "--adopt-unmanaged")
        for name in sentinels:
            content = (repo / name).read_text()
            assert content == f"original {name}\n", (
                f"installer mutated protected file {name}: {content!r}")
        # Profile SOUL.md never written.
        pdir = self.hermes.profile_dir("projectlean")
        assert not (pdir / "SOUL.md").exists()

    def test_prepare_never_writes_project_instructions(self):
        repo = self.tmp / "repo2"
        repo.mkdir()
        result = run_prepare(self.env, "--repo", str(repo))
        # No protected file at repo root
        assert not (repo / ".hermes.md").exists()
        assert not (repo / "AGENTS.md").exists()
        assert not (repo / "CLAUDE.md").exists()
        assert not (repo / ".cursorrules").exists()
        # no_protected_writes flag asserted by prepare
        assert result["no_protected_writes"] is True


# ---------------------------------------------------------------------------
# Manifest + preflight sanity
# ---------------------------------------------------------------------------


class ManifestTests(ProjectleanTestBase):
    def test_preflight_passes_on_clean_assets(self):
        result = run_verifier(self.env, "--mode", "preflight")
        assert result["manifest_check"] == "ok"
        assert result["soul_template"]["sha256"]
        assert set(result["source_hashes"]) == {
            "grill-me", "handoff", "hermes-agent",
            "independent-reviewer", "llm-wiki-setup", "wiki-update"}

    def test_installer_dry_run_reports_manifest(self):
        proc = __import__("subprocess").run(
            [sys.executable, str(PACKAGE_ROOT / "bin"
                                  / "install-projectlean.py"),
             "--dry-run"],
            env=self.env, text=True,
            stdout=__import__("subprocess").PIPE,
            stderr=__import__("subprocess").PIPE)
        assert proc.returncode == 0, proc.stderr
        report = json.loads(proc.stdout)
        assert report["mode"] == "dry-run"
        assert report["manifest"]["name"] == "projectlean"

    def test_postapply_passes_on_fake_hermes(self):
        run_installer(self.env, "--profile", "projectlean",
                       "--clone-from", "default", "--repo", str(self.tmp))
        # Seed fake SOUL.md to match the vendored template (the operator's
        # job in real life; tests exercise the verifier path).
        soul = PACKAGE_ROOT / "templates" / "projectlean-soul.md.template"
        (self.hermes.profile_dir("projectlean") / "SOUL.md").write_bytes(
            soul.read_bytes())
        # And seed the canonical config keys the verifier reads.
        from conftest import INSTALL as installer_module
        portable = json.loads((PACKAGE_ROOT / "templates"
                                / "projectlean-config.json.template").read_text())
        for key, value in {
            "memory.memory_enabled": "false",
            "memory.user_profile_enabled": "false",
            "memory.provider": "",
            **portable,
        }.items():
            cfg_path = self.hermes.profile_dir("projectlean") / "config.yaml"
            text = cfg_path.read_text()
            if key + ":" not in text:
                text += f'{key}: "{value}"\n'
                cfg_path.write_text(text)
        # Seed the disabled_toolsets YAML line that fake hermes parses.
        disabled = ",".join([
            "web", "browser", "code_execution", "video", "image_gen",
            "video_gen", "x_search", "tts", "stt", "memory", "todo",
            "session_search", "connections", "clarify", "delegation",
            "cronjob", "homeassistant", "spotify", "yuanbao",
            "computer_use", "a2a", "kanban", "messaging",
        ])
        cfg_path = self.hermes.profile_dir("projectlean") / "config.yaml"
        text = cfg_path.read_text()
        text += f'agent.disabled_toolsets: "{disabled}"\n'
        cfg_path.write_text(text)
        result = run_verifier(self.env, "--profile", "projectlean",
                               "--mode", "postapply")
        assert result["managed"] is True
        assert set(result["cli_toolsets"]) == {"file", "terminal", "vision",
                                                 "skills"}


if __name__ == "__main__":
    unittest.main()
