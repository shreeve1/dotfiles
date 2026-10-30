---
title: LLM Credential Cleanup List
summary: Which LLM keys and key copies can go when all LLM traffic goes through CLIProxy, with fingerprints for every distinct value and the order to remove them.
type: doc
status: promoted
created: 2026-10-30
updated: 2026-10-30
topics: [workstation]
---

## Active memory

- Sweep 2026-10-30 over wrk (WSL), aidev and itan8n (n8n), read-only. No key value is stored here; each credential is named by a sha256 prefix.
- Goal: every LLM call goes through `~/cliproxyapi/config.yaml` on aidev or itan8n. Both serve the same 11 models (claude-haiku-5-5, claude-opus-5-5, claude-sonnet-5-5, deepseek-v4-flash, deepseek-v4.1-flash, glm-5.3, glm-5.3-flash, gpt-6-luna, gpt-6.1-sol, gpt-6.1-terra, minimax-m3) and hold the upstream keys for z.ai, MiniMax and OpenRouter. No gpt-4o, so an app pinned to gpt-4o cannot be repointed.
- Distinct LLM credential values:
  - OpenRouter "main" `sha=75280a04ed` (73): DEAD, checked 2026-10-30 against `https://openrouter.ai/api/v1/auth/key` (401 "User not found"). No keeper needed, every copy can go. Copies: itan8n `~/.claude/litellm-env` (OPENROUTER_API_KEY, OPENROUTER_DAILY_API_KEY), itan8n and aidev `~/.hermes/.env` plus the six aidev hermes profiles, aidev `/etc/homelab-stack/langgraph.env` and its `.bak`, aidev `~/.dsh/.credentials.yaml`, aidev `~/pi-rmm/.secrets/openrouter.key`, `~/pi-rmm/.env`, `~/pi-durable/.env`, wrk `~/pi-durable/.env`, `dotfiles/.pi/agent/auth.json` on itan8n and aidev (`.openrouter.key`; wrk's holds only the Jev key), and the itan8n container `itastack-temporal-worker`.
  - OpenRouter "proxy" `sha=9d297bc8ac`: aidev live `~/cliproxyapi/config.yaml` openrouter block and its two newest backups. LIVE: deepseek-v4.1-flash through aidev cliproxy returned HTTP 200. Keep; seven older aidev backups hold the dead main key.
  - OpenRouter "medium" `sha=d4babaca1b` and "high" `sha=a804d7c7ad`: itan8n `~/.claude/litellm-env`, used only by the litellm tier map. Both LIVE: the only working OpenRouter credentials outside cliproxy. The litellm tiers auto and daily carry the dead main key, so those tiers are broken today.
  - One retired OpenRouter key (dead) remains as `dotfiles/.pi/agent/auth.json.bak-cponly-20261015` on aidev and itan8n.
  - MiniMax `sha=2b3a0c8f37` (sk-cp, 125): aidev live cliproxy config (keep) plus copies in aidev and itan8n hermes `.env`, `dotfiles/.pi/agent/auth.json` on itan8n and aidev (`.minimax.key`), `~/.claude/settings-minimax.json` on both, aidev `~/.dsh/.credentials.yaml`.
  - Jev `sha=5a9c031174` (apikey_28, 107) in `dotfiles/.pi/agent/auth.json` on all three hosts. Jev CLI credential, not an LLM-provider key.
  - OpenAI project `sha=22c78cc25f` (sk-proj, 164): wrk `~/3cx-web-chat/chat-api/.env`, aidev `~/honcho/.env`, aidev `~/maintenance/2026*-chat-api-deploy/env.before-deploy` and `~/ob/1.Work/3.Internal/ai/pi-win.md` (notes), itan8n VS Code local history.
  - Gemini `sha=db5efddaf1` (AIzaSy, 39) and xAI `sha=cea57199e9`: only in aidev `~/cliproxyapi/config.yaml.bak-*` and itan8n `dotfiles/.pi/agent/auth.json.bak-*`. No live consumer.
  - Anthropic OAuth `sk-ant-oat01-` (108): itan8n `~/.cli-proxy-api/claude-18beac6c-james@itassurance.com.json` is cliproxy's account pool (keep). Copies to drop: itan8n `~/.claude/.credentials.json`, `~/cli-proxy-api-disabled/*.dead-refresh-20261025`, `dotfiles/.pi/agent/auth.json.bak.20260530153843`, VS Code local history.
  - The 24-character cliproxy client token (`sha=4d8158547e`) is the shared client secret, not an upstream credential: aidev `~/.zshrc.secrets` and `~/.claude/litellm-config.yaml`, wrk `~/.pi/agent/models.json`. Keep.
- The dead main key still has callers and they fail because of it. The itan8n temporal worker calls the Jev endpoint `https://openrouter.ai/api/v1/systemone` (src/itastack/agents/jev_urgency.py, dispatch_checks.py) with `OPENROUTER_API_KEY` and logs 401 on every ticket; wrk and aidev `~/pi-durable/.env` do the same; itan8n cliproxy answers 503 `auth_unavailable` for deepseek-v4.1-flash ("401: User not found") because its launcher substitutes the same key. cliproxy's openrouter block is an OpenAI-compatible chat endpoint and cannot serve the Jev path, so repointing Jev to a live OpenRouter key is an owner decision.
- That worker already sends every chat request through cliproxy: `OPENAI_BASE_URL=http://host.docker.internal:8317/v1`, dummy `OPENAI_API_KEY=sk-local`, `ITASTACK_REASONING_MODEL=gpt-6-luna`, container reaches the proxy (HTTP 200). Jev is its only direct OpenRouter call. A herdr task is repointing or disabling that path (brief `~/.local/state/herdr-handoff/20261030-084606-temporal-cliproxy-jev.md`).
- Repointable now: itan8n Claude Code (litellm tiers auto/daily/medium/high all point at openrouter.ai), aidev hermes profiles (each sets `model.provider` to cliproxy or openai-codex, so the env key is a fallback only), aidev `/etc/homelab-stack/langgraph.env` (no code reads it), aidev `pi-rmm`, and the `.openrouter.key` and `.minimax.key` entries in the aidev and itan8n `dotfiles/.pi/agent/auth.json`.
- Cleanup shape: these `.env` files also hold non-LLM settings (Telegram, Slack, GitHub, Firecrawl, Jina, Serper, Exa, ITAStack, 3CX, Bitwarden), so removal must be line-level, not file-level. `~/.dsh` is retired but `~/.dsh/dsh-tls.{crt,key}` on aidev must stay.
- The main key also sits in session transcripts and subagent artifacts on all three hosts, an opencode session on aidev and Trash copies on itan8n, so deleting files never removes it from disk history; only revocation does.
- wrk's pi-lens latency log and the fabric observation pool matched only this sweep's own masking patterns, not real keys.

## Related

- [OpenRouter Key Inventory Across Machines](memory/docs/workstation/openrouter-key-inventory.md) - where the OpenRouter keys sit and who consumes them.
- [Adding a CLIProxy Model to the pi Fleet](memory/docs/workstation/pi-cliproxy-model-fleet.md) - the proxy's provider blocks and per-machine models.json.
- [Claude Code CLIProxy Fleet](memory/docs/workstation/claude-code-cliproxy-fleet.md) - how Claude Code points at the proxies.
