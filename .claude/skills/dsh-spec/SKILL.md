---
name: dsh-spec
description: Turn the current conversation into a machine-checkable dsh-spec and put it on the dsh build board — every item carries a survey probe, an acceptance command and scope hints, so an unattended board tick can decide from the repo alone what is already done and what to build next. Use instead of to-spec when the work will be executed by the dsh board automation. USE WHEN the user says "dsh-spec", "spec this for the board", "put this on the build board", or asks to turn the current session into board work.
disable-model-invocation: true
license: MIT
---

# dsh Spec

Turn what this conversation already established into a **spec**, and create the
board card that points at it. Do NOT interview the user from scratch — synthesise
what you both already know, then quiz only where the spec would otherwise guess.

**Write a spec, not tickets.** The spec is the only durable artifact: every
agent-teams run that executes it is disposable, and a re-run re-derives its own
task DAG from the spec plus the current repo state. That only works if the repo
can answer *"what is already done"* — which is why every item carries a runnable
**survey probe**, a runnable **acceptance command**, and **scope hints**.

## Why this is stricter than `to-spec`

`to-spec` writes for a human implementer, so prose can carry the meaning. This
spec is read by an unattended tick at 3am with nobody to ask. Three differences,
all load-bearing:

1. **Every item is machine-checkable.** `survey` / `acceptance` / `scope` are
   mandatory. An item missing any one of them puts the card in `Blocked`.
2. **Commands are `{cwd, argv[]}`, never strings.** The board runs them through
   an allowlisted action in argv form: no shell, no metacharacters, no chaining.
3. **The header's `gate:` is the trust anchor of the whole pipeline.** It is the
   one claim no agent in the loop may weaken, which is exactly why a human
   writes it. Never generate a gate that is easier to pass than the project's
   real regression command.

## Process

### 1. Work from the conversation

Use what has already been discussed. If the user passes a reference (a path, an
issue URL), read its full body. Do not restart the discovery.

### 2. Explore the repo

Read enough to write probes and acceptance commands that name paths and tests
that **actually exist**. Use the project's glossary vocabulary and respect its
ADRs. Look for prefactoring that makes the change easy.

### 3. Draft items

Break the work into items sized to fit one fresh context window. Each item cuts
a narrow but complete path through the layers it touches. Give each its
**blocking edges** — those become agent-teams task `dependencies` verbatim.

### 4. Write the three machine-checkable additions

For every item, all three are mandatory:

- **survey** — one command whose EXIT CODE answers *"is this item already
  done?"* `0` = done, non-zero = not done. Safe to run repeatedly, mutates
  nothing. This is what lets a bounced card skip finished work instead of
  rebuilding it.
- **acceptance** — one command whose exit code `0` proves the item is correctly
  done. Usually a test. May be the same as the survey probe; often stricter.
- **scope** — `writes` (paths this item may change) and `protects` (paths it
  must not touch). These map onto agent-teams `inScope` / `outOfScope`.

And once per spec, in the header:

- **gate** — the project-level regression command, run at Verify **after** every
  per-item acceptance command passes. Per-item commands prove each item works;
  the gate proves the change did not break anything else. Mandatory.

Commands are `{cwd, argv[]}` pairs with no placeholders. `cwd` is relative to
the repo root (`.` for the root itself); an absolute path or one containing `..`
is a spec defect. `argv` is a real argument vector, not a string to be split.

**If a check genuinely needs two commands, the repo provides a script and the
spec names it.** Do not chain with `&&`; it will be rejected.

### 5. Quiz the user

Present the items as a numbered list with title, blocked-by, and what each
delivers. Ask whether the granularity and the blocking edges are right. Iterate
until approved. **Ask about the `gate:` explicitly** — it is the one field the
automation cannot second-guess.

### 6. Verify every command before writing the spec

Every probe and acceptance command is a claim about the repo. **Run each one**
(or at minimum resolve every path it names) before publishing. Record what each
exited with — a survey that already exits `0` means that item is done, which is
worth knowing before the board spends a tick discovering it.

Then run an **independent verify (see `_shared/verify-claims.md`)** on the
spec's load-bearing repo claims, batched into one call.

A spec whose acceptance command names a file that does not exist, and is not
marked `(new)`, blocks the card at Spec.

### 7. Write the spec file and create the card

One file at `docs/specs/<card-id>-<slug>.md` in the target repo. Then create the
board card:

```
kanban_add_card(title: "<spec title>", priority: <high|medium|low>,
                note: "<the Goal paragraph, verbatim>")
kanban_update_card(id: <new card id>, specPath: "docs/specs/<card-id>-<slug>.md")
kanban_get_card(id: <new card id>)          # read back — confirm Spec + specPath
```

Three things that are easy to get wrong, each of which silently produces a card
nobody ever works:

