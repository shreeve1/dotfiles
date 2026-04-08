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

### Dispatcher Routing (6 benchmarks)
| Directory | Tests | Target |
|-----------|-------|--------|
| 01-dispatch-routing-basic | Correct agent selection for 3 request types | dispatcher.md |
| 02-dispatch-routing-ambiguous | Handling ambiguous performance complaint | dispatcher.md |
| 03-verification-skipping | Risk-proportionate verification decisions | dispatcher.md |
| dispatch-bug-report | Bug report routing accuracy | dispatcher.md |
| dispatch-feature-request | Feature request pipeline depth | dispatcher.md |
| dispatch-quick-question | Light-touch vs. over-engineered routing | dispatcher.md |

### Exploration & Research (2 benchmarks)
| Directory | Tests | Target |
|-----------|-------|--------|
| 08-scout-exploration | Structured codebase mapping for downstream planner | scout.md |
| 09-web-searcher-best-practices | Production-grade research with sources and trade-offs | web-searcher.md |

### Planning (2 benchmarks)
| Directory | Tests | Target |
|-----------|-------|--------|
| 05-planner-web-research | Research awareness when planning rate limiting | planner.md |
| plan-new-feature | Codebase-grounded feature planning | planner.md |

### Investigation & Diagnosis (2 benchmarks)
| Directory | Tests | Target |
|-----------|-------|--------|
| 04-investigator-pivot | Pivoting after 3 consecutive failures | investigator.md |
| investigator-diagnosis | Systematic root cause analysis | investigator.md |

### Implementation & Review (2 benchmarks)
| Directory | Tests | Target |
|-----------|-------|--------|
| 06-builder-handoff-quality | Self-contained output for downstream agents | builder.md |
| 07-reviewer-thoroughness | Detecting subtle issues in a caching plan | reviewer.md |

### Verification & Security (3 benchmarks)
| Directory | Tests | Target |
|-----------|-------|--------|
| 10-tester-plan-verification | Plan-driven acceptance criteria verification | tester.md |
| 11-red-team-security-review | Vulnerability detection in file upload code | red-team.md |
| review-flawed-plan | Review depth on intentionally flawed plans | reviewer.md |

### New Capabilities (3 benchmarks)
| Directory | Tests | Target |
|-----------|-------|--------|
| 12-parallel-dispatch-routing | Correct use of dispatch_parallel vs sequential dispatch | dispatcher.md |
| 13-session-note-capture | Learning capture quality after investigation | investigator.md |
| 14-session-context-awareness | Leveraging prior session notes and team channel messages | scout.md |

### Efficiency (6 benchmarks)
| Directory | Tests | Target |
|-----------|-------|--------|
| 15-dispatcher-minimal-pipeline | Choosing the shortest correct pipeline per risk level | dispatcher.md |
| 16-scout-focused-exploration | Answering exactly what was asked without scope creep | scout.md |
| 17-planner-lean-plan | Producing proportionally-sized plans without padding | planner.md |
| 18-builder-minimal-output | Complete handoff reports without verbosity | builder.md |
| 19-investigator-efficient-diagnosis | Reaching root cause with minimal exploration | investigator.md |
| 20-reviewer-proportionate-review | Review depth matching change risk level | reviewer.md |

## Coverage

All 9 agents are tested: scout (3), web-searcher (1), planner (3), builder (2),
reviewer (3), tester (1), documenter (0 — implicit via pipeline benchmarks),
red-team (1), investigator (4), dispatcher (8). Total: 26 benchmarks.

## Adding Benchmarks

Create a new numbered directory (15+) with `instruction.md` and `verifier.md`. Follow
the rubric format from existing benchmarks. Ensure the target agent file actually
exists and criteria have concrete 0/1/3/5 descriptions.
