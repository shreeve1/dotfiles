# Dotfiles — Agent Context

This repo is synced across the user's Linux and Mac machines. Files here become
real config via symlinks installed by `install.sh`.

## Primary agent: DeepSeek Harness (dsh)

The self-hosted DeepSeek Harness (dsh) web UI on `aidev` is the user's main agent
surface; the other tool configs here support it and legacy workflows. See
`docs/deepseek-harness.md` for access, architecture, and recovery.

**Building or installing dsh plugins?** Load the `dsh-plugin-build` skill
first (`.agents/skills/dsh-plugin-build/SKILL.md`) — a dispatcher to the
`dsh-plugin-guide` skill (the plugin contract) and to `docs/deepseek-harness.md`
(the deployment's install/audit rules). Always install via `dsh plugin
--profile web add <spec>`; never hand-stage packages into `node_modules`.
One plugin per restart, and only packages that declare `dsh.bundle` go in
`dsh.profile.bundles` — client-only plugins mount via `- insert:` rows.
See that doc's "Install best practices" for the full list.

## On a fresh machine

Run `bash install.sh` from the repo root. See `README.md` for the full setup
sequence (settings.json seeding, per-machine MCP bootstrap, validation
commands).

## Canonical surfaces

- **AGENTS standard lane (canonical):** `.agents/AGENTS.md` (global agent
  guidance) and `.agents/skills/<name>/SKILL.md`. dsh reads it natively via
  `~/.dsh/AGENTS.md` → `dotfiles/.agents/AGENTS.md` (rank 500 `user-agents`
  for skills). This is the only lane that applies without the model choosing
  to load anything: a skill contributes just its one-line description to
  context until something calls the `skill` tool, which on plain coding tasks
  it does not do. Keep the lane small — it is paid on every turn. Of the 64
  skills, 40 carry `disable-model-invocation: true` (user-invocable only,
  never in the catalog) — that is deliberate, do not "fix" it.
- **Repo-level context:** this file (`AGENTS.md`). dsh's chain is
  `~/.dsh/AGENTS.md` plus `AGENTS.md`/`CLAUDE.md` from project root down to
  cwd; dsh does **not** read `~/.claude/CLAUDE.md`.
- **Claude Code lane (retired 2026-09-10, archive deleted 2026-09-19):**
  nothing in the repo links `~/.claude`. Note: Claude Code reads only
  `CLAUDE.md` as its project doc — it does not auto-load `AGENTS.md` — which is
  why Claude-flavored repos keep the `CLAUDE.md` name.
- See `README.md` § "Canonical vs tool-specific" for the full table.

## Machine topology (NetBird)

Three machines share this repo, all on the self-hosted NetBird mesh
(`*.netbird.selfhosted`). Recorded 2026-09-30 from `netbird status -d`.

| Machine | Role | User | NetBird IP | NetBird DNS name | LAN |
| --- | --- | --- | --- | --- | --- |
| `omarchy` | laptop (Omarchy desktop) | `james` | `100.95.55.243` | `omarchy-55-243.netbird.selfhosted` | - |
| `aidev` | server; hosts dsh web UI | `james` | `100.95.230.15` | `aidev.netbird.selfhosted` | `10.20.20.16` |
| `itan8n` | server; n8n | `itadmin` | `100.95.224.218` | `n8n.netbird.selfhosted` | - |

Every machine can reach every other on port 22. When one machine "can't find"
another, the cause is almost always a name, not the network:

- **Use the NetBird IPv4 address, not a bare name.** Bare names resolve to
  NetBird IPv6 addresses first, and some don't resolve at all.
- **`itan8n` is not a DNS name.** Its NetBird name is `n8n`; `itan8n` works only
  where an SSH alias defines it.
- **`omarchy` is ambiguous.** `omarchy.netbird.selfhosted` is a different peer
  (`100.95.31.143`), not this laptop. This laptop is `omarchy-55-243`.
- **Users differ:** itan8n is `itadmin`, the others `james`. SSH without an
  alias uses the local username and fails on itan8n.
- **SSH aliases (`~/.ssh/config`, machine-local, not in this repo):** each
  machine has aliases for the other two — omarchy: `aidev`, `itan8n`; aidev:
  `itan8n`, `omarchy`; itan8n: `aidev`, `omarchy` (added 2026-09-30). A fresh
  machine needs them added by hand.
- Check what an alias really resolves to with `ssh -G <alias> | grep -E '^(hostname|user) '`.

## Non-obvious requirements

**Before touching, upgrading, or re-syncing any vendored Pi/Claude extension, read
`docs/pi-extensions.md`** — it holds the full per-extension repair/rationale lore
and the exact commands. The Pi-extension mechanics that silently break things
(don't `pi install` vendored extensions; pi-lens needs `--ignore-scripts`;
disabling needs a `-extensions/<name>/index.ts` exclusion *and* the `packages`
entry removed; per-role subagent models go in `.pi/agent/settings.json`
`subagents.agentOverrides`, not frontmatter; keep the pi-subagents `biome.json`;
don't fight pi-lens autoformat) all live there with rationale.

Environment facts that aren't in that doc:

- **graphify CLI is machine-local** (`uv tool install graphifyy`, double-y), not
  synced; only its skill + guard extension sync.
- **Fusion is off on this machine** (`claude-fusion status`). When on, Claude
  Code writes/bash are gated to a delegation allowlist and mutations go through
  `bin/pi-delegate`. Toggle with `claude-fusion on|off|status` from your shell
  (not runnable by the agent).
- **Browser automation uses the real Chrome `ai` profile** through
  `@caob23/dsh-browser-control` and its unpacked extension at
  `~/.dsh/browser-control-extension`. Use the `browser_*` tools whenever browser
  interaction is needed; they operate the user's logged-in desktop Chrome tabs.
  `dsh-pilot` and its headless `pilot_*` tools were removed 2026-09-15. See
  `docs/deepseek-harness.md` for install, translation, and recovery details.

## Editing rules

- `.agents/AGENTS.md` is the canonical global guidance; edit it directly.
  The repo-level context file is this file (`AGENTS.md` at the repo root).
- Claude `settings-*.json`, if used, live machine-local in `~/.claude` (gitignored).
- Plans under `plans/` are gitignored (machine-local scratch).

## LLM Wiki

This project uses `wiki/` as an LLM-maintained knowledge base following the Open Knowledge Format (OKF) v0.1 layout contract (this wiki predates full OKF migration: the root index is legacy table-format and per-directory `index.md` coverage is incomplete, e.g. `analyses/` has one but others may not, until a migration run). Operate it with the `/llm-wiki-setup` skill (setup, ingest, query, promote, lint) and the `/wiki-update` skill (capture durable session knowledge). Those skills own the full procedures — follow them rather than reinventing the steps here.

### Layout

- `wiki/index.md` — root index (legacy table format until OKF migration); read first for any wiki-backed question; `wiki/ROUTING.md` narrows broad searches. Per-directory `index.md` coverage is incomplete until migration (`analyses/` has one); where absent, use the root index's per-section tables.
- `wiki/raw/` — immutable source material (read, never rewrite); `wiki/raw/sessions/` holds `/wiki-update` captures.
- `wiki/candidates/` — transient holding for generated pages; successful candidates are verified and auto-promoted in the same run. Candidates that fail verification stay in place as logged, retryable work items — no human review queue either way.
- `wiki/sources/`, `wiki/entities/`, `wiki/concepts/`, `wiki/analyses/` — promoted OKF concept pages (`type` frontmatter required; link with bundle-relative markdown links like `[Name](/concepts/name.md)`, not `[[wikilinks]]`; external sources under a `# Citations` section).
- `wiki/CLAIMS.md` — tracked factual claims (12-column schema, gated by `/wiki-update`). `wiki/log.md` — append every ingest, query, lint, and promotion (OKF `## YYYY-MM-DD` format).

### Wiki-First Search

For any project-specific question, investigation, design task, bug hunt, or code search needing project context: read `wiki/index.md` (then `wiki/ROUTING.md`) and the relevant pages and `wiki/CLAIMS.md` entries before broad repository search. When non-wiki search reveals durable knowledge the wiki lacks, capture it — run `/wiki-update` so the gap is ingested, promoted, and citable in the same run rather than merely proposed.

### Mandatory End-of-Run Wiki Check

The wiki is a standing obligation, not opt-in. Before reporting ANY task complete:

1. Decide whether the task produced durable knowledge — a decision setting/reversing project direction, scope, or ownership; accepted or changed terminology; a new or changed architecture, process, or contract; or a verified fact, root cause, or fix that supersedes existing wiki knowledge.
2. If yes, run `/wiki-update` before reporting done. Promotion is autonomous, so a successful run ends with the knowledge promoted and indexed; a candidate that failed its checks stays logged and retryable, never queued for approval.
3. If no, state one line confirming the wiki check ran and nothing qualified.

Mark superseded knowledge `superseded` in `wiki/CLAIMS.md` with a pointer to the newer claim; never delete it to clean up history.
