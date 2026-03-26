# Claude Code Configuration

## NEVER EVER DO

These rules are ABSOLUTE:

### NEVER Publish Sensitive Data
- NEVER publish passwords, API keys, tokens to git/npm/docker
- Before ANY commit: verify no secrets included

### NEVER Commit .env Files
- NEVER commit `.env` to git
- ALWAYS verify `.env` is in `.gitignore`

## User Preferences

- Always ask questions if intent is not clear

```

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

## gstack

- **Web browsing**: Always use `/browse` from gstack for all web browsing. Never use `mcp__claude-in-chrome__*` tools.
- **Available skills**:
  `/office-hours`, `/plan-ceo-review`, `/plan-eng-review`, `/plan-design-review`,
  `/design-consultation`, `/review`, `/ship`, `/land-and-deploy`, `/canary`,
  `/benchmark`, `/browse`, `/qa`, `/qa-only`, `/design-review`,
  `/setup-browser-cookies`, `/setup-deploy`, `/retro`, `/investigate`,
  `/document-release`, `/codex`, `/cso`, `/autoplan`, `/careful`, `/freeze`,
  `/guard`, `/unfreeze`, `/gstack-upgrade`