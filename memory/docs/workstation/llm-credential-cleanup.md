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

- Cleanup ran 2026-10-30 on wrk (WSL), aidev and itan8n (n8n). No key value is stored here; every credential is named by a sha256 prefix. Goal: every LLM call goes through `~/cliproxyapi/config.yaml` on aidev or itan8n. Both serve the same 10 models (listed in the Claude Code CLIProxy Fleet doc) and hold the upstream keys for z.ai, MiniMax and OpenRouter. No gpt-4o, so an app pinned to gpt-4o cannot be repointed.
- Credentials:
  - OpenRouter "main" `sha=75280a04ed` (73): DEAD (401 "User not found" at `https://openrouter.ai/api/v1/auth/key`, 2026-10-30). Every on-disk copy is gone except the Jev ones in `~/pi-durable/.env`.
  - OpenRouter "proxy" `sha=9d297bc8ac`: aidev live `~/cliproxyapi/config.yaml` openrouter block, and itan8n's since 2026-10-30 through `OPENROUTER_PROXY_API_KEY` in `~/.zshrc.secrets` (launcher substitutes it). LIVE: deepseek-v4.1-flash returns OK through both proxies. Keep. The two aidev backups that held it were deleted in the second sweep, so the live config is the only copy.
  - OpenRouter "medium" `sha=d4babaca1b` and "high" `sha=a804d7c7ad`: only ever in itan8n `~/.claude/litellm-env` for the litellm tier map. That file is deleted, so both live keys now exist nowhere on disk. Revoke them in the OpenRouter dashboard.
  - MiniMax `sha=2b3a0c8f37` (sk-cp, 125): kept only where cliproxy reads it (aidev live config, itan8n `~/.zshrc.secrets`); every other copy deleted.
  - Jev `sha=5a9c031174` (apikey_28, 107) stays in `dotfiles/.pi/agent/auth.json` on all three hosts (Jev CLI credential, not an LLM-provider key).
  - OpenAI project `sha=22c78cc25f` (sk-proj, 164): kept in wrk `~/3cx-web-chat/chat-api/.env` and aidev `~/honcho/.env` (both pinned to gpt-4o, which cliproxy does not serve); deploy snapshots and notes copies deleted.
  - Gemini `sha=db5efddaf1`: no live consumer anywhere and the aidev cliproxy backups that held it are gone, so revoke it. xAI `sha=cea57199e9`: the aidev copies are gone (revoke there), but itan8n still needs it because its cliproxy launcher substitutes `XAI_API_KEY` from `~/.zshrc.secrets` — keep that one.
  - Anthropic OAuth `sk-ant-oat01-`: kept only in itan8n `~/.cli-proxy-api/claude-18beac6c-james@itassurance.com.json` (cliproxy's own account pool).
  - The 24-character cliproxy client token (`sha=4d8158547e`) is the shared client secret, not an upstream credential: aidev `~/.zshrc.secrets`, wrk `~/.pi/agent/models.json`. Keep.
- Deleted on itan8n: the litellm stack (`~/.claude/litellm-config.yaml` + backups, `litellm-env`, `litellm_strict_probe.py`, `litellm_usage_logger.py`, the `litellm-proxy.service` and `litellm-socat.service` units), `~/.claude/.credentials.json`, `~/.claude/settings-minimax.json`, `~/.dsh/.credentials.yaml`, `~/.dsh/dsh-web.env`, `dsh-web.service` + backup, `~/cli-proxy-api-disabled/*.dead-refresh-20261025`, hermes `cache/config-backups/*` and `state-snapshots/*`, the OPENROUTER_API_KEY and MINIMAX_API_KEY lines of `~/.hermes/.env`, the `openrouter`/`minimax` entries and two backup files of `dotfiles/.pi/agent/auth.json` (jev kept), and the `~/.zshrc.secrets.bak-*` copies holding the dead key.
- Deleted on aidev: the OPENROUTER_API_KEY and MINIMAX_API_KEY lines of `~/.hermes/.env` and six profile envs, hermes `.env.bak-*`, `state-snapshots/*`, `migration-backups/*`, `profiles/genops/cache/scratch/t_30209aea-review`, `~/.dsh/.credentials.yaml`, `~/.dsh/dsh-web.env`, `dsh-web.service` + backup, the two litellm units, `start-litellm.sh` and `litellm-config.yaml`, the OPENROUTER_API_KEY line of `/etc/homelab-stack/langgraph.env` (sudo) plus its `.bak`/`.pre*` copies, `~/pi-rmm/.secrets/openrouter.key` and `~/pi-rmm/.env`, two `~/maintenance/2026*-chat-api-deploy/env.before-deploy` snapshots, the key lines in `~/ob/1.Work/3.Internal/ai/pi-win.md`, and the `openrouter`/`minimax` entries and backup of `dotfiles/.pi/agent/auth.json` (jev kept).
- Second sweep, same day: deleted every `dotfiles/.pi/agent/models.json.bak-*` and `settings.json.bak-*` that carried a key, the aidev cliproxy backups holding Gemini, xAI or the live proxy key, `~/maintenance/20261012-aidev-snapshot-reconcile/meta.db.hotcopy`, the itan8n notes copy of the OpenAI key, and the credential-bearing Trash files (14 on itan8n, 1 on aidev).
- Deliberately left: `~/.dsh/dsh-tls.{crt,key,pem}` on both hosts, the aidev hermes GLM, DASHSCOPE and DEEPSEEK keys, `~/.prime/agent/auth.json` (DeepSeek key), ZAI_API_KEY (`key_env` in `~/.hermes/config.yaml`), itan8n `~/.zshrc.secrets` (ZAI, XAI, DEEPSEEK, MINIMAX and OPENROUTER_PROXY are live cliproxy upstreams), wrk `~/3cx-web-chat/chat-api/.env` and aidev `~/honcho/.env` (live apps), and every `~/pi-durable/.env` (Jev work).
- Residuals: hermes profile `state.db` files, pi session transcripts and the fabric observation pool still contain credential strings; clearing those means losing session history. wrk's pi-lens latency log matched only this sweep's own masking patterns, not real keys.
- Still open: wrk and aidev `~/pi-durable/.env` still hold the dead main key for Jev; the itastack temporal worker moved to TypeSafe's native Jev API on 2026-10-30 (`https://api.typesafe.ai/v1/systemone`, `.env.sops` carries TYPESAFE_API_KEY, no OpenRouter call left). Revoking medium, high and the aidev Gemini and xAI copies needs dashboard access.

## Related

- [OpenRouter Key Inventory Across Machines](memory/docs/workstation/openrouter-key-inventory.md) - where the OpenRouter keys sit and who consumes them.
- [Adding a CLIProxy Model to the pi Fleet](memory/docs/workstation/pi-cliproxy-model-fleet.md) - the proxy's provider blocks and per-machine models.json.
- [Claude Code CLIProxy Fleet](memory/docs/workstation/claude-code-cliproxy-fleet.md) - how Claude Code points at the proxies.
