# Verification — agent output trust

The vocabulary for how this setup judges whether an agent's work can be trusted.
Two distinct failure modes, two distinct passes — conflating them is the root
cause of misplaced verification effort. See `docs/adr/0001-verification-two-layers.md`.

## Failure modes

**Grounding failure**:
An agent assertion that is false or unsupported by evidence it actually gathered
(a wrong claim about the code). Detected by checking claims against evidence.
_Avoid_: hallucination (too broad), "wrong answer" (too vague).

**Completeness failure**:
A material behavior, edge case, or condition the agent's work omits — the work
is not wrong, it is incomplete. This is "usually misses something." Detected by
hunting for gaps, not by checking claims.
_Avoid_: oversight, missing feature.

## Verification passes

**Grounding gate**:
A pass that catches grounding failures by checking claims against evidence.
Cheap; can run every turn. pi-duo's TERMINAL gate is this. (pi-duo also has a
separate mid-loop SCOPE gate, but that checks proportionality / over-reach —
explicitly not grounding.)
_Avoid_: correctness checker, fact-checker.

**Completeness review**:
A pass that catches completeness failures by hunting for what was omitted.
Requires a "what's missing?" stance and benefits from re-reading the code fresh.
Expensive; run at task boundaries, not every turn.
_Avoid_: gap analysis, audit.

## Context axis

**In-band verifier**:
Runs in the same process as the actor and sees the actor's transcript. Cheap and
constant (pi-duo). Cannot see anything the actor never read.

**Fresh-session reviewer**:
A separate process with no inherited conversation that re-derives from the repo.
Its independence comes from re-derivation + stance, not merely from process
isolation.
_Avoid_: isolated verifier, sandboxed checker.
