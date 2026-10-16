#!/usr/bin/env python3

import argparse
import ast
import datetime
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import stat
import subprocess
import sys
import tempfile
from dataclasses import dataclass
from typing import Literal, Optional, overload
from urllib.parse import urlsplit


class Refusal(Exception):
    def __init__(self, code, exit_code=3, **fields):
        self.code = code
        self.exit_code = exit_code
        self.fields = fields


def require(condition, code="INVALID_INPUT", exit_code=2, **fields):
    if not condition:
        raise Refusal(code, exit_code, **fields)


def pairs_unique(pairs):
    result = {}
    for key, value in pairs:
        require(key not in result)
        result[key] = value
    return result


def parse_json(data):
    try:
        return json.loads(data, object_pairs_hook=pairs_unique,
                          parse_constant=lambda _: (_ for _ in ()).throw(Refusal("INVALID_INPUT", 2)))
    except (ValueError, UnicodeError):
        raise Refusal("INVALID_INPUT", 2) from None


def load_json(path):
    return parse_json(Path(path).read_bytes())


def encoded(value):
    return (json.dumps(value, ensure_ascii=True, sort_keys=True, indent=2) + "\n").encode()


def keys(value, expected):
    require(type(value) is dict and set(value) == set(expected))
    return value


def text(value):
    require(type(value) is str and bool(value.strip()) and "\x00" not in value)
    return value


def repo_path(value):
    text(value)
    path = PurePosixPath(value)
    require(not path.is_absolute() and "\\" not in value
            and all(part not in ("", ".", "..") and part.lower() != ".git"
                    for part in value.split("/")))
    return value


def slug(value):
    text(value)
    require(re.fullmatch(r"[0-9]{8}-[a-z]+-[a-z]+-[a-z]+", value) is not None
            and len("offload-" + value) <= 32)
    try:
        datetime.datetime.strptime(value[:8], "%Y%m%d")
    except ValueError:
        raise Refusal("INVALID_INPUT", 2) from None
    return value


def endpoint(value):
    keys(value, ("host", "path"))
    text(value["host"])
    require(not any(c.isspace() for c in value["host"]))
    require(Path(text(value["path"])).is_absolute())
    return value


def mirror(value, git):
    keys(value, ("url", "path", "root"))
    url = text(value["url"])
    require(not any(c.isspace() for c in url) and not url.startswith("-"))
    if url.startswith("ssh://"):
        try:
            parsed = urlsplit(url)
            host, user, port = parsed.hostname, parsed.username, parsed.port
        except ValueError:
            raise Refusal("INVALID_INPUT", 2) from None
        require(host is not None and re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9:._-]*", host) is not None
                and (user is None or re.fullmatch(r"[A-Za-z0-9_][A-Za-z0-9_.-]*", user) is not None)
                and (port is None or 1 <= port <= 65535) and parsed.password is None
                and not parsed.query and not parsed.fragment and parsed.path.startswith("/"))
    else:
        require(re.fullmatch(r"(?:[A-Za-z0-9_][A-Za-z0-9_.-]*@)?[A-Za-z0-9][A-Za-z0-9._-]*:/.*",
                             url) is not None)
    require(Path(text(value["path"])).is_absolute())
    git.oid(value["root"])
    return value


@dataclass(frozen=True)
class Entry:
    mode: str
    kind: str
    oid: str


@dataclass(frozen=True)
class Binding:
    receipt: dict
    prose: str
    brief: str
    result: str

    @property
    def identity(self):
        return self.receipt["identity"]

    @property
    def snapshot(self):
        return self.identity["snapshot"]

    @property
    def commit(self):
        return self.receipt["brief_commit"]


def record_paths(prose):
    repo_path(prose)
    require(prose.endswith(".md"))
    path = PurePosixPath(prose)
    brief = str(path.with_suffix(".json"))
    result = str(path.parent / "result.json")
    require(brief != result)
    return brief, result


