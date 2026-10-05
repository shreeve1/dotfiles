# Live test ticket through Paperclip

Reference for the change loop in `SKILL.md`. Not a skill on its own.

Run from `/home/itadmin/itastack`. Credentialed Halo calls:
`./scripts/sops-run.sh .venv/bin/python -c "from itastack.core.config import ITAStackConfig; from itastack.halo import HaloClient; c=HaloClient(ITAStackConfig.from_env().halo); ..."`.
HaloClient paths have **no `/api` prefix** (`/Tickets/<id>`; `/api/Tickets` returns 404).

## 0. Before you start

- Write down what you expect the change to do, as checks you can tick (e.g. "no email",
  "assigned to JP", "slot next business day before 16:00 PT").
- Check the time: `TZ=America/Los_Angeles date`. Email goes out only Mon–Fri before 17:00 PT;
  techs are booked 08:00–16:00 PT (after 16:00 → next business day). After hours you can test
  everything except a sent email.
- Background your waits (`sleep N`) at ≤300 s — the hub kills longer commands at the 300 s cap;
  chain several short waits instead of one long one.
- Make sure the change is live (`apply-changes.md`).
- **Test mode must be on** (ADR 0021; James flips it, a session never does):
  `docker exec itastack-temporal-worker python -m itastack.agents.dispatch_checks test-mode status`.
  While on, no Halo ticket gets a Paperclip card automatically and none is created when it goes
  off. If it is off, ask James to turn it on before creating any Halo test ticket.
- **Ticket run budget:** each Area owner 4 runs (Owner's call or Briefed) or 8 (Shared change);
  the ticket 3 for the Lead + 5 per Owner's-call owner + 11 per Shared-change owner. You own the
  spend of every test ticket you create (section 2 → Watch the run budget).

## 1. Create the Halo test ticket

```python
c.post('Tickets', json=[{'summary': ..., 'details': ..., 'client_id': 12, 'site_id': 262,
  'user_id': 127, 'tickettype_id': 1, 'category_1': 'Email>Outlook', 'impact': 3, 'urgency': 3}])
```

- `category_1`, `impact` and `urgency` are required (HTTP 400 otherwise).
- End user James (user 127, client 12, site 262) so any email reaches only James. To test a
  sender type, reuse a placeholder user: Client Alerts 3611, noreply@3cx.net 3627.
- Mallory (client 156) safe requester: user `2023` "Albuquerque Shipping" — email null (machine
  mailbox, no client-facing email; dispatch update-email skips). All other 156 users are real
  client people; never use them as a test sender.
- **Leave it unassigned** (no `agent_id`) so the Lead dispatches it. Halo tickets are never
  assigned at creation; `agent_id` 1 means Unassigned (API user Nathan).
- A ticket the Dispatcher should ignore: `agent_id: 14` plus `_forcereassign: True` (busy
  calendar → 400 without it).
- Temporal auto-closes RMM "Server-OAM … Unresponsive" alerts and some 3CX notices on creation
  (status 9, step 6) — that is itself a result.
- Record every id you create (ticket, appointment, ITA-n) — you delete them all at the end.
- **Write it like a real request.** No "TEST", "please ignore" or "model change" in summary or
  details — the Lead declines those as no real work (ITA-119, 2026-10-01). Track it by id.
- Halo may refuse `DELETE Tickets/<id>` on a fresh ticket (401 "restricted"); close it with
  status 9 per Cleanup. `paperclipai issue delete` needs `--yes`.

## 2. Create the Paperclip Ticket issue — by hand, only if the test needs Paperclip

With Test mode on, Temporal creates no card. Many Halo tests (Temporal triage, Jev, Slack alert,
webhooks) need no Paperclip at all — then skip this step. When the test does need the agents:

```sh
paperclipai issue create -C e777c451-cb6b-4159-9c0b-3f2d67493601 --title "halo ticket <id>" \
  --description "halo ticket <id>" --status todo --priority medium \
  --assignee-agent-id c2eef6f8-bbc9-46aa-ac15-0bd279821564 --api-base http://172.20.0.1:3100 --json
```

The Lead retitles it `Halo #<id>: <summary>` within a minute, so find it later with
`issue list --match <id>`, not `--match "halo ticket <id>"`. The Lead opens children (e.g.
`Dispatch — Halo #<id>`, an area/owner child) within ~2 min; the Dispatcher finishes in ~5–8 min.

**Dispatcher-only test (Slack approval card), 2026-10-04, Halo #70619:** skip the Lead and the owner fan-out.
Create the root **unassigned** (just the watcher anchor), then one child
`Dispatch — Halo #<id>` assigned to the Dispatcher with the Lead's `executionPolicy` (Librarian review stage,
`ticket-intake` skill), write the root id to `jev_log.paperclip_issue_id`, and start
`SlackApprovalWatcherWorkflow` with args `[<id>, "C0B55R3031C", <alert ts>, false]`, id
`slack-approvals-<id>`, queue `itastack-default` (from inside `itastack-temporal-worker`). Do not call
`ensure_paperclip_card`. Since option A (Ready card on the Dispatch card itself, no `Ready:` child, no
Pre-check) a plan + one No + one Yes took exactly 3 Dispatcher runs.

