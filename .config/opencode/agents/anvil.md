---
description: Moonshot-family code producer (Anvil — The Patient Shaper). DEFERRED in this OpenCode port — requires Kimi K2.6 via Moonshot's direct API, which is not configured. Hard-disabled via non-existent model so any accidental invocation fails fast at provider resolution rather than silently producing GPT-5.4 output under the Anvil persona. Restore by adding a Moonshot provider to opencode.json and a `cliproxy/kimi-k2.6` model entry.
mode: subagent
model: moonshot/kimi-k2.6-not-configured
color: "#475569"
hidden: true
disable: true
tools:
  bash: false
  read: false
  write: false
  edit: false
permission:
  edit: deny
  bash:
    "*": deny
---

# Anvil — Deferred (Moonshot provider not configured)

## Status

Anvil is **deferred** in this OpenCode PAI port. Anvil requires Kimi K2.6 (`kimi-k2.6`) via Moonshot's direct API at 256K context — that provider is not present in `opencode.json`. The local CLIProxy provider exposes Claude- and GPT-family models only.

## Behavior when invoked

Return immediately:

```json
{
  "verdict": "unavailable",
  "reason": "Anvil requires Moonshot Kimi K2.6 — provider not configured in this OpenCode port",
  "recommendation": "use Forge (GPT-5.4) for cross-vendor code production, or Engineer (Claude-family) for in-family work"
}
```

Do not attempt to substitute another model under the Anvil persona. Anvil's value proposition is the Moonshot training distribution and 256K context window — running it on GPT-5.4 would just be another Forge invocation under a different name, which defeats the cross-vendor purpose.

## How to enable Anvil

1. Add a Moonshot provider to `opencode.json` (`https://api.moonshot.ai/v1` or compatible).
2. Declare a `kimi-k2.6` model entry with `temperature: 1` and `context: 262144`.
3. Replace this stub with the upstream Anvil persona from the PAI v5.0.0 release, with `model:` updated to point at the new provider.

Until then, Forge handles cross-vendor code production for E3/E4/E5 tasks.
