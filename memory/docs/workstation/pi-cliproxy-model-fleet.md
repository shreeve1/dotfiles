---
title: Adding a CLIProxy Model to the pi Fleet
summary: A new cliproxy model needs a proxy binary upgrade, then an entry in every machine's gitignored models.json; GLM models go through the z.ai coding plan.
type: doc
status: promoted
created: 2026-10-28
updated: 2026-10-30
topics: [workstation]
---

## Active memory

- A new cliproxy model reaches pi in three steps: upgrade the proxy binary on aidev and itan8n (both units run `-local-model`, so the served catalogue is the one built into the binary), add the model entry to `~/.pi/agent/models.json` on every machine that runs pi, and add the model id to `~/.dpi/cliproxy-models.json` where dpi runs (that device file carries the per-model output budget and window dpi shows; without an id dpi falls back to placeholders).
- Machines running pi: aidev, itan8n, wrk WSL, wrk Windows, surftop. wrk and surftop point at aidev's proxy (100.95.230.15:8317), aidev at its own LAN address, itan8n at 127.0.0.1:8317 over the anthropic-messages API.
- `.pi/agent/models.json` is gitignored per machine. On all five environments, the harness copy `~/.pi/agent/models.json` and the dotfiles copy were the same inode when checked 2026-10-30. Check identity before editing and write in place (truncate and write); replacing the file breaks the link and leaves the other copy stale. If copies differ, update both.
- Entry shape used in `models.json`: `id`, `name` as `<Model> (CLIProxy)`, `reasoning: true`, `input: ["text","image"]`, `contextWindow`, `maxTokens` and a zeroed `cost` block. Take the window and output budget from the proxy's own catalogue entry for that model. `claude-sonnet-5-5` had a copied 16384 (itan8n 64000) until 2026-10-30, when all five machines were set to 128000 like Opus; backups are `models.json.bak-sonnet-maxtokens-20261030`.
- Which upstream serves a model is set per provider block in each proxy's `~/cliproxyapi/config.yaml` (`openai-compatibility`): `zai` (the GLM Coding Plan, `api.z.ai/api/coding/paas/v4`), `minimax`, `openrouter` (billed per call). GLM models go through the z.ai plan, not OpenRouter: `glm-5.3-flash` moved there on aidev and itan8n 2026-10-29. Repeating an alias across blocks makes a round-robin pool, so a model moved between providers must leave its old block. Back up first as `config.yaml.bak-<reason>-<date>`, restart with `systemctl --user restart cliproxyapi`.
- itan8n's `config.yaml` is a template: keys are `__ZAI_API_KEY__`-style placeholders that `~/cliproxyapi/cliproxyapi-launcher.sh` fills from `~/.zshrc.secrets` into `/tmp/cliproxyapi-resolved.conf` at start. Edit the template, never the resolved file. aidev's unit reads `config.yaml` directly.
- z.ai's `glm-5.3-flash` rejects pi's default `developer` system role (`1214 Incorrect role information`; `glm-5.3` accepts it), so its `models.json` entry needs `"compat": {"supportsDeveloperRole": false}`. Set on aidev, itan8n, wrk WSL and wrk Windows 2026-10-29; surftop was offline and still needs it.
- `gpt-6.1-terra` is registered on all five Pi environments with a 500000-token context window and 128000-token output limit. It is also in each user settings file's `enabledModels` list and the tracked `.pi/agent/settings.json.template`, next to Sol. `models.json` registration alone does not add a model to the configured quick-cycle list; update `enabledModels` too without changing defaults. All five passed a live Terra prompt on 2026-10-30. aidev's existing dpi catalogue already has Terra; the other four had no dpi catalogue.
- James wants only `deepseek-v4.1-flash`, not `deepseek-v4-flash`, on both proxies. The old provider mapping, all five Pi model registrations, obsolete compaction overrides, Claude picker entries, and aidev's dpi entry were removed. Do not reintroduce V4 when refreshing catalogues.
- Verify per machine with a live call: `pi --provider cliproxy --model <id> --no-session --no-tools -p "Reply with exactly: OK"`.

## Related

- [pi Default Model Is Per Machine](memory/docs/workstation/pi-default-model-per-machine.md) - the default model lives in the same per-machine files this changes.
