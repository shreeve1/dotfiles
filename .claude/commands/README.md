# `/dev-*` Pipeline — Canonical Reference

Spec-driven development pipeline. One canonical 8-step chain; several optional side-branches.

---

## Canonical Pipeline

```
/dev-prd        idea → PRD
      │
      ▼
/dev-epic       (conditional) multi-epic PRD → per-epic mini-PRDs
      │
      ▼
/dev-plan       PRD (or mini-PRD) → implementation plan
      │
      ▼
/dev-shard      (conditional) plan > 150k tokens → ordered shards
      │
      ▼
/dev-validate   plan feasibility + risk rewrite
      │
      ▼
/dev-build      wave-based parallel execution
      │
      ▼
/dev-test       run tests, verify acceptance criteria
      │
      ▼
/dev-review     independent Codex second-opinion
      │
      ▼
/commit         (ships the change)
```

### When conditional steps fire

| Step | Trigger |
|------|---------|
| `/dev-epic` | `Scope:` is `Multi-week` or `Ongoing` OR feature count > 8 OR `--force` |
| `/dev-shard` | Estimated plan tokens > 150,000 (analysis produced by the command itself) |

---

## Canonical Directory Layout

Every `/dev-*` command reads from and writes to the `artifacts/` tree:

| Directory | Producer | Purpose |
|-----------|----------|---------|
| `artifacts/specs/` | `/dev-prd` | PRDs (top-level files) |
| `artifacts/specs/<parent>/` | `/dev-epic` | Mini-PRDs, `README.md`, `original-prd.md` |
| `artifacts/plans/` | `/dev-plan` | Implementation plans (top-level files) |
| `artifacts/plans/<plan>/` | `/dev-shard` | Shards, `README.md`, `original-plan.md` |
| `artifacts/stories/` | `/dev-stories` | Playwright UI stories (optional) |
| `artifacts/investigations/` | `/dev-investigate` | Root-cause findings |
| `tests/regression/` | `/dev-investigate` | Regression tests generated alongside investigations |

Any command that **reads** plans/PRDs searches `artifacts/plans/` and `artifacts/specs/` **recursively** so shards and epic mini-PRDs in subdirectories are discovered automatically.

---

## Side-Branches (not on the critical path)

| Command | When to use |
|---------|-------------|
| `/dev-investigate` | Bug or unexpected behavior — 6-phase root-cause loop. Outputs to `artifacts/investigations/` and `tests/regression/`. |
| `/dev-stories` | UI-facing work where you want Playwright coverage. Runs on a plan, outputs YAML stories. |
| `/dev-team` | Fully-automated pipeline (plan → shard? → validate → build → test → review → commit). Assumes single-epic input; run `/dev-epic` first for multi-epic PRDs. |

---

## Traceability Invariants

Tags flow end-to-end:

```
#req-[id]            created by /dev-prd
    │
    ├─► /dev-epic     propagated verbatim to mini-PRDs
    │
    ├─► /dev-plan     propagated to tasks:  - [ ] [N.M] <action> #req-<id>
    │                 [N.M] is a stable anchor for /dev-build checkboxes and /dev-test matching
    │
    ├─► /dev-validate cross-references #req tags for orphan detection
    │
    └─► /dev-test     matches acceptance criteria to plan tasks by #req tag
```

Never rename or drop a `#req-[id]` once it is created. It is the only stable link between layers.

---

## Quick Reference — Command → Output

| Command | Writes to |
|---------|-----------|
| `/dev-prd` | `artifacts/specs/prd-<name>-<date>.md` |
| `/dev-epic` | `artifacts/specs/<parent>/epic-N-<slug>.md` + `README.md` + `original-prd.md` |
| `/dev-plan` | `artifacts/plans/<name>.md` |
| `/dev-shard` | `artifacts/plans/<plan>/shard-N.md` + `README.md` + `original-plan.md` |
| `/dev-validate` | Mutates plan in place (adds `## Risk Analysis`) |
| `/dev-build` | Mutates plan in place (flips `[ ]` → `[x]`); modifies source code |
| `/dev-test` | Test results to stdout; flips `[T.N.M]` checkboxes in the plan's `## Tests` section |
| `/dev-review` | Findings to stdout; interactive discussion, then user-approved edits |
| `/dev-stories` | `artifacts/stories/<plan-name>-stories.md` |
| `/dev-investigate` | `artifacts/investigations/investigation-<ts>.md` + `tests/regression/fix-<ts>.*` |
