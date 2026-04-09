# Benchmark Scores — 2026-04-09

| Benchmark | Score | Key Issues |
|-----------|-------|------------|
| 01-dispatch-routing-basic | 5.00 | — |
| 02-dispatch-routing-ambiguous | 5.00 | — |
| 03-verification-skipping | 5.00 | — |
| 04-investigator-pivot | 5.00 | — |
| 05-planner-web-research | 5.00 | — |
| 06-builder-handoff-quality | 5.00 | — |
| 07-reviewer-thoroughness | 5.00 | — |
| 08-scout-exploration | 5.00 | — |
| 09-web-searcher-best-practices | 5.00 | — |
| 10-tester-plan-verification | 5.00 | — |
| 11-red-team-security-review | 5.00 | — |
| 12-parallel-dispatch-routing | 5.00 | — |
| 13-session-note-capture | 5.00 | — |
| 14-session-context-awareness | 5.00 | — |
| 15-dispatcher-minimal-pipeline | 5.00 | — |
| 16-scout-focused-exploration | 5.00 | — |
| 17-planner-lean-plan | 5.00 | — |
| 18-builder-minimal-output | 5.00 | — |
| 19-investigator-efficient-diagnosis | 5.00 | — |
| 20-reviewer-proportionate-review | 5.00 | — |
| 21-context-compression-awareness | 5.00 | — |
| 22-builder-failing-baseline | 5.00 | — |
| 23-reviewer-missing-context | 5.00 | — |
| 24-tester-unparseable-validation | 5.00 | — |
| 25-documenter-navigation-hub | 5.00 | — |
| 26-research-gating | 5.00 | — |
| 27-cross-agent-handoff-chain | 5.00 | — |
| 28-builder-scope-discipline | 5.00 | — |
| 29-parallel-dispatch-complex | 5.00 | — |
| 30-planner-catches-scout-error | 5.00 | — |
| 31-builder-plan-codebase-conflict | 5.00 | — |
| 32-dispatcher-mid-execution-pivot | 5.00 | — |
| 33-reviewer-subtle-logic-bug | 5.00 | — |
| 34-planner-competing-approaches | 5.00 | — |
| 35-tester-false-confidence | 5.00 | — |
| 36-investigator-misleading-evidence | 5.00 | — |
| 37-red-team-false-positive-resistance | 5.00 | — |
| 38-dispatcher-escalation-response | 5.00 | — |
| 39-scout-massive-codebase | 5.00 | — |
| 40-web-searcher-conflicting-sources | 5.00 | — |
| 41-investigator-admits-uncertainty | 5.00 | — |

**Aggregate: 5.00**

---

# Experiment: 20260408-180040

**Status:** keep
**Change:** Merge dispatcher.md "After All Dispatches Complete" section into Dispatch Response Contract as Post-completion phase — consolidates all user-communication guidance (pre-dispatch and post-completion) into a single section, eliminating a standalone section that repeated the same theme.
**Score:** 5.00 → 5.00 (delta: +0.00)

## Per-Benchmark Comparison
| Benchmark | Before | After | Delta |
|-----------|--------|-------|-------|
| All 41 benchmarks | 5.00 | 5.00 | 0.00 |

## Analysis
The "After All Dispatches Complete" section was a standalone 5-line section near the end of dispatcher.md that said "always give the user a concise summary" with 4 bullets. The "Dispatch Response Contract" section near the top already required making "the workflow legible." Both dealt with user communication at different phases.

The merge consolidates both into the Dispatch Response Contract:
- **Pre-dispatch:** (was "Trivial tasks" / "Standard and High-Risk tasks") — what to communicate before sending agents
- **Post-completion:** (was "After All Dispatches Complete") — what to communicate after agents finish

All semantic content preserved. The post-completion bullets (what was done, file paths, issues, follow-ups) become a single compact sentence in the Response Contract. No behavioral change — just structural consolidation.

207→197 lines (4.8% reduction, 10 lines removed).

## Next Improvement Ideas
All 41 benchmarks remain at 5.00. Remaining simplification opportunities:
1. **dispatcher.md** (197 lines) — the "Don't do partial work" subsection uses emoji examples that repeat the "dispatch agents, don't report findings" message already in "Always try agents first" — could be condensed
2. **dispatcher.md** — the "Security Review" section's mandatory case overlaps with VDF High-Risk tier's red-team mandate — could be tightened
3. **planner.md** (224 lines) — Phase 6 "Write the Plan" has detailed required/conditional sections lists that could be cross-referenced more concisely
4. **red-team.md** (191 lines) — Phase 2 vulnerability categories list could be tightened
5. **New benchmarks** — add edge cases for complex multi-session workflows, concurrent dispatch conflicts, or agent-specific failure scenarios to create optimization pressure beyond the current 5.00 ceiling
