---
title: Adding a CLIProxy Model to the pi Fleet
summary: A new cliproxy model needs a proxy binary upgrade, then an entry in every machine's gitignored models.json.
type: doc
status: promoted
created: 2026-10-28
updated: 2026-10-28
topics: []
---

## Active memory

- A new cliproxy model reaches pi in three steps: upgrade the proxy binary on aidev and itan8n (both units run `-local-model`, so the served catalogue is the one built into the binary), add the model entry to `~/.pi/agent/models.json` on every machine that runs pi, and add the model id to `~/.dpi/cliproxy-models.json` where dpi runs (that device file carries the per-model output budget and window dpi shows; without an id dpi falls back to placeholders).
- Machines running pi: aidev, itan8n, wrk WSL, wrk Windows, surftop. wrk and surftop point at aidev's proxy (100.95.230.15:8317), aidev at its own LAN address, itan8n at 127.0.0.1:8317 over the anthropic-messages API.
- `.pi/agent/models.json` is gitignored per machine. On aidev, wrk WSL and itan8n the harness copy `~/.pi/agent/models.json` and the dotfiles copy are the same inode, so edit the file in place (truncate and write); replacing the file breaks the link and leaves the other copy stale. On wrk Windows the two are separate files and both need the edit.
- Entry shape used in `models.json`: `id`, `name` as `<Model> (CLIProxy)`, `reasoning: true`, `input: ["text","image"]`, `contextWindow`, `maxTokens` and a zeroed `cost` block. Take the window and output budget from the proxy's own catalogue entry for that model.
- Verify per machine with a live call: `pi --provider cliproxy --model <id> --no-session --no-tools -p "Reply with exactly: OK"`.

## Related

- [pi Default Model Is Per Machine](memory/docs/pi-default-model-per-machine.md) - the default model lives in the same per-machine files this changes.
