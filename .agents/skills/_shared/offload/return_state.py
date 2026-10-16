#!/usr/bin/env python3

import argparse
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import secrets
import socket
import stat
import subprocess
import sys
import time
from dataclasses import dataclass
from typing import Any, Optional

sys.dont_write_bytecode = True

from git_guard import (
    Refusal,
    Git,
    encoded,
    keys,
    parse_binding,
    parse_json,
    repo_path,
    require,
    slug,
    text,
    validate_brief,
    validate_note,
)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def absolute(value):
    require(
        type(value) is str
        and value.startswith("/")
        and "\x00" not in value
        and str(Path(value)) == value
        and "\\" not in value
        and all(part not in (".", "..") for part in value.split("/")),
        "UNSAFE_STATE_PATH",
        3,
    )
    return Path(value)


def canonical(path):
    path = absolute(str(path))
    require(path.resolve() == path, "UNSAFE_STATE_PATH", 3)
    for parent in (path, *path.parents):
        try:
            require(not stat.S_ISLNK(parent.lstat().st_mode), "UNSAFE_STATE_PATH", 3)
        except FileNotFoundError:
            continue
    return path


def private_dir(path, create=False, exclusive=False):
    path = canonical(path)
    if create:
        try:
            path.mkdir(mode=0o700)
            sync_dir(path.parent)
        except FileExistsError:
            require(not exclusive, "RECORD_EXISTS", 3)
    info = path.lstat()
    require(
        stat.S_ISDIR(info.st_mode)
        and info.st_uid == os.getuid()
        and stat.S_IMODE(info.st_mode) == 0o700,
        "UNSAFE_STATE_PATH",
        3,
    )
    return path


def sync_dir(path):
    fd = os.open(path, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
    try:
        os.fsync(fd)
    finally:
        os.close(fd)


def private_bytes(path, publication=False):
    path = canonical(path)
    fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW)
    try:
        info = os.fstat(fd)
        require(
            stat.S_ISREG(info.st_mode)
            and info.st_uid == os.getuid()
            and stat.S_IMODE(info.st_mode) == 0o600,
            "UNSAFE_STATE_PATH",
            3,
        )
        with os.fdopen(fd, "rb", closefd=False) as stream:
            data = stream.read()
        require(
            (path.lstat().st_dev, path.lstat().st_ino) == (info.st_dev, info.st_ino),
            "UNSAFE_STATE_PATH",
            3,
        )
        if info.st_nlink != 1:
            require(publication, "UNSAFE_STATE_PATH", 3)
            prefix = "." + path.name + ".publish-" + digest(data) + "-"
            links = []
            for candidate in path.parent.iterdir():
                try:
                    other = candidate.lstat()
                except FileNotFoundError:
                    continue
                if (other.st_dev, other.st_ino) != (info.st_dev, info.st_ino) or candidate == path:
                    continue
                require(
                    candidate.name.startswith(prefix)
                    and re.fullmatch(r"[0-9a-f]{32}", candidate.name[len(prefix) :]) is not None
                    and other.st_uid == os.getuid()
                    and stat.S_IMODE(other.st_mode) == 0o600
                    and stat.S_ISREG(other.st_mode),
                    "UNSAFE_STATE_PATH",
                    3,
                )
                links.append(candidate)
            current = os.fstat(fd)
            require(
                current.st_nlink == 1 or current.st_nlink == len(links) + 1, "UNSAFE_STATE_PATH", 3
            )
            os.fsync(fd)
            sync_dir(path.parent)
            for candidate in links:
                try:
                    other = candidate.lstat()
                    require(
                        (other.st_dev, other.st_ino) == (info.st_dev, info.st_ino),
                        "UNSAFE_STATE_PATH",
                        3,
                    )
                    candidate.unlink()
                except FileNotFoundError:
                    pass
            sync_dir(path.parent)
        return data
    finally:
        os.close(fd)


def record(path, optional=False):
    try:
        return parse_json(private_bytes(path, publication=True))
    except FileNotFoundError:
        require(optional, "INCONSISTENT_STATE", 3)
        return None


def publish_record(path, document):
    path = canonical(path)
    private_dir(path.parent)
    data = encoded(document)
    temporary = path.with_name(
        "." + path.name + ".publish-" + digest(data) + "-" + secrets.token_hex(16)
    )
    fd = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
    try:
        os.fchmod(fd, 0o600)
        with os.fdopen(fd, "wb", closefd=False) as stream:
            stream.write(data)
            stream.flush()
        os.fsync(fd)
    finally:
        os.close(fd)
    sync_dir(path.parent)
    try:
        os.link(temporary, path, follow_symlinks=False)
    except FileExistsError:
        temporary.unlink()
        sync_dir(path.parent)
        raise Refusal("RECORD_EXISTS", 3) from None
    sync_dir(path.parent)
    try:
        temporary.unlink()
    except FileNotFoundError:
        pass
    sync_dir(path.parent)


def ensure_record(path, document):
    existing = record(path, optional=True)
    if existing is None:
        try:
            publish_record(path, document)
            return
        except Refusal as error:
            if error.code != "RECORD_EXISTS":
                raise
            existing = record(path)
    require(existing == document, "INCONSISTENT_STATE", 3)


def sync_file(path):
    path = canonical(path)
    fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW)
    try:
        require(stat.S_ISREG(os.fstat(fd).st_mode), "UNSAFE_STATE_PATH", 3)
        os.fsync(fd)
    finally:
        os.close(fd)


