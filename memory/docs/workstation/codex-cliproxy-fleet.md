---
title: Codex CLI CLIProxy Fleet
summary: Codex CLI uses CLIProxy in five environments; command-backed auth reuses pi credentials and preserves each machine's default model.
type: doc
status: promoted
created: 2026-10-30
updated: 2026-10-30
topics: [workstation]
---

## Active memory

- Codex CLI 0.166.0 is installed through global npm on wrk WSL, aidev, itan8n, wrk Windows, and surftop (native ARM64). Scope is CLI only: no desktop-app update and no background-server reactivation.
- Executables: wrk WSL and aidev `~/.npm-global/bin/codex`; itan8n `~/.local/bin/codex`; Windows `%APPDATA%\npm\codex.cmd`. On aidev noninteractive SSH omits the npm bin directory, but interactive zsh finds Codex; use the absolute path for SSH automation.
- User-local `~/.codex/config.toml` (Windows `C:/Users/james/.codex/config.toml`) selects `model_provider = "cliproxy"`. The provider uses `wire_api = "responses"`. URLs include `/v1`: wrk WSL/Windows and surftop use `http://100.95.230.15:8317/v1`; aidev uses `http://10.20.20.16:8317/v1`; itan8n uses `http://127.0.0.1:8317/v1`.
- `[model_providers.cliproxy.auth]` runs that machine's absolute Node executable with `~/.codex/cliproxy-token.cjs`, timeout 5000 ms and refresh interval 0. The helper reads the existing literal `providers.cliproxy.apiKey` from `~/.pi/agent/models.json`; no extra credential copy or OpenAI login is needed. Do not combine command auth with `requires_openai_auth`, `env_key`, or `experimental_bearer_token`. Keep the helper when updating Codex.
- Existing defaults were preserved: aidev and wrk Windows use `gpt-6.1-sol`; wrk WSL, itan8n, and surftop use `claude-opus-5-5`. Permissions, hooks, plugins, and MCP settings were preserved. Backups are beside each config as `config.toml.bak-codex-cliproxy-*`.
- All five completed an ephemeral no-tools Codex reply through CLIProxy with `gpt-6.1-sol` on 2026-10-30. Opus returned 429 on both proxies during verification; the three Opus-default clients passed with a one-run `-m gpt-6.1-sol` override, not a saved-model change. Model availability is separate from provider setup.
- Future CLI updates use `npm install -g @openai/codex@latest` (Windows `npm.cmd`); confirm `codex --version` and an actual reply afterward. CLI and desktop app share the user config even when only the CLI is updated.

## Related

- [Claude Code CLIProxy Fleet](memory/docs/workstation/claude-code-cliproxy-fleet.md) - shares the proxies and existing per-machine client credentials.
- [Remote Agent Servers](memory/docs/workstation/remote-agent-servers.md) - installing the CLI does not authorize re-enabling retired services.

## Reference

- `https://developers.openai.com/codex/config-file/config-advanced.md` - custom providers and command-backed authentication.