class Git:
    def __init__(self, path):
        self.path = Path(path).resolve()
        self.env = {key: value for key, value in os.environ.items() if not key.startswith("GIT_")}
        self.env.update(GIT_OPTIONAL_LOCKS="0", GIT_NO_REPLACE_OBJECTS="1",
                        GIT_NO_LAZY_FETCH="1", GIT_TERMINAL_PROMPT="0", LC_ALL="C")
        top = self.run("rev-parse", "--show-toplevel").strip()
        self.path = Path(os.fsdecode(top)).resolve()
        self.width = 64 if self.run("rev-parse", "--show-object-format").strip() == b"sha256" else 40
        self.zero = "0" * self.width
        shallow = self.run("rev-parse", "--is-shallow-repository").strip()
        require(shallow == b"false", "INCOMPLETE_HISTORY", 3)
        require(not self.run("for-each-ref", "--format=%(refname)", "refs/replace/").strip(),
                "AMBIGUOUS_HISTORY", 3)
        for name in ("info/grafts", "shallow"):
            file = self.git_path(name)
            require(not file.exists() or file.stat().st_size == 0, "AMBIGUOUS_HISTORY", 3)

    @overload
    def run(self, *args: str, data: Optional[bytes] = ..., env: Optional[dict] = ...,
            check: Literal[True] = ..., failure: str = ...) -> bytes: ...
    @overload
    def run(self, *args: str, data: Optional[bytes] = ..., env: Optional[dict] = ...,
            check: Literal[False], failure: str = ...) -> subprocess.CompletedProcess[bytes]: ...
    def run(self, *args, data=None, env=None, check=True, failure="GIT_FAILED"):
        process = subprocess.run(["git", "-c", "core.fsmonitor=false", "-C", str(self.path), *args],
                                 input=data, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                 env={**self.env, **(env or {})}, shell=False)
        if check and process.returncode:
            raise Refusal(failure, 4)
        return process.stdout if check else process

    def git_path(self, name):
        value = Path(os.fsdecode(self.run("rev-parse", "--git-path", name).strip()))
        return value if value.is_absolute() else self.path / value

    def oid(self, value, kind=None):
        require(type(value) is str and re.fullmatch(r"[0-9a-f]{%d}" % self.width, value) is not None)
        if kind is not None:
            process = self.run("cat-file", "-t", value, check=False)
            require(process.returncode == 0 and process.stdout.strip() == kind.encode(),
                    "MISSING_OBJECT", 3)
        return value

    def head(self):
        return self.oid(self.run("rev-parse", "--verify", "HEAD").strip().decode(), "commit")

    def object(self, kind, oid):
        self.oid(oid, kind)
        return self.run("cat-file", kind, oid)

    def hash_blob(self, data):
        return self.run("hash-object", "-w", "--stdin", data=data).strip().decode()

    def parents(self, oid):
        return [line[7:].decode() for line in self.object("commit", oid).split(b"\n\n", 1)[0].splitlines()
                if line.startswith(b"parent ")]

    def root(self, tip):
        self.oid(tip, "commit")
        roots = self.run("rev-list", "--max-parents=0", tip).splitlines()
        require(len(roots) == 1, "AMBIGUOUS_HISTORY", 3)
        return roots[0].decode()

    def tree(self, tip):
        result = {}
        for row in self.run("ls-tree", "-r", "-z", "--full-tree", tip).split(b"\x00"):
            if row:
                meta, path = row.split(b"\t", 1)
                mode, kind, oid = meta.decode().split()
                result[os.fsdecode(path)] = Entry(mode, kind, oid)
        return result

    def names(self, *args):
        return [os.fsdecode(value) for value in self.run(*args).split(b"\x00") if value]

    def inventory(self):
        dirty = sorted(set(self.names("diff", "--name-only", "-z", "--")) |
                       set(self.names("diff", "--cached", "--name-only", "-z", "HEAD", "--")))
        untracked = sorted(self.names("ls-files", "--others", "--exclude-standard", "-z"))
        return dirty, untracked

    def clean(self):
        require(not self.run("status", "--porcelain=v1", "-z", "--untracked-files=all",
                             "--ignore-submodules=none"), "DIRTY_WORKTREE", 3)

    def ancestor(self, older, newer):
        process = self.run("merge-base", "--is-ancestor", older, newer, check=False)
        return process.returncode == 0


FALLBACK = (
    ("private_key", r"-----BEGIN [A-Z ]*PRIVATE KEY-----"),
    ("age_private_key", r"\bAGE-SECRET-KEY-1[0-9A-Z]{20,}\b"),
    ("credential_assignment", r"(?i)\b(password|passwd|pwd|passphrase|secret|client[_-]?secret|api[_-]?key|access[_-]?key|token|psk|wifi key)\b\s*[:=]\s*['\"]?(?!value\b|<|\$|\{|\(|\*)[^\s'\"()<>`|]{6,}"),
    ("bearer", r"(?i)\bbearer\s+[A-Za-z0-9._~+/=-]{20,}"),
    ("jwt", r"\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{5,}"),
    ("aws_access_id", r"\bAKIA[0-9A-Z]{16}\b"),
    ("github_token", r"\bgh[pousr]_[A-Za-z0-9]{30,}\b"),
    ("slack_token", r"\bxox[abprs]-[A-Za-z0-9-]{10,}"),
)


def literal_flags(node):
    if isinstance(node, ast.Constant) and type(node.value) is int and node.value == 0:
        return 0
    if isinstance(node, ast.Attribute) and isinstance(node.value, ast.Name) and node.value.id == "re":
        require(node.attr in ("I", "IGNORECASE", "M", "MULTILINE", "S", "DOTALL", "X", "VERBOSE",
                              "A", "ASCII", "U", "UNICODE"), "UNSUPPORTED_SECRET_POLICY", 3)
        return getattr(re, node.attr)
    if isinstance(node, ast.BinOp) and isinstance(node.op, ast.BitOr):
        return literal_flags(node.left) | literal_flags(node.right)
    raise Refusal("UNSUPPORTED_SECRET_POLICY", 3)


