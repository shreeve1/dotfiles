#!/usr/bin/env bash
# The recommendation check: `verify-final --recommend` (fake `pi` checker, no model).
# Checks the script keeps sourced IMPOSSIBLE/WRONG/EXISTS lines and drops unsourced
# ones, asks for visible Revised:/Kept: lines, handles NO_RECOMMENDATIONS and
# NO_FINDINGS, caches a clean answer, skips short answers, honours VERIFY_RECOMMEND=0,
# loads the web tools with Exa only when the extension folder exists, and logs rec_*;
# and that the pi extension runs it after a TUI answer, delivers a late finding on its
# own (queued as a follow-up when the agent is busy), and never checks the revision.
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
printf '%s\n' "$@" >"$FAKE_PI_ARGV"
printf '%s' "${WEB_SEARCH_PROVIDER:-}" >"$FAKE_PI_ENV"
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
slurp() { cat "$1" 2>/dev/null || true; }
last_log() { tail -1 "$TMP/home/.cache/verify-final.log" 2>/dev/null || true; }
rec_run() {
  rm -f "$TMP/stdin" "$TMP/argv" "$TMP/env"
  env PATH="$TMP/bin:$PATH" HOME="$TMP/home" FAKE_PI_OUTPUT="$1" FAKE_PI_STDIN="$TMP/stdin" \
    FAKE_PI_ARGV="$TMP/argv" FAKE_PI_ENV="$TMP/env" "$BIN" --harness pi --recommend -
}
event() {
  python3 -c 'import json,sys; print(json.dumps({"requests": sys.argv[1:-1], "answer": sys.argv[-1]}))' "$@"
}

ANSWER="I recommend a systemd timer. $(head -c 600 /dev/zero | tr '\0' 'a')"
WRONG_LINE='WRONG | https://docs.syncthing.net/users/syncing.html | .tmp means stuck -- every transfer writes one'

