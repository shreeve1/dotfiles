---
name: team-program
description: Generate a program.md and benchmarks for an existing agent team, enabling the team-improve hill-climbing loop. Reads the team's structure, interviews the user about optimization goals, and produces the full improvement program. Use when asked to "create a program for a team", "set up improvement benchmarks", "prepare a team for the improvement loop", "generate program.md", or after building a team with build-team.
---

# Create Team Improvement Program

Examine a built agent team, interview the user about what to optimize, and generate the `program.md` + benchmark suite that powers the `team-improve` hill-climbing loop.

**Prerequisites:** The team must already be built (agent .md files, team.yaml, dispatcher.md, context.md exist). If not, direct the user to `/skill:build-team` first.

---

## Phase 1 — Discover the Team

### 1a. Find the team

If a team name was provided, use it. Otherwise list available teams:

```bash
ls -d ~/.pi/agent/agents/teams/*/team.yaml 2>/dev/null
```

Show the list and ask the user which team to create an improvement program for.

### 1b. Read the team structure

Resolve paths:
- **Team dir:** `~/.pi/agent/agents/teams/<team>/`
- **Team config:** `team.yaml`, `dispatcher.md`, `context.md`, `brief.md`
- **Agent dir:** Determine from team.yaml agent names + find where the `.md` files live:
  ```bash
  # Read team.yaml to get agent list
  cat <team-dir>/team.yaml
  # Find agent definitions — check team-slug subfolder first, then top-level
  ls ~/.pi/agent/agents/<team-slug>/*.md 2>/dev/null
  ```

