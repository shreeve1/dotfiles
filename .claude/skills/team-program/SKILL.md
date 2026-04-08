---
name: team-program
description: Generate a program.md and benchmarks for an existing agent team or company, enabling the team-improve hill-climbing loop. Works with Pi teams, Claude Code teams, Paperclip companies, or any agent system with instruction files. Use when asked to "create a program for a team", "set up improvement benchmarks", "prepare a team for the improvement loop", or "generate program.md".
---

# Create Team Improvement Program

Examine any agent team or company, interview the user about what to optimize, and generate the `program.md` + benchmark suite that powers the `team-improve` hill-climbing loop.

**Prerequisites:** The team must already exist with agent instruction files. If not, tell the user to build the team first.

---

## Phase 1 -- Discover the Team

### 1a. Accept any path or name

The user may provide:
- **A path**: `/Users/james/.paperclip/instances/default`, `~/.pi/agent/agents/teams/2-infra-ops`, a project directory
- **A name**: Look in `~/.claude/teams/`, `~/.pi/agent/agents/teams/`, current project
- **Nothing**: List all known teams and ask

### 1b. Detect the platform

Read the directory structure to identify the platform:

| Signal | Platform |
|---|---|
| Has `team.yaml` + `dispatcher.md` | `pi` |
| Has `benchmarks/` or `program.md` already, lives under `~/.claude/teams/` | `claude-code` |
| Path contains `.paperclip` OR has `config.json` with `"embeddedPostgres"` | `paperclip` |
| Has agent `.md` files but no platform signal | `generic` |

For **Paperclip**, also identify:
- The Paperclip instance dir (e.g., `~/.paperclip/instances/default`)
- The company ID (from `config.json` or ask the user — check the homelab-ops-troubleshoot skill for known IDs)
- The source instructions dir (e.g., `<project>/agent-instructions/`)
- The deployed instructions path: `<instance>/companies/<company-id>/agents/<uuid>/instructions/`
- The API base URL and auth (from instance config or environment)
- The runner CLI (`pi -p` for Pi, `claude -p` for Claude Code/Paperclip)
- **Where to create `program.md` and `benchmarks/`**: Place the improvement program alongside the source instructions. Create a `.team-improve/` subdirectory inside the project root:
  ```
  <project-root>/.team-improve/
    program.md
    benchmarks/
    experiments/
  ```
  For the homelab company, that would be `~/1-testytech/homelab/.team-improve/`. This keeps improvement artifacts with the source they improve, not inside the Paperclip instance directory.

### 1c. Read the team structure

**Pi teams:**
```bash
cat <team-dir>/team.yaml       # agent roster
cat <team-dir>/dispatcher.md   # routing logic
cat <team-dir>/context.md      # shared domain context
cat <team-dir>/brief.md        # team overview (if exists)
cat <agent-dir>/*.md           # individual agent definitions
cat <team-dir>/expertise/*.md  # persistent expertise (if exists)
```

**Paperclip companies:**
```bash
# Get agent roster from API
curl -s "http://localhost:<port>/api/companies/<company-id>/agents" \
  -H "Authorization: Bearer $BOARD_KEY" | python3 -m json.tool

# Read source instruction files
cat <instructions_source>/<agent-name>/AGENTS.md
```

**Claude Code / generic:**
Read all `.md` files in the team directory and any linked agent directory.

### 1d. Check for existing program

```bash
ls <team-dir>/program.md 2>/dev/null
ls -d <team-dir>/benchmarks/*/ 2>/dev/null
```

If a `program.md` already exists, ask: **regenerate from scratch** or **add benchmarks to the existing program**?

---

## Phase 2 -- Analyze the Team

Before interviewing the user, analyze what you've read:

### 2a. Map the team
- What agents exist and their roles
- What workflows or pipelines are defined
- What domain the team operates in
- What tensions exist (strategic/tactical, quality/speed, etc.)

### 2b. Identify testable surfaces

