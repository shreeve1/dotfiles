#!/usr/bin/env bash
# The completion check: `verify-final --done` (fake `pi` checker, no model) and the
# pi extension's use of it (fake event bus, fake verify-final). Checks the script
# reports MISSING lines with the visible "Missing:" instruction, says "work done"
# when clean, skips short answers, caches a done answer, logs done_* statuses;
# and that the extension sends the request history, checks only turns that did
# work, merges both checks' findings into ONE follow-up, and never re-checks it.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BIN="$ROOT/.agents/bin/verify-final"
EXT="$ROOT/.pi/agent/extensions/verify-final.ts"

command -v python3 >/dev/null || {
  echo "SKIP: python3 not installed"
  exit 0
}

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$TMP/home" "$TMP/bin"
cat >"$TMP/bin/pi" <<'EOF'
#!/bin/sh
cat >"$FAKE_PI_STDIN"
printf '%s\n' "$FAKE_PI_OUTPUT"
EOF
chmod +x "$TMP/bin/pi"

pass=0
failures=()
check() {
  if [ "$2" = "yes" ]; then pass=$((pass + 1)); else failures+=("$1"); fi
}
contains() { case "$1" in *"$2"*) echo yes ;; *) echo no ;; esac }
lacks() { case "$1" in *"$2"*) echo no ;; *) echo yes ;; esac }
last_log() { tail -1 "$TMP/home/.cache/verify-final.log"; }
done_run() {
  env PATH="$TMP/bin:$PATH" HOME="$TMP/home" FAKE_PI_OUTPUT="$1" FAKE_PI_STDIN="$TMP/stdin" \
    "$BIN" --harness pi --done -
}
event() {
  python3 -c 'import json,sys; print(json.dumps({"requests": sys.argv[1:-1], "answer": sys.argv[-1]}))' "$@"
}

ANSWER="$(head -c 600 /dev/zero | tr '\0' 'a')"
GAP='MISSING | the answer | the README was not updated'

out="$(event "set up X" "update the README too" "$ANSWER gap" | done_run "$GAP")"
check "script: reports the MISSING line" "$(contains "$out" "$GAP")"
check "script: asks for a visible Missing: line" "$(contains "$out" 'Missing: <what was not done>')"
check "script: lets the agent push back" "$(contains "$out" 'Checked: <the part> was done')"
check "script: forbids unapproved irreversible steps" "$(contains "$out" "irreversible")"
check "script: logs done_missing" "$(contains "$(last_log)" " pi done_missing ")"
check "prompt: the latest request is judged" "$(contains "$(cat "$TMP/stdin")" $'LATEST REQUEST:\n<<<\nupdate the README too')"
check "prompt: earlier requests are context" "$(contains "$(cat "$TMP/stdin")" $'EARLIER REQUESTS (context only):\n<<<\nset up X')"
check "prompt: forbids asking for unrequested work" "$(contains "$(cat "$TMP/stdin")" "Do not ask for extra work")"
check "prompt: asks for a verdict per part" "$(contains "$(cat "$TMP/stdin")" "one line per part")"

mixed="$(event "do A and B" "$ANSWER mixed" | done_run $'DONE | a:1 | A\nMISSING | none | B -- not done')"
check "script: one MISSING among DONE lines still reports the gap" "$(contains "$mixed" "MISSING | none | B")"
bare="$(event "do V" "$ANSWER bare" | done_run "This is DONE now.")"
check "script: a bare DONE word is not a verdict" "$(contains "$bare" "completion check could not run")"

OK='DONE | a.txt:1 | do Y'
clean="$(event "do Y" "$ANSWER clean" | done_run "$OK")"
check "script: DONE prints work done" "$(contains "$clean" "verify-final: work done")"
check "script: logs done_clean" "$(contains "$(last_log)" " pi done_clean ")"
rm -f "$TMP/stdin"
again="$(event "do Y" "$ANSWER clean" | done_run "$OK")"
check "cache: a done answer is not re-checked" "$([ ! -e "$TMP/stdin" ] && echo yes || echo no)"
check "cache: logged as done_cached" "$(contains "$(last_log)" " pi done_cached ")"
check "cache: still reports work done" "$(contains "$again" "verify-final: work done")"

