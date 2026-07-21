# Session Capture: two-layer verification — grounding gate (pi-duo) + completeness review (gap-review)

- Date: 2026-07-21
- Purpose: Capture why a second verification layer was added alongside pi-duo, what failure mode it targets, and the `gap-review` extension that automates it. Result of a `/grill-with-docs` session investigating "pi-duo misses something while working in `~/symphony`".
- Scope: the grounding-vs-completeness distinction; why pi-duo cannot catch completeness failures by design; the `gap-review` Pi extension. Intentionally narrow — only the verification-architecture decision and its automation.

## Durable Facts

- pi-duo is a **grounding gate**: its verifier (`VERIFIER_SYSTEM_PROMPT`, `duo-core.ts:56`) judges whether the actor's final answer is grounded in the transcript's evidence vs asserted from memory, and explicitly says "do not demand extra work beyond the user's request." A separate `VERIFIER_SCOPE_PROMPT` judges proportionality (over-reach), explicitly NOT correctness/grounding. — Evidence: `.pi/agent/extensions/pi-duo/src/duo-core.ts:56,115`, `docs/adr/0001-verification-two-layers.md`.
- pi-duo's verifier is invoked via `completeSimple()` (`pi-duo.ts:436`) — a single text completion with NO tools. It cannot read repo files; it only checks the answer against the flattened text transcript. So it can only catch a false claim if the contradicting evidence is already in the transcript. — Evidence: `.pi/agent/extensions/pi-duo/extensions/pi-duo.ts:436`, `duo-core.ts:533` (`verifierContext` returns `{systemPrompt, messages}`, no tools).
- There are TWO distinct agent-output failure modes: **grounding** (a false/unsupported claim) and **completeness** (a material behavior/edge case the work omits). pi-duo's grounding gate catches the first by design; it cannot catch the second (its prompt forbids demanding extra work). — Evidence: `CONTEXT.md`, `docs/adr/0001-verification-two-layers.md`.
- Reproduced on `~/symphony/contract_gate.py`: real pi-duo (minimax-M3 + deepseek-v4-flash) produced a fully correct six-part answer that nonetheless omitted ~13 material behaviors (coverage rounded to 4 decimals + zero-population guard; baseline check ignoring `n`; `--auto-revert`'s `check=False` and no-arg subprocess; `load_corpus` rejecting extra JSON keys; etc.). pi-duo's gate passed it; a fresh tooled subagent reviewer tasked to find omissions surfaced all of them. — Evidence: this session (live run 2026-07-21); omissions + the "no completeness criterion" claim independently cross-verified by `deepseek/deepseek-v4-pro` with file:line evidence.
- Synthetic false-claim probes did NOT reproduce pi-duo failing: pi-duo's tool-less verifier caught both a truncated-evidence unsupported claim and a subtle side-effect falsehood (full file visible). So pi-duo is competent at GROUNDING; the residual pain is COMPLETENESS. — Evidence: this session.
- The contract_gate comparison confounded prompt-stance, context (in-band vs fresh), AND tool access (tool-less vs tooled) simultaneously — so no single lever (freshness / tools / stance) was isolated as decisive. The honest claim is only that a completeness-focused fresh tooled review surfaced omissions pi-duo's grounding gate cannot. — Evidence: `docs/adr/0001-verification-two-layers.md` "Considered options".

## Decisions

- Two-layer verification: keep pi-duo as the cheap constant in-band **grounding gate**; add a separate on-demand **completeness review** (fresh tooled reviewer, omission-focused prompt) at task boundaries. Do not collapse them (different cost profiles). Recorded in `docs/adr/0001-verification-two-layers.md`; glossary in `CONTEXT.md`.
- The completeness-review value was achievable with existing tools (`subagent({agent:"reviewer"})` + the right prompt); the `gap-review` extension does not invent a new capability — it AUTOMATES that semantic at `turn_end`. Manual one-off use still just needs subagent + an omission prompt.
- `gap-review` design: hooks `tool_call` (accumulate touched read/write/edit file paths) + `before_agent_start` (capture the original request) + `turn_end` (terminal turns only, ≥200-char answers, ≥1 touched file → spawn a DETACHED fresh `pi -p --no-extensions ...` reviewer writing `.gap-reviews/<turn>-<ts>.md`) + `turn_start` (notify interactive sessions; surface via `.done`→`.notified`). Async, non-blocking, always-on (`PI_GAP_REVIEW=0` disables). — Evidence: `.pi/agent/extensions/gap-review/index.js`, `docs/adr/0001-verification-two-layers.md`.

## Gotchas (load-bearing for future sessions)

- pi fires `turn_end` (and `before_agent_start`) **per agent-step**, not per user-turn. Clearing the file accumulator at `before_agent_start` or `turn_start` wipes files accumulated during the tool step before the terminal `turn_end` consumes them — clear only at the terminal `turn_end`.
- pi's assistant content-block type for a tool call is `toolCall` (camelCase; `ToolCall` in pi-ai = `{type:"toolCall", name, arguments}`), NOT Anthropic's `tool_use`, and the args live in `.arguments` (the `read` tool reports `.path`, not `.file_path`). Parsing `tool_use`/`input` silently no-ops.
- File paths come from `tool_call` events (`event.toolName` + `event.input`), not from `ctx.sessionManager.getEntries()` — the latter wraps messages in a different (entry) shape with `role`/`content` nested, not at the top level.
- `pendingCount` must treat BOTH `.done` and `.notified` as "finished"; counting only `.done` re-counts every notified review as pending and deadlocks the extension after `MAX_PENDING`.

## Unresolved

- Whether freshness, tool access, or prompt stance is the decisive lever for completeness review was NOT isolated (all three co-varied). Would need a controlled 2×2 (tool-less/tooled × in-band/fresh) to answer.
- `PI_GAP_MIN_CHARS=200` is an unconfirmed default guess.
- Files created/modified via `bash` are invisible to gap-review (only read/write/edit tool calls contribute paths).
