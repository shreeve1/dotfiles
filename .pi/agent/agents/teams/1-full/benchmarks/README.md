# Full Team — Benchmarks

Benchmarks for the hill-climbing improvement loop. Each benchmark is a directory
containing two files:

- `instruction.md` — A realistic scenario or task the team would face
- `verifier.md` — Scoring rubric with weighted criteria, required elements, and anti-patterns

## Format

### instruction.md
A self-contained scenario with enough context for the target agent to produce
a meaningful response. Ends with a clear instruction.

### verifier.md
- **Target Agent** — which agent .md file to evaluate against
- **Context Files** — additional files the evaluator should load
- **Scoring Rubric** — criteria scored 0/1/3/5 with weights 1-3
- **Required Elements** — specific checkable items that must be present
- **Anti-Patterns** — specific failure modes that should not appear

**Scoring method:** Each benchmark score = weighted average of criterion scores
on a 0–5 scale. Aggregate = mean of all benchmark scores.

## Benchmarks

### Gen 1: Output Quality & Format (01-29)

Tests whether agents produce the right *kind* of output — correct format, right
agent selection, proper handoffs, failure recovery procedures.

#### Dispatcher Routing (5)
| # | Directory | Tests | Target |
|---|-----------|-------|--------|
| 01 | 01-dispatch-routing-basic | Correct agent selection for 3 request types | dispatcher.md |
| 02 | 02-dispatch-routing-ambiguous | Handling ambiguous performance complaint | dispatcher.md |
| 03 | 03-verification-skipping | Risk-proportionate verification decisions | dispatcher.md |
| 12 | 12-parallel-dispatch-routing | Correct use of dispatch_parallel vs sequential | dispatcher.md |
| 29 | 29-parallel-dispatch-complex | Multi-stream parallel + sequential routing | dispatcher.md |

#### Exploration & Research (3)
| # | Directory | Tests | Target |
|---|-----------|-------|--------|
| 08 | 08-scout-exploration | Structured codebase mapping for downstream planner | scout.md |
| 09 | 09-web-searcher-best-practices | Production-grade research with sources and trade-offs | web-searcher.md |
| 16 | 16-scout-focused-exploration | Answering exactly what was asked without scope creep | scout.md |

#### Planning (4)
| # | Directory | Tests | Target |
|---|-----------|-------|--------|
| 05 | 05-planner-web-research | Research awareness when planning rate limiting | planner.md |
| 17 | 17-planner-lean-plan | Producing proportionally-sized plans without padding | planner.md |
| 26 | 26-research-gating | Flagging knowledge gaps and marking tasks as conditional | planner.md |
| 27 | 27-cross-agent-handoff-chain | Leveraging scout findings instead of re-exploring | planner.md |

#### Investigation (3)
| # | Directory | Tests | Target |
|---|-----------|-------|--------|
| 04 | 04-investigator-pivot | Pivoting after 3 consecutive failures | investigator.md |
| 13 | 13-session-note-capture | Learning capture quality after investigation | investigator.md |
| 19 | 19-investigator-efficient-diagnosis | Reaching root cause with minimal exploration | investigator.md |

#### Implementation (3)
| # | Directory | Tests | Target |
|---|-----------|-------|--------|
| 06 | 06-builder-handoff-quality | Self-contained output for downstream agents | builder.md |
| 18 | 18-builder-minimal-output | Complete handoff reports without verbosity | builder.md |
| 28 | 28-builder-scope-discipline | Staying within plan scope despite tempting cleanup | builder.md |

#### Review (3)
| # | Directory | Tests | Target |
|---|-----------|-------|--------|
| 07 | 07-reviewer-thoroughness | Detecting subtle issues in a caching plan | reviewer.md |
| 20 | 20-reviewer-proportionate-review | Review depth matching change risk level | reviewer.md |
| 23 | 23-reviewer-missing-context | Adaptive review when plan file is missing | reviewer.md |

#### Verification & Security (2)
| # | Directory | Tests | Target |
|---|-----------|-------|--------|
| 10 | 10-tester-plan-verification | Plan-driven acceptance criteria verification | tester.md |
| 11 | 11-red-team-security-review | Vulnerability detection in file upload code | red-team.md |

#### Context, Learning & Efficiency (6)
| # | Directory | Tests | Target |
|---|-----------|-------|--------|
| 14 | 14-session-context-awareness | Leveraging prior session notes and channel messages | scout.md |
| 15 | 15-dispatcher-minimal-pipeline | Choosing the shortest correct pipeline per risk level | dispatcher.md |
| 21 | 21-context-compression-awareness | Summarizing intelligently vs dumping raw output | scout.md |
| 22 | 22-builder-failing-baseline | Handling pre-existing test failures in baseline | builder.md |
| 24 | 24-tester-unparseable-validation | Adapting when validation commands are vague/broken | tester.md |
| 25 | 25-documenter-navigation-hub | Correct categorization and navigation hub management | documenter.md |

