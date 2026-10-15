---
name: to-spec
description: Turn the current conversation into a spec and publish it to the project issue tracker — no interview, just synthesis of what you've already discussed.
disable-model-invocation: true
---

This skill takes the current conversation context and codebase understanding and produces a spec (you may know this document as a PRD). Do NOT interview the user — just synthesize what you already know.

The issue tracker and triage label vocabulary should have been provided to you — run `/setup-matt-pocock-skills` if not.

**Run it in the same session as the grill.** The decisions a grill settles (scope cuts, behaviour, edge cases, the "we are not doing X" calls) live only in that conversation: `CONTEXT.md` holds the glossary and `docs/adr/` only the rare hard-to-reverse choice. If this is a fresh session and the conversation holds no grill or design decisions, do not invent them: say so, and ask the user to either run `/grill-with-docs` first, or paste the decisions, or tell you which grill session it was (the `kanban` skill's "Session breadcrumb" says how to search one for a specific decision; a pasted list is better).

## Process

1. Explore the repo to understand the current state of the codebase, if you haven't already. Use the project's domain glossary vocabulary throughout the spec, and respect any ADRs in the area you're touching.

2. Sketch out the seams at which you're going to test the feature. Existing seams should be preferred to new ones. Use the highest seam possible. If new seams are needed, propose them at the highest point you can. The fewer seams across the codebase, the better - the ideal number is one.

Check with the user that these seams match their expectations.

3. Write the spec using the template below.

4. **Verify the spec before publishing.** A spec asserts a pile of things about the current codebase — what modules exist, what the seams are, what prior art the tests have, what's already wired. Those claims drift as you synthesise. Before you publish, extract every load-bearing repo claim from the draft (Implementation Decisions, Testing Decisions, the seams from step 2) and run an **independent verify (see `../_shared/verify-claims.md`)** on them in one batched call. Correct any that come back FALSE, then publish. A spec that ships a wrong assumption sends every downstream ticket the wrong way.

5. Publish the verified spec to the project issue tracker. How depends on the tracker `/setup-matt-pocock-skills` configured:

   - **GitHub / GitLab / other:** create the spec as an issue and apply the `ready-for-agent` triage label — no need for additional triage.
   - **Local `.kanban/` board:** write the spec to `.kanban/specs/<spec-slug>.md` (see `docs/agents/issue-tracker.md`). Pick a short kebab-case slug (`[a-z0-9][a-z0-9-]*`, not all digits — it doubles as the `tralph --spec` run key, where a bare number means a different thing) that is not already a file in `.kanban/specs/`, and create the directory if needed. A local spec is a document, **not a ticket**: do not put it in `.kanban/issues/` (the loop reads every file there as a runnable ticket) and give it no triage label.

   Then tell the user the spec's location and, for a local board, the slug — it is what ties the work together: `/to-tickets` stamps `spec: <slug>` on every ticket it makes from this spec, and `tralph --spec <slug>` runs exactly those tickets.

<spec-template>

```markdown
---
slug: <spec-slug>
session: <host>:<session id>
created: <today, YYYY-MM-DD>
---
```

Set `session:` from `$PI_SESSION_ID` and the machine's ssh alias when the variable is set; omit the line when it is not. The `kanban` skill's "Session breadcrumb" maps `hostname` to the alias (`n8n` is `itan8n`) and says where transcripts live and how to search one. It names the machine and session where this spec was written, which is normally the grill itself. It is a breadcrumb for a human (or a later session) who needs to recover why something was decided: transcripts are not synced between machines, so look with `ssh <host>`, and search the transcript for the specific decision. Never load a whole transcript into context.

## Problem Statement

The problem that the user is facing, from the user's perspective.

## Solution

The solution to the problem, from the user's perspective.

## User Stories

A LONG, numbered list of user stories. Each user story should be in the format of:

1. As an <actor>, I want a <feature>, so that <benefit>

<user-story-example>
1. As a mobile bank customer, I want to see balance on my accounts, so that I can make better informed decisions about my spending
</user-story-example>

This list of user stories should be extremely extensive and cover all aspects of the feature.

## Implementation Decisions

A list of implementation decisions that were made. This can include:

- The modules that will be built/modified
- The interfaces of those modules that will be modified
- Technical clarifications from the developer
- Architectural decisions
- Schema changes
- API contracts
- Specific interactions

Do NOT include specific file paths or code snippets. They may end up being outdated very quickly.

Exception: if a prototype produced a snippet that encodes a decision more precisely than prose can (state machine, reducer, schema, type shape), inline it within the relevant decision and note briefly that it came from a prototype. Trim to the decision-rich parts — not a working demo, just the important bits.

## Testing Decisions

A list of testing decisions that were made. Include:

- A description of what makes a good test (only test external behavior, not implementation details)
- Which modules will be tested
- Prior art for the tests (i.e. similar types of tests in the codebase)

## Decisions from the grill

Every decision the grill settled that a ticket could contradict, one line each, with the reason: scope cuts, behaviour choices, edge cases resolved, and the things deliberately **not** done. The workers and their reviewers read this file, so a decision that is not written here is a decision they cannot honour. Omit the section only when there was no grill.

## Out of Scope

A description of the things that are out of scope for this spec.

## Further Notes

Any further notes about the feature.

</spec-template>
