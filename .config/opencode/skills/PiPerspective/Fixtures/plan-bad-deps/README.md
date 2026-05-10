# Acceptance fixture: `plan-bad-deps`

Maps to **T-23** in `~/.pai/artifacts/plans/pi-perspective/PLAN.md`.

A PLAN-phase fixture that hits five distinct PLAN-prompt failure modes at
once. PiPerspective's PLAN review must return `FAIL` (or at minimum
`CONCERNS`) and call out at least two of the five planted defects.

## Files

- `ISA.md` — the ISA for a fictional "Add CSV export to user list" feature.
  7 atomic ISCs (ISC-01..ISC-07).
- `PLAN.md` — the divergent implementation plan. Looks normal at a glance;
  contains 5 plant-able defects.
- `expected-verdict.json` — machine-readable acceptance spec.
- `Grade.ts` — automated grader.

## Plant-able defects

1. **False parallelism (Wave 1):** `T-02` is documented as "uses output of
   T-04", and `T-03` "wires T-02 into T-01", but all three are in Wave 1.
   Pi should flag this as a wave-order error.
2. **Missing ISC coverage:** ISC-05 (perf <5s), ISC-06 (rate limit),
   ISC-07 (permission gate) have no corresponding tasks.
3. **Hand-waved risk:** the DOS risk is mitigated by "(deferred to a
   future ticket)" — which directly contradicts ISC-06.
4. **Soft acceptance metrics:** "feels clean and maintainable" in the
   Acceptance section is unverifiable.
5. **Scope drift:** Phase 2 tasks T-07 and T-08 map to no ISC.

## How to run

```sh
cd ~/.config/opencode

bun run skills/PiPerspective/Tools/InvokePi.ts \
  --phase PLAN \
  --isa  skills/PiPerspective/Fixtures/plan-bad-deps/ISA.md \
  --plan skills/PiPerspective/Fixtures/plan-bad-deps/PLAN.md \
  --model "openai-codex/gpt-5.4:high" \
  --timeout 180000 \
  --no-audit \
  --json > /tmp/pi-plan-verdict.json

bun run skills/PiPerspective/Fixtures/plan-bad-deps/Grade.ts /tmp/pi-plan-verdict.json
```

`Grade.ts` exits 0 if pi caught enough defects with valid evidence;
exits 1 otherwise.

## Observed performance

Measured on `openai-codex/gpt-5.4:high` over 3 runs:

| Metric           | Value           |
|------------------|-----------------|
| Mean latency     | 66.8s           |
| Min / max        | 58.1s / 76.2s   |
| Verdict          | 5/5 → `FAIL`    |
| Grader OVERALL   | 3/3 → `PASS`    |
| Patterns matched | 5/5 each run    |

PLAN does not use `verify_thinking: minimal`; it inherits `:high` from the
model id. The 90s `PHASE_DEFAULTS.PLAN.timeoutMs` ceiling is comfortably
above observed runs.