def durable_objects(git, result_commit):
    objects = canonical(git.git_path("objects"))
    stores = [objects]
    for line in git.run("count-objects", "-v").splitlines():
        if line.startswith(b"alternate: "):
            stores.append(canonical(os.fsdecode(line[11:])))
    missing_loose = False
    directories = set()
    for line in git.run("rev-list", "--objects", result_commit).splitlines():
        oid = line.split(b" ", 1)[0].decode()
        for store in stores:
            path = store / oid[:2] / oid[2:]
            if path.exists():
                sync_file(path)
                directories.add(path.parent)
                break
        else:
            missing_loose = True
    if missing_loose:
        packed_objects = False
        for store in stores:
            pack = canonical(store / "pack")
            if not pack.exists():
                continue
            for path in pack.iterdir():
                if path.suffix in (".pack", ".idx", ".rev"):
                    sync_file(path)
                    packed_objects = packed_objects or path.suffix == ".pack"
            directories.add(pack)
        require(packed_objects, "OPERATION_FAILED_EFFECT_UNCERTAIN", 4)
    for directory in directories:
        sync_dir(directory)
    for store in stores:
        sync_dir(store)
        sync_dir(store.parent)


def ref_value(git, ref):
    canonical(git.git_path(ref))
    require(git.run("symbolic-ref", "--quiet", ref, check=False).returncode != 0, "REF_CONFLICT", 3)
    values = git.run(
        "for-each-ref", "--format=%(refname)%00%(objectname)%00%(symref)", ref
    ).splitlines()
    require(len(values) <= 1, "REF_CONFLICT", 3)
    if not values:
        return None
    name, oid, symbolic = values[0].split(b"\0")
    require(name.decode() == ref and not symbolic, "REF_CONFLICT", 3)
    return oid.decode()


def publish_ref(git, ref, result_commit):
    git.oid(result_commit, "commit")
    current = ref_value(git, ref)
    require(current is None or current == result_commit, "REF_CONFLICT", 3)
    if current is None:
        response = git.run(
            "-c",
            "core.fsync=reference",
            "update-ref",
            "--no-deref",
            ref,
            result_commit,
            git.zero,
            check=False,
        )
        require(response.returncode == 0 or ref_value(git, ref) == result_commit, "REF_CONFLICT", 3)
    path = git.git_path(ref)
    if path.exists():
        sync_file(path)
        for directory in (path.parent, *path.parent.parents):
            sync_dir(directory)
            if directory == git.git_path("refs").parent:
                break
    packed = git.git_path("packed-refs")
    if packed.exists():
        sync_file(packed)
        sync_dir(packed.parent)


class System:
    def boot_id(self):
        return Path("/proc/sys/kernel/random/boot_id").read_text().strip()

    def machine_id(self):
        return Path("/etc/machine-id").read_text().strip()

    def host(self):
        return socket.gethostname()

    def process(self, pid):
        directory = Path("/proc") / str(pid)
        try:
            before = (directory / "stat").read_text()
            fields = before[before.rfind(")") + 2 :].split()
            uid_line = next(
                line
                for line in (directory / "status").read_text().splitlines()
                if line.startswith("Uid:")
            )
            groups = (directory / "cgroup").read_text().splitlines()
            group = next(line[3:] for line in groups if line.startswith("0::"))
            after = (directory / "stat").read_text()
            later = after[after.rfind(")") + 2 :].split()
            if fields[19] != later[19]:
                return None
            return {
                "pid": pid,
                "start_ticks": int(fields[19]),
                "ppid": int(later[1]),
                "state": later[0],
                "cgroup": group,
                "uid": int(uid_line.split()[2]),
            }
        except (FileNotFoundError, ProcessLookupError):
            return None

    def self_identity(self):
        return self.process(os.getpid())

    def scope(self, unit):
        names = (
            "LoadState",
            "ActiveState",
            "InvocationID",
            "ControlGroup",
            "KillMode",
            "TimeoutStopUSec",
        )
        response = subprocess.run(
            ["systemctl", "--user", "show", unit, "--property=" + ",".join(names)],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=5,
            check=False,
        )
        properties = dict(
            line.split("=", 1) for line in response.stdout.decode().splitlines() if "=" in line
        )
        if properties.get("LoadState") == "not-found":
            return None
        require(response.returncode == 0, "OPERATION_FAILED_EFFECT_UNCERTAIN", 4)
        timeout = properties.get("TimeoutStopUSec", "")
        if timeout.isdigit():
            microseconds = int(timeout)
        else:
            units = {
                "us": 1,
                "ms": 1000,
                "s": 1000000,
                "min": 60000000,
                "h": 3600000000,
                "d": 86400000000,
            }
            tokens = re.findall(r"([0-9]+(?:\.[0-9]+)?)(us|ms|min|s|h|d)", timeout)
            require(
                bool(tokens)
                and "".join(number + unit for number, unit in tokens) == timeout.replace(" ", ""),
                "OPERATION_FAILED_EFFECT_UNCERTAIN",
                4,
            )
            from decimal import Decimal

            value = sum(Decimal(number) * units[unit] for number, unit in tokens)
            require(value == int(value), "OPERATION_FAILED_EFFECT_UNCERTAIN", 4)
            microseconds = int(value)
        return {
            "load_state": properties["LoadState"],
            "active_state": properties["ActiveState"],
            "invocation_id": properties["InvocationID"],
            "control_group": properties["ControlGroup"],
            "kill_mode": properties["KillMode"],
            "timeout_stop": microseconds,
        }

    def members(self, group):
        root = cgroup_path(group)
        members = {}
        if not root.exists():
            return []
        for current, directories, _ in os.walk(root, followlinks=False):
            for name in directories:
                require(not (Path(current) / name).is_symlink(), "SCOPE_CHANGED", 3)
            try:
                pids = (Path(current) / "cgroup.procs").read_text().split()
            except FileNotFoundError:
                continue
            for value in pids:
                process = self.process(int(value))
                if process is not None and live(process):
                    require(inside(process["cgroup"], group), "SCOPE_CHANGED", 3)
                    members[process["pid"]] = process
        return [members[pid] for pid in sorted(members)]

    def quiet(self, group):
        root = cgroup_path(group)
        if not root.exists():
            return True
        if self.members(group):
            return False
        for current, _, _ in os.walk(root, followlinks=False):
            try:
                events = dict(
                    line.split()
                    for line in (Path(current) / "cgroup.events").read_text().splitlines()
                )
                if events.get("populated") != "0":
                    return False
                if (Path(current) / "cgroup.procs").read_text().strip():
                    return False
            except FileNotFoundError:
                continue
        return True

    def stop(self, unit, expected_scope):
        control_scope(self, unit, expected_scope)
        response = subprocess.run(
            ["systemctl", "--user", "stop", unit],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=10,
            check=False,
        )
        require(response.returncode == 0, "OPERATION_FAILED_EFFECT_UNCERTAIN", 4)

    def kill(self, unit, expected_scope):
        scope = control_scope(self, unit, expected_scope)
        response = subprocess.run(
            ["systemctl", "--user", "kill", "--kill-whom=all", "--signal=SIGKILL", unit],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=5,
            check=False,
        )
        require(response.returncode == 0, "OPERATION_FAILED_EFFECT_UNCERTAIN", 4)
        deadline = time.monotonic() + 5
        while not self.quiet(scope["control_group"]) and time.monotonic() < deadline:
            time.sleep(0.02)


