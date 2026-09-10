#!/usr/bin/env bash
# Global harness: ordinary out-of-tree writes pass; secret writes still block.
set -u

script_dir=$(cd "$(dirname "$0")" && pwd)
repo=$(cd "$script_dir/../../../.." && pwd)
hook="$repo/.claude/hooks/block-path-access.sh"
project=$(mktemp -d)
outside=$(mktemp -d)
trap 'rm -rf "$project" "$outside"' EXIT

run() {
  local path="$1"
  printf '{"tool_name":"Write","tool_input":{"file_path":"%s"}}' "$path" |
    CLAUDE_PROJECT_DIR="$project" bash "$hook"
}

run "$outside/src.txt" || { echo "FAIL: ordinary out-of-tree write blocked" >&2; exit 1; }
if run "$outside/.env"; then
  echo "FAIL: protected out-of-tree write allowed" >&2
  exit 1
fi
run "$outside/.env.example" || { echo "FAIL: allowed template blocked" >&2; exit 1; }

echo "PASS: global block-path-access policy"
