# dotfiles — Agent Notes

This is **James's dotfiles repo**. It is the source of truth for `~/.config/opencode`, `~/.pai/PAI`, parts of `~/.claude`, `~/.codex`, `~/.pi`, and shell/editor config. Files in `~/.config/opencode/`, `~/.pai/PAI/`, etc. are **symlinks back to this repo** — editing the live file edits the source.

The global PAI rules, mode classifier, and delegation guide live at `~/.config/opencode/AGENTS.md` (which is this repo's `.config/opencode/AGENTS.md`). Read it for the mode system, identity, and behavior contracts. This file only adds **dotfiles-specific** context.

## Editing Conventions

- **Edit the source in `~/dotfiles/`, not the symlinked target.** All `~/.config/opencode/*`, `~/.pai/PAI/*`, etc. live in this repo. The live paths and the repo paths are the same inode.
- **Don't break the symlink graph.** Never `rm` a target and replace with a regular file — re-run `./install.sh` if a link is missing or wrong.
- **`install.sh` is idempotent.** Backs up existing files, then `ln -s`. Safe to re-run.
- **Excluded paths** (per `is_excluded_pai_path` in `install.sh`): `MEMORY/`, `State/`, `Scratchpad/`, `*.log`, `*.jsonl`, `secrets.*`, `config/local*.json`. These are local-only and never symlinked.

## LLM Wiki

This project uses `wiki/` as an LLM-maintained knowledge base for PAI dotfiles, OpenCode configuration, PAI runtime, skills, agents, plugins, install behavior, and operational workflows.

### Directories

- `wiki/raw/`: immutable source material; read and cite it, but do not rewrite it after ingest.
- `wiki/candidates/`: generated pages awaiting James approval before promotion.
- `wiki/sources/`: promoted source summaries.
- `wiki/entities/`: promoted entity pages.
- `wiki/concepts/`: promoted concept pages.
- `wiki/analyses/`: promoted query outputs and syntheses.
- `wiki/raw/assets/`: source attachments clipped with raw material.
- `wiki/assets/`: local images and attachments.

### Required Files

- Read `wiki/index.md` before wiki-backed answers, then use `wiki/ROUTING.md` to narrow broad searches.
- Append every ingest, query save, lint, and promotion to `wiki/log.md`.
- Track important factual claims in `wiki/CLAIMS.md` with inline path citations.
- Generated Markdown wiki files are intended to be committed to git; do not add raw-source `.gitignore` rules without explicit approval.
- Raw-source git policy is source-specific: ask before adding large/binary raw files, ignoring raw paths, or moving raw sources to external storage.

### Ingest Workflow

1. Add the source under `wiki/raw/` without rewriting it after ingest.
2. Summarize the source with citations to the raw path.
3. Discuss key takeaways or emphasis with James when the source is substantial, ambiguous, or likely to touch multiple pages.
4. Extract entities, concepts, contradictions, and atomic claims.
5. Create new pages in `wiki/candidates/` unless the edit is low-risk maintenance.
6. Update the `wiki/index.md` candidate queue, `wiki/ROUTING.md`, and `wiki/CLAIMS.md` with cited candidate entries.
7. Append an entry to `wiki/log.md`.

### Query Workflow

1. Read `wiki/index.md` to identify relevant promoted pages and candidates.
2. Read `wiki/ROUTING.md` to narrow broad searches.
3. Read only relevant promoted pages and claim entries.
4. Answer with citations to wiki pages or raw sources.
5. Offer to save durable query outputs as `wiki/candidates/<slug>.md`.

### Promotion Workflow

1. Confirm James approved the candidate promotion.
2. Review the candidate page for citations, confidence, and duplicates.
3. Move it to `sources/`, `entities/`, `concepts/`, or `analyses/`.
4. Set `status: promoted` and update timestamps.
5. Update `index.md`, `ROUTING.md`, `CLAIMS.md`, and `log.md`.

### Discard Workflow

When James rejects a candidate, remove its candidate index row, candidate-only routes, and candidate claim page references before deleting the candidate file. Append a discard entry to `wiki/log.md`.

### Lint Workflow

Check broken wikilinks, orphan pages, duplicate concepts, uncited claims, stale claims, contradictions, missing concept pages, data gaps, stale candidate references, missing index/routing entries, and stale candidates. Report findings before making broad changes or candidate cleanup.

## Key Directories

| Path in repo | Live target | Purpose |
|---|---|---|
| `.config/opencode/` | `~/.config/opencode/` | opencode config, agents, modes, plugins, skills |
| `.config/opencode/AGENTS.md` | `~/.config/opencode/AGENTS.md` | Global PAI mode classifier + delegation guide |
| `.config/opencode/opencode.json` | same | Provider config, agent registry, plugin list, `instructions[]` |
| `.config/opencode/plugins/` | same | TypeScript plugins (pai-mode-router, pai-isa-sync, etc.) |
| `.config/opencode/agents/` | same | Subagent definitions (`*.md` with frontmatter) |
| `.config/opencode/skills/` | same | Skills used by both opencode and `~/.pai/skills` (via skills→opencode/skills symlink) |
| `.pai/PAI/` | `~/.pai/PAI/` | Shared PAI runtime (Algorithm, AISTEERINGRULES, USER/, CONTEXT_ROUTING) |
| `.pai/PAI/AISTEERINGRULES.md` | same | System-level behavior rules, loaded via `instructions[]` |
| `.pai/PAI/USER/AISTEERINGRULES.md` | same | User-specific overrides, loaded via `instructions[]` |
| `.pai/src/`, `.pai/tests/` | `~/.pai/src/`, `~/.pai/tests/` | PAI TypeScript source (memory CLI, wiki, distill) |
| `.claude/` | `~/.claude/` (partial) | Claude Code config; uses same PAI source files |
| `.codex/AGENTS.md` | `~/.codex/AGENTS.md` | Codex CLI agent context |
| `.pi/agent`, `.pi/agent-sessions` | same | pi-coding-agent runtime |
| `bin/` | (on `PATH`) | Local helper scripts |
| `scripts/` | runtime helpers | Cron, status, install helpers |

## Plugin Source Locations

opencode plugins are TypeScript files loaded directly (no build step). Editing the `.ts` reloads on next opencode start.

- `pai-mode-router` — classifies prompts into MINIMAL / NATIVE / ALGORITHM, scaffolds ISAs, enforces algorithm-lite todowrite-first
- `pai-checkpoint-per-isc` — git checkpoints on ISC completion
- `pai-isa-sync` — syncs ISA edits across sessions
- `pai-containment-guard` — blocks unsafe ops
- `pai-config-audit` — flags drift between config files
- `pai-reflection-loop` — periodic self-reflection
- `pai-pi-perspective` — pi second-mind review integration
- `terminal-bell` — audible completion bell

Plugin tests live next to source (e.g. `pai-mode-router/index.test.ts`). Run with `bun test` from the plugin directory.

## Skills

`~/.pai/skills` is a symlink to `~/.config/opencode/skills` (set up by `install.sh`). One skill tree serves both Claude Code and opencode. Skill source paths in registries should use `~/.pai/skills/...` for portability.

**Important:** skill `References/` data lives under `.claude/skills/<Name>/References/` in this repo for some legacy skills (e.g. Automation's `cron-jobs.json`). New skills should go under `.config/opencode/skills/<Name>/References/`. If a skill says it can't find its registry, check both locations.

## Cron / Automation

The Automation skill registry is at `.claude/skills/Automation/References/cron-jobs.json` (this repo). The deterministic installer is `.claude/skills/Automation/Tools/install-cron.ts`. Run `install-cron.ts diff` before `apply`.

## Git Repos in the Worktree

This is itself a git repo (`origin: github-personal:shreeve1/dotfiles`). Nested git repos under `.pai/`, `.claude/PAI/`, etc. are subtrees, not submodules — treat them as part of this repo unless you see a `.gitmodules`.

## Common Pitfalls

- **CLAUDE.md is not read by opencode.** Only `AGENTS.md` (this file, plus the global one) is loaded. Don't add opencode-relevant rules to `.claude/CLAUDE.md` and expect opencode to see them.
- **Skill text in chat messages misclassifies mode.** When a skill SKILL.md is auto-prepended to a user prompt, the mode router classifies the skill body. The router has logic to strip auto-injected skill preambles before classifying — if a session escalates to ALGORITHM-durable unexpectedly, this is the likely cause.
- **Don't edit `.claude/PAI/` and `.pai/PAI/` separately** — they point at the same files in this repo. Edit once.
- **`opencode.json` `instructions[]` paths must use `~`**, not absolute `/home/james/...` — opencode expands `~` for these.

## Quick Diagnostics

```sh
# Verify all symlinks intact
./install.sh

# What instructions get loaded at session start
cat ~/.config/opencode/opencode.json | jq .instructions

# Current mode router state (per-session classification, slug, ISA path)
cat ~/.pai/memory/STATE/mode-router.json | jq .

# Active opencode sessions in the DB
sqlite3 ~/.local/share/opencode/opencode.db "SELECT id, slug, title, time_updated FROM session ORDER BY time_updated DESC LIMIT 10;"
```
