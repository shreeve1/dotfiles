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
2. From the repo root: `python3 scripts/import-company.py preview`. Every agent must show
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
`gpt-6-luna` high, Service Desk Lead `gpt-6-sol` high, Reviewer `gpt-6-sol` low, rest
`gpt-5.6-luna`. Models changed in the Paperclip UI are overwritten by the
next import — put them in `.paperclip.yaml`.

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
