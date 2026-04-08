# Benchmark Scores — 2026-04-08T04:19:32Z

| Benchmark | Score | Key Issues |
|-----------|-------|------------|
| 01-dispatch-routing-basic | 5.00 | None |
| 02-dispatch-routing-ambiguous | 5.00 | None |
| 03-verification-skipping | 5.00 | None |
| 04-investigator-pivot | 5.00 | None |
| 05-planner-web-research | 5.00 | None |
| 06-builder-handoff-quality | 5.00 | None |
| 07-reviewer-thoroughness | 5.00 | None |
| 08-scout-exploration | 5.00 | None |
| 09-web-searcher-best-practices | 5.00 | None |
| 10-tester-plan-verification | 5.00 | None |
| 11-red-team-security-review | 5.00 | None |
| 12-parallel-dispatch-routing | 5.00 | None |
| 13-session-note-capture | 5.00 | None |
| 14-session-context-awareness | 5.00 | None |
| 15-dispatcher-minimal-pipeline | 5.00 | None |
| 16-scout-focused-exploration | 5.00 | None |
| 17-planner-lean-plan | 5.00 | None |
| 18-builder-minimal-output | 5.00 | None |
| 19-investigator-efficient-diagnosis | 5.00 | None |
| 20-reviewer-proportionate-review | 5.00 | None |
| dispatch-bug-report | 5.00 | None |
| dispatch-feature-request | 5.00 | None |
| dispatch-quick-question | 5.00 | None |
| investigator-diagnosis | 5.00 | None |
| plan-new-feature | 5.00 | None |
| review-flawed-plan | 5.00 | None |

**Aggregate: 5.00**

# Experiment: 20260407-201932

**Status:** keep
**Change:** Simplify planner.md by removing the redundant Plan Format template section (~73 lines) — the template listed every required/conditional section and showed task format with `[N.M]` IDs, `[parallel-safe]` markers, and Traceability Map tables, all of which were already defined in Phase 6 (required/conditional sections) and Phase 7 (task structure rules with identical examples). Consolidated 3 unique format details into Phase 6: Relevant Files list format, New Files subsection guidance, and Traceability Map table format.
**Score:** 5.00 → 5.00 (delta: +0.00)

## Per-Benchmark Comparison
| Benchmark | Before | After | Delta |
|-----------|--------|-------|-------|
| 01-dispatch-routing-basic | 5.00 | 5.00 | +0.00 |
| 02-dispatch-routing-ambiguous | 5.00 | 5.00 | +0.00 |
| 03-verification-skipping | 5.00 | 5.00 | +0.00 |
| 04-investigator-pivot | 5.00 | 5.00 | +0.00 |
| 05-planner-web-research | 5.00 | 5.00 | +0.00 |
| 06-builder-handoff-quality | 5.00 | 5.00 | +0.00 |
| 07-reviewer-thoroughness | 5.00 | 5.00 | +0.00 |
| 08-scout-exploration | 5.00 | 5.00 | +0.00 |
| 09-web-searcher-best-practices | 5.00 | 5.00 | +0.00 |
| 10-tester-plan-verification | 5.00 | 5.00 | +0.00 |
| 11-red-team-security-review | 5.00 | 5.00 | +0.00 |
| 12-parallel-dispatch-routing | 5.00 | 5.00 | +0.00 |
| 13-session-note-capture | 5.00 | 5.00 | +0.00 |
| 14-session-context-awareness | 5.00 | 5.00 | +0.00 |
| 15-dispatcher-minimal-pipeline | 5.00 | 5.00 | +0.00 |
| 16-scout-focused-exploration | 5.00 | 5.00 | +0.00 |
| 17-planner-lean-plan | 5.00 | 5.00 | +0.00 |
| 18-builder-minimal-output | 5.00 | 5.00 | +0.00 |
| 19-investigator-efficient-diagnosis | 5.00 | 5.00 | +0.00 |
| 20-reviewer-proportionate-review | 5.00 | 5.00 | +0.00 |
| dispatch-bug-report | 5.00 | 5.00 | +0.00 |
| dispatch-feature-request | 5.00 | 5.00 | +0.00 |
| dispatch-quick-question | 5.00 | 5.00 | +0.00 |
| investigator-diagnosis | 5.00 | 5.00 | +0.00 |
| plan-new-feature | 5.00 | 5.00 | +0.00 |
| review-flawed-plan | 5.00 | 5.00 | +0.00 |

**Aggregate: 5.00 → 5.00 (delta +0.00)**

## Analysis

The Plan Format section was a ~73-line markdown template at the end of planner.md (between Phase 8 and Phase 9) that listed every required section (Task Description, Objective, Relevant Files, etc.) with filler text, showed the `[N.M]` task ID format with example tasks, and demonstrated the Traceability Map table structure. This information was already provided by:

1. **Phase 6** — lists all required and conditional sections with descriptions
2. **Phase 7** — defines task ID format, dependency ordering, `[parallel-safe]`/`[sequential]` annotations, and includes an identical task example

The template added no unique behavioral guidance — it was a visual reference that restated the same rules as prose. Three format details that were only visible in the template (Relevant Files list format, New Files subsection, Traceability Map table format) were consolidated into Phase 6's section descriptions.

planner.md reduced from 320 to 247 lines (23% reduction) with no information loss. The planner's behavioral output is determined by Phases 1-10, which are all unchanged.

No benchmark scores changed because:
- `plan-new-feature` scores required sections (Phase 6 unchanged), task breakdown (Phase 7 unchanged), codebase grounding (Phase 3 unchanged), and validation (Phase 8 unchanged)
- `05-planner-web-research` scores research awareness (Phase 3b unchanged)
- `17-planner-lean-plan` scores plan proportionality (Workflow Overview unchanged) and actionability (Phase 7 unchanged)
- All other benchmarks test non-planner agents whose files are unchanged

## Next Improvement Ideas

- planner.md is now 247 lines — further compression possible in the Phase 9 (filename) and Phase 10 (save/report) sections which are verbose for simple instructions
- The remaining large files: builder.md (209 lines), tester.md (212 lines), reviewer.md (191 lines) — each could be reviewed for similar template/prose redundancy
- dispatcher.md (221 lines) remains the largest team-config file; the "Clarify Before Dispatching" section (2 standalone lines) could fold into the VDF's Ambiguous Scope tier
- The program's Improvement Axis 10 (parallel dispatch) was addressed in benchmarks 12-14 but the dispatcher.md Parallel Dispatch Heuristics section could potentially be compressed