def control_scope(system, unit, expected_scope):
    current = system.scope(unit)
    require(
        current is not None
        and expected_scope.get("unit", unit) == unit
        and all(
            current[key] == expected_scope[key]
            for key in ("invocation_id", "control_group", "kill_mode", "timeout_stop")
        ),
        "SCOPE_CHANGED",
        3,
    )
    assert current is not None
    return current


def cgroup_path(group):
    require(
        type(group) is str
        and group.startswith("/")
        and group != "/"
        and all(part not in ("", ".", "..") for part in group[1:].split("/")),
        "SCOPE_CHANGED",
        3,
    )
    return canonical(Path("/sys/fs/cgroup") / group[1:])


def inside(group, owner):
    return group == owner or group.startswith(owner + "/")


def live(process):
    return process is not None and process["state"] not in ("Z", "X", "x")


def birth(process, system):
    require(
        process is not None
        and live(process)
        and process["uid"] == os.getuid()
        and type(process["pid"]) is int
        and process["pid"] > 0
        and type(process["start_ticks"]) is int
        and process["start_ticks"] > 0,
        "SCOPE_NOT_OWNED",
        3,
    )
    assert process is not None
    return {**process, "boot_id": system.boot_id()}


def same_birth(saved, process, system):
    return (
        process is not None
        and saved["boot_id"] == system.boot_id()
        and saved["pid"] == process["pid"]
        and saved["start_ticks"] == process["start_ticks"]
    )


def outside(process, group):
    require(
        live(process) and process["uid"] == os.getuid() and not inside(process["cgroup"], group),
        "WRONG_CALLER_SCOPE",
        3,
    )


def branch(git, identity):
    current = git.run("symbolic-ref", "--quiet", "HEAD", check=False)
    require(
        current.returncode == 0
        and current.stdout.strip().decode() == "refs/heads/" + identity["branch"],
        "WRONG_BRANCH",
        3,
    )


@dataclass
class Task:
    git: Git
    worktree: Path
    common: Path
    state: Path
    dispatch: Optional[dict] = None
    binding: Any = None
    dispatch_sha256: Optional[str] = None

    def envelope(self):
        assert self.dispatch is not None
        return {
            "schema": 1,
            "identity": self.binding.identity,
            "dispatch_sha256": self.dispatch_sha256,
            "receipt_sha256": self.dispatch["receipt_sha256"],
        }

    def bound(self, document):
        require(
            type(document) is dict
            and all(document.get(key) == value for key, value in self.envelope().items()),
            "INCONSISTENT_STATE",
            3,
        )
        return document


def discover(args):
    worktree = canonical(args.worktree)
    require(worktree.is_dir() and worktree.stat().st_uid == os.getuid(), "UNSAFE_STATE_PATH", 3)
    git = Git(worktree)
    require(git.path == worktree, "IDENTITY_MISMATCH", 3)
    common = canonical(
        os.fsdecode(git.run("rev-parse", "--path-format=absolute", "--git-common-dir").strip())
    )
    require(common.is_dir() and common.stat().st_uid == os.getuid(), "UNSAFE_STATE_PATH", 3)
    registered = [
        row[9:]
        for row in git.run("worktree", "list", "--porcelain", "-z").split(b"\0")
        if row.startswith(b"worktree ")
    ]
    require(os.fsencode(worktree) in registered, "IDENTITY_MISMATCH", 3)
    name = args.slug
    if name is None:
        current = git.run("symbolic-ref", "--quiet", "--short", "HEAD", check=False)
        require(
            current.returncode == 0 and current.stdout.startswith(b"offload/"), "WRONG_BRANCH", 3
        )
        name = current.stdout.strip().decode()[8:]
    slug(name)
    return Task(git, worktree, common, common / "offload-receipts" / name)


