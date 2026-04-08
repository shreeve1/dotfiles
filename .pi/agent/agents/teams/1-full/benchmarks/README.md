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

### Dispatcher Routing (5 benchmarks)
| # | Directory | Tests | Target |
|---|-----------|-------|--------|
| 01 | 01-dispatch-routing-basic | Correct agent selection for 3 request types | dispatcher.md |
| 02 | 02-dispatch-routing-ambiguous | Handling ambiguous performance complaint | dispatcher.md |
| 03 | 03-verification-skipping | Risk-proportionate verification decisions | dispatcher.md |
| 12 | 12-parallel-dispatch-routing | Correct use of dispatch_parallel vs sequential | dispatcher.md |
| 29 | 29-parallel-dispatch-complex | Multi-stream parallel + sequential routing | dispatcher.md |

### Exploration & Research (3 benchmarks)
| # | Directory | Tests | Target |
|---|-----------|-------|--------|
| 08 | 08-scout-exploration | Structured codebase mapping for downstream planner | scout.md |
| 09 | 09-web-searcher-best-practices | Production-grade research with sources and trade-offs | web-searcher.md |
| 16 | 16-scout-focused-exploration | Answering exactly what was asked without scope creep | scout.md |

### Planning (4 benchmarks)
| # | Directory | Tests | Target |
|---|-----------|-------|--------|
| 05 | 05-planner-web-research | Research awareness when planning rate limiting | planner.md |
| 17 | 17-planner-lean-plan | Producing proportionally-sized plans without padding | planner.md |
| 26 | 26-research-gating | Flagging knowledge gaps and marking tasks as conditional | planner.md |
| 27 | 27-cross-agent-handoff-chain | Leveraging scout findings instead of re-exploring | planner.md |

### Investigation & Diagnosis (3 benchmarks)
| # | Directory | Tests | Target |
|---|-----------|-------|--------|
| 04 | 04-investigator-pivot | Pivoting after 3 consecutive failures | investigator.md |
| 13 | 13-session-note-capture | Learning capture quality after investigation | investigator.md |
| 19 | 19-investigator-efficient-diagnosis | Reaching root cause with minimal exploration | investigator.md |

### Implementation (3 benchmarks)
| # | Directory | Tests | Target |
|---|-----------|-------|--------|
| 06 | 06-builder-handoff-quality | Self-contained output for downstream agents | builder.md |
| 18 | 18-builder-minimal-output | Complete handoff reports without verbosity | builder.md |
| 28 | 28-builder-scope-discipline | Staying within plan scope despite tempting cleanup | builder.md |

### Review (3 benchmarks)
| # | Directory | Tests | Target |
|---|-----------|-------|--------|
| 07 | 07-reviewer-thoroughness | Detecting subtle issues in a caching plan | reviewer.md |
| 20 | 20-reviewer-proportionate-review | Review depth matching change risk level | reviewer.md |
| 23 | 23-reviewer-missing-context | Adaptive review when plan file is missing | reviewer.md |

### Verification & Security (2 benchmarks)
| # | Directory | Tests | Target |
|---|-----------|-------|--------|
| 10 | 10-tester-plan-verification | Plan-driven acceptance criteria verification | tester.md |
| 11 | 11-red-team-security-review | Vulnerability detection in file upload code | red-team.md |

### Context & Learning (2 benchmarks)
| # | Directory | Tests | Target |
|---|-----------|-------|--------|
| 14 | 14-session-context-awareness | Leveraging prior session notes and channel messages | scout.md |
| 21 | 21-context-compression-awareness | Summarizing intelligently vs dumping raw output | scout.md |

### Failure Recovery (3 benchmarks)
| # | Directory | Tests | Target |
|---|-----------|-------|--------|
| 22 | 22-builder-failing-baseline | Handling pre-existing test failures in baseline | builder.md |
| 24 | 24-tester-unparseable-validation | Adapting when validation commands are vague/broken | tester.md |
| 26 | 26-research-gating | Blocking implementation on unresolved research | planner.md |

### Efficiency (2 benchmarks)
| # | Directory | Tests | Target |
|---|-----------|-------|--------|
| 15 | 15-dispatcher-minimal-pipeline | Choosing the shortest correct pipeline per risk level | dispatcher.md |
| 25 | 25-documenter-navigation-hub | Correct categorization and navigation hub management | documenter.md |

## Agent Coverage

| Agent | Benchmarks | Count |
|-------|-----------|-------|
| **dispatcher** | 01, 02, 03, 12, 15, 29 | 6 |
| **scout** | 08, 14, 16, 21 | 4 |
| **web-searcher** | 09 | 1 |
| **planner** | 05, 17, 26, 27 | 4 |
| **builder** | 06, 18, 22, 28 | 4 |
| **reviewer** | 07, 20, 23 | 3 |
| **tester** | 10, 24 | 2 |
| **documenter** | 25 | 1 |
| **red-team** | 11 | 1 |
| **investigator** | 04, 13, 19 | 3 |

**Total: 29 benchmarks across all 9 agents.**

## Axis Coverage

| Axis | Name | Benchmarks |
|------|------|-----------|
| 1 | Verification coverage | 01, 02, 03, 15, 29 |
| 2 | Adaptive failure recovery | 04, 22 |
| 3 | Web-searcher integration | 05, 09 |
| 4 | Output self-containment | 06, 18, 21 |
| 5 | Dispatcher routing precision | 01, 02, 03, 12, 29 |
| 6 | Context compression | 21 |
| 7 | Agent-specific failure recovery | 04, 22, 23, 24 |
| 8 | Cross-agent verification expectations | 27 |
| 9 | Autonomous learning | 13, 14 |
| 10 | Parallel dispatch | 12, 29 |
| 11 | Execution efficiency | 15, 16, 17, 18, 19, 20 |

## Adding Benchmarks

Create a new numbered directory (30+) with `instruction.md` and `verifier.md`. Follow
the rubric format from existing benchmarks. Ensure the target agent file actually
exists and criteria have concrete 0/1/3/5 descriptions.

## Rules

1. Benchmarks must test realistic scenarios the team would actually face
2. Verifier criteria must have weights (1-3) and concrete score descriptions
3. Required elements must be specific and checkable
4. Anti-patterns must describe real failure modes, not straw men
5. Target agent must reference a file that exists on disk
6. Do NOT modify existing benchmarks to make the current harness score higher
