---
name: paperclip-troubleshoot
description: >
  The one skill for James's Paperclip AI ops team (MSP Ops company): diagnose misbehaviour (an
  agent that never picked up its ticket, a failed run, an approval that woke nobody, Paperclip
  down, a missing skill) AND change anything about how Paperclip behaves — agent instructions,
  skills, area rules, scripts, models, Jev gates, ITAStack code the agents call — then prove it
  with a live test ticket and adjust until it is right. Also: find where agents waste requests
  struggling (searching for tools, paths, pages) and give them what they need. Use for any
  Paperclip troubleshooting, change or usage question, not only dispatch.
---

# Paperclip: diagnose, change, test live, adjust

James's AI ops team runs on Paperclip (company ITA, packaged in `/home/itadmin/msp-ops/company`).
This skill has two halves:

1. **Diagnose** — read-only: find why something did or did not happen.
2. **Change loop** — any change to Paperclip behaviour is not done until a live test ticket has
   gone through Paperclip and been checked against what we expected.

**Keep this skill current instead of creating new ones.** When a session learns a Paperclip
fact, gotcha or test recipe, add it here (or to `live-test.md` / `apply-changes.md` next to this
file). Do not create new `paperclip-*` skills, managed or otherwise.

Reference files in this folder:

- `paperclip-api.md` — connection, company id, shared API facts.
- `live-test.md` — creating a test ticket, what to check, cleanup, Halo gotchas.
- `apply-changes.md` — pushing msp-ops changes to live Paperclip, model switches, Jev gates,
  committing safely.
- `struggle.py` — struggle review of run transcripts (section below).

## The change loop (any behavioural change)

1. **Change.** Edit the source: msp-ops `company/` (agents, skills, `.paperclip.yaml`),
   `areas/`, `scripts/`, or ITAStack code the agents call. Never edit the live copy under
   `~/.paperclip`.
2. **Apply.** Push it live (`apply-changes.md`): `company/` files need the import; `areas/` and
   `scripts/` are read on each run. Confirm the agent actually has the change.
3. **Test.** Create a fresh test ticket that exercises the change (`live-test.md`). Pick the
   ticket shape that hits the changed path (business hours vs after hours, client vs staff,
   placeholder sender, tier 1 vs tier 2, …). State up front what you expect to see.
4. **Observe.** Wait for the runs, then check every expectation: Paperclip cards and closing
   comments, Halo actions and their order, fields, appointments, emails, run logs. Then run the
   **struggle review** (next section) on the test's runs — every time, not only when something broke.
5. **Report.** Plain words: expected vs actual, per check. Anything off → name the cause from
   the evidence and propose the next adjustment.
6. **Adjust and repeat** from step 1 until every check passes and James is happy.
7. **Clean up** every test ticket, appointment and Paperclip card the loop created
   (`live-test.md` → Cleanup). Not optional.

**When a live test is needed:** any change that alters what an agent does — rules, wording sent
to people, routing, scheduling, gates, models, instructions, skills, scripts. **May skip:**
doc-only edits and small changes already known to be safe (typo, comment, a note that no agent
acts on). When you skip, say so in one line and why.

**Standing permission (James, 2026-10-01):** you may create Halo test tickets and Paperclip test
issues at any time without asking, and act on them freely, as long as you only touch the test
tickets you created (and their appointments/cards). You must delete them at the end. Touching
any real ticket, client, or James's real appointments still needs his OK. Changing live agent
instructions, skills or config still needs his go-ahead on the change itself.

## Struggle review — make repetitive work effortless (top priority)

**Principle (James, 2026-10-04):** for any workflow agents repeat, they must already have
everything they need — the exact command, absolute path, page URL, API call and parameters. A model
request spent *finding* a tool, a path, an API shape or a page is a defect in our instructions, not
in the agent. Recommended order (not a James decision): fix struggle before touching budgets,
models or review gates — it cuts quota use and makes runs more predictable, without giving agents
any new freedom.

**When:** after every live test (change loop step 4), on every Ticket run budget alert, and as a
sweep whenever James asks where usage goes.

```sh
python3 ~/.agents/skills/paperclip-troubleshoot/struggle.py --since 2026-10-04T20:00 [--agent Voice]
python3 ~/.agents/skills/paperclip-troubleshoot/struggle.py ~/.pi/paperclips/<run>.jsonl
```

It reads the Pi run transcripts in `~/.pi/paperclips/` (one file per run, named
`<start>-<agent id>.jsonl`). **One assistant turn = one model request**; parallel tool calls inside one
turn cost one request, so count turns, not tool calls. A turn is flagged `search` (find, grep -R,
readlink, openapi, Paperclip server source, ITAStack `__describe__`), `failed` (a tool error),
`stale-ref` (browser ref from an old snapshot) or `env-dump`. Streaks of 2+ flagged turns in a row are
what to fix.