### Watch the run budget (every wait)

After every backgrounded wait, count the Ticket issue's runs before doing anything else:

```sh
P=/home/itadmin/.local/bin/paperclipai; A="--api-base http://172.20.0.1:3100"
for i in $($P issue list -C e777c451-cb6b-4159-9c0b-3f2d67493601 --match <id> $A --json | jq -r '.[].id'); do
  curl -sS "${AUTH[@]}" "$API/api/issues/$i/runs"; done | jq -s 'add | unique_by(.runId) | group_by(.agentId) | map({agentId: .[0].agentId, runs: length})'
```

Over budget (an Area owner over 4, or over 8 once it has a Pre-check card or `Plan:`/`Result:`
child; or the ticket over its total): stop. Cancel the test's issues
(`issue update ITA-n --status cancelled`, children first — they are your own test issues), then
find the cause from each run's `contextSnapshot.wakeReason` (`SKILL.md` → Diagnose step 3).
Fix your own test behaviour yourself; bring any change to an agent's instructions to James as a
ready-to-apply proposal with the run evidence. Never pause an agent: that freezes real work.

### Steer without extra runs

- Steer only through the card's reject reason. A follow-up comment is a second full run.
- Never post an "audit note" or FYI comment on an agent's issue; put it in your report to James.
- Every comment on an agent-assigned issue, and every `agent://` mention, can start a run.

## 3. Observe — check what the change touches

Paperclip:
- `issue list --match "<id>"`: expected children exist; parent Ticket issue `blocked` is by
  design; children `in_review` when done.
- Each child's closing comment (`issue comments ITA-n --json | jq -r '.[-1].body'`) — it states
  skip reasons and decisions.
- Run log for *why* (see `SKILL.md` → Diagnose step 3).

Halo:
- Ticket fields: `agent_id`, `workflow_step` (8 when dispatched), `status_id` (27 Scheduled,
  42 if unbooked), `category_1`, `urgency`, `impact`, `priority_id`.
- `/Actions?ticket_id=` order. Dispatch flow: Triage → Re-Assign → Dispatch → Appointment Added
  (exactly once) → Email User (last, only if eligible).
- `/Appointment?ticket_id=`: exactly one. The list misreports `user_id`; check raw
  `GET /Appointment/<id>`: `user_id -1`, no attendees, `invitesent 0`.
- Email body: `GET /Actions/<id>?ticket_id=<t>` → `emailto`, `email_status` (2 = sent),
  `note_html`. Delivered copy: `M365Client(cfg.m365_tenants['ita'])`
  `/users/james@itassurance.com/messages` with `$search="<7-digit id>"`.
- Links in emails: the omp browser relay may be down and headless Chrome hangs on the Halo
  portal — ask James to click and screenshot.

Report expected vs actual per check, then adjust and re-test.

### Slack approvals (ADR 0019)

Only tickets whose Halo `user_id` is in `ITASTACK_SLACK_APPROVALS_ALLOW_USER_IDS` take the new path (sandbox
test: user 127 → channel `C0B55R3031C`). Checks:
- The lifecycle result `new_ticket_alert` has `approvals: true` and a `ts`, `slack_approval_watcher.started:
  true`, and the workflow `slack-approvals-<id>` is Running.
- The alert is from the **ITA Approvals** bot (`U0C6600K86M`): title, summary, description with no signature or
  quoted chain.
- There is one thread reply per pending `human_only` Ready/Approve card, with buttons. The Reviewer Pre-check
  gets no reply.
