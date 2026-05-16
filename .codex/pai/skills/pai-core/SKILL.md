---
name: "pai-core"
description: "PAI OpenCode orientation: use for PAI architecture, memory routing, current runtime paths, troubleshooting context, future-session handoff, and safe update conventions."
---

# PAI Core

Use this skill when a task asks about PAI itself: architecture, memory routing, current OpenCode runtime conventions, troubleshooting, updating, fine-tuning, or giving a future AI session enough context to work safely.

## Current Runtime

PAI is currently OpenCode-native.

Active source-of-truth paths:

- PAI runtime root: `~/.pai/PAI/`
- PAI memory root: `~/.pai/memory/`
- OpenCode config root: `~/.config/opencode/`
- OpenCode global instructions: `~/.config/opencode/AGENTS.md`
- OpenCode config: `~/.config/opencode/opencode.json`
- OpenCode skills: `~/.config/opencode/skills/`
- OpenCode agents: `~/.config/opencode/agents/`
- OpenCode modes: `~/.config/opencode/modes/`
- OpenCode mode router: `~/.config/opencode/plugins/pai-mode-router/`
- Active Algorithm doctrine: `~/.pai/PAI/Algorithm/v6.3.0.md`
- Active context router: `~/.pai/PAI/CONTEXT_ROUTING.md`
- System steering rules: `~/.pai/PAI/AISTEERINGRULES.md`
- James's steering overrides: `~/.pai/PAI/USER/AISTEERINGRULES.md`

Legacy Claude-side or Codex-side references may exist as historical material or compatibility artifacts. Do not treat them as active runtime dependencies unless a tool call proves the active OpenCode path still invokes them.

## When To Use

Use `pai-core` for:

- Understanding how the current PAI/OpenCode system is organized
- Finding the right source-of-truth file before troubleshooting
- Updating or fine-tuning PAI behavior, instructions, skills, agents, hooks, or memory
- Preparing a future-session handoff for AI assistants
- Distinguishing active runtime dependencies from historical Claude/Codex material
- Recovering from stale context in an AI session

Do not use this skill as a replacement for reading the exact active files. It is a routing map, not proof of current state.

## Startup Sequence For Future Sessions

When a future AI session needs context for PAI work:

1. Read any supplied ISA first.
2. If no ISA is supplied, use `ContextSearch` for the topic.
3. Read `~/.config/opencode/AGENTS.md` for OpenCode-specific operating rules.
4. Read `~/.pai/PAI/Algorithm/v6.3.0.md` for Algorithm doctrine if the task is non-trivial.
5. Read `~/.pai/PAI/CONTEXT_ROUTING.md` when user, project, PAI internals, or specialized topic context is needed.
6. Inspect the relevant runtime files directly before changing behavior.
7. Verify with focused tests, greps, builds, or runtime probes before claiming success.

Recommended handoff prompt:

```text
context search: Continue PAI OpenCode system work. Start from the supplied ISA if present. I may need troubleshooting, updating, or fine-tuning around OpenCode config, PAI runtime paths, skills, agents, memory, or Algorithm behavior.
```

For the 2026-05-10 OpenCode decoupling work, use this ISA:

```text
/home/james/.pai/memory/WORK/20260510-130951_have-just-decoupled-pai-system-claude-attempts-compltely/ISA.md
```

## Memory Routing

Current memory root: `~/.pai/memory/`.

Important memory areas:

- `WORK/`: active and archived task ISAs, work artifacts, verification records
- `STATE/`: operational state such as mode routing, session names, current work, and caches
- `LEARNING/`: reusable lessons, corrections, failures, reflections, and patterns
- `OBSERVABILITY/`: classifier and runtime observability logs
- `VERIFICATION/`: review, Cato, and verification artifacts when present
- `RESEARCH/`: research artifacts and durable research context when present

Task ISAs usually live at:

```text
~/.pai/memory/WORK/{slug}/ISA.md
```

Project ISAs may live in the project repo as:

```text
<project>/ISA.md
```

## Core Subsystems

### Algorithm

The active Algorithm is `v6.3.0` at `~/.pai/PAI/Algorithm/v6.3.0.md`.

The Algorithm phases are:

```text
OBSERVE -> THINK -> PLAN -> BUILD -> EXECUTE -> VERIFY -> LEARN
```

The ISA is the system of record for non-trivial work. Criteria are ISCs: atomic, verifiable ideal-state criteria.

### OpenCode Instructions

OpenCode loads global operating rules from `~/.config/opencode/AGENTS.md` and config from `~/.config/opencode/opencode.json`.

Important current safety convention:

- Broad OpenCode permissions should default to `ask`, not `allow`.
- `--dangerously-skip-permissions` should only be opt-in, currently via `PAI_OPENCODE_AUTO_APPROVE=1` where supported.

### Skills

Active OpenCode skills live under `~/.config/opencode/skills/`.

The OpenCode skills tree contains native OpenCode skills plus forked PAI cognitive skills. The forked PAI skills are real directories, not symlinks. The Claude-side originals are historical and do not automatically sync.

### Agents

Active OpenCode agents live under `~/.config/opencode/agents/`.

Use OpenCode subagent names such as `pai-engineer`, `pai-architect`, `forge`, `cato`, `explorer`, `validator`, and browser/devtools specialists. Do not assume Claude Code agent names or `TaskCreate`/`TaskList`/`TaskUpdate` APIs exist unless the active environment proves they do.

### Inference

PAI inference should route through:

```text
~/.pai/PAI/Tools/Inference.ts
```

The current OpenCode wrapper preserves system prompts as a distinct `<system_instructions>` section inside the OpenCode message because OpenCode does not expose a direct `--system-prompt` flag in the verified CLI surface.

### Automation

OpenCode-side Automation should use `opencode run`, not `claude -p`, for active LLM investigation paths.

Cron wrappers should use `OPENCODE_BIN` for OpenCode runner scripts.

## Safe Update Rules

When updating PAI itself:

- Read the exact active file before editing.
- Make the smallest correct change.
- Preserve historical/compatibility material unless James explicitly asks to delete it.
- Distinguish stale prose from active runtime dependencies.
- Update the active ISA with decisions, criteria, and verification evidence for non-trivial work.
- Add focused regression tests for any runtime contract you change.
- Verify with the most specific available probe: grep, read, focused tests, build, typecheck, or a safe runtime command.
- Do not claim the system is updated until the relevant active paths are verified.

## Known 2026-05-10 Decoupling State

The OpenCode decoupling work verified these current facts:

- `.pai/PAI` is real repo-managed content, not symlinks into `.claude/PAI`.
- `.config/opencode/skills` contains real directories, not symlinks.
- Active OpenCode config and frontmatter broad permissions should default to `ask`.
- Algorithm and Ralph OpenCode runs gate dangerous auto-approval behind explicit opt-in.
- `Inference.ts` uses `opencode run` and preserves system instructions in-message.
- OpenCode Automation webhook uses `opencode run`, not `claude -p`.
- Dedicated runtime typecheck coverage exists via `.pai/tsconfig.runtime.json`.

Remaining known follow-up from that session:

- Strengthen `.pai/PAI/ACTIONS/lib/types.v2.ts` `validateSchema()` beyond shallow top-level primitive checks if Actions v2 will rely on JSON Schema validation semantics.

## Related Skills

Use these skills alongside `pai-core`:

- `ContextSearch`: recover prior work, session memory, ISAs, and decisions
- `mem`: browse or manage durable memory artifacts
- `save`: persist reusable handoff notes or conventions
- `BitterPillEngineering`: audit instruction sets for stale or redundant rules
- `create-skill`, `skill-creator`, or `write-a-skill`: update or create skills

## Verification Checklist

Before relying on this skill after future system changes, verify:

- `~/.pai/PAI/Algorithm/v6.3.0.md` still exists or update the version here.
- `~/.config/opencode/AGENTS.md` still names current runtime conventions.
- `~/.config/opencode/opencode.json` still points at active PAI instruction files.
- `~/.pai/memory/WORK/` is still the active task ISA home.
- Any remaining Claude/Codex references are historical, compatibility-only, or intentionally scoped.