Read ALL of these files:
- `team.yaml` — roster
- `dispatcher.md` — routing logic, pipelines, tension frameworks
- `context.md` — shared domain context
- `brief.md` — team overview (if exists)
- Every agent `.md` definition (to understand each agent's role, tools, constraints)
- Expertise files in `expertise/` (to understand persistent knowledge)

### 1c. Check for existing program

```bash
ls <team-dir>/program.md 2>/dev/null
ls -d <team-dir>/benchmarks/*/ 2>/dev/null
```

If a program.md already exists, ask the user: **regenerate from scratch** or **add benchmarks to the existing program**?

---

## Phase 2 — Analyze the Team

Before interviewing the user, analyze the team structure and identify:

### 2a. Team capabilities
- What agents exist and what they do
- What pipelines/workflows the dispatcher defines
- What tensions exist (Red/Blue/White dynamics)
- What domain the team operates in

### 2b. Testable surfaces
For each agent, identify what aspects of its harness are testable:

| Agent Type | What to Benchmark |
|---|---|
| **Dispatcher/CEO** | Routing accuracy, tension mediation, pipeline selection, urgency assessment |
| **Planner/Architect** | Plan completeness, format compliance, codebase grounding, dependency ordering |
| **Builder/Implementer** | Plan faithfulness, pattern matching, verification, progress tracking |
| **Reviewer/Auditor** | Issue detection, severity categorization, actionable fixes, false positive rate |
| **Investigator/Analyst** | Root cause identification, evidence-based reasoning, systematic approach |
| **Scout/Explorer** | Coverage, accuracy, structure, relevance filtering |
| **Documenter** | Completeness, navigability, actionability, format compliance |
| **Security/Hardener** | Vulnerability detection, severity assessment, remediation quality |
| **Domain specialists** | Domain accuracy, advice quality, format compliance |

### 2c. Improvement axes
Based on the team analysis, draft potential improvement axes:
- Are dispatch rules specific enough?
- Do agents produce self-contained output for downstream handoff?
- Are instructions specific or vague?
- Is there context compression awareness?
- Are failure modes documented?
- Is verification built into workflows?

---

## Phase 3 — Interview the User

Ask 3–5 focused questions, one at a time. Adapt follow-ups to answers.

### Required questions:

1. **"What does this team do well, and where does it struggle?"**
   Get concrete examples of successes and failures. This drives benchmark design — the benchmarks should test the areas that matter most.

2. **"What would a 'perfect run' look like for this team's most common workflow?"**
   This defines the acceptance criteria for the most important benchmark.

3. **"Are there specific scenarios where the team makes wrong decisions?"**
   These become benchmarks directly — test the failure modes the user has observed.

### Optional questions (ask if the domain isn't clear from the team files):

4. **"What types of tasks does this team handle most frequently?"**
   Ensures benchmarks cover the common cases, not just edge cases.

5. **"Any areas you explicitly want the loop to leave alone?"**
   Some agent definitions might be hand-tuned and shouldn't be modified.

---

## Phase 4 — Generate program.md

Write `<team-dir>/program.md` with these sections:

### Template structure:

```markdown
# <Team Name> — Improvement Program

You are a meta-agent improving the <Team Name> harness. Your job is NOT to
<do the team's work> directly. Your job is to improve the agent definitions,
dispatch protocols, shared context, and expertise so the team <does its work>
more effectively.

## Directive

<2-3 paragraphs describing what the team should be optimized for, drawn from
the team's brief.md, context.md, and user interview answers>

## Edit Surface

These are the files you may modify. Everything else is off-limits.

### Agent Definitions
- agent_dir: <absolute path to agent .md directory>
  - `<agent-id>.md` — <one-line description>
  - ... (one line per agent)

### Team Configuration
- `<team-dir>/dispatcher.md` — <description>
- `<team-dir>/context.md` — <description>

### Expertise Files
- `<team-dir>/expertise/*.md` — per-agent persistent expertise

### Learning Configuration
- `<team-dir>/agent-skills/mental-model.md` — session note capture instructions

## Fixed Boundary — Do NOT Modify

- `program.md` (this file)
- `benchmarks/` (the benchmark tasks — modifying these is overfitting)
- `experiments/` (logs and snapshots — append-only)
- `team.yaml` (agent roster)
- `~/.pi/agent/AGENTS.md` (global safety rules)
- Any other team's files
- Any files outside the edit surface above

## Improvement Axes

<6-8 numbered axes, ordered by expected impact. Each axis has a title and
1-2 paragraphs explaining what to improve and why. Draw from:
- Phase 2 analysis (testable surfaces, structural gaps)
- Phase 3 interview (user-reported struggles, desired outcomes)
- Context engineering principles (compression, handoff fidelity,
  verification tightness, failure mode awareness)>

## Keep / Discard Rules

- If benchmark aggregate improved → keep
- If aggregate unchanged and harness is simpler → keep
- If any benchmark regressed by >1.0 point → discard (even if aggregate improved)
- Otherwise → discard

## Simplicity Criterion

<Team-specific guidance on what "simpler" means for this domain>

## Overfitting Rule

Do not add benchmark-specific hacks, keyword-triggered routing rules, or
instructions that only help one specific scenario.

Test: "If this exact benchmark disappeared, would this still be a worthwhile
improvement?" If no, it's overfitting.
```

### Key rules for program.md generation:
- `agent_dir` must be an absolute path (use `~` notation)
- List every agent .md file explicitly — don't use wildcards in the edit surface
- Improvement axes must be grounded in the actual team structure, not generic
- The directive must reflect the team's actual domain, not boilerplate

---

## Phase 5 — Generate Benchmarks

Create `<team-dir>/benchmarks/` with 4–8 benchmarks covering the team's key capabilities.

### 5a. Benchmark selection strategy

**Always include:**
- At least 2 dispatch/routing benchmarks (if the team has a dispatcher)
- At least 1 benchmark per "struggle area" from the user interview
- At least 1 benchmark for the team's most common workflow

**Balance across:**
- Different agents (don't test only the dispatcher)
- Different difficulty levels (some should be straightforward, some should be tricky)
- Different aspects (routing, output quality, format compliance, domain accuracy)

### 5b. Create each benchmark

For each benchmark, create a directory with two files:

**`instruction.md`** — The scenario or task:
- Write a realistic scenario the team would actually face
- Include enough context to be self-contained
- For output-quality benchmarks, include simulated codebase/environment context
- End with a clear instruction ("Decide how to handle this", "Produce a plan", etc.)

**`verifier.md`** — The scoring rubric:

```markdown
# Verifier: <Benchmark Name>

## Target Agent
<filename>.md (from <location>)

## Context Files
<files the evaluator should also load, e.g., context.md>

## Scoring Rubric

### Criterion 1: <Name> (weight: <1-3>)
- 5: <description of excellent>
- 3: <description of adequate>
- 1: <description of poor>
- 0: <description of failing>

### Criterion N: ...

## Required Elements
- [ ] <specific thing that must be present>

## Anti-Patterns
- <thing that should NOT appear>
```

### 5c. Benchmark quality rules

- Each criterion must have concrete 0/1/3/5 descriptions (not just "good"/"bad")
- Weights: 3 for critical criteria, 2 for important, 1 for nice-to-have
- Required Elements: 4–6 specific, checkable items
- Anti-Patterns: 3–5 specific failure modes
- Target agent must reference an actual file that exists
- Context files must reference actual files that exist

### 5d. Create benchmarks README

Write `<team-dir>/benchmarks/README.md` with:
- Brief description of what the benchmarks test
- Format explanation
- Notes on adding more benchmarks

---

## Phase 6 — Create experiments directory

```bash
mkdir -p <team-dir>/experiments
```

---

## Phase 7 — Verify and Report

### 7a. Verify all references

```bash
# Check that every target agent file exists
# Check that every context file exists
# Check that agent_dir in program.md resolves
```

Report any broken references.

### 7b. Final report

```
## Team Improvement Program Created

Team: <team name>
Directory: <team-dir>

### Files Created
- program.md — improvement directive and edit surface
- benchmarks/README.md — benchmark format guide
- benchmarks/<name>/instruction.md + verifier.md (×N)
- experiments/ — ready for improvement loop

### Benchmark Summary
| Benchmark | Tests | Target Agent |
|-----------|-------|-------------|
| <name> | <what it tests> | <agent> |

### Improvement Axes
1. <axis 1>
2. <axis 2>
...

### Next Steps
- Review program.md and benchmarks — edit if anything doesn't match your intent
- Run the improvement loop:
  ~/.pi/agent/skills/team-improve/scripts/loop.sh <team-name>
- Or run a single cycle: "Improve team <team-name>"
- Compare results: ~/.pi/agent/skills/team-improve/scripts/compare.sh <team-name>
```

---

## Constraints

- NEVER create benchmarks that can only be passed by adding specific keywords (overfitting bait)
- NEVER generate a program.md that references files outside the team's own directories
- ALWAYS verify that referenced files exist before saving
- ALWAYS list every agent file explicitly in the edit surface (no wildcards)
- ALWAYS use absolute paths with `~` notation for agent_dir
- Benchmarks must be realistic scenarios, not synthetic tests
- program.md must be grounded in the actual team structure, not templated boilerplate
- Interview the user — don't skip straight to generation
