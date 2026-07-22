# Verification is two layers: grounding gate (pi-duo) + completeness review (subagent)

An agent's work can fail two independent ways — **grounding** (a false claim) and
**completeness** (a material omission). pi-duo's verifier is a grounding gate
*only*: its prompt gates on unsupported/false claims and explicitly says "do not
demand extra work beyond the user's request," so a correct-but-incomplete answer
passes by design. We confirmed this is the actual pain ("usually misses
something" = completeness, not grounding) by reproducing it: real pi-duo
(minimax-M3 actor + deepseek-v4-flash verifier) on `~/symphony/contract_gate.py`
produced a fully correct six-part answer that nonetheless omitted ~13 material
behaviors (coverage rounded to 4 decimals + zero-population guard, the baseline
check ignoring `n`, `check=False` on `--auto-revert`, the no-arg subprocess that
prevents recursion, `load_corpus` rejecting extra JSON keys, etc.). pi-duo's gate
passed it. A fresh tooled subagent reviewer *tasked to find omissions* surfaced
all of them.

**Decision:** keep pi-duo as the cheap, constant, in-band **grounding gate**
(its terminal verifier). Add a separate, on-demand **completeness review** — a
fresh tooled subagent reviewer with an omission-focused prompt — at task
boundaries. The two are different mechanisms at different cost profiles; do not
collapse them.

## Considered options (rejected)

- **Replace pi-duo with a fresh-session verifier.** Rejected for GROUNDING:
pi-duo's in-band, tool-less verifier caught two synthetic false-claim probes
(including a subtle side-effect falsehood with the full file visible in the
transcript), so freshness is not needed to catch false claims. (Note: this says
nothing about completeness — see below.)
- **Build a watched-pane extension / generalize `herdr-orchestration` for verification.**
Rejected — the gap is not architectural. What found the omissions was a review
*tasked to look for omissions*; whether freshness, tool access, or prompt stance
was the decisive factor was NOT isolated (the contract_gate comparison changed
all three at once: pi-duo's verifier is tool-less and in-band; the reviewer was
tooled and fresh). The honest claim is only that a completeness-focused fresh
tooled review surfaced omissions that pi-duo's grounding gate cannot.
- **Run the completeness review constantly, like pi-duo.** Rejected — it re-reads
the repo, so it is expensive; constant is infeasible. It is a task-boundary
pass, not a per-turn gate.

## Consequences

- The completeness-review VALUE was achievable with existing tools (the
subagent reviewer + an omission-focused prompt); the gap-review EXTENSION does
not invent a new capability — it AUTOMATES that semantic at `turn_end` so it
runs without manual invocation. Manual one-off use still just needs
`subagent({agent:"reviewer", ...})` with the right prompt.
- The hook must respect the cost profile: gate to terminal turns, run async, and
keep the omission-focused prompt. Automation changes cadence; it does not
collapse the two-layer split.
- gap-review is an asynchronous AUDIT, not an acceptance gate: it never blocks the
 turn, headless jobs do not consume findings, and a detached reviewer can be
killed if the host (CI/container) exits before it finishes — the review file is
the durable artifact either way.
- When a result feels wrong but pi-duo passed it, suspect a COMPLETENESS failure,
not a grounding failure — reach for the completeness review, not a "stronger"
grounding gate.

## Evidence

Reproduced 2026-07-21. Artifacts: the six-question analysis and the reviewer's
falsehood/omission breakdown were generated live against `contract_gate.py`; the
load-bearing omissions and the "pi-duo's prompt has no completeness criterion"
claim were independently cross-verified by a fresh `deepseek/deepseek-v4-pro`
`pi -p` pass with file:line evidence.
