#!/usr/bin/env bash
# verify.sh — drive the SUT (SKILL.md being tuned) through `pi -p` (headless),
# score the model's execution of the skill against expected.md assertions.
#
# Using pi as the runner (not a bare /chat/completions curl) is deliberate:
# it loads the skill natively AND gives the model its real tools (read/bash/
# edit/...), so tool-driven and multi-file skills can actually be exercised —
# the model acts, it does not just narrate. This is what gets tuned.
#
# Tuning target env (export in the loop-driving shell):
#   SUT_PATH    path to the SKILL.md being tuned              (required)
#   LLM_MODEL   pi model selector, e.g. anthropic/claude-haiku (required)
#               (provider/api-key come from your pi config — no separate env)
# Optional:
#   PI_EXTRA    extra flags appended to the pi invocation     (e.g. "--thinking off")
# Loop-driver env:
#   AUTOAGENT_PROBE_DIR   this probe's dir
#   AUTOAGENT_SCORE_FILE  write one float [0.0,1.0]
#   AUTOAGENT_COST_FILE   write cost in DOLLARS (pi-computed)
set -euo pipefail

PROBE_DIR="${AUTOAGENT_PROBE_DIR:-$(cd "$(dirname "$0")" && pwd)}"
SCORE_FILE="${AUTOAGENT_SCORE_FILE:-.autoagent/last_score}"
COST_FILE="${AUTOAGENT_COST_FILE:-}"

: "${SUT_PATH:?SUT_PATH must point at the SKILL.md being tuned}"
: "${LLM_MODEL:?LLM_MODEL required (pi selector, e.g. anthropic/claude-haiku)}"
PI_EXTRA="${PI_EXTRA:-}"

USR="$(cat "$PROBE_DIR/input.md")"
EVENTS="$PROBE_DIR/.events.jsonl"

# Headless pi: ONLY our skill (no other skills), no context files (so workspace
# CLAUDE.md/AGENTS.md can't pollute the signal), ephemeral (--no-session).
# pi's own working dir = current dir (the loop driver runs us from the workspace root).
pi -p --mode json --no-session --no-skills --no-context-files \
  --skill "$SUT_PATH" --model "$LLM_MODEL" $PI_EXTRA "$USR" \
  > "$EVENTS" 2> "$PROBE_DIR/.err" || true

# Extract the richest scoring signal: assistant text + the tools it invoked.
# Both feed the same assertion matcher, so `~read` matches whether the model
# said "read" OR called the read tool.
TEXT="$(jq -rs '
  [ .[] | select(.type=="agent_end")
    | .messages[]? | select(.role=="assistant")
    | .content[]? | select(.type=="text") | .text ]
  | join("\n")' "$EVENTS" 2>/dev/null || true)"
TOOLS="$(jq -rs '
  [ .[] | select(.type=="tool_execution_end") | .toolName ] | unique | join(", ")
  ' "$EVENTS" 2>/dev/null || true)"

if [ -z "$TEXT" ] && [ -z "$TOOLS" ]; then
  # Surface model/provider errors so a dead or deprecated model isn't mistaken
  # for a comprehension failure (would otherwise score 0 silently).
  ERRMSG="$(jq -rs '
    [ .[] | select(.type=="agent_end") | .messages[]?
      | select(.role=="assistant")
      | (.errorMessage // (.stopReason == "error" | tostring)) ]
    | map(select(. != "false")) | first // empty' "$EVENTS" 2>/dev/null || true)"
  echo "verify.sh: no output from pi.${ERRMSG:+ Model error: $ERRMSG}" >&2
  echo "  events: $EVENTS ; stderr: $PROBE_DIR/.err" >&2
  mkdir -p "$(dirname "$SCORE_FILE")"; printf '0.0\n' > "$SCORE_FILE"; exit 0
fi
OUT="${TEXT}${TOOLS:+
[tools: $TOOLS]}"
printf '%s\n' "$OUT" > "$PROBE_DIR/.out"

# Cost in DOLLARS (pi computes it across the whole agentic turn). Falls back to
# totalTokens when the provider reports no dollar cost (budget then in tokens).
COST="$(jq -rs '
  [ .[] | select(.type=="agent_end") | .messages[]? | select(.role=="assistant")
    | .usage.cost.total // 0 ] | add // 0' "$EVENTS" 2>/dev/null || echo 0)"
if [ "${COST:-0}" = "0" ]; then
  COST="$(jq -rs '
    [ .[] | select(.type=="agent_end") | .messages[]? | select(.role=="assistant")
      | .usage.totalTokens // 0 ] | add // 0' "$EVENTS" 2>/dev/null || echo 0)"
fi
if [ -n "$COST_FILE" ]; then
  mkdir -p "$(dirname "$COST_FILE")"; printf '%s\n' "$COST" > "$COST_FILE"
fi

# Assertions: +must-contain (substr, -i) | -must-not | ~regex (grep -E -i)
total=0; passed=0
EXPECTED="$PROBE_DIR/expected.md"
if [ -f "$EXPECTED" ]; then
  while IFS= read -r line || [ -n "$line" ]; do
    line="${line%$'\r'}"   # strip trailing CR (CRLF-authored expected.md)
    case "$line" in
      ''|'#'*) continue ;;
      # ${line:1} strips the operator char. NB: do NOT use ${line#~} — bash
      # tilde-expands the '~' pattern to $HOME, so the prefix never strips and
      # every '~' assertion silently fails.
      +*)
        pat="${line:1}"; [ -z "$pat" ] && continue; total=$((total+1))
        if printf '%s' "$OUT" | grep -Fqi -- "$pat"; then passed=$((passed+1)); fi ;;
      -*)
        pat="${line:1}"; [ -z "$pat" ] && continue; total=$((total+1))
        if ! printf '%s' "$OUT" | grep -Fqi -- "$pat"; then passed=$((passed+1)); fi ;;
      ~*)
        rx="${line:1}"; [ -z "$rx" ] && continue; total=$((total+1))
        if printf '%s' "$OUT" | grep -Eqi -- "$rx"; then passed=$((passed+1)); fi ;;
      *) continue ;;
    esac
  done < "$EXPECTED"
fi

if [ "$total" -eq 0 ]; then score="0.0"; else
  score="$(awk -v p="$passed" -v t="$total" 'BEGIN{printf "%.3f", p/t}')"; fi
mkdir -p "$(dirname "$SCORE_FILE")"
printf '%s\n' "$score" > "$SCORE_FILE"
echo "probe $(basename "$PROBE_DIR"): $passed/$total = $score"