- **Omit `columnId` — do not pass `"Spec"`.** `kanban_add_card` resolves
  `columnId` as a **list id only**, and an unrecognised value does not error: it
  falls back to the first column. Passing `"Spec"` appears to work purely
  because Spec *is* the first column; passing `"Build"` would also land the card
  in Spec, reporting success. Omitting it is the honest way to say "the first
  column", which is where a new card belongs anyway.
- **The board is per workspace, resolved from the session's cwd.** Run this in
  the target project's session, or pass `workspaceId` explicitly. An
  unregistered cwd writes to a separate board of its own and reports success.
- **`specPath` is a separate call.** `kanban_add_card` does not accept it. A
  card without `specPath` is blocked by the Spec tick with *"no spec"* — so read
  the card back and confirm both the column and the path before you stop.

Leave the card **unclaimed** in `Spec`. The first `tick-spec` picks it up by
ordinary survey — do not claim, dispatch, or move it yourself.

## What the board does next, and what it will not do for you

The Spec stage is a **pure validator**. It authors nothing and it repairs
nothing. It checks the spec parses, declares a non-empty `gate:`, has ≥1 item,
and that every item carries `survey` / `acceptance` / `scope` whose commands
resolve to a valid argv.

**A spec failure goes straight to `Blocked`, on the first failure.** There is no
retry ladder, deliberately: nothing between two ticks edits the spec except the
user, so re-validating an unchanged file fails identically and burns a tick each
lap. A `Blocked` card names the offending item and waits for a human.

That is the practical reason to spend the extra minute on step 6. A malformed
spec does not get fixed overnight — it sits.

<spec-template>

# <card-id> — <Spec title>

**Goal:** one paragraph, from the user's perspective, of what is true when this
spec is fully delivered.

**Repo:** <absolute path>   **Branch:** auto/<card-id>

```yaml
gate:
  cwd:  <dir relative to repo root; "." for the root itself>
  argv: [<executable>, <arg>, <arg>]   # exit 0 required to leave Verify
```

## Items

### 1. <Item title>

**Delivers:** the end-to-end behaviour this item makes work.

**Blocked by:** item numbers, or "none".

```yaml
survey:                       # exit 0 means already done
  cwd:  <dir relative to repo root>
  argv: [<executable>, <arg>]
acceptance:                   # exit 0 means correctly done
  cwd:  <dir relative to repo root>
  argv: [<executable>, <arg>]
scope:
  writes:   [<paths this item may change>]
  protects: [<paths this item must not touch>]
```

**Notes:** anything the implementer genuinely cannot infer from the repo. Keep
it short; the repo is the reference, this is not.

</spec-template>

## Worked example

Header — note the `cwd`: this project is not at the repo root, which is exactly
the case a bare one-line command could not express.

```yaml
gate:
  cwd:  automation/homelab-stack
  argv: [uv, run, pytest, -q]
```

### 3. Dedup repeat operator notifications inside a 10-minute window

**Delivers:** when the same alert fingerprint fires twice within ten minutes,
the operator receives one notification, not two, and the suppressed one is
recorded in the dedup ledger.

**Blocked by:** item 1 (notification ledger table).

```yaml
# The old one-line survey was `test -f … && grep -q …` — two commands chained,
# which the trust boundary forbids. Under {cwd, argv} it becomes one probe.
survey:
  cwd:  automation/homelab-stack
  argv: [grep, -q, DEDUP_WINDOW_MS, src/notify/dedup.py]
acceptance:
  cwd:  automation/homelab-stack
  argv: [uv, run, pytest, tests/notify/test_dedup.py, -q]
scope:
  writes:   [src/notify/dedup.py, src/notify/dispatch.py, tests/notify/test_dedup.py]
  protects: [src/notify/transport/, alembic/versions/]
```

**Notes:** the ledger's timestamp column is milliseconds since epoch
(`notify_ledger.fired_at_ms`); compare in the same unit rather than widening the
window.

## Anti-patterns

- **A weak `gate:`.** `[true]`, `[echo, ok]`, or a single fast test standing in
  for the suite. The gate is the only thing catching "every item passed and the
  project is broken anyway". If the project has no regression command, say so
  and stop — do not invent a permissive one.
- **A survey that mutates.** It runs on every re-derivation. `grep`, `test`,
  `git rev-parse` are fine; anything that writes is not.
- **A survey that cannot fail.** `[test, -d, src]` is true forever and tells the
  board nothing. Probe the specific thing the item delivers.
- **Shell syntax in `argv`.** No `&&`, `|`, `>`, globs or quotes-to-be-split. If
  you need them, the repo needs a script.
- **Paths that do not exist yet** and are not marked `(new)`. This blocks the
  card at Spec.
- **Items sized larger than one context window.** Split them; the whole design
  assumes an item fits one fresh run.
- **Creating the card claimed, dispatched, or in a later column.** The tick owns
  card movement. The skill's job ends at an unclaimed card in `Spec` with
  `specPath` set.