def extract_policy(data):
    try:
        tree = ast.parse(data)
        nodes = list(ast.walk(tree))
        imports = [node for node in tree.body if isinstance(node, ast.Import)
                   and any(alias.name == "re" and alias.asname is None for alias in node.names)]
        require(len(imports) == 1, "UNSUPPORTED_SECRET_POLICY", 3)
        standard_re = [alias for alias in imports[0].names if alias.name == "re" and alias.asname is None]
        require(len(standard_re) == 1, "UNSUPPORTED_SECRET_POLICY", 3)
        compiler_calls = {id(node.func) for node in nodes if isinstance(node, ast.Call)
                          and isinstance(node.func, ast.Attribute) and node.func.attr == "compile"}
        module_reads = {id(node.value) for node in nodes if isinstance(node, ast.Attribute)
                        and isinstance(node.ctx, ast.Load) and isinstance(node.value, ast.Name)
                        and node.value.id == "re" and node.attr in
                        ("compile", "I", "IGNORECASE", "M", "MULTILINE", "S", "DOTALL",
                         "X", "VERBOSE", "A", "ASCII", "U", "UNICODE")
                        and (node.attr != "compile" or id(node) in compiler_calls)}
        for node in nodes:
            if isinstance(node, ast.Name) and node.id == "re":
                require(isinstance(node.ctx, ast.Load) and id(node) in module_reads,
                        "UNSUPPORTED_SECRET_POLICY", 3)
            if isinstance(node, ast.alias) and (node.asname or node.name.split(".")[0]) == "re":
                require(node is standard_re[0], "UNSUPPORTED_SECRET_POLICY", 3)
            if isinstance(node, ast.arg):
                require(node.arg != "re", "UNSUPPORTED_SECRET_POLICY", 3)
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef, ast.ExceptHandler)):
                require(node.name != "re", "UNSUPPORTED_SECRET_POLICY", 3)
            if isinstance(node, (ast.Global, ast.Nonlocal)):
                require("re" not in node.names, "UNSUPPORTED_SECRET_POLICY", 3)
            if isinstance(node, (ast.MatchAs, ast.MatchStar)):
                require(node.name != "re", "UNSUPPORTED_SECRET_POLICY", 3)
            if isinstance(node, ast.MatchMapping):
                require(node.rest != "re", "UNSUPPORTED_SECRET_POLICY", 3)
        assignments = [node for node in tree.body if isinstance(node, ast.Assign)
                       and any(isinstance(target, ast.Name) and target.id == "PATTERNS" for target in node.targets)]
        require(len(assignments) == 1 and len(assignments[0].targets) == 1,
                "UNSUPPORTED_SECRET_POLICY", 3)
        assignment = assignments[0]
        require(isinstance(assignment.value, (ast.List, ast.Tuple)), "UNSUPPORTED_SECRET_POLICY", 3)
        allowed_names = {id(assignment.targets[0])}
        allowed_reads = {id(node.iter) for node in ast.walk(tree)
                         if isinstance(node, (ast.For, ast.comprehension))
                         and isinstance(node.iter, ast.Name) and node.iter.id == "PATTERNS"}
        for node in ast.walk(tree):
            if isinstance(node, ast.Name) and node.id == "PATTERNS":
                permitted = allowed_reads if isinstance(node.ctx, ast.Load) else allowed_names
                require(id(node) in permitted, "UNSUPPORTED_SECRET_POLICY", 3)
            if isinstance(node, ast.alias):
                require((node.asname or node.name.split(".")[0]) != "PATTERNS",
                        "UNSUPPORTED_SECRET_POLICY", 3)
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
                require(node.name != "PATTERNS", "UNSUPPORTED_SECRET_POLICY", 3)
            if isinstance(node, (ast.Attribute, ast.Subscript)):
                base = node.value
                while isinstance(base, (ast.Attribute, ast.Subscript)):
                    base = base.value
                if isinstance(base, ast.Name) and base.id == "PATTERNS":
                    raise Refusal("UNSUPPORTED_SECRET_POLICY", 3)
            if isinstance(node, (ast.Assign, ast.AnnAssign, ast.AugAssign)) and node is not assignment:
                value = node.value
                require(value is None or not any(isinstance(child, ast.Name) and child.id == "PATTERNS"
                                                for child in ast.walk(value)), "UNSUPPORTED_SECRET_POLICY", 3)
            if isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
                require(node.func.id not in ("exec", "eval", "globals", "locals", "setattr"),
                        "UNSUPPORTED_SECRET_POLICY", 3)
        rules = []
        patterns_node = assignment.value
        assert isinstance(patterns_node, (ast.List, ast.Tuple))
        for index, entry in enumerate(patterns_node.elts, 1):
            require(isinstance(entry, ast.Tuple) and len(entry.elts) == 2,
                    "UNSUPPORTED_SECRET_POLICY", 3)
            assert isinstance(entry, ast.Tuple)
            label, call = entry.elts
            assert isinstance(label, ast.Constant) and isinstance(call, ast.Call)
            require(type(label.value) is str
                    and isinstance(call.func, ast.Attribute)
                    and isinstance(call.func.value, ast.Name) and call.func.value.id == "re"
                    and call.func.attr == "compile" and 1 <= len(call.args) <= 2,
                    "UNSUPPORTED_SECRET_POLICY", 3)
            assert isinstance(call.func, ast.Attribute) and isinstance(call.func.value, ast.Name)
            pattern = call.args[0]
            require(isinstance(pattern, ast.Constant) and type(pattern.value) is str,
                    "UNSUPPORTED_SECRET_POLICY", 3)
            assert isinstance(pattern, ast.Constant)
            assert isinstance(pattern.value, str)
            require(not call.keywords or (len(call.keywords) == 1 and call.keywords[0].arg == "flags"
                                         and len(call.args) == 1), "UNSUPPORTED_SECRET_POLICY", 3)
            flags = literal_flags(call.args[1]) if len(call.args) == 2 else (
                literal_flags(call.keywords[0].value) if call.keywords else 0)
            rules.append((f"policy_{index}", re.compile(pattern.value, flags)))
        return rules
    except (SyntaxError, ValueError, TypeError, re.error, UnicodeError):
        raise Refusal("UNSUPPORTED_SECRET_POLICY", 3) from None


def effective_policy(git):
    process = git.run("config", "--path", "--get", "core.hooksPath", check=False)
    require(process.returncode in (0, 1), "GIT_FAILED", 4)
    if process.returncode == 0:
        directory = Path(os.fsdecode(process.stdout.strip()))
        if not directory.is_absolute():
            directory = git.path / directory
        hook = directory / "pre-commit"
    else:
        hook = git.git_path("hooks/pre-commit")
    if not hook.exists():
        return None
    require(hook.is_file(), "UNSUPPORTED_SECRET_POLICY", 3)
    data = hook.read_bytes()
    extract_policy(data)
    return data


