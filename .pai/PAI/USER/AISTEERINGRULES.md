# User AI Steering Rules — Personal Overrides

Personal behavioral overrides for PAI. Loaded after `PAI/AISTEERINGRULES.md`. This file takes precedence over system rules.

---

## GitHub Identities

- Personal repos use SSH host alias `github-personal`. Work repos use `github.com`.
- Do NOT switch personal repos to `git@github.com:...`.
- Full SSH config details, key paths, and troubleshooting: `~/.pai/PAI/USER/GITHUB_AUTH.md` (load on demand).

## Keep Projects Organized

**Before creating new files:** search first, place correctly, group similar things.

**Documentation:** no `.md` files in project root. Use `docs/`:
- `docs/getting-started/` (tutorials), `docs/guides/` (how-to), `docs/reference/` (API/specs), `docs/development/` (contributing).
- Create `docs/README.md` as nav hub if 3+ docs.

**Scripts:** no scripts in project root. Use `scripts/<domain>/` (group by what it DOES, not language). Create `scripts/README.md` as catalog if 3+ scripts.

**Project root:** target ≤20 items. OK in root: README.md, AGENTS.md, package.json, .env.example, main entry, configs, dotfiles. NOT in root: scripts, docs, temp files, investigation outputs.

**When root has 25+ items or many loose scripts/docs:** alert me, suggest reorganization, offer to help.