- A typed thread reply changes nothing. A button click → card `accepted`/`rejected`, then a comment
  `Slack approval record: … by <name> (<U…>)` after `resolvedAt`, the reply edited with no buttons, and one
  `slack_approval` line in `docker logs itastack-temporal-webhook`.
- The audit comment must not make the agent ask again.
- A Ticket the Dispatcher judges a duplicate gets no Ready card → no thread reply (Halo #70497). Pick a clearly
  new issue to exercise the buttons.
- Read Slack with `conversations.replies` using `SLACK_BOT_TOKEN` (`@automation`). The ITA Approvals bot has no
  `channels:history`.

### Struggle review (every test)

Before reporting, run `python3 ~/.agents/skills/paperclip-troubleshoot/struggle.py --since <test start
UTC>` (`SKILL.md` → Struggle review). Report each streak of 2+ flagged requests with what the agent
was looking for and the fix you propose. A test passes only when no streak comes from a gap in our
instructions.

## 4. Cleanup (always, for everything the test created)

```python
c.delete('Appointment/<appt id>')       # each test appointment
c.delete('Tickets/<ticket id>')         # each test ticket
```

If a ticket delete is refused, close it instead with
`c.post('Tickets', json=[{'id': t, 'status_id': 9}])` (status 9 sends no client email) and tell
James which ones are closed-not-deleted.

Paperclip: delete the Ticket issue and every child
(`paperclipai issue delete <ITA-n> --api-base http://172.20.0.1:3100`); if delete is refused,
`issue update ITA-n --status cancelled --api-base ...` (stops the Reviewer stalling on it).

Then confirm nothing is left: `issue list --match "<id>"` and `GET /Appointment?ticket_id=<id>`.

Slack approvals: terminate any still-running `slack-approvals-<id>` workflow
(`docker exec itastack-temporal temporal workflow terminate --namespace itastack -w slack-approvals-<id>
--reason "test cleanup"`), then delete the bot's sandbox messages, replies first, using
`SLACK_APPROVALS_BOT_TOKEN` `chat.delete` (a bot can delete its own messages).
Only delete what this test created — never real tickets or James's real appointments.
Never delete Slack messages by text match on a ticket-number range (e.g. `7061[4-7]`): on 2026-10-04 that
deleted the live alert for #70615, another session's ticket, and left its watcher pointing at the deleted
`ts`. Delete only the parent `ts` values this test recorded.

## Halo gotchas

- `$-APPOINTMENTBOOKING` does not expand in API-sent Email User bodies; use the ticket's
  `bookingurl` prefixed with `https://itassurance.halopsa.com/portal`.
- `appointments.create` with `user_id` unset gets the ticket's end user filled in by Halo; send
  `user_id: -1` explicitly and verify with the raw GET.
- Workflow 1: outcome 1 Triage (step 1→2, status 24), outcome 2 Dispatch (step 2→8, status 42).
  Field edits alone don't advance the step.
- Template slips seen: "on tomorrow" (the day placeholder carries its own lead-in).
- Don't classify tickets by current `agent_id`; use who opened it (first action's `who`).
- Scheduled ticket rules have **no API** (`/ScheduledTickets`, `/ScheduledTicketRules`, `/ScheduleRules`,
  `/Rules` all 404; `/TaskSchedule` is not the record). They live only at
  `https://itassurance.halopsa.com/config/tickets/scheduling?id=<record id>` — a Halo Admin browser task.
  A disabled rule still *displays* its old next-creation date. Proved 2026-10-02: Halo Admin traced
  ticket 70467 to record 111 and set Active No; the Reviewer confirmed it with its read-only browser.

## History replay (for rule changes with wide reach)

Before or alongside a live test, replay the rule over recent real tickets (read-only):
- `c.get('/Tickets', params={'count':100,'page_no':N,'pageinate':'true','page_size':100,'order':'id','orderdesc':'true'})`.
  The list has no end-user email; fetch `/Tickets/<id>` per ticket (~1 s each, run async, dump
  to /tmp JSON).
- Apply the current rules (re-read them from msp-ops each time) and bucket the tickets; list the
  risky shapes (`Re:`/`FW:` follow-ups, auto-replies/bounces, reports from real contacts,
  voicemail under the "IT Assurance" placeholder).
- Clone the risky shapes as live test tickets (steps 1–4).
