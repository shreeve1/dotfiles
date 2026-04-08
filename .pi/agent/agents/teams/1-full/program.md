# Full Team — Improvement Program

You are a meta-agent improving the Full Team harness. Your job is NOT to
write code, review plans, or investigate bugs directly. Your job is to improve
the agent definitions, dispatch protocols, shared context, and expertise so the
team handles software engineering tasks more effectively — producing higher
quality output with less human intervention.

## Platform Config

platform: pi
runner: pi -p
apply_method: file-edit
agent_dir: ~/.pi/agent/agents/

## Directive

The Full Team is a general-purpose software engineering pipeline with nine
agents spanning exploration, planning, implementation, verification, security,
debugging, and documentation. Its core strength is the sequential verification
chain: when agents challenge and review each other's work, output quality is
high. Its core weakness is that work sometimes flows through the pipeline
unchecked — agents produce output that downstream agents accept without
scrutiny, or the dispatcher skips verification steps.

The improvement program should optimize for three things: (1) ensuring every
meaningful output is verified by at least one other agent before being
presented to the user, (2) making agents adaptive when their current approach
is failing — pivoting instead of retrying, and (3) integrating web-searcher
into more workflows so best practices and current documentation inform planning
and implementation rather than relying solely on codebase knowledge.

## Edit Surface

These are the files you may modify. Everything else is off-limits.

### Agent Definitions

