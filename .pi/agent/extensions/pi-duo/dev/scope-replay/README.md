# scope-replay — offline tuning harness for the pi-duo scope gate

Dev-only harness used to tune the mid-loop **scope (proportionality)** verifier
prompt and the **conventions distillation** prompt offline, by replaying real
pi-duo session `.jsonl` turns against a candidate prompt. Not loaded by Pi (it
lives under `dev/`, not `extensions/*/index.ts`, so auto-discovery ignores it).

The tuned prompts now live in `../../src/duo-core.ts` as `VERIFIER_SCOPE_PROMPT`
and `CONVENTIONS_DISTILL_PROMPT` — this harness is kept for re-tuning.

## Files
- `replay.py` — replays one user turn, builds an enriched evidence transcript
  cut at N steps, asks a verifier for `VERDICT: PASS/REVISE`. Holds the
  canonical `SCOPE_PROMPT` + `DISTILL_PROMPT` (v3) the code was tuned to.
- `enrich.mjs` — bridge that builds the transcript via the REAL `duo-core.ts`
  (imported relatively), so the harness tests shipped code. `USE_BRIDGE=1`.
- `verify-codex.mjs` — routes the verdict through a real Pi provider model
  (OAuth codex etc.) via Pi's `AuthStorage`/`ModelRegistry`. `VERIFIER=<slot>`.
- `bench.py` — scores candidate verifier models against the 5-case matrix.
  Loops `replay.py` over (model × case × trial) with the SHIPPED prompt
  (`USE_BRIDGE=1 DISTILL=1`), parses the verdict, prints per-model accuracy vs
  expected + per-case majority/stability. The hand-run model comparison, made
  one command.

## Run
```
USE_BRIDGE=1 DISTILL=1 python3 replay.py <session.jsonl> <turnIdx> <cutSteps>
# alt verifier: VERIFIER=openai-codex/gpt-5.6-terra ...   (default deepseek-v4-pro)
# show digest:  SHOW_CONV=1 ...

# score models across the whole matrix (default N=3 trials):
python3 bench.py                                         # default model list
python3 bench.py deepseek-v4-pro openai-codex/gpt-5.6-terra
N=5 python3 bench.py <slot> ...                          # more trials
```
Slots with `/` route through the bridge; a bare name = deepseek direct.
Borderline cases (PIMOA cuts, WIKI) wobble ~1/3 across trials — read the
majority + stability count, not a single run.

## Machine-local assumptions (this is a dev tool, not portable code)
- `replay.py` reads the deepseek key from `~/.pi/agent/auth.json` via an
  absolute `/home/james/...` path; sessions are passed as argv.
- `verify-codex.mjs` imports `completeSimple` from the pi-ai instance **nested
  under the global pi-coding-agent install** (`/home/james/.npm-global/...`) —
  must be the same instance `ModelRegistry` registers providers into, or the
  provider lookup misses. `openai-codex-responses` rejects `temperature`.
- Update these paths per machine before running elsewhere.

## Tuning result (2026-07-14)
deepseek-v4-pro + v3 distillation scored 18/18 on the 5-case matrix
(HIDE/PIMOA@30/PIMOA@40/REVIEW/WIKI/CAVE). gpt-5.6-terra scored worse
(WIKI false-positive ×3, softer on PIMOA@40) — deepseek is the locked verifier.
