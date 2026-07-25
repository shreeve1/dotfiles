---
id: 041
title: Fix researcher role tool shape
status: pending
blocked_by: []
parent: null
priority: 0
created: 2026-07-25
---

## What to build

The `researcher` subagent role references stale tool names (`fetch_content`, `get_search_content`) and a `web_search({queries})` schema that don't match the installed `rpiv-web-tools` extension. Fix the settings files and the researcher prompt so the role uses the actual installed tool shapes: `web_search({query, max_results?})` and `web_fetch({url, raw?})`. Add `web_fetch` to the role's tools list and to the read-only tool classifier. Rewrite the search strategy in the prompt for single-query-per-call semantics.

## Acceptance criteria

- [ ] `.pi/agent/settings.json.template` `researcher.tools` is `["read", "web_search", "web_fetch"]` (no `fetch_content`/`get_search_content`)
- [ ] `.pi/agent/settings.json` live `researcher.tools` mirrors the template (tool-list only; model/thinking untouched)
- [ ] `.pi/agent/extensions/pi-subagents/agents/researcher.md` references `web_search({query, max_results?})` and `web_fetch({url, raw?})`
- [ ] Prompt does not mention `fetch_content`, `get_search_content`, or `workflow: "none"`
- [ ] Prompt search strategy uses single-query-per-call (one `web_search` call per angle)
- [ ] `completion-guard.ts` `READ_ONLY_BUILTIN_TOOLS` adds `web_fetch` (retain `fetch_content`/`get_search_content` for pi-web-access compat)
- [ ] `test/unit/researcher-prompt.test.ts` passes: asserts prompt contains new shapes, excludes legacy names
- [ ] `test/unit/researcher-tools.test.ts` passes: asserts settings contain `web_search`/`web_fetch`, exclude legacy names

## Verification

`node --experimental-strip-types --test test/unit/researcher-prompt.test.ts test/unit/researcher-tools.test.ts`

## Blocked by

None — can start immediately
