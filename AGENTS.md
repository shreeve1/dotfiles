# Dotfiles — Agent Context

This repo is synced across the user's Linux and Mac machines. Files here become
real config via symlinks installed by `install.sh`.

## Primary agent surface: pi inside herdr, on all Linux machines

The user's agents are **pi** sessions running in **herdr** panes. Each machine
(see the topology table below) runs its own long-lived `herdr server` with its own
workspaces and pi agents; no machine hosts the agents for another. herdr's saved
SSH machines (`herdr machine list`) let any one machine's herdr client show and
drive the other two: it opens `ssh <alias> … herdr remote-client-bridge` to each
one, using the SSH aliases. pi reports its state and session to herdr through
`~/.pi/agent/extensions/herdr-agent-state.ts`. Phone and browser access goes
through the herdr web ui on aidev (`https://100.95.230.15:7443`), which reaches
wrk and itan8n the same way. Config, machine lists, and the web ui setup:
`docs/herdr.md`. pi extensions: `docs/pi-extensions.md`.

DeepSeek Harness (dsh) is **retired** (2026-10-16): `dsh-web.service` is stopped
and disabled on aidev and itan8n. `docs/deepseek-harness.md` and the `dsh-*`
skills are history. Leave `~/.dsh/dsh-tls.{crt,key}` on aidev: the herdr web
ui's HTTPS still uses them.

## On a fresh machine

Run `bash install.sh` from the repo root. See `README.md` for the full setup
sequence (settings.json seeding, per-machine MCP bootstrap, validation
commands).

## Canonical surfaces

- **AGENTS standard lane (canonical):** `.agents/AGENTS.md` (global agent
  guidance) and `.agents/skills/<name>/SKILL.md`. pi discovers
  `~/.agents/skills` (→ `dotfiles/.agents/skills`) natively, and loads
  `.agents/AGENTS.md` through the committed relative symlink
  `.pi/agent/AGENTS.md` → `../../.agents/AGENTS.md`, which `~/.pi/agent` (a link
  to `dotfiles/.pi/agent`) exposes as pi's user context file. pi takes the first
  of `AGENTS.override.md`, `AGENTS.md`, `AGENTS.MD`, `CLAUDE.md`, `CLAUDE.MD` in
  that dir, so a new `AGENTS.override.md` there would silently replace it. codex
  reads the same file via `~/.codex/AGENTS.md`. This is the only lane that applies without the model choosing
  to load anything: a skill contributes just its one-line description to
  context until something calls the `skill` tool, which on plain coding tasks
  it does not do. Keep the lane small — it is paid on every turn. Skills marked
  `disable-model-invocation: true` are user-invocable only on purpose — do not
  "fix" them.
- **Repo-level context:** this file (`AGENTS.md`). pi loads `AGENTS.md` /
  `CLAUDE.md` from the working directory and every parent, plus
  `~/.pi/agent/APPEND_SYSTEM.md` (→ `dotfiles/.pi/agent/APPEND_SYSTEM.md`).
- **Claude Code lane (retired 2026-09-10, archive deleted 2026-09-19):**
  the only link into `~/.claude` is `~/.claude/skills` →
  `dotfiles/.agents/skills` (added 2026-10-05 via `install.sh`), so Claude Code
  sees the same skills as pi; new skills appear automatically. Note: Claude Code reads only
  `CLAUDE.md` as its project doc — it does not auto-load `AGENTS.md` — which is
  why Claude-flavored repos keep the `CLAUDE.md` name.
- See `README.md` § "Canonical vs tool-specific" for the full table.

## Machine topology (NetBird)

Four machines share the self-hosted NetBird mesh (`*.netbird.selfhosted`).
Recorded 2026-10-21. This repo is installed on aidev, itan8n, the wrk
desktop's WSL, and surftop's native Windows checkout
(`james@100.95.222.42`, repo at `C:/Users/james/dotfiles`; cmd over ssh — no
`head`/pipes). Homelab servers (`pve1`, `pve4`, `jellyfin`, and the rest)
never get these dotfiles or agent config; do not sync or apply changes there.
`macbook-air` is retired (2026-10-03); `omarchy` is retired (2026-10-21). The
previous Ryzen desktop (LAN `10.20.20.10`) is being wiped and given away —
delete its NetBird peer when it goes.

No machine is the source of truth: work happens on all of them, and
`origin/main` on GitHub is the sync point. Any machine may edit and commit.
Pull (`git pull --rebase`) before starting work, commit, push, then
`git pull --ff-only` on the others. Never leave committed work unpushed or
let two machines diverge. Keep machine-specific edits (e.g. a local
`.codex/hooks.json` change) out of commits unless they belong on every machine.

| Machine | Role | User | NetBird IP | NetBird DNS name | LAN |
| --- | --- | --- | --- | --- | --- |
| `wrk` | gaming desktop; agent host — herdr + pi in Ubuntu-24.04 WSL2 (sshd on 2222; the Windows host owns 22) | `james` | `100.95.235.60` | `wrk-235-60.netbird.selfhosted` | `10.20.20.176` |
| `aidev` | always-on server; hosts herdr web ui | `james` | `100.95.230.15` | `aidev.netbird.selfhosted` | `10.20.20.16` |
| `itan8n` | server; n8n | `itadmin` | `100.95.224.218` | `n8n.netbird.selfhosted` | - |
| `surftop` | Surface thin client (Snapdragon ARM64); native Windows herdr reaching wrk/aidev/itan8n over SSH; Windows repo checkout (synced) | `james` | `100.95.222.42` | `surftop.netbird.selfhosted` | `10.20.20.126` |

