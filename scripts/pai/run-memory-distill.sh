#!/usr/bin/env bash
set -euo pipefail

export HOME="${HOME:-/home/james}"
export PAI_DIR="${PAI_DIR:-$HOME/.pai}"
export PAI_RUNTIME_HOME="${PAI_RUNTIME_HOME:-$PAI_DIR}"
export PATH="$HOME/.bun/bin:$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin:${PATH:-}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$REPO_ROOT"
exec bun "$REPO_ROOT/.pai/src/cli/pai-memory.ts" distill --provider local --quiet