def load_task(task, system):
    private_dir(task.state.parent)
    private_dir(task.state)
    path = task.state / "dispatch.json"
    raw = private_bytes(path, publication=True)
    task.dispatch = parse_json(raw)
    task.dispatch_sha256 = digest(raw)
    receipt = private_bytes(task.dispatch["receipt_path"])
    require(digest(receipt) == task.dispatch["receipt_sha256"], "RECEIPT_MISMATCH", 3)
    task.binding = parse_binding(parse_json(receipt), task.git)
    require(
        task.binding.identity == task.dispatch["identity"]
        and task.binding.identity["slug"] == task.state.name
        and task.git.root(task.binding.commit) == task.binding.identity["root"],
        "IDENTITY_MISMATCH",
        3,
    )
    worker = task.dispatch["worker"]
    require(
        worker["worktree"] == str(task.worktree)
        and worker["common_dir"] == str(task.common)
        and worker["uid"] == os.getuid()
        and worker["machine_id"] == system.machine_id()
        and worker["host"] == system.host(),
        "IDENTITY_MISMATCH",
        3,
    )
    for name in ("inventory_path", "allowlist_path"):
        if task.dispatch[name] is not None:
            private_bytes(task.dispatch[name])
    validate_brief(task.git, task.binding)


def hash_value(value):
    require(type(value) is str and re.fullmatch("[0-9a-f]{64}", value) is not None)
    return value


def positive(value):
    require(type(value) is int and value > 0)
    return value


def draft_input(value):
    keys(
        value,
        (
            "schema",
            "receipt_path",
            "receipt_sha256",
            "inventory_path",
            "allowlist_path",
            "herdr",
            "scope",
            "source",
            "routes",
        ),
    )
    require(type(value["schema"]) is int and value["schema"] == 1)
    hash_value(value["receipt_sha256"])
    for key in ("receipt_path", "inventory_path"):
        private_bytes(value[key])
    if value["allowlist_path"] is not None:
        private_bytes(value["allowlist_path"])
    herdr = keys(value["herdr"], ("session", "workspace", "pane", "agent"))
    for key in ("workspace", "pane", "agent"):
        text(herdr[key])
    if herdr["session"] is not None:
        text(herdr["session"])
    scope = keys(value["scope"], ("unit", "initial_pid", "agent_pid"))
    text(scope["unit"])
    positive(scope["initial_pid"])
    positive(scope["agent_pid"])
    require(scope["initial_pid"] != scope["agent_pid"])
    source = keys(
        value["source"],
        ("host", "user", "uid", "repo", "common_dir", "receipt_path", "guard_path", "guard_sha256"),
    )
    for key in ("host", "user"):
        text(source[key])
    require(type(source["uid"]) is int and source["uid"] >= 0)
    for key in ("repo", "common_dir", "receipt_path", "guard_path"):
        absolute(source[key])
    hash_value(source["guard_sha256"])
    routes = keys(value["routes"], ("reverse", "forward"))
    text(keys(routes["forward"], ("ssh_alias",))["ssh_alias"])
    reverse = routes["reverse"]
    require(type(reverse) is dict)
    if reverse.get("status") == "unavailable":
        keys(reverse, ("status", "reason"))
        text(reverse["reason"])
    else:
        keys(
            reverse,
            ("status", "ssh_alias", "user", "port", "host_key_alias", "config_path", "verified_at"),
        )
        require(
            reverse["status"] == "verified"
            and type(reverse["port"]) is int
            and 1 <= reverse["port"] <= 65535
        )
        for key in ("ssh_alias", "user", "verified_at"):
            text(reverse[key])
        if reverse["host_key_alias"] is not None:
            text(reverse["host_key_alias"])
        if reverse["config_path"] is not None:
            absolute(reverse["config_path"])
    return value


def owned_scope(scope, unit, code):
    require(
        scope is not None
        and scope["load_state"] == "loaded"
        and scope["active_state"] == "active"
        and scope["kill_mode"] == "control-group"
        and type(scope["timeout_stop"]) is int
        and scope["timeout_stop"] == 5000000
        and re.fullmatch("[0-9a-f]{32}", scope["invocation_id"]) is not None
        and scope["invocation_id"] != "0" * 32
        and scope["control_group"].endswith("/" + unit),
        code,
        3,
    )
    assert scope is not None
    cgroup_path(scope["control_group"])


