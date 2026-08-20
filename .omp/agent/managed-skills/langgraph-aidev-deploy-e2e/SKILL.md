---
name: langgraph-aidev-deploy-e2e
description: "Deploy and live-E2E-verify LangGraph service changes on aidev: rebuild/recreate, auth smoke, synthetic-incident approval-path test with cleanup."
---

# LangGraph aidev deploy + live E2E verification

Use when deploying or live-verifying a change to the LangGraph remediation service (`automation/homelab-stack`, running on aidev 10.20.20.16, compose project `homelab-langgraph`).

## Deploy (after source/tests pass)

```bash
cd /home/james/homelab/automation/homelab-stack
docker compose --env-file /etc/homelab-stack/langgraph.env \
  -f deploy/langgraph/docker-compose.yml build langgraph-app   # source is COPYed into the image — MUST rebuild
docker compose --env-file /etc/homelab-stack/langgraph.env \
  -f deploy/langgraph/docker-compose.yml up -d                 # recreates with new env/volumes
```

- `up -d` does NOT rebuild — always `build` first or the old source runs.
- The service publishes **only** `10.20.20.16:8100` (never loopback) — curl that address; `127.0.0.1:8100` gives connection refused.
- Boot takes ~15-30s (schema ensure + lifespan compile); watch `docker logs langgraph-app --tail 30` for `Application startup complete`.

## Auth smoke (route mounted + HMAC enforced)

```bash
curl -s -w '\n%{http_code}\n' -X POST http://10.20.20.16:8100/hermes/decision \
  -H 'Content-Type: application/json' -d '{"kind":"approval","request_id":"x","action":"deny"}'
# → {"error":"invalid signature"} 401
```

## Full approval-path E2E (synthetic incident)

1. **Pick a fresh canonical key** — `alertmanager:<service>-e2e-<suffix>`. Do NOT reuse an existing key: a terminal (held) occurrence absorbs idempotent re-signals without re-running (`"idempotent":true` in the response means nothing will happen).
2. **Fire the signal** via `/ingress/incident` signed with the **ingress** key (`/etc/homelab-stack/ingress-hmac.key`, root:james 0640 — readable by james). Use the venv python + `homelab_langgraph.ingress_hmac.read_ingress_key/signing_headers`. Include `metadata: {"action_kind": ..., "target": ..., "instance": "<TARGET_HOSTS IP>"}` — the instance makes the issue-#178 host-congruence gate pass; without it the executor refuses before actuation (by design).
3. **Message realism matters**: the model-driven propose reads LIVE evidence. A claim of "down" while metrics show up → the model proposes `action_kind: none` → held at `policy_unsupported` (no interrupt). Use a realistic alert message; the model may still decline.
4. Wait ~45s, then find the request: `docker exec langgraph-postgresql psql -U langgraph -d langgraph -tAc "SELECT id,status FROM approval_requests WHERE thread_id LIKE '%<key>%' ..."`.
5. Verify the Slack message: read `#homelab-critical` with the **bot token** (`SLACK_BOT_TOKEN` from `/etc/homelab-stack/langgraph.env`; the incident USER token lacks `channels:history`) → `conversations.history`. New design: top-level text `<@mention> approval required · <ref>`, a section with `lg-decision approval <id> deny|run_once|always_allow`, NO `actions` blocks.
6. Relay via the installed CLI: `LANGGRAPH_DECISION_URL=http://10.20.20.16:8100/hermes/decision /home/james/.local/bin/lg-decision approval <id> run_once` → exit 0 + `request run_once by <operator>`.
7. Verify: log line `{"event": "hermes decision received", ...}`, request row `approved`, checkpoint moves past the interrupt (status `waiting` → actuate boundary). If the executor refuses: `error` channel in `checkpoint_writes` says `host-congruence refused ... does not match TARGET_HOSTS[...]`.

## Diagnosing where a run ended

Checkpoints hold only last-written channels — read the full trail:

```bash
docker exec langgraph-postgresql psql -U langgraph -d langgraph -tAc \
  "SELECT checkpoint->>'ts', checkpoint->'channel_values'->'status' FROM checkpoints
   WHERE thread_id='<thread>' ORDER BY checkpoint->>'ts' DESC LIMIT 5;"
# writes (proposal/policy/approval/error channels) — the hold cause lives here:
docker exec langgraph-postgresql psql -U langgraph -d langgraph -tAc \
  "SELECT w.channel, LEFT(w.blob::text, 260) FROM checkpoint_writes w
   WHERE w.thread_id='<thread>' ORDER BY w.checkpoint_id DESC, w.task_id LIMIT 20;"
```

Common holds: `policy_unsupported` (model proposed `none`/unknown tuple), `host_incongruent` (no/incorrect `instance` metadata).

## Cleanup (always)

- Close synthetic occurrences with a `healthy` signal per key (same ingress signing).
- Verify no `autonomy_policy` rows were created by the test (deny/allow decisions write durable policy).
- Do NOT relay decisions on real pending requests (there are live parked ones from the Socket Mode era) — real decisions are James's.

## Key facts

- `approval_requests.id` is a Postgres `uuid` column — non-UUID `request_id` at any HTTP boundary must fail closed BEFORE the DB (`uuid.UUID()` check), or psycopg raises `InvalidTextRepresentation` → 500.
- Guard paths on `/hermes/decision` return `200 {"ok": false, "status": ...}` (never 4xx/5xx) so the `lg-decision` CLI exits non-zero and Hermes reports the no-op back.
- Dedicated-key-per-surface: ingress key vs Hermes decision key are separate files; the Hermes key must be readable by both the container (bind mount) and the host CLI (root:james 0640).
