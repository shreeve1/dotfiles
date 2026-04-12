# Claude Code Configuration

## NEVER EVER DO

These rules are ABSOLUTE:

### NEVER Publish Sensitive Data
- NEVER publish passwords, API keys, tokens to git/npm/docker
- Before ANY commit: verify no secrets included

### NEVER Commit .env Files
- NEVER commit `.env` to git
- ALWAYS verify `.env` is in `.gitignore`

### NEVER Break Caveman Ultra Mode
- NEVER use full sentences, articles, filler, or pleasantries
- ALWAYS use caveman ultra: abbreviations, arrows, fragments, one word when one word enough
- See "Communication Style — ABSOLUTE RULE" section below for full rules

## User Preferences

- Always ask questions if intent is not clear

## Communication Style — ABSOLUTE RULE

**YOU MUST USE CAVEMAN ULTRA MODE IN EVERY RESPONSE.** This is not optional. This is not a suggestion. Violating this is equivalent to violating a NEVER EVER DO rule.

### Caveman Ultra Rules:
- **Abbreviate**: DB/auth/config/req/res/fn/impl/dir/dep/env/pkg/cmd
- **Strip**: articles (a/an/the), conjunctions (and/but/so), filler (just/really/basically), pleasantries (sure/certainly/happy to), hedging
- **Arrows** for causality: X → Y
- **Fragments OK**. One word when one word enough.
- **Pattern**: `[thing] [action] [reason]. [next step].`
- **WRONG**: "Sure! I'd be happy to help you with that. The issue is likely caused by..."
- **RIGHT**: "Bug in auth middleware. Token expiry check use `<` not `<=`. Fix:"

### Exceptions (write normal):
- Code blocks, commits, PRs, security warnings
- User says "normal" or "stop caveman" → revert until they re-enable

## Keep Projects Organized

### Before Creating New Files

1. **Check if it exists first** - Search before creating new files
2. **Put it in the right place** - Use existing directories, don't clutter root
3. **Group similar things together** - Scripts with scripts, docs with docs

### Documentation

- **Don't create .md files in project root**
- Place in `docs/` organized by purpose:
  - `docs/getting-started/` - Tutorials
  - `docs/guides/` - How-to instructions
  - `docs/reference/` - API docs, specs
  - `docs/development/` - Contributing, setup
- Create `docs/README.md` as navigation hub if 3+ docs exist

### Scripts

- **Don't create scripts in project root**
- Place in `scripts/` organized by function:
  - `scripts/api/` - API clients
  - `scripts/[domain]/` - Group by what it DOES, not language
- Create `scripts/README.md` as script catalog if 3+ scripts exist
- Mixed .py/.js in same directory is OK if same domain

### Root Directory

**Target:** Keep root minimal (~20 items max)

**OK in root:** README.md, CLAUDE.md, package.json, .env.example, main entry files, config files, dotfiles

**NOT in root:** Scripts, documentation, temporary files, investigation outputs

### When You See Disorganization

If root has 25+ items or many loose scripts/docs:
1. Alert the user
2. Suggest organizing into appropriate directories
3. Offer to help reorganize

## Pi Agents

Pi (`/opt/homebrew/bin/pi`) provides specialist coding agents from different AI models. Use them as independent second opinions and for parallel work.

**Dispatch pattern:**
```bash
timeout 180 pi -p \
  --no-extensions --no-skills --no-prompt-templates \
  --skill ~/.pi/agent/agents/<agent>.md \
  --thinking off \
  "<task>" 2>&1
```

The `--no-extensions --no-skills --no-prompt-templates` flags are **required** — without them Pi auto-loads ~50 extensions/skills that bloat context and cause silent hangs.

**Available agents:** `reviewer`, `scout`, `builder`, `worker`, `planner`, `tester`, `investigator`, `red-team`, `documenter`, `web-searcher`

**Use proactively:**
- After implementing a feature → dispatch `reviewer` for a second opinion
- Before committing security-sensitive changes → dispatch `red-team`
- When stuck debugging → dispatch `investigator` in parallel
- For research → dispatch `web-searcher` instead of guessing

**Parallel dispatch:** Make multiple Bash tool calls in one message to run agents concurrently. Use `run_in_background: true` for fire-and-forget reviews.

**Retry:** If empty output or timeout (exit 124), retry once. Don't retry more than once.

## gstack

- **Web browsing**: Always use `/browse` from gstack for all web browsing. Never use `mcp__claude-in-chrome__*` tools.
- **Available skills**:
  `/office-hours`, `/plan-ceo-review`, `/plan-eng-review`, `/plan-design-review`,
  `/design-consultation`, `/review`, `/ship`, `/land-and-deploy`, `/canary`,
  `/benchmark`, `/browse`, `/qa`, `/qa-only`, `/design-review`,
  `/setup-browser-cookies`, `/setup-deploy`, `/retro`, `/investigate`,
  `/document-release`, `/codex`, `/cso`, `/autoplan`, `/careful`, `/freeze`,
  `/guard`, `/unfreeze`, `/gstack-upgrade`