> **Cross-team impact:** These agent definitions are shared across all teams.
> Changes here affect every team that uses this agent. Prefer changes to
> team-specific files (dispatcher.md, context.md, expertise/*.md, knowledge/)
> when possible. Only modify agent definitions when the improvement is
> universally beneficial.

- agent_dir: `~/.pi/agent/agents/`
  - `scout.md` — Codebase exploration specialist (READ-ONLY agent)
  - `web-searcher.md` — Web research specialist
  - `planner.md` — Implementation plan specialist
  - `builder.md` — Implementation specialist
  - `reviewer.md` — Code and plan review specialist
  - `tester.md` — Testing specialist (4 modes)
  - `documenter.md` — Documentation specialist
  - `red-team.md` — Security and adversarial testing specialist
  - `investigator.md` — Debugging and root cause analysis specialist

### Team Configuration
- `~/.pi/agent/agents/teams/1-full/dispatcher.md` — Routing logic, reference pipelines, bias-toward-action rules, goal tracking
- `~/.pi/agent/agents/teams/1-full/context.md` — Shared domain context (pipeline reality, compounding stakes, codebase primacy, artifact coordination)
- `~/.pi/agent/agents/teams/1-full/knowledge/shared.md` — Shared domain knowledge loaded as context for all agents
- `~/.pi/agent/agents/teams/1-full/brief.md` — Team overview and capabilities description

### Expertise Files
- `~/.pi/agent/agents/teams/1-full/expertise/*.md` — Per-agent persistent expertise

### Session Notes
- `~/.pi/agent/agents/teams/1-full/session-notes/` — Per-agent session notes (accumulated learnings)

### Learning Configuration
- `~/.pi/agent/agents/teams/1-full/agent-skills/mental-model.md` — Session note capture instructions

## Fixed Boundary — Do NOT Modify

- `program.md` (this file)
- `benchmarks/` (the benchmark tasks — modifying these is overfitting)
- `experiments/` (logs and snapshots — append-only)
- `team.yaml` (agent roster)
- `~/.pi/agent/AGENTS.md` (global safety rules)
- Any other team's files
- Any files outside the edit surface above

## Improvement Axes

### 1. Verification Coverage in Dispatch Pipelines
The dispatcher defines reference pipelines but treats them as optional patterns.
Work frequently flows without review — a planner produces a plan and the builder
executes it without the reviewer checking it first, or the builder finishes and
the tester is never dispatched. Strengthen the dispatcher's guidance so that
skipping verification is the conscious exception, not the default. The dispatcher
should have clearer criteria for when verification can be safely skipped (trivial
changes, single-file edits) versus when it must happen (multi-file changes,
security-sensitive work, unfamiliar codebase areas).

### 2. Adaptive Failure Recovery
Agents currently lack explicit guidance for detecting and recovering from failing
approaches. The investigator will retry auth 20 times instead of pivoting to a
different data source. The scout will re-run the same grep pattern with minor
variations. Add "pivot triggers" to agent definitions — explicit thresholds
(e.g., 3 consecutive failures of the same approach) that instruct the agent to
stop, reassess, and try a fundamentally different strategy. This should be in
individual agent instructions, not just dispatcher-level retry logic.
*(See also axis 7 for agent-specific failure scenarios — this axis covers the
general pivot mechanism; axis 7 covers the per-agent failure catalogs.)*

### 3. Web-Searcher Integration into Standard Workflows
The web-searcher is currently positioned as an on-demand tool dispatched only when
the user explicitly asks for web research or when the dispatcher independently
decides to look something up. It should be woven into standard pipelines: the
planner should consult web-searcher for best practices before designing a solution,
the builder should have guidance to flag when web research would help (unfamiliar
APIs, deprecated patterns), and the reviewer should consider whether the
implementation follows current community standards. Update the dispatcher pipelines
and individual agent instructions to create natural integration points.

### 4. Output Self-Containment for Downstream Handoff
Each agent's output becomes the next agent's input through the dispatcher, but
agents don't always produce self-contained output. A scout report might reference
"the pattern I found" without quoting it. An investigator diagnosis might say
"the issue is in the auth module" without specifying the file and line. When
output is ambiguous, the downstream agent either guesses wrong or asks the
dispatcher for clarification (adding a round-trip). Tighten the output format
requirements in each agent's instructions so that every handoff artifact contains
enough context to act on without re-reading the codebase.

### 5. Dispatcher Routing Precision
The dispatcher's routing guidance is principle-based ("choose the right agent")
rather than pattern-based. Common request patterns should have clearer routing
rules: bug reports → investigator first (not scout), "how does X work" → scout
first (not investigator), performance issues → investigator with profiling focus,
security concerns → red-team. The dispatcher should also have guidance for
multi-agent workflows where the first agent's output determines the second
agent's task — currently, the dispatcher re-interprets at each step rather than
following a pre-committed flow.

### 6. Context Compression Awareness
Agents operate within context windows that can fill up during long tasks. The
builder reading a full plan, exploring the codebase, and implementing changes
can exhaust its context before verification. Agents need awareness of their own
context budget — guidance on when to summarize intermediate findings rather than
accumulating raw output, when to split work into smaller dispatches, and how to
produce compact but complete handoff artifacts. This is especially important for
the investigator and scout, which can produce enormous amounts of raw codebase
content. Target files: context.md for shared compression principles, expertise/*.md
for agent-specific context budget guidance.

### 7. Agent-Specific Failure Recovery Patterns
*(Complements axis 2: axis 2 defines the general pivot mechanism; this axis
defines per-agent failure catalogs with concrete expected behaviors.)*
Agents handle the happy path well but lack guidance for their most common failure
scenarios. The builder proceeds past failing baselines without escalating. The
reviewer falls back to surface-level review when it can't find the referenced
plan file. The tester runs generic test commands when plan-specific validation
commands fail to parse. Add the 2-3 most likely failure scenarios to each agent's
instructions with explicit expected behavior — not exhaustive error catalogs, but
targeted guidance for the failures that actually occur in this pipeline.

### 8. Cross-Agent Verification Expectations
Agents don't know what other agents will check. The builder doesn't know the
reviewer will verify file existence, so it doesn't prioritize flagging new files.
The planner doesn't know the tester will run validation commands, so it writes
vague validation sections. Add brief "downstream expectations" notes to each
agent — what the next agent in the pipeline will check, so the current agent can
produce output that's optimized for that verification. Target files: context.md
for a shared "downstream expectations" section, rather than modifying each
individual agent definition.

### 9. Autonomous Learning and Mental Model Growth
Agents have tools to record session notes and update their expertise files, but
historically most agents underutilize them. Only a few agents (scout, planner)
actively capture learnings. The mental-model skill now provides explicit
guidance on when and how to record notes, but agents need reinforcement in their
individual instructions or shared context to actually follow through. The goal
is compounding improvement: each dispatch should make the agent slightly more
effective for the next one. The dispatcher should also leverage accumulated
agent knowledge — checking if an agent has relevant expertise before choosing
who to dispatch, and noting when agents have prior session context on a topic.

### 10. Parallel Dispatch for Independent Work
The dispatcher now has a `dispatch_parallel` tool for running multiple agents
concurrently, but no guidance on when to use it versus sequential dispatch.
The dispatcher needs clear heuristics: independent context-gathering (scout +
web-searcher) should run in parallel; sequential dependencies (plan → build →
test) should not. Overuse of parallel dispatch wastes resources if agents
duplicate work; underuse wastes time on tasks that could overlap. The
dispatcher's routing guidance should include patterns for identifying
parallelizable work.

### 11. Execution Efficiency
Agents and the dispatcher should minimize total work while maintaining output quality.
This means fewer dispatches for simple tasks, parallel context-gathering by default,
proportionate pipeline depth, concise agent output, and agents that stay within scope.
The benchmark suite now includes efficiency-focused benchmarks (15–20) that create
optimization pressure alongside quality benchmarks.

## Keep / Discard Rules

- If benchmark aggregate improved → keep
- If aggregate unchanged and harness is simpler → keep
- If any benchmark regressed by >1.0 point → discard (even if aggregate improved)
- Otherwise → discard

**Scoring method:** Each benchmark score = weighted average of criterion scores
on a 0–5 scale. Aggregate = mean of all benchmark scores. A regression of >1.0
on the 0–5 scale for any individual benchmark triggers the discard rule.

## Simplicity Criterion

Simpler means fewer special-case rules in dispatcher routing, shorter agent
instructions that achieve the same coverage, and less redundancy between
context.md and individual agent definitions. The team should get smarter through
better principles, not longer checklists. If an improvement adds more than 20
lines to any single file, it should demonstrably replace or consolidate existing
content rather than just appending.

## Overfitting Rule

Do not add benchmark-specific hacks, keyword-triggered routing rules, or
instructions that only help one specific scenario.

Test: "If this exact benchmark disappeared, would this still be a worthwhile
improvement?" If no, it's overfitting.