def secret_rules(policy):
    return [(name, re.compile(pattern)) for name, pattern in FALLBACK] + (
        extract_policy(policy) if policy is not None else [])


def parse_allowlist(value, git):
    require(type(value) is list)
    result = set()
    for row in value:
        keys(row, ("object", "path", "rule", "reason"))
        git.oid(row["object"])
        if row["path"] != "<commit>":
            repo_path(row["path"])
        require(type(row["rule"]) is str and (row["rule"] in dict(FALLBACK)
                or re.fullmatch(r"policy_[1-9][0-9]*", row["rule"])), "INVALID_INPUT", 2)
        text(row["reason"])
        result.add((row["object"], row["path"], row["rule"]))
    return result


def allow_entries(path, git):
    return parse_allowlist(load_json(path), git) if path else set()


def scan_history(git, tip, rules, allowed):
    commits = git.run("rev-list", tip).splitlines()
    blob_rules = {}
    hits = {}
    suppressed = set()
    for raw in commits:
        commit = raw.decode()
        metadata = git.object("commit", commit).decode("utf-8", "surrogateescape")
        for rule, pattern in rules:
            if pattern.search(metadata):
                key = (commit, "<commit>", rule)
                if key in allowed:
                    suppressed.add(key)
                elif key not in hits:
                    hits[key] = {"commit": commit, "object": commit, "path": "<commit>", "rule": rule}
        for path, entry in git.tree(commit).items():
            if entry.kind != "blob":
                continue
            if entry.oid not in blob_rules:
                data = git.object("blob", entry.oid).decode("utf-8", "surrogateescape")
                blob_rules[entry.oid] = [rule for rule, pattern in rules if pattern.search(data)]
            for rule in blob_rules[entry.oid]:
                key = (entry.oid, path, rule)
                if key in allowed:
                    suppressed.add(key)
                elif key not in hits:
                    hits[key] = {"commit": commit, "object": entry.oid, "path": path, "rule": rule}
    if hits:
        raise Refusal("UNSAFE_HISTORY", 3, hits=list(hits.values()))
    return {"commits": len(commits), "blobs": len(blob_rules), "suppressed": len(suppressed)}


def blocked(path):
    parts = PurePosixPath(path).parts
    return any(part.lower().startswith(".env") or part.lower() == ".mcp.json" for part in parts) or (
        parts[-1].lower().endswith((".pem", ".key", ".pfx", ".p7m", ".kdbx")))


def representable(git, tree):
    dependencies = []
    gitlinks = {path for path, entry in tree.items() if entry.mode == "160000"}
    for path in sorted(gitlinks):
        nested = git.path / path
        if (nested / ".git").exists():
            child = Git(nested)
            require(not child.run("status", "--porcelain=v1", "-z", "--untracked-files=all",
                                  "--ignore-submodules=none"), "UNREPRESENTABLE_NESTED_WORKTREE", 3,
                    paths=[path])
            require(child.head() == tree[path].oid, "UNREPRESENTABLE_NESTED_WORKTREE", 3, paths=[path])
        dependencies.append({"path": path, "commit": tree[path].oid})
    for path in git.names("ls-files", "--others", "--exclude-standard", "-z"):
        candidate = git.path / path
        for directory in (candidate, *candidate.parents):
            if directory == git.path:
                break
            relative = directory.relative_to(git.path).as_posix()
            if relative not in gitlinks and (directory / ".git").exists():
                raise Refusal("UNREPRESENTABLE_NESTED_WORKTREE", 3, paths=[relative])
    return dependencies


def source_state(git):
    index = git.git_path("index")
    index_bytes = index.read_bytes() if index.exists() else None
    states = {}
    candidates = set(git.tree(git.head())) | set(git.names("ls-files", "-z")) | set(
        git.names("ls-files", "--others", "--exclude-standard", "-z"))
    for relative in candidates:
        file = git.path / relative
        try:
            info = file.lstat()
        except FileNotFoundError:
            states[relative] = None
            continue
        if file.is_symlink():
            digest = os.readlink(file)
        elif stat.S_ISREG(info.st_mode) and not blocked(relative):
            digest = hashlib.sha256(file.read_bytes()).digest()
        else:
            digest = (info.st_size, info.st_mtime_ns, info.st_ctime_ns)
        states[relative] = (info.st_mode, digest)
    return git.head(), index_bytes, states


def project_copy(git):
    # A Snapshot must come from the user's project copy: not a linked worktree
    # (an Offload worker), not an offload/* branch, not a retired ~/offload Mirror.
    common = Path(os.fsdecode(git.run("rev-parse", "--path-format=absolute", "--git-common-dir").strip())).resolve()
    require(common == (git.path / ".git").resolve(), "NOT_PROJECT_COPY", 3)
    branch = git.run("symbolic-ref", "--quiet", "--short", "HEAD", check=False)
    require(not branch.stdout.startswith(b"offload/"), "NOT_PROJECT_COPY", 3)
    mirrors = (Path.home() / "offload").resolve()
    require(mirrors not in git.path.parents, "NOT_PROJECT_COPY", 3)


def parse_request(value, git):
    keys(value, ("slug", "brief_path", "source", "target", "mirror"))
    slug(value["slug"])
    brief, result = record_paths(value["brief_path"])
    require(not any(blocked(path) for path in (value["brief_path"], brief, result)))
    endpoint(value["source"])
    endpoint(value["target"])
    mirror(value["mirror"], git)
    return value