def publish_dispatch(task, args, data, system):
    draft = draft_input(parse_json(data))
    receipt = private_bytes(draft["receipt_path"])
    require(digest(receipt) == draft["receipt_sha256"], "RECEIPT_MISMATCH", 3)
    binding = parse_binding(parse_json(receipt), task.git)
    require(
        binding.identity["slug"] == task.state.name
        and draft["source"]["repo"] == binding.receipt["source"]["path"],
        "IDENTITY_MISMATCH",
        3,
    )
    branch(task.git, binding.identity)
    validate_brief(task.git, binding)
    require(
        draft["scope"]["unit"] == "offload-" + task.state.name + ".scope"
        and draft["herdr"]["agent"] == "offload-" + task.state.name,
        "IDENTITY_MISMATCH",
        3,
    )
    scope = system.scope(draft["scope"]["unit"])
    owned_scope(scope, draft["scope"]["unit"], "SCOPE_NOT_OWNED")
    processes = {}
    for name in ("initial_pid", "agent_pid"):
        process = birth(system.process(draft["scope"][name]), system)
        require(inside(process["cgroup"], scope["control_group"]), "SCOPE_NOT_OWNED", 3)
        processes[name] = process
    document = {
        **draft,
        "identity": binding.identity,
        "scope": {**draft["scope"], **scope},
        "worker": {
            "uid": os.getuid(),
            "machine_id": system.machine_id(),
            "boot_id": system.boot_id(),
            "host": system.host(),
            "worktree": str(task.worktree),
            "common_dir": str(task.common),
            **processes,
        },
    }
    private_dir(task.state.parent, create=True)
    private_dir(task.state, create=True)
    path = task.state / "dispatch.json"
    publish_record(path, document)
    return {
        "ok": True,
        "status": "published",
        "dispatch": str(path),
        "dispatch_sha256": digest(private_bytes(path, publication=True)),
        "state_dir": str(task.state),
        "worktree": str(task.worktree),
        "common_dir": str(task.common),
    }


def candidate(task, expected=None, requested_state=None):
    branch(task.git, task.binding.identity)
    task.git.clean()
    tip = task.git.head()
    if expected is not None:
        require(tip == expected["result_commit"], "RESULT_MOVED", 3)
    work_tip, note = validate_note(task.git, task.binding, tip)
    if requested_state is not None:
        require(note["state"] == requested_state, "INVALID_INPUT", 2)
    return {
        **task.envelope(),
        "result_commit": tip,
        "work_tip": work_tip,
        "state": note["state"],
        "next_steps": note["next_steps"],
    }


def retained(task):
    intent = record(task.state / "intent.json", optional=True)
    operation = record(task.state / "operation.json", optional=True)
    proof = record(task.state / "freeze.json", optional=True)
    pin = record(task.state / "pin.json", optional=True)
    for document in (intent, operation, proof, pin):
        if document is not None:
            task.bound(document)
            require(
                intent is not None
                and all(
                    document.get(key) == intent.get(key)
                    for key in ("result_commit", "work_tip", "state", "next_steps")
                ),
                "INCONSISTENT_STATE",
                3,
            )
    require(pin is None or proof is not None, "INCONSISTENT_STATE", 3)
    if operation is not None:
        require(
            operation["scope"] == task.dispatch["scope"]
            and operation["boot_id"] == task.dispatch["worker"]["boot_id"],
            "INCONSISTENT_STATE",
            3,
        )
        owner_dir, owner_attempt = attempt_record(task, operation["attempt_id"])
        handoff = task.bound(record(owner_dir / "handoff.json"))
        require(
            owner_attempt["mode"] == "controller"
            and handoff["attempt_id"] == operation["attempt_id"]
            and handoff["result_commit"] == operation["result_commit"]
            and operation["handoff_sha256"]
            == digest(private_bytes(owner_dir / "handoff.json", True)),
            "INCONSISTENT_STATE",
            3,
        )
    if proof is not None:
        require(
            operation is not None
            and proof["operation_sha256"]
            == digest(private_bytes(task.state / "operation.json", True))
            and proof["members"] == operation["members"]
            and proof["scope"] == operation["scope"]
            and proof["writers_exited"] is True,
            "INCONSISTENT_STATE",
            3,
        )
    if pin is not None:
        require(
            pin["freeze_sha256"] == digest(private_bytes(task.state / "freeze.json", True))
            and pin["ref"] == "refs/offload-return/" + task.state.name + "/result",
            "INCONSISTENT_STATE",
            3,
        )
    if proof is not None:
        current = ref_value(task.git, "refs/offload-return/" + task.state.name + "/result")
        require(current is None or current == proof["result_commit"], "REF_CONFLICT", 3)
    if intent is not None:
        work_tip, note = validate_note(task.git, task.binding, intent["result_commit"])
        require(
            work_tip == intent["work_tip"]
            and note["state"] == intent["state"]
            and note["next_steps"] == intent["next_steps"],
            "INCONSISTENT_STATE",
            3,
        )
    return intent, operation, proof, pin


