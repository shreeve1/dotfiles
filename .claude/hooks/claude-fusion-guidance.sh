#!/usr/bin/env bash
# claude-fusion-guidance — Claude Fusion protocol injection (ADR 0003).
# SessionStart hook. When claude=on, write the delegation protocol as RAW TEXT to
# stdout (native Claude Code adds SessionStart stdout to context — same path as
# ponytail-activate.js's process.stdout.write(context); NO hookSpecificOutput
# JSON wrapper, which is a Codex shape native CC ignores). When off, exit 0 silent.
set -u

config="${FUSION_CONFIG:-$HOME/.config/fusion/config.json}"
mode=""
[ -f "$config" ] && mode=$(jq -r '.claude // .defaultMode // empty' "$config" 2>/dev/null)
[ "$mode" = "on" ] || exit 0
[ -n "${CLAUDE_PROJECT_DIR:-}" ] && [ -f "$CLAUDE_PROJECT_DIR/.claude/.fusion-off" ] && exit 0

cat <<'EOF'
CLAUDE FUSION ACTIVE — you are the brain; delegated Pi processes are the arms and legs.
You CANNOT Edit/Write/MultiEdit/NotebookEdit and CANNOT write via Bash (writes,
sed -i, tee, > redirects, interpreters, package installs are blocked). You keep
Read/Grep/Glob/WebSearch/WebFetch, read-only git, and verification runners.

Delegate ALL mutation and grind via the `pi-delegate` wrapper (allowlisted Bash):
  pi-delegate <role> [--async] "<task>"
Roles (fresh flat `pi -p`, cheap non-Anthropic models, model+tools from settings):
  worker     — the ONLY writer; makes the edits.        (minimax/MiniMax-M3)
  reviewer   — fresh-context risk review (read-only).   (openai-codex/gpt-5.6-sol)
  planner    — fresh-context multi-file planning.       (cliproxy/claude-opus-5)
  researcher — current external facts (web tools).      (openai-codex/gpt-5.6-terra)

Every worker delegation carries all five fields:
  Objective / Files / Interfaces / Constraints / Verification.
Loop: spec the change -> `pi-delegate worker "<5 fields>"` -> `git diff` + Read the
diff YOURSELF -> run verification -> `git add` + `git commit -m '...'`.
Sync by default (prints the worker's output); pass --async for fan-out/long jobs.
Retry ladder: 1st miss -> correct & re-run worker; 2nd miss -> dictate the exact
patch; still failing -> stop and revise the plan. No blind loops, no model-switching
mid-task. For quality-sensitive work, toggling claude off and writing directly is
correct, not a failure.
EOF
exit 0