out="$(event "why is sync stuck" "fix it" "$ANSWER one" | rec_run "$WRONG_LINE")"
check "script: reports a sourced WRONG line" "$(contains "$out" "$WRONG_LINE")"
check "script: has the header" "$(contains "$out" "An independent check of the recommendations in an earlier answer found problems:")"
check "script: asks for Revised:" "$(contains "$out" "Revised: <recommendation>")"
check "script: asks for Kept:" "$(contains "$out" "Kept: <recommendation>")"
check "script: says it is about an earlier answer" "$(contains "$out" "earlier answer")"
check "script: logs rec_found" "$(contains "$(last_log)" " pi rec_found ")"
check "script: logs the WRONG count" "$(contains "$(last_log)" "wrong=1")"
check "prompt: latest request judged" "$(contains "$(slurp "$TMP/stdin")" $'LATEST REQUEST:\n<<<\nfix it')"
check "prompt: earlier requests are context" "$(contains "$(slurp "$TMP/stdin")" $'EARLIER REQUESTS (context only):\n<<<\nwhy is sync stuck')"
prompt="$(slurp "$TMP/stdin")"
local_at="${prompt%%memory/*}"
official_at="${prompt%%official documentation*}"
check "prompt: local sources first" "$([ "${#local_at}" -lt "${#official_at}" ] && [ "$(contains "$prompt" "docs/")" = yes ] && echo yes || echo no)"

unsourced="$(event "q" "$ANSWER two" | rec_run 'WRONG |  | x -- y')"
check "script: an unsourced line is dropped" "$(contains "$unsourced" "verify-final: recommendations hold")"
check "script: dropped line logged rec_clean" "$(contains "$(last_log)" " pi rec_clean ")"
check "script: dropped count logged" "$(contains "$(last_log)" "dropped=1")"

none="$(event "q" "$ANSWER three" | rec_run "NO_RECOMMENDATIONS")"
check "script: NO_RECOMMENDATIONS prints no recommendations" "$(contains "$none" "verify-final: no recommendations")"
check "script: NO_RECOMMENDATIONS logs rec_none" "$(contains "$(last_log)" " pi rec_none ")"

clean="$(event "q" "$ANSWER four" | rec_run "NO_FINDINGS")"
check "script: NO_FINDINGS prints recommendations hold" "$(contains "$clean" "verify-final: recommendations hold")"
check "script: NO_FINDINGS logs rec_clean" "$(contains "$(last_log)" " pi rec_clean ")"
again="$(event "q" "$ANSWER four" | rec_run "NO_FINDINGS")"
check "cache: a clean answer is not re-checked" "$([ ! -e "$TMP/stdin" ] && echo yes || echo no)"
check "cache: logged rec_cached" "$(contains "$(last_log)" " pi rec_cached ")"
check "cache: still reports recommendations hold" "$(contains "$again" "recommendations hold")"

bad="$(event "q" "$ANSWER five" | rec_run "thinking...")"
check "error: no verdict and no sentinel" "$(contains "$bad" "verify-final: recommendation check could not run")"
check "error: logged rec_error" "$(contains "$(last_log)" " pi rec_error ")"

short="$(event "q" "too short" | rec_run "$WRONG_LINE")"
check "minimum: a short answer is skipped" "$([ ! -e "$TMP/stdin" ] && echo yes || echo no)"
check "minimum: logged rec_skip_short" "$(contains "$(last_log)" " pi rec_skip_short ")"
check "minimum: reports nothing to check" "$(contains "$short" "nothing to check")"

off="$(event "q" "$ANSWER six" | VERIFY_RECOMMEND=0 rec_run "$WRONG_LINE")"
check "off: VERIFY_RECOMMEND=0 prints off" "$(contains "$off" "verify-final: recommendation check off")"
check "off: checker not called" "$([ ! -e "$TMP/stdin" ] && echo yes || echo no)"

event "q" "$ANSWER seven" | rec_run "NO_FINDINGS" >/dev/null
check "argv: no web tools folder means no web_search" "$(lacks "$(slurp "$TMP/argv")" "web_search")"
check "argv: no web tools folder keeps the four local tools" "$(contains "$(slurp "$TMP/argv")" "read,grep,find,ls")"
check "prompt: says web search is unavailable" "$(contains "$(slurp "$TMP/stdin")" "Web search is not available")"
check "log: web=0 without the folder" "$(contains "$(last_log)" "web=0")"

mkdir -p "$TMP/home/.pi/agent/extensions/rpiv-web-tools"
event "q" "$ANSWER eight" | rec_run "NO_FINDINGS" >/dev/null
argv="$(slurp "$TMP/argv")"
check "argv: loads the web tools extension" "$(contains "$argv" $'-e\n'"$TMP/home/.pi/agent/extensions/rpiv-web-tools")"
check "argv: web tools enabled" "$(contains "$argv" "read,grep,find,ls,web_search,web_fetch")"
check "argv: still no other extensions" "$(contains "$argv" "--no-extensions")"
check "env: search provider is exa" "$([ "$(slurp "$TMP/env")" = exa ] && echo yes || echo no)"
check "prompt: states the search budget" "$(contains "$(slurp "$TMP/stdin")" "at most 3 web_search")"
check "prompt: states the fetch budget" "$(contains "$(slurp "$TMP/stdin")" "at most 3 web_fetch")"
check "log: web=1 with the folder" "$(contains "$(last_log)" "web=1")"

command -v node >/dev/null || {
  echo "SKIP: node not installed (extension half)"
  for f in "${failures[@]+"${failures[@]}"}"; do echo "FAIL: $f" >&2; done
  echo "verify-final-recommend: $pass passed, ${#failures[@]} failed"
  [ "${#failures[@]}" -eq 0 ]
  exit
}

# Extension half: a fake verify-final answers per mode, records each call, and can
# delay the recommendation result to model a slow web search.
mkdir -p "$TMP/home/.agents/bin"
cat >"$TMP/home/.agents/bin/verify-final" <<'EOF'
#!/usr/bin/env python3
import json, os, sys, time
data = sys.stdin.read()
mode = "done" if "--done" in sys.argv else "recommend" if "--recommend" in sys.argv else "check"
with open(os.environ["FAKE_CALLS"], "a") as f:
    f.write(json.dumps({"mode": mode, "input": data}) + "\n")
if mode == "recommend":
    time.sleep(int(os.environ.get("FAKE_REC_DELAY_MS", "0")) / 1000)
print(os.environ.get({"done": "FAKE_DONE", "recommend": "FAKE_REC", "check": "FAKE_CHECK"}[mode], ""))
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
const recCalls = () => calls().filter((c) => c.mode === "recommend")
const reset = () => rmSync(`${tmp}/calls`, { force: true })
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const HEADER = "An independent check of the recommendations in an earlier answer found problems:"
const WRONG = `${HEADER}\nWRONG | https://docs.example/page | the premise -- what the docs say`
const FALSE_LINE = "An independent fact-check of your final answer found claims that do not match the files:\nFALSE | a:1 | claim -- fix"
const LONG = "I recommend a timer. " + "x".repeat(600)
const quiet = () => {
  process.env.FAKE_CHECK = "verify-final: no findings"
  process.env.FAKE_DONE = "verify-final: work done"
  process.env.FAKE_REC = "verify-final: recommendations hold"
  process.env.FAKE_REC_DELAY_MS = "0"
  delete process.env.VERIFY_RECOMMEND
}

let instance = 0
async function session(mode = "tui") {
  instance += 1
  const mod = await import(`${process.env.EXT}?i=${instance}`)
  const handlers = new Map()
  const sent = []
  mod.default({
    on: (n, fn) => handlers.set(n, [...(handlers.get(n) ?? []), fn]),
    sendUserMessage: (m, o) => sent.push({ m, o }),
  })
  const notices = []
  let idle = true
  const ctx = { cwd: tmp, mode, isIdle: () => idle, ui: { notify: (m, level) => notices.push({ m, level }) } }
  const emit = async (name, event) => {
    let last
    for (const fn of handlers.get(name) ?? []) {
      const r = await fn(event, ctx)
      if (r) last = r
    }
    return last
  }
  return {
    sent, notices,
    setIdle: (v) => { idle = v },
    prompt: (text) => emit("before_agent_start", { messageType: "user", prompt: text }),
    answer: (text) => emit("agent_end", { messages: [{ role: "assistant", content: [{ type: "text", text }] }] }),
    settled: async () => { await emit("agent_settled", { aborted: false }); await wait(400) },
    beforeSettle: () => emit("agent_before_settle", { outcome: "completed", entries: [] }),
    shutdown: () => emit("session_shutdown", {}),
  }
}
const recSent = (s) => s.sent.filter((x) => x.m.startsWith(HEADER))

// A read-only answer still gets the recommendation check, with the request history.
{
  reset(); quiet()
  const s = await session()
  await s.prompt("first"); await s.prompt("which way should I build it?"); await s.answer(LONG); await s.settled()
  const rec = recCalls()[0]
  const reqs = rec ? JSON.parse(rec.input).requests : null
  check("rec: starts on a read-only TUI turn", JSON.stringify(reqs) === JSON.stringify(["first", "which way should I build it?"]), JSON.stringify(calls()))
}

// Idle: the finding starts its own turn; that revision is never checked or kept as a request.
{
  reset(); quiet(); process.env.FAKE_REC = WRONG
  const s = await session()
  await s.prompt("advise me"); await s.answer(LONG); await s.settled()
  const r = recSent(s)[0]
  check("rec: idle finding starts a turn", r !== undefined && r.o?.deliverAs === undefined, JSON.stringify(s.sent))
  reset(); await s.prompt(r?.m ?? HEADER); await s.answer(LONG + " revised"); await s.settled()
  check("rec: revision is not re-checked", calls().length === 0, JSON.stringify(calls()))
  reset(); await s.prompt("next task"); await s.answer(LONG + " next"); await s.settled()
  const hist = recCalls()[0] ? JSON.parse(recCalls()[0].input).requests : []
  check("rec: revision is not kept as a request", hist.length > 0 && !hist.some((h) => h.includes("WRONG |")), JSON.stringify(hist))
}

// Busy: a late finding is still delivered after a newer prompt, queued as a follow-up,
// and the run that carries it is not checked; the prompt after it is.
{
  reset(); quiet(); process.env.FAKE_REC = WRONG; process.env.FAKE_REC_DELAY_MS = "700"
  const s = await session()
  await s.prompt("advise me"); await s.answer(LONG); await s.settled()
  await s.prompt("newer task"); s.setIdle(false)
  await wait(1200)
  const r = recSent(s)[0]
  check("rec: late finding still delivered after a new prompt", r !== undefined, JSON.stringify(s.sent))
  check("rec: busy finding is queued as followUp", r?.o?.deliverAs === "followUp", JSON.stringify(r))
  s.setIdle(true); reset(); process.env.FAKE_REC_DELAY_MS = "0"
  await s.answer(LONG + " newer work and the revision"); await s.settled()
  check("rec: queued revision is not checked", calls().length === 0, JSON.stringify(calls()))
  reset(); await s.prompt("after that"); await s.answer(LONG + " after"); await s.settled()
  check("rec: the prompt after a queued revision is checked", recCalls().length === 1, JSON.stringify(calls()))
}

// The fact-check and the recommendation check reach the agent as separate messages.
{
  reset(); quiet(); process.env.FAKE_CHECK = FALSE_LINE; process.env.FAKE_REC = WRONG
  const s = await session()
  await s.prompt("advise me"); await s.answer(LONG); await s.settled()
  const fact = s.sent.filter((x) => x.m.includes("FALSE |"))
  check("rec: not merged with the fact-check", s.sent.length === 2 && fact.length === 1 && recSent(s).length === 1 && !fact[0].m.includes("WRONG |"), JSON.stringify(s.sent))
}

// Once per prompt.
{
  reset(); quiet()
  const s = await session()
  await s.prompt("advise me"); await s.answer(LONG); await s.settled(); await s.answer(LONG + " again"); await s.settled()
  check("rec: once per prompt", recCalls().length === 1, JSON.stringify(calls()))
}

// VERIFY_RECOMMEND=0 turns off only this check.
{
  reset(); quiet(); process.env.VERIFY_RECOMMEND = "0"
  const s = await session()
  await s.prompt("advise me"); await s.answer(LONG); await s.settled()
  check("rec: VERIFY_RECOMMEND=0 skips it", recCalls().length === 0 && calls().some((c) => c.mode === "check"), JSON.stringify(calls()))
}

// Headless runs get no recommendation check.
{
  reset(); quiet()
  const s = await session("print")
  await s.prompt("advise me"); await s.answer(LONG); await s.beforeSettle(); await wait(400)
  check("rec: headless does nothing", recCalls().length === 0, JSON.stringify(calls()))
}

// A checker that could not run shows one warning and sends nothing.
{
  reset(); quiet(); process.env.FAKE_REC = "verify-final: recommendation check could not run (timed out after 300s)"
  const s = await session()
  await s.prompt("advise me"); await s.answer(LONG); await s.settled()
  check("rec: error shows a notice", s.sent.length === 0 && s.notices.length === 1 && s.notices[0].level === "warning", JSON.stringify([s.sent, s.notices]))
}

// Session shutdown while the check runs: nothing is sent.
{
  reset(); quiet(); process.env.FAKE_REC = WRONG; process.env.FAKE_REC_DELAY_MS = "800"
  const s = await session()
  await s.prompt("advise me"); await s.answer(LONG); await s.settled()
  await s.shutdown(); await wait(900)
  check("rec: shutdown discards", recSent(s).length === 0, JSON.stringify(s.sent))
}

console.log(JSON.stringify({ pass, failures }))
EOF
)"
result="$(printf '%s\n' "$node_out" | tail -1)"
ext_pass="$(printf '%s' "$result" | python3 -c 'import json,sys; print(json.load(sys.stdin)["pass"])' 2>/dev/null || echo 0)"
while IFS= read -r f; do [ -n "$f" ] && failures+=("extension: $f"); done < <(printf '%s' "$result" | python3 -c 'import json,sys; [print(f.replace("\n", " ")) for f in json.load(sys.stdin)["failures"]]' 2>/dev/null || echo "node run failed: $node_out")
pass=$((pass + ext_pass))

for f in "${failures[@]+"${failures[@]}"}"; do echo "FAIL: $f" >&2; done
echo "verify-final-recommend: $pass passed, ${#failures[@]} failed"
[ "${#failures[@]}" -eq 0 ]
