---
title: Claude Code CLIProxy Fleet
summary: Claude Code uses CLIProxy on five environments; all served models need explicit picker entries because discovery filters non-Claude IDs.
type: doc
status: promoted
created: 2026-10-30
updated: 2026-10-30
topics: [workstation]
---

## Active memory

- James wants every model served by CLIProxy available in Claude Code, not only Claude models. User-level settings are `~/.claude/settings.json` on wrk WSL, aidev and itan8n, and `C:/Users/james/.claude/settings.json` on wrk Windows and surftop. These are machine-local, not tracked dotfiles; preserve unrelated hooks, permissions and plugins.
- Settings use `env.ANTHROPIC_BASE_URL` without `/v1`, `ANTHROPIC_AUTH_TOKEN` from that machine's existing pi CLIProxy credential, and `CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY=1`. wrk and surftop use `http://100.95.230.15:8317`, aidev uses `http://10.20.20.16:8317`, itan8n uses `http://127.0.0.1:8317`. Never copy credential values into memory or git.
- Default `model` stays `sonnet`. The `ANTHROPIC_DEFAULT_OPUS_MODEL`, `ANTHROPIC_DEFAULT_SONNET_MODEL`, and `ANTHROPIC_DEFAULT_HAIKU_MODEL` environment variables map to `claude-opus-5-5`, `claude-sonnet-5-5`, and `claude-haiku-5-5`.
- `modelPicker.options` explicitly lists each ID from authenticated `GET /v1/models`, with `{ "model": "<id>", "label": "<id> (CLIProxy)" }`. Automatic discovery refreshes at startup but keeps only IDs containing `claude` or `anthropic`; future GPT, GLM, DeepSeek and MiniMax models need their picker entries refreshed on all five environments. Current catalogues have 11 models. GPT `gpt-6-luna` answered a no-tools Claude Code prompt on all five; Claude Code warns that non-Claude models are unrecognized, and Anthropic does not officially support them.
- Haiku 5.5 exists in CLIProxyAPI 8.0.46. Both proxy configs now exclude `claude-haiku-3*`, `claude-haiku-4*`, and exact `claude-haiku-5`, not blanket `claude-haiku*`. A missing Haiku model can be a filter, not a binary-version problem. Both proxies required restart to publish this change; itan8n's launcher renders its template at start. Ask before future restarts.
- Backups sit beside existing files: `config.yaml.bak-claude-code-haiku-*` on both proxies and `settings.json.bak-cliproxy-*` on aidev and itan8n. The other three settings files were newly created.
- For a no-customization probe, use `claude --safe-mode --setting-sources user --strict-mcp-config --mcp-config '{"mcpServers":{}}' --tools "" --disable-slash-commands --no-session-persistence --model <id> -p 'Reply with exactly OK.'`. Do not use `--bare` to validate bearer-token settings: its documented auth behavior differs. A 429 with credentials cooling down is upstream availability, not missing model-menu configuration.

## Related

- [CLIProxy model fleet](memory/docs/workstation/pi-cliproxy-model-fleet.md)
- Official gateway settings: `https://code.claude.com/docs/en/llm-gateway-connect`
- Model picker schema: `https://code.claude.com/docs/en/settings-reference#modelpicker`