**Fix pattern:** name what the agent was looking for, then put the answer where it reads at that
step — the skill or area index for that workflow, or a script in msp-ops `scripts/` when it takes
several calls. Absolute paths only (agents run with cwd `/home/itadmin/msp-ops`; a relative
`scripts/…` from another skill does not resolve). Then rerun the same test: the streak must be gone and
the run's request count lower. Instruction changes go to James as a proposal, as with any change.

Found 2026-10-03/04 (3,207 requests, 670 flagged — about 1 in 5):

| Struggle | Requests | Fix |
|---|---|---|
| 3CX browser clicks on stale refs / ambiguous selectors (Voice) | ~140 | Part of it was the ITGlue extension overlay swallowing clicks (fixed 2026-10-04, pi-browser patch 8, wiki C-0490). Remaining: `browser-3cx` gives direct page URLs for common screens; take a fresh snapshot after every navigation before using a ref |
| Inspecting env vars at start of run (all agents) | ~95 | Rule: never list or print env vars; `PAPERCLIP_*`, `PI_*` are documented in the paperclip skill. Since 2026-10-04 `scripts/pi-run` starts Pi with an env allowlist (wiki C-0488), so a dump no longer leaks server secrets, but it still costs a request |
| ITAStack CLI `__describe__` to learn op names/params | ~75 | Area skills list the exact `itastack <service> <op> --param …` lines they use |
| Upload helper hunt (Voice, 3 runs) | 5–11 per run | The paperclip skill says `bash scripts/paperclip-upload-artifact.sh`; bash resolves that against the agent's cwd `/home/itadmin/msp-ops`, where it did not exist (the helper ships inside the skill folder). Fix: msp-ops `scripts/paperclip-upload-artifact.sh` forwards to the bundled helper, so the documented command works as written |
| Mistyped skill folder hash (`browser-control--964a0dfe9`) | ~8 | Name skills by their skill name, not the hashed folder path |

**Secrets:** transcripts hold tool output. Runs before the `pi-run` allowlist (2026-10-04) include
env dumps with the agent JWT signing secret and the Paperclip database URL (wiki C-0488; not
rotated, per James). The folder has been mode 700 since 2026-10-04. Never paste raw transcript text;
`struggle.py` redacts tokens and `*KEY/SECRET/TOKEN/PASSWORD=` values.

## Diagnose

### 1. Is Paperclip up?

```sh
sudo systemctl status paperclip.service --no-pager
curl -s -o /dev/null -w '%{http_code}\n' "$API/api/health"       # 200 = up
```

