#!/usr/bin/env bash
# The Jev shadow gate: `.agents/bin/jev-shadow` against a fake TypeSafe endpoint.
# Checks the script's statuses, both evidence-set verdicts, redaction before send,
# the no-key path and the overall deadline. (Extension-side tests are added in
# Task 2 of the plan; this file covers the script.)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BIN="$ROOT/.agents/bin/jev-shadow"
EXT="$ROOT/.pi/agent/extensions/verify-final.ts"

command -v python3 >/dev/null || {
  echo "SKIP: python3 not installed"
  exit 0
}

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$TMP/home" "$TMP/project"

# Fake TypeSafe endpoint: one process, many requests. Modes:
#   ok   -> claim noul 0.9, verdict choice contradicted 0.7 / supported 0.2 / not_addressed 0.1
#   skip -> claim noul 0.01 (no verdict questions follow)
#   slow -> sleeps 1s before answering
python3 - "$TMP" <<'EOF' &
import json, os, sys, time
from http.server import BaseHTTPRequestHandler, HTTPServer
tmp = sys.argv[1]
class H(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def do_POST(self):
        body = self.rfile.read(int(self.headers["Content-Length"]))
        with open(os.path.join(tmp, "bodies.jsonl"), "ab") as f: f.write(body + b"\n")
        mode_f = os.path.join(tmp, "mode")
        mode = open(mode_f).read() if os.path.exists(mode_f) else "ok"
        sleep_f = os.path.join(tmp, "sleep")
        if os.path.exists(sleep_f): time.sleep(float(open(sleep_f).read()))
        req = json.loads(body)
        answers = {}
        for qid, q in req["questions"].items():
            if q["type"] == "noul":
                answers[qid] = {"type": "noul", "noul": 0.01 if mode == "skip" else 0.9}
            else:
                answers[qid] = {"type": "choice", "choice": "contradicted",
                                "probabilities": {"contradicted": 0.7, "supported": 0.2, "not_addressed": 0.1}}
        out = json.dumps({"answers": answers, "usage": {"input_tokens": 123, "output_tokens": 4}}).encode()
        try:
            self.send_response(200); self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(out))); self.end_headers(); self.wfile.write(out)
        except BrokenPipeError:
            pass
port_file = os.path.join(tmp, "port")
srv = HTTPServer(("127.0.0.1", 0), H)
with open(port_file, "w") as f: f.write(str(srv.server_address[1]))
srv.serve_forever()
EOF
FAKE_PID=$!
trap 'rm -rf "$TMP"; kill $FAKE_PID 2>/dev/null || true' EXIT
for _ in $(seq 50); do
  [ -s "$TMP/port" ] && break
  sleep 0.1
done
URL="http://127.0.0.1:$(cat "$TMP/port")/v1/systemone"

pass=0
failures=()
check() { if [ "$2" = "yes" ]; then pass=$((pass + 1)); else failures+=("$1"); fi; }
contains() { case "$1" in *"$2"*) echo yes ;; *) echo no ;; esac }
jq_get() { python3 -c 'import json,sys; d=json.load(sys.stdin); print(eval(sys.argv[1]))' "$1"; }

run_shadow() { # mode -> stdout JSON
  rm -f "$TMP/bodies.jsonl"
  printf '%s' "$1" >"$TMP/mode"
  env TYPESAFE_API_KEY=test-key HOME="$TMP/home" \
    JEV_SHADOW_URL="$URL" "$BIN" <"$TMP/input.json"
}

cat >"$TMP/input.json" <<'EOF'
{"cwd": "PROJECT", "sessionId": "s1", "answer": "The file `docs/example.md` says hello. This is another sentence with no facts at all about anything.", "record": [{"tool": "bash", "call": "cat docs/example.md", "result": "docs/example.md: hello world"}]}
EOF
python3 - "$TMP" <<'EOF'
import json, sys
p = sys.argv[1] + "/input.json"
d = json.load(open(p)); d["cwd"] = sys.argv[1] + "/project"
json.dump(d, open(p, "w"))
EOF

