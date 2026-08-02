#!/usr/bin/env bash
# claude-fusion-block — Claude Fusion enforcement (ADR 0003 / docs/adr/0003-claude-fusion.md).
# PreToolUse hook. When claude=on: deny the four writer tools and gate Bash to a
# read-only/verification/pi-delegate allowlist (exit 2 = block). Otherwise exit 0.
#
# The Bash decision reuses Fusion's VERBATIM isSafeBash (.pi/agent/extensions/
# fusion/index.ts) via jiti — same policy as Pi's Fusion, no divergent re-port —
# plus an injection-safe pi-delegate carve-out. Only the flag gate + writer branch
# are bash. Fails CLOSED if the policy engine can't load (operator toggles off).
set -u

PI_DIR="${PI_CODING_AGENT_DIR:-$HOME/.pi/agent}"
input=$(cat)
tool=$(printf '%s' "$input" | jq -r '.tool_name // empty')

# --- flag gate: claude (fallback defaultMode) from ~/.config/fusion/config.json ---
config="${FUSION_CONFIG:-$HOME/.config/fusion/config.json}"
mode=""
[ -f "$config" ] && mode=$(jq -r '.claude // .defaultMode // empty' "$config" 2>/dev/null)
[ "$mode" = "on" ] || exit 0
# per-project escape hatch
[ -n "${CLAUDE_PROJECT_DIR:-}" ] && [ -f "$CLAUDE_PROJECT_DIR/.claude/.fusion-off" ] && exit 0

case "$tool" in
  Edit|Write|MultiEdit|NotebookEdit)
    echo "Claude Fusion: no direct writes — delegate via 'pi-delegate worker \"<Objective/Files/Interfaces/Constraints/Verification>\"' then review the diff." >&2
    exit 2 ;;
  Bash)
    cmd=$(printf '%s' "$input" | jq -r '.tool_input.command // empty')
    [ -z "$cmd" ] && exit 0
    reason=$(CF_CMD="$cmd" CF_PI_DIR="$PI_DIR" node - <<'NODE'
const cmd = process.env.CF_CMD || '';
const piDir = process.env.CF_PI_DIR;
const c = cmd.trim();
// pi-delegate carve-out: tightly-shaped, injection-safe (mirrors fusion's
// isSafeGitCommit) — role + optional flags + one quoted task, anchored end so
// nothing trails. Double-quote form forbids $ ` \ (no substitution); single-quote
// form forbids only an embedded single quote.
const PID_SQ   = /^pi-delegate (worker|reviewer|planner|researcher)( --async| --dry-run)* '[^'\n\r]*'$/;
const PID_DQ   = /^pi-delegate (worker|reviewer|planner|researcher)( --async| --dry-run)* "[^"$`\\\n\r]*"$/;
const PID_BARE = /^pi-delegate (worker|reviewer|planner|researcher)( --async| --dry-run)*$/;
if (PID_SQ.test(c) || PID_DQ.test(c) || PID_BARE.test(c)) { process.stdout.write('OK'); process.exit(0); }
try {
  const { createJiti } = require(piDir + '/extensions/pi-subagents/node_modules/jiti');
  const jiti = createJiti(piDir);
  const { isSafeBash } = jiti(piDir + '/extensions/fusion/index.ts');
  const r = isSafeBash(cmd);
  if (r.ok) { process.stdout.write('OK'); process.exit(0); }
  process.stdout.write(r.reason || 'not in allowlist'); process.exit(1);
} catch (e) {
  process.stdout.write('policy engine unavailable: ' + e.message); process.exit(2);
}
NODE
)
    st=$?
    [ "$st" = 0 ] && exit 0
    if [ "$st" = 2 ]; then
      echo "Claude Fusion: bash policy engine unavailable ($reason). Set ~/.config/fusion/config.json {\"claude\":\"off\"} or add .claude/.fusion-off to bypass." >&2
      exit 2
    fi
    echo "Claude Fusion: bash denied ($reason) — delegate mutation via 'pi-delegate worker \"<Objective/Files/Interfaces/Constraints/Verification>\"'; only read-only git, verification runners, git add/commit -m, and pi-delegate are allowed. Toggle off with claude=off or .claude/.fusion-off." >&2
    exit 2 ;;
esac
exit 0
