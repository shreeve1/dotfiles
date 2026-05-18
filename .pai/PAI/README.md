# PAI — Personal AI Infrastructure

PAI is a general problem-solving system that magnifies human capabilities. It runs inside OpenCode as an interconnected set of skills, plugins, tools, memory, and configuration — all orchestrated by The Algorithm.

## How It Works

**OpenCode configuration** in `~/.config/opencode/` is the active runtime surface. It defines execution modes, The Algorithm, context routing, plugins, agents, skills, providers, and permissions.

**This directory (`PAI/`)** contains all system documentation, tools, user context, and the SKILL.md that defines PAI as a skill. The rest of the system lives alongside it under `~/.pai/` (hooks, skills, settings, memory).

## Directory Structure

```
~/.pai/
  memory/                      # Persistent memory (work, learning, relationship, state)
  PAI/                         # This directory — system docs + tools + user context
    Algorithm/                 # Versioned algorithm files + LATEST pointer
```

## Core Subsystems

### The Algorithm (`PAI/Algorithm/`)
The 7-phase execution engine: Observe, Think, Plan, Build, Execute, Verify, Learn. Transitions from CURRENT STATE to IDEAL STATE via verifiable criteria (ISC). Current version: v6.4.0.

### Skills (`SKILLSYSTEM.md`)
12 hierarchical categories with 49 total skills in `~/.config/opencode/skills/`, each with a `SKILL.md` defining triggers, workflows, and tools. Skills are the primary capability unit.

### Hooks (`THEHOOKSYSTEM.md`)
OpenCode plugins across prompt routing, ISA sync, checkpoints, containment, config audit, and reflection. Implemented in `~/.config/opencode/plugins/`.

### Memory (`MEMORYSYSTEM.md`)
Persistent storage across sessions:
- **WORK/** — Session artifacts, ISAs, PRDs, transcripts
- **LEARNING/** — Failure patterns, algorithm reflections, signals
- **STATE/** — Session names, algorithm state, caches

### Tools (`Tools/`)
TypeScript utilities in `PAI/Tools/`: `Inference.ts` (AI calls), `algorithm.ts` (Algorithm CLI), `RebuildPAI.ts`, `SessionProgress.ts`, `Banner.ts`, and more.

### Agents (`PAIAGENTSYSTEM.md`)
OpenCode subagents use lowercase slugs such as `pai-algorithm`, `pai-engineer`, `pai-architect`, `explorer`, and researcher variants. See `docs/reference/opencode-subagents.md` for the active catalog. Custom agents are composed via the Agents skill and launched through `general`.

### Security
OpenCode plugin and permission-based security guards tool access, path containment, command execution, and secret scanning.

### Notifications (`THENOTIFICATIONSYSTEM.md`)
Multi-channel: ntfy, Discord, Twilio. Voice announcements via ElevenLabs at localhost:8888.

### Configuration (`opencode.json`)
Active OpenCode configuration for instructions, modes, agents, providers, plugins, permissions, and MCP servers.

## User Context (`USER/`)

Personal data directory. See `USER/README.md` for full index:
- **Identity:** `ABOUTME.md`, `DAIDENTITY.md`, `WRITINGSTYLE.md`
- **Rules:** `AISTEERINGRULES.md` (personal overrides)
- **Projects:** `PROJECTS/`
- **Life Goals:** `TELOS/` (via Telos skill)
- **Work:** `WORK/`, `BUSINESS/`
- **Skill Overrides:** `SKILLCUSTOMIZATIONS/`

## Startup & Context Loading

At session start, OpenCode loads `opencode.json`, configured instruction files, plugins, agents, skills, and MCP servers. Other documentation loads on-demand based on the active OpenCode routing instructions.

## Build System

| Target | Source | Builder | Trigger |
|--------|--------|---------|---------|
| `CLAUDE.md` | `CLAUDE.md.template` + `settings.json` + `PAI/Algorithm/LATEST` | `bun PAI/Tools/BuildCLAUDE.ts` | SessionStart hook + manual |

## Extending PAI

- **Add a skill:** Use the CreateSkill skill under Utilities
- **Add a hook:** Create handler in `~/.config/opencode/plugins/handlers/`, register in `settings.json`
- **Add startup files:** Append to the startup file list in `settings.json`
- **Add user context:** Create files in `PAI/USER/`
