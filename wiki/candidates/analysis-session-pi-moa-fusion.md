---
title: pi-moa Fusion Provider and Model-Update Runbook
type: analysis
status: candidate
created: 2026-07-11
updated: 2026-07-11
sources:
  - wiki/raw/sessions/2026-07-11-pi-moa-fusion-install.md
  - .pi/agent/moa.json
  - .pi/agent/moa-fast.json
  - .pi/agent/extensions/pi-moa/README.md
confidence: high
tags:
  - pi-moa
  - fusion
  - mixture-of-agents
  - pi
  - models
  - runbook
  - aggregator
  - advisor
  - verifier
---

# pi-moa Fusion Provider and Model-Update Runbook

## Summary

`pi-moa` (`@duyviet1804/pi-moa`) is a vendored Pi extension that registers a
local Mixture-of-Agents provider named `pi-moa` with two models, `Fusion` and
`Fusion Fast`. It does not host a model itself: several advisor models think in
parallel, then an aggregator model reads their private advice and produces the
final streamed answer or tool call. With the verifier enabled, the aggregator
also runs a private draft + verifier review before the acting pass.

It is vendored into `.pi/agent/extensions/pi-moa/` (not `pi install`ed), matching
the dotfiles convention that all Pi extensions sync via the repo rather than
machine-local install state.

## Which Models Run (current)

| Variant | Config file | Advisors (`referenceModels`) | Aggregator | Verifier |
|---------|-------------|------------------------------|------------|----------|
| Fusion | `.pi/agent/moa.json` | `deepseek/deepseek-v4-flash`, `google/gemini-3.1-flash-lite` | `cliproxy/claude-opus-4-8` | on (`deepseek/deepseek-v4-pro`) |
| Fusion Fast | `.pi/agent/moa-fast.json` | `deepseek/deepseek-v4-flash` | `cliproxy/claude-opus-4-8` | off |

Both config files live at the agent-dir root and are git-tracked, so model
choices sync across machines. Credentials do not: each configured provider must
be authenticated on the machine (`/login`) and the provider must appear in Pi's
catalog.

## Runbook: Change the Models pi-moa Uses

1. Pick the target variant's config file: `.pi/agent/moa.json` (Fusion) or
   `.pi/agent/moa-fast.json` (Fusion Fast).
2. Discover valid provider/model names before editing — the names must match
   Pi's catalog exactly:

   ```bash
   pi --list-models
   pi --list-models deepseek
   ```

3. Edit the relevant fields:
   - `referenceModels`: array of advisor `{ "provider": "...", "model": "..." }`
     pairs (non-empty). Add entries for more diverse advice; remove for cost.
   - `aggregator`: single `{ "provider": "...", "model": "..." }` — the model
     that reads advisor notes and produces the final response. This is the most
     expensive slot (runs 2-3x/turn when the verifier is on).
   - `verifier` (optional): `{ "provider": "...", "model": "..." }`. If omitted
     while `enableVerifier` is true, pi-moa uses the first advisor that differs
     from the aggregator, then falls back to the aggregator only if necessary.
   - `enableVerifier`: `true` adds a private draft + verifier review pass;
     `false` streams the acting aggregator immediately after advisors.
4. Save. The config is validated fail-loud at request time — invalid JSON or an
   unknown provider/model makes both requests and `/pi-moa` fail rather than run
   the wrong mix.
5. In a running Pi session, run `/reload` so the model picker refreshes the
   capability metadata it derives from the aggregator.
6. Verify with `/pi-moa` (alias `/pi-moa:status`) — it prints the resolved
   config paths and loaded JSON for both variants — then run a quick prompt:

   ```bash
   pi --provider pi-moa --model Fusion --no-session -p "reply with exactly: MOA_OK"
   ```

Reset a variant to built-in defaults by deleting its config file
(`rm .pi/agent/moa.json`), though that reverts to the upstream OpenCode Go
defaults, which are not authenticated here.

## Cost Note

Every user turn calls all advisors plus the aggregator. With the verifier on
(Fusion), the aggregator additionally produces a private draft and a revision,
so an Opus aggregator runs roughly 2-3x per turn. Fusion Fast (1 advisor,
verifier off) is the cheap/fast path. To reduce cost without switching variant,
lower `referenceMaxTokens`, drop an advisor, or point `aggregator` at a cheaper
model.

### Advisor cost tuning (2026-07-11)

To cut advisor cost while keeping the Opus aggregator, the Fusion `deepseek/deepseek-v4-pro`
advisor was replaced with `google/gemini-3.1-flash-lite`, leaving `deepseek/deepseek-v4-flash`
as the second advisor and `deepseek/deepseek-v4-pro` as the single verifier. Rationale: the
Opus aggregator supplies synthesis depth, so advisors need breadth of angle (now cross-provider:
deepseek + google) more than per-advisor depth; the dropped advisor was both the priciest and
slowest slot. On a representative coding-advisor prompt, `gemini-3.1-flash-lite` answered in
10.9s vs `deepseek-v4-pro`'s 18.0s and still covered the core angles. Validated end-to-end with
`pi --provider pi-moa --model Fusion --no-session -p "reply with exactly: MOA_OK"` → `MOA_OK`,
exit 0, no auth/parse errors. Note: pi-moa resolves model names against Pi's native provider
catalog (`google/...`), not a LiteLLM `gemini/` prefix, so no extra env var is needed when the
`google` provider is already authed via Pi login. Absolute per-turn dollar cost was not measured;
the saving is by advisor tier (pro → flash-lite) and latency, not instrumented spend.

## Version Requirement

pi-moa 0.2.6 imports `@earendil-works/pi-ai/compat`, which exists only in pi-ai
0.80.6+. The dotfiles agent pins `@earendil-works/{pi-ai,pi-coding-agent,pi-tui}`
at `^0.80.6` for this reason. On an older pi-ai the extension fails to load and
the load error aborts Pi startup until fixed.

## Related

- rpiv-advisor's manual `advisor` tool is auto-stripped when a `pi-moa` model
  drives, via `disabledForModels` in the machine-local
  `~/.config/rpiv-advisor/advisor.json` (not synced — re-add per machine).

# Citations

- `@duyviet1804/pi-moa` package README — https://pi.dev/packages/@duyviet1804/pi-moa