def parse_binding(value, git):
    required = {"schema", "identity", "source_head", "brief_commit", "brief_json_blob",
                "brief_prose_blob", "policy_blob", "source", "target", "mirror",
                "included", "held", "omitted", "history_warning"}
    require(type(value) is dict and required <= set(value) and type(value["schema"]) is int
            and value["schema"] == 1)
    identity = keys(value["identity"], ("root", "slug", "branch", "snapshot", "brief_path"))
    slug(identity["slug"])
    require(identity["branch"] == "offload/" + identity["slug"])
    brief, result = record_paths(identity["brief_path"])
    for key in ("root", "snapshot"):
        git.oid(identity[key], "commit")
    for key in ("source_head", "brief_commit"):
        git.oid(value[key], "commit")
    for key in ("brief_json_blob", "brief_prose_blob"):
        git.oid(value[key], "blob")
    for key in ("policy_blob", "allowlist_blob"):
        if value.get(key) is not None:
            git.oid(value[key])
    endpoint(value["source"])
    endpoint(value["target"])
    mirror(value["mirror"], git)
    require(value["mirror"]["root"] == identity["root"])
    for field in ("included", "held", "omitted"):
        require(type(value[field]) is list)
        for path in value[field]:
            repo_path(path)
    return Binding(value, identity["brief_path"], brief, result)


def brief_content(binding):
    receipt = binding.receipt
    return {"schema": 1, "identity": binding.identity, "source_head": receipt["source_head"],
            "source": receipt["source"], "target": receipt["target"], "mirror": receipt["mirror"]}


def valid_prose(data):
    try:
        prose = data.decode("utf-8")
    except UnicodeError:
        raise Refusal("INVALID_BRIEF", 2) from None
    headings = list(re.finditer(r"(?m)^#{1,6}\s+([^\n]+)\s*$", prose))
    sections = {}
    for index, heading in enumerate(headings):
        end = headings[index + 1].start() if index + 1 < len(headings) else len(prose)
        sections[heading.group(1).strip().lower()] = prose[heading.end():end].strip()
    names = ("goal", "state", "decisions", "non-goals", "next steps", "dependencies", "access gaps",
             "verification", "finish")
    require(all(sections.get(name) for name in names), "INVALID_BRIEF", 2)
    require(re.search(r"\bresult\b", sections["finish"]) is not None, "INVALID_BRIEF", 2)


def delta(left, right):
    return sorted(path for path in left.keys() | right.keys() if left.get(path) != right.get(path))


def validate_brief(git, binding):
    receipt = binding.receipt
    require(git.parents(binding.snapshot) == [receipt["source_head"]], "INVALID_RESULT", 3)
    require(git.parents(binding.commit) == [binding.snapshot], "INVALID_RESULT", 3)
    for tip in (receipt["source_head"], binding.snapshot, binding.commit):
        require(git.root(tip) == binding.identity["root"], "ROOT_MISMATCH", 3)
    snapshot_tree = git.tree(binding.snapshot)
    brief_tree = git.tree(binding.commit)
    require(delta(snapshot_tree, brief_tree) == sorted([binding.prose, binding.brief]), "INVALID_RESULT", 3)
    for path, oid in ((binding.prose, receipt["brief_prose_blob"]), (binding.brief, receipt["brief_json_blob"])):
        require(path not in snapshot_tree and brief_tree.get(path) == Entry("100644", "blob", oid),
                "INVALID_RESULT", 3)
    parent = str(PurePosixPath(binding.prose).parent)
    require(parent == "." or not any(path == parent or path.startswith(parent + "/") for path in snapshot_tree),
            "INVALID_RESULT", 3)
    require(binding.result not in brief_tree, "INVALID_RESULT", 3)
    require(parse_json(git.object("blob", receipt["brief_json_blob"])) == brief_content(binding),
            "INVALID_RESULT", 3)
    valid_prose(git.object("blob", receipt["brief_prose_blob"]))
    return brief_tree


def validate_work(git, binding, work_tip):
    original = validate_brief(git, binding)
    require(git.ancestor(binding.commit, work_tip), "INVALID_RESULT", 3)
    require(git.root(work_tip) == binding.identity["root"], "ROOT_MISMATCH", 3)
    for raw in git.run("rev-list", work_tip, "^" + binding.commit).splitlines():
        tree = git.tree(raw.decode())
        mcp_paths = [path for path in original.keys() | tree.keys()
                     if any(part.lower() == ".mcp.json" for part in PurePosixPath(path).parts)
                     and original.get(path) != tree.get(path)]
        require(not mcp_paths, "MCP_CONFIG_CHANGED", 3, paths=sorted(mcp_paths), commit=raw.decode())
        require(all(tree.get(path) == original[path] for path in (binding.prose, binding.brief)),
                "BRIEF_CHANGED", 3)
        require(binding.result not in tree, "INVALID_RESULT", 3)
    return git.tree(work_tip)


def summary_input(value):
    keys(value, ("state", "summary", "verification", "limitations", "next_steps"))
    require(type(value["state"]) is str and value["state"] in ("complete", "paused"))
    text(value["summary"])
    for field in ("verification", "limitations", "next_steps"):
        require(type(value[field]) is list)
        for item in value[field]:
            text(item)
    require(not value["next_steps"] if value["state"] == "complete" else bool(value["next_steps"]))
    return value