# (a) jev_ok: both evidence sets judged, risks computed.
out="$(run_shadow ok)"
check "ok: status jev_ok" "$(contains "$(jq_get "d['status']" <<<"$out")" jev_ok)"
check "ok: model pinned" "$(contains "$(jq_get "d['model']" <<<"$out")" jev-1.14.0)"
check "ok: claim probability recorded" "$(python3 -c 'import json,sys; c=json.loads(sys.stdin.read())["claims"][0]; print("yes" if isinstance(c["claim"], (int,float)) and c["claim"] > 0.5 else "no")' <<<"$out")"
check "ok: session verdict present" "$(contains "$(jq_get "str(d['claims'][0]['session'])" <<<"$out")" contradicted)"
check "ok: files verdict present" "$(contains "$(jq_get "str(d['claims'][0]['files'])" <<<"$out")" contradicted)"
check "ok: two risks > 0.5" "$(python3 -c 'import json,sys; d=json.loads(sys.stdin.read()); print("yes" if d["risk_session"]>0.5 and d["risk_files"]>0.5 else "no")' <<<"$out")"
check "ok: requests counted" "$(contains "$(jq_get "str(d['requests'])" <<<"$out")" 2)"
check "ok: input tokens counted" "$(python3 -c 'import json,sys; print("yes" if json.loads(sys.stdin.read())["input_tokens"] > 0 else "no")' <<<"$out")"

# (b) jev_skip: no checkable claims.
out="$(run_shadow skip)"
check "skip: status jev_skip" "$(contains "$(jq_get "d['status']" <<<"$out")" jev_skip)"
check "skip: no verdict request" "$(contains "$(jq_get "str(d['requests'])" <<<"$out")" 1)"

# (c) jev_no_key: clean HOME, no env key, no request made.
out="$(
  rm -f "$TMP/bodies.jsonl"
  env -u TYPESAFE_API_KEY HOME="$TMP/home" JEV_SHADOW_URL="$URL" "$BIN" <"$TMP/input.json"
)"
check "no key: status jev_no_key" "$(contains "$(jq_get "d['status']" <<<"$out")" jev_no_key)"
check "no key: no request" "$(contains "$([ -e "$TMP/bodies.jsonl" ] && wc -l <"$TMP/bodies.jsonl" || echo 0)" 0)"

# (d) redaction before send: a token in the answer never reaches the wire.
python3 - "$TMP" <<'EOF'
import json, sys
p = sys.argv[1] + "/input.json"
d = json.load(open(p))
d["answer"] = "The token ghp_" + "a1" * 15 + " is in `docs/example.md`. Another filler sentence for length."
json.dump(d, open(p, "w"))
EOF
out="$(run_shadow ok)"
check "redact: token absent from request body" "$(
  lacks_token() { case "$1" in *ghp_*) echo no ;; *) echo yes ;; esac }
  lacks_token "$(cat "$TMP/bodies.jsonl")"
)"
check "redact: [secret] present in request body" "$(contains "$(cat "$TMP/bodies.jsonl")" "[secret]")"

# (e) jev_timeout: the deadline beats a slow endpoint.
out="$(
  rm -f "$TMP/bodies.jsonl"
  echo 1 >"$TMP/sleep"
  env TYPESAFE_API_KEY=test-key HOME="$TMP/home" JEV_SHADOW_URL="$URL" JEV_SHADOW_TIMEOUT_MS=300 "$BIN" <"$TMP/input.json"
  rm -f "$TMP/sleep"
)"
check "timeout: status jev_timeout" "$(contains "$(jq_get "d['status']" <<<"$out")" jev_timeout)"

# Cached-clean marker: the second identical clean answer names the cache, also for --harness pi.
mkdir -p "$TMP/bin2"
cat >"$TMP/bin2/pi" <<'PYEOF'
#!/bin/sh
cat >/dev/null
printf 'VERIFIED\n'
PYEOF
chmod +x "$TMP/bin2/pi"
VF="$ROOT/.agents/bin/verify-final"
ANSWER2="A cached answer. $(head -c 600 /dev/zero | tr '\0' 'c')"
cached_run() {
  printf '%s' "$ANSWER2" | env PATH="$TMP/bin2:$PATH" HOME="$TMP/home" "$VF" --harness pi --check -
}
first_out="$(cached_run)"
second_out="$(cached_run)"
check "cache: first answer is clean" "$(contains "$first_out" "verify-final: no findings")"
check "cache: second answer names the cache" "$(contains "$second_out" "same answer found clean earlier")"

# Extension half: the extension starts jev-shadow beside the GLM check and writes one row.
command -v node >/dev/null || {
  echo "SKIP: node not installed (extension half)"
  for f in "${failures[@]+"${failures[@]}"}"; do echo "FAIL: $f" >&2; done
  echo "verify-final-jev-shadow: $pass passed, ${#failures[@]} failed"
  [ "${#failures[@]}" -eq 0 ]
  exit
}

mkdir -p "$TMP/home/.agents/bin"
cat >"$TMP/home/.agents/bin/verify-final" <<'PYEOF'
#!/usr/bin/env python3
import json, os, sys, time
data = sys.stdin.read()
mode = "done" if "--done" in sys.argv else "recommend" if "--recommend" in sys.argv else "check"
with open(os.environ["FAKE_CALLS"], "a") as f:
    f.write(json.dumps({"mode": mode, "input": data}) + "\n")
