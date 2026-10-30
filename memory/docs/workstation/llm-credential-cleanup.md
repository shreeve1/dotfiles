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

- Sweep 2026-10-30 over wrk (WSL), aidev and itan8n (n8n), read-only. No key value is stored here; each credential is named by a sha256 prefix of its value.
- Goal: every LLM call goes through `~/cliproxyapi/config.yaml` on aidev or itan8n. Both instances serve the same 11 models (claude-haiku-5-5, claude-opus-5-5, claude-sonnet-5-5, deepseek-v4-flash, deepseek-v4.1-flash, glm-5.3, glm-5.3-flash, gpt-6-luna, gpt-6.1-sol, gpt-6.1-terra, minimax-m3) and hold the upstream keys for z.ai, MiniMax and OpenRouter; the model list has no gpt-4o, so an app pinned to gpt-4o cannot be repointed without a change.
- Distinct LLM credential values in the wild:
  - OpenRouter "main" `sha=75280a04ed` (sk-or-v1, 73): itan8n `~/.claude/litellm-env` (OPENROUTER_API_KEY and OPENROUTER_DAILY_API_KEY), itan8n and aidev `~/.hermes/.env` plus the six aidev hermes profiles (genops, netops, projectlean, responder, secops, storageops), aidev `/etc/homelab-stack/langgraph.env` and its `.bak`, aidev `~/.dsh/.credentials.yaml`, aidev `~/pi-rmm/.secrets/openrouter.key` and `~/pi-rmm/.env`, `dotfiles/.pi/agent/auth.json` on itan8n, aidev and wrk (`.openrouter.key`), wrk `~/pi-durable/.env`, and the running itan8n container `itastack-temporal-worker`.
  - OpenRouter "proxy" `sha=9d297bc8ac`: aidev live `~/cliproxyapi/config.yaml` openrouter provider block (serves deepseek-v4-flash and deepseek-v4.1-flash). This is the credential to keep.
  - OpenRouter "medium" `sha=d4babaca1b` and "high" `sha=a804d7c7ad`: itan8n `~/.claude/litellm-env`, used only by the litellm tier map.
  - One retired OpenRouter key, confirmed dead (401 at the OpenRouter API), still on disk as `dotfiles/.pi/agent/auth.json.bak-cponly-20261015` on aidev and itan8n.
  - MiniMax `sha=2b3a0c8f37` (sk-cp, 125): aidev live cliproxy config (keep) plus copies in aidev and itan8n hermes `.env` files, `dotfiles/.pi/agent/auth.json` on itan8n, aidev and wrk (`.minimax.key`), and aidev `~/.dsh/.credentials.yaml`.
  - Jev `sha=5a9c031174` (apikey_28, 107) in `dotfiles/.pi/agent/auth.json` on all three hosts. Not an LLM-provider key; the Jev CLI credential.
  - OpenAI project `sha=22c78cc25f` (sk-proj, 164): wrk `~/3cx-web-chat/chat-api/.env`, aidev `~/honcho/.env`, aidev `~/maintenance/2026*-chat-api-deploy/env.before-deploy`, aidev `~/ob/1.Work/3.Internal/ai/pi-win.md` (a notes file), itan8n VS Code local history.
  - Gemini `sha=db5efddaf1` (AIzaSy, 39): only in aidev `~/cliproxyapi/config.yaml.bak-*` and itan8n `dotfiles/.pi/agent/auth.json.bak-*`. No live consumer.
  - xAI `sha=cea57199e9`: only in aidev `~/cliproxyapi/config.yaml.bak-*`. No live consumer.
  - Anthropic OAuth `sk-ant-oat01-` (108): itan8n `~/.cli-proxy-api/claude-18beac6c-james@itassurance.com.json` is cliproxy's own account pool (keep). Copies to drop: itan8n `~/.claude/.credentials.json`, `~/cli-proxy-api-disabled/*.dead-refresh-20261025`, `dotfiles/.pi/agent/auth.json.bak.20260530153843`, itan8n VS Code local history.
  - The 24-character cliproxy client token (`sha=4d8158547e`) is the shared secret clients use, not an upstream credential: aidev `~/.zshrc.secrets`, aidev `~/.claude/litellm-config.yaml`, wrk `~/.pi/agent/models.json`. Keep.
- Live consumers of the OpenRouter main key that cliproxy cannot replace: the itan8n temporal worker calls the Jev endpoint `https://openrouter.ai/api/v1/systemone` (src/itastack/agents/jev_urgency.py, dispatch_checks.py) with `OPENROUTER_API_KEY`, and wrk `~/pi-durable/.env` does the same for the pi-durable classifier. cliproxy's openrouter block is an OpenAI-compatible chat endpoint and cannot serve that path.
- Consumers that can be repointed at cliproxy: itan8n Claude Code (litellm tiers auto/daily/medium/high all point at openrouter.ai with three OR keys), aidev hermes profiles (every profile sets `model.provider` to cliproxy or openai-codex, so the OR key in the env is a fallback only), aidev `/etc/homelab-stack/langgraph.env` (no code in the stack reads the variable at all), aidev `pi-rmm` (lab project), and every `dotfiles/.pi/agent/auth.json` copy of `.openrouter.key` and `.minimax.key` (pi already talks to cliproxy on wrk).
- Cleanup shape: most of these `.env` files also hold non-LLM settings (Telegram and Slack tokens, GitHub token, Firecrawl, Jina, Serper, Exa, ITAStack token, 3CX and Bitwarden secrets), so removal must be line-level, not file-level. `~/.dsh` is retired but `~/.dsh/dsh-tls.{crt,key}` on aidev must stay.
- The OpenRouter main key appears in session transcripts and subagent artifacts on all three hosts, so deleting files never removes it from disk history; only revocation does.
- wrk's pi-lens latency log and the fabric observation pool matched only this sweep's own masking patterns, not real keys.

## Related

- [OpenRouter Key Inventory Across Machines](memory/docs/workstation/openrouter-key-inventory.md) - where the OpenRouter keys sit and which apps consume them.
- [Adding a CLIProxy Model to the pi Fleet](memory/docs/workstation/pi-cliproxy-model-fleet.md) - how the proxy's provider blocks and per-machine models.json work.
- [Claude Code CLIProxy Fleet](memory/docs/workstation/claude-code-cliproxy-fleet.md) - how Claude Code is already pointed at the proxies.