def validate_note(git, binding, result_commit):
    git.oid(result_commit, "commit")
    parents = git.parents(result_commit)
    require(len(parents) == 1, "INVALID_RESULT", 3)
    work_tip = parents[0]
    work_tree = validate_work(git, binding, work_tip)
    note_tree = git.tree(result_commit)
    require(git.root(result_commit) == binding.identity["root"], "ROOT_MISMATCH", 3)
    require(delta(work_tree, note_tree) == [binding.result] and binding.result not in work_tree,
            "INVALID_RESULT", 3)
    entry = note_tree.get(binding.result)
    require(entry is not None and entry.mode == "100644" and entry.kind == "blob", "INVALID_RESULT", 3)
    assert entry is not None
    note = parse_json(git.object("blob", entry.oid))
    keys(note, ("schema", "identity", "work_tip", "state", "summary", "verification", "limitations", "next_steps"))
    require(type(note["schema"]) is int and note["schema"] == 1 and note["identity"] == binding.identity
            and note["work_tip"] == work_tip, "INVALID_RESULT", 3)
    summary_input({key: note[key] for key in ("state", "summary", "verification", "limitations", "next_steps")})
    return work_tip, note


def receiver_policy(git, binding, extra_allowed):
    receipt = binding.receipt
    policy = git.object("blob", receipt["policy_blob"]) if receipt["policy_blob"] is not None else None
    allowed = set(extra_allowed)
    if receipt.get("allowlist_blob") is not None:
        allowed |= parse_allowlist(parse_json(git.object("blob", receipt["allowlist_blob"])), git)
    return secret_rules(policy), allowed


def snapshot(git, args):
    request = parse_request(load_json(args.request), git)
    project_copy(git)
    prose = Path(args.brief_prose).read_bytes()
    valid_prose(prose)
    head = git.head()
    root = git.root(head)
    require(root == request["mirror"]["root"], "ROOT_MISMATCH", 3)
    branch = "offload/" + request["slug"]
    ref = "refs/heads/" + branch
    authority_ref = "refs/offload-local/" + request["slug"]
    require(not git.run("for-each-ref", "--format=%(refname)", authority_ref + "/").strip(),
            "LOCAL_AUTHORITY_EXISTS", 3)
    require(not git.run("for-each-ref", "--format=%(refname)", ref).strip(), "BRANCH_EXISTS", 3)
    require(("branch " + ref).encode() not in git.run("worktree", "list", "--porcelain"), "BRANCH_EXISTS", 3)
    policy = effective_policy(git)
    rules = secret_rules(policy)
    allowance = load_json(args.allowlist) if args.allowlist else None
    allowed = parse_allowlist(allowance, git) if allowance is not None else set()
    scan_history(git, head, rules, allowed)
    original = source_state(git)
    head_tree = git.tree(head)
    dependencies = representable(git, head_tree)
    candidates = set(head_tree) | set(git.names("ls-files", "-z")) | set(
        git.names("ls-files", "--others", "--exclude-standard", "-z"))
    exclusions = sorted(path for path in candidates if blocked(path))
    held = sorted(path for path in exclusions if path in head_tree)
    omitted = sorted(path for path in exclusions if path not in head_tree)
    with tempfile.TemporaryDirectory(prefix="offload-index-") as private:
        env = {"GIT_INDEX_FILE": str(Path(private) / "index")}
        git.run("read-tree", head, env=env)
        specs = [".", *(":(exclude,literal)" + path for path in exclusions)]
        git.run("add", "-A", "--pathspec-from-file=-", "--pathspec-file-nul", env=env,
                data=b"\x00".join(os.fsencode(spec) for spec in specs) + b"\x00")
        rows = []
        for path in exclusions:
            entry = head_tree.get(path)
            meta = entry.mode + " " + entry.oid if entry else "0 " + git.zero
            rows.append(meta.encode() + b"\t" + os.fsencode(path) + b"\x00")
        if rows:
            git.run("update-index", "-z", "--index-info", env=env, data=b"".join(rows))
        tree_oid = git.run("write-tree", env=env).strip().decode()
    tree = git.tree(tree_oid)
    require(all(tree.get(path) == head_tree.get(path) for path in exclusions), "EXCLUSION_FAILED", 3)
    prose_path = request["brief_path"]
    brief_path, result_path = record_paths(prose_path)
    parent = str(PurePosixPath(prose_path).parent)
    require(not any(path in tree for path in (prose_path, brief_path, result_path))
            and (parent == "." or not any(path == parent or path.startswith(parent + "/") for path in tree)),
            "RECORD_COLLISION", 3)
    for ancestor in PurePosixPath(prose_path).parents:
        require(str(ancestor) not in tree, "UNSAFE_RECORD_PATH", 3)
    ignored = git.run("check-ignore", "--no-index", "-z", "--stdin", check=False,
                      data=b"\x00".join(os.fsencode(path) for path in (prose_path, brief_path, result_path)) + b"\x00")
    require(ignored.returncode == 1, "IGNORED_RECORD_PATH", 3)
    snapshot_oid = git.run("commit-tree", tree_oid, "-p", head,
                           data=("Offload snapshot " + request["slug"] + "\n").encode()).strip().decode()
    identity = {"root": root, "slug": request["slug"], "branch": branch,
                "snapshot": snapshot_oid, "brief_path": prose_path}
    receipt = {"schema": 1, "identity": identity, "source_head": head,
               "source": request["source"], "target": request["target"], "mirror": request["mirror"],
               "policy_blob": git.hash_blob(policy) if policy is not None else None,
               "allowlist_blob": git.hash_blob(encoded(allowance)) if allowance is not None else None,
               "included": delta(head_tree, tree), "held": held, "omitted": omitted,
               "history_warning": "All reachable history travels, including tracked blocked names.",
               "dependencies": dependencies}
    binding = Binding(receipt, prose_path, brief_path, result_path)
    private = Path(tempfile.mkdtemp(prefix="offload-brief-")).resolve()
    worktree = private / "worktree"
    try:
        git.run("worktree", "add", "--detach", str(worktree), snapshot_oid)
        transport = Git(worktree)
        for path, data in ((prose_path, prose), (brief_path, encoded(brief_content(binding)))):
            destination = worktree / path
            require(destination.resolve().is_relative_to(worktree.resolve()), "UNSAFE_RECORD_PATH", 3)
            require(not any(parent.is_symlink() for parent in destination.parents
                            if parent.is_relative_to(worktree)), "UNSAFE_RECORD_PATH", 3)
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_bytes(data)
            destination.chmod(0o644)
        transport.run("add", "--", ":(literal)" + prose_path, ":(literal)" + brief_path)
        transport.run("commit", "-m", "Offload brief " + request["slug"],
                      failure="NORMAL_COMMIT_HOOK_FAILED")
        transport.clean()
        receipt["brief_commit"] = transport.head()
        committed_tree = git.tree(receipt["brief_commit"])
        receipt["brief_json_blob"] = committed_tree.get(brief_path, Entry("", "", "")).oid
        receipt["brief_prose_blob"] = committed_tree.get(prose_path, Entry("", "", "")).oid
        require(receipt["brief_json_blob"] == git.run("hash-object", "--stdin",
                data=encoded(brief_content(binding))).strip().decode()
                and receipt["brief_prose_blob"] == git.run("hash-object", "--stdin", data=prose).strip().decode(),
                "INVALID_BRIEF", 3)
        validate_brief(git, binding)
        scanned = scan_history(git, receipt["brief_commit"], rules, allowed)
        receipt["suppressed"] = scanned["suppressed"]
    finally:
        owned_entry = b"worktree " + os.fsencode(worktree)
        try:
            registered = git.run("worktree", "list", "--porcelain", "-z").split(b"\x00")
            if owned_entry in registered:
                git.run("worktree", "remove", "--force", str(worktree))
                remaining = git.run("worktree", "list", "--porcelain", "-z").split(b"\x00")
                require(owned_entry not in remaining, "OWNED_WORKTREE_CLEANUP_FAILED", 4)
            shutil.rmtree(private)
        except (Exception, KeyboardInterrupt):
            raise Refusal("OWNED_WORKTREE_CLEANUP_FAILED", 4,
                          owned_worktree=str(worktree), owned_directory=str(private)) from None
    require(source_state(git) == original, "SOURCE_CHANGED", 3)
    updates = ["start", "create " + ref + " " + receipt["brief_commit"]]
    for field, suffix in (("policy_blob", "policy"), ("allowlist_blob", "allowlist")):
        if receipt[field] is not None:
            updates.append("create " + authority_ref + "/" + suffix + " " + receipt[field])
    updates.extend(("prepare", "commit"))
    git.run("update-ref", "--stdin", data=("\n".join(updates) + "\n").encode(),
            failure="BRANCH_PUBLICATION_FAILED")
    return receipt


