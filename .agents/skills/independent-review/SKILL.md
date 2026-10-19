---
name: independent-review
description: Independent review by fresh-context subagents on a different model family, to find gaps in finished or planned work. Use when the user asks for an independent review, a gap check, a second opinion from a subagent, or "look for any gaps".
---

# Independent Review

Spawn read-only reviewer subagents on a **different model family from yours**, each attacking the work from one lens. The deliverable is a synthesized verdict. Do NOT change anything; the user decides what to fix.

Reviewers get the intent and a way to read the change, not your reasoning. Same-model reviewers share your blind spots, so Step 3 forces a different family.

## Step 1: Scope and intent

Identify what to review from the user's message and the session: uncommitted diff, a branch (`git diff <base>...HEAD`), specific paths, or a plan/proposal.

Write the **intent** in one paragraph: what the author is trying to achieve, drawn from the user's ask, the plan, and commit messages. Reviewers judge whether the work achieves the intent well, not whether the intent is right. If you cannot state the intent, ask the user before continuing.

Size the change and pick lenses (definitions in `references/lenses.md`):

| Size | Threshold | Lenses |
|------|-----------|--------|
| Small | < 50 lines, 1-2 files | Gaps |
| Medium | 50-200 lines, 3-5 files | Gaps + Skeptic |
| Large | 200+ lines or 5+ files | Gaps + Skeptic + Architect + Minimalist |

Gaps is always included. It is the lens behind "did we miss anything".

## Step 2: Pick reviewer models

Check your own model (`PI_MODEL`) and give each lens a model from a different family. Spread lenses across different models when more than one is available.

| You are | Reviewer models |
|---------|-----------------|
| Claude | `cliproxy/gpt-6.1-sol`, `cliproxy/gpt-6-luna`, `cliproxy/minimax-m3.1-flash`, `cliproxy/glm-5.3` |
| GPT | `cliproxy/claude-opus-5-5`, `cliproxy/minimax-m3.1-flash`, `cliproxy/glm-5.3` |
| Anything else | `cliproxy/claude-opus-5-5`, `cliproxy/gpt-6.1-sol` |

Each row is an ordered fallback list. If a reviewer fails with a **quota, rate-limit (429), or provider error**, re-run that same lens on the next model in the row automatically — do not ask the user. If the row is exhausted, mark the lens **not reviewed** in the verdict, naming each model tried and its error, and base the verdict on the remaining lenses.

If a model id is unknown to the harness (an "unknown model" or not-listed error at launch, before any request is sent), run `subagent({ action: "models" })`, pick the closest id from another family, and say so in the verdict. Never fall back to your own family silently; if no other family works, tell the user the review is degraded.

## Step 3: Spawn reviewers

Make exactly one top-level `subagent` call: write one ```` ```js workflow ```` block in your reply with `async: true`, then call `subagent({ workflow: true, async: true })`. Use the `reviewer` agent for every child, a distinct `model` per child, and `runs.all` so they run in parallel:

```js
const reviews = await runs.all([
  { key: "gaps", agent: "reviewer", model: "<model>", task: "<filled prompt, Gaps lens>" },
  { key: "skeptic", agent: "reviewer", model: "<model>", task: "<filled prompt, Skeptic lens>" },
]);
return reviews.map((r) => r.output).join("\n\n=====\n\n");
```

Build each `task` from the template below. Do not paste a large diff. Give the command to read it (`git diff HEAD`, `git diff <base>...HEAD`, or the file paths) and let the reviewer read the code and its callers.

After launching, end your turn. The completion notification wakes you; do not poll.

### Reviewer prompt template

```
You are an adversarial reviewer with the {LENS} lens. Find real problems; do not validate the work. You are read-only: do not edit, write, or run anything that changes files or state.

## Intent
{INTENT}
Judge whether the work achieves this intent well. Do not question the intent.

## What to review
{HOW_TO_READ_THE_CHANGE}
Read the surrounding code too: callers, callees, types, tests, docs, config. Gaps often live outside the diff.

## Your lens
{LENS_TEXT_FROM_references/lenses.md}

## Rules
- Cite file:line and a concrete failure scenario. Trace the path that makes the problem reachable.
- Separate "this is broken" from "I would have done it differently".
- No praise, no restating what the code does, no hypotheticals without a reachable path.
- Rate each finding: high (blocks ship), medium (should fix), low (worth noting).
- Zero findings is a valid answer. Say "no findings" and stop.

## Output
Numbered list. For each: [severity] title, Location, Finding, Evidence, Suggestion (optional).
```

## Step 4: Verify and synthesize

When results arrive, confirm each reviewer returned non-empty output and record which model ran each lens. Name any failed or empty reviewer in the verdict; do not skip it silently.

Deduplicate overlapping findings. A finding two models raised independently is the strongest signal. A finding where models disagree is worth stating as a disagreement.

## Step 5: Lead judgment

Reviewers saw a slice; you have the session. For each finding, verify it against the actual code before ruling, then mark it **accept** or **reject** with a one-line reason. Call out false positives, style mistaken for substance, and findings that ignore a constraint the reviewers could not see. If every finding is a nit, say the work is probably fine.

## Verdict format

```
## Intent
<one paragraph>

## Reviewers
<lens: model, N findings> per reviewer

## Verdict: PASS | CONTESTED | REJECT
<one-line summary>

## Findings
Numbered, high to low. For each:
- [severity] Description with file:line
- Lens / model that raised it
- Recommendation: a concrete action
- Judgment: accept | reject, with a one-line reason

## What Went Well
<1-3 things no reviewer could fault>
```

- **PASS**: no accepted high-severity findings.
- **CONTESTED**: high-severity findings that reviewers disagree on, or that you rejected over a reviewer's objection.
- **REJECT**: accepted high-severity findings with reviewer consensus.

End by offering to fix the accepted findings. Wait for the user's go-ahead.
