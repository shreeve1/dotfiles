#!/usr/bin/env bash
# verify.sh — drives the SUT for this probe and emits a score in [0.0, 1.0].
#
# Contract (set by the loop driver before invoking runner.cmd):
#   $AUTOAGENT_PROBE_DIR   — always set; this probe's directory (same as the script's dir)
#   $AUTOAGENT_SCORE_FILE  — set when verifier.score_file_scope == "repo".
#                            Write one float (e.g. "0.75\n") here.
#                            For "container" scope, write to the path your
#                            runner reads from instead.
#   $AUTOAGENT_COST_FILE   — set when verifier.emits_cost == true.
#                            Write one decimal cost (e.g. "0.014\n"). Optional.
#
# Exit 0 on a clean run (any score), non-zero only on infrastructure crash.
# A non-zero exit or timeout is recorded as score=0 status=crash for this probe.
set -euo pipefail

PROBE_DIR="${AUTOAGENT_PROBE_DIR:-$(cd "$(dirname "$0")" && pwd)}"
SCORE_FILE="${AUTOAGENT_SCORE_FILE:?AUTOAGENT_SCORE_FILE must be set by the runner}"
COST_FILE="${AUTOAGENT_COST_FILE:-}"

# --- 1. Drive the SUT -------------------------------------------------------
# Replace this section with whatever invokes your SUT for this probe.
# Examples:
#   autoagent harness:  uv run harbor run -p tasks/ --task-name "$(basename "$PROBE_DIR")" ...
#   Temporal:           wf=$(temporal workflow start --type MyWorkflow \
#                            --input "$(cat $PROBE_DIR/inputs.json)" -o json | jq -r .workflowId)
#                       temporal workflow result -w "$wf" > "$PROBE_DIR/.out"
#   generic CLI:        ./my-tool run < "$PROBE_DIR/input.md" > "$PROBE_DIR/.out"

# --- 2. Check the outcome ---------------------------------------------------
# Read side effects / output. NEVER trust the SUT's self-report.

score="0.0"
# Example deterministic check:
# if diff -q "$PROBE_DIR/expected.txt" "$PROBE_DIR/.out" >/dev/null; then score="1.0"; fi

# --- 3. Emit the score ------------------------------------------------------
mkdir -p "$(dirname "$SCORE_FILE")"
printf '%s\n' "$score" > "$SCORE_FILE"

# --- 4. (Optional) Emit cost ------------------------------------------------
# When the adapter sets verifier.emits_cost: true, write a single decimal
# number to $AUTOAGENT_COST_FILE (LLM token cost, compute seconds, etc.).
# if [ -n "$COST_FILE" ]; then
#   mkdir -p "$(dirname "$COST_FILE")"
#   printf '%s\n' "$cost" > "$COST_FILE"
# fi