def result(git, args):
    binding = parse_binding(load_json(args.expected), git)
    summary = summary_input(load_json(args.summary))
    branch = git.run("symbolic-ref", "--quiet", "--short", "HEAD", check=False)
    require(branch.returncode == 0 and branch.stdout.strip().decode() == binding.identity["branch"],
            "WRONG_BRANCH", 3)
    git.clean()
    head = git.head()
    policy = effective_policy(git)
    rules = secret_rules(policy)
    allowed = allow_entries(args.allowlist, git)
    if any(rule.startswith("policy_") for _, _, rule in allowed):
        target_policy = git.run("hash-object", "--stdin", data=policy).strip().decode() if policy is not None else None
        require(target_policy is not None and target_policy == binding.receipt["policy_blob"],
                "ALLOWLIST_POLICY_MISMATCH", 3)
    if binding.result in git.tree(head):
        work_tip, note = validate_note(git, binding, head)
        require(all(note[key] == summary[key] for key in summary), "RESULT_MISMATCH", 3)
        scanned = scan_history(git, head, rules, allowed)
        return {"ok": True, "status": "already_recorded", "result_commit": head,
                "work_tip": work_tip, "suppressed": scanned["suppressed"],
                "state": note["state"], "next_steps": note["next_steps"]}
    validate_work(git, binding, head)
    scan_history(git, head, rules, allowed)
    note = {"schema": 1, "identity": binding.identity, "work_tip": head, **summary}
    destination = git.path / binding.result
    require(not destination.exists() and not destination.is_symlink(), "RECORD_COLLISION", 3)
    for parent in destination.parents:
        if parent == git.path:
            break
        require(not parent.is_symlink(), "UNSAFE_RECORD_PATH", 3)
    destination.parent.mkdir(parents=True, exist_ok=True)
    with destination.open("xb") as stream:
        stream.write(encoded(note))
    destination.chmod(0o644)
    git.run("add", "--", ":(literal)" + binding.result)
    git.run("commit", "-m", "Offload result " + binding.identity["slug"],
            failure="NORMAL_COMMIT_HOOK_FAILED")
    result_commit = git.head()
    work_tip, committed_note = validate_note(git, binding, result_commit)
    require(work_tip == head and committed_note == note, "INVALID_RESULT", 3)
    git.clean()
    scanned = scan_history(git, result_commit, rules, allowed)
    return {"ok": True, "status": "recorded", "result_commit": result_commit,
            "work_tip": work_tip, "suppressed": scanned["suppressed"],
            "state": note["state"], "next_steps": note["next_steps"]}