rm -f "$TMP/stdin"
short="$(event "do Z" "too short" | done_run "$GAP")"
check "minimum: a short answer is skipped" "$([ ! -e "$TMP/stdin" ] && echo yes || echo no)"
check "minimum: skip reports work done" "$(contains "$short" "nothing to check")"

bad="$(event "do W" "$ANSWER bad" | done_run "I could not decide.")"
check "error: no verdict is reported, not blocked" "$(contains "$bad" "completion check could not run")"
check "error: logged done_error" "$(contains "$(last_log)" " pi done_error ")"

command -v node >/dev/null || {
  echo "SKIP: node not installed (extension half)"
  for f in "${failures[@]+"${failures[@]}"}"; do echo "FAIL: $f" >&2; done
  echo "verify-final-done: $pass passed, ${#failures[@]} failed"
  [ "${#failures[@]}" -eq 0 ]
  exit
}

# Extension half: a fake verify-final answers per mode and records each call.
mkdir -p "$TMP/home/.agents/bin"
cat >"$TMP/home/.agents/bin/verify-final" <<'EOF'
#!/usr/bin/env python3
import json, os, sys
data = sys.stdin.read()
mode = "done" if "--done" in sys.argv else "check"
with open(os.environ["FAKE_CALLS"], "a") as f:
    f.write(json.dumps({"mode": mode, "input": data}) + "\n")
print(os.environ.get("FAKE_DONE" if mode == "done" else "FAKE_CHECK", ""))
EOF
chmod +x "$TMP/home/.agents/bin/verify-final"
export EXT TMP

node_out="$(
  HOME="$TMP/home" FAKE_CALLS="$TMP/calls" node --input-type=module - <<'EOF' 2>&1
import { readFileSync, rmSync, existsSync } from "node:fs"
const tmp = process.env.TMP
let pass = 0
const failures = []
const check = (name, cond, detail = "") => {
  if (cond) pass += 1
  else failures.push(`${name}${detail ? `\n  ${detail}` : ""}`)
}
const calls = () =>
  existsSync(`${tmp}/calls`)
    ? readFileSync(`${tmp}/calls`, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l))
    : []
const reset = () => rmSync(`${tmp}/calls`, { force: true })
const LONG = "The answer. " + "x".repeat(600)
const GAP = "An independent check of whether the work is finished found parts of the request that are not done:\nMISSING | answer | the README"
const FALSE_LINE = "An independent fact-check of your final answer found claims that do not match the files:\nFALSE | a:1 | claim -- fix"

let instance = 0
async function session(mode = "tui") {
  instance += 1
  const mod = await import(`${process.env.EXT}?i=${instance}`)
  const handlers = new Map()
  const sent = []
  mod.default({ on: (n, fn) => handlers.set(n, [...(handlers.get(n) ?? []), fn]), sendUserMessage: (m) => sent.push(m) })
  const notices = []
  const ctx = { cwd: tmp, mode, isIdle: () => true, ui: { notify: (m) => notices.push(m) } }
  const emit = async (name, event) => {
    let last
    for (const fn of handlers.get(name) ?? []) {
      const r = await fn(event, ctx)
      if (r) last = r
    }
    return last
  }
  const answer = (text) => emit("agent_end", { messages: [{ role: "assistant", content: [{ type: "text", text }] }] })
  return {
    sent, notices,
    prompt: (text) => emit("before_agent_start", { messageType: "user", prompt: text }),
    tool: (toolName) => emit("tool_call", { toolName, toolCallId: `t${Math.random()}`, input: {} }),
    answer,
    settled: async () => { await emit("agent_settled", { aborted: false }); await new Promise((r) => setTimeout(r, 400)) },
    beforeSettle: () => emit("agent_before_settle", { outcome: "completed", entries: [] }),
  }
}