def request(task, args, data, system):
    require(data is None, "INVALID_INPUT", 2)
    intent, _, proof, pin = retained(task)
    require(args.mode != "source-pull" or pin is not None, "PIN_REQUIRED", 3)
    if proof is None:
        proposed = candidate(task, expected=intent, requested_state=args.state)
        if intent is None:
            durable_objects(task.git, proposed["result_commit"])
            proposed = candidate(task, expected=proposed, requested_state=args.state)
        ensure_record(task.state / "intent.json", proposed)
        intent = proposed
    require(intent is not None, "INCONSISTENT_STATE", 3)
    assert intent is not None
    attempts = private_dir(task.state / "attempts", create=True)
    nonce = secrets.token_hex(16)
    attempt_id = digest(
        (task.binding.identity["root"] + ":" + task.state.name + ":" + nonce).encode()
    )
    directory = private_dir(attempts / attempt_id, create=True, exclusive=True)
    agent = None
    session = None
    if args.mode == "controller":
        agent = (
            "return-"
            + digest((task.binding.identity["root"] + task.state.name).encode())[:7]
            + "-"
            + nonce[:17]
        )
        session = private_dir(directory / "agent-session", create=True, exclusive=True)
    document = {
        **intent,
        "attempt_id": attempt_id,
        "mode": args.mode,
        "agent": agent,
        "session_dir": str(session) if session is not None else None,
        "cwd": str(directory),
    }
    publish_record(directory / "attempt.json", document)
    return {
        "ok": True,
        "attempt_id": attempt_id,
        "mode": args.mode,
        "agent": agent,
        "session_dir": document["session_dir"],
        "cwd": str(directory),
        "intent_path": str(task.state / "intent.json"),
        "dispatch_path": str(task.state / "dispatch.json"),
        **{key: intent[key] for key in ("state", "result_commit", "next_steps")},
    }


def attempt_record(task, attempt_id):
    require(
        type(attempt_id) is str and re.fullmatch("[0-9a-f]{64}", attempt_id) is not None,
        "INVALID_ARGUMENTS",
        2,
    )
    private_dir(task.state / "attempts")
    directory = private_dir(task.state / "attempts" / attempt_id)
    attempt = task.bound(record(directory / "attempt.json"))
    require(
        attempt["attempt_id"] == attempt_id
        and attempt["cwd"] == str(directory)
        and attempt["mode"] in ("controller", "source-pull"),
        "INCONSISTENT_STATE",
        3,
    )
    return directory, attempt


def scope_matches(task, system, allow_absent=False):
    saved = task.dispatch["scope"]
    scope = system.scope(saved["unit"])
    if scope is None:
        require(allow_absent, "SCOPE_CHANGED", 3)
        return None
    require(system.boot_id() == task.dispatch["worker"]["boot_id"], "SCOPE_CHANGED", 3)
    released_group = (
        allow_absent
        and scope["load_state"] == "loaded"
        and scope["active_state"] in ("inactive", "failed")
        and scope["control_group"] == ""
    )
    require(
        all(scope[key] == saved[key] for key in ("invocation_id", "kill_mode", "timeout_stop"))
        and (scope["control_group"] == saved["control_group"] or released_group),
        "SCOPE_CHANGED",
        3,
    )
    return scope


def writers_exited(operation, system):
    for saved in operation["members"]:
        process = system.process(saved["pid"])
        if same_birth(saved, process, system) and live(process):
            return False
    return not system.members(operation["scope"]["control_group"]) and system.quiet(
        operation["scope"]["control_group"]
    )


def acceptance(task, args, directory, attempt, system):
    group = task.dispatch["scope"]["control_group"]
    outside(system.self_identity(), group)
    require(attempt["mode"] == "controller", "PIN_REQUIRED", 3)
    require(
        args.shell_pid is not None
        and args.controller_pid is not None
        and args.workspace is not None
        and args.pane is not None,
        "INVALID_ARGUMENTS",
        2,
    )
    require(
        args.herdr_session == task.dispatch["herdr"]["session"]
        and args.workspace != task.dispatch["herdr"]["workspace"]
        and args.pane != task.dispatch["herdr"]["pane"],
        "IDENTITY_MISMATCH",
        3,
    )
    text(args.workspace)
    text(args.pane)
    identities = {}
    for name, process in (
        ("shell", system.process(args.shell_pid)),
        ("controller", system.process(args.controller_pid)),
        ("helper", system.self_identity()),
    ):
        outside(process, group)
        identities[name] = birth(process, system)
    require(len({process["pid"] for process in identities.values()}) == 3, "WRONG_CALLER_SCOPE", 3)
    document = {
        **task.envelope(),
        "attempt_id": attempt["attempt_id"],
        "result_commit": attempt["result_commit"],
        "herdr": {
            "session": args.herdr_session,
            "workspace": args.workspace,
            "pane": args.pane,
            "agent": attempt["agent"],
        },
        **identities,
    }
    ensure_record(directory / "handoff.json", document)
    for process in identities.values():
        current = system.process(process["pid"])
        outside(current, group)
        require(same_birth(process, current, system), "WRONG_CALLER_SCOPE", 3)
    return document


def lock_freeze(task):
    path = canonical(task.state / "freeze.lock")
    fd = os.open(path, os.O_RDWR | os.O_CREAT | os.O_NOFOLLOW, 0o600)
    try:
        info = os.fstat(fd)
        require(
            stat.S_ISREG(info.st_mode)
            and info.st_uid == os.getuid()
            and stat.S_IMODE(info.st_mode) == 0o600
            and info.st_nlink == 1,
            "UNSAFE_STATE_PATH",
            3,
        )
        try:
            fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            raise Refusal("LOCKED", 3) from None
        return fd
    except BaseException:
        os.close(fd)
        raise


def freeze(task, args, data, system):
    require(data is None, "INVALID_INPUT", 2)
    directory, attempt = attempt_record(task, args.attempt)
    assert task.dispatch is not None
    outside(system.self_identity(), task.dispatch["scope"]["control_group"])
    fd = lock_freeze(task)
    try:
        intent, operation, proof, pin = retained(task)
        require(
            intent is not None
            and all(
                attempt[key] == intent[key]
                for key in ("result_commit", "work_tip", "state", "next_steps")
            ),
            "INCONSISTENT_STATE",
            3,
        )
        assert intent is not None
        recovering = operation is not None or proof is not None
        handoff = None
        if proof is None:
            candidate(task, expected=intent)
            scope = scope_matches(task, system, allow_absent=operation is not None)
            if operation is None:
                owned_scope(scope, task.dispatch["scope"]["unit"], "SCOPE_CHANGED")
                assert scope is not None
                handoff = acceptance(task, args, directory, attempt, system)
                scope_matches(task, system)
                for name in ("initial_pid", "agent_pid"):
                    saved = task.dispatch["worker"][name]
                    current = system.process(saved["pid"])
                    require(
                        same_birth(saved, current, system)
                        and live(current)
                        and current["uid"] == os.getuid()
                        and inside(current["cgroup"], scope["control_group"]),
                        "SCOPE_CHANGED",
                        3,
                    )
                members = [
                    birth(member, system) for member in system.members(scope["control_group"])
                ]
                enumerated = {member["pid"]: member for member in members}
                for name in ("initial_pid", "agent_pid"):
                    saved = task.dispatch["worker"][name]
                    current = enumerated.get(saved["pid"])
                    require(
                        current is not None
                        and current["boot_id"] == saved["boot_id"]
                        and same_birth(saved, current, system),
                        "SCOPE_CHANGED",
                        3,
                    )
                members.sort(key=lambda member: member["pid"])
                operation = {
                    **intent,
                    "attempt_id": args.attempt,
                    "scope": task.dispatch["scope"],
                    "boot_id": system.boot_id(),
                    "members": members,
                    "handoff_sha256": digest(private_bytes(directory / "handoff.json", True)),
                }
                publish_record(task.state / "operation.json", operation)
            assert operation is not None
            require(
                (scope is not None and bool(scope["control_group"]))
                or writers_exited(operation, system),
                "WRITERS_REMAIN",
                4,
            )
            if not writers_exited(operation, system) or (
                scope is not None and scope["active_state"] not in ("inactive", "failed")
            ):
                scope = scope_matches(task, system)
                assert scope is not None
                captured = {saved["pid"]: saved for saved in operation["members"]}
                for current in system.members(operation["scope"]["control_group"]):
                    require(
                        current["pid"] in captured
                        and same_birth(captured[current["pid"]], current, system),
                        "SCOPE_CHANGED",
                        3,
                    )
                if not recovering or scope["active_state"] not in ("inactive", "failed"):
                    outside(system.self_identity(), operation["scope"]["control_group"])
                    if not recovering:
                        assert handoff is not None
                        for name in ("shell", "controller", "helper"):
                            saved = handoff[name]
                            current = system.process(saved["pid"])
                            outside(current, operation["scope"]["control_group"])
                            require(same_birth(saved, current, system), "WRONG_CALLER_SCOPE", 3)
                    candidate(task, expected=intent)
                    scope_matches(task, system)
                    system.stop(operation["scope"]["unit"], operation["scope"])
                scope = scope_matches(task, system, allow_absent=True)
                if not writers_exited(operation, system):
                    require(scope is not None and bool(scope["control_group"]), "WRITERS_REMAIN", 4)
                    scope_matches(task, system)
                    system.kill(operation["scope"]["unit"], operation["scope"])
                scope = scope_matches(task, system, allow_absent=True)
            require(
                (scope is None or scope["active_state"] in ("inactive", "failed"))
                and writers_exited(operation, system),
                "WRITERS_REMAIN",
                4,
            )
            candidate(task, expected=intent)
            proof = {
                **intent,
                "scope": operation["scope"],
                "members": operation["members"],
                "operation_sha256": digest(private_bytes(task.state / "operation.json", True)),
                "writers_exited": True,
            }
            publish_record(task.state / "freeze.json", proof)
        ref = "refs/offload-return/" + task.state.name + "/result"
        missing_ref = ref_value(task.git, ref) is None
        publish_ref(task.git, ref, intent["result_commit"])
        if pin is None:
            pin = {
                **intent,
                "ref": ref,
                "freeze_sha256": digest(private_bytes(task.state / "freeze.json", True)),
            }
            publish_record(task.state / "pin.json", pin)
            status = "reconciled" if recovering else "pinned"
        else:
            status = "reconciled" if missing_ref else "already_pinned"
        path = task.state / "pin.json"
        return {
            "ok": True,
            "status": status,
            "attempt_id": args.attempt,
            "pin": str(path),
            "pin_sha256": digest(private_bytes(path, True)),
            "ref": ref,
            **{key: pin[key] for key in ("result_commit", "work_tip", "state", "next_steps")},
        }
    finally:
        os.close(fd)


