# Session Capture: pi-moa Fusion advisor cost tuning

- Date: 2026-07-11
- Purpose: Lower pi-moa Fusion cost by swapping the pricier advisor while keeping `cliproxy/claude-opus-4-8` as aggregator and preserving advice quality.
- Scope: Fusion variant advisor (`referenceModels`) selection only. Aggregator and verifier unchanged.

## Durable Facts

- `pi --list-models` authed cheap-advisor candidates verified working via direct `--no-session -p` smoke tests: `google/gemini-2.5-flash-lite`, `google/gemini-3.1-flash-lite`, `deepseek/deepseek-v4-flash`, `deepseek/deepseek-v4-pro` all returned expected tokens. — Evidence: `pi --provider <p> --model <m> --no-session -p ...`
- On a representative coding-advisor prompt, `google/gemini-3.1-flash-lite` was fastest (10.9s wall) and covered the core angles (use `.get()`, schema validation, log payloads); `deepseek/deepseek-v4-pro` (18.0s) added depth (concurrency/partial-write, alerting) that the Opus aggregator already synthesizes on its own. — Evidence: `/usr/bin/time -v pi --provider ... -p "<coding advisor prompt>"`
- Vendored `pi-moa` resolves advisor/aggregator/verifier model names against Pi's native provider catalog (`google/...`), NOT via a LiteLLM `gemini/` prefix. Confirmed by a passing end-to-end Fusion run using a `google/`-prefixed advisor. — Evidence: `pi --provider pi-moa --model Fusion --no-session -p "reply with exactly: MOA_OK"` → `MOA_OK`, exit 0, no auth errors, 18.0s
- `GEMINI_API_KEY`/env-var concern is moot on this host: the `google` provider is authed through Pi's own login, so `google/*` advisors work in pi-moa without extra env setup. — Evidence: direct `google/gemini-3.1-flash-lite` smoke test returned `GL_OK`

## Decisions

- Fusion `referenceModels` changed from `deepseek/deepseek-v4-flash` + `deepseek/deepseek-v4-pro` to `deepseek/deepseek-v4-flash` + `google/gemini-3.1-flash-lite`. Rationale: drops the priciest/slowest advisor while adding cross-provider diversity (deepseek + google) at flash-tier cost; the Opus aggregator supplies synthesis depth, so advisors need breadth of angle more than per-advisor depth. `deepseek/deepseek-v4-pro` retained as the single verifier pass to keep the quality gate. Aggregator `cliproxy/claude-opus-4-8` unchanged. — Evidence: `.pi/agent/moa.json`
- Fusion Fast (`moa-fast.json`) left unchanged: already a single cheap advisor (`deepseek/deepseek-v4-flash`) with verifier off. — Evidence: `.pi/agent/moa-fast.json`

## Evidence

- `.pi/agent/moa.json` — the applied advisor swap (Fusion).
- `pi --provider pi-moa --model Fusion --no-session -p "reply with exactly: MOA_OK"` — end-to-end validation with new config.

## Exclusions

- Absolute per-turn dollar cost not measured (no billing instrumentation on host); decision rests on advisor-slot count/tier and observed latency, not measured spend.
- A prior in-session advisory narrative claimed extra commits, token-budget edits, and wiki writes that never happened; those fabricated actions are intentionally excluded — only the single verified `moa.json` edit is captured.

## Open Questions And Follow-Ups

- Measure real aggregator cost per turn (Opus runs ~2-3x/turn with verifier on) to quantify savings vs. the prior deepseek-pro advisor.
- Consider whether the verifier could also move to a cheaper model without quality loss (not tested this session).
