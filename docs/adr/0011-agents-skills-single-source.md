# 0011 — `~/.agents/skills` is the only authored user skill root

**Status:** Accepted (2026-10-03)

## Context

omp loaded skills from five user roots by default: `~/.agents/skills`,
`~/.codex/skills`, `~/.claude/skills`, `~/.pi/agent/skills`, and managed
skills (`settings-schema.ts:4797-4809`). `~/.codex/skills` was 83 symlinks
into `.agents/skills` plus 20 dangling ones; same-name duplicates resolved
first-wins (`extensibility/skills.ts:202-211`), so archiving a skill would
have left stale copies reachable through the other roots. Codex 0.157.1
reads `~/.agents/skills` as a user root on its own (`codex debug
prompt-input` from `/var/tmp` with an empty `CODEX_HOME` lists
`/home/james/dotfiles/.agents/skills`).

## Decision

- `config.yml`: `skills.enableCodexUser`, `enableClaudeUser`,
  `enablePiUser` all `false`. omp reads `~/.agents/skills` (→
  `dotfiles/.agents/skills`), managed skills, and Claude plugin skills
  (`claude-plugins:user`, currently only `skill-creator`; separate
  provider, not covered by `enableClaudeUser`).
- `~/.codex/skills` emptied except Codex's own `.system/`.
- Retired skills move to `dotfiles/archive/skills/`, which no
  harness scans, instead of being deleted.

## Consequences

- The 20 skills in `~/.pi/agent/skills` (Paperclip etc.) are pi-only; omp
  no longer sees them.
- Authored skills belong in `.agents/skills`. omp also loads managed
  skills and any enabled Claude plugin's skills; other user roots are off.
  Re-enable a root only with a reason recorded here.
