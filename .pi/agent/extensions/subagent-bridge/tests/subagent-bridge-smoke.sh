#!/usr/bin/env bash
# subagent-bridge-smoke.sh — offline behavioral smoke for the subagent-bridge
# Pi extension (no model, no network, no real pi).
#
# Loads index.ts through the vendored jiti (pi-subagents/node_modules) with a
# stub ExtensionAPI, then drives the foreground-spawn tracking added for
# /fleet visibility of sync runs:
#   (1) extension loads and registers the "pi-subagents" activity provider
#   (2) tool_execution_start on a spawn-shaped subagent call -> 1 running item
#   (3) tool_execution_end re-keys to details.runId, marks complete, keeps
#       the finalOutput tail (no duplicate placeholder entry)
#   (4) management calls (action:) and async:true are not tracked
#   (5) a call whose result carries asyncDir is dropped (async events own it)
#
# Does NOT exercise live spawns, RPC actions, or the TUI overlay.

set -u
script_dir=$(cd "$(dirname "$0")" && pwd)
node "$script_dir/subagent-bridge-smoke.mjs"
