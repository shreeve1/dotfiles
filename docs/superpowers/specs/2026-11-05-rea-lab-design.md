# REA Lab Workspace — Design

Date: 2026-11-05. Status: awaiting James's approval.

## Intent

James wants REA (`https://github.com/morluto/rea`, a reverse-engineering MCP server and CLI) available only in one dedicated folder, `~/rea-lab`, opened mainly with pi. The folder holds what he reverse engineers, written so he can apply the findings to his other projects. Today REA leaks into every session: `~/.codex/config.toml` enables it globally, and pi-fabric's mcporter fallback imports Codex's config, so each herdr pi session starts its own `rea mcp` (~270 MB each, three running on 2026-11-05) despite `~/.pi/agent/mcp.json` marking it disabled.

## Goals

- REA tools and the `reverse-engineer-anything` skill appear only in sessions opened in `~/rea-lab`.
- No REA process starts from any other pi, Codex or Claude Code session on any machine.
- The folder is a starter-agent workspace: memory, saved tasks and one `projects/<target>/` per thing analysed, each with a `findings.md` another project can read on its own.

## Non-goals

- Installing analysis engines (Ghidra, IDA, jadx, Hopper, Kuna). Add later per target.
- A Codex or Claude Code setup inside the folder. pi only.
- Background services. None exist for REA today; none get added.

## Anti-goals

- REA starting anywhere outside `~/rea-lab` again.
- Breaking the existing itastack MCP server or other pi-fabric MCP behaviour.

## Approaches

- **A, picked:** REA lives only in the folder. Remove the global entries and move the skill out of dotfiles. Strictest isolation; other machines lose the skill on the next pull.
- **B:** keep the global pi entry disabled and the skill global; the folder only switches REA on. Fewer changes, but the skill stays visible everywhere and the scope depends on one flag.

James picked A for strict "REA only in that folder".

## Design

1. **Stop the leak.** Remove `[mcp_servers.rea]` from `~/.codex/config.toml` on wsl, and on every other machine where a Codex config has it. Remove the `rea` entry from `~/.pi/agent/mcp.json` on wsl and itan8n. Leave the itastack project override alone; it becomes a no-op. Leave `~/.pi/agent/mcp.json.rea.backup` alone. Verify: a fresh pi session outside `~/rea-lab` starts no `rea mcp` process. Already-running sessions keep theirs until James closes them; do not kill them.
2. **Create the workspace.** Follow `~/starter-agent/.agents/setup/README.md` "First setup" into `~/rea-lab`, with no migration source. Purpose: reverse-engineering findings for reuse in other projects. Layout: `projects/<target>/` with `README.md`, an `evidence/` folder for REA output, and `findings.md`. `git init` locally with `core.hooksPath .githooks`; no remote unless James asks.
3. **REA on inside the folder.** `~/rea-lab/.pi/mcp.json` defines `rea` in full (`command: /home/james/.npm-global/bin/rea`, `args: ["mcp"]`). pi reads project MCP config for trusted folders, and `/home/james` is trusted. If pi-fabric needs it, add `rea` to a project-level fabric `nativeServers` rather than the global `fabric.json`.
4. **Move the skill.** `git mv` is not possible across repos: copy `dotfiles/.agents/skills/reverse-engineer-anything/` to `~/rea-lab/.agents/skills/`, then delete it from dotfiles in its own commit. Remove any per-skill symlink left dangling (for example in `~/.codex/skills`). pi loads project `.agents/skills` for trusted folders.
5. **Record it.** Update the dotfiles memory decision `decision-rea-disabled-by-default.md` to say REA lives only in `~/rea-lab`, and why: the pi-fabric mcporter import of Codex config.

## Verification

- New pi session in `~/rea-lab`: REA tools and the skill are listed; `rea doctor` works.
- New pi session in `~/dotfiles`: no REA tools, no skill, no new `rea mcp` process.
- `bash tests/run-all.sh` passes in dotfiles.

## Left to the builder

- Exact project README template wording (use personal-memory's `supporting-templates.md`).
- Whether pi-fabric needs `nativeServers` for the project server; test before adding.
- Pushing dotfiles: ask James first.