---

### Gen 2: Reasoning Quality (30-39)

Tests whether agents *actually think correctly* — catching errors in upstream input,
handling conflicting signals, resisting anchoring on obvious explanations, making
sound trade-off decisions, and distinguishing "tests pass" from "criteria met."

These benchmarks have no single obviously correct answer format. Scoring depends on
the quality of reasoning, not template compliance.

#### Imperfect Upstream Input (2)
| # | Directory | Tests | Target |
|---|-----------|-------|--------|
| 30 | 30-planner-catches-scout-error | Does planner verify scout's sweeping negative claims? | planner.md |
| 31 | 31-builder-plan-codebase-conflict | Does builder flag when plan contradicts codebase patterns? | builder.md |

#### Adaptive Routing (2)
| # | Directory | Tests | Target |
|---|-----------|-------|--------|
| 32 | 32-dispatcher-mid-execution-pivot | Does dispatcher adapt when investigation changes the picture? | dispatcher.md |
| 38 | 38-dispatcher-escalation-response | Does dispatcher reprioritize for active security incident? | dispatcher.md |

#### Deep Analysis (3)
| # | Directory | Tests | Target |
|---|-----------|-------|--------|
| 33 | 33-reviewer-subtle-logic-bug | Does reviewer catch memory leak + window mismatch despite passing tests? | reviewer.md |
| 36 | 36-investigator-misleading-evidence | Does investigator resist anchoring on obvious explanation? | investigator.md |
| 37 | 37-red-team-false-positive-resistance | Does red-team avoid inflating severity of mitigated risks? | red-team.md |

#### Judgment Under Uncertainty (5)
| # | Directory | Tests | Target |
|---|-----------|-------|--------|
| 34 | 34-planner-competing-approaches | Does planner reason through trade-offs with explicit criteria? | planner.md |
| 35 | 35-tester-false-confidence | Does tester distinguish "tests pass" from "criteria met"? | tester.md |
| 39 | 39-scout-massive-codebase | Does scout compress 22 files into an 80-line focused report? | scout.md |
| 40 | 40-web-searcher-conflicting-sources | Does web-searcher weigh recency/authority over popularity? | web-searcher.md |
| 41 | 41-investigator-admits-uncertainty | Does investigator admit "inconclusive" when evidence is ambiguous? | investigator.md |

## Agent Coverage

| Agent | Gen 1 | Gen 2 | Total |
|-------|-------|-------|-------|
| **dispatcher** | 01, 02, 03, 12, 15, 29 | 32, 38 | 8 |
| **scout** | 08, 14, 16, 21 | 39 | 5 |
| **web-searcher** | 09 | 40 | 2 |
| **planner** | 05, 17, 26, 27 | 30, 34 | 6 |
| **builder** | 06, 18, 22, 28 | 31 | 5 |
| **reviewer** | 07, 20, 23 | 33 | 4 |
| **tester** | 10, 24 | 35 | 3 |
| **documenter** | 25 | — | 1 |
| **red-team** | 11 | 37 | 2 |
| **investigator** | 04, 13, 19 | 36, 41 | 5 |

**Total: 41 benchmarks across all 9 agents.**

## Axis Coverage

| Axis | Name | Gen 1 | Gen 2 |
|------|------|-------|-------|
| 1 | Verification coverage | 01, 02, 03, 15, 29 | 38 |
| 2 | Adaptive failure recovery | 04, 22 | 31, 32 |
| 3 | Web-searcher integration | 05, 09 | — |
| 4 | Output self-containment | 06, 18, 21 | — |
| 5 | Dispatcher routing precision | 01, 02, 03, 12, 29 | 32, 38 |
| 6 | Context compression | 21 | 39 |
| 7 | Agent-specific failure recovery | 04, 22, 23, 24 | 31 |
| 8 | Cross-agent verification | 27 | 30 |
| 9 | Autonomous learning | 13, 14 | — |
| 10 | Parallel dispatch | 12, 29 | — |
| 11 | Execution efficiency | 15, 16, 17, 18, 19, 20 | — |
| — | Reasoning depth | — | 33, 34, 35, 36, 37, 40, 41 |

## Adding Benchmarks

Create a new numbered directory (42+) with `instruction.md` and `verifier.md`. Follow
the rubric format from existing benchmarks. Ensure the target agent file actually
exists and criteria have concrete 0/1/3/5 descriptions.

Gen 2+ benchmarks should test reasoning quality, not output format. Design scenarios
where format-correct but reasoning-poor answers would score low.

## Rules

1. Benchmarks must test realistic scenarios the team would actually face
2. Verifier criteria must have weights (1-3) and concrete score descriptions
3. Required elements must be specific and checkable
4. Anti-patterns must describe real failure modes, not straw men
5. Target agent must reference a file that exists on disk
6. Do NOT modify existing benchmarks to make the current harness score higher
