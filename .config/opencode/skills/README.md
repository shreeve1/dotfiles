# OpenCode Skills

Two kinds of skills live here:

1. **Native OpenCode skills** — real directories authored for OpenCode (kebab-case names: `aws-*`, `chrome-devtools`, `kanban`, `tdd`, `mermaid`, etc.).
2. **PAI cognitive skills** — relative symlinks into `../../../.claude/skills/` (TitleCase names: `ISA`, `RedTeam`, `Council`, `Thinking`, `Investigation`, etc.).

## PAI symlink bridge

The 45 PAI symlinks make the Claude-side cognitive library available to OpenCode unchanged. Edits in `.claude/skills/<X>/` propagate to OpenCode immediately. The bridge is portable: relative paths so the dotfiles repo works from any checkout location.

## Known compatibility caveats for PAI skills on OpenCode

Some PAI skills were written against Claude Code's `Task` tool contract. They will not work as-written on OpenCode without rewriting their `subagent_type` calls to OpenCode agent names from `opencode.json`:

| Skill | Issue | Notes |
|---|---|---|
| `Agents/Workflows/CreateCustomAgent.md` | hardcodes `subagent_type: "general-purpose"` | OpenCode has `general` (no `-purpose`); needs rewrite per workflow |
| `Agents/Workflows/SpawnParallelAgents.md` | same | |
| `Council/*` and `Thinking/Council/*` | invokes parallel `general-purpose` subagents | OpenCode equivalent: `explore` or `general` |
| `RedTeam/Workflows/ParallelAnalysis.md` | "Deploy 32 agents in a SINGLE message" — relies on Claude's Task fan-out semantics | OpenCode's Task tool works but agent list differs |
| `Utilities/Delegation/SKILL.md` | references Claude-side delegation patterns | |
| `Utilities/PAIUpgrade/Workflows/Upgrade.md` | uses `${CLAUDE_SESSION_ID}` | OpenCode has different session env |
| `ContextSearch/SKILL.md` | uses `$ARGUMENTS` slash-command convention | OpenCode commands take args differently |
| `Development/Stories/*` | uses `$ARGUMENTS` | |

OpenCode agent types (from `opencode.json`): `build`, `plan`, `general`, `compaction`, `librarian`, `explore`, `document-writer`, `quick-review-opus`, `quick-review-codex`, `infra-scout`, `infra-planner`, `infra-validator`, `executor-ssh`, `executor-powershell`, `pai-algorithm`, `pai-engineer`, `pai-architect`.

## Adding a new PAI skill from Claude side

```bash
cd ~/dotfiles/.config/opencode/skills/
ln -s ../../../.claude/skills/<NewSkill> <NewSkill>
```

## Adding an OpenCode-native skill

Author it directly here as a real directory with `SKILL.md` + `recipe.yaml`. See `create-skill/`, `skill-creator/`, or any of the existing kebab-case skills as a template.