// 1. A turn that edited: both checks run; a gap alone sends one follow-up.
{
  reset(); process.env.FAKE_CHECK = "verify-final: no findings"; process.env.FAKE_DONE = GAP
  const s = await session()
  await s.prompt("first ask"); await s.prompt("set up the README")
  await s.tool("edit"); await s.answer(LONG); await s.settled()
  const modes = calls().map((c) => c.mode).sort().join(",")
  check("work turn runs both checks", modes === "check,done", modes)
  const done = calls().find((c) => c.mode === "done")
  const sentIn = done ? JSON.parse(done.input) : {}
  check("request history is sent, latest last", JSON.stringify(sentIn.requests) === JSON.stringify(["first ask", "set up the README"]), done?.input)
  check("a gap sends one follow-up", s.sent.length === 1 && s.sent[0].includes("MISSING |"), JSON.stringify(s.sent))
  // The follow-up turn is not re-checked and is not added to the request history.
  reset(); await s.prompt(s.sent[0]); await s.tool("edit"); await s.answer(LONG + " fixed"); await s.settled()
  check("follow-up turn is not re-checked", calls().length === 0, JSON.stringify(calls()))
  reset(); await s.prompt("next task"); await s.tool("bash"); await s.answer(LONG + " next"); await s.settled()
  const next = calls().find((c) => c.mode === "done")
  const hist = next ? JSON.parse(next.input).requests : []
  check("follow-up text is not kept as a request", !hist.some((r) => r.includes("MISSING |")), JSON.stringify(hist))
}

// 2. A read-only turn: only the grounding check runs.
{
  reset(); process.env.FAKE_CHECK = "verify-final: no findings"; process.env.FAKE_DONE = GAP
  const s = await session()
  await s.prompt("what does this do?"); await s.tool("read"); await s.answer(LONG); await s.settled()
  const modes = calls().map((c) => c.mode).join(",")
  check("read-only turn skips the completion check", modes === "check", modes)
  check("clean read-only turn sends nothing", s.sent.length === 0)
}

// 3. Both find something: one follow-up carrying both.
{
  reset(); process.env.FAKE_CHECK = FALSE_LINE; process.env.FAKE_DONE = GAP
  const s = await session()
  await s.prompt("fix it"); await s.tool("write"); await s.answer(LONG); await s.settled()
  check("both findings merge into one follow-up", s.sent.length === 1 && s.sent[0].includes("FALSE |") && s.sent[0].includes("MISSING |"), JSON.stringify(s.sent))
}

// 4. Both clean: nothing sent, no notice.
{
  reset(); process.env.FAKE_CHECK = "verify-final: no findings"; process.env.FAKE_DONE = "verify-final: work done"
  const s = await session()
  await s.prompt("fix it"); await s.tool("edit"); await s.answer(LONG); await s.settled()
  check("clean turn sends nothing", s.sent.length === 0 && s.notices.length === 0, JSON.stringify([s.sent, s.notices]))
}

// 5. VERIFY_DONE=0 turns off only the completion check.
{
  reset(); process.env.VERIFY_DONE = "0"; process.env.FAKE_CHECK = "verify-final: no findings"; process.env.FAKE_DONE = GAP
  const s = await session()
  await s.prompt("fix it"); await s.tool("edit"); await s.answer(LONG); await s.settled()
  check("VERIFY_DONE=0 skips the completion check", calls().map((c) => c.mode).join(",") === "check")
  delete process.env.VERIFY_DONE
}

// 6. Headless: findings return as one boundary continuation.
{
  reset(); process.env.FAKE_CHECK = "verify-final: no findings"; process.env.FAKE_DONE = GAP
  const s = await session("print")
  await s.prompt("fix it"); await s.tool("edit"); await s.answer(LONG)
  const r = await s.beforeSettle()
  const text = r?.entries?.at(-1)?.content ?? ""
  check("headless gap continues the run", r?.continue === true && text.includes("MISSING |"), text)
}

console.log(JSON.stringify({ pass, failures }))
EOF
)"
result="$(printf '%s\n' "$node_out" | tail -1)"
ext_pass="$(printf '%s' "$result" | python3 -c 'import json,sys; print(json.load(sys.stdin)["pass"])' 2>/dev/null || echo 0)"
while IFS= read -r f; do [ -n "$f" ] && failures+=("extension: $f"); done < <(printf '%s' "$result" | python3 -c 'import json,sys; [print(f.replace("\n", " ")) for f in json.load(sys.stdin)["failures"]]' 2>/dev/null || echo "node run failed: $node_out")
pass=$((pass + ext_pass))

for f in "${failures[@]+"${failures[@]}"}"; do echo "FAIL: $f" >&2; done
echo "verify-final-done: $pass passed, ${#failures[@]} failed"
[ "${#failures[@]}" -eq 0 ]
