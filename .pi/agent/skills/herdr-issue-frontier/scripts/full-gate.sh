#!/usr/bin/env bash
# full-gate.sh — merge-time full-suite gate for herdr-issue-frontier.
#
# Run AFTER staging a merge (git merge --no-commit --no-ff) and BEFORE committing
# it — from the base repo root. A failure here means the issue's narrow
# ## Verification command missed a cross-cutting impact (e.g. a migration that
# should have updated a schema-stamp test outside its verification set). That is
# exactly how a reviewed-LGTM #32 shipped a regression when this gate was opt-in.
#
# DEFAULT-ON. Opt out with HERDR_FRONTIER_NO_GATE=1 (you accept the regression
# risk for speed).
#
# Gate command (first hit wins):
#   1. HERDR_FRONTIER_TEST_CMD (env)             — explicit, highest priority
#   2. ./.herdr-frontier-gate (file, first line) — per-project declaration
#   3. auto-detect from repo markers:
#        pyproject.toml|setup.py + uv  -> uv run pytest -q
#        package.json                  -> npm test
#        go.mod                        -> go test ./...
#      (none -> warn + treat as green; set one of the above to enforce)
#
# Exit 0 = green (safe to commit the merge); non-zero = red (abort the merge).
set -euo pipefail

if [[ "${HERDR_FRONTIER_NO_GATE:-}" == "1" ]]; then
	echo "full-gate: skipped (HERDR_FRONTIER_NO_GATE=1)"
	exit 0
fi

cmd="${HERDR_FRONTIER_TEST_CMD:-}"
if [[ -z "$cmd" && -f .herdr-frontier-gate ]]; then
	cmd=$(head -1 .herdr-frontier-gate)
fi
if [[ -z "$cmd" ]]; then
	if { [[ -f pyproject.toml || -f setup.py ]] && command -v uv >/dev/null; }; then
		cmd="uv run pytest -q"
	elif [[ -f package.json ]]; then
		cmd="npm test"
	elif [[ -f go.mod ]]; then
		cmd="go test ./..."
	else
		echo "full-gate: no gate command found (set HERDR_FRONTIER_TEST_CMD or ./.herdr-frontier-gate); treating as green" >&2
		exit 0
	fi
fi

echo "full-gate: $cmd"
bash -c "$cmd"
