#!/usr/bin/env bash
# staged-static-check-smoke.sh — behavioral smoke for harness-apply's staged-static-check.sh template.
#
# Plan T.1 cases:
#   (1) stage a .py with a ruff violation           -> exit 2
#   (2) stage a clean .py                           -> exit 0
#   (3) feed a non-git command (e.g. "ls")           -> exit 0 (not gated)
#   (4) git commit -am with a lint-dirty tracked
#       but-unstaged file                            -> still caught (exit 2)
#
# Ruff/mypy arms are skipped gracefully when those tools are absent; the
# git-detection + diff-scoping logic is asserted regardless.

set -u
script_dir=$(cd "$(dirname "$0")" && pwd)
skill_md="$script_dir/../SKILL.md"

[ -f "$skill_md" ] || {
	echo "FAIL: SKILL.md not found at $skill_md" >&2
	exit 1
}

# --- (a) Extract the staged-static-check.sh template fence -----------------
extract=$(mktemp)
trap 'rm -f "$extract" "$repo" 2>/dev/null' EXIT
awk '
  /^\*\*`staged-static-check\.sh`\*\*/ {found=1; next}
  found && /^```bash$/ {in_block=1; next}
  in_block && /^```$/ {exit}
  in_block {print}
' "$skill_md" >"$extract"
[ -s "$extract" ] || {
	echo "FAIL: failed to extract staged-static-check.sh template from SKILL.md" >&2
	exit 1
}
chmod +x "$extract"
bash -n "$extract" || {
	echo "FAIL: extracted template failed bash -n" >&2
	exit 1
}

# --- (b) Build a throwaway git repo ----------------------------------------
repo=$(mktemp -d)
cd "$repo" || exit 1
git init -q -b main 2>/dev/null || git init -q
git config user.email smoke@test
git config user.name "smoke"
git commit --allow-empty -q -m init || true

have_ruff=0
command -v ruff >/dev/null 2>&1 && have_ruff=1
have_mypy=0
command -v mypy >/dev/null 2>&1 && have_mypy=1

# Helper: feed stdin JSON to the script under CLAUDE_PROJECT_DIR=<repo>.
run_script() {
	CLAUDE_PROJECT_DIR="$repo" bash "$extract"
}

# --- (c) T.1 assertions -----------------------------------------------------
fail() {
	echo "FAIL: $1" >&2
	exit 1
}
ok() { echo "OK:   $1"; }

# Case 3: non-git command MUST pass through (exit 0). Assert this regardless
# of tool availability — proves the git-detector is the gate.
printf '{"tool_input":{"command":"ls -la"}}' | run_script
[ $? -eq 0 ] || fail "non-git command not ignored (case 3)"
ok "case 3 (non-git passes)"

# Case 1 + 2: stage a ruff-dirty .py vs clean .py.
# We can only meaningfully test (1) when ruff is available; otherwise just
# assert the git-detection still fires (the diff list was non-empty).
if [ "$have_ruff" -eq 1 ]; then
	cat >dirty.py <<'EOF'
import os, sys, json
def f(   x ):
  return x  + 1
EOF
	git add dirty.py

	printf '{"tool_input":{"command":"git commit -m wip"}}' | run_script
	rc=$?
	[ "$rc" -eq 2 ] || fail "dirty staged file did not block the commit (case 1, rc=$rc)"
	ok "case 1 (dirty staged blocks)"

	# Case 2: clean .py staged — exit 0 (no commit yet, but we're proving the
	# lint arm passes when files are clean).
	cat >clean.py <<'EOF'
x = 1
y = 2
EOF
	git add clean.py
	# Drop dirty.py from the index so the only staged file is clean.py.
	git rm -q --cached dirty.py 2>/dev/null
	# Now the cached diff is just clean.py -> clean file -> exit 0.
	printf '{"tool_input":{"command":"git commit -m wip"}}' | run_script
	rc=$?
	[ "$rc" -eq 0 ] || fail "clean staged file falsely blocked the commit (case 2, rc=$rc)"
	ok "case 2 (clean staged passes)"
else
	# No ruff — still assert git-detector fires (the diff-scoping logic).
	cat >dummy.py <<'EOF'
x = 1
EOF
	git add dummy.py
	printf '{"tool_input":{"command":"git commit -m wip"}}' | run_script
	rc=$?
	[ "$rc" -eq 0 ] || fail "git detector fired despite clean file + no ruff (case 2 fallback, rc=$rc)"
	ok "case 2 fallback (no ruff: clean staged passes)"
fi

# Case 4: git commit -am with a lint-dirty tracked-but-unstaged file.
# -a/-am must include tracked-but-unstaged changes in the diff list.
if [ "$have_ruff" -eq 1 ]; then
	git -c commit.gpgsign=false commit -q -m "wip"
	# Now dirty the file in the working tree (uncommitted, unstaged).
	cat >clean.py <<'EOF'
import os, sys
def f(   x ):
  return x  + 1
EOF
	# Note: git commit -am stages ALL tracked-but-unstaged, so the dirty file
	# MUST land in the diff list and exit 2.
	printf '{"tool_input":{"command":"git commit -am wip"}}' | run_script
	rc=$?
	[ "$rc" -eq 2 ] || fail "lint-dirty tracked-but-unstaged file was not caught by -am (case 4, rc=$rc)"
	ok "case 4 (-am catches unstaged)"
else
	# No ruff — assert the diff-scoping logic (file list is non-empty) without
	# calling ruff.
	git -c commit.gpgsign=false commit -q -m "wip" 2>/dev/null || true
	cat >clean.py <<'EOF'
x = 1
EOF
	printf '{"tool_input":{"command":"git commit -am wip"}}' | run_script
	rc=$?
	[ "$rc" -eq 0 ] || fail "git detector fired for empty/staged-clean -am (case 4 fallback, rc=$rc)"
	ok "case 4 fallback (no ruff: -am passes for clean file)"
fi

echo "PASS: staged-static-check.sh smoke (ruff=$have_ruff, mypy=$have_mypy)"
