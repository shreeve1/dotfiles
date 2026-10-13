# Approved ignored-file copy

Run only for a specifically approved file and its actual target worktree. This recipe is shared by `.env` and `.mcp.json`. It sends bytes through SSH stdin, not arguments. It refuses tracked or nonignored destinations and symlink traversal. It streams into an owned random sibling with mode 0600, checks the expected byte count and atomically replaces the destination only after a complete transfer. It does not provision an age private key.

Set `HOST` to the verified SSH host, `WORKTREE` to the canonical absolute path returned by herdr, `RELATIVE_PATH` to the approved repo-relative filename and `APPROVED_SOURCE` to the explicitly approved source file. Inventory both project and worker checkout separately. Do not reuse a project-copy success as worker readiness.

```sh
python3 - "$HOST" "$WORKTREE" "$RELATIVE_PATH" "$APPROVED_SOURCE" <<'PY'
import os
import shlex
import stat
import subprocess
import sys

remote = r'''
import os
from pathlib import Path, PurePosixPath
import secrets
import stat
import subprocess
import sys

try:
    root = Path(sys.argv[1])
    name = sys.argv[2]
    expected = int(sys.argv[3])
    if expected < 0:
        raise ValueError()
    parts = PurePosixPath(name).parts
    if not root.is_absolute() or root.resolve() != root or not root.is_dir():
        raise ValueError()
    if not parts or name.startswith('/') or '\\' in name or '\x00' in name:
        raise ValueError()
    if any(part in ('', '.', '..') or part.lower() == '.git' for part in name.split('/')):
        raise ValueError()
    def git(*args):
        return subprocess.run(['git', '-C', str(root), *args], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    top = git('rev-parse', '--show-toplevel')
    if top.returncode or Path(os.fsdecode(top.stdout.strip())).resolve() != root:
        raise ValueError()
    if git('ls-files', '--error-unmatch', '--', ':(literal)' + name).returncode != 1:
        raise ValueError()
    if git('check-ignore', '--quiet', '--no-index', '--', name).returncode != 0:
        raise ValueError()
    directory = os.open(root, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
    temporary = None
    owned = False
    try:
        for part in parts[:-1]:
            try:
                child = os.open(part, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=directory)
            except FileNotFoundError:
                os.mkdir(part, 0o700, dir_fd=directory)
                child = os.open(part, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=directory)
            os.close(directory)
            directory = child
        def target_state():
            try:
                info = os.stat(parts[-1], dir_fd=directory, follow_symlinks=False)
            except FileNotFoundError:
                return None
            if not stat.S_ISREG(info.st_mode) or info.st_nlink != 1:
                raise ValueError()
            return info.st_dev, info.st_ino, info.st_mode, info.st_size, info.st_mtime_ns
        original = target_state()
        temporary = '.env.offload-copy-' + secrets.token_hex(16)
        fd = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600, dir_fd=directory)
        owned = True
        with os.fdopen(fd, 'wb') as output:
            os.fchmod(output.fileno(), 0o600)
            received = 0
            while True:
                chunk = sys.stdin.buffer.read(65536)
                if not chunk:
                    break
                received += len(chunk)
                if received > expected:
                    raise ValueError()
                output.write(chunk)
            if received != expected:
                raise ValueError()
            output.flush()
            os.fsync(output.fileno())
        if target_state() != original:
            raise ValueError()
        os.replace(temporary, parts[-1], src_dir_fd=directory, dst_dir_fd=directory)
        owned = False
    finally:
        try:
            if owned:
                os.unlink(temporary, dir_fd=directory)
        finally:
            os.close(directory)
except Exception:
    raise SystemExit(1)
'''
try:
    with open(sys.argv[4], 'rb') as source:
        info = os.fstat(source.fileno())
        if not stat.S_ISREG(info.st_mode):
            raise OSError()
        command = shlex.join(['python3', '-c', remote, sys.argv[2], sys.argv[3], str(info.st_size)])
        result = subprocess.run(['ssh', '-T', '--', sys.argv[1], command], stdin=source, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
except OSError:
    raise SystemExit('Ignored-file copy refused.')
if result.returncode:
    raise SystemExit('Ignored-file copy refused. Inspect target state before retrying.')
print('Approved ignored-file copy completed with mode 0600.')
PY
```

Verify target ignore status, permissions and presence again without reading values. A handled incomplete-stream or pre-replacement failure removes only this recipe's owned sibling and leaves existing destination bytes and mode unchanged. The `.env` sibling prefix keeps an abruptly interrupted partial copy inside Snapshot's filename exclusion. On failure, inspect the exact destination before retrying. Atomic replacement is not a guarantee against host or filesystem loss after replacement. Use a target-side bootstrap when the file is not ignored, is tracked, or needs credential provisioning rather than a copy.