delay = {"recommend": "FAKE_REC_DELAY_MS", "check": "FAKE_CHECK_DELAY_MS"}.get(mode)
if delay:
    time.sleep(int(os.environ.get(delay, "0")) / 1000)
print(os.environ.get({"done": "FAKE_DONE", "recommend": "FAKE_REC", "check": "FAKE_CHECK"}[mode], ""))
PYEOF
chmod +x "$TMP/home/.agents/bin/verify-final"

cat >"$TMP/jev-shadow" <<'PYEOF'
#!/usr/bin/env python3
import os, sys, time
data = sys.stdin.read()
with open(os.environ["JEV_STDIN"], "a") as f:
    f.write(data + "\n")
time.sleep(int(os.environ.get("JEV_FAKE_DELAY_MS", "0")) / 1000)
print('{"status": "jev_ok", "model": "jev-1.14.0", "requests": 2, "input_tokens": 99, "seconds": 0.01, "claims": [], "risk_session": 0.42, "risk_files": 0.42}')
PYEOF
chmod +x "$TMP/jev-shadow"

export EXT TMP
node_out="$(
  HOME="$TMP/home" FAKE_CALLS="$TMP/calls" JEV_SHADOW_BIN="$TMP/jev-shadow" JEV_STDIN="$TMP/jev-stdin" node --input-type=module - <<'NODEEOF' 2>&1
import { readFileSync, rmSync, existsSync, readdirSync } from "node:fs"
import cp from "node:child_process"
import { syncBuiltinESMExports } from "node:module"
const tmp = process.env.TMP
let pass = 0
const failures = []
const check = (name, cond, detail = "") => { if (cond) pass += 1; else failures.push(`${name}${detail ? `\n  ${detail}` : ""}`) }
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
let running = 0
const realSpawn = cp.spawn
cp.spawn = (...args) => {
  const child = realSpawn(...args)
  running += 1
  let counted = true
  const done = () => { if (counted) { counted = false; running -= 1 } }
  child.once("close", done); child.once("error", done)
  return child
}
syncBuiltinESMExports()
const waitFor = async (what, cond, ms = 30000) => {
  const end = Date.now() + ms
  while (!cond()) {
    if (Date.now() > end) { check(`timed out waiting for ${what}`, false); return false }
    await wait(10)
  }
  return true
}
const drained = () => waitFor("the checkers to finish", () => running === 0)
const clearRows = () => rmSync(`${tmp}/home/.cache/verify-final-jev`, { recursive: true, force: true })
const rows = () => {
  const dir = `${tmp}/home/.cache/verify-final-jev`
  if (!existsSync(dir)) return []
  return readdirSync(dir).flatMap((f) => readFileSync(`${dir}/${f}`, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)))
}
const FALSE_LINE = "An independent fact-check of your final answer found claims that do not match the files:\nFALSE | a:1 | claim -- fix"
const LONG = "A factual answer. " + "x".repeat(600)
const quiet = () => {
  process.env.FAKE_CHECK = "verify-final: no findings"
  process.env.FAKE_DONE = "verify-final: work done"
  process.env.FAKE_REC = "verify-final: recommendations hold"
  process.env.FAKE_CHECK_DELAY_MS = "0"
  delete process.env.VERIFY_RECOMMEND
  delete process.env.VERIFY_JEV_SHADOW
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
    for (const fn of handlers.get(name) ?? []) { const r = await fn(event, ctx); if (r) last = r }
    return last
  }
  return {
    sent, notices,
    prompt: (text) => emit("before_agent_start", { messageType: "user", prompt: text }),
    answer: (text) => emit("agent_end", { messages: [{ role: "assistant", content: [{ type: "text", text }] }] }),
    toolResult: (tool, call, result) => emit("tool_result", { toolName: tool, toolCallId: "t", input: { command: call }, content: [{ type: "text", text: result }], isError: false }),
    fire: () => emit("agent_settled", { aborted: false }),
    settled: async () => { await emit("agent_settled", { aborted: false }); await drained() },
    shutdown: () => emit("session_shutdown", {}),
  }
}

// (a) One settled answer -> one row with GLM's lines and Jev's result.
{
  clearRows(); quiet(); process.env.FAKE_CHECK = FALSE_LINE
  const s = await session()
  await s.prompt("do a thing"); await s.answer(LONG); await s.settled()
  const rs = rows()
  check("row: exactly one row", rs.length === 1, JSON.stringify(rs.length))
  check("row: glm lines recorded", rs[0]?.glm?.lines?.[0]?.includes("FALSE | a:1") === true, JSON.stringify(rs[0]?.glm))
  check("row: jev result recorded", rs[0]?.jev?.status === "jev_ok" && rs[0]?.jev?.risk_session === 0.42, JSON.stringify(rs[0]?.jev))
  check("row: answer length recorded", rs[0]?.answer_len === LONG.length, JSON.stringify(rs[0]?.answer_len))
  check("row: no second message to the agent", s.sent.length === 1 && s.sent[0].m === FALSE_LINE, JSON.stringify(s.sent))
}

