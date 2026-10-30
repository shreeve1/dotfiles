#!/usr/bin/env bash
# The Jev shadow gate: `.agents/bin/jev-shadow` against a fake TypeSafe endpoint.
# Checks the script's statuses, both evidence-set verdicts, redaction before send,
# the no-key path and the overall deadline. (Extension-side tests are added in
# Task 2 of the plan; this file covers the script.)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BIN="$ROOT/.agents/bin/jev-shadow"

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
        self.send_response(200); self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(out))); self.end_headers(); self.wfile.write(out)
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

for f in "${failures[@]+"${failures[@]}"]}"; do echo "FAIL: $f" >&2; done
echo "verify-final-jev-shadow: $pass passed, ${#failures[@]} failed"
[ "${#failures[@]}" -eq 0 ]
