#!/usr/bin/env bash
# selfcheck.sh — end-to-end check of Templates/probe/verify.sh.
# Mocks `pi` on PATH (emits canned JSONL: assistant text + tool calls + usage),
# runs the real verify.sh, asserts score and dollar cost. No real model, no net.
# Run: bash ~/.claude/skills/autoagent-skill/selfcheck.sh
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT

# Fake probe: 3 assertions the canned output satisfies 3/3.
mkdir -p "$TMP/probe"
printf 'produce a summary\n' > "$TMP/probe/input.md"
cat > "$TMP/probe/expected.md" <<'EOF'
~## *summary
~summary
-foo_bar_baz
EOF
cp "$HERE/Templates/probe/verify.sh" "$TMP/probe/verify.sh"

# Canned SUT (the SKILL.md body is irrelevant to scoring; verify.sh loads it via --skill).
printf -- '---\nname: x\n---\nbody\n' > "$TMP/SKILL.md"

# Fake `pi` on PATH: ignore flags, emit a minimal valid JSON event stream.
# session header, agent_start, agent_end with one assistant text message +
# a tool call + a non-zero dollar usage so the cost path is exercised.
FAKEBIN="$TMP/bin"; mkdir -p "$FAKEBIN"
cat > "$FAKEBIN/pi" <<'EOF'
#!/usr/bin/env bash
cat <<'JSONL'
{"type":"session","version":3,"id":"x","cwd":"/tmp"}
{"type":"agent_start"}
{"type":"tool_execution_start","toolCallId":"t1","toolName":"read","args":{}}
{"type":"tool_execution_end","toolCallId":"t1","toolName":"read","result":{},"isError":false}
{"type":"agent_end","messages":[{"role":"assistant","content":[{"type":"text","text":"## Summary\nhere is the summary of the work"}],"usage":{"input":100,"output":50,"totalTokens":150,"cost":{"input":0.002,"output":0.003,"total":0.005}}}]}
JSONL
EOF
chmod +x "$FAKEBIN/pi"

mkdir -p "$TMP/.autoagent"
PATH="$FAKEBIN:$PATH" \
SUT_PATH="$TMP/SKILL.md" \
LLM_MODEL=fake \
AUTOAGENT_PROBE_DIR="$TMP/probe" \
AUTOAGENT_SCORE_FILE="$TMP/.autoagent/score" \
AUTOAGENT_COST_FILE="$TMP/.autoagent/cost" \
bash "$TMP/probe/verify.sh" >/dev/null

SCORE="$(cat "$TMP/.autoagent/score")"
COST="$(cat "$TMP/.autoagent/cost")"
# Canned text matches all 3 assertions (## Summary, summary, no foo_bar_baz) => 1.000.
# Canned dollar cost total = 0.005.
[ "$SCORE" = "1.000" ] || { echo "FAIL: score=$SCORE want 1.000"; exit 1; }
[ "$COST" = "0.005" ]  || { echo "FAIL: cost=$COST want 0.005"; exit 1; }
echo "selfcheck OK: score=$SCORE cost=\$$COST"