Every machine can reach every other on port 22. When one machine "can't find"
another, the cause is almost always a name, not the network:

- **Use the NetBird IPv4 address, not a bare name.** Bare names resolve to
  NetBird IPv6 addresses first, and some don't resolve at all.
- **`itan8n` is not a DNS name.** Its NetBird name is `n8n`; `itan8n` works only
  where an SSH alias defines it.
- **`wrk` kept its hostname from the old desktop,** so NetBird disambiguated
  the new peer as `wrk-235-60`; the old peer stays in the console until the
  old box is wiped. WSL on wrk answers on the host's own IPs (mirrored
  networking) — ssh port 2222 reaches Ubuntu, port 22 the Windows host.
- **Users differ:** itan8n is `itadmin`, the others `james`. SSH without an
  alias uses the local username and fails on itan8n.
- **SSH aliases (`~/.ssh/config`, machine-local, not in this repo):** each
  machine has aliases for the others (2026-09-30; surftop's added 2026-10-21:
  `desktop-wsl` → wrk's WSL on port 2222, `aidev`, `n8n`). A fresh machine
  needs them added by hand.
- Check what an alias really resolves to with `ssh -G <alias> | grep -E '^(hostname|user) '`.

## Non-obvious requirements

**Before touching, upgrading, or re-syncing any vendored Pi/Claude extension, read
`docs/pi-extensions.md`** — it holds the full per-extension repair/rationale lore
and the exact commands. The Pi-extension mechanics that silently break things
(don't `pi install` vendored extensions; pi-lens needs `--ignore-scripts`;
disabling needs a `-extensions/<name>/index.ts` exclusion *and* the `packages`
entry removed; don't fight pi-lens autoformat) all live there with rationale.

**pi-fabric is the orchestration runtime (2026-10-16).** It is the one
extension installed from npm rather than vendored, pinned at `0.117.1` (the
last release for Pi 1.2.0) with its bundled Coral Bricks provider filtered out
in `settings.json` `packages`. Role models are aliases in
`.pi/agent/fabric.json`. pi-subagents, fusion, pi-advisor-flow, rpiv-todo,
pi-loop, pi-background-tasks, `bin/pi-delegate` and `bin/claude-fusion` are
archived; the rollback is in `docs/pi-extensions.md` § pi-fabric.

Environment facts that aren't in that doc:

- **Formatting and linting follow one contract** (`docs/adr/0022-one-style-contract.md`):
  the repo's own config files decide, and pi-lens, `post-work-cleanup`, the push hook
  and you all run `style-check`; reach for it instead of a formatter with flags of
  your own. Tool versions are pinned in `.config/style/tools.env`; bump there, then
  re-run `install.sh` on every machine (aidev, itan8n, wrk WSL, surftop; surftop uses `install-win.ps1`).

- `bash tests/run-all.sh` is the repo's check command; the pre-push hook runs
  only its `--fast` subset (guards plus the test files this branch changed), so
  run the full suite yourself before you push.

- **graphify CLI is machine-local** (`uv tool install graphifyy`, double-y), not
  synced; only its skill + guard extension sync.
- **Browser automation** uses `agent-browser` against the persistent
  `chrome-cdp` Chrome on port 9222 (load the `browser-cdp` skill). On wrk and
  surftop that Chrome is a Windows Chrome; wrk drives it from WSL (native
  Windows pi reaches it through `~/bin` stubs into WSL), surftop natively from
  Git Bash. dsh's `browser_*` tools went away with dsh.

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

For any project-specific question, investigation, design task, bug hunt, or code search needing project context: read `wiki/index.md` (then `wiki/ROUTING.md`) and the relevant pages and `wiki/CLAIMS.md` entries before broad repository search. A gap found this way is input to the end-of-run check below — do not run `/wiki-update` mid-task.

### End-of-Run Wiki Check

Before reporting a task complete, decide whether it produced knowledge a future session would need and could not cheaply rediscover from code, committed docs, or the ticket itself.

1. Qualifies: a decision setting/reversing project direction, scope, or ownership; accepted or changed terminology; a new/changed architecture, process, or contract; a non-obvious gotcha likely to recur (undocumented API behaviour, misleading error, environment quirk); or a verified fact that makes existing wiki knowledge wrong.
2. Does not qualify: one-off ticket or incident specifics (a single user, record, or device); the status of work still in motion (rollout stages, flag flips, test-mode toggles, "built but not live"); anything the wiki, code, or committed docs already state correctly.
3. Capture in-progress workstreams once, when they reach a stable state (shipped, abandoned, or handed off) — not after every step.
4. If something qualifies, run `/wiki-update` before reporting done. Promotion is autonomous, so a successful run ends with the knowledge promoted and indexed; a candidate that failed its checks stays logged and retryable, never queued for approval.
5. If nothing qualifies, state one line confirming the wiki check ran and nothing qualified.

Mark superseded knowledge `superseded` in `wiki/CLAIMS.md` with a pointer to the newer claim; never delete it to clean up history.
