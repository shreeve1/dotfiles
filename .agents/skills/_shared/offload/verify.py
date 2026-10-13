#!/usr/bin/env python3

import ast
import copy
import fcntl
import hashlib
import importlib
import json
import os
from pathlib import Path
import re
import shlex
import stat
import subprocess
import sys
import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor
from unittest import mock
from urllib.parse import unquote, urlsplit


HELPER = Path(__file__).resolve().with_name("git_guard.py")
SKILLS = Path(__file__).resolve().parents[2]


class OffloadFixture(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory(prefix="offload-verify-")
        self.addCleanup(temporary.cleanup)
        self.base = Path(temporary.name)
        home = self.base / "home"
        home.mkdir()
        self.env = {
            "PATH": os.environ.get("PATH", os.defpath),
            "HOME": str(home),
            "XDG_CONFIG_HOME": str(home / ".config"),
            "LANG": "C.UTF-8",
            "LC_ALL": "C.UTF-8",
            "GIT_CONFIG_NOSYSTEM": "1",
            "GIT_CONFIG_GLOBAL": str(home / ".gitconfig"),
            "GIT_AUTHOR_NAME": "Offload Fixture",
            "GIT_AUTHOR_EMAIL": "fixture@example.invalid",
            "GIT_COMMITTER_NAME": "Offload Fixture",
            "GIT_COMMITTER_EMAIL": "fixture@example.invalid",
            "GIT_AUTHOR_DATE": "2026-10-11T00:00:00+0000",
            "GIT_COMMITTER_DATE": "2026-10-11T00:00:00+0000",
            "GIT_TERMINAL_PROMPT": "0",
            "GIT_ALLOW_PROTOCOL": "file",
            "GIT_NO_REPLACE_OBJECTS": "1",
        }
        self.repo = self.base / "source"
        self.repo.mkdir()
        self.git(self.repo, "init", "--initial-branch=main")
        self.git(self.repo, "config", "user.name", "Offload Fixture")
        self.git(self.repo, "config", "user.email", "fixture@example.invalid")
        self.git(self.repo, "config", "core.hooksPath", str(self.repo / ".git/hooks"))
        self.git(self.repo, "config", "core.filemode", "true")
        self.git(self.repo, "config", "commit.gpgsign", "false")
        self.git(self.repo, "config", "core.autocrlf", "false")
        self.put(self.repo, "AGENTS.md", "Tracked Offload Briefs live in .offload/<slug>/brief.md.\n")
        self.put(self.repo, "work.txt", "base work\n")
        self.put(self.repo, "unrelated.txt", "base unrelated\n")
        self.put(self.repo, "binary.dat", b"\x00base\xff\x01\n")
        self.put(self.repo, "executable.sh", "#!/bin/sh\nexit 0\n", 0o755)
        self.commit(self.repo, "Fixture root")
        self.root = self.oid(self.repo)
        self.sequence = 0

    def run_process(self, command, repo=None, data=None, extra_env=None):
        env = dict(self.env)
        if extra_env:
            env.update(extra_env)
        return subprocess.run(
            [str(part) for part in command], cwd=repo or self.base, env=env,
            input=data, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=60,
        )

    def git(self, repo, *args, data=None, extra_env=None):
        process = self.run_process(["git", "-C", repo, *args], repo, data, extra_env)
        self.assertEqual(process.returncode, 0, process.stderr.decode("utf-8", "replace"))
        return process.stdout

    def cli(self, command, repo=None, error=None, forbidden=(), **options):
        args = [sys.executable, HELPER, command, "--repo", repo or self.repo]
        for name, value in options.items():
            args.extend(["--" + name.replace("_", "-"), str(value)])
        process = self.run_process(args)
        return self.cli_response(process, command, error, forbidden)

    def cli_response(self, process, command, error=None, forbidden=()):
        for value in (*forbidden, "HOOK_OUTPUT_CANARY", "ghp_" + "Z" * 36):
            value = value.encode() if isinstance(value, str) else value
            self.assertNotIn(value, process.stdout)
            self.assertNotIn(value, process.stderr)
        self.assertEqual(process.stderr, b"", "CLI diagnostics must stay inside safe JSON")
        try:
            document = json.loads(process.stdout)
        except (ValueError, UnicodeError):
            self.fail("CLI did not emit exactly one JSON object")
        self.assertIsInstance(document, dict)
        if error is None:
            self.assertEqual(process.returncode, 0, document)
            if command != "snapshot":
                self.assertIs(document.get("ok"), True, document)
        else:
            self.assertIn(process.returncode, (2, 3, 4), document)
            self.assertIs(document.get("ok"), False, document)
            self.assertEqual(document.get("error"), error, document)
        return document

    def put(self, repo, path, content, mode=None):
        destination = repo / path
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(content.encode() if isinstance(content, str) else content)
        if mode is not None:
            destination.chmod(mode)
        return destination

    def external_json(self, name, document):
        path = self.base / name
        path.write_text(json.dumps(document), encoding="utf-8")
        return path

    def commit(self, repo, message):
        self.git(repo, "add", "-A")
        self.git(repo, "commit", "-m", message)
        return self.oid(repo)

    def oid(self, repo, revision="HEAD"):
        return self.git(repo, "rev-parse", "--verify", revision).decode().strip()

    def tree_paths(self, tip):
        return set(self.git(self.repo, "ls-tree", "-r", "--name-only", "-z", tip).decode().split("\0")) - {""}

    def blob(self, tip, path):
        return self.git(self.repo, "show", f"{tip}:{path}")

    def entry(self, tip, path):
        return self.git(self.repo, "ls-tree", tip, "--", path)

    def local_state(self, repo):
        index = Path(self.git(repo, "rev-parse", "--path-format=absolute", "--git-path", "index").decode().strip())
        files = {}
        for current, directories, names in os.walk(repo, followlinks=False):
            current = Path(current)
            if current == repo:
                directories[:] = [name for name in directories if name != ".git"]
                names = [name for name in names if name != ".git"]
            for name in directories + names:
                path = current / name
                relative = path.relative_to(repo).as_posix()
                info = path.lstat()
                mode = stat.S_IMODE(info.st_mode)
                if path.is_symlink():
                    files[relative] = ("symlink", mode, os.readlink(path))
                elif path.is_dir():
                    files[relative] = ("directory", mode)
                else:
                    files[relative] = ("file", mode, path.read_bytes())
        return {"head": self.oid(repo), "index": index.read_bytes(), "files": files}

    def snapshot(self, slug="20261011-safe-local-task", allowlist=None, error=None, forbidden=(), finish=None):
        self.sequence += 1
        brief_path = f".offload/{slug}/brief.md"
        request = {
            "slug": slug, "brief_path": brief_path,
            "source": {"host": "source.invalid", "path": str(self.repo)},
            "target": {"host": "target.invalid", "path": str(self.base / "target")},
            "mirror": {"url": "target.invalid:" + str(self.base / "mirror.git"), "path": str(self.base / "mirror.git"), "root": self.root},
        }
        request_path = self.external_json(f"request-{self.sequence}.json", request)
        prose = self.base / f"prose-{self.sequence}.md"
        sections = {
            "Goal": "Complete the isolated fixture change.",
            "State": "The source is a temporary local repository.",
            "Decisions": "Retain unrelated local work.",
            "Non-goals": "No network or service operations.",
            "Next steps": "Change the fixture work and record a Result.",
            "Dependencies": "Python and git.",
            "Access gaps": "None for this fixture.",
            "Verification": "Inspect the changed fixture bytes.",
            "Finish": finish or "Run python3 git_guard.py result --repo WORKTREE --expected RECEIPT.json --summary SUMMARY.json.",
        }
        prose.write_text("# Offload fixture\n\n" + "\n\n".join(f"## {heading}\n\n{text}" for heading, text in sections.items()) + "\n", encoding="utf-8")
        options = {"request": request_path, "brief_prose": prose}
        if allowlist is not None:
            options["allowlist"] = allowlist
        before = self.local_state(self.repo)
        receipt = self.cli("snapshot", error=error, forbidden=forbidden, **options)
        self.assertEqual(self.local_state(self.repo), before)
        if error is not None:
            return receipt, None
        self.assertEqual(receipt["schema"], 1)
        self.assertEqual(receipt["source_head"], before["head"])
        self.assertEqual(receipt["identity"], {
            "root": self.root, "slug": slug, "branch": f"offload/{slug}",
            "snapshot": receipt["identity"]["snapshot"], "brief_path": brief_path,
        })
        self.assertEqual(self.oid(self.repo, receipt["identity"]["branch"]), receipt["brief_commit"])
        self.assertEqual(self.git(self.repo, "show", "-s", "--format=%P", receipt["identity"]["snapshot"]).decode().strip(), before["head"])
        self.assertEqual(self.git(self.repo, "show", "-s", "--format=%P", receipt["brief_commit"]).decode().strip(), receipt["identity"]["snapshot"])
        self.assertNotIn(brief_path, self.tree_paths(receipt["identity"]["snapshot"]))
        delta = set(self.git(self.repo, "diff-tree", "--no-commit-id", "--name-only", "-r", receipt["brief_commit"]).decode().splitlines())
        self.assertEqual(delta, {brief_path, str(Path(brief_path).with_suffix(".json"))})
        return receipt, self.external_json(f"receipt-{self.sequence}.json", receipt)

    def worker(self, receipt):
        path = self.base / f"worker-{self.sequence}"
        self.git(self.repo, "worktree", "add", path, receipt["identity"]["branch"])
        return path

    def summary(self):
        return self.external_json("summary.json", {
            "state": "complete", "summary": "Completed the isolated binary fixture.",
            "verification": ["Inspected fixture bytes."], "limitations": [], "next_steps": [],
        })

    def record_result(self, worker, expected):
        before = self.oid(worker)
        response = self.cli("result", repo=worker, expected=expected, summary=self.summary())
        self.assertEqual(response["status"], "recorded")
        self.assertEqual(response["state"], "complete")
        self.assertEqual(response["next_steps"], [])
        self.assertEqual(response["work_tip"], before)
        self.assertEqual(response["result_commit"], self.oid(worker))
        self.assertEqual(self.git(worker, "show", "-s", "--format=%P", "HEAD").decode().strip(), before)
        self.assertEqual(self.git(worker, "status", "--porcelain", "--untracked-files=all"), b"")
        return response

    def ready_result(self):
        receipt, expected = self.snapshot()
        worker = self.worker(receipt)
        self.put(worker, "work.txt", "returned work\n")
        self.put(worker, "binary.dat", b"\x00returned\xfe\xff\x02\n")
        self.put(worker, "executable.sh", "#!/bin/sh\necho returned\n", 0o644)
        self.put(worker, "added.dat", b"new\x00binary\xff")
        self.commit(worker, "Implement fixture changes")
        result = self.record_result(worker, expected)
        return receipt, expected, worker, result

    def result_path(self, receipt):
        return (Path(receipt["identity"]["brief_path"]).parent / "result.json").as_posix()

    def forge_commit(self, parent, changes, parents=None):
        self.sequence += 1
        index = self.base / f"forged-index-{self.sequence}"
        env = {"GIT_INDEX_FILE": str(index)}
        self.git(self.repo, "read-tree", parent, extra_env=env)
        for path, content in changes.items():
            mode = "100644"
            if isinstance(content, tuple):
                mode, content = content
            content = content.encode() if isinstance(content, str) else content
            blob = self.git(self.repo, "hash-object", "-w", "--stdin", data=content).decode().strip()
            self.git(self.repo, "update-index", "--add", "--cacheinfo", mode, blob, path, extra_env=env)
        tree = self.git(self.repo, "write-tree", extra_env=env).decode().strip()
        arguments = ["commit-tree", tree]
        for commit in parents if parents is not None else [parent]:
            arguments.extend(["-p", commit])
        return self.git(self.repo, *arguments, data=b"Adversarial fixture commit\n").decode().strip()

    def assert_refused_without_writes(self, expected, result_commit, error):
        before = self.local_state(self.repo)
        self.cli("validate", expected=expected, result_commit=result_commit, error=error)
        self.assertEqual(self.local_state(self.repo), before)
        self.cli("apply", expected=expected, result_commit=result_commit, error=error)
        self.assertEqual(self.local_state(self.repo), before)

    def install_hook(self, pattern=r"OFFLOAD_CUSTOM_[A-Z]{12}", label="fixture rule", fail=False):
        hook = self.repo / ".git/hooks/pre-commit"
        source = (
            f"#!{sys.executable}\n"
            "import os\nimport re\nfrom pathlib import Path\n"
            f"PATTERNS = [({label!r}, re.compile({pattern!r}, re.IGNORECASE))]\n"
            "with (Path(os.environ['HOME']) / 'hook-events').open('a') as stream:\n"
            "    stream.write('normal commit\\n')\n"
            "print('HOOK_OUTPUT_CANARY')\n"
            "print('ghp_' + 'Z' * 36)\n"
        )
        if fail:
            source += "raise SystemExit(1)\n"
        hook.write_text(source, encoding="utf-8")
        hook.chmod(0o755)
        return hook

    def clone_worker(self, receipt, path):
        self.git(self.repo, "clone", "--no-local", "--single-branch", "--branch", receipt["identity"]["branch"], str(self.repo), str(path))
        self.git(path, "config", "user.name", "Offload Fixture")
        self.git(path, "config", "user.email", "fixture@example.invalid")
        self.git(path, "config", "commit.gpgsign", "false")
        self.git(path, "config", "core.hooksPath", str(path / ".git/hooks"))
        self.git(path, "config", "core.autocrlf", "false")
        self.git(path, "config", "core.filemode", "true")
        self.assertFalse((path / ".git/objects/info/alternates").exists())
        for key in ("policy_blob", "allowlist_blob"):
            self.assertIsNotNone(receipt[key])
            process = self.run_process(["git", "-C", path, "cat-file", "-e", receipt[key]], path)
            self.assertNotEqual(process.returncode, 0, f"Separate clone unexpectedly received {key}")
        return path

    def run_finish(self, worker, receipt, forbidden=()):
        prose = (worker / receipt["identity"]["brief_path"]).read_text(encoding="utf-8")
        finish = re.search(r"(?ms)^## Finish\n\n(.+?)(?:\n## |\Z)", prose)
        self.assertIsNotNone(finish, "Worker Brief lacks Finish instructions")
        command = shlex.split(finish.group(1).strip())
        return self.cli_response(self.run_process(command, worker), "result", forbidden=forbidden)


class GitGuardFixtures(OffloadFixture):
    def test_snapshot_preserves_index_head_files_binary_modes_and_partial_staging(self):
        self.put(self.repo, "deleted.txt", "remove me\n")
        self.put(self.repo, ".gitignore", "ignored.tmp\n")
        self.commit(self.repo, "Add source fixtures")
        self.put(self.repo, "work.txt", "staged work\n")
        self.git(self.repo, "add", "work.txt")
        self.put(self.repo, "work.txt", "working work\n")
        self.put(self.repo, "binary.dat", b"\x00staged\x80")
        self.git(self.repo, "add", "binary.dat")
        self.put(self.repo, "binary.dat", b"\x00working\xfe\xff")
        (self.repo / "deleted.txt").unlink()
        (self.repo / "executable.sh").chmod(0o644)
        self.put(self.repo, "new file.txt", "untracked included\n")
        self.put(self.repo, "ignored.tmp", "ignored local\n")
        os.symlink("work.txt", self.repo / "link")
        receipt, _ = self.snapshot()
        tip = receipt["identity"]["snapshot"]
        self.assertEqual(self.blob(tip, "work.txt"), b"working work\n")
        self.assertEqual(self.blob(tip, "binary.dat"), b"\x00working\xfe\xff")
        self.assertEqual(self.blob(tip, "new file.txt"), b"untracked included\n")
        self.assertTrue(self.entry(tip, "executable.sh").startswith(b"100644 blob "))
        self.assertTrue(self.entry(tip, "link").startswith(b"120000 blob "))
        self.assertEqual(self.blob(tip, "link"), b"work.txt")
        self.assertNotIn("deleted.txt", self.tree_paths(tip))
        self.assertNotIn("ignored.tmp", self.tree_paths(tip))

    def test_snapshot_holds_tracked_blocked_files_and_omits_new_blocked_files(self):
        tracked = ["nested/.ENV.production", "keys/server.PEM", "nested/.EnVdir/inside.txt", "vault/store.KDBX"]
        for path in tracked:
            self.put(self.repo, path, "safe tracked fixture\n", 0o755)
        self.commit(self.repo, "Add safe blocked-name fixtures")
        head = self.oid(self.repo)
        self.put(self.repo, tracked[0], "modified held fixture\n", 0o644)
        self.git(self.repo, "add", tracked[0])
        (self.repo / tracked[1]).unlink()
        self.put(self.repo, tracked[2], "unstaged held fixture\n", 0o644)
        (self.repo / tracked[3]).unlink()
        self.git(self.repo, "add", "-u")
        additions = ["nested/new.KEY", "keys/new.PfX", "new.P7m", "new.KdBx", "new/.Env.local", "new/.ENVdir/child.txt", ".mcp.json", "nested/.MCP.JSON"]
        for path in additions:
            self.put(self.repo, path, "safe omitted fixture\n")
        self.git(self.repo, "add", "--", additions[0], additions[4], additions[6])
        receipt, _ = self.snapshot()
        tip = receipt["identity"]["snapshot"]
        for path in tracked:
            with self.subTest(path=path):
                self.assertEqual(self.entry(tip, path), self.entry(head, path))
        for path in additions:
            with self.subTest(path=path):
                self.assertNotIn(path, self.tree_paths(tip))
        serialized = json.dumps(receipt)
        for path in tracked + additions:
            self.assertIn(path, serialized)

    def test_deleted_ordinary_historical_secret_blocks_scan_without_values(self):
        secret = "ghp_" + "A" * 36
        self.put(self.repo, "ordinary.txt", f"historical sample {secret}\n")
        bad_commit = self.commit(self.repo, "Add historical fixture")
        (self.repo / "ordinary.txt").unlink()
        tip = self.commit(self.repo, "Delete historical fixture")
        before = self.local_state(self.repo)
        response = self.cli("scan", tip=tip, error="UNSAFE_HISTORY", forbidden=[secret])
        self.assertTrue(any(hit["commit"] == bad_commit and hit["path"] == "ordinary.txt" and hit["rule"] == "github_token" for hit in response["hits"]))
        self.assertEqual(self.local_state(self.repo), before)
        self.cli("prep", free_bytes=15_000_000_000, error="UNSAFE_HISTORY", forbidden=[secret])
        self.snapshot(error="UNSAFE_HISTORY", forbidden=[secret])
        self.assertEqual(self.git(self.repo, "for-each-ref", "--format=%(refname)", "refs/heads/offload/"), b"")

    def test_age_public_recipient_is_allowed_but_private_identity_blocks_history(self):
        recipient = "age1" + "q" * 58
        self.put(self.repo, "recipients.txt", recipient + "\n")
        public_tip = self.commit(self.repo, "Public recipient fixture")
        scanned = self.cli("scan", tip=public_tip)
        self.assertEqual(scanned["tip"], public_tip)
        private_identity = "AGE-SECRET-KEY-1" + "K" * 59
        self.put(self.repo, "ordinary-age.txt", private_identity + "\n")
        private_tip = self.commit(self.repo, "Private identity fixture")
        response = self.cli("scan", tip=private_tip, error="UNSAFE_HISTORY", forbidden=[private_identity])
        self.assertTrue(any(hit["path"] == "ordinary-age.txt" and hit["rule"] == "age_private_key" for hit in response["hits"]))

    def test_fallback_rules_remain_active_when_a_literal_hook_policy_exists(self):
        self.install_hook()
        examples = {
            "private_key": "-----BEGIN " + "PRIVATE KEY-----",
            "age_private_key": "AGE-SECRET-KEY-1" + "J" * 59,
            "credential_assignment": "password" + "=fixturecredential",
            "bearer": "Bearer " + "A" * 24,
            "jwt": "eyJ" + "A" * 12 + "." + "B" * 12 + "." + "C" * 12,
            "aws_access_id": "AKIA" + "D" * 16,
            "github_token": "ghp_" + "H" * 36,
            "slack_token": "xoxb-" + "I" * 20,
        }
        for rule, value in examples.items():
            self.put(self.repo, f"fallback-{rule}.txt", value + "\n")
        self.git(self.repo, "add", "-A")
        tree = self.git(self.repo, "write-tree").decode().strip()
        tip = self.git(self.repo, "commit-tree", tree, "-p", "HEAD", data=b"Fallback coverage fixture\n").decode().strip()
        response = self.cli("scan", tip=tip, error="UNSAFE_HISTORY", forbidden=examples.values())
        observed = {(hit["path"], hit["rule"]) for hit in response["hits"]}
        for rule in examples:
            self.assertIn((f"fallback-{rule}.txt", rule), observed)
        self.assertFalse((Path(self.env["HOME"]) / "hook-events").exists())

    def test_scanner_deduplicates_object_path_rule_but_keeps_distinct_paths(self):
        secret = "ghp_" + "L" * 36
        content = secret + "\n"
        self.put(self.repo, "historical-example.txt", content)
        self.commit(self.repo, "Add repeated historical blob fixture")
        for number in range(3):
            self.put(self.repo, "work.txt", f"unrelated historical change {number}\n")
            tip = self.commit(self.repo, f"Unrelated fixture change {number}")
        blob = self.oid(self.repo, "HEAD:historical-example.txt")
        response = self.cli("scan", tip=tip, error="UNSAFE_HISTORY", forbidden=[secret])
        findings = [
            (hit["object"], hit["path"], hit["rule"], hit["commit"])
            for hit in response["hits"] if hit["object"] == blob
        ]
        self.assertEqual(findings, [(blob, "historical-example.txt", "github_token", tip)])
        self.put(self.repo, "another-example.txt", content)
        copied_tip = self.commit(self.repo, "Preserve same blob under another path")
        response = self.cli("scan", tip=copied_tip, error="UNSAFE_HISTORY", forbidden=[secret])
        findings = sorted(
            (hit["object"], hit["path"], hit["rule"], hit["commit"])
            for hit in response["hits"] if hit["object"] == blob
        )
        self.assertEqual(findings, [
            (blob, "another-example.txt", "github_token", copied_tip),
            (blob, "historical-example.txt", "github_token", copied_tip),
        ])

    def test_secret_in_binary_blob_is_not_skipped(self):
        secret = "ghp_" + "B" * 36
        self.put(self.repo, "opaque.bin", b"\x00\xff" + secret.encode() + b"\x00\xfe")
        tip = self.commit(self.repo, "Add binary fixture")
        response = self.cli("scan", tip=tip, error="UNSAFE_HISTORY", forbidden=[secret])
        self.assertTrue(any(hit["path"] == "opaque.bin" and hit["rule"] == "github_token" for hit in response["hits"]))

    def test_secret_in_commit_message_or_author_metadata_is_not_skipped(self):
        secret = "ghp_" + "C" * 36
        tree = self.oid(self.repo, "HEAD^{tree}")
        for field in ("message", "author"):
            with self.subTest(field=field):
                metadata = {"GIT_AUTHOR_NAME": secret} if field == "author" else None
                message = secret if field == "message" else "Safe fixture message"
                tip = self.git(self.repo, "commit-tree", tree, "-p", "HEAD", data=message.encode(), extra_env=metadata).decode().strip()
                response = self.cli("scan", tip=tip, error="UNSAFE_HISTORY", forbidden=[secret])
                self.assertTrue(any(hit["commit"] == tip and hit["path"] in (None, "<commit>") and hit["rule"] == "github_token" for hit in response["hits"]))

    def test_literal_policy_extraction_never_executes_hook_side_effects(self):
        secret = "OFFLOAD_CUSTOM_" + "A" * 12
        label = "SECRET_LABEL_MUST_NOT_ESCAPE"
        self.install_hook(label=label)
        self.put(self.repo, "custom.txt", secret + "\n")
        self.git(self.repo, "add", "custom.txt")
        tree = self.git(self.repo, "write-tree").decode().strip()
        tip = self.git(self.repo, "commit-tree", tree, "-p", "HEAD", data=b"Custom policy fixture\n").decode().strip()
        response = self.cli("scan", tip=tip, error="UNSAFE_HISTORY", forbidden=[secret, label, "OFFLOAD_CUSTOM_[A-Z]{12}", "HOOK_OUTPUT_CANARY"])
        self.assertTrue(any(hit["path"] == "custom.txt" and hit["rule"] == "policy_1" for hit in response["hits"]))
        self.assertFalse((Path(self.env["HOME"]) / "hook-events").exists())

    def test_unknown_dynamic_or_mutated_policy_fails_closed(self):
        patterns = [
            "PATTERNS = make_patterns()\n",
            "PATTERNS = [('dynamic', re.compile(os.environ['PATTERN']))]\n",
            "PATTERNS = [('literal', re.compile('safe'))]\nPATTERNS.append(('more', re.compile('other')))\n",
            "PATTERNS = [('literal', re.compile('safe'))]\nPATTERNS[0] = ('changed', re.compile('other'))\n",
            "PATTERNS = [(label, re.compile(value)) for label, value in []]\n",
            "PATTERNS = [('literal', re.compile('safe', unknown_flag))]\n",
        ]
        hook = self.repo / ".git/hooks/pre-commit"
        for source in patterns:
            with self.subTest(source=source):
                hook.write_text("#!/usr/bin/env python3\nimport re\nimport os\n" + source, encoding="utf-8")
                hook.chmod(0o755)
                before = self.local_state(self.repo)
                self.cli("scan", tip=self.root, error="UNSUPPORTED_SECRET_POLICY", forbidden=[source.strip()])
                self.assertEqual(self.local_state(self.repo), before)

    def test_normal_brief_and_result_commits_run_hooks_and_hide_output(self):
        self.install_hook()
        receipt, expected = self.snapshot()
        events = Path(self.env["HOME"]) / "hook-events"
        self.assertEqual(events.read_text(), "normal commit\n")
        self.assertIsNotNone(receipt["policy_blob"])
        worker = self.worker(receipt)
        result = self.record_result(worker, expected)
        self.assertEqual(events.read_text(), "normal commit\nnormal commit\n")
        repeated = self.cli("result", repo=worker, expected=expected, summary=self.summary(), forbidden=["HOOK_OUTPUT_CANARY", "ghp_" + "Z" * 36])
        self.assertEqual(repeated["status"], "already_recorded")
        self.assertEqual(repeated["result_commit"], result["result_commit"])
        self.assertEqual(events.read_text(), "normal commit\nnormal commit\n")
        self.cli("validate", expected=expected, result_commit=result["result_commit"])

    def test_valid_binary_apply_returns_brief_result_and_preserves_dirty_index_and_head(self):
        receipt, expected, worker, result = self.ready_result()
        self.put(self.repo, "unrelated.txt", "staged unrelated\n")
        self.git(self.repo, "add", "unrelated.txt")
        self.put(self.repo, "unrelated.txt", "working unrelated\n")
        self.put(self.repo, "local-only.txt", "untracked unrelated\n")
        before = self.local_state(self.repo)
        validated = self.cli("validate", expected=expected, result_commit=result["result_commit"])
        self.assertEqual(validated["work_tip"], result["work_tip"])
        applied = self.cli("apply", expected=expected, result_commit=result["result_commit"])
        self.assertEqual(applied["status"], "applied")
        after = self.local_state(self.repo)
        self.assertEqual(after["head"], before["head"])
        self.assertEqual(after["index"], before["index"])
        self.assertEqual((self.repo / "unrelated.txt").read_bytes(), b"working unrelated\n")
        self.assertEqual((self.repo / "local-only.txt").read_bytes(), b"untracked unrelated\n")
        self.assertEqual((self.repo / "work.txt").read_bytes(), b"returned work\n")
        self.assertEqual((self.repo / "binary.dat").read_bytes(), b"\x00returned\xfe\xff\x02\n")
        self.assertEqual((self.repo / "added.dat").read_bytes(), b"new\x00binary\xff")
        self.assertEqual(stat.S_IMODE((self.repo / "executable.sh").stat().st_mode), 0o644)
        for path in (receipt["identity"]["brief_path"], str(Path(receipt["identity"]["brief_path"]).with_suffix(".json")), self.result_path(receipt)):
            self.assertEqual((self.repo / path).read_bytes(), (worker / path).read_bytes())
            self.assertIn(path, applied["paths"])
        document = json.loads((self.repo / self.result_path(receipt)).read_bytes())
        self.assertEqual(document["identity"], receipt["identity"])
        self.assertEqual(document["work_tip"], result["work_tip"])
        repeated = self.cli("apply", expected=expected, result_commit=result["result_commit"])
        self.assertEqual(repeated["status"], "already_applied")
        self.assertEqual(self.local_state(self.repo), after)

    def test_conflict_has_zero_partial_writes_even_for_nonconflicting_binary_files(self):
        _, expected, _, result = self.ready_result()
        self.put(self.repo, "work.txt", "receiver conflicting work\n")
        self.put(self.repo, "unrelated.txt", "receiver unrelated\n")
        before = self.local_state(self.repo)
        response = self.cli("apply", expected=expected, result_commit=result["result_commit"], error="APPLY_CONFLICT")
        self.assertIn("work.txt", json.dumps(response))
        self.assertEqual(self.local_state(self.repo), before)
        self.assertFalse((self.repo / "added.dat").exists())

    def test_result_identity_work_tip_parent_and_note_only_delta_are_bound(self):
        receipt, expected, _, result = self.ready_result()
        path = self.result_path(receipt)
        original = json.loads(self.blob(result["result_commit"], path))
        cases = []
        altered = copy.deepcopy(original)
        altered["identity"]["slug"] = "20261011-other-local-task"
        cases.append(("identity", altered, {}, None))
        altered = copy.deepcopy(original)
        altered["work_tip"] = receipt["brief_commit"]
        cases.append(("work tip", altered, {}, None))
        cases.append(("extra file", original, {"unexpected.txt": b"unreviewed extra\n"}, None))
        cases.append(("wrong parent", original, {}, [receipt["brief_commit"]]))
        cases.append(("multiple parents", original, {}, [result["work_tip"], receipt["brief_commit"]]))
        for name, document, extra, parents in cases:
            with self.subTest(name=name):
                forged = self.forge_commit(result["work_tip"], {path: json.dumps(document), **extra}, parents)
                self.assert_refused_without_writes(expected, forged, "INVALID_RESULT")

    def test_brief_bytes_modes_and_modify_then_revert_history_are_bound(self):
        receipt, expected = self.snapshot()
        brief = receipt["identity"]["brief_path"]
        metadata = str(Path(brief).with_suffix(".json"))
        for name, path, mode, content in (
            ("prose bytes", brief, "100644", b"tampered prose\n"),
            ("metadata bytes", metadata, "100644", b"{}\n"),
            ("prose mode", brief, "100755", self.blob(receipt["brief_commit"], brief)),
        ):
            with self.subTest(name=name):
                work_tip = self.forge_commit(receipt["brief_commit"], {path: (mode, content)})
                document = {"schema": 1, "identity": receipt["identity"], "work_tip": work_tip, "state": "complete", "summary": "Fixture completion", "verification": [], "limitations": [], "next_steps": []}
                note = self.forge_commit(work_tip, {self.result_path(receipt): json.dumps(document)})
                self.assert_refused_without_writes(expected, note, "BRIEF_CHANGED")
        mutated = self.forge_commit(receipt["brief_commit"], {brief: b"temporary tampering\n"})
        reverted = self.forge_commit(mutated, {brief: self.blob(receipt["brief_commit"], brief)})
        document = {"schema": 1, "identity": receipt["identity"], "work_tip": reverted, "state": "complete", "summary": "Fixture completion", "verification": [], "limitations": [], "next_steps": []}
        note = self.forge_commit(reverted, {self.result_path(receipt): json.dumps(document)})
        self.assert_refused_without_writes(expected, note, "BRIEF_CHANGED")

    def test_wrong_branch_and_dirty_worker_refuse_result_before_writes(self):
        receipt, expected = self.snapshot()
        worker = self.worker(receipt)
        self.git(worker, "switch", "-c", "wrong-worker-branch")
        before = self.local_state(worker)
        self.cli("result", repo=worker, expected=expected, summary=self.summary(), error="WRONG_BRANCH")
        self.assertEqual(self.local_state(worker), before)
        self.git(worker, "switch", receipt["identity"]["branch"])
        for name, path in (("tracked", "work.txt"), ("untracked", "worker-only.txt")):
            with self.subTest(name=name):
                self.put(worker, path, "dirty worker\n")
                before = self.local_state(worker)
                self.cli("result", repo=worker, expected=expected, summary=self.summary(), error="DIRTY_WORKTREE")
                self.assertEqual(self.local_state(worker), before)
                if name == "tracked":
                    self.put(worker, path, "base work\n")
                else:
                    (worker / path).unlink()

    def test_source_authoritative_policy_survives_target_hook_removal(self):
        hook = self.install_hook()
        receipt, expected = self.snapshot()
        self.assertIsNotNone(receipt["policy_blob"])
        hook.unlink()
        worker = self.worker(receipt)
        secret = "OFFLOAD_CUSTOM_" + "D" * 12
        self.put(worker, "remote.txt", secret + "\n")
        self.commit(worker, "Target lacks source policy")
        result = self.record_result(worker, expected)
        before = self.local_state(self.repo)
        self.cli("validate", expected=expected, result_commit=result["result_commit"], error="UNSAFE_HISTORY", forbidden=[secret])
        self.cli("apply", expected=expected, result_commit=result["result_commit"], error="UNSAFE_HISTORY", forbidden=[secret])
        self.assertEqual(self.local_state(self.repo), before)

    def test_reviewed_allowance_is_exact_object_path_rule_and_never_prints_reason(self):
        sample = "ghp_" + "E" * 36
        self.put(self.repo, "documented-example.txt", sample + "\n")
        tip = self.commit(self.repo, "Document nonproduction sample")
        refused = self.cli("scan", tip=tip, error="UNSAFE_HISTORY", forbidden=[sample])
        hit = next(hit for hit in refused["hits"] if hit["path"] == "documented-example.txt")
        reason = "REVIEW_REASON_MUST_NOT_BE_RENDERED"
        entry = {"object": hit["object"], "path": hit["path"], "rule": hit["rule"], "reason": reason}
        allowance = self.external_json("allowance.json", [entry])
        self.cli("scan", tip=tip, allowlist=allowance, forbidden=[sample, reason])
        for field, wrong in (("object", self.root), ("path", "different.txt"), ("rule", "private_key")):
            with self.subTest(field=field):
                invalid = self.external_json("wrong-allowance.json", [{**entry, field: wrong}])
                self.cli("scan", tip=tip, allowlist=invalid, error="UNSAFE_HISTORY", forbidden=[sample, reason])
        self.put(self.repo, "documented-example.txt", "changed example\n" + sample + "\n")
        changed = self.commit(self.repo, "Change previously reviewed object")
        response = self.cli("scan", tip=changed, allowlist=allowance, error="UNSAFE_HISTORY", forbidden=[sample, reason])
        changed_blob = self.oid(self.repo, "HEAD:documented-example.txt")
        self.assertNotEqual(changed_blob, entry["object"])
        self.assertTrue(any(hit["object"] == changed_blob and hit["path"] == entry["path"] for hit in response["hits"]))

    def test_metadata_allowance_requires_exact_commit_identity(self):
        sample = "ghp_" + "F" * 36
        tree = self.oid(self.repo, "HEAD^{tree}")
        tip = self.git(self.repo, "commit-tree", tree, "-p", "HEAD", data=sample.encode()).decode().strip()
        response = self.cli("scan", tip=tip, error="UNSAFE_HISTORY", forbidden=[sample])
        hit = next(hit for hit in response["hits"] if hit["object"] == tip)
        allowance = self.external_json("metadata-allowance.json", [{"object": tip, "path": "<commit>", "rule": hit["rule"], "reason": "Reviewed generated metadata sample"}])
        self.cli("scan", tip=tip, allowlist=allowance, forbidden=[sample, "Reviewed generated metadata sample"])
        changed = self.git(self.repo, "commit-tree", tree, "-p", "HEAD", data=(sample + " changed").encode()).decode().strip()
        self.cli("scan", tip=changed, allowlist=allowance, error="UNSAFE_HISTORY", forbidden=[sample])

    def test_source_allowance_is_retained_for_result_validation_and_apply(self):
        sample = "ghp_" + "G" * 36
        self.put(self.repo, "reviewed.txt", sample + "\n")
        tip = self.commit(self.repo, "Reviewed sample fixture")
        response = self.cli("scan", tip=tip, error="UNSAFE_HISTORY", forbidden=[sample])
        hit = next(hit for hit in response["hits"] if hit["path"] == "reviewed.txt")
        allowance = self.external_json("retained-allowance.json", [{"object": hit["object"], "path": hit["path"], "rule": hit["rule"], "reason": "Reviewed isolated fixture sample"}])
        receipt, expected = self.snapshot(allowlist=allowance, forbidden=[sample, "Reviewed isolated fixture sample"])
        self.assertIsNotNone(receipt["allowlist_blob"])
        worker = self.worker(receipt)
        result = self.cli("result", repo=worker, expected=expected, summary=self.summary(), allowlist=allowance, forbidden=[sample])
        self.cli("validate", expected=expected, result_commit=result["result_commit"], forbidden=[sample, "Reviewed isolated fixture sample"])
        applied = self.cli("apply", expected=expected, result_commit=result["result_commit"], forbidden=[sample, "Reviewed isolated fixture sample"])
        self.assertEqual(applied["status"], "applied")

    def test_snapshot_refuses_untracked_nested_repository_without_source_writes(self):
        nested = self.repo / "nested-repository"
        nested.mkdir()
        self.git(nested, "init", "--initial-branch=main")
        self.put(nested, "nested.txt", "nested work\n")
        self.commit(nested, "Nested fixture root")
        response, _ = self.snapshot(error="UNREPRESENTABLE_NESTED_WORKTREE")
        self.assertIn("nested-repository", response["paths"])
        self.assertEqual(self.git(self.repo, "for-each-ref", "--format=%(refname)", "refs/heads/offload/"), b"")

    def test_clean_submodule_is_reported_and_dirty_submodule_refuses(self):
        dependency = self.base / "dependency"
        dependency.mkdir()
        self.git(dependency, "init", "--initial-branch=main")
        self.put(dependency, "dependency.txt", "dependency work\n")
        dependency_tip = self.commit(dependency, "Dependency fixture root")
        self.git(self.repo, "submodule", "add", str(dependency), "dependency")
        self.commit(self.repo, "Track clean dependency")
        receipt, _ = self.snapshot()
        self.assertIn({"path": "dependency", "commit": dependency_tip}, receipt["dependencies"])
        self.put(self.repo / "dependency", "dependency.txt", "dirty dependency work\n")
        response, _ = self.snapshot(slug="20261011-dirty-sub-task", error="UNREPRESENTABLE_NESTED_WORKTREE")
        self.assertIn("dependency", response["paths"])

    def test_prep_threshold_and_dirty_filename_report_preserve_source(self):
        self.put(self.repo, "work.txt", "dirty tracked fixture\n")
        self.put(self.repo, "new-local.txt", "untracked fixture\n")
        before = self.local_state(self.repo)
        self.cli("prep", free_bytes=14_999_999_999, error="INSUFFICIENT_SPACE")
        self.assertEqual(self.local_state(self.repo), before)
        response = self.cli("prep", free_bytes=15_000_000_000)
        self.assertEqual(response["head"], self.root)
        self.assertEqual(response["root"], self.root)
        self.assertEqual(response["free_bytes"], 15_000_000_000)
        self.assertIn("work.txt", response["dirty"])
        self.assertIn("new-local.txt", response["untracked"])
        self.assertEqual(self.local_state(self.repo), before)

    def test_prep_equal_ahead_behind_and_divergent_histories(self):
        response = self.cli("prep", free_bytes=15_000_000_000, peer_tip=self.root)
        self.assertEqual(response["head"], self.root)
        self.assertEqual(response["peer_tip"], self.root)
        self.assertEqual(response["source_only"], [])
        self.assertEqual(response["peer_only"], [])
        self.put(self.repo, "work.txt", "source ahead\n")
        ahead = self.commit(self.repo, "Source ahead fixture")
        before = self.local_state(self.repo)
        response = self.cli("prep", free_bytes=15_000_000_000, peer_tip=self.root)
        self.assertEqual(response["source_only"], [ahead])
        self.assertEqual(response["peer_only"], [])
        self.assertEqual(self.local_state(self.repo), before)
        peer_ahead = self.forge_commit(ahead, {"peer.txt": b"peer ahead\n"})
        response = self.cli("prep", free_bytes=15_000_000_000, peer_tip=peer_ahead)
        self.assertEqual(response["head"], ahead)
        self.assertEqual(response["peer_tip"], peer_ahead)
        self.assertEqual(response["source_only"], [])
        self.assertEqual(response["peer_only"], [peer_ahead])
        self.assertEqual(self.local_state(self.repo), before)
        divergent = self.forge_commit(self.root, {"peer.txt": b"divergent peer\n"})
        self.cli("prep", free_bytes=15_000_000_000, peer_tip=divergent, error="DIVERGED")
        self.assertEqual(self.local_state(self.repo), before)

    def test_prep_refuses_peer_from_different_root(self):
        tree = self.oid(self.repo, "HEAD^{tree}")
        different_root = self.git(self.repo, "commit-tree", tree, data=b"Different root fixture\n").decode().strip()
        before = self.local_state(self.repo)
        self.cli("prep", free_bytes=15_000_000_000, peer_tip=different_root, error="ROOT_MISMATCH")
        self.assertEqual(self.local_state(self.repo), before)


    def test_prep_refuses_ambiguous_multiple_roots(self):
        tree = self.oid(self.repo, "HEAD^{tree}")
        other_root = self.git(self.repo, "commit-tree", tree, data=b"Independent root fixture\n").decode().strip()
        merged = self.forge_commit(self.root, {}, parents=[self.root, other_root])
        before = self.local_state(self.repo)
        self.cli("prep", free_bytes=15_000_000_000, peer_tip=merged, error="AMBIGUOUS_HISTORY")
        self.assertEqual(self.local_state(self.repo), before)

    def test_missing_source_authoritative_policy_object_refuses_receiver(self):
        hook = self.install_hook()
        receipt, expected = self.snapshot()
        hook.unlink()
        worker = self.worker(receipt)
        result = self.record_result(worker, expected)
        policy = receipt["policy_blob"]
        (self.repo / ".git/objects" / policy[:2] / policy[2:]).unlink()
        self.assert_refused_without_writes(expected, result["result_commit"], "MISSING_OBJECT")

    def test_snapshot_brief_symlink_ancestor_cannot_write_outside_repository(self):
        outside = self.base / "outside-brief"
        outside.mkdir()
        sentinel = self.put(outside, "sentinel.txt", "outside must remain unchanged\n", 0o600)
        os.symlink(str(outside), self.repo / ".offload")
        self.commit(self.repo, "Track external Brief ancestor symlink")
        self.snapshot(error="UNSAFE_RECORD_PATH")
        self.assertEqual(set(outside.iterdir()), {sentinel})
        self.assertEqual(sentinel.read_bytes(), b"outside must remain unchanged\n")
        self.assertEqual(stat.S_IMODE(sentinel.stat().st_mode), 0o600)


    def test_held_original_mcp_configuration_remains_allowed_and_unchanged(self):
        original = b'{"mcpServers":{"fixture":{"command":"fixture-tool","args":["--offline"]}}}\n'
        self.put(self.repo, ".mcp.json", original)
        self.commit(self.repo, "Track harmless original MCP configuration")
        self.put(self.repo, ".mcp.json", b'{"mcpServers":{"local":{"command":"local-only-tool"}}}\n')
        receipt, expected = self.snapshot()
        self.assertEqual(self.blob(receipt["identity"]["snapshot"], ".mcp.json"), original)
        worker = self.worker(receipt)
        self.assertEqual((worker / ".mcp.json").read_bytes(), original)
        result = self.record_result(worker, expected)
        before = self.local_state(self.repo)
        self.cli("validate", expected=expected, result_commit=result["result_commit"])
        applied = self.cli("apply", expected=expected, result_commit=result["result_commit"])
        self.assertEqual(applied["status"], "applied")
        after = self.local_state(self.repo)
        self.assertEqual(after["head"], before["head"])
        self.assertEqual(after["index"], before["index"])
        self.assertEqual(after["files"][".mcp.json"], before["files"][".mcp.json"])

    def test_mcp_return_add_modify_delete_and_restored_history_refuse_all_commands(self):
        original = b'{"mcpServers":{"fixture":{"command":"fixture-tool","args":["--offline"]}}}\n'
        changed = b'{"mcpServers":{"other":{"command":"different-fixture-tool"}}}\n'
        self.put(self.repo, ".mcp.json", original)
        self.commit(self.repo, "Track original harmless MCP fixture")
        for case in ("new", "mod", "del", "restore", "removed"):
            with self.subTest(case=case):
                receipt, expected = self.snapshot(slug=f"20261011-{case[:3]}-mcp-test")
                worker = self.worker(receipt)
                path = "nested/.MCP.JSON" if case in ("new", "removed") else ".mcp.json"
                if case == "del":
                    (worker / path).unlink()
                else:
                    self.put(worker, path, changed)
                mutation = self.commit(worker, f"Harmless MCP mutation {case}")
                if case == "restore":
                    self.put(worker, path, original)
                    self.commit(worker, "Restore original MCP bytes")
                elif case == "removed":
                    (worker / path).unlink()
                    self.commit(worker, "Remove newly introduced MCP file")
                work_tip = self.oid(worker)
                before = self.local_state(worker)
                refused = self.cli("result", repo=worker, expected=expected, summary=self.summary(), error="MCP_CONFIG_CHANGED")
                self.assertIn(path, refused["paths"])
                self.assertEqual(refused["commit"], mutation)
                self.assertEqual(self.local_state(worker), before)
                document = {
                    "schema": 1, "identity": receipt["identity"], "work_tip": work_tip,
                    "state": "complete", "summary": "Harmless configuration fixture",
                    "verification": [], "limitations": [], "next_steps": [],
                }
                note = self.forge_commit(work_tip, {self.result_path(receipt): json.dumps(document)})
                self.assert_refused_without_writes(expected, note, "MCP_CONFIG_CHANGED")

    def test_failed_post_checkout_hook_deregisters_exact_owned_worktree(self):
        unrelated = self.base / "unrelated-registered-worktree"
        self.git(self.repo, "worktree", "add", "--detach", str(unrelated), self.root)
        unrelated.rename(self.base / "relocated-unrelated-worktree")
        marker = Path(self.env["HOME"]) / "post-checkout-owned-path"
        hook = self.repo / ".git/hooks/post-checkout"
        hook.write_text(
            f"#!{sys.executable}\nimport os\nfrom pathlib import Path\n"
            f"Path({str(marker)!r}).write_text(os.getcwd())\n"
            "print('POST_CHECKOUT_PRIVATE_CANARY')\nraise SystemExit(1)\n",
            encoding="utf-8",
        )
        hook.chmod(0o755)
        registry = self.git(self.repo, "worktree", "list", "--porcelain", "-z")
        self.snapshot(error="GIT_FAILED", forbidden=["POST_CHECKOUT_PRIVATE_CANARY"])
        owned = Path(marker.read_text())
        self.assertFalse(owned.exists(), "Failed checkout leaked its owned directory")
        self.assertFalse(owned.parent.exists(), "Failed checkout leaked its temporary parent")
        self.assertEqual(self.git(self.repo, "worktree", "list", "--porcelain", "-z"), registry)
        self.assertEqual(self.git(self.repo, "for-each-ref", "--format=%(refname)", "refs/heads/offload/"), b"")

    def test_failed_owned_deregistration_retains_and_reports_exact_locked_worktree(self):
        marker = Path(self.env["HOME"]) / "locked-owned-path"
        hook = self.repo / ".git/hooks/post-checkout"
        hook.write_text(
            f"#!{sys.executable}\nimport os\nimport subprocess\nfrom pathlib import Path\n"
            f"Path({str(marker)!r}).write_text(os.getcwd())\n"
            "subprocess.run(['git', 'worktree', 'lock', '--reason', 'owned fixture lock', os.getcwd()], check=True)\n"
            "print('LOCKED_CHECKOUT_PRIVATE_CANARY')\nraise SystemExit(1)\n",
            encoding="utf-8",
        )
        hook.chmod(0o755)
        registry = self.git(self.repo, "worktree", "list", "--porcelain", "-z")

        def release_owned_worktree():
            if not marker.exists():
                return
            owned = Path(marker.read_text())
            registered = self.git(self.repo, "worktree", "list", "--porcelain", "-z")
            if ("worktree " + str(owned)).encode() + b"\0" in registered:
                self.git(self.repo, "worktree", "unlock", str(owned))
                self.git(self.repo, "worktree", "remove", "--force", str(owned))
            if owned.parent.exists():
                owned.parent.rmdir()

        self.addCleanup(release_owned_worktree)
        response, _ = self.snapshot(error="OWNED_WORKTREE_CLEANUP_FAILED", forbidden=["LOCKED_CHECKOUT_PRIVATE_CANARY"])
        owned = Path(marker.read_text())
        self.assertEqual(response["owned_worktree"], str(owned))
        self.assertEqual(response["owned_directory"], str(owned.parent))
        self.assertTrue(owned.is_dir(), "Failed deregistration must retain its owned checkout")
        self.assertTrue((owned / ".git").is_file())
        registered = self.git(self.repo, "worktree", "list", "--porcelain", "-z")
        self.assertIn(("worktree " + str(owned)).encode() + b"\0", registered)
        self.assertIn(b"locked owned fixture lock\0", registered)
        release_owned_worktree()
        self.assertEqual(self.git(self.repo, "worktree", "list", "--porcelain", "-z"), registry)

    def test_re_module_compiler_flag_rebinding_and_escape_fail_without_execution(self):
        marker = Path(self.env["HOME"]) / "policy-extraction-side-effect"
        replacements = [
            "original_compile = re.compile\n"
            "def wrapped(pattern, flags=0):\n"
            "    return original_compile(pattern + '|EXTRA_[A-Z]{12}', flags)\n"
            "re.compile = wrapped\n",
            "re = object()\n",
            "from os import path as re\n",
            "import os as re\n",
            "def hidden(re):\n    return re\n",
            "class re:\n    pass\n",
            "re.IGNORECASE = 0\n",
            "del re.compile\n",
            "setattr(re, 'compile', lambda value: value)\n",
            "escaped_module = re\n",
            "capture_module(re)\n",
        ]
        hook = self.repo / ".git/hooks/pre-commit"
        for replacement in replacements:
            with self.subTest(replacement=replacement):
                source = (
                    f"#!{sys.executable}\nimport re\nfrom pathlib import Path\n"
                    f"Path({str(marker)!r}).write_text('must never execute')\n"
                    + replacement
                    + "PATTERNS = [('literal', re.compile('OFFLOAD_CUSTOM_[A-Z]{12}', re.IGNORECASE))]\n"
                )
                hook.write_text(source, encoding="utf-8")
                hook.chmod(0o755)
                before = self.local_state(self.repo)
                self.cli("scan", tip=self.root, error="UNSUPPORTED_SECRET_POLICY", forbidden=["OFFLOAD_CUSTOM_[A-Z]{12}"])
                self.assertFalse(marker.exists(), "Static extraction executed the hook")
                self.assertEqual(self.local_state(self.repo), before)

    def test_separate_policy_allowance_worker_follows_finish_and_binds_exact_hook_bytes(self):
        source_hook = self.install_hook()
        source_policy = source_hook.read_bytes()
        sample = "OFFLOAD_CUSTOM_" + "M" * 12
        self.put(self.repo, "reviewed-custom.txt", sample + "\n")
        tip = self.commit(self.repo, "Reviewed custom policy example")
        response = self.cli("scan", tip=tip, error="UNSAFE_HISTORY", forbidden=[sample])
        hit = next(hit for hit in response["hits"] if hit["path"] == "reviewed-custom.txt")
        self.assertEqual(hit["rule"], "policy_1")
        private = self.base / "worker-private"
        private.mkdir()
        allowance = self.external_json("worker-private/allowances.json", [{
            "object": hit["object"], "path": hit["path"], "rule": hit["rule"],
            "reason": "Reviewed separate worker custom example",
        }])
        expected_worker = private / "receipt.json"
        summary = self.summary()
        worker = self.base / "separate-policy-worker"
        finish = shlex.join([
            sys.executable, str(HELPER), "result", "--repo", str(worker),
            "--expected", str(expected_worker), "--summary", str(summary), "--allowlist", str(allowance),
        ])
        receipt, expected_source = self.snapshot(allowlist=allowance, forbidden=[sample], finish=finish)
        expected_worker.write_bytes(expected_source.read_bytes())
        self.clone_worker(receipt, worker)
        target_hook = worker / ".git/hooks/pre-commit"
        reordered = source_policy.replace(
            b"PATTERNS = [",
            b"PATTERNS = [('different rule', re.compile('UNRELATED_[A-Z]{12}')), ",
            1,
        )
        for policy in (None, source_policy + b"\n", reordered):
            with self.subTest(target_policy="absent" if policy is None else "changed"):
                if policy is None:
                    if target_hook.exists():
                        target_hook.unlink()
                else:
                    target_hook.write_bytes(policy)
                    target_hook.chmod(0o755)
                before = self.local_state(worker)
                self.cli("result", repo=worker, expected=expected_worker, summary=summary, allowlist=allowance, error="ALLOWLIST_POLICY_MISMATCH", forbidden=[sample])
                self.assertEqual(self.local_state(worker), before)
        target_hook.write_bytes(source_policy)
        target_hook.chmod(0o755)
        for key in ("policy_blob", "allowlist_blob"):
            absent = self.run_process(["git", "-C", worker, "cat-file", "-e", receipt[key]], worker)
            self.assertNotEqual(absent.returncode, 0)
        work_tip = self.oid(worker)
        result = self.run_finish(worker, receipt, forbidden=[sample, "Reviewed separate worker custom example"])
        self.assertEqual(result["status"], "recorded")
        self.assertEqual(result["work_tip"], work_tip)
        self.assertEqual(result["result_commit"], self.oid(worker))
        self.git(self.repo, "fetch", "--no-tags", str(worker), result["result_commit"] + ":refs/offload-verification/policy-result")
        validated = self.cli("validate", expected=expected_source, result_commit=result["result_commit"], forbidden=[sample])
        self.assertEqual(validated["work_tip"], work_tip)
        before = self.local_state(self.repo)
        applied = self.cli("apply", expected=expected_source, result_commit=result["result_commit"], forbidden=[sample])
        self.assertEqual(applied["status"], "applied")
        after = self.local_state(self.repo)
        self.assertEqual(after["head"], before["head"])
        self.assertEqual(after["index"], before["index"])

    def test_separate_fallback_allowance_worker_follows_finish_without_target_hook(self):
        self.install_hook()
        sample = "ghp_" + "N" * 36
        self.put(self.repo, "reviewed-fallback.txt", sample + "\n")
        tip = self.commit(self.repo, "Reviewed fallback example")
        response = self.cli("scan", tip=tip, error="UNSAFE_HISTORY", forbidden=[sample])
        hit = next(hit for hit in response["hits"] if hit["path"] == "reviewed-fallback.txt")
        self.assertEqual(hit["rule"], "github_token")
        private = self.base / "fallback-worker-private"
        private.mkdir()
        allowance = self.external_json("fallback-worker-private/allowances.json", [{
            "object": hit["object"], "path": hit["path"], "rule": hit["rule"],
            "reason": "Reviewed separate worker fallback example",
        }])
        expected_worker = private / "receipt.json"
        summary = self.summary()
        worker = self.base / "separate-fallback-worker"
        finish = shlex.join([
            sys.executable, str(HELPER), "result", "--repo", str(worker),
            "--expected", str(expected_worker), "--summary", str(summary), "--allowlist", str(allowance),
        ])
        receipt, expected_source = self.snapshot(allowlist=allowance, forbidden=[sample], finish=finish)
        expected_worker.write_bytes(expected_source.read_bytes())
        self.clone_worker(receipt, worker)
        self.assertFalse((worker / ".git/hooks/pre-commit").exists())
        result = self.run_finish(worker, receipt, forbidden=[sample, "Reviewed separate worker fallback example"])
        self.assertEqual(result["status"], "recorded")
        self.git(self.repo, "fetch", "--no-tags", str(worker), result["result_commit"] + ":refs/offload-verification/fallback-result")
        self.cli("validate", expected=expected_source, result_commit=result["result_commit"], forbidden=[sample])
        applied = self.cli("apply", expected=expected_source, result_commit=result["result_commit"], forbidden=[sample])
        self.assertEqual(applied["status"], "applied")


    def test_paused_checkpoint_records_validates_applies_and_repeats_without_completion(self):
        receipt, expected = self.snapshot()
        worker = self.worker(receipt)
        checkpoint = b"\x00paused checkpoint\xff\n"
        self.put(worker, "binary.dat", checkpoint)
        self.put(worker, "work.txt", "partial checkpoint work\n")
        work_tip = self.commit(worker, "Commit paused fixture checkpoint")
        self.assertEqual((worker / "binary.dat").read_bytes(), checkpoint)
        paused = {
            "state": "paused",
            "summary": "Saved the partial fixture checkpoint for move-back.",
            "verification": ["Inspected the checkpoint binary bytes."],
            "limitations": ["The remaining implementation is not in this checkpoint."],
            "next_steps": ["Complete the remaining fixture implementation.", "Run the final acceptance checks."],
        }
        summary = self.external_json("paused-summary.json", paused)
        result = self.cli("result", repo=worker, expected=expected, summary=summary)
        self.assertEqual(result["status"], "recorded")
        self.assertEqual(result["state"], "paused")
        self.assertEqual(result["next_steps"], paused["next_steps"])
        self.assertEqual(result["work_tip"], work_tip)
        self.assertEqual(result["result_commit"], self.oid(worker))
        self.assertEqual(self.git(worker, "show", "-s", "--format=%P", "HEAD").decode().strip(), work_tip)
        delta = self.git(worker, "diff-tree", "--no-commit-id", "--name-only", "-r", "HEAD").decode().splitlines()
        self.assertEqual(delta, [self.result_path(receipt)])
        note = json.loads((worker / self.result_path(receipt)).read_bytes())
        self.assertEqual(note, {"schema": 1, "identity": receipt["identity"], "work_tip": work_tip, **paused})
        worker_before = self.local_state(worker)
        repeated = self.cli("result", repo=worker, expected=expected, summary=summary)
        self.assertEqual(repeated["status"], "already_recorded")
        self.assertEqual(repeated["result_commit"], result["result_commit"])
        self.assertEqual(repeated["state"], "paused")
        self.assertEqual(repeated["next_steps"], paused["next_steps"])
        self.assertEqual(self.local_state(worker), worker_before)
        self.put(self.repo, "unrelated.txt", "staged unrelated paused receiver\n")
        self.git(self.repo, "add", "unrelated.txt")
        self.put(self.repo, "unrelated.txt", "working unrelated paused receiver\n")
        self.put(self.repo, "local-paused.txt", "untracked paused receiver\n")
        before = self.local_state(self.repo)
        validated = self.cli("validate", expected=expected, result_commit=result["result_commit"])
        self.assertEqual(validated["state"], "paused")
        self.assertEqual(validated["next_steps"], paused["next_steps"])
        self.assertEqual(self.local_state(self.repo), before)
        applied = self.cli("apply", expected=expected, result_commit=result["result_commit"])
        self.assertEqual(applied["status"], "applied")
        self.assertEqual(applied["state"], "paused")
        self.assertEqual(applied["next_steps"], paused["next_steps"])
        after = self.local_state(self.repo)
        self.assertEqual(after["head"], before["head"])
        self.assertEqual(after["index"], before["index"])
        self.assertEqual(after["files"]["unrelated.txt"], before["files"]["unrelated.txt"])
        self.assertEqual(after["files"]["local-paused.txt"], before["files"]["local-paused.txt"])
        self.assertEqual((self.repo / "binary.dat").read_bytes(), checkpoint)
        self.assertEqual((self.repo / "work.txt").read_bytes(), b"partial checkpoint work\n")
        for path in (
            receipt["identity"]["brief_path"],
            str(Path(receipt["identity"]["brief_path"]).with_suffix(".json")),
            self.result_path(receipt),
        ):
            self.assertEqual((self.repo / path).read_bytes(), (worker / path).read_bytes())
            self.assertIn(path, applied["paths"])
        reapplied = self.cli("apply", expected=expected, result_commit=result["result_commit"])
        self.assertEqual(reapplied["status"], "already_applied")
        self.assertEqual(reapplied["state"], "paused")
        self.assertEqual(reapplied["next_steps"], paused["next_steps"])
        self.assertEqual(self.local_state(self.repo), after)

    def test_result_state_and_required_next_steps_consistency_refuse_without_writes(self):
        receipt, expected = self.snapshot()
        worker = self.worker(receipt)
        work_tip = self.oid(worker)
        complete = {
            "state": "complete", "summary": "State consistency fixture.",
            "verification": [], "limitations": [], "next_steps": [],
        }
        old_complete = {key: value for key, value in complete.items() if key != "next_steps"}
        cases = [
            ("legacy complete missing steps", old_complete),
            ("paused missing steps", {**old_complete, "state": "paused"}),
            ("paused empty steps", {**complete, "state": "paused"}),
            ("unknown enum", {**complete, "state": "running"}),
            ("old completion enum", {**complete, "state": "completed"}),
            ("complete unfinished steps", {**complete, "next_steps": ["Finish remaining implementation."]}),
            ("steps not array", {**complete, "state": "paused", "next_steps": "Finish implementation."}),
            ("blank paused step", {**complete, "state": "paused", "next_steps": [" "]}),
            ("nonstring paused step", {**complete, "state": "paused", "next_steps": [1]}),
        ]
        for name, invalid in cases:
            with self.subTest(case=name):
                summary = self.external_json("invalid-state-summary.json", invalid)
                before = self.local_state(worker)
                self.cli("result", repo=worker, expected=expected, summary=summary, error="INVALID_INPUT")
                self.assertEqual(self.local_state(worker), before)
                document = {"schema": 1, "identity": receipt["identity"], "work_tip": work_tip, **invalid}
                forged = self.forge_commit(work_tip, {self.result_path(receipt): json.dumps(document)})
                self.assert_refused_without_writes(expected, forged, "INVALID_INPUT")


    def ignored_copy_program(self):
        recipe = (SKILLS / "_shared/offload/ignored-copy.md").read_text(encoding="utf-8")
        heredoc = re.search(r"(?ms)^python3 .*? <<'PY'\n(.*?)^PY$", recipe)
        self.assertIsNotNone(heredoc, "Ignored-copy recipe lacks its Python heredoc")
        tree = ast.parse(heredoc.group(1))
        assignments = [
            node for node in tree.body
            if isinstance(node, ast.Assign)
            and len(node.targets) == 1
            and isinstance(node.targets[0], ast.Name)
            and node.targets[0].id == "remote"
        ]
        self.assertEqual(len(assignments), 1, "Ignored-copy remote program must be one literal assignment")
        value = assignments[0].value
        self.assertIsInstance(value, ast.Constant)
        self.assertIsInstance(value.value, str)
        return value.value

    def test_actual_ignored_copy_target_short_input_preserves_and_complete_input_replaces(self):
        remote = self.ignored_copy_program()
        self.put(self.repo, ".gitignore", ".mcp.json\n.env.offload-copy-*\n")
        self.commit(self.repo, "Declare ignored target-stage fixture files")
        original = b'{"mcpServers":{"old":{"command":"fixture-old"}}}\n'
        payload = b'{"mcpServers":{"new":{"command":"fixture-new","args":["--offline"]}}}\n'
        target = self.put(self.repo, ".mcp.json", original, 0o640)
        self.put(self.repo, ".env.offload-copy-preexisting", b"unrelated owned sibling\n", 0o600)
        before = self.local_state(self.repo)
        original_inode = target.stat().st_ino
        short = self.run_process(
            [sys.executable, "-c", remote, self.repo, ".mcp.json", len(payload)],
            data=payload[:-5],
        )
        self.assertEqual(short.returncode, 1)
        self.assertEqual(short.stdout, b"")
        self.assertEqual(short.stderr, b"")
        self.assertEqual(self.local_state(self.repo), before)
        self.assertEqual(target.stat().st_ino, original_inode)
        complete = self.run_process(
            [sys.executable, "-c", remote, self.repo, ".mcp.json", len(payload)],
            data=payload,
        )
        self.assertEqual(complete.returncode, 0)
        self.assertEqual(complete.stdout, b"")
        self.assertEqual(complete.stderr, b"")
        expected = copy.deepcopy(before)
        expected["files"][".mcp.json"] = ("file", 0o600, payload)
        self.assertEqual(self.local_state(self.repo), expected)
        self.assertNotEqual(target.stat().st_ino, original_inode)

    def test_actual_ignored_copy_target_tracked_nonignored_and_symlink_paths_refuse_untouched(self):
        remote = self.ignored_copy_program()
        self.put(self.repo, ".gitignore", ".mcp.json\nignored-area/\n.env.offload-copy-*\n")
        self.commit(self.repo, "Declare target-copy path-boundary fixtures")
        self.put(self.repo, "notignored.json", b"unapproved local configuration\n", 0o640)
        outside = self.base / "target-copy-outside"
        outside.mkdir()
        linked_file = self.put(outside, "linked.json", b"outside linked configuration\n", 0o640)
        self.put(outside, "nested/.mcp.json", b"outside nested configuration\n", 0o600)
        os.symlink(str(linked_file), self.repo / ".mcp.json")
        os.symlink(str(outside), self.repo / "ignored-area")
        self.put(self.repo, ".env.offload-copy-preexisting", b"unrelated owned sibling\n", 0o600)
        payload = b"approved bytes must not overwrite these targets\n"

        def outside_state():
            return {
                path.relative_to(outside).as_posix(): (stat.S_IMODE(path.stat().st_mode), path.read_bytes())
                for path in outside.rglob("*") if path.is_file()
            }

        for relative in ("work.txt", "notignored.json", ".mcp.json", "ignored-area/nested/.mcp.json"):
            with self.subTest(relative=relative):
                before = self.local_state(self.repo)
                outside_before = outside_state()
                refused = self.run_process(
                    [sys.executable, "-c", remote, self.repo, relative, len(payload)],
                    data=payload,
                )
                self.assertEqual(refused.returncode, 1)
                self.assertEqual(refused.stdout, b"")
                self.assertEqual(refused.stderr, b"")
                self.assertEqual(self.local_state(self.repo), before)
                self.assertEqual(outside_state(), outside_before)


class SkillStructureFixtures(unittest.TestCase):
    def test_four_skill_frontmatter_and_local_references(self):
        documents = []
        for name in ("offload-task", "offload-prep", "offload-return", "offload-deploy"):
            path = SKILLS / name / "SKILL.md"
            with self.subTest(skill=name):
                self.assertTrue(path.is_file(), str(path))
                text = path.read_text(encoding="utf-8")
                match = re.match(r"\A---\r?\n(.*?)\r?\n---(?:\r?\n|\Z)", text, re.DOTALL)
                self.assertIsNotNone(match, f"{name} lacks frontmatter")
                fields = {}
                for line in match.group(1).splitlines():
                    if not line.strip() or line.lstrip().startswith("#") or line[0].isspace():
                        continue
                    key, separator, value = line.partition(":")
                    self.assertEqual(separator, ":", f"{name} has malformed frontmatter")
                    self.assertNotIn(key, fields, f"{name} repeats {key}")
                    fields[key] = value.strip().strip("\"'")
                self.assertEqual(fields.get("name"), name)
                self.assertTrue(fields.get("description", "").strip(), f"{name} lacks a description")
                links = self.local_links(path, text)
                self.assertIn((SKILLS / "_shared/offload/contract.md").resolve(), links)
                documents.append((path, text))
        shared = SKILLS / "_shared/offload"
        for name in ("contract.md", "inventory.md", "freeze.md", "git_guard.py", "verify.py"):
            self.assertTrue((shared / name).is_file(), f"Missing shared reference {name}")
        documents.extend((path, path.read_text(encoding="utf-8")) for path in sorted(shared.glob("*.md")))
        for path, text in documents:
            with self.subTest(document=path.name):
                self.local_links(path, text)

    def local_links(self, path, text):
        local = []
        for reference in re.findall(r"\[[^\]]*\]\(([^\s)]+)(?:\s+\"[^\"]*\")?\)", text):
            parsed = urlsplit(reference)
            if parsed.scheme or parsed.netloc or not parsed.path:
                continue
            target = (path.parent / unquote(parsed.path)).resolve()
            self.assertTrue(target.is_file(), f"{path.name} has a missing reference {reference}")
            local.append(target)
        return local


class ReturnSystemFixture:
    def __init__(self, slug):
        self.boot = "80775e04-0da9-4c07-87cb-5c67d4a88693"
        self.machine = "ac02f16784714ab787dabcfe121f6064"
        self.hostname = "target.invalid"
        self.unit = f"offload-{slug}.scope"
        self.group = f"/user.slice/user-{os.getuid()}.slice/offload-{slug}.scope"
        self.properties = {
            "load_state": "loaded", "active_state": "active",
            "invocation_id": "c32a9f8e64b94066a8cb813912fa98c1",
            "control_group": self.group, "kill_mode": "control-group",
            "timeout_stop": 5000000,
        }
        self.processes = {}
        for pid, ppid, group in (
            (101, 1, self.group), (102, 101, self.group),
            (103, 102, self.group + "/child/grandchild"),
            (201, 1, "/user.slice/return-controller"),
            (202, 201, "/user.slice/return-controller"),
            (9000, 8800, "/user.slice/tool-broker"),
        ):
            self.processes[pid] = {
                "pid": pid, "start_ticks": 100000 + pid, "ppid": ppid,
                "state": "S", "cgroup": group, "uid": os.getuid(),
            }
        self.helper_pid = 9000
        self.survive_stop = set()
        self.survive_kill = set()
        self.after_stop = None
        self.before_members = None
        self.before_control = None
        self.controls = []

    def boot_id(self):
        return self.boot

    def machine_id(self):
        return self.machine

    def host(self):
        return self.hostname

    def process(self, pid):
        process = self.processes.get(pid)
        return None if process is None else dict(process)

    def self_identity(self):
        return self.process(self.helper_pid)

    def scope(self, unit):
        return dict(self.properties) if unit == self.unit else None

    def members(self, group):
        if self.before_members is not None:
            self.before_members()
        members = [
            dict(process) for process in self.processes.values()
            if process["state"] not in ("Z", "X")
            and (process["cgroup"] == group or process["cgroup"].startswith(group + "/"))
        ]
        return members

    def quiet(self, group):
        return not self.members(group)

    def retire(self, survivors):
        for process in self.members(self.group):
            pid = process["pid"]
            if pid in survivors:
                continue
            if pid == 102:
                self.processes[pid]["state"] = "Z"
                self.processes[pid]["cgroup"] = ""
            else:
                del self.processes[pid]
        self.properties["active_state"] = "inactive"

    def validate_control(self, unit, expected_scope):
        if unit != self.unit or expected_scope["unit"] != unit:
            raise AssertionError("Attempted to control an unowned scope")
        if self.before_control is not None:
            self.before_control()
        observed = self.scope(unit)
        for field in ("invocation_id", "control_group", "kill_mode", "timeout_stop"):
            if observed[field] != expected_scope[field]:
                raise importlib.import_module("git_guard").Refusal("SCOPE_CHANGED", 3)

    def stop(self, unit, expected_scope):
        self.validate_control(unit, expected_scope)
        self.controls.append(("stop", unit, self.properties["invocation_id"]))
        self.retire(self.survive_stop)
        if self.after_stop is not None:
            self.after_stop()

    def kill(self, unit, expected_scope):
        self.validate_control(unit, expected_scope)
        self.controls.append(("kill", unit, self.properties["invocation_id"]))
        self.retire(self.survive_kill)

    def fresh_helper_without_controller(self):
        self.processes.pop(201, None)
        self.processes.pop(202, None)
        self.processes.pop(self.helper_pid)
        self.helper_pid = 9100
        self.processes[9100] = {
            "pid": 9100, "start_ticks": 220000, "ppid": 1, "state": "R",
            "cgroup": "/user.slice/fresh-broker", "uid": os.getuid(),
        }


class ReturnLifecycleFixtures(OffloadFixture):
    SLUG = "20261012-red-pin-task"

    def setUp(self):
        self.addCleanup(mock.patch.stopall)
        mock.patch.object(sys, "dont_write_bytecode", True).start()
        self.kernel = importlib.import_module("return_state")
        super().setUp()
        mock.patch.dict(os.environ, self.env, clear=True).start()
        self.receipt, self.expected = self.snapshot(slug=self.SLUG)
        self.expected.chmod(0o600)
        self.worker_receipt = self.base / "worker-receipt.json"
        self.worker_receipt.write_bytes(self.expected.read_bytes())
        self.worker_receipt.chmod(0o600)
        self.worker_path = self.worker(self.receipt)
        self.put(self.worker_path, "work.txt", "returned work\n")
        self.put(self.worker_path, "binary.dat", b"\x00returned\xff\n")
        self.commit(self.worker_path, "Implement return fixture")
        self.result = self.record_result(self.worker_path, self.worker_receipt)
        self.common = Path(self.git(
            self.worker_path, "rev-parse", "--path-format=absolute", "--git-common-dir",
        ).decode().strip())
        self.state_dir = self.common / "offload-receipts" / self.SLUG
        self.return_ref = f"refs/offload-return/{self.SLUG}/result"
        self.inventory = self.external_json("inventory.json", {
            "schema": 1, "dependencies": [], "services": [], "files": [],
        })
        self.inventory.chmod(0o600)
        self.system = ReturnSystemFixture(self.SLUG)
        self.draft = {
            "schema": 1, "receipt_path": str(self.worker_receipt),
            "receipt_sha256": self.digest(self.expected),
            "inventory_path": str(self.inventory), "allowlist_path": None,
            "herdr": {
                "session": None, "workspace": "fixture-workspace",
                "pane": "fixture-worker-pane", "agent": "offload-" + self.SLUG,
            },
            "scope": {"unit": self.system.unit, "initial_pid": 101, "omp_pid": 102},
            "source": {
                "host": "source.invalid", "user": "fixture", "uid": os.getuid(),
                "repo": str(self.repo), "common_dir": str(self.common),
                "receipt_path": str(self.expected), "guard_path": str(HELPER),
                "guard_sha256": self.digest(HELPER),
            },
            "routes": {
                "reverse": {
                    "status": "verified", "ssh_alias": "fixture-source",
                    "user": "fixture", "port": 22, "host_key_alias": None,
                    "config_path": None, "verified_at": "2026-10-12T00:00:00Z",
                },
                "forward": {"ssh_alias": "fixture-target"},
            },
        }

    @staticmethod
    def digest(path):
        return hashlib.sha256(Path(path).read_bytes()).hexdigest()

    def invoke(self, verb, args=(), payload=None, error=None, worktree=None, slug=None):
        argv = [
            verb, "--worktree", str(self.worker_path if worktree is None else worktree),
            "--slug", self.SLUG if slug is None else slug, *map(str, args),
        ]
        code, response = self.kernel.execute(
            argv, input_data=None if payload is None else json.dumps(payload).encode(),
            system=self.system,
        )
        self.assertIsInstance(response, dict)
        if error is None:
            self.assertEqual(code, 0, response)
            self.assertIs(response["ok"], True, response)
        else:
            if error in ("INVALID_INPUT", "INVALID_ARGUMENTS"):
                self.assertEqual(code, 2, response)
            elif error in ("WRITERS_REMAIN", "OPERATION_FAILED_EFFECT_UNCERTAIN"):
                self.assertEqual(code, 4, response)
            else:
                self.assertEqual(code, 3, response)
            self.assertIs(response["ok"], False, response)
            self.assertEqual(response["error"], error, response)
        return response

    def publish(self):
        response = self.invoke("publish-dispatch", payload=self.draft)
        self.assertEqual(response["status"], "published")
        self.assertEqual(response["dispatch"], str(self.state_dir / "dispatch.json"))
        self.assertEqual(response["dispatch_sha256"], self.digest(response["dispatch"]))
        self.assertEqual(response["state_dir"], str(self.state_dir))
        self.assertEqual(response["common_dir"], str(self.common))
        self.assertEqual(response["worktree"], str(self.worker_path))
        return response

    def request(self, mode="controller", state="complete"):
        response = self.invoke("request", ("--mode", mode, "--state", state))
        attempt_dir = self.state_dir / "attempts" / response["attempt_id"]
        self.assertEqual(response["mode"], mode)
        self.assertEqual(response["cwd"], str(attempt_dir))
        self.assertEqual(response["intent_path"], str(self.state_dir / "intent.json"))
        self.assertEqual(response["dispatch_path"], str(self.state_dir / "dispatch.json"))
        self.assertEqual(response["state"], self.result["state"])
        self.assertEqual(response["result_commit"], self.result["result_commit"])
        self.assertEqual(response["next_steps"], self.result["next_steps"])
        self.assertTrue((attempt_dir / "attempt.json").is_file())
        self.assertEqual(stat.S_IMODE(attempt_dir.stat().st_mode), 0o700)
        self.assertEqual(stat.S_IMODE((attempt_dir / "attempt.json").stat().st_mode), 0o600)
        if mode == "controller":
            self.assertLessEqual(len(response["agent"]), 32)
            self.assertTrue(response["agent"])
            self.assertEqual(response["session_dir"], str(attempt_dir / "omp-session"))
            self.assertTrue(Path(response["session_dir"]).is_dir())
            self.assertEqual(stat.S_IMODE(Path(response["session_dir"]).stat().st_mode), 0o700)
        else:
            self.assertIsNone(response["agent"])
            self.assertIsNone(response["session_dir"])
            self.assertFalse((attempt_dir / "omp-session").exists())
        return response

    def freeze(self, attempt, controller=True, error=None, extra=()):
        args = ["--attempt", attempt["attempt_id"]]
        if controller:
            args.extend([
                "--shell-pid", "201", "--controller-pid", "202",
                "--workspace", "fixture-controller-workspace", "--pane", "fixture-controller-pane",
            ])
            if self.draft["herdr"]["session"] is not None:
                args.extend(["--herdr-session", self.draft["herdr"]["session"]])
        return self.invoke("freeze", (*args, *extra), error=error)

    def assert_pinned(self, response, status):
        self.assertEqual(response["status"], status)
        self.assertEqual(response["result_commit"], self.result["result_commit"])
        self.assertEqual(response["work_tip"], self.result["work_tip"])
        self.assertEqual(response["state"], self.result["state"])
        self.assertEqual(response["next_steps"], self.result["next_steps"])
        self.assertEqual(response["pin"], str(self.state_dir / "pin.json"))
        self.assertEqual(response["pin_sha256"], self.digest(response["pin"]))
        self.assertEqual(response["ref"], self.return_ref)
        self.assertEqual(self.oid(self.worker_path, self.return_ref), self.result["result_commit"])
        self.assertEqual(json.loads(Path(response["pin"]).read_bytes())["result_commit"],
                         self.result["result_commit"])
        self.assertTrue((self.state_dir / "freeze.json").is_file())
        self.assertEqual(self.git(self.worker_path, "status", "--porcelain"), b"")

    def assert_unpinned(self):
        for name in ("freeze.json", "pin.json"):
            self.assertFalse((self.state_dir / name).exists(), name)
        self.assertEqual(self.git(
            self.worker_path, "for-each-ref", "--format=%(objectname)", self.return_ref,
        ), b"")

    def start(self):
        self.publish()
        return self.request()

    def pin(self):
        attempt = self.start()
        response = self.freeze(attempt)
        self.assert_pinned(response, "pinned")
        self.assertEqual(response["attempt_id"], attempt["attempt_id"])
        return attempt, response

    def outcome(self, attempt, payload, error=None):
        return self.invoke("outcome", ("--attempt", attempt["attempt_id"]),
                           payload=payload, error=error)

    def pending(self, reason="offline"):
        return {
            "delivery": "pending", "reason": reason, "detail": "Receiver is unavailable.",
            "paths": [], "source_ack": None,
        }

    def source_ack(self, status="applied"):
        self.put(self.repo, "unrelated.txt", "unrelated staged work\n")
        self.git(self.repo, "add", "unrelated.txt")
        self.put(self.repo, "unrelated.txt", "unrelated unstaged work\n")
        before = self.local_state(self.repo)
        helper = self.cli("apply", expected=self.expected,
                          result_commit=self.result["result_commit"])
        self.assertEqual(helper["status"], "applied")
        if status == "already_applied":
            helper = self.cli("apply", expected=self.expected,
                              result_commit=self.result["result_commit"])
            self.assertEqual(helper["status"], "already_applied")
        after = self.local_state(self.repo)
        self.assertEqual(before["head"], after["head"])
        self.assertEqual(before["index"], after["index"])
        self.assertEqual(before["files"]["unrelated.txt"], after["files"]["unrelated.txt"])
        self.assertEqual((self.repo / "work.txt").read_bytes(), b"returned work\n")
        self.assertEqual((self.repo / "binary.dat").read_bytes(), b"\x00returned\xff\n")
        self.assertEqual(helper["result_commit"], self.result["result_commit"])
        self.assertEqual(helper["work_tip"], self.result["work_tip"])
        self.assertEqual(helper["state"], self.result["state"])
        self.assertEqual(helper["next_steps"], self.result["next_steps"])
        self.assertIs(helper["ok"], True)
        self.assertIsInstance(helper["suppressed"], int)
        self.assertTrue(helper["paths"])
        ack_path = self.base / "source-ack.json"
        ack = {
            "schema": 1, "root": self.receipt["identity"]["root"], "slug": self.SLUG,
            "receipt_sha256": self.digest(self.expected),
            "snapshot": self.receipt["identity"]["snapshot"],
            "result_commit": self.result["result_commit"], "source_path": str(ack_path),
            "helper": helper, "head_before": before["head"], "head_after": after["head"],
            "index_before_sha256": hashlib.sha256(before["index"]).hexdigest(),
            "index_after_sha256": hashlib.sha256(after["index"]).hexdigest(),
            "writer_evidence": {
                "kind": "exclusive-owner",
                "detail": "This isolated temporary source repository has one fixture owner.",
            },
        }
        ack_path.write_text(json.dumps(ack), encoding="utf-8")
        ack_path.chmod(0o600)
        return ack

    def test_dispatch_is_private_immutable_and_keeps_external_receipt(self):
        receipt_bytes = self.expected.read_bytes()
        response = self.publish()
        dispatch_bytes = Path(response["dispatch"]).read_bytes()
        document = json.loads(Path(response["dispatch"]).read_bytes())
        self.assertEqual(document["herdr"]["session"], None)
        self.assertEqual(document["routes"]["forward"]["ssh_alias"], "fixture-target")
        self.assertEqual(document["worker"]["host"], self.system.host())
        self.assertEqual(document["identity"], self.receipt["identity"])
        self.assertEqual(self.expected.read_bytes(), receipt_bytes)
        self.assertEqual(stat.S_IMODE(self.state_dir.stat().st_mode), 0o700)
        self.assertEqual(stat.S_IMODE(Path(response["dispatch"]).stat().st_mode), 0o600)
        self.invoke("publish-dispatch", payload=self.draft, error="RECORD_EXISTS")
        self.assertEqual(Path(response["dispatch"]).read_bytes(), dispatch_bytes)
        self.assertEqual(self.digest(response["dispatch"]), response["dispatch_sha256"])

    def test_publish_refuses_noncanonical_receipt_path(self):
        link = self.base / "receipt-link.json"
        link.symlink_to(self.worker_receipt)
        self.draft["receipt_path"] = str(link)
        self.invoke("publish-dispatch", payload=self.draft, error="UNSAFE_STATE_PATH")
        self.assertFalse((self.state_dir / "dispatch.json").exists())

    def test_publish_refuses_wrong_receipt_digest(self):
        self.draft["receipt_sha256"] = "0" * 64
        self.invoke("publish-dispatch", payload=self.draft, error="RECEIPT_MISMATCH")
        self.assertFalse((self.state_dir / "dispatch.json").exists())

    def test_publish_refuses_receipt_identity_for_another_slug(self):
        self.invoke("publish-dispatch", payload=self.draft,
                    slug="20261012-wrong-pin-task", error="IDENTITY_MISMATCH")
        self.assertFalse((self.state_dir / "dispatch.json").exists())

    def test_publish_refuses_wrong_registered_worktree_branch(self):
        self.git(self.worker_path, "switch", "-c", "wrong-worker")
        self.invoke("publish-dispatch", payload=self.draft, error="WRONG_BRANCH")
        self.assertFalse((self.state_dir / "dispatch.json").exists())

    def test_publish_refuses_unsafe_record_directory(self):
        parent = self.common / "offload-receipts"
        parent.mkdir(mode=0o700)
        destination = self.base / "redirected-state"
        destination.mkdir(mode=0o700)
        (parent / self.SLUG).symlink_to(destination, target_is_directory=True)
        self.invoke("publish-dispatch", payload=self.draft, error="UNSAFE_STATE_PATH")
        self.assertEqual(list(destination.iterdir()), [])

    def test_publish_refuses_process_outside_owned_scope(self):
        self.system.processes[102]["cgroup"] = "/user.slice/unrelated"
        self.invoke("publish-dispatch", payload=self.draft, error="SCOPE_NOT_OWNED")
        self.assertEqual(self.system.controls, [])
        self.assertFalse((self.state_dir / "dispatch.json").exists())

    def test_publish_refuses_unbounded_scope_shutdown(self):
        self.system.properties["timeout_stop"] = 90000000
        self.invoke("publish-dispatch", payload=self.draft, error="SCOPE_NOT_OWNED")
        self.assertEqual(self.system.controls, [])

    def test_request_rechecks_receipt_digest(self):
        self.publish()
        self.worker_receipt.write_bytes(self.worker_receipt.read_bytes() + b"\n")
        self.invoke("request", ("--state", "complete"), error="RECEIPT_MISMATCH")
        self.assertFalse((self.state_dir / "intent.json").exists())
        self.assertEqual(self.system.controls, [])

    def test_helper_inside_worker_descendant_cannot_stop_itself(self):
        attempt = self.start()
        self.system.processes[self.system.helper_pid]["cgroup"] = self.system.group + "/tools"
        self.freeze(attempt, error="WRONG_CALLER_SCOPE")
        self.assertEqual(self.system.controls, [])
        self.assertIsNotNone(self.system.process(101))
        self.assert_unpinned()

    def test_controller_inside_worker_descendant_cannot_authorize_stop(self):
        attempt = self.start()
        self.system.processes[202]["cgroup"] = self.system.group + "/controller"
        self.freeze(attempt, error="WRONG_CALLER_SCOPE")
        self.assertEqual(self.system.controls, [])
        self.assertIsNotNone(self.system.process(101))
        self.assert_unpinned()

    def test_controller_scope_is_rechecked_after_durable_acceptance(self):
        attempt = self.start()
        publish_record = self.kernel.publish_record

        def move_controller_after_handoff(path, document):
            result = publish_record(path, document)
            if Path(path).name == "handoff.json":
                self.system.processes[202]["cgroup"] = self.system.group + "/late-controller"
            return result

        with mock.patch.object(self.kernel, "publish_record",
                               side_effect=move_controller_after_handoff):
            self.freeze(attempt, error="WRONG_CALLER_SCOPE")
        self.assertTrue((self.state_dir / "attempts" / attempt["attempt_id"] / "handoff.json").is_file())
        self.assertEqual(self.system.controls, [])
        self.assert_unpinned()

    def test_actual_machine_identity_change_refuses_freeze(self):
        attempt = self.start()
        self.system.machine = "befed2b4c08b4aa891c6e0ddfc349fc0"
        self.freeze(attempt, error="IDENTITY_MISMATCH")
        self.assertEqual(self.system.controls, [])
        self.assert_unpinned()

    def test_named_session_requires_exact_observed_selector(self):
        self.draft["herdr"]["session"] = "fixture-persistent-session"
        attempt = self.start()
        self.invoke("freeze", (
            "--attempt", attempt["attempt_id"], "--shell-pid", "201",
            "--controller-pid", "202", "--workspace", "fixture-controller-workspace",
            "--pane", "fixture-controller-pane", "--herdr-session", "wrong-session",
        ), error="IDENTITY_MISMATCH")
        self.assertEqual(self.system.controls, [])
        self.assert_unpinned()

    def test_controller_requires_fresh_workspace_not_worker_workspace(self):
        attempt = self.start()
        self.invoke("freeze", (
            "--attempt", attempt["attempt_id"], "--shell-pid", "201",
            "--controller-pid", "202", "--workspace", "fixture-workspace",
            "--pane", "fixture-controller-pane",
        ), error="IDENTITY_MISMATCH")
        self.assertEqual(self.system.controls, [])
        self.assert_unpinned()

    def test_changed_unit_invocation_never_stops_replacement(self):
        attempt = self.start()
        self.system.properties["invocation_id"] = "b13d7c4a3ba14f45b7377363b6df7c98"
        self.freeze(attempt, error="SCOPE_CHANGED")
        self.assertEqual(self.system.controls, [])
        self.assertEqual(len(self.system.members(self.system.group)), 3)
        self.assert_unpinned()

    def test_pid_reused_inside_scope_refuses_before_stop(self):
        attempt = self.start()
        self.system.processes[101]["start_ticks"] += 4000
        self.freeze(attempt, error="SCOPE_CHANGED")
        self.assertEqual(self.system.controls, [])
        self.assertEqual(self.system.process(101)["start_ticks"], 104101)
        self.assert_unpinned()

    def assert_enumeration_birth_change_refused(self, pid):
        attempt = self.start()
        birth = self.system.processes[pid]["start_ticks"]

        def change_birth_during_enumeration():
            self.system.before_members = None
            self.system.processes[pid]["start_ticks"] = birth + 4000

        self.system.before_members = change_birth_during_enumeration
        before = self.local_state(self.worker_path)
        self.freeze(attempt, error="SCOPE_CHANGED")
        self.assertEqual(self.system.process(pid)["start_ticks"], birth + 4000)
        self.assertEqual(self.system.controls, [])
        self.assertEqual(self.system.properties["active_state"], "active")
        self.assertFalse((self.state_dir / "operation.json").exists())
        self.assertEqual(self.local_state(self.worker_path), before)
        self.assert_unpinned()

    def test_initial_pid_birth_changed_during_member_enumeration_is_not_accepted(self):
        self.assert_enumeration_birth_change_refused(101)

    def test_omp_pid_birth_changed_during_member_enumeration_is_not_accepted(self):
        self.assert_enumeration_birth_change_refused(102)

    def test_fresh_control_boundary_rejects_scope_replacement_before_signal(self):
        attempt = self.start()
        replacement_group = "/user.slice/unrelated-replacement"
        replacement_birth = {
            "pid": 801, "start_ticks": 800001, "ppid": 1, "state": "S",
            "cgroup": replacement_group, "uid": os.getuid(),
        }

        def replace_before_control():
            self.system.before_control = None
            self.system.properties["invocation_id"] = "b13d7c4a3ba14f45b7377363b6df7c98"
            self.system.properties["control_group"] = replacement_group
            self.system.processes[801] = dict(replacement_birth)

        self.system.before_control = replace_before_control
        self.freeze(attempt, error="SCOPE_CHANGED")
        self.assertEqual(self.system.controls, [])
        self.assertEqual(self.system.process(801), replacement_birth)
        self.assertEqual(self.system.process(101)["state"], "S")
        self.assertEqual(self.system.process(102)["state"], "S")
        self.assert_unpinned()

    def test_fresh_kill_boundary_rejects_replacement_after_outer_scope_check(self):
        attempt = self.start()
        self.system.survive_stop = {103}
        replacement_birth = {
            "pid": 801, "start_ticks": 800001, "ppid": 1, "state": "S",
            "cgroup": "/user.slice/unrelated-replacement", "uid": os.getuid(),
        }

        def replace_before_kill():
            self.system.before_control = None
            self.system.properties["invocation_id"] = "b13d7c4a3ba14f45b7377363b6df7c98"
            self.system.properties["control_group"] = replacement_birth["cgroup"]
            self.system.processes[801] = dict(replacement_birth)

        def arm_kill_race():
            self.system.before_control = replace_before_kill

        self.system.after_stop = arm_kill_race
        self.freeze(attempt, error="SCOPE_CHANGED")
        self.assertEqual([entry[0] for entry in self.system.controls], ["stop"])
        self.assertEqual(self.system.process(801), replacement_birth)
        self.assertEqual(self.system.process(103)["state"], "S")
        self.assert_unpinned()

    def test_pid_reused_outside_scope_after_stop_is_not_a_surviving_writer(self):
        attempt = self.start()

        def reuse_exited_pid():
            self.system.processes[101] = {
                "pid": 101, "start_ticks": 300101, "ppid": 1, "state": "S",
                "cgroup": "/user.slice/unrelated-new-process", "uid": os.getuid(),
            }

        self.system.after_stop = reuse_exited_pid
        response = self.freeze(attempt)
        self.assert_pinned(response, "pinned")
        self.assertEqual(self.system.process(101)["start_ticks"], 300101)
        self.assertEqual(self.system.process(101)["state"], "S")
        self.assertEqual([entry[0] for entry in self.system.controls], ["stop"])

    def test_dirty_tracked_worker_refuses_before_stop(self):
        attempt = self.start()
        self.put(self.worker_path, "work.txt", "dirty tracked work\n")
        before = self.local_state(self.worker_path)
        self.freeze(attempt, error="DIRTY_WORKTREE")
        self.assertEqual(self.local_state(self.worker_path), before)
        self.assertEqual(self.system.controls, [])
        self.assert_unpinned()

    def test_dirty_untracked_worker_refuses_before_stop(self):
        attempt = self.start()
        self.put(self.worker_path, "unexpected.txt", "unexpected writer\n")
        self.freeze(attempt, error="DIRTY_WORKTREE")
        self.assertEqual(self.system.controls, [])
        self.assert_unpinned()

    def test_dirty_worker_after_stop_never_publishes_proof_or_pin(self):
        attempt = self.start()
        self.system.after_stop = lambda: self.put(self.worker_path, "work.txt", "late write\n")
        self.freeze(attempt, error="DIRTY_WORKTREE")
        self.assertTrue(self.system.quiet(self.system.group))
        self.assertEqual([entry[0] for entry in self.system.controls], ["stop"])
        self.assertEqual((self.worker_path / "work.txt").read_bytes(), b"late write\n")
        self.assertTrue((self.state_dir / "operation.json").is_file())
        self.assert_unpinned()

    def test_moving_result_after_request_never_stops_worker(self):
        attempt = self.start()
        self.put(self.worker_path, "work.txt", "candidate moved\n")
        moved = self.commit(self.worker_path, "Move candidate")
        self.freeze(attempt, error="RESULT_MOVED")
        self.assertEqual(self.oid(self.worker_path), moved)
        self.assertEqual(self.system.controls, [])
        self.assert_unpinned()

    def test_descendant_writer_surviving_stop_and_kill_refuses_pin(self):
        attempt = self.start()
        self.system.survive_stop = {103}
        self.system.survive_kill = {103}
        self.freeze(attempt, error="WRITERS_REMAIN")
        self.assertFalse(self.system.quiet(self.system.group))
        self.assertEqual(self.system.process(103)["state"], "S")
        self.assertEqual([entry[0] for entry in self.system.controls], ["stop", "kill"])
        self.assert_unpinned()

    def test_exact_scope_kill_removes_descendant_writer_before_pin(self):
        attempt = self.start()
        self.system.survive_stop = {103}
        response = self.freeze(attempt)
        self.assert_pinned(response, "pinned")
        self.assertIsNone(self.system.process(103))
        self.assertTrue(self.system.quiet(self.system.group))
        self.assertEqual([entry[0] for entry in self.system.controls], ["stop", "kill"])
        self.assertEqual(self.system.controls[0][2], self.system.controls[1][2])

    def test_scope_replacement_after_stop_is_never_killed(self):
        attempt = self.start()
        self.system.survive_stop = {103}

        def replace_scope():
            self.system.properties["invocation_id"] = "b13d7c4a3ba14f45b7377363b6df7c98"
            self.system.properties["active_state"] = "active"

        self.system.after_stop = replace_scope
        self.freeze(attempt, error="SCOPE_CHANGED")
        self.assertEqual([entry[0] for entry in self.system.controls], ["stop"])
        self.assertEqual(self.system.process(103)["state"], "S")
        self.assert_unpinned()

    def test_different_nonempty_terminal_control_group_is_not_treated_as_cleared(self):
        attempt = self.start()

        def change_terminal_group():
            self.system.properties["control_group"] = "/user.slice/unrelated-terminal-group"

        self.system.after_stop = change_terminal_group
        self.freeze(attempt, error="SCOPE_CHANGED")
        self.assertTrue(self.system.quiet(self.system.group))
        self.assertEqual([entry[0] for entry in self.system.controls], ["stop"])
        self.assert_unpinned()

    def assert_pin_after_terminal_group_clear(self, active_state):
        attempt = self.start()
        invocation = self.system.properties["invocation_id"]

        def clear_group_before_unit_gc():
            self.system.properties["control_group"] = ""
            self.system.properties["active_state"] = active_state

        self.system.after_stop = clear_group_before_unit_gc
        response = self.freeze(attempt)
        self.assert_pinned(response, "pinned")
        self.assertEqual(self.system.properties["control_group"], "")
        self.assertEqual(self.system.properties["invocation_id"], invocation)
        self.assertTrue(self.system.quiet(self.system.group))
        self.assertIsNone(self.system.process(101))
        self.assertEqual(self.system.process(102)["state"], "Z")
        self.assertIsNone(self.system.process(103))
        self.assertEqual([entry[0] for entry in self.system.controls], ["stop"])

    def test_inactive_scope_with_cleared_control_group_still_pins_proven_result(self):
        self.assert_pin_after_terminal_group_clear("inactive")

    def test_failed_scope_with_cleared_control_group_still_pins_proven_result(self):
        self.assert_pin_after_terminal_group_clear("failed")

    def test_cleared_terminal_group_does_not_hide_surviving_old_group_writer(self):
        attempt = self.start()
        self.system.survive_stop = {103}

        def clear_group_before_unit_gc():
            self.system.properties["control_group"] = ""

        self.system.after_stop = clear_group_before_unit_gc
        self.freeze(attempt, error="WRITERS_REMAIN")
        self.assertFalse(self.system.quiet(self.system.group))
        self.assertEqual(self.system.process(103)["state"], "S")
        self.assertEqual([entry[0] for entry in self.system.controls], ["stop"])
        self.assert_unpinned()

    def test_exit_proof_records_descendants_and_accepts_dead_zombie(self):
        attempt, response = self.pin()
        self.assertIsNone(self.system.process(101))
        self.assertEqual(self.system.process(102)["state"], "Z")
        self.assertIsNone(self.system.process(103))
        self.assertTrue(self.system.quiet(self.system.group))
        proof = json.loads((self.state_dir / "freeze.json").read_bytes())
        self.assertEqual({member["pid"] for member in proof["members"]}, {101, 102, 103})
        handoff_path = self.state_dir / "attempts" / attempt["attempt_id"] / "handoff.json"
        self.assertTrue(handoff_path.is_file())
        for path in (handoff_path, self.state_dir / "freeze.json", Path(response["pin"])):
            self.assertEqual(stat.S_IMODE(path.stat().st_mode), 0o600)
        self.assertEqual([entry[0] for entry in self.system.controls], ["stop"])

    def test_pin_is_immutable_after_branch_move_repair_and_conflicting_ref(self):
        attempt, pinned = self.pin()
        pin_bytes = Path(pinned["pin"]).read_bytes()
        proof_bytes = (self.state_dir / "freeze.json").read_bytes()
        self.put(self.worker_path, "work.txt", "new branch content\n")
        moved = self.commit(self.worker_path, "Move branch after pin")
        self.git(self.worker_path, "switch", "-c", "post-pin")
        retry = self.request(state="paused")
        self.assertNotEqual(retry["attempt_id"], attempt["attempt_id"])
        self.assert_pinned(self.freeze(retry, controller=False), "already_pinned")
        self.assert_pinned(self.freeze(retry, controller=False), "already_pinned")
        self.git(self.worker_path, "update-ref", "-d", self.return_ref)
        self.assert_pinned(self.freeze(retry, controller=False), "reconciled")
        self.git(self.worker_path, "update-ref", self.return_ref, moved)
        self.freeze(retry, controller=False, error="REF_CONFLICT")
        self.assertEqual(self.oid(self.worker_path, self.return_ref), moved)
        self.assertEqual(Path(pinned["pin"]).read_bytes(), pin_bytes)
        self.assertEqual((self.state_dir / "freeze.json").read_bytes(), proof_bytes)
        self.assertEqual([entry[0] for entry in self.system.controls], ["stop"])

    def test_conflicting_durable_pin_is_refused_without_ref_or_scope_mutation(self):
        attempt, pinned = self.pin()
        path = Path(pinned["pin"])
        document = json.loads(path.read_bytes())
        document["result_commit"] = self.root
        path.write_text(json.dumps(document), encoding="utf-8")
        conflicting_bytes = path.read_bytes()
        self.freeze(attempt, controller=False, error="INCONSISTENT_STATE")
        self.assertEqual(path.read_bytes(), conflicting_bytes)
        self.assertEqual(self.oid(self.worker_path, self.return_ref), self.result["result_commit"])
        self.assertEqual([entry[0] for entry in self.system.controls], ["stop"])

    def test_crash_after_stop_recovers_durable_operation_without_original_controller(self):
        attempt = self.start()

        def crash_after_stop():
            self.assertTrue((self.state_dir / "operation.json").is_file())
            raise KeyboardInterrupt

        self.system.after_stop = crash_after_stop
        self.freeze(attempt, error="OPERATION_FAILED_EFFECT_UNCERTAIN")
        operation_bytes = (self.state_dir / "operation.json").read_bytes()
        operation = json.loads(operation_bytes)
        self.assertEqual({member["pid"] for member in operation["members"]}, {101, 102, 103})
        self.assertTrue(self.system.quiet(self.system.group))
        self.assert_unpinned()
        self.system.after_stop = None
        self.system.fresh_helper_without_controller()
        response = self.freeze(attempt, controller=False)
        self.assert_pinned(response, "reconciled")
        self.assertEqual((self.state_dir / "operation.json").read_bytes(), operation_bytes)
        self.assertEqual([entry[0] for entry in self.system.controls], ["stop"])

    def crash_publication(self, boundary):
        attempt = self.start()
        publish_record = self.kernel.publish_record
        publish_ref = self.kernel.publish_ref

        def record_then_crash(path, document):
            result = publish_record(path, document)
            if Path(path).name == boundary:
                raise KeyboardInterrupt
            return result

        def ref_then_crash(git, ref, result_commit):
            result = publish_ref(git, ref, result_commit)
            if boundary == "ref":
                raise KeyboardInterrupt
            return result

        with mock.patch.object(self.kernel, "publish_record", side_effect=record_then_crash), \
                mock.patch.object(self.kernel, "publish_ref", side_effect=ref_then_crash):
            self.freeze(attempt, error="OPERATION_FAILED_EFFECT_UNCERTAIN")
        self.assertTrue((self.state_dir / "freeze.json").is_file())
        if boundary == "freeze.json":
            self.assertFalse((self.state_dir / "pin.json").exists())
            self.assertEqual(self.git(
                self.worker_path, "for-each-ref", "--format=%(objectname)", self.return_ref,
            ), b"")
        else:
            self.assertEqual(self.oid(self.worker_path, self.return_ref), self.result["result_commit"])
            self.assertEqual((self.state_dir / "pin.json").exists(), boundary == "pin.json")
        self.put(self.worker_path, "work.txt", "branch moved during recovery\n")
        moved = self.commit(self.worker_path, "Move branch after durable publication")
        self.assertNotEqual(moved, self.result["result_commit"])
        self.git(self.worker_path, "switch", "-c", "recovery-branch")
        self.system.fresh_helper_without_controller()
        self.assert_pinned(self.freeze(attempt, controller=False),
                           "already_pinned" if boundary == "pin.json" else "reconciled")
        self.assertEqual([entry[0] for entry in self.system.controls], ["stop"])

    def test_crash_after_proof_reconciles_same_result(self):
        self.crash_publication("freeze.json")

    def test_crash_after_ref_reconciles_same_result(self):
        self.crash_publication("ref")

    def test_crash_after_pin_repeats_without_new_stop(self):
        self.crash_publication("pin.json")

    def test_concurrent_requests_have_independent_attempts_agents_and_sessions(self):
        self.publish()
        with ThreadPoolExecutor(max_workers=4) as pool:
            attempts = list(pool.map(lambda _: self.request(), range(4)))
        self.assertEqual(len({attempt["attempt_id"] for attempt in attempts}), 4)
        self.assertEqual(len({attempt["agent"] for attempt in attempts}), 4)
        self.assertEqual(len({attempt["session_dir"] for attempt in attempts}), 4)
        self.assertEqual(len({attempt["cwd"] for attempt in attempts}), 4)
        self.assertEqual({attempt["result_commit"] for attempt in attempts},
                         {self.result["result_commit"]})
        self.assertEqual(len(list((self.state_dir / "attempts").iterdir())), 4)
        self.assertEqual(self.system.controls, [])

    def test_held_freeze_lock_refuses_but_requests_remain_independent(self):
        attempt = self.start()
        lock_path = self.state_dir / "freeze.lock"
        with lock_path.open("a+b") as lock:
            lock_path.chmod(0o600)
            fcntl.flock(lock.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
            retry = self.request()
            self.assertNotEqual(attempt["attempt_id"], retry["attempt_id"])
            self.freeze(attempt, error="LOCKED")
            self.assertEqual(self.system.controls, [])
            self.assert_unpinned()
            fcntl.flock(lock.fileno(), fcntl.LOCK_UN)
        self.assert_pinned(self.freeze(attempt), "pinned")

    def test_pending_outcome_is_immutable_and_retry_uses_fresh_attempt(self):
        attempt, pinned = self.pin()
        response = self.outcome(attempt, self.pending())
        expected_path = self.state_dir / "attempts" / attempt["attempt_id"] / "outcome.json"
        self.assertEqual(response["status"], "recorded")
        self.assertEqual(response["attempt_id"], attempt["attempt_id"])
        self.assertEqual(response["delivery"], "pending")
        self.assertEqual(response["reason"], "offline")
        self.assertEqual(response["outcome"], str(expected_path))
        original = expected_path.read_bytes()
        self.outcome(attempt, self.pending("auth"), error="RECORD_EXISTS")
        self.assertEqual(expected_path.read_bytes(), original)
        retry = self.request()
        self.assertNotEqual(retry["attempt_id"], attempt["attempt_id"])
        self.assert_pinned(self.freeze(retry, controller=False), "already_pinned")
        second = self.outcome(retry, self.pending("route"))
        self.assertNotEqual(second["outcome"], response["outcome"])
        document = json.loads(expected_path.read_bytes())
        self.assertEqual(document["result_commit"], self.result["result_commit"])
        self.assertEqual(document["pin_sha256"], pinned["pin_sha256"])
        self.assertEqual(stat.S_IMODE(expected_path.stat().st_mode), 0o600)

    def test_source_pull_requires_pin_without_creating_controller(self):
        self.publish()
        self.invoke("request", ("--mode", "source-pull"), error="PIN_REQUIRED")
        self.assertEqual(self.system.controls, [])
        self.assertFalse((self.state_dir / "attempts").exists()
                         and list((self.state_dir / "attempts").iterdir()))

    def test_source_pull_applied_ack_uses_actual_source_apply_head_index_and_evidence(self):
        self.pin()
        self.system.fresh_helper_without_controller()
        attempt = self.request(mode="source-pull")
        ack = self.source_ack()
        response = self.outcome(attempt, {
            "delivery": "applied", "reason": None, "detail": None,
            "paths": ack["helper"]["paths"], "source_ack": ack,
        })
        outcome_path = self.state_dir / "attempts" / attempt["attempt_id"] / "outcome.json"
        self.assertEqual(response["status"], "recorded")
        self.assertEqual(response["delivery"], "applied")
        self.assertIsNone(response["reason"])
        self.assertEqual(response["outcome"], str(outcome_path))
        document = json.loads(outcome_path.read_bytes())
        self.assertEqual(document["source_ack"], ack)
        self.assertEqual(document["result_commit"], self.result["result_commit"])
        self.assertFalse((outcome_path.parent / "handoff.json").exists())
        self.assertEqual([entry[0] for entry in self.system.controls], ["stop"])

    def test_already_applied_ack_comes_from_actual_repeat_source_apply(self):
        self.pin()
        self.system.fresh_helper_without_controller()
        attempt = self.request(mode="source-pull")
        ack = self.source_ack(status="already_applied")
        response = self.outcome(attempt, {
            "delivery": "already_applied", "reason": None, "detail": None,
            "paths": ack["helper"]["paths"], "source_ack": ack,
        })
        self.assertEqual(response["status"], "recorded")
        self.assertEqual(response["delivery"], "already_applied")
        self.assertEqual(json.loads(Path(response["outcome"]).read_bytes())["source_ack"], ack)

    def test_applied_without_actual_ack_is_refused_without_outcome(self):
        self.pin()
        attempt = self.request(mode="source-pull")
        self.outcome(attempt, {
            "delivery": "applied", "reason": None, "detail": None,
            "paths": [], "source_ack": None,
        }, error="INVALID_INPUT")
        path = self.state_dir / "attempts" / attempt["attempt_id"] / "outcome.json"
        self.assertFalse(path.exists())

    def test_source_ack_wrong_receipt_binding_is_refused(self):
        self.pin()
        attempt = self.request(mode="source-pull")
        ack = self.source_ack()
        ack["receipt_sha256"] = "0" * 64
        self.outcome(attempt, {
            "delivery": "applied", "reason": None, "detail": None,
            "paths": ack["helper"]["paths"], "source_ack": ack,
        }, error="RECEIPT_MISMATCH")
        self.assertFalse((self.state_dir / "attempts" / attempt["attempt_id"] / "outcome.json").exists())

    def test_source_ack_requires_full_canonical_helper_response(self):
        self.pin()
        ack = self.source_ack()
        for key in ("ok", "result_commit", "work_tip", "suppressed", "state",
                    "next_steps", "status", "paths"):
            with self.subTest(missing_helper_key=key):
                attempt = self.request(mode="source-pull")
                partial = copy.deepcopy(ack)
                del partial["helper"][key]
                self.outcome(attempt, {
                    "delivery": "applied", "reason": None, "detail": None,
                    "paths": ack["helper"]["paths"], "source_ack": partial,
                }, error="INVALID_INPUT")
                path = self.state_dir / "attempts" / attempt["attempt_id"] / "outcome.json"
                self.assertFalse(path.exists())

    def test_source_ack_requires_writer_evidence_detail(self):
        self.pin()
        attempt = self.request(mode="source-pull")
        ack = self.source_ack()
        del ack["writer_evidence"]["detail"]
        self.outcome(attempt, {
            "delivery": "applied", "reason": None, "detail": None,
            "paths": ack["helper"]["paths"], "source_ack": ack,
        }, error="INVALID_INPUT")
        self.assertFalse((self.state_dir / "attempts" / attempt["attempt_id"] / "outcome.json").exists())

    def test_source_ack_rejects_wrong_identity_result_and_terminal_bindings(self):
        self.pin()
        ack = self.source_ack()
        mismatches = (
            (("root",), self.result["result_commit"]),
            (("snapshot",), self.result["result_commit"]),
            (("result_commit",), self.root),
            (("helper", "result_commit"), self.root),
            (("helper", "work_tip"), self.root),
            (("helper", "state"), "paused"),
            (("helper", "next_steps"), ["Resume unrelated work."]),
        )
        for fields, wrong_value in mismatches:
            with self.subTest(binding=".".join(fields)):
                attempt = self.request(mode="source-pull")
                wrong = copy.deepcopy(ack)
                target = wrong
                for field in fields[:-1]:
                    target = target[field]
                target[fields[-1]] = wrong_value
                self.outcome(attempt, {
                    "delivery": "applied", "reason": None, "detail": None,
                    "paths": ack["helper"]["paths"], "source_ack": wrong,
                }, error="IDENTITY_MISMATCH")
                path = self.state_dir / "attempts" / attempt["attempt_id"] / "outcome.json"
                self.assertFalse(path.exists())

    def test_source_ack_rejects_changed_head_or_index(self):
        self.pin()
        ack = self.source_ack()
        for field, wrong_value in (
            ("head_after", self.result["result_commit"]),
            ("index_after_sha256", "0" * 64),
        ):
            with self.subTest(changed=field):
                attempt = self.request(mode="source-pull")
                wrong = copy.deepcopy(ack)
                wrong[field] = wrong_value
                self.outcome(attempt, {
                    "delivery": "applied", "reason": None, "detail": None,
                    "paths": ack["helper"]["paths"], "source_ack": wrong,
                }, error="INVALID_INPUT")
                path = self.state_dir / "attempts" / attempt["attempt_id"] / "outcome.json"
                self.assertFalse(path.exists())

if __name__ == "__main__":
    unittest.main(verbosity=2)
