#!/usr/bin/env bash
# The shared personal-memory skill's own unittest suite (gate, hubs, indexes, links, schema).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT/.agents/skills/personal-memory"
python3 -m unittest discover -s tests -q
