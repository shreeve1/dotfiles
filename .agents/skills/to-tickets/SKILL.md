---
name: to-tickets
description: Break a plan, spec, or the current conversation into a set of tracer-bullet tickets, each declaring its blocking edges, published to the configured tracker — edges as text in one file per ticket locally, or native blocking links on a real tracker.
disable-model-invocation: true
---

# To Tickets

Break a plan, spec, or conversation into a set of **tickets** — tracer-bullet vertical slices, each declaring the tickets that **block** it.

The issue tracker and triage label vocabulary should have been provided to you — run `/setup-matt-pocock-skills` if not.

## Process

### 1. Gather context

Work from whatever is already in the conversation context. If the user passes a reference (a spec path, an issue number or URL) as an argument, fetch it and read its full body and comments. On a local `.kanban/` board a reference may be a spec slug or path (`my-spec` → `.kanban/specs/my-spec.md`); remember the slug, because every ticket made from that spec carries `spec: <slug>`. If the work came from a spec but you were not given its slug, ask which spec it belongs to — do not invent one.

### 2. Explore the codebase (optional)

If you have not already explored the codebase, do so to understand the current state of the code. Ticket titles and descriptions should use the project's domain glossary vocabulary, and respect ADRs in the area you're touching.

Look for opportunities to prefactor the code to make the implementation easier. "Make the change easy, then make the easy change."

### 3. Draft vertical slices

Break the work into **tracer bullet** tickets.

<vertical-slice-rules>

- Each slice cuts a narrow but COMPLETE path through every layer (schema, API, UI, tests) — vertical, NOT a horizontal slice of one layer
- A completed slice is demoable or verifiable on its own
- Each slice is sized to fit in a single fresh context window
- Any prefactoring should be done first

</vertical-slice-rules>

Give each ticket its **blocking edges** — the other tickets that must complete before it can start. A ticket with no blockers can start immediately. At this stage refer to tickets by their position in your list; real ids are allocated when you publish.

**Wide refactors are the exception to vertical slicing.** A **wide refactor** is one mechanical change — rename a column, retype a shared symbol — whose **blast radius** fans across the whole codebase, so a single edit breaks thousands of call sites at once and no vertical slice can land green. Don't force it into a tracer bullet; sequence it as **expand–contract**. First expand: add the new form beside the old so nothing breaks. Then migrate the call sites over in batches sized by blast radius (per package, per directory), each batch its own ticket blocked by the expand, keeping CI green batch to batch because the old form still exists. Finally contract: delete the old form once no caller remains, in a ticket blocked by every migrate batch. When even the batches can't stay green alone, keep the sequence but let them share an integration branch that all block a final integrate-and-verify ticket — green is promised only there.

### 4. Quiz the user

Present the proposed breakdown as a numbered list. For each ticket, show:

- **Title**: short descriptive name
- **Blocked by**: which other tickets (if any) must complete first
- **What it delivers**: the end-to-end behaviour this ticket makes work

Ask the user:

- Does the granularity feel right? (too coarse / too fine)
- Are the blocking edges correct — does each ticket only depend on tickets that genuinely gate it?
- Should any tickets be merged or split further?

Iterate until the user approves the breakdown.

### 5. Verify each ticket before publishing

Each ticket rests on repo claims: the prefactor it assumes, the seam it cuts, the blocking edges ("this genuinely can't start until #3 lands"), the prior-art its verification command points at. Those claims drift as you slice. Before you publish, extract each ticket's load-bearing repo claims and run an **independent verify (see `../_shared/verify-claims.md`)** — batch all tickets' claims into one call. Pay special attention to blocking edges (a wrong edge stalls the frontier) and to any verification command you wrote (it must name a path/test that actually exists). Correct any FALSE claim before publishing.

**Optional scopes pass (local kanban board only).** After claims verification, estimate each ticket's write set from the codebase exploration already done in step 2. Record it as the `files:` frontmatter list (path prefixes, e.g. `[src/auth/, tests/auth/]`) when publishing to a local kanban board. Where two tickets' scopes overlap, note the overlap — the board-mode scheduler serialises overlapping tickets into separate waves instead of running them in parallel. Scopes are advisory for scheduling, but a lane that touches paths **outside** its declared `files:` is bounced at landing, so list every directory the ticket really needs (tests included) or omit `files:`. Omitting it entirely remains valid (tickets without scopes schedule by `blocked_by` alone). Body prose stays free of file paths — `files:` is a machine-read frontmatter field for the parallel scheduler, not an inline prose reference.

### 6. Publish the tickets to the configured tracker

Publish the verified, approved tickets. **How** depends on the tracker `/setup-matt-pocock-skills` configured — the tickets are the same either way, only the shape of the blocking edges changes:

