# Independent claim verification

Shared engine — the single source of truth for fact-checking claims against
ground truth with a fresh, independent `pi -p` process. Consumed by `to-spec`,
`to-tickets`, `wayfinder`, `code-review`, `implement`, `teach`, and
`wiki-update`. Callers reach it via the phrase *independent verify (see
`_shared/verify-claims.md`)*; change the mechanics here, not in each skill. It
generalises the turn-by-turn fact-check that `grill-with-docs/VERIFY.md` runs —
that skill keeps its own copy tuned for the grill loop; this one is the reusable
form for everything else.

**Order matters. Ground your claim first — then check it, never the reverse.**

1. **Ground.** Form the claim from the actual ground truth *this run* — the repo
   files, the spec body, the diff, the cited source — not from memory and not
   from an earlier turn's reading. Read it now.
2. **Check.** Only then run the independent `pi -p` process as a *second
   opinion* on the claim you already grounded.
3. **Surface** the result to the user before you act on it.

The check is a cross-verifier, not your researcher. A single fresh `pi -p` pass
with zero conversation context is a *worse* explorer than you are — its only
value is that it carries none of your accumulated assumptions, so it can catch
your drift. It can only do that if you actually formed a grounded claim for it
to contradict. No grounding → nothing to verify.

## What counts as a claim

Anything you'd assert as true about the ground truth and then act on:

- **Repo facts** — "this is the only caller", "there's no retry layer here",
  "the code already cancels entire Orders", "the glossary defines X as Y".
- **Spec / ticket facts** — "the spec's acceptance criteria don't cover Z",
  "this ticket is unblocked once #12 closes", "no slice wires the API to the UI".
- **Diff facts** — "the diff removes the null check", "this hunk duplicates
  logic already in `foo.ts`".
- **Cited-source facts** (research / teaching / wiki) — "the docs say the API
  rate-limits at 100/s", "this source supersedes the older claim".

Batch every claim for the run into **one** call. If a run genuinely rests on
zero verifiable claims (rare — pure preference or a purely external/library
question with no repo or source anchor), skip the check and say so.

## The call

Run from the repo root:

```bash
pi -p --no-session --no-skills --no-context-files \
  --no-extensions --tools read,grep,find,ls \
  --model deepseek/deepseek-v4-pro \
  "You are fact-checking claims against ground truth. For each claim, read the
   relevant files/sources and reply on one line: VERIFIED | FALSE | UNSURE,
   then file:line (or source) evidence, then a one-line correction if FALSE. Do
   not speculate — if you cannot find evidence, say UNSURE. Claims:
   1. <claim>
   2. <claim>"
```

Notes:

- `--no-extensions --tools read,grep,find,ls` are **mandatory** and load-bearing:
  they confine the checker to read-only file access. The three `--no-*` flags
  below do **not** restrict tools — they only disable persistence, skills, and
  context files, leaving built-in `bash` available. Without the tool allowlist a
  checker has been observed to run the repo's own commands (e.g. a Playwright
  suite that spins up API/Next.js servers), blowing past the verifier timeout
  and mutating the worktree. The allowlist is what makes the check a *read-only
  second opinion* rather than an actor.
- `--no-skills` is mandatory: it stops the checker reloading this or any other
  skill and recursing.
- `--no-session --no-context-files` keep the checker grounded only in the files
  it reads this call — no accumulated state, no `CLAUDE.md`/`AGENTS.md` bias.
- `deepseek/deepseek-v4-pro` is the fixed checker model, independent of whatever
  model drives the main session.
- The checker has no memory of the conversation — spell each claim out in full,
  self-contained (name the term, the file, the behaviour, the source). "The
  thing we discussed" verifies nothing.

## Fallback when `pi` is unavailable

If `pi` is not on PATH (some harnesses/machines lack it), you cannot spawn the
independent checker. Fall back to **re-grounding yourself**: re-read the specific
files or sources each claim depends on *this run* — do not trust your earlier
reading — and confirm file:line (or source) evidence before you assert. Say
you're using the fallback so the user knows the check wasn't independent. The
independent `pi -p` check is preferred whenever `pi` is available.

## Acting on the result

Surface every result to the user inline, before the thing it feeds:

> Verify: claim that Orders cancel wholesale came back **FALSE** —
> `src/order.ts:88` shows line-item cancellation. Corrected: …

- **VERIFIED** → proceed.
- **FALSE** → re-ground on the evidence, correct the claim, then proceed with
  the corrected version.
- **UNSURE** → treat as unverified; read the files/sources yourself before
  asserting.
- **Disagreement** — if the check contradicts you but you hold fuller context
  and still believe you're right, say so, note the disagreement, and go with
  your judgment. The check informs; it does not override the main agent.