def validated_result(git, binding, result_commit, extra_allowed):
    require(git.root(git.head()) == binding.identity["root"], "ROOT_MISMATCH", 3)
    work_tip, note = validate_note(git, binding, result_commit)
    rules, allowed = receiver_policy(git, binding, extra_allowed)
    scanned = scan_history(git, result_commit, rules, allowed)
    return {"ok": True, "result_commit": result_commit, "work_tip": work_tip,
            "suppressed": scanned["suppressed"], "state": note["state"], "next_steps": note["next_steps"]}


def validate(git, args):
    binding = parse_binding(load_json(args.expected), git)
    return validated_result(git, binding, args.result_commit, allow_entries(args.allowlist, git))


def apply(git, args):
    binding = parse_binding(load_json(args.expected), git)
    validated = validated_result(git, binding, args.result_commit, allow_entries(args.allowlist, git))
    before_head = git.head()
    index = git.git_path("index")
    before_index = index.read_bytes() if index.exists() else None
    patch = git.run("diff", "--binary", "--full-index", "--no-textconv", "--no-ext-diff",
                    "--no-renames", binding.snapshot, args.result_commit, "--")
    paths = delta(git.tree(binding.snapshot), git.tree(args.result_commit))
    for path in paths:
        repo_path(path)
    forward = git.run("apply", "--check", "--binary", "--whitespace=nowarn", data=patch, check=False)
    if forward.returncode:
        reverse = git.run("apply", "--check", "--reverse", "--binary", "--whitespace=nowarn",
                          data=patch, check=False)
        require(reverse.returncode == 0, "APPLY_CONFLICT", 3, paths=paths)
        status = "already_applied"
    else:
        git.run("apply", "--binary", "--whitespace=nowarn", data=patch, failure="APPLY_FAILED_EFFECT_UNCERTAIN")
        status = "applied"
    require(git.head() == before_head and (index.read_bytes() if index.exists() else None) == before_index,
            "RECEIVER_CHANGED_EFFECT_UNCERTAIN", 4)
    return {**validated, "status": status, "paths": paths}


def prep(git, args):
    require(re.fullmatch(r"[0-9]+", args.free_bytes) is not None)
    free = int(args.free_bytes)
    require(free >= 15_000_000_000, "INSUFFICIENT_SPACE", 3, free_bytes=free)
    head = git.head()
    root = git.root(head)
    dirty, untracked = git.inventory()
    response = {"ok": True, "head": head, "root": root, "peer_tip": args.peer_tip,
                "source_only": [], "peer_only": [], "dirty": dirty, "untracked": untracked,
                "free_bytes": free}
    if args.peer_tip:
        git.oid(args.peer_tip, "commit")
        require(git.root(args.peer_tip) == root, "ROOT_MISMATCH", 3)
        response["source_only"] = [row.decode() for row in git.run("rev-list", head, "^" + args.peer_tip).splitlines()]
        response["peer_only"] = [row.decode() for row in git.run("rev-list", args.peer_tip, "^" + head).splitlines()]
        if response["source_only"] and response["peer_only"]:
            raise Refusal("DIVERGED", 3, **{key: value for key, value in response.items() if key != "ok"})
    scanned = scan_history(git, head, secret_rules(effective_policy(git)), allow_entries(args.allowlist, git))
    response["suppressed"] = scanned["suppressed"]
    return response


def scan(git, args):
    root = git.root(args.tip)
    scanned = scan_history(git, args.tip, secret_rules(effective_policy(git)), allow_entries(args.allowlist, git))
    return {"ok": True, "tip": args.tip, "root": root, **scanned}


class Parser(argparse.ArgumentParser):
    def error(self, message):
        raise Refusal("INVALID_ARGUMENTS", 2)

    def print_help(self, file=None):
        raise Refusal("HELP", 0, commands=["snapshot", "result", "validate", "apply", "prep", "scan"])


def main():
    try:
        parser = Parser()
        commands = parser.add_subparsers(dest="command", required=True, parser_class=Parser)
        for command in ("snapshot", "result", "validate", "apply", "prep", "scan"):
            sub = commands.add_parser(command)
            sub.add_argument("--repo", required=True)
            sub.add_argument("--allowlist")
            if command == "snapshot":
                sub.add_argument("--request", required=True)
                sub.add_argument("--brief-prose", required=True)
            elif command in ("result", "validate", "apply"):
                sub.add_argument("--expected", required=True)
                sub.add_argument("--summary" if command == "result" else "--result-commit", required=True)
            elif command == "prep":
                sub.add_argument("--free-bytes", required=True)
                sub.add_argument("--peer-tip")
            else:
                sub.add_argument("--tip", required=True)
        args = parser.parse_args()
        handlers = {"snapshot": snapshot, "result": result, "validate": validate,
                    "apply": apply, "prep": prep, "scan": scan}
        value = handlers[args.command](Git(args.repo), args)
        code = 0
    except Refusal as error:
        value = {"ok": False, "error": error.code, **error.fields}
        code = error.exit_code
    except (Exception, KeyboardInterrupt):
        value = {"ok": False, "error": "OPERATION_FAILED_EFFECT_UNCERTAIN"}
        code = 4
    sys.stdout.write(json.dumps(value, ensure_ascii=True, sort_keys=True) + "\n")
    return code


if __name__ == "__main__":
    sys.exit(main())
