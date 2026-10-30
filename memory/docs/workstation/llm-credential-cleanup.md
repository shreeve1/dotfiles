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

- Cleanup ran 2026-10-30 on wrk (WSL), aidev and itan8n (n8n). No key value is stored here; every credential is named by a sha256 prefix. Goal: every LLM call goes through `~/cliproxyapi/config.yaml` on aidev or itan8n. Both serve the same 10 models (claude-haiku-5-5, claude-opus-5-5, claude-sonnet-5-5, deepseek-v4.1-flash, glm-5.3, glm-5.3-flash, gpt-6-luna, gpt-6.1-sol, gpt-6.1-terra, minimax-m3) and hold the upstream keys for z.ai, MiniMax and OpenRouter. No gpt-4o, so an app pinned to gpt-4o cannot be repointed.
- Credentials:
  - OpenRouter "main" `sha=75280a04ed` (73): DEAD (401 "User not found" at `https://openrouter.ai/api/v1/auth/key`, 2026-10-30). Every on-disk copy is gone except the Jev ones in `~/pi-durable/.env`.
  - OpenRouter "proxy" `sha=9d297bc8ac`: aidev live `~/cliproxyapi/config.yaml` openrouter block, and itan8n's since 2026-10-30 through `OPENROUTER_PROXY_API_KEY` in `~/.zshrc.secrets` (launcher substitutes it). LIVE: deepseek-v4.1-flash returns OK through both proxies. Keep. Two aidev backups still hold it (`config.yaml.bak-claude-code-haiku-*`, `config.yaml.bak-deepseek-v41-only-*`); purge them once the live config has settled.
  - OpenRouter "medium" `sha=d4babaca1b` and "high" `sha=a804d7c7ad`: only ever in itan8n `~/.claude/litellm-env` for the litellm tier map. That file is deleted, so both live keys now exist nowhere on disk. Revoke them in the OpenRouter dashboard.
  - MiniMax `sha=2b3a0c8f37` (sk-cp, 125): kept only in aidev's live cliproxy config; every other copy deleted.
  - Jev `sha=5a9c031174` (apikey_28, 107) stays in `dotfiles/.pi/agent/auth.json` on all three hosts (Jev CLI credential, not an LLM-provider key).
  - OpenAI project `sha=22c78cc25f` (sk-proj, 164): kept in wrk `~/3cx-web-chat/chat-api/.env` and aidev `~/honcho/.env` (both pinned to gpt-4o, which cliproxy does not serve); the aidev deploy snapshots and notes copy are deleted.
  - Gemini `sha=db5efddaf1` and xAI `sha=cea57199e9`: no live consumer; the copies that held them are deleted. Revoke both in their dashboards.
  - Anthropic OAuth `sk-ant-oat01-`: kept only in itan8n `~/.cli-proxy-api/claude-18beac6c-james@itassurance.com.json` (cliproxy's own account pool).
  - The 24-character cliproxy client token (`sha=4d8158547e`) is the shared client secret, not an upstream credential: aidev `~/.zshrc.secrets`, wrk `~/.pi/agent/models.json`. Keep.
- Deleted on itan8n: `~/.claude/litellm-config.yaml` and two backups, `~/.claude/litellm-env`, `~/.claude/litellm_strict_probe.py`, `~/.claude/litellm_usage_logger.py`, `~/.claude/.credentials.json`, `~/.claude/settings-minimax.json`, the `litellm-proxy.service` and `litellm-socat.service` user units, `~/.dsh/.credentials.yaml`, `~/.dsh/dsh-web.env`, `dsh-web.service` and its backup, `~/cli-proxy-api-disabled/*.dead-refresh-20261025`, hermes `cache/config-backups/*` and every `state-snapshots/*`, the OPENROUTER_API_KEY and MINIMAX_API_KEY lines of `~/.hermes/.env`, the `openrouter` and `minimax` entries of `dotfiles/.pi/agent/auth.json` (jev kept), `auth.json.bak.20260530153843`, `auth.json.bak-cponly-20261015`, and the `~/.zshrc.secrets.bak-*` copies that held the dead key.
- Deleted on aidev: the OPENROUTER_API_KEY and MINIMAX_API_KEY lines of `~/.hermes/.env` and the genops, netops, projectlean, responder, secops and storageops profile envs, hermes `.env.bak-*`, profile `.env.bak-*`, every `state-snapshots/*`, `migration-backups/*` and `profiles/genops/cache/scratch/t_30209aea-review`, `~/.dsh/.credentials.yaml`, `~/.dsh/dsh-web.env` and its backup, `dsh-web.service` and its backup, the `litellm-proxy.service` and `litellm-socat.service` units, the OPENROUTER_API_KEY line of `/etc/homelab-stack/langgraph.env` (sudo) plus its `.bak` and `.pre*` copies, `~/pi-rmm/.secrets/openrouter.key` and `~/pi-rmm/.env`, `~/maintenance/2026{1019,1020}-chat-api-deploy/env.before-deploy`, the key lines in `~/ob/1.Work/3.Internal/ai/pi-win.md`, the `openrouter` and `minimax` entries of `dotfiles/.pi/agent/auth.json` (jev kept), `auth.json.bak-cponly-20261015`, and the 7 `~/cliproxyapi/config.yaml.bak-*` copies holding the dead key.
- Deliberately left: `~/.dsh/dsh-tls.{crt,key,pem}` on both hosts, aidev `~/.claude/litellm-config.yaml` and `start-litellm.sh` (cliproxy token only), the aidev hermes GLM, DASHSCOPE and DEEPSEEK keys, `~/.prime/agent/auth.json` (DeepSeek key), ZAI_API_KEY (`key_env` in `~/.hermes/config.yaml`), wrk `~/3cx-web-chat/chat-api/.env` and aidev `~/honcho/.env` (live apps), and every `~/pi-durable/.env` (Jev work).
- Still open: wrk and aidev `~/pi-durable/.env` still hold the dead main key for Jev; the itastack temporal worker moved to TypeSafe's native Jev API on 2026-10-30 (`https://api.typesafe.ai/v1/systemone`, `.env.sops` carries TYPESAFE_API_KEY, no OpenRouter call left). Revoking medium, high, Gemini and xAI needs dashboard access. Session transcripts, subagent artifacts and opencode session files still carry some key material on disk; only provider-side revocation makes that harmless.
- wrk's pi-lens latency log and the fabric observation pool matched only this sweep's own masking patterns, not real keys.

## Related

- [OpenRouter Key Inventory Across Machines](memory/docs/workstation/openrouter-key-inventory.md) - where the OpenRouter keys sit and who consumes them.
- [Adding a CLIProxy Model to the pi Fleet](memory/docs/workstation/pi-cliproxy-model-fleet.md) - the proxy's provider blocks and per-machine models.json.
- [Claude Code CLIProxy Fleet](memory/docs/workstation/claude-code-cliproxy-fleet.md) - how Claude Code points at the proxies.
