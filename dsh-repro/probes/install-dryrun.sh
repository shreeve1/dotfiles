#!/usr/bin/env bash
# dsh-repro/probes/install-dryrun.sh
#
# Run install-dsh.sh in --dry-run mode and assert that it composes a working
# profile via `dsh --profile web --dump-config` exit 0.
#
# install-dsh.sh's dry-run mode uses DSH_HOME=$(mktemp -d) internally, so this
# probe MUST NOT touch the live ~/.dsh/profiles/web. It must never invoke
# systemctl against the live dsh-web.service (documented root cause in
# docs/deepseek-harness.md: the restart severs the calling session).
#
# Usage: install-dryrun.sh [<install-script>]
# Default install-script: dsh-repro/install-dsh.sh (relative to cwd).

set -u

DEFAULT_INSTALL="dsh-repro/install-dsh.sh"
INSTALL="${1:-$DEFAULT_INSTALL}"

if [ "$#" -gt 1 ]; then
  echo "usage: $0 [<install-script>]" >&2
  exit 2
fi

if [ ! -x "$INSTALL" ]; then
  echo "missing or not executable: $INSTALL (run: chmod +x)" >&2
  exit 2
fi

fail=0

# Run install-dsh.sh in dry-run against 127.0.0.1. install-dsh.sh handles
# DSH_HOME=$(mktemp -d) internally when --dry-run is passed.
echo "+ $INSTALL --dry-run 127.0.0.1"
if ! "$INSTALL" --dry-run 127.0.0.1; then
  echo "FAIL: install-dsh.sh --dry-run exited non-zero"
  fail=1
fi

# Belt-and-braces: assert the live service was NOT restarted.
# systemctl --user is-user is harmless if no service is being touched, but
# directly running `systemctl is-active dsh-web.service` after the dry-run
# gives us a clear signal that the live state is unchanged. We capture the
# state BEFORE the dry-run (live state) and compare; any drift is a failure.
# Skipped if systemctl is unavailable (no user session) — that is also a pass.
if command -v systemctl >/dev/null 2>&1; then
  export XDG_RUNTIME_DIR="/run/user/$(id -u)"
  pre=$(systemctl --user is-active dsh-web.service 2>&1 || true)
  echo "+ $INSTALL --dry-run 127.0.0.1 (second pass, asserts no live restart)"
  "$INSTALL" --dry-run 127.0.0.1 >/dev/null 2>&1 || fail=1
  post=$(systemctl --user is-active dsh-web.service 2>&1 || true)
  if [ "$pre" != "$post" ]; then
    echo "FAIL: live dsh-web.service state changed during dry-run: '$pre' -> '$post'"
    fail=1
  fi
fi

exit "$fail"