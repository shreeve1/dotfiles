---
id: 041
title: Fix researcher role tool shape
status: done
previous_status: blocked
blocked_by: []
parent: null
priority: 0
created: 2026-07-25
updated: 2026-07-25
actor: human
---

## What to build

The `researcher` subagent role references stale tool names (`fetch_content`, `get_search_content`) and a `web_search({queries})` schema that don't match the installed `rpiv-web-tools` extension. Fix the settings files and the researcher prompt so the role uses the actual installed tool shapes: `web_search({query, max_results?})` and `web_fetch({url, raw?})`. Add `web_fetch` to the role's tools list and to the read-only tool classifier. Rewrite the search strategy in the prompt for single-query-per-call semantics.

## Acceptance criteria

- [x] `.pi/agent/settings.json.template` `researcher.tools` is `["read", "web_search", "web_fetch"]` (no `fetch_content`/`get_search_content`)
- [x] `.pi/agent/settings.json` live `researcher.tools` mirrors the template (tool-list only; model/thinking untouched)
- [x] `.pi/agent/extensions/pi-subagents/agents/researcher.md` references `web_search({query, max_results?})` and `web_fetch({url, raw?})`
- [x] Prompt does not mention `fetch_content`, `get_search_content`, or `workflow: "none"`
- [x] Prompt search strategy uses single-query-per-call (one `web_search` call per angle)
- [x] `completion-guard.ts` `READ_ONLY_BUILTIN_TOOLS` adds `web_fetch` (retain `fetch_content`/`get_search_content` for pi-web-access compat)
- [x] `test/unit/researcher-prompt.test.ts` passes: asserts prompt contains new shapes, excludes legacy names
- [x] `test/unit/researcher-tools.test.ts` passes: asserts settings contain `web_search`/`web_fetch`, exclude legacy names

## Verification

`node --experimental-strip-types --test test/unit/researcher-prompt.test.ts test/unit/researcher-tools.test.ts`

## Blocked by

None — can start immediately

## Implementation Notes

**What changed:** Updated researcher role tools and prompt to use rpiv-web-tools actual API shapes: web_search({query, max_results?}) and web_fetch({url, raw?}). Replaced fetch_content/get_search_content in settings and frontmatter. Added web_fetch to completion-guard read-only classifier. Created two regression tests.

**Files:** .pi/agent/settings.json.template, .pi/agent/settings.json, .pi/agent/extensions/pi-subagents/agents/researcher.md, .pi/agent/extensions/pi-subagents/src/runs/shared/completion-guard.ts, .pi/agent/extensions/pi-subagents/test/unit/researcher-prompt.test.ts, .pi/agent/extensions/pi-subagents/test/unit/researcher-tools.test.ts

**Decisions:** Kept fetch_content/get_search_content in completion-guard.ts READ_ONLY_BUILTIN_TOOLS for pi-web-access backward compat. Settings.json (gitignored) tool-list only; model/thinking preserved.

**Notes for next iteration:** completion-guard.ts picked up behavior-neutral signature line-wrapping (formatting only, no regression risk). Reviewer noted this as low-severity diff noise.

## Blocker

Review reported DONE but the driver verification gate failed: `node --experimental-strip-types --test test/unit/researcher-prompt.test.ts test/unit/researcher-tools.test.ts` (exit nonzero). Auto-parked done→blocked; see the loop log for output.

## Resolution

Deterministic re-verification on 2026-07-25: `node --experimental-strip-types --test test/unit/researcher-prompt.test.ts test/unit/researcher-tools.test.ts` exits 0 (3/3 tests pass: researcher prompt uses rpiv-web-tools API; agent/settings.json researcher.tools references web_search and web_fetch only; agent/settings.json.template researcher.tools references web_search and web_fetch only). Acceptance criteria satisfied; promoted blocked→done.