// (cached) A GLM-cached clean answer is marked in the row.
{
  clearRows(); quiet(); process.env.FAKE_CHECK = "verify-final: no findings (same answer found clean earlier)"
  const s = await session()
  await s.prompt("again"); await s.answer(LONG); await s.settled()
  const r = rows()[0]
  check("row: cached marked", r?.glm?.cached === true, JSON.stringify(r?.glm))
  check("row: cached has no lines", Array.isArray(r?.glm?.lines) && r.glm.lines.length === 0, JSON.stringify(r?.glm))
}

// (b) The follow-up the agent receives is identical with the shadow on and off.
{
  clearRows(); quiet(); process.env.FAKE_CHECK = FALSE_LINE
  const on = await session()
  await on.prompt("same thing"); await on.answer(LONG); await on.settled()
  const withShadow = rows().length
  process.env.VERIFY_JEV_SHADOW = "0"
  rmSync(`${tmp}/jev-stdin`, { force: true })
  const off = await session()
  await off.prompt("same thing"); await off.answer(LONG); await off.settled()
  check("row: shadow off sends no row", rows().length === withShadow, JSON.stringify([withShadow, rows().length]))
  check("row: shadow off never invokes the script", !existsSync(`${tmp}/jev-stdin`))
  check("row: identical follow-up text", on.sent[0]?.m === off.sent[0]?.m && on.sent.length === off.sent.length, JSON.stringify([on.sent, off.sent]))
  delete process.env.VERIFY_JEV_SHADOW
}

// (d) A slow script never delays GLM's follow-up; the row lands afterwards.
{
  clearRows(); quiet(); process.env.FAKE_CHECK = FALSE_LINE; process.env.JEV_FAKE_DELAY_MS = "600"
  const s = await session()
  await s.prompt("slow jev"); await s.answer(LONG); await s.fire()
  await waitFor("GLM follow-up", () => s.sent.length === 1)
  check("row: follow-up not delayed by Jev", s.sent.length === 1 && rows().length === 0, JSON.stringify([s.sent.length, rows().length]))
  await drained()
  check("row: written after the script finishes", rows().length === 1 && rows()[0].jev.status === "jev_ok", JSON.stringify(rows()))
  process.env.JEV_FAKE_DELAY_MS = "0"
}

// (e) The record handed to the script is capped at 40,000 characters, oldest first.
{
  clearRows(); quiet()
  const s = await session()
  await s.prompt("big tools")
  await s.toolResult("bash", "cat one", "A".repeat(30000))
  await s.toolResult("bash", "cat two", "B".repeat(30000))
  await s.answer(LONG); await s.settled()
  if (!existsSync(`${tmp}/jev-stdin`)) {
    check("row: record capped at 40k chars", false, "script never invoked")
    check("row: newest result kept whole", false, "script never invoked")
  } else {
  const stdin = readFileSync(`${tmp}/jev-stdin`, "utf8")
  const payload = JSON.parse(stdin.trim().split("\n").at(-1))
  const chars = payload.record.reduce((n, r) => n + r.call.length + r.result.length, 0)
  check("row: record capped at 40k chars", chars <= 40000, String(chars))
  check("row: newest result kept whole", payload.record.at(-1).result.includes("B".repeat(100)), String(payload.record.at(-1).result.length))
  }
}

console.log(JSON.stringify({ pass, failures }))
NODEEOF
)"
result="$(printf '%s\n' "$node_out" | tail -1)"
ext_pass="$(printf '%s' "$result" | python3 -c 'import json,sys; print(json.load(sys.stdin)["pass"])' 2>/dev/null || echo 0)"
while IFS= read -r f; do [ -n "$f" ] && failures+=("extension: $f"); done < <(printf '%s' "$result" | python3 -c 'import json,sys; [print(f.replace("\n", " ")) for f in json.load(sys.stdin)["failures"]]' 2>/dev/null || echo "node run failed: $node_out")
pass=$((pass + ext_pass))

for f in "${failures[@]+"${failures[@]}"]}"; do echo "FAIL: $f" >&2; done
echo "verify-final-jev-shadow: $pass passed, ${#failures[@]} failed"
[ "${#failures[@]}" -eq 0 ]
