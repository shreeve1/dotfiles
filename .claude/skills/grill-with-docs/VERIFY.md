# Explore first, then fact-check

**Order matters. Explore before you check — never the reverse.**

1. **Explore.** Read the actual files this turn depends on yourself. Form your
   claim from what you just read — not from memory, not from an earlier turn's
   reading.
2. **Fact-check.** Only then run the independent `pi -p` check as a *second
   opinion* on the claim you already grounded.
3. **Surface both** to me before the question they feed.

The check is a cross-verifier, not your researcher. If you skip step 1 and fire
the checker first, it becomes your primary lookup — and a single fresh `pi -p`
pass with zero conversation context is a *worse* explorer than you are. Worse,
it can only catch your drift if you actually formed a grounded claim for it to
contradict. No exploration → nothing to verify.

Do this every turn — presenting findings, asking a question, or making a
recommendation — even when the turn feels purely design-level: nearly every
grill question assumes something about what the repo already does, and that
assumption is what drifts.

## What counts as a claim

Anything you'd state as true about the repo:

- Glossary conflicts — "your `CONTEXT.md` defines cancellation as X"
- Cross-references — "your code cancels entire Orders"
- Recommendation justifications — "because the code already uses Postgres here"
- Structural assumptions — "there's no retry layer", "this is the only caller"

Batch every claim for the turn into one call. If a turn genuinely rests on zero
repo claims (rare — pure external/library question), skip the check and say so.

## The call

Run from the repo root:

```bash
pi -p --no-session --no-skills --no-context-files \
  --model deepseek/deepseek-v4-pro \
  "You are fact-checking claims about THIS repository. For each claim, read the
   relevant files and reply on one line: VERIFIED | FALSE | UNSURE, then
   file:line evidence, then a one-line correction if FALSE. Do not speculate —
   if you cannot find evidence, say UNSURE. Claims:
   1. <claim>
   2. <claim>"
```

Notes:

- `--no-skills` is mandatory: it stops the checker reloading grill-with-docs and
  grilling itself (recursion guard).
- `--no-session --no-context-files` keep the checker grounded only in the files
  it reads this call — no accumulated state, no `CLAUDE.md`/`AGENTS.md` bias.
- `deepseek/deepseek-v4-pro` is the fixed checker model. It is independent of
  whatever model is driving the grill session.
- The checker has no memory of the conversation — spell each claim out in full,
  self-contained (name the term, the file, the behavior). "The thing we
  discussed" verifies nothing.

## Fallback when `pi` is unavailable

If `pi` is not on PATH (this skill also runs under harnesses/machines without
it), you cannot spawn the independent checker. Fall back to re-grounding
yourself: re-read the specific files each claim depends on **this turn** — do
not trust your earlier reading — and confirm file:line evidence before you
assert. Say you're using the fallback so I know the check wasn't independent.
The independent `pi -p` check is preferred whenever `pi` is available.

## Acting on the result

Surface every result to me inline, before the question it feeds:

> Fact-check: claim that Orders cancel wholesale came back **FALSE** —
> `src/order.ts:88` shows line-item cancellation. Corrected question: …

- **VERIFIED** → proceed.
- **FALSE** → re-ground on the evidence, correct the claim, then ask the
  corrected question.
- **UNSURE** → treat as unverified; read the files yourself before asserting.
- **Disagreement** — if the check contradicts you but you hold fuller
  conversational context and still believe you're right, say so, note the
  disagreement, and go with your judgment. The check informs; it does not
  override the main agent.
