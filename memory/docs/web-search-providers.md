---
title: Web Search Providers per Machine
summary: rpiv-web-tools config per machine; Exa is reserved for the verify-final checker (WEB_SEARCH_PROVIDER=exa), sessions use Tavily or Serper.
type: doc
status: promoted
created: 2026-10-29
updated: 2026-10-29
topics: []
---

## Active memory

- pi's `web_search`/`web_fetch` come from the vendored `rpiv-web-tools` extension. Each machine keeps its own `~/.config/rpiv-web-tools/config.json` (not synced, holds API keys): `provider` plus `apiKeys.<name>`. There is no fallback between providers: a provider with no key fails.
- Exa is reserved for the verify-final recommendation checker, which runs with `WEB_SEARCH_PROVIDER=exa` (the env var outranks the config file). Interactive sessions must not default to Exa, so its $10 monthly free credit stays for the checker. Decided 2026-10-29.
- Session providers as of 2026-10-29: aidev `tavily` (moved off `exa`), itan8n `serper`, wrk WSL and wrk Windows `tavily`, surftop `tavily` (key copied from aidev 2026-10-29).
- Every machine has the same Exa key. Keys are compared across machines by hash prefix, never printed. Each changed config has a `config.json.bak-exa-20261029` beside it.

## Related

- [verify-final Logs and How to Measure It](memory/docs/verify-final-logs.md) - the checker this provider choice serves, and where its runs are logged.
