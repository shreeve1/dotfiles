---
name: independent-review
description: Independent review by fresh-context subagents on a different model family, to find gaps in finished or planned work. Use when the user asks for an independent review, a gap check, a second opinion from a subagent, "look for any gaps", or adds "quick" for a single fast reviewer, or "eval" to judge a tool or approach without the current setup.
---

# Independent Review

Use a **different model family from yours** for each reviewer, each attacking the work from one lens. The deliverable is a synthesized verdict; the user decides what to fix. The default transport uses read-only subagents. Explicit herdr mode uses fresh reviewer tabs with writes restricted to assigned review artifacts, never the reviewed checkout.

Reviewers get the intent and a way to read the change, not your reasoning. Same-model reviewers share your blind spots, so Step 3 forces a different family.

## Quick mode

When the user says "quick" (or "fast"), run one reviewer on a fast model. Steps 1, 3's single-subagent call, Step 5 and the verdict format still apply; what shrinks is the lens set, the read, and the output.

- **Lens:** `Quick` in `references/lenses.md`: the Gaps questions with the Skeptic correctness questions folded in.
- **Model:** the first of `cliproxy/gpt-6-luna`, `cliproxy/glm-5.3-flash`, `cliproxy/minimax-m3`, `cliproxy/deepseek-v4.1-flash` that is not your own model. Step 2's fallback and unknown-id rules apply; if the row runs out, say the review is degraded.
- **Read:** the change and its direct callers. Skip the wider sweep of tests, docs and config.
- **Findings:** at most five, high and medium only.
- **Judgment:** verify each high finding against the code; triage the mediums. Skip the cross-reviewer deduplication pass.

Quick mode has no Architect or Minimalist lens: expect it to miss design-level findings and "this is more than the goal needs". Say so in one line of the verdict.

## Eval mode

When the user says "eval" (or "evaluate"), run one reviewer that judges a candidate (a tool, product, method or design) against the user's goal with no knowledge of what they run today. The point is a view free of the incumbent's anchor, so the brief is the whole lever. Step 2's model rules, Step 3's single-subagent call and Step 4 still apply; Step 1, Step 5 and the verdict change as below. With "quick" too, eval still runs the review; quick only swaps in its fast model row.

- **Brief:** the goal in outcome terms, the real constraints (team size, platforms, security, budget, integrations that must stay), and where to read the candidate: its URL, its docs, or a clone in a scratch folder such as `/tmp`. Write the goal without naming the tools the user runs now; an incumbent that is a hard requirement becomes a constraint ("must read Halo tickets"), not a product name. Leave out memory, the session's leaning and your own view. If you cannot state the goal without the incumbent, ask the user.
- **Prompt:** the template below with `{LENS}` = Eval, the brief under Intent, and the Eval lens text. Swap its first line for `You are an independent evaluator with the Eval lens. Give a fair, evidence-based judgment; neither sell nor dismiss.` Drop the severity rule; the output is the Fit, Strongest case, Costs and Deciding test sections of the eval verdict.
- **Model:** the first model in Step 2's row for your family, with its fallback rules. Judgment matters more than speed here.
- **Read:** the candidate's own material only: the scratch copy or URLs. Keep the user's working repos out of the brief.
- **Judgment:** set the reviewer's verdict beside the incumbent. Name where its read differs from yours earlier in the session; that gap is the anchor showing. Switching cost goes in once, as its own row. The user decides; offer no fix loop.

Eval verdict:

```text
## Goal
<one paragraph, as briefed>

## Reviewer
<model>

## Fit
Per goal requirement: meets | partly | no, with evidence (doc section, file or URL)

## Strongest case for adopting
<what this candidate does well for this goal>

## Costs and risks
<setup, upkeep, maturity, lock-in, security; with evidence>

## Deciding test
<the smallest trial that would settle it>

## Lead comparison
Candidate vs incumbent per requirement, switching cost as one row, and where the reviewer's view differed from the session's.
```

## Step 1: Scope and intent

Identify what to review from the user's message and the session: uncommitted diff, a branch (`git diff <base>...HEAD`), specific paths, or a plan/proposal.

Write the **intent** in one paragraph: what the author is trying to achieve, drawn from the user's ask, the plan, and commit messages. Reviewers judge whether the work achieves the intent well, not whether the intent is right. If you cannot state the intent, ask the user before continuing.

Size the change and pick lenses (definitions in `references/lenses.md`):

| Size | Threshold | Lenses |
| --- | --- | --- |
| Small | < 50 lines, 1-2 files | Gaps |
| Medium | 50-200 lines, 3-5 files | Gaps + Skeptic |
| Large | 200+ lines or 5+ files | Gaps + Skeptic + Architect + Minimalist |

Gaps is always included. It is the lens behind "did we miss anything".

## Step 2: Pick reviewer models

Check your own model (`PI_MODEL`) and give each lens a model from a different family. Spread lenses across different models when more than one is available.

Never select Claude/Anthropic models, including explicit requests, quick/eval mode,
herdr tabs, unknown-id recovery and provider-error fallbacks. Filter every candidate
against the author families before launch. Sol, Terra and Luna are all GPT, not
independent families. Quick mode must also exclude the author family, not just the
exact author model. If no eligible model remains, report the lens as not reviewed.

| You are | Reviewer models |
| --- | --- |
| Claude | `cliproxy/gpt-6.1-sol`, `cliproxy/gpt-6-luna`, `cliproxy/minimax-m3`, `cliproxy/glm-5.3` |
| GPT | `cliproxy/minimax-m3`, `cliproxy/glm-5.3`, `cliproxy/deepseek-v4.1-flash` |
| Anything else | `cliproxy/gpt-6.1-sol`, `cliproxy/gpt-6.1-terra`, `cliproxy/gpt-6-luna`, `cliproxy/minimax-m3`, `cliproxy/glm-5.3` |

Each row is an ordered fallback list. If a reviewer fails with a **quota, rate-limit (429), or provider error**, re-run that same lens on the next model in the row automatically — do not ask the user. If the row is exhausted, mark the lens **not reviewed** in the verdict, naming each model tried and its error, and base the verdict on the remaining lenses.

If a model id is unknown to the harness (an "unknown model" or not-listed error at launch, before any request is sent), run `subagent({ action: "models" })`, pick the closest id from another family, and say so in the verdict. Never fall back to your own family silently; if no other family works, tell the user the review is degraded.

## Step 3: Spawn reviewers

**Default: subagents.** Only an explicit request for herdr reviewer tabs, or an
approved `herdr-fanout` commission, selects [herdr mode](references/herdr.md).
For that mode, follow the reference instead of the launch instructions below;
then resume Steps 4–5 and this skill's verdict. Never launch both transports.

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

```text
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

```text
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

Quick mode drops **What Went Well** and reports only high and medium findings.

Standalone review ends by offering to fix accepted findings and waiting for the
user's go-ahead. A commissioning `herdr-fanout` parent owns its already-approved
in-scope fix cycle; this review does not start a second loop or widen that authority.
