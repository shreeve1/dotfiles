# Session Capture: pi-moa Fusion install and model-update runbook

- Date: 2026-07-11
- Purpose: Vendored `@duyviet1804/pi-moa` (Mixture-of-Agents Fusion provider) into the dotfiles Pi harness and established how to change which models it uses.
- Scope: Install/config decisions, the config-file layout, and the operational runbook for swapping pi-moa models. Excludes the unrelated PATH/root-binary cleanup done in the same session.

## Durable Facts

- pi-moa registers one Pi provider (`pi-moa`) with two models: `Fusion` and `Fusion Fast`. It is an orchestrator, not a hosted model — advisors run in parallel, an aggregator reads their private advice and produces the final answer/tool call. — Evidence: `.pi/agent/extensions/pi-moa/README.md`
- Each variant reads its own config file at the agent-dir root: `Fusion` → `.pi/agent/moa.json`, `Fusion Fast` → `.pi/agent/moa-fast.json` (or `$PI_CODING_AGENT_DIR/{moa,moa-fast}.json` when that env var is set). — Evidence: `.pi/agent/extensions/pi-moa/extensions/pi-moa.ts:59-64`
- Both config files are git-tracked (the agent `.gitignore` only excludes `auth.json`, `models.json`, sessions, `node_modules`, `package-lock.json`), so they sync across machines. — Evidence: `.pi/agent/.gitignore`
- Config fields that select models: `referenceModels` (array of advisor `{provider, model}` pairs), `aggregator` (`{provider, model}`), and optional `verifier` (`{provider, model}`). Every `provider`/`model` must exist in Pi's catalog; discover names with `pi --list-models` or `pi --list-models <provider>`. — Evidence: `.pi/agent/extensions/pi-moa/README.md`
- Config loading is fail-loud at request time: a missing file falls back to built-in defaults, but a present-but-invalid file makes requests AND the `/pi-moa` status command fail loudly rather than silently run the wrong mix. — Evidence: `.pi/agent/extensions/pi-moa/extensions/pi-moa.ts:66-75`
- The model picker derives image/context-window/output-token/reasoning capability from the configured aggregator at session start; after editing `moa.json`/`moa-fast.json`, run `/reload` to refresh picker metadata. `/pi-moa` (alias `/pi-moa:status`) prints the active version, state, resolved config paths, and loaded config JSON for both variants. — Evidence: `.pi/agent/extensions/pi-moa/README.md`, `.pi/agent/extensions/pi-moa/extensions/pi-moa.ts:588-593`
- pi-moa 0.2.6 imports `@earendil-works/pi-ai/compat`, a subpath that exists only in pi-ai 0.80.6+. On 0.75.5 the extension fails to load with "Package subpath './compat' is not defined" and that load error aborts every Pi startup until the version is bumped or the extension is removed from the scan path. — Evidence: `.pi/agent/extensions/pi-moa/extensions/pi-moa.ts:13`, `~/.pi/agent/node_modules/@earendil-works/pi-ai/package.json` exports
- Current config: advisors `deepseek/deepseek-v4-flash` + `deepseek/deepseek-v4-pro`, aggregator `cliproxy/claude-opus-4-8`. Fusion runs the verifier (`enableVerifier: true`, aggregator ~2-3x/turn); Fusion Fast is 1 advisor (`deepseek-v4-flash`) with `enableVerifier: false`. — Evidence: `.pi/agent/moa.json`, `.pi/agent/moa-fast.json`

## Decisions

- Vendor pi-moa into `.pi/agent/extensions/pi-moa/` (via `npm pack` extract) rather than `pi install`, matching the repo's sync-over-machine-local-state convention for all Pi extensions. — Evidence: dotfiles `CLAUDE.md` non-obvious-requirements section
- Run pi-moa entirely on already-authenticated providers (deepseek + cliproxy) instead of signing up for the default OpenCode Go key. — Evidence: session note; `.pi/agent/auth.json` has no `opencode`/`opencode-go` entry
- Keep the verifier ON for Fusion (quality) and OFF for Fusion Fast (that variant's purpose is speed/cost). — Evidence: `.pi/agent/moa.json`, `.pi/agent/moa-fast.json`
- Bump `.pi/agent/package.json` earendil pins `^0.75.5` → `^0.80.6` so `pi-ai/compat` resolves; all other vendored extensions peer-depend on `*` or `>=0.74`, so the bump is safe. — Evidence: `.pi/agent/package.json`
- Auto-strip the manual `advisor` tool (rpiv-advisor) when a pi-moa model drives, via `disabledForModels: ["pi-moa:Fusion", "pi-moa:Fusion Fast"]` in `~/.config/rpiv-advisor/advisor.json` (machine-local, not synced). — Evidence: `~/.config/rpiv-advisor/advisor.json`, `.pi/agent/extensions/rpiv-advisor/advisor.ts:600-614`

## Evidence

- `.pi/agent/extensions/pi-moa/README.md` — config field reference, model-name discovery, `/reload` and `/pi-moa` behavior.
- `.pi/agent/extensions/pi-moa/extensions/pi-moa.ts` — config path resolution, fail-loud loading, provider registration.
- `.pi/agent/moa.json`, `.pi/agent/moa-fast.json` — current model selection.
- `.pi/agent/package.json` — earendil version pins.

## Exclusions

- No credentials captured. `auth.json` is gitignored; API keys stay in `~/.pi/agent/auth.json` (0600).
- The PATH dedup and stale root `pi` binary removal from the same session (unrelated to pi-moa knowledge).

## Open Questions And Follow-Ups

- Cost of the Opus aggregator running 2-3x/turn under Fusion is unmeasured; may warrant a cheaper aggregator if spend is high.
