#!/usr/bin/env bash
# Generated from helper-scripts skill. Safe to overwrite from template.
set -euo pipefail

usage() {
	cat <<'EOF'
Usage: scripts/ai/context.sh [repo-root]

Print compact repo context for agents: git state, structure, manifests, imports,
large files, and recent errors. Use before broad manual file reads.
EOF
}

if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
	usage
	exit 0
fi

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
ROOT="${1:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
cd "$ROOT"

PYTHON="${PYTHON:-python3}"

run() {
	local title="$1"
	shift
	printf '\n== %s ==\n' "$title"
	"$@" 2>&1 | sed -e 's/[[:space:]]\+$//' || true
}

printf '== Repo ==\n'
printf 'root: %s\n' "$PWD"
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
	printf 'branch: %s\n' "$(git branch --show-current 2>/dev/null || true)"
	printf 'commit: %s\n' "$(git rev-parse --short HEAD 2>/dev/null || true)"
fi

run "Summary" "$PYTHON" "$SCRIPT_DIR/repo_summary.py" --root "$PWD"
run "Tree" "$PYTHON" "$SCRIPT_DIR/tree_compact.py" --root "$PWD" --max-files 160
run "Recent Changes" "$PYTHON" "$SCRIPT_DIR/list_recent_changes.py" --root "$PWD"
run "Large Files" "$PYTHON" "$SCRIPT_DIR/find_large_files.py" --root "$PWD" --limit 20 --min-kb 512
run "Imports" "$PYTHON" "$SCRIPT_DIR/extract_imports.py" --root "$PWD" --limit 120

for json in package.json tsconfig.json pyproject.json deno.json biome.json turbo.json; do
	if [ -f "$json" ]; then
		run "JSON: $json" "$PYTHON" "$SCRIPT_DIR/summarize_json.py" "$json"
	fi
done

if [ -d logs ] || [ -n "$(find . -maxdepth 2 -type f \( -name '*.log' -o -name '*.err' \) -print -quit 2>/dev/null)" ]; then
	run "Errors" "$PYTHON" "$SCRIPT_DIR/scan_errors.py" --root "$PWD" --limit 80
fi