(`/healthz` also answers 200, but that's the web page, not the API.)

A dead unit or a non-200 *is* the answer — say so and stop. Do not restart or reconfigure
Paperclip without James's go-ahead.

**Done when** the health route answered `200`, or you can name the failure (unit state, unreachable
port) in plain words.

### 2. Which ticket, which agent?

Set up the connection and company id per `paperclip-api.md`, then find the ticket James means:

```sh
curl -sS "${AUTH[@]}" "$API/api/companies/$C/issues?q=ITA-123"     # fuzzy superset — pick the exact identifier
curl -sS "${AUTH[@]}" "$API/api/companies/$C/issues?status=backlog,todo,in_progress,in_review,blocked&sortField=updated&sortDir=desc&limit=50"
```

The list is not newest-first unless you ask (`sortField=updated&sortDir=desc`). Read on the issue:
`identifier`, `status`, `assigneeAgentId`, `assigneeUserId`, `activeRun`, `updatedAt`. Map every
agent id to a name with `GET /api/companies/{c}/agents` — that row also carries `status`,
`pauseReason`, `errorReason`, `lastHeartbeatAt`, `adapterType`, `adapterConfig.model`.

**Done when** you can say in one line which ticket, its status, who owns it (agent name, or James),
and that agent's `status`.

### 3. What woke — or didn't

```sh
curl -sS "${AUTH[@]}" "$API/api/issues/ITA-123/diagnostics/wakes"
curl -sS "${AUTH[@]}" "$API/api/companies/$C/heartbeat-runs?agentId=<agent id>&limit=20"
curl -sS "${AUTH[@]}" "$API/api/companies/$C/live-runs"
```

- **`diagnostics/wakes`** — read `diagnosis` / `likelyReason` first (both carry the same sentence —
  either will do): one plain sentence naming the most recent wake's fate. Then `events[]`, one
  entry per wake request, each with `kind`, `agentId`, `reason`
  (`issue_assigned`, `issue_commented`, `issue_comment_mentioned`, `issue_blockers_resolved`,
  `issue_dependencies_blocked`, `issue_tree_hold_active`, `missing_issue_comment`,
  `process_lost_retry`, `run_liveness_continuation`, `heartbeat.disabled`,
  `heartbeat.timer.no_actionable_work`, `heartbeat.wakeOnDemand.disabled`), `status` (`queued`,
  `claimed`, `coalesced`, `skipped`, `completed`, `failed`, `cancelled`,
  `deferred_issue_execution`), `failureClass`, `source` (`timer`, `assignment`, `on_demand`,
  `automation`), `coalescedCount`, `runId`, and the timestamps `requestedAt`/`claimedAt`/
  `finishedAt` (there is no `createdAt`/`updatedAt`). Any value outside these lists is reported as
  `other`.
- **Follow `runId` into the run** — `heartbeat-runs?agentId=` or `GET /api/heartbeat-runs/{runId}`.
  The run carries `status` (`queued`, `scheduled_retry`, `running`, `succeeded`, `interrupted`,
  `failed`, `cancelled`, `timed_out`), `errorCode`, `error`, `exitCode`, `usageJson.model`,
  `invocationSource`, `wakeupRequestId`, `sessionIdAfter`. There is no `issueId` field — read the
  link from `contextSnapshot.issueId` (and `contextSnapshot.wakeReason`), or list the agent's
  issues with `issues?assigneeAgentId=<id>&status=<open list>`. The wake says whether the agent
  was called; the run says what happened when it was.
- **What the agent actually did** — the run log
  `~/.paperclip/instances/default/data/run-logs/<company>/<agent>/<runId>.ndjson` (runId from
  `issue get ITA-n --json | jq .executionRunId`). `grep -oE` for the command you care about
  (e.g. `appointments\.(create|delete)`), don't cat it. `GET /api/heartbeat-runs/<run>/events`
  shows command notes, working folder and arguments.
- **Provider/stream errors need the Pi session file.** `stdoutExcerpt`/`stderrExcerpt` are only
  ~32 KiB tail windows (and the agent-run list nulls them — they come from the single-run `GET`),
  so a mid-run provider cut can be missing. For one, read the per-run Pi session file at the run's
  `sessionIdAfter` under `/home/itadmin/.pi/paperclips/`: each assistant message carries
  `stopReason` and `errorMessage`, and it shows whether Pi recovered. Read only those fields —
  the file holds the whole conversation.
- **`live-runs`** lists only `queued`/`running` runs, so empty means nothing is running now. (Add
  `minCount` and finished runs are padded in — a bogus "running now".) Each row has `agentName`,
  `issueId`, `livenessState`, `nextAction`.

**Done when** every wake event on the ticket and every run of that agent in the window is accounted
for, and each maps to a row in the table below.

### 4. Report

Four lines, plain words:

> **Symptom** — what James saw. **Evidence** — the route and the field that shows it.
> **Cause** — one sentence. **Fix** — what you would change, and what it costs.

Then ask. Once James says yes, run the change loop above for the fix.

### Symptom → cause

Each row is a reusable fix: the symptom, how to confirm it, and what to do. Leave out incident history
(dates, ticket numbers, run ids, how many times it happened) and progress notes; those go in
`~/itastack/issuetracker/`.

| Symptom | Evidence | Cause and fix |
| --- | --- | --- |
| Agent never started | agent row `status: paused`, `pauseReason: import` | Parked by an import or approval gate — assignment wakes do not run. Resume only after confirming the imported configuration. |
| Agent never started | wake event `status: cancelled`/`skipped`; its run `errorCode: issue_assignee_changed` | The assignee changed before the queued run started. Wake the current owner with an `[Name](agent://<id>)` comment; do not reassign repeatedly. |
| Agent never started | wake event `status: coalesced` | Several wakes folded into one — usually harmless. Check the run that did happen. |
| Agent never started | no `issue_assigned` wake event at all | The ticket was never assigned to that agent. A ticket assigned to a **person** wakes nobody. |
| Run failed at start | run `status: failed`, `errorCode: adapter_failed`, `error`/`stderrExcerpt` reports "pi --list-models" timed out | Pi model discovery timed out. Check host load, the agent's `TMPDIR`, and `heartbeat.maxConcurrentRuns`. |
| Run failed at start | `errorCode: setup_failed`, `error` "Incorrect API key provided: sk-svcacct…" | The `openai-codex` login was revoked upstream — only James can sign in again. |
| Run failed at start | run `status: cancelled`, `errorCode: execution_reconciliation_required`, `error` "The previous provider process is still running." | A stale Pi process still holds the task, so a new wake cannot start. It clears itself; do not kill the process without James. |
| Card stuck `in_review`, no run | Reviewer wake skipped (`execution_reconciliation_required`), or child assigned to Reviewer with `executionState.reviewRequest: null` and Reviewer `lastHeartbeatAt` older than the handoff (seen 2026-10-01, ITA-72: 14 min idle) | After the lease is released: `POST /api/agents/<reviewer>/wakeup {source:assignment,payload:{issueId}}`, or without an API key `$P agent wake <reviewer id> --source assignment --payload '{"issueId":"<uuid>"}' $A` — confirm with `agent list` status `running`. |
| Owner wake returns `{"id":null}` or queues but no run log appears; issue `in_review` | `issue get ITA-n --json \| jq .executionState.currentParticipant` shows `type: user` although `executionPolicy.stages` lists only the Reviewer and Librarian | The review stage is held by a person, so the owner can't run on the issue and new work never starts. Seen 2026-10-02 on ITA-102 (70485) after a run was cut off mid-handoff. Don't fight the stage: create a child the owner owns (`issue child:create ITA-n --payload-json '{"title":"Plan: …","assigneeAgentId":"<owner>","status":"todo",…}'`). The assignment wakes the owner and the change-review flow runs there (ITA-287). |
| Agent shows `running` but no Pi process exists; new wakes come back `skipped`; issues hold `executionRunId` with no run log | `pgrep -af pi` empty; `agent get` `lastHeartbeatAt` minutes old; `issue get` shows `executionRunId`/`executionLockedAt` set but `run-logs/.../<runId>.ndjson` missing | Seen 2026-10-02 23:52–00:16 on Voice, right after raising it to 3 concurrent runs, while test issues were edited and a monitor fired mid-run. Runs claimed at 00:09 never started. `systemctl restart paperclip.service` (James OK'd) reaped them as `interrupted` / `orphaned_running_run`. The restart also kills runs in progress, which then show `orphaned_running_run`. Cause not pinned. Before restarting, check that no other agent is mid-run, and get James's OK, since it's a live action. |
| Every Result check stalls (not one card) | `diagnostics/wakes` on each owner child: the Reviewer's handoff wake shows `reason: other`, `status: skipped`, `failureClass: failed`, finished within ~20 ms, `runId: null`. Librarian has 0 runs. | Seen 2026-10-02: 14 cards sat `in_review` with no review. The handoff wake is unreliable rather than always broken: ITA-214 and ITA-219 round 1 did start a Reviewer run (`execution_review_requested`). A run that hands off always ends `cancelled`/`issue_reassigned`, which is normal and not a failure. ITA-219's resubmission wake was skipped. **The owner's mention is no cure:** after msp-ops added "`in_review` + Reviewer mention in one update" to every owner (2026-10-02), the test ticket (ITA-235, Halo #70529) got the mention wake as `issue_comment_mentioned` / `deferred_issue_execution`, still unrun 17 min later. The reason is that the stranded-queue sweep (`heartbeat.js` ~13242) needs a previous Reviewer run on that issue, and none existed. Raw skip reason hidden; cause unproven. Waking per card is a live action on real work, so ask James first. |
| Approval answered, nothing happened | `GET /api/issues/{id}/interactions` | Read the card's outcome. A person's comment supersedes a pending card (`superseded_by_comment`); closing the issue expires it (`issue_closed`). Resolved but no run followed → the continuation wake was cancelled. |
| Agent's interaction create returns `{"error":"Internal server error"}` twice; no request line reaches the server journal | run-log tool result shows the 500; the exact same payload via the operator CLI returns 201 | The run-scoped write path (agent key + `x-paperclip-run-id`) fails pre-logging while the payload is valid — proved 2026-10-02 on ITA-192 (70517). Server-side root cause not pinned. Unstick: `issue interaction:create` with the agent's payload, bumping the idempotencyKey suffix, and **no `--comment`, no status flip** — the operator comment expires the fresh card at once when `supersedeOnUserComment` is set (observed: card v3 expired in <1 s; v4 clean). |
| Approval answered, nothing happened | no wake event for the answer | A plain comment on a person-assigned ticket wakes nobody. Only a mention, reassignment, or an interaction configured with continuation can wake an agent; inspect the interaction and current assignee before changing anything. |
| Agents report 3CX `401` on some reads but not others, mid-run | agent comments "API returned HTTP 401"; your own reads succeed | 3CX keeps **one live access token per API client**: minting a new one revokes the old one at once (proved on `mal` 2026-10-01: token A 200 → mint B → A 401, B 200). Before ITAStack `a7f7e25` every `itastack threecx` call minted its own token, so parallel agents revoked each other (8 parallel calls: 1 ok, 7 failed). Since then 3CX clients share a host-wide token in `~/.cache/itastack/oauth/` (0600) and re-mint once on 401 (8/8 ok). If 401s come back, look for another minter outside the host — the Temporal worker container keeps its own token — and never mint test tokens while agents are running. |
| Skill missing from an agent | `GET /api/agents/{id}/skills` → `entries[].state`, `warnings[]` | `pi_local` links skills into a shared Pi skill directory. Re-sync the affected agent set together and verify every agent's resolved catalog afterward. |
| `PAPERCLIP_PI_PROVIDERS contains invalid JSON` in command notes, or cost $0 | run events `commandNotes` | The provider value lost its JSON quoting in `.paperclip.yaml`; it must be a double-quoted JSON string. Fix and apply again (`apply-changes.md`). |
| Model error, 503, `usage_limit_reached` | run `error` | Codex quota behind `gpt-5.6-terra`; fall back per `apply-changes.md` → Switch model. |
| `Configured Pi model is unavailable: openai-codex/…` (works in James's own Pi) | agent `errorReason`; "Available models" lists only `cliproxy*`/`openrouter` | When `PAPERCLIP_PI_PROVIDERS` is set, `pi_local` points `PI_CODING_AGENT_DIR` at a fresh temp dir holding only `models.json` — no `auth.json` (Codex login) and no `models-store.json` (where `gpt-6-*` lives; Pi 0.82.1's built-in list lacks them). Proved 2026-10-01: both files needed for `openai-codex/gpt-6-luna` to list. Use the same model through CLIProxy instead: add it to `company/pi-providers.json` and set `model: cliproxy-openai/<id>` (`apply-changes.md` → Switch model). Never pick an `openai-codex/…` model in the Paperclip UI. |
| `409 Issue run ownership conflict` | a write from a run that does not own the issue | A different run owns the issue. Treat it as a handoff signal, not a retryable failure. |
| `422` entering `blocked` | — | Paperclip needs a real blocker: an open blocker issue, pending interaction, or self-owned `unblockDescriptor`. Use `in_review` for a human decision. |
| `422 Issue can only have one assignee` | — | An issue takes one assignee only; null the other field in the same update (`paperclip-api.md`). |
| `status=open` returns nothing | issue list | There is no `open` status — open = `backlog,todo,in_progress,in_review,blocked` (`paperclip-api.md`). |
| Agent row `status: error` | agent `errorReason` | Not a blocking status: `active`, `idle`, `running` and `error` are all invokable, so wakes still run — only `paused`, `terminated` and `pending_approval` block. The badge means the agent's last run ended in a server-recorded error; it clears itself on the next run that doesn't fail, or immediately via `POST /api/agents/{id}/clear-error` (a live write — ask James first). Read `errorReason`, then that agent's last `heartbeat-runs` row. |
| Run failed with a provider stream error | run `status: failed`, `error`/`stderrExcerpt` "Stream ended without finish_reason" | Pi records any mid-run stream cut as an assistant message with `stopReason: error` and retries; the `pi_local` adapter then marks the whole run failed even if Pi recovered. Confirm from the Pi session file (`sessionIdAfter`) and treat the issue's own `status`/`updatedAt` as the source of truth — a `failed` run may still have finished its ticket. |
| Owner made a change with Training mode on, no `Ready:` child | owner child has a "Completed" comment and no `Ready:` child; its `description` says "make the … change" (2026-10-01, ITA-117) | The Lead's child description told it to make the change and the model took that as permission. Fixed in msp-ops `21f0118`: each owner gate says a description/Lead/ticket instruction "is not that yes", and the `ticket-intake` owner-child template describes the ask only. Retest proved the Ready check opens (ITA-129). |
| A change after James's yes on the same ticket (correction, fix, his follow-up comment) | expected: a `Plan:` child with a "Plan review (Reviewer only)" card, no new `Ready:` card | **James approves once per ticket** (msp-ops `d418f77`, 2026-10-01). Reviewer alone accepts later plans; James sees it again only after the Reviewer's 2nd rejection, for an Approval action, or a login wall; a `LIVE MISMATCH` is fixed via a Reviewer-accepted correction plan. Proved on #70489: James's Yes (ITA-129) → follow-up Urgency comment → `Plan:` ITA-134 rejected once, accepted on rev 2 → write after acceptance, no card for James. |
| Agent comment says it waits on a card; interactions show no pending card | `GET /api/issues/{id}/interactions` all resolved while the closing comment says "waiting on the Reviewer/James" | The card creation failed (next row) and the agent never verified the card exists before ending its heartbeat — the ticket stalls until woken (nothing wakes on a card that doesn't exist). Fixed in msp-ops `0311c96` (2026-10-02): agents now GET interactions to verify the pending card before parking, and on repeated create failure comment "card creation failed — operator attention" instead of a waiting claim. To unstick a stalled one: comment with an `[Agent](agent://<id>)` mention (only a mention wakes — a plain board-user comment does not). |
| `POST /issues/{id}/interactions` returns 500 `{"error":"Internal server error"}` from an agent run; journalctl has no request line for it | replay the exact body from the run log (`tool_execution_start` args) and diff against the journal; response carries `server: openresty` though runs get an Express URL | Not fully pinned. 4/4 failures (2026-10-02, ITA-220/222) were `request_confirmation` cards **without `payload.target`**, during concurrent multi-agent writes; 1/1 success carried `target` bound to the plan revision — perfect content correlation, but the server code path for a missing target returns early (`assertRequestConfirmationTargetIsCurrent`), and the request never appears in the control-plane log, so the throw may live on the agent→API hop. Workaround (now in `ready-check`/`change-review`, msp-ops `0311c96`): always bind `payload.target`, retry the identical POST once (idempotency dedups), then a fresh key. Retrying the identical failed body is safe. |
| Manual wake did nothing | `agent wake <id> --source assignment …` later shows `claimQueuedRun: cancelled stale queued run … issue_assignee_changed` | An assignment-source manual wake can be cancelled stale when the agent is already the assignee. Use the default `--source on_demand` (`agent heartbeat:invoke` also works), or an `agent://` mention comment — a board-user comment on an agent-assigned issue enqueues no wake at all (proved 2026-10-02: POST comments 201, zero wake). |
| Result check fails twice on browser-only work ("cannot independently read … not verified by Reviewer") and goes to James | Reviewer comment says it has no read for the page (Halo Configuration, 3CX console, …) | Fixed 2026-10-02 (msp-ops `83ea209` + follow-up): the Reviewer has a **read-only browser** — the same shared Chrome, with only navigate/reload/snapshot/screenshot/tabs tools (no click, type or upload) — for any agent's browser work in any system. Smoke-tested on ITA-282 (read Halo record 111, Active No). If it comes back, check the Reviewer's `adapterConfig.extraArgs` still has `--extension …/pi-browser/index.ts` and the read-only `--tools` list. |
| James's `Ready` card appears with no "Pre-check (Reviewer only)" card before it | `issue interactions <Ready child>` shows only the Ready card; run log has a `read` of `~/.pi/agent/skills/change-review--<hash>/SKILL.md` → `ENOENT`, then a `find`/glob for `change-review*` with no hits | The owner guessed the skill dir hash, and `find`/glob don't follow the symlinked skill dirs. It concluded the skill was missing and skipped the Pre-check. This is model behaviour, not a missing skill (`ls -d ~/.pi/agent/skills/change-review*` shows the link). Steer: reject the card with a comment asking for the Reviewer Pre-check. |
| Card answered (`accepted`) but the owner never runs again; issue `todo` with an old `executionRunId`; agent `running` with a stale `lastHeartbeatAt` | Pi session's last assistant message is `stopReason: stop`, yet its `pi` process is alive, idle, and holds a socket to `127.0.0.1:9222`; run log mtime frozen | An open CDP websocket kept pi print mode alive. Paperclip only finalizes a run when the child exits (`timeoutSec` default 0). Fixed in msp-ops `0ea7caf`: pi-browser `disconnect()` closes the CDP connection, and shared Chrome stays up. If it comes back: `for p in $(pgrep -x pi); do tr '\0' '\n' </proc/$p/environ \| grep PAPERCLIP_RUN_ID; done`, then kill only that pid (James's OK). Never restart the service for this. |
| Agent says "card resolution FAILED (HTTP 500 twice)" on accept/reject | `sudo journalctl -u paperclip.service` shows `POST …/interactions/<id>/accept 500 — Failed query: select …`; compare `<id>` to the real card id | The agent retyped the card UUID wrong, and Postgres rejects the malformed UUID with a 500. Not a server bug. Fix: an `agent://` mention to the resolver with the exact id and "copy it from `GET …/interactions`". Don't accept the card as operator: that breaks the "Reviewer accepts" audit. Check the journal before blaming the run-scoped write path (row above). |
| Reviewer posts `LIVE MISMATCH` / Result check failed, then nothing happens | owner child `in_progress`, `executionRunId: null`, owner `idle`; the Reviewer's comment has no `[Owner](agent://<id>)` mention; `diagnostics/wakes` empty | A failure comment without a mention wakes nobody. change-review requires the owner mention on Fail/LIVE MISMATCH (msp-ops `f21a6b8`). If it recurs, post an `agent://` mention to the owner that restates the correction. Related: after a failed Result check Paperclip may hand the child to James (`assigneeUserId`), and the owner's `Plan:` child create then fails `delegation_cycle`. Reassign the child to the owner with a raw PATCH (`assigneeAgentId` + `assigneeUserId: null`; the CLI can't null the user), and have it revise the plan on the same issue. |
| Operator mention to wake a resolver, and the pending card goes `expired` | the card's `payload.supersedeOnUserComment: true`; the resolver replies "blocked by expired card" | Plan review, Pre-check and Ready cards set `supersedeOnUserComment`, so any operator comment expires them. **To wake an agent while a card is pending, never comment.** Use `$P agent wake <agent id> --source on_demand --reason "<why>" --payload '{"issueId":"<uuid>"}' $A`. Wait ~5 min first: the Reviewer often picks up a new card on its own. |
| Owner keeps restarting the same long browser plan; each run ends `failed` partway | `GET /api/heartbeat-runs/<id>`: `errorCode: adapter_failed`, `error` "…codex/responses: stream error … PROTOCOL_ERROR" or 503 `auth_unavailable … providers=codex`; next run `wakeReason: transient_failure_retry` | The provider stream is unstable. A CLIProxy `/v1/chat/completions` probe answers between drops. Usual cause is overnight backup load on the hypervisor/network outside this VM. Nothing to fix on our side, so don't chase it (`~/msp-ops/docs/known-limitations.md`). Paperclip retries automatically and each retry restarts the whole plan, so check partial progress with a live read. To stop the retries: `$P agent pause <id>` (holds all of that agent's issues) plus a state comment. Resume in daytime: `$P agent resume <id>`, then `agent wake … --source on_demand`. |
| Browser agent is slow and clumsy in a console: many 10 s timeouts and `strict mode violation … resolved to N elements` | run log `tool_execution_end` errors on `browser_click`/`browser_type`; snapshot lines have no `[ref=eN]`, or errors read `Unexpected token "/" while parsing css selector "aria/…"` | pi-browser's ref contract is broken. Fixed in msp-ops `8ec45de`: snapshots use `ariaSnapshot({mode:'ai'})`, refs resolve as `aria-ref=eN`, a stale ref fails at once with "take a new snapshot", and password/one-time-code values are masked. Test with `cd extensions/pi-browser && npm test` (needs `/usr/bin/google-chrome-stable`). Smoke test against the real console: `pi -p --no-extensions --extension …/pi-browser/index.ts --tools browser_navigate,browser_snapshot,browser_click,browser_type,browser_close --model <non-Codex>` with a read-only "snapshot, click the search box by ref, type" prompt. |
| Every agent's runs fail at once, not mid-run | probe `curl … /v1/chat/completions` with the agent's model returns 503 in <10 ms, body `auth_unavailable … last upstream error: usage_limit_reached` | The Codex usage quota is spent. Every `gpt-*` model behind the Codex login fails together; Claude models through the same proxy still answer. Not a stream drop and not backup load. Wait for the quota to reset, or move agents to a Claude model (`apply-changes.md` → Switch model, James's call). |
| Still `usage_limit_reached` after James used a Codex limit reset | `~/.cli-proxy-api/logs/main.log` has `auth unavailable: … are in cooldown: [provider=codex … reason=credential_quota, remaining=<hours>]` | CLIProxy caches the quota cooldown until the old reset time and never re-checks upstream. Clear it with `systemctl --user restart cliproxyapi.service`, then probe `/v1/chat/completions` with `gpt-5.6-luna`. Proved 2026-10-04: the cooldown said 140 h left, and after the restart the probe answered at once. Then wake any agent whose run failed meanwhile. |
| Every Agent-browser click times out on a site (3CX console) | tool result `locator.click: Timeout … <div class="chrome-extension-menu"></div> intercepts pointer events` | The ITGlue extension's shadow-root popover covers the page. `pi-browser` patch 8 (`UPSTREAM.md`, 2026-10-04) DOM-clicks the exact ref only when that overlay is the interceptor; the extension is never touched. If it returns, check the patch is in `extensions/pi-browser/src/tools/snapshot.ts`. Smoke: one `pi -p` with Voice's `extraArgs` on a read-only console page, run from `/tmp` (from msp-ops the run writes knowledge files). |
| Server secrets in agent transcripts | `toolResult` of `env \| grep PAPERCLIP_` shows `PAPERCLIP_AGENT_JWT_SECRET=`, `PAPERCLIP_TOOL_ACTION_SIGNING_SECRET=`, `DATABASE_URL=` with full values | `adapter-pi-local/dist/server/execute.js` spawns Pi with `{...process.env, ...env}`. Fixed 2026-10-04: every agent's `command` is msp-ops `scripts/pi-run`, an env allowlist, and the OpenRouter key is `{env:OPENROUTER_API_KEY}` in `PAPERCLIP_PI_PROVIDERS` (expanded server-side into models.json), not passed through. If an agent breaks after a Paperclip update, a needed variable is missing from the allowlist: add it there. Check: an issue asking the agent to post `env \| cut -d= -f1` names only. Never print values. |
| Agent hands off a login that actually worked, or says IT Glue "does not offer" a record it does | Run log: `browser_itglue_fill` → "filled", click login, then a `Login:` child while the console is in fact signed in; or "does not offer" on the first call and "filled" on a retry | Timing, both seen on Halo #70615 (2026-10-04). `itglue.ts` now waits up to 10 s for the trigger and the list, and `browser-control` says to wait 3 s and re-snapshot after submitting. To live-test the login path the console must be signed out at run start: use the console's own Log out, confirm it shows `#/login`, and check the 3CX audit log (`ReportAuditLog`, action 18 "Web Client") that no other session signed back in before the agent's run. Keep the test task to "sign in and report the landing page"; a screenshot task adds console-navigation noise. The trace must show `browser_itglue_fill {recordId}`, the submit, a re-snapshot, and no `Login:` child. Proved Halo #70622: one sign-in, no hand-off. |
| Agent hits a login wall on a console that has a named IT Glue record, and hands off anyway | tool result `IT Glue does not offer record <id> on this page` / `No IT Glue trigger on this page` / `Picked record … but no password or code field was filled` | `browser_itglue_fill` (msp-ops `9431d38`) clicks the extension's in-page list row `li.selectable-list-item[data-id=<id>]` under `div.chrome-extension-menu`. "No trigger" means the extension is signed out (12 h limit): James signs it in through Moonlight. "Does not offer" means the record's URL hostname doesn't match the page, or the id in the client notes is wrong. List what is offered with a read-only CDP script that clicks `.itg-chrome-extension-trigger` and prints the rows' `data-id` and text, then presses Escape. Never print field values. An extension update that renames those classes breaks the tool: `npm test` still passes (it uses a fixture), so re-check the live DOM. |
| After resuming a paused agent, its issue stays `blocked` and the wake does nothing | issue `status: blocked`, no `blockedByIssueIds` or `unblockDescriptor`; a system comment "Paperclip cannot safely continue automatic recovery because the original assignee is not invokable … the board must choose the next action" | Pausing an agent makes Paperclip block that agent's in-flight issues. `agent resume` doesn't undo it. Set the issue back with `$P issue update ITA-n --status in_progress $A`, then `agent wake <id> --source on_demand --payload '{"issueId":"<uuid>"}'`. Confirm the issue gets an `executionRunId`. Check every issue the agent held when paused (`issue list --assignee-agent-id`). |

## Hard rules

- **Diagnosis is read-only.** Live changes (instructions, skills, runtime config, cancelling or
  reassigning real work) need James's go-ahead; test tickets you created are the exception.
- **Never print the API key or board token**, and never inline it from `grep` — load it per
  `paperclip-api.md`.
- Under `~/.paperclip/instances/**` read **only** `data/run-logs/`. Never open `config.json`,
  `.env`, backups, or Paperclip's database directly — the API is the way in. Program source
  under the npm install is fine to read.
- **Never cancel or reassign an agent's live run or real ticket** to unstick it without James's
  ok — that is exactly what strands wakes.
- Wait for runs with a backgrounded `sleep`, never a polling loop.

## Calls

```sh
# who is running right now / what an agent's last runs did
curl -sS "${AUTH[@]}" "$API/api/companies/$C/live-runs"
curl -sS "${AUTH[@]}" "$API/api/companies/$C/heartbeat-runs?agentId=<agent id>&limit=20"
curl -sS "${AUTH[@]}" "$API/api/heartbeat-runs/<runId>"          # one run in full
# why a wake did or did not become a run; the issue's pending cards
curl -sS "${AUTH[@]}" "$API/api/issues/ITA-123/diagnostics/wakes"
curl -sS "${AUTH[@]}" "$API/api/issues/ITA-123/interactions"
# agents and their skills
curl -sS "${AUTH[@]}" "$API/api/companies/$C/agents"
curl -sS "${AUTH[@]}" "$API/api/agents/<agent id>/skills"
```

`/api/issues/{issueId}` routes accept the identifier (`ITA-123`) as well as the uuid. Issue-list
filters: `status=` (comma list), `assigneeAgentId=`, `assigneeUserId=`, `labelId=`, `q=`,
`sortField=updated|id`, `sortDir=`, `limit` (default 500, max 1000).

Operator CLI equivalent (options go **after** the subcommand; `-C` is not accepted on
`issue update` or `agent heartbeat:invoke`):

```sh
P=/home/itadmin/.local/bin/paperclipai; A="--api-base http://172.20.0.1:3100"
$P issue list -C e777c451-cb6b-4159-9c0b-3f2d67493601 --match "<halo id>" $A --json | jq -c '.[]|{identifier,title,status,updatedAt}'
$P issue comments ITA-n $A --json | jq -r '.[-1].body'
$P agent list -C e777c451-cb6b-4159-9c0b-3f2d67493601 $A --json
$P issue interactions ITA-n $A --json | jq -c '.[]|{title,status,resolvedByUserId,resolvedByAgentId,resolvedAt}'   # who answered a Ready/Pre-check card
$P issue document:get ITA-n plan $A --json | jq -r .body      # also draft-reply, knowledge
```

Agent ids: Service Desk Lead `c2eef6f8-bbc9-46aa-ac15-0bd279821564`, Dispatcher
`5b6b545b-b909-4d1d-9559-a65021a5aba6`.

Where the facts live: `/home/itadmin/itastack/docs/paperclip.md` and
`/home/itadmin/itastack/wiki/analyses/analysis-session-paperclip-server-install.md` for this
instance, `/home/itadmin/itastack/.kanban/progress.md` → Conventions & Decisions for the
troubleshooting map, `/home/itadmin/msp-ops/AGENTS.md` for the team's own rules.