- **Local `.kanban/` board** → write one file per ticket at `.kanban/issues/<NNN>-<slug>.md`, in dependency order (blockers first), using the local ticket template below — one ticket per file, never a single combined file. Create `.kanban/issues` if it does not exist.
  - **Ids are global.** Allocate each id as the highest id found in `.kanban/issues/` **and** `.kanban/archive/` (recursively) plus one, then the next, and so on. Never restart at 01 and never reuse an archived id: commits reference tickets as `(#N)`, so an id must name exactly one ticket forever. A ticket's `blocked_by` lists the real ids of its blockers, which already exist because blockers are written first.
  - **Labels.** Tickets are agent-grabbable by construction, so each gets `labels: [ready-for-agent]` (a ticket the user wants to hold back gets `needs-triage` or `ready-for-human` instead). Keep exactly one state label per ticket.
  - **Spec.** If the tickets came from a spec, set `spec: <slug>` on every one and add the `## Spec` pointer to the body (see the template); otherwise omit both. The spec is where the problem, the decisions already made and the Out of Scope list live: the worker and its reviewer read it, so the pointer is what stops a slice drifting from it.
  - **Session.** Set `session: <host>:<id>` from `$PI_SESSION_ID` and `hostname` when the variable is set, and omit the line when it is not. It is a breadcrumb for a human asking "where was this decided?" on another machine; workers never read it.
  - **After writing**, run `board.sh --board .kanban validate` (the `kanban` skill directory) and fix every `ERROR` before telling the user the tickets are published. Then tell them how to run the work: `tralph --spec <slug>` (or `tralph` for the whole board).
- **A real issue tracker (GitHub, Linear, …)** → publish one issue per ticket in dependency order (blockers first) so each ticket's blocking edges can reference real identifiers. Use the platform's native blocking / sub-issue relationship where it has one; otherwise set each ticket's "Blocked by" to the blocking issues. Apply the `ready-for-agent` triage label unless instructed otherwise — the tickets are agent-grabbable by construction.

Use the label strings from `docs/agents/triage-labels.md` wherever this skill says `ready-for-agent`.

Work the **frontier**: any ticket whose blockers are all done. For a purely linear chain that means top to bottom. On a local board, `board.sh eligible` lists exactly the tickets that may run now.

Do NOT close or modify any parent issue.

<local-ticket-template>

```markdown
---
id: <next global id>
title: <Ticket title>
status: pending
labels: [ready-for-agent]
blocked_by: []
parent: null
spec: <spec-slug>
session: <host>:<session id>
priority: 0
files: [<path prefix>, <path prefix>]
created: <today, YYYY-MM-DD>
---

## Spec

`.kanban/specs/<spec-slug>.md`: read it before building. This ticket is one slice of it.

## What to build

The end-to-end behaviour this ticket makes work, from the user's perspective — not a layer-by-layer implementation list.

## Acceptance criteria

- [ ] Acceptance criterion 1
- [ ] Acceptance criterion 2

## Verification

`one repo-correct command that proves the ticket is done`
```

Frontmatter rules: it ends at the closing `---` or the first blank line, so keep it contiguous. `blocked_by` is a list of ticket **ids** (`[61, 62]`, or `[]` for none). Omit `spec:` (and the `## Spec` section) when there is no spec, omit `session:` when there is no session id, and omit `files:` when the scope is unknown. Do not add `updated`, `actor` or `previous_status` — the loop sets those. The full schema is in the `kanban` skill.

The `## Verification` section is exactly **one** command in single backticks. `gralph` reads the ticket's verification from that one line and rejects zero or several, so chain steps inside the command with `&&` (the "chain with the word and" convention below is for the GitHub flow only). It must name a path or test that actually exists (step 5).

</local-ticket-template>

<issue-template>

## Parent

A reference to the parent issue on the tracker (if the source was an existing issue, otherwise omit this section).

## What to build

The end-to-end behaviour this ticket makes work, from the user's perspective — not layer-by-layer implementation.

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2

## Verification

A single repo-correct runnable command that proves the ticket is done - not
prose. Wrap it in single backticks inline (e.g. `uv run pytest
path/to/test_thing.py -q`); chain multiple with the word and between inline
commands. Do NOT use a fenced code block - only inline single-backtick
commands are picked up by Symphony's auto-land gate (ADR-0042). Scope it to
the ticket's own tests for an additive slice; use the full suite when the
change is cross-cutting. Omit only when the ticket genuinely has no runnable
check.

## Blocked by

- A reference to each blocking ticket, or "None — can start immediately".

## Files (optional)

Advisory write-set for the board-mode parallel scheduler. List path prefixes
separated by commas, e.g. `src/auth/, tests/auth/`. Omit when the scope is
unknown or cross-cutting. A wrong scope costs parallelism, never correctness.
Do not duplicate this information in the ticket body prose.

</issue-template>

In either form, avoid specific file paths or code snippets — they go stale fast. The one exception is the `## Spec` pointer: a spec path is stable and the worker needs it. Exception: if a prototype produced a snippet that encodes a decision more precisely than prose can (state machine, reducer, schema, type shape), inline it and note briefly that it came from a prototype. Trim to the decision-rich parts — not a working demo, just the important bits.

Work the frontier one ticket at a time with `/implement`, clearing context between tickets — or, on a local board, hand the whole spec to the loop with `tralph --spec <slug>`.
