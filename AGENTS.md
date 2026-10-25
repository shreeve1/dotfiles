# Dotfiles — Agent Context

Config synced across the user's machines; `install.sh` symlinks it into place (fresh machine: `bash install.sh`, full sequence in `README.md`).

## Layout

- `.agents/AGENTS.md`: global guidance, loaded by every pi session through the relative symlink `.pi/agent/AGENTS.md` (also `~/.codex/AGENTS.md`, `~/.claude/CLAUDE.md`). Paid on every turn: keep it small. A Windows checkout without symlink support gets a plain text file there instead, so pi on that machine gets no global guidance.
- `.agents/skills/`: all skills (`~/.agents/skills`, `~/.claude/skills`). `disable-model-invocation: true` is deliberate; don't "fix" it.
- `.pi/agent/APPEND_SYSTEM.md`: pi-fabric delegation policy; `install.sh` checks for its heading.
- herdr (pi runs in herdr panes on each machine): `docs/herdr.md`. `plans/` is gitignored scratch.
- dsh is retired; leave `~/.dsh/dsh-tls.{crt,key}` on aidev, the herdr web ui uses them.

## Machine topology (NetBird)

Recorded 2026-10-21. Installed on aidev, itan8n, wrk's WSL and surftop's native Windows checkout (`C:/Users/james/dotfiles`; cmd over ssh, no `head`/pipes). Homelab servers (`pve1`, `pve4`, `jellyfin`, ...) never get these dotfiles.

`origin/main` is the sync point and any machine may commit: `git pull --rebase` before work, push after, `git pull --ff-only` on the others. Keep machine-specific edits out of commits.

| Machine | Role | User | NetBird IP | NetBird DNS name |
| --- | --- | --- | --- | --- |
| `wrk` | desktop; herdr + pi in Ubuntu-24.04 WSL2 (sshd on 2222, Windows owns 22) | `james` | `100.95.235.60` | `wrk-235-60.netbird.selfhosted` |
| `aidev` | always-on server; herdr web ui | `james` | `100.95.230.15` | `aidev.netbird.selfhosted` |
| `itan8n` | server; n8n | `itadmin` | `100.95.224.218` | `n8n.netbird.selfhosted` |
| `surftop` | Surface ARM64 thin client; native Windows herdr | `james` | `100.95.222.42` | `surftop.netbird.selfhosted` |

When one machine "can't find" another, it's a name, not the network:

- Use the NetBird IPv4; bare names resolve to IPv6 first or not at all.
- `itan8n` is only an SSH alias; its NetBird name is `n8n`, and its user is `itadmin`.
- SSH aliases are machine-local and added by hand. Check one with `ssh -G <alias> | grep -E '^(hostname|user) '`.

## Non-obvious requirements

- **Read `docs/pi-extensions.md` before touching, upgrading or re-syncing any vendored pi extension.** Don't `pi install` vendored extensions; pi-lens needs `--ignore-scripts`; disabling needs a `-extensions/<name>/index.ts` exclusion and the `packages` entry removed; don't fight pi-lens autoformat.
- **pi-fabric** is the one npm-installed extension, pinned at `0.117.1` (last for Pi 1.2.0) with its Coral Bricks provider filtered in `settings.json` `packages`. Role models: `.pi/agent/fabric.json`. Rollback: `docs/pi-extensions.md` § pi-fabric.
- **Formatting and linting:** run `style-check`, not a formatter with your own flags (`docs/adr/0022-one-style-contract.md`). Tool versions are pinned in `.config/style/tools.env`; after a bump re-run `install.sh` (surftop: `install-win.ps1`) on every machine.
- **Checks:** `bash tests/run-all.sh`. The pre-push hook runs only `--fast`, so run the full suite before pushing.
- **graphify CLI** is machine-local (`uv tool install graphifyy`); only its skill and guard extension sync.

## DO THIS FIRST: read memory before your first reply

On your FIRST response in a session, before you answer, plan, load any skill or ask any question:

1. Read `memory/index.md`, `memory/glossary.md` and `memory/rules.md`, then every file the `Always` row of `memory/rules.md` names. If a file does not exist, note it and move on. Do this even when the request seems unrelated or is itself a simple read.
2. Before each task, load every row of `memory/rules.md` whose When fits it: its Lead skill runs the task, its Also load files add content.
3. Treat index rows as pointers, not facts. Open the linked file before relying on a row.

## Memory capture: check at the end of every task

Not optional, and the user does not have to say "remember". Before reporting a task complete, check the session for these triggers:

- The user **corrects you** or overrides something you did.
- The user **states a rule or preference** about how to work here.
- The user **describes how a process goes**, or sets a boundary on one.
- A **decision is settled** that a future session would otherwise re-litigate.
- **You discover a non-obvious fact likely to come up again** (a fix, a gotcha, a tool quirk, how this project's stack is set up) that a future session could not cheaply rediscover.

Write everything that qualifies once, at the end of the task, with the `personal-memory` skill. Do NOT ask first. End the reply with one line per item: `Memory saved: <path> - <short summary>`. If nothing qualified: `Memory check: nothing worth capturing.`

Does not qualify: one-off task details, the status of work still in motion (save it once, when it settles), temporary instructions, anything memory or the project's own docs already state correctly. Never store credentials; omit them automatically.

## Project memory

`memory/` holds this project's durable memory, operated by the `personal-memory` skill at `~/.agents/skills/personal-memory/`. `memory/README.md` is the layout contract; read it before creating a memory file.

- **Write:** once per task, to the right file (workflows and decisions in a topic folder from `memory/schema.json`), update `memory/index.md`, then from the project root run `python3 ~/.agents/skills/personal-memory/indexes.py` if a workflow or decision changed, and `python3 ~/.agents/skills/personal-memory/gate.py --memory memory audit` until it exits 0.
- **Conflicts:** a new item that contradicts memory overwrites it in place. Files state only what is true now.
- **Git:** if this project is a git repo, commit the memory files you wrote with the task (stage only your own). If not, the capture ends after the audit.
- **Rules:** `memory/rules.md` routes tasks to skills and files, one row per trigger, pointers only. Add a row through the `personal-memory` skill.