| Agent Type | What to Benchmark |
|---|---|
| **CEO/Dispatcher** | Routing accuracy, priority decisions, delegation quality |
| **Planner** | Plan completeness, format, dependency ordering, codebase grounding |
| **Builder/Implementer** | Plan faithfulness, verification, pattern matching |
| **Reviewer/Auditor** | Issue detection, severity, actionable fixes, false positives |
| **Observer/Analyst** | Data accuracy, trend identification, escalation decisions |
| **Scout/Explorer** | Coverage, accuracy, relevance filtering |
| **Security/Hardener** | Vulnerability detection, severity, remediation quality |
| **Domain specialist** | Domain accuracy, format, advice quality |

### 2c. Draft improvement axes
- Are routing/delegation rules specific enough?
- Do agents produce self-contained output for handoff?
- Are instructions specific or vague?
- Are failure modes and escalation paths documented?
- Is verification built into key workflows?
- Is context efficiently compressed across handoffs?

---

## Phase 3 -- Interview the User

Ask 3–5 focused questions, **one at a time**.

### Required:

1. **"What does this team do well, and where does it struggle?"**
   Get concrete examples — these drive benchmark design.

2. **"What would a perfect run look like for the most common workflow?"**
   This defines acceptance criteria for the highest-priority benchmark.

3. **"Are there specific scenarios where the team makes wrong decisions?"**
   These become benchmarks directly.

### Optional (if domain/constraints aren't clear):

4. **"What tasks does this team handle most frequently?"**
   Ensures benchmarks cover common cases, not just edge cases.

5. **"Any areas you explicitly want the loop to leave alone?"**
   Some parts may be hand-tuned and off-limits.

---

## Phase 4 -- Generate program.md

Write `<team-dir>/program.md`. This file is the platform adapter — it tells `team-improve` everything it needs to operate.

### Template:

```markdown
# <Team Name> -- Improvement Program

You are a meta-agent improving the <Team Name> harness. Your job is NOT to
<do the team's work> directly. Your job is to improve the agent instructions,
routing logic, shared context, and expertise so the team performs better.

## Platform Config

platform: <pi | claude-code | paperclip | generic>
runner: <pi -p | claude -p>
apply_method: <file-edit | file-edit+deploy | api-patch>

<!-- Pi / Claude Code -->
agent_dir: <absolute path to agent .md files>

<!-- Paperclip only -->
instructions_source: <absolute path to source instruction files>
instructions_deployed: <absolute path to deployed instructions root>
                       # Pattern: <instance>/companies/<company-id>/agents/<uuid>/instructions/
api_base: <http://localhost:PORT>
company_id: <uuid>
<!-- End platform config -->

## Directive

<2-3 paragraphs: what this team does, what it should be optimized for,
drawn from team files and the user interview. Specific to this team — not generic.>

## Edit Surface

Files you MAY modify. Everything else is off-limits.

### Agent Instructions
<!-- Pi / Claude Code -->
- agent_dir: <path>
  - `<agent-id>.md` -- <one-line role description>

<!-- Paperclip -->
- instructions_source: <path>
  - `<name>/AGENTS.md` -- <one-line role description>
  - Deployed to: `<instance>/companies/<company-id>/agents/<uuid>/instructions/`

### Team Configuration (if applicable)
- `<team-dir>/dispatcher.md` -- routing and delegation rules
- `<team-dir>/context.md` -- shared domain knowledge

### Expertise (if applicable)
- `<team-dir>/expertise/*.md` -- per-agent persistent knowledge

## Fixed Boundary -- Do NOT Modify

- `program.md` (this file)
- `benchmarks/` (overfitting)
- `experiments/` (append-only logs)
- Team roster config (team.yaml, team.json, Paperclip DB)
- Any other team's or company's files

## Improvement Axes

<6-8 axes, ordered by expected impact. Each has a title and 1-2 paragraphs
grounded in the actual team structure and interview findings.>

## Keep / Discard Rules

- Aggregate improved -> keep
- Aggregate unchanged + harness simpler -> keep
- Any benchmark regressed > 1.0 -> discard (even if aggregate improved)
- Otherwise -> discard

## Simplicity Criterion

<Team-specific: what does "simpler" mean for this domain?>

## Overfitting Rule

No benchmark-specific hacks or keyword-triggered rules.

Test: "If this exact benchmark disappeared, would this still be a worthwhile improvement?"
If no -> don't do it.
```

### Key rules:
- `agent_dir` and `instructions_source` must be absolute paths with `~`
- For Paperclip: list every agent with its UUID in the edit surface
- Improvement axes must reflect the actual team, not boilerplate
- The directive must be specific to this team's domain

---

## Phase 5 -- Generate Benchmarks

Create `<team-dir>/benchmarks/` with 4–8 benchmarks.

### Selection strategy

**Always include:**
- 2+ routing/dispatch benchmarks (if team has a dispatcher or CEO)
- 1+ benchmark per struggle area from the interview
- 1+ benchmark for the most common workflow

**Balance across:**
- Different agents (don't test only the dispatcher)
- Different difficulty levels
- Different aspects (routing, output quality, format, domain accuracy)

### Each benchmark: two files

**`instruction.md`** — The scenario:
- Realistic situation the team would actually face
- Self-contained (include enough codebase/environment context)
- Clear instruction at the end ("Decide how to handle this", "Produce a plan", etc.)

**`verifier.md`** — The rubric:
```markdown
# Verifier: <Benchmark Name>

## Target Agent
<agent-name> (from <location>)
<!-- Pi/Claude Code: dispatcher.md (from agents/full/) -->
<!-- Paperclip: ceo (from agent-instructions/ceo/) -->

## Context Files
<other files to load during evaluation, e.g., context.md, TOOLS.md>

## Scoring Rubric

### Criterion 1: <Name> (weight: <1-3>)
- 5: <excellent>
- 3: <adequate>
- 1: <poor>
- 0: <failing>

### Criterion N: ...

## Required Elements
- [ ] <specific, checkable item that must be present>

## Anti-Patterns
- <specific failure mode that must NOT appear>
```

### Benchmark quality rules
- Weights: 3 = critical, 2 = important, 1 = nice-to-have
- Required Elements: 4–6 specific checkable items
- Anti-Patterns: 3–5 specific failure modes
- Target agent must reference a file that actually exists
- No synthetic tests — use realistic scenarios

### Create `<team-dir>/benchmarks/README.md`
- What the benchmarks test
- Format explanation
- How to add more

---

## Phase 6 -- Initialize Experiments

```bash
mkdir -p <team-dir>/experiments
```

---

## Phase 7 -- Verify and Report

### 7a. Verify all references
- Every target agent file in verifiers exists on disk
- Every context file exists
- `agent_dir` / `instructions_source` resolves

Report any broken references.

### 7b. Final report

```
## Team Improvement Program Created

Team: <name>
Platform: <platform>
Directory: <team-dir>

### Files Created
- program.md
- benchmarks/README.md
- benchmarks/<name>/ x<N> (instruction.md + verifier.md each)
- experiments/

### Benchmark Summary
| Benchmark | Tests | Target Agent |
|-----------|-------|-------------|

### Improvement Axes
1. <axis>
...

### Next Steps
- Review program.md and benchmarks
- Run one cycle: /team-improve <path-or-name>
- Run the loop: ~/.claude/skills/team-improve/scripts/loop.sh <team-dir>
- Compare results: ~/.claude/skills/team-improve/scripts/compare.sh <team-dir>
```

---

## Constraints

- NEVER create benchmarks passable only by adding specific keywords
- NEVER reference files outside the team's directories
- ALWAYS verify referenced files exist before saving
- ALWAYS list every agent file explicitly (no wildcards in edit surface)
- ALWAYS use absolute paths for agent_dir and instructions_source
- ALWAYS capture the platform config section accurately
- Benchmarks must be realistic scenarios
- Interview the user — don't skip to generation
