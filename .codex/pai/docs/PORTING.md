# PAI Codex Port

Source: https://github.com/danielmiessler/Personal_AI_Infrastructure.git
Pinned release: v4.0.3
Pinned commit: 52e7ad856430afedd4949360c26323d2d80c20fa
Release path: /tmp/Personal_AI_Infrastructure/Releases/v4.0.3/.claude

## Principles

- Treat upstream PAI as source material, not as an installed layout.
- Keep Codex instructions subordinate to system, developer, and local AGENTS.md guidance.
- Keep unsupported audio, desktop-alert, terminal-title, and vendor-specific runtime behavior out of generated files.
- Keep `.codex/pai/USER` and `.codex/pai/MEMORY` local and ignored.

## Installed Components

- Skills generated: 48
- Custom agents generated: 14
- Hooks inventoried: 20
- Tools copied or inventoried: 10
- Docs copied: 11
- Actions copied: 11
- Pipelines copied: 2
- Packs inventoried: 942

Generated skills live under `.codex/pai/skills/pai-*` and are installed into `$HOME/.agents/skills/pai-*` by the installer.
Generated custom agents live under `.codex/agents/pai-*.toml`.

## Gated Components

The manifest records items that need Fabric, browser automation, scraping providers, research providers, Cloudflare, SEC/EDGAR data, or media processing tools. A gated item is preserved as source or metadata but should not be assumed operational.

## Hook Behavior

- `security-validator.ts` denies destructive shell commands and protected local secret paths for `PreToolUse` and `PermissionRequest`.
- `load-context.ts` adds relevant ignored PAI user and memory context at `SessionStart`.
- `session-capture.ts` logs turn/session metadata and explicit 1-10 ratings without side effects outside `.codex/pai/MEMORY`.
- `session-capture.ts` also classifies `UserPromptSubmit` prompts. Substantive planning, implementation, investigation, and design prompts inject model-visible PAI Algorithm context requiring PRD/plan creation, review, and learning discipline.
- `work-sync.ts` logs plan/spec edit events for later work tracking and injects a corrective `PostToolUse` reminder when substantive work edits implementation files before touching a PRD or plan.

Algorithm enforcement is a context-injection and state-tracking layer. It does
not run a separate autonomous agent, and it does not block every edit before a
PRD exists. This keeps Codex usable for small fixes while making non-trivial
work visibly accountable to the PAI loop.

Manual hook test example:

```bash
printf '{"hook_event_name":"PreToolUse","tool_name":"Bash","tool_input":{"command":"ls"}}' | bun .codex/pai/hooks/security-validator.ts
```

## Skills

Codex scans `$HOME/.agents/skills` and repo `.agents/skills`. This port installs user-global copies so generated PAI skills do not mix with existing `.codex/skills` dev-pipeline skills. Use the manifest dependency fields to decide whether a generated skill should be considered active for your environment.

## Rollback

The installer writes timestamped backups under `.codex/pai-backups`. To roll back, restore the relevant backup files and remove `$HOME/.agents/skills/pai-*` copies.

## Plan Artifact

`artifacts/` is ignored in this repository, so `artifacts/plans/pai-codex-port/plan.md` is intentionally local unless it is force-added later.
