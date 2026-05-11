# OpenCode Skills

Two kinds of skills live here:

1. **Native OpenCode skills** — real directories authored for OpenCode (kebab-case names: `aws-*`, `chrome-devtools`, `kanban`, `tdd`, `mermaid`, etc.).
2. **Forked PAI cognitive skills** — real directories (TitleCase names: `ISA`, `RedTeam`, `Council`, `Thinking`, `Investigation`, etc.) that were originally PAI skills under `~/dotfiles/.claude/skills/`. They were copied here on 2026-05-10 and translated for OpenCode (subagent names, runtime paths, env vars). The Claude-side originals are unchanged. The two trees diverge from this point forward — edits on one side do NOT propagate to the other.

## Forked-skill translation (what was changed from the Claude-side originals)

When the 46 PAI skills were forked into this tree, the following mechanical rewrites were applied so the OpenCode versions run cleanly without `~/.claude/`:

- **Runtime path:** `~/.claude/PAI/...` → `~/.pai/PAI/...`; `~/.claude/MEMORY/...` → `~/.pai/memory/...`; other `~/.claude/...` reads → `~/.pai/...`
- **Project-local conventions:** `.claude/agents/` → `.opencode/agent/`; `.claude/commands/` → `.opencode/command/`; `.claude/skills/` → `.opencode/skill/`; `.claude/hooks/` → `.opencode/hook/`
- **Subagent types** (mapped to existing OpenCode agents in `.config/opencode/agents/*.md` and `opencode.json`):
  - `general-purpose` → `general`
  - `Architect` → `pai-architect`
  - `Engineer` → `pai-engineer`
  - `GeminiResearcher` → `gemini-researcher` (new OpenCode agent — multi-perspective decomposition)
  - `PerplexityResearcher` → `perplexity-researcher` (new OpenCode agent — investigative source verification)
  - `GrokResearcher` → `grok-researcher` (new OpenCode agent — contrarian fact-seeking)
  - `ClaudeResearcher` → `claude-researcher` (new OpenCode agent — strategic synthesis)
  - `BrowserAgent` → `browser-automation`
  - `UIReviewer` → `ui-reviewer`
  - `Designer` / `Silas` / `Intern` / `AgentType` → `general`
  - `explorer` → `explorer` (already correct on both sides)
- **Env vars:** `CLAUDE_SESSION_ID` → `OPENCODE_SESSION_ID`
- **Skill-tree path references:** `~/.pai/skills/<Name>/...` → `${PAI_DIR:-$HOME/.pai}/skills/<Name>/...` in inline shell/path examples. The actual on-disk location of forked PAI cognitive skills is `~/.config/opencode/skills/<Name>/`. `install.sh` creates a `~/.pai/skills` symlink pointing at `~/.config/opencode/skills` so the templated paths resolve at runtime in the default install. Setting `PAI_DIR` to a custom location works as long as `$PAI_DIR/skills` resolves to the OpenCode skills directory you want to use.
- **Tool code (`.ts` / `.sh` / `.py`):** rewritten to honor `PAI_DIR` env var with `~/.pai` fallback. Examples: `Agents/Tools/LoadAgentContext.ts`, `Agents/Tools/ComposeAgent.ts`, `Automation/Tools/cron-wrapper.sh`, `Media/Art/Tools/Generate*.ts`, `Telos/Tools/UpdateTelos.ts`, `Utilities/PAIUpgrade/Tools/Anthropic.ts`, `Security/WebAssessment/OsintTools/osint-api-tools.py`.
- **Parallel fan-out workflows** (`Thinking/RedTeam/Workflows/ParallelAnalysis.md`, etc.): annotated with OpenCode-specific Task-tool semantics — fan-out only happens when multiple Task calls are issued in a single assistant message, and each subagent runs in a fresh isolated context.

### Operational migrations (run once on each machine)

**Secrets / cron credentials:** the OpenCode-side `Automation/Tools/cron-wrapper.sh` reads from `$PAI_DIR/secrets/...` (default `~/.pai/secrets/`). If you previously had Claude Code cron jobs reading from `~/.claude/secrets/`, copy those credentials into the new location once on first OpenCode-only setup:

```bash
# Idempotent: only copies files not already present at destination
mkdir -p ~/.pai/secrets
cp -rn ~/.claude/secrets/. ~/.pai/secrets/ 2>/dev/null || true
```

The Claude-side `~/.claude/skills/Automation/Tools/cron-wrapper.sh` is unchanged and still reads from `~/.claude/secrets/`, so any active cron jobs scheduled against the Claude-side path keep working without migration. The migration above only matters if you intend to wire the *OpenCode-side* cron wrapper.

Things intentionally NOT changed:
- `git-guardrails-claude-code/` — this skill is specifically about Claude Code; its `.claude/settings.json` references are correct.
- `Development/Review/Workflows/DeepReview.md` line 227 — that's a Claude CLI auth probe (checks `$HOME/.claude/.credentials.json` and `$HOME/.config/claude/auth.json`), correct as-is.
- `claude.com` URLs — actual external Anthropic documentation links.

## Adding a new PAI skill

Author new OpenCode skills directly in this tree as real directories. Only copy
from `~/dotfiles/.claude/skills/` when intentionally porting an existing legacy
Claude Code skill, then apply the translation passes above before using it.

```bash
mkdir -p ~/dotfiles/.config/opencode/skills/<NewSkill>
```

## Adding an OpenCode-native skill

Author it directly here as a real directory with `SKILL.md` + `recipe.yaml`. See `create-skill/`, `skill-creator/`, or any of the existing kebab-case skills as a template.
