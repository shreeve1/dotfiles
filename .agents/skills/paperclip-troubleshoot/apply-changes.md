# Applying changes to live Paperclip

Reference for the change loop in `SKILL.md`. Not a skill on its own.

Source of truth: `/home/itadmin/msp-ops/`. Live company ITA
`e777c451-cb6b-4159-9c0b-3f2d67493601`, API `http://172.20.0.1:3100`. Never edit the live copy
under `~/.paperclip`.

## What needs an import

| Changed | Goes live by |
| --- | --- |
| `company/` (agents' `AGENTS.md`, skills, `.paperclip.yaml`, `pi-providers.json`) | import (below) |
| `areas/**` (e.g. `areas/dispatch/index.md`) | nothing — read on every run |
| `scripts/**` (e.g. Jev gates) | nothing — called on every run |
| ITAStack code the agents call (`scripts/itastack`, Temporal worker) | redeploy that service |

## Import

1. Check the YAML parses: `python3 -c "import yaml;yaml.safe_load(open('company/.paperclip.yaml'))"`.
   JSON values (e.g. `PAPERCLIP_PI_PROVIDERS`) must be double-quoted JSON strings — single
   quotes are kept literally and every run falls back to James's personal Pi setup.
2. From the repo root: `python3 scripts/import-company.py preview`. Before msp-ops `bd0fdb0` the
   script applied on any argument other than `preview`; it now refuses anything but `preview` or
   `apply`. Every agent must show
   `update` and the summary `companyAction: none`. Any `create` = name/slug mismatch; stop.
3. `python3 scripts/import-company.py apply`.
4. Verify:
   - `paperclipai agent list -C <co> --api-base ... --json`: reportsTo is the Lead, no
     `pauseReason`, heartbeat disabled, maxConcurrentRuns 3 for Voice (per-site browser lock,
     2026-10-02) and 2 for the rest.
   - `paperclipai agent skills <id> --json`: desiredSkills match the frontmatter.
   - After the next run, `GET /api/heartbeat-runs/<run>/events` command notes contain
     `Injected 2 custom Pi provider(s)` and `usageJson.costUsd` > 0.
5. **Testing an instruction change on an existing issue: change the plan, not only the rules.** On
   2026-10-02 (ITA-164), a Voice rule meant to win over an accepted plan's "stop" wording had no effect
   in 4 runs, including one after `agent runtime-state:reset-session <agent> --task-key <issue uuid>`
   gave it a brand-new Pi session. Voice follows the accepted plan's literal guards. To change how an
   approved ticket behaves, get a Reviewer-accepted plan revision. The rules apply to plans written
   after the import. Evidence limit: instruction text never appears in run logs or Pi session files
   (`Training mode` 0× even before the import), and fresh sessions also open with a "Resume Delta". So
   neither grep shows whether a rule loaded; judge by what the agent does.

**One agent only, when other agent files have uncommitted edits** (2026-10-04): the import loads every
agent and skill from the working tree, so it can publish another session's unfinished changes. To
push just one agent's `AGENTS.md`, send its body without the YAML header:
`PUT /api/agents/<id>/instructions-bundle/file` with `{"path":"AGENTS.md","content":<body>}` (board key;
`routes/agents.js:4064`). Check it: take `md5sum` of every
`~/.paperclip/instances/default/companies/<co>/agents/*/instructions/AGENTS.md` before and after; only
that agent's hash may change. Skills and frontmatter (`skills:` list) still need the import.

Do not: use `paperclipai company import --target existing` (refuses replace, makes duplicates);
include company, projects or issues in a replace import; drop `--no-extensions --no-skills`
from agent extraArgs (personal `~/.agents/skills` would leak into runs).

Training mode is the one-line `Training mode: on|off` in `company/agents/<slug>/AGENTS.md`.

## Switch model (all agents)

1. Check CLIProxy serves it and does tool calls:
   `curl -s http://127.0.0.1:8317/v1/models -H 'Authorization: Bearer sk-local'`, then a
   `/v1/chat/completions` request with a `tools` array returning `tool_calls`.
2. Add it to `company/pi-providers.json` (`cliproxy-openai` for GPT) with a non-zero notional
   cost (or budgets never trip).
3. Regenerate every `PAPERCLIP_PI_PROVIDERS:` in `.paperclip.yaml` with
   `json.dumps(json.dumps(p, separators=(',',':')))`; set every `model:` to `<provider>/<id>`
   (9 agents → 9 of each). Update the "3. model" comment block. Keep `OPENROUTER_API_KEY`
   (secret_ref) — Jev scripts use it.
4. Import, then check the model id in the next run log.

Per-agent model or thinking effort: set `model:` and `thinking: <off|minimal|low|medium|high|xhigh>`
under that agent's `adapter.config`. `pi_local` passes it as `--thinking`, and Pi sends it to
CLIProxy as `reasoning_effort` (captured 2026-10-01). Never use `openai-codex/<id>` — see
SKILL.md symptom table. Since 2026-10-01 (msp-ops `5c36b38`): Dispatcher and Endpoint
`gpt-6-luna` high, Service Desk Lead `gpt-6-sol` high, rest `gpt-5.6-luna`. Since 2026-10-04 the
Reviewer is `openrouter/deepseek/deepseek-v4.1-flash` low. That model is off the Codex quota and does
tool calls (probed 2026-10-04, routed to Together). The Reviewer's Result check was dropped the same
day, so owner and Dispatch children carry only the Librarian's Knowledge review stage. Models
changed in the Paperclip UI are overwritten by the next import, so put them in `.paperclip.yaml`.

**When the Codex quota runs out (manual, James's call).** The quota breaker never switches models
itself. Moving agents to Claude (`cliproxy/claude-sonnet-5`) draws on James's own Claude account,
which his coding harness also uses. OpenRouter has no hard spending ceiling. Pick per agent, follow
steps 1–4 above, and switch back after the weekly reset (`codex-e5b937e6-noc` resets at the time
shown on the Codex usage page).

## Quota breaker: resume

The ITAStack `quota-breaker` Temporal schedule (hourly at :05 UTC, `docs/temporal.md` → Quota
Breaker) posts to #ai-james when team Codex requests exceed 200/h or one agent starts more than
12 runs/h. In `enforce` mode it also pauses the over-threshold agent, or starts a **card hold**
for the whole team. Uptime Kuma monitor "Temporal - quota-breaker heartbeat" alerts if the
schedule stops running.

Facts that shape the resume (paperclipai 2026.916.1):
- Pausing kills that agent's in-flight runs (`routes/agents.js` pause → `cancelActiveForAgent`).
  Runs claimed while paused are cancelled, not deferred.
- The recovery reconciler then marks the paused agent's `todo`/`in_progress` issues `blocked`.
  Each gets a recovery action and a comment "the board must choose the next action"
  (`recovery/service.js` ~2876).
- Resume only sets the status to `idle`. It enqueues no wakes.

Resume one paused agent:
```sh
P=/home/itadmin/.local/bin/paperclipai; A="--api-base http://172.20.0.1:3100"; C=e777c451-cb6b-4159-9c0b-3f2d67493601
$P agent resume <agent id> $A
$P issue list -C $C --assignee-agent-id <agent id> --status blocked $A --json | jq -r '.[].identifier'
# for each issue the pause blocked (check its recovery action first):
$P issue recovery-actions ITA-n $A --json
$P issue recovery:resolve ITA-n --outcome restored --source-issue-status todo --resolution-note "Quota breaker pause lifted" $A
$P agent wake <agent id> --reason "quota breaker resume" --payload '{"issueId":"<uuid>"}' $A
```
Issues that were blocked for a real reason (open blocker issue, pending card) don't have a
breaker recovery action, so leave them alone.

Release a card hold (creates the cards held tickets never got, once each):
`docker exec itastack-temporal-worker python -m itastack.agents.dispatch_checks release-card-hold`.
The hold file is `~/.itastack/paperclip_card_hold` on the host. Tickets closed during the hold
still get a card, and the Lead closes those.

**Test mode** (ADR 0021, James's switch; it is not the card hold) stops automatic cards while
James tests, and never backfills:
`docker exec itastack-temporal-worker python -m itastack.agents.dispatch_checks test-mode on|off|status`
(file `~/.itastack/paperclip_test_mode`). Real client tickets that arrive while it is on never get
a card; the human team works them. Do not use the card hold for testing: releasing it backfills.

**Ticket run budget alert:** each pass also checks every open or recently updated Ticket issue
(root plus children, runs deduped) and posts when an Area owner goes over 4 runs (Owner's call) or
8 (Shared change: `precheck:` card on its `Ready:` child, or a `Plan:`/`Result:` child), or the
ticket goes over 3 + 5 per Owner's-call owner + 11 per Shared-change owner. Each owner's path and
limit and its wake reasons are in the alert. It only alerts, in both modes; a ticket is alerted again
only when its run total grows. State: `~/.itastack/ticket_run_budget_state.json`.

Mode switch: `ITASTACK_QUOTA_BREAKER=alert|enforce` in `itastack/.env.temporal`, then
`./scripts/temporal-up.sh up -d worker`. **Enforce since 2026-10-04 (James):** a team trip starts
the card hold automatically, so new Halo tickets stop getting cards until it is released.

## Jev gates (`typesafe/jev-1.13` via OpenRouter)

- Jev only scores; it can't be an agent. Each decision is a script in `msp-ops/scripts/`
  (`request-check.py`, `tier-check.py`, sharing `ask_jev`) plus one rule line in the skill or
  area notes. Tech roster: `areas/dispatch/index.md` → `#### Tech roster`.
- Jev may only make a decision safer; any error must give the safe answer — test with
  `OPENROUTER_API_KEY= python3 scripts/<x>.py <id>`.
- Pick cut-offs by shadow-running past tickets first (python3 urllib, ThreadPoolExecutor(8),
  ~$0.00004/ticket), then a live test ticket.

## Committing in msp-ops

The Librarian and James edit the same files (often uncommitted hunks in
`areas/dispatch/index.md`) and ~85 unrelated untracked files sit in the repo. **Never
`git add -A`.** Stage only your hunks (`git add -p`), check `git diff --cached --stat`, or
commit path-scoped: `git commit -m "<msg>" -- <paths>`.

The import reads the **working tree**, not the last commit: anyone's uncommitted edits under
`company/` (e.g. James's model changes in `.paperclip.yaml` / `pi-providers.json`) go live with
yours. Run `git status --short company/` before `apply`; if others' edits are there, ask James
whether they are ready (2026-10-01).
