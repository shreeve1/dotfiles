#!/usr/bin/env bash
# run-audit.sh — scans all npm projects under $HOME and logs results
# Usage: run-audit.sh <log-file>
# Called by cron: 0 15 * * * (7am PST / 8am PDT)

set -euo pipefail

LOG_FILE="${1:-$HOME/.config/opencode/skills/npm-audit-cron/audit.log}"

mkdir -p "$(dirname "$LOG_FILE")"

{
  echo "=========================================="
  echo "npm audit run: $(date)"
  echo "=========================================="

  # Find all package.json files under HOME, excluding node_modules and .git
  while IFS= read -r pkg_json; do
    project_dir="$(dirname "$pkg_json")"

    # Skip if no package-lock.json or yarn.lock (not an installed project)
    if [[ ! -f "$project_dir/package-lock.json" && ! -f "$project_dir/yarn.lock" && ! -f "$project_dir/pnpm-lock.yaml" ]]; then
      continue
    fi

    echo ""
    echo "--- $project_dir ---"

    # Run audit; capture exit code without aborting (set -e exemption)
    audit_output=""
    if audit_output=$(cd "$project_dir" && npm audit --json 2>/dev/null); then
      :
    fi

    echo "$audit_output" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    meta = data.get('metadata', {})
    vulns = meta.get('vulnerabilities', {})
    total = sum(vulns.values()) if vulns else 0
    if total == 0:
        print('  OK — no vulnerabilities found')
    else:
        print(f'  VULNERABILITIES: {total} total')
        for sev, count in vulns.items():
            if count > 0:
                print(f'    {sev}: {count}')
except Exception as e:
    print(f'  (could not parse audit output: {e})')
" 2>/dev/null || echo "  (npm audit failed or not supported for this project)"

    # Auto-fix: attempt npm audit fix --force for any project with vulnerabilities
    vuln_count=$(echo "$audit_output" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    vulns = data.get('metadata', {}).get('vulnerabilities', {})
    print(sum(vulns.values()))
except:
    print(0)
" 2>/dev/null || echo 0)

    if [[ "$vuln_count" -gt 0 ]]; then
      echo "  Auto-fixing with npm audit fix --force..."
      if (cd "$project_dir" && npm audit fix --force 2>&1 | tail -5); then
        echo "  Fix complete."
      else
        echo "  Fix failed or not supported for this project."
      fi
    fi

  done < <(find "$HOME" \
    -not \( -path "*/node_modules/*" -prune \) \
    -not \( -path "*/.git/*" -prune \) \
    -not \( -path "*/.cache/*" -prune \) \
    -not \( -path "*/Library/*" -prune \) \
    -name "package.json" \
    2>/dev/null | sort)

  echo ""
  echo "=========================================="
  echo "Scan complete: $(date)"
  echo "=========================================="
} >> "$LOG_FILE" 2>&1