def ack_input(task, pin, outcome):
    ack = keys(
        outcome["source_ack"],
        (
            "schema",
            "root",
            "slug",
            "receipt_sha256",
            "snapshot",
            "result_commit",
            "source_path",
            "helper",
            "head_before",
            "head_after",
            "index_before_sha256",
            "index_after_sha256",
            "writer_evidence",
        ),
    )
    require(type(ack["schema"]) is int and ack["schema"] == 1)
    require(ack["receipt_sha256"] == task.dispatch["receipt_sha256"], "RECEIPT_MISMATCH", 3)
    require(
        ack["root"] == task.binding.identity["root"]
        and ack["slug"] == task.state.name
        and ack["snapshot"] == task.binding.snapshot
        and ack["result_commit"] == pin["result_commit"],
        "IDENTITY_MISMATCH",
        3,
    )
    absolute(ack["source_path"])
    helper = keys(
        ack["helper"],
        ("ok", "result_commit", "work_tip", "suppressed", "state", "next_steps", "status", "paths"),
    )
    require(
        helper["ok"] is True
        and helper["status"] == outcome["delivery"]
        and type(helper["suppressed"]) is int
        and helper["suppressed"] >= 0
    )
    require(
        all(
            helper[key] == pin[key] for key in ("result_commit", "work_tip", "state", "next_steps")
        ),
        "IDENTITY_MISMATCH",
        3,
    )
    require(type(helper["paths"]) is list and helper["paths"] == outcome["paths"])
    for path in helper["paths"]:
        repo_path(path)
    task.git.oid(ack["head_before"])
    task.git.oid(ack["head_after"])
    require(ack["head_before"] == ack["head_after"])
    for key in ("index_before_sha256", "index_after_sha256"):
        if ack[key] is not None:
            hash_value(ack[key])
    require(ack["index_before_sha256"] == ack["index_after_sha256"])
    evidence = keys(ack["writer_evidence"], ("kind", "detail"))
    require(evidence["kind"] in ("exclusive-owner", "observed-quiescent", "user-paused"))
    text(evidence["detail"])


def outcome(task, args, data, system):
    directory, attempt = attempt_record(task, args.attempt)
    _, _, _, pin = retained(task)
    require(pin is not None, "PIN_REQUIRED", 3)
    assert pin is not None
    require(
        all(
            attempt[key] == pin[key] for key in ("result_commit", "work_tip", "state", "next_steps")
        ),
        "INCONSISTENT_STATE",
        3,
    )
    value = keys(parse_json(data), ("delivery", "reason", "detail", "paths", "source_ack"))
    require(
        value["delivery"] in ("applied", "already_applied", "conflict", "pending", "refused")
        and type(value["paths"]) is list
    )
    for path in value["paths"]:
        repo_path(path)
    if value["delivery"] in ("applied", "already_applied"):
        require(value["reason"] is None and value["detail"] is None)
        ack_input(task, pin, value)
    else:
        require(value["source_ack"] is None)
        text(value["reason"])
        text(value["detail"])
        if value["delivery"] == "pending":
            require(
                value["reason"]
                in (
                    "offline",
                    "route",
                    "auth",
                    "identity",
                    "policy",
                    "receiver_busy",
                    "acknowledgement_unknown",
                )
            )
        if value["delivery"] == "conflict":
            require(bool(value["paths"]))
    path = directory / "outcome.json"
    document = {
        **task.envelope(),
        **value,
        "attempt_id": args.attempt,
        "result_commit": pin["result_commit"],
        "pin_sha256": digest(private_bytes(task.state / "pin.json", True)),
    }
    publish_record(path, document)
    return {
        "ok": True,
        "status": "recorded",
        "attempt_id": args.attempt,
        "delivery": value["delivery"],
        "reason": value["reason"],
        "outcome": str(path),
    }


class Parser(argparse.ArgumentParser):
    def error(self, message):
        raise Refusal("INVALID_ARGUMENTS", 2)


def execute(argv, input_data=None, system=None):
    try:
        parser = Parser(add_help=False, allow_abbrev=False)
        commands = parser.add_subparsers(dest="command", required=True, parser_class=Parser)
        for name in ("publish-dispatch", "request", "freeze", "outcome"):
            command = commands.add_parser(name, add_help=False, allow_abbrev=False)
            command.add_argument("--worktree", required=True)
            command.add_argument("--slug")
            if name == "request":
                command.add_argument("--state", choices=("complete", "paused"))
                command.add_argument(
                    "--mode", choices=("controller", "source-pull"), default="controller"
                )
            if name in ("freeze", "outcome"):
                command.add_argument("--attempt", required=True)
            if name == "freeze":
                command.add_argument("--controller-pid", type=int)
                command.add_argument("--shell-pid", type=int)
                command.add_argument("--herdr-session")
                command.add_argument("--workspace")
                command.add_argument("--pane")
        args = parser.parse_args(argv)
        if args.command in ("publish-dispatch", "outcome"):
            require(type(input_data) is bytes, "INVALID_INPUT", 2)
        system = System() if system is None else system
        task = discover(args)
        handlers = {
            "publish-dispatch": publish_dispatch,
            "request": request,
            "freeze": freeze,
            "outcome": outcome,
        }
        if args.command != "publish-dispatch":
            load_task(task, system)
        return 0, handlers[args.command](task, args, input_data, system)
    except Refusal as error:
        return error.exit_code, {"ok": False, "error": error.code, **error.fields}
    except (Exception, KeyboardInterrupt):
        return 4, {"ok": False, "error": "OPERATION_FAILED_EFFECT_UNCERTAIN"}


def main():
    data = None
    try:
        if len(sys.argv) > 1 and sys.argv[1] in ("publish-dispatch", "outcome"):
            data = sys.stdin.buffer.read()
        code, value = execute(sys.argv[1:], input_data=data)
    except (Exception, KeyboardInterrupt):
        code, value = 4, {"ok": False, "error": "OPERATION_FAILED_EFFECT_UNCERTAIN"}
    sys.stdout.write(json.dumps(value, ensure_ascii=True, sort_keys=True) + "\n")
    return code


if __name__ == "__main__":
    sys.exit(main())
