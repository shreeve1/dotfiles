# Fixture: think-misframed

THINK-phase acceptance fixture for PiPerspective (PRD ISC-13 / PLAN T-27).

## What this is

A deliberately misframed ISA. The ops team's stated problem is "engineering
spends an engineer-hour every Monday assembling three funnel metrics for
the weekly status email." The ISA `## Goal`, however, prescribes a
**custom analytics dashboard** with sparklines, deltas, and cohort
drill-down. The framing locks the team into UI work that solves a
*broader* problem than the one evidenced — when the real fix is a
scheduled email/Slack digest.

This is the canonical THINK failure mode: a goal stated in implementation
terms, ISCs that measure side-effects of the build, and an acceptance line
("feels useful") that proves nothing.

## Planted framing defects

Six classes of defect, mirrored 1:1 in `expected-verdict.json::bug_patterns`:

1. **Goal stated in implementation terms.** `## Goal` literally says
   "build and ship a custom analytics dashboard at /internal/ops-dashboard"
   — that's the *how*, not the *what*. The user-facing outcome (ops lead
   gets accurate weekly metrics without engineering touch) is never named.
2. **ISCs measure side effects.** ISC-01..04 verify route presence, chart
   rendering, sparkline presence, and delta display. ISC-06 measures
   coverage. None of these prove the ops lead can actually answer the
   weekly question.
3. **Hidden assumptions.** The ISA assumes (a) the production replica
   already contains the funnel data model, (b) the existing chart library
   supports sparklines, (c) admin-app auth is sufficient for ops. None are
   verified.
4. **Available reframe to a lighter-weight solution.** A weekly scheduled
   job emailing/Slacking the three numbers eliminates the engineer-hour
   without building any UI surface.
5. **Soft acceptance.** "Feels useful when the ops lead opens it" — not
   testable, not falsifiable.
6. **Out-of-scope hides load-bearing question.** "We'll add SSO later" is
   a deferred defect, not a real out-of-scope item, because the ISA's
   own constraints make `/internal/ops-dashboard` accessible to all
   logged-in employees.

## How to run

From `~/.config/opencode`:

```bash
bun run skills/PiPerspective/Tools/InvokePi.ts \
  --phase THINK \
  --isa skills/PiPerspective/Fixtures/think-misframed/ISA.md \
  --model "openai-codex/gpt-5.4:high" \
  --timeout 180000 \
  --no-audit \
  --json > /tmp/pi-think-verdict.json
```

Then grade:

```bash
bun run skills/PiPerspective/Fixtures/think-misframed/Grade.ts /tmp/pi-think-verdict.json
```

Render the REFRAME for review:

```bash
bun run skills/PiPerspective/Tools/RenderReframe.ts \
  --isa skills/PiPerspective/Fixtures/think-misframed/ISA.md \
  --verdict /tmp/pi-think-verdict.json \
  --out /tmp/pi-think-reframe.md
```

## Acceptance

Per `expected-verdict.json`:

- `verdict ∈ { FAIL, REFRAME }` — either is acceptable evidence that pi
  caught the framing defect. Empirically pi returns `REFRAME` on this
  fixture.
- `blockers.length >= 1` — REFRAME may legitimately consolidate findings
  into a single critical blocker.
- `matched >= 2 of 6 bug_patterns` against (blocker summary + detail) for
  major/critical patterns, plus (suggestions[] + summary_md) for
  minor-severity patterns.
- `evidence` cites at least one of `ISC-01..06`, `Goal`, `Problem`,
  `Acceptance`, `Out of Scope`.

Advisory (reported but non-gating) checks:

- A REFRAME verdict should carry at least one `critical` blocker.
- `summary_md` should be ≥ 40 chars (the reframed framing lives here).
- Each individual `pattern matched` check is advisory; only the
  aggregate count is gating, because a well-reasoned REFRAME can fold
  several defects into one finding without that being a defect.

## Observed performance (initial 3-run benchmark)

Model `openai-codex/gpt-5.4:high`, `--timeout 180000`, sequential runs.

| Run | Duration | Verdict | Blockers | Grader |
|-----|---------:|---------|---------:|--------|
| 1   | 41.9 s   | REFRAME | 2        | PASS   |
| 2   | 39.1 s   | REFRAME | 2        | PASS   |
| 3   | 113.0 s  | REFRAME | 2        | PASS   |
| live| 48.4 s   | REFRAME | 1        | PASS   |

Mean of the 3-run bench: **64.6 s**. The 113 s outlier is noticeably high
relative to PLAN (~67 s) and VERIFY-minimal (~28 s); THINK uses the
model's default high reasoning since there is no `think_thinking`
override knob in `Tools/Config.ts`. If THINK latency becomes a problem
in practice, the same `--thinking` plumbing used for VERIFY can be
extended; for the THINK acceptance gate, current latency is within
`PHASE_DEFAULTS.THINK.timeoutMs = 60000` for the typical case but the
180 s timeout used here is appropriate for safety.

## Files

- `ISA.md` — the misframed ISA the reviewer sees.
- `expected-verdict.json` — machine-readable acceptance spec.
- `Grade.ts` — runs the spec against any verdict JSON.
- `README.md` — this file.

There is no `ISA-with-answer-key.md` for THINK because the ISA *is* the
defect; the planted defects are the framing choices themselves, not
hidden bugs in code.
