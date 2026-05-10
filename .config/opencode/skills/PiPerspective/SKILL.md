---
name: PiPerspective
description: "Invokes the pi CLI (@mariozechner/pi-coding-agent ≥0.73.1) as a structured second-mind reasoner at three Algorithm phases — THINK, PLAN, VERIFY. pi runs one-shot, non-interactive, and never edits code. Output is parsed into a typed PiVerdict JSON contract written to the work dir for audit. Auto-invocation is gated by effort tier; a kill switch disables all invocations. Out-of-family default model (openai/gpt-5-codex:high) defends against groupthink with Claude-driven opencode. Single shell-out boundary in Tools/InvokePi.ts. USE WHEN second opinion, audit plan, audit verify, cross-model review, pi perspective, opposing reviewer, groupthink defense, structured second mind, verify diff, audit code change."
effort: medium
---

## Customization

**Before executing, check for user customizations at:**
`~/.pai/PAI/USER/SKILLCUSTOMIZATIONS/PiPerspective/`

If this directory exists, load and apply any `PREFERENCES.md`, configurations, or resources found there. These override default behavior. If the directory does not exist, proceed with skill defaults.

# PiPerspective

**A second-mind reasoner that runs `pi` (a separate coding-agent CLI) one-shot at Algorithm phase boundaries to defend against groupthink.**

## Core Principle

Opencode runs a Claude-family model. If review/audit is performed by the same model family, you get echo-chamber confirmation. PiPerspective shells out to `pi` (the `@mariozechner/pi-coding-agent` CLI, ≥ v0.73.1) with an **out-of-family** model by default (`openai/gpt-5-codex:high`) so that a structurally-different reasoner sees the same artifact and surfaces disagreement.

pi is **read-only** in this skill. It never edits code, never executes bash, never persists session state.

## Phases

| Phase  | When                                | What pi looks at                | Allowed tools          |
|--------|-------------------------------------|---------------------------------|------------------------|
| THINK  | Approach committed, before PLAN     | ISA only                        | none                   |
| PLAN   | Plan drafted, before BUILD          | ISA + plan.md                   | none                   |
| VERIFY | After BUILD, before user accepts    | ISA + diff + repo (read-only)   | read, grep, find, ls   |

## Output Contract

Every invocation produces a `PiVerdict` JSON object (schema in `Tools/Schema.ts`):

```ts
{
  phase: 'THINK' | 'PLAN' | 'VERIFY',
  verdict: 'PASS' | 'CONCERNS' | 'FAIL' | 'REFRAME',
  blockers: [{ id, severity, summary, detail_md, evidence }],
  suggestions: [{ summary, detail_md }],
  summary_md: string,
  raw_model_id: string,
  schema_version: 1,
  generated_at: ISO8601
}
```

Audit copy written to `<work_dir>/pi-perspective/<phase>.json` where `<work_dir>` = parent of the active ISA path. Re-runs append a numeric suffix (`verify.json`, `verify.2.json`).

If pi's JSON output fails Zod validation, `Tools/ParseFallback.ts` produces a minimal `PiVerdict` with `verdict: 'CONCERNS'` and the raw stdout in `summary_md`, then logs `WARN PiPerspective: schema parse failed, used fallback`.

### Verdict semantics

- `PASS` — no concerns above `minor`.
- `CONCERNS` — non-blocking; surface and continue.
- `FAIL` — at least one `major`/`critical` defect; phase should not advance until addressed.
- `REFRAME` — THINK-phase-specific: the framing itself is the defect. Contract requires at least one `critical` blocker and an alternative framing in `summary_md` plus a reframed-goal entry in `suggestions[]`.

## Configuration

Add to `~/.pai/settings.json` (or merge with existing block):

```jsonc
{
  "pi_perspective": {
    "enabled": true,                        // global kill switch
    "model": "openai/gpt-5-codex:high",     // single model, all phases
    "min_pi_version": "0.73.1",
    "auto_invoke": {
      "Standard":      [],
      "Extended":      ["VERIFY"],
      "Advanced":      ["PLAN", "VERIFY"],
      "Deep":          ["THINK", "PLAN", "VERIFY"],
      "Comprehensive": ["THINK", "PLAN", "VERIFY"]
    },
    "verify_thinking": "minimal",
    "blocker_min_severity_display": "major"
  }
}
```

All keys are optional; missing keys fall back to the defaults in `Tools/Config.ts`. A partial `auto_invoke` overlay is merged tier-by-tier — overriding `Deep` does not clear the other tiers.

### Effort tier mapping

The Algorithm ISA carries an `E1..E5` tier in its frontmatter; the plugin maps it to the tier names above:

| ISA tier | Config tier   | Auto-fires (default)          |
|----------|---------------|-------------------------------|
| `E1`     | Standard      | _(none — manual only)_        |
| `E2`     | Extended      | VERIFY                        |
| `E3`     | Advanced      | PLAN, VERIFY                  |
| `E4`     | Deep          | THINK, PLAN, VERIFY           |
| `E5`     | Comprehensive | THINK, PLAN, VERIFY           |

### Changing the model

The `model` key is a single string applied to all three phases. To swap families:

- Anthropic (when opencode runs an OpenAI-family model): `"anthropic/claude-opus-4:high"`
- Google (alternative out-of-family choice): `"google/gemini-2.5-pro:high"`
- OpenAI Codex via cliproxy: `"openai-codex/gpt-5.4:high"` (the variant used during acceptance benchmarks).

The principle is *out-of-family relative to the opencode model*, not specifically OpenAI. Per-phase models are deliberately out of scope for v1 (PRD D-01).

The `:<thinking>` suffix on the model id (e.g. `:high`) is honored by THINK and PLAN. VERIFY adds an explicit `--thinking <level>` flag from `verify_thinking` because VERIFY tuning is the dominant cost driver (see "Tuning verify_thinking" below).

### Tuning `verify_thinking`

`verify_thinking` is the per-invocation `--thinking` level for VERIFY only. Empirical 5-run latency on the `agent-team-timer` acceptance fixture (`openai-codex/gpt-5.4:high`, sequential runs):

| Level     | Mean latency | Verdict (5/5) | Grader (5/5) |
|-----------|-------------:|--------------:|-------------:|
| `high`    | 70.3 s       | FAIL          | PASS         |
| `medium`  | 33.4 s       | FAIL          | PASS         |
| `low`     | 39.6 s       | FAIL          | PASS         |
| `minimal` | **28.1 s**   | FAIL          | PASS         |

`minimal` is the default. Raise to `medium` or `high` if VERIFY starts missing real defects on harder diffs; the cost is ~2–3× latency. There is no `think_thinking` / `plan_thinking` knob — THINK and PLAN inherit reasoning level from the `:<thinking>` suffix in the `model` id.

### Auto-invocation rules

The plugin fires pi only when **all** of the following hold:

1. The kill switch is `true` (default).
2. An ISA file under a work dir was written/edited via the `write` or `edit` tool.
3. The ISA frontmatter parses cleanly and contains `slug`, `phase`, and `tier`.
4. `tier` ∈ {E1..E5} and `phase` ∈ {THINK, PLAN, VERIFY}.
5. The new `phase` is listed in `auto_invoke[tier]`.
6. The same (slug, phase, frontmatter-hash) has not already fired (dedup via the `.pi-perspective-state.json` sidecar in the work dir).

If any check fails the plugin no-ops silently. Failures from pi itself surface via the alert file (see "Receiving alerts" below); they never crash the editor session.

## Kill Switch

Set `pi_perspective.enabled = false` in `~/.pai/settings.json`. All invocations (manual and auto) become no-ops returning a stub `PiVerdict` with `verdict: 'CONCERNS'` and a `summary_md` explaining the switch is tripped. No `pi` subprocesses spawn.

The kill switch is honored at three layers:

- **`Tools/InvokePi.ts`** — `loadConfig().enabled === false` short-circuits before `assertPiVersion` and before any spawn. Returns the stub verdict.
- **`plugins/pai-pi-perspective/index.ts`** — on every dispatch decision, re-reads the config; if disabled, the handler returns before any subprocess work.
- **CLI override** — passing `--config <path>` to `Tools/InvokePi.ts` lets you run with a settings file that has the kill switch flipped, for testing.

To re-enable: set `enabled: true` and the next ISA edit (or next manual invocation) will fire normally.

## Manual Invocation

The wrapper is fully usable without the plugin. From a work dir or anywhere:

```bash
# VERIFY (requires --diff)
bun run ~/.config/opencode/skills/PiPerspective/Tools/InvokePi.ts \
  --phase VERIFY \
  --isa <path/to/ISA.md> \
  --diff <path/to/diff.patch>

# PLAN (requires --plan)
bun run ~/.config/opencode/skills/PiPerspective/Tools/InvokePi.ts \
  --phase PLAN \
  --isa <path/to/ISA.md> \
  --plan <path/to/PLAN.md>

# THINK (ISA only)
bun run ~/.config/opencode/skills/PiPerspective/Tools/InvokePi.ts \
  --phase THINK \
  --isa <path/to/ISA.md>
```

### Common flags

| Flag             | Purpose                                                                |
|------------------|------------------------------------------------------------------------|
| `--model <id>`   | Override config model for one run (e.g., `"openai-codex/gpt-5.4:high"`).|
| `--binary <pi>`  | Override the `pi` binary path (tests / non-default install).            |
| `--timeout <ms>` | Override the phase default (THINK 60s, PLAN 90s, VERIFY 45s).           |
| `--no-audit`     | Skip writing `<work_dir>/pi-perspective/<phase>.json`.                  |
| `--config <path>`| Use a non-default `settings.json`.                                      |
| `--json`         | Machine-readable: print only the verdict JSON to stdout.                |

### Exit codes

| Code | Meaning                                                                  |
|------|--------------------------------------------------------------------------|
| 0    | Verdict was PASS or CONCERNS.                                            |
| 1    | Verdict was FAIL or REFRAME (CI-gate friendly).                          |
| 2    | Bad CLI arguments.                                                       |
| 3    | `pi` version check failed (older than `min_pi_version`).                 |
| 4    | Other PiPerspective error (missing ISA, schema crash, etc.).             |

### Receiving alerts (auto-invocation path)

When the plugin fires pi and the verdict is `FAIL` or `REFRAME`, alerts are surfaced three ways simultaneously:

1. **Marker file**: an entry is appended to `<work_dir>/pi-perspective-alerts.md` (human-readable summary + verdict path).
2. **stderr banner**: `console.error("[pai-pi-perspective] FAIL on <slug>@<phase> — see pi-perspective-alerts.md")` so it appears in the opencode log.
3. **Next-turn system-prompt injection**: any *unseen* alerts are concatenated into the system prompt of the next conversation turn via `experimental.chat.system.transform`. The plugin marks them seen on the next `chat.message` event so they do not repeat.

### Rendering disagreements

Two helpers render verdicts as human-readable markdown for review:

```bash
# PLAN-phase disagreement (two-block "PAI's plan / pi's review")
bun run ~/.config/opencode/skills/PiPerspective/Tools/RenderPlanDisagreement.ts \
  --plan <path/to/PLAN.md> \
  --verdict <path/to/plan.json> \
  [--out <path>]

# THINK-phase reframe (extracts ISA Problem/Goal, foregrounds alternative framing)
bun run ~/.config/opencode/skills/PiPerspective/Tools/RenderReframe.ts \
  --isa <path/to/ISA.md> \
  --verdict <path/to/think.json> \
  [--out <path>]
```

Both renderers end with an action menu (adopt / iterate / override / abort) so the user has an explicit decision surface.

## Workflows

- `Workflows/Think.md` — THINK prompt (6-pass framing review: goal alignment, criteria alignment, hidden assumptions, out-of-scope, test reality, REFRAME judgment).
- `Workflows/Plan.md` — PLAN prompt (full review covering ISC coverage, false parallelism, ordering, soft metrics, risk drift).
- `Workflows/Verify.md` — VERIFY prompt (diff-grounded code review with explicit evidence anchors).

## Tools (single shell-out boundary)

- `Tools/InvokePi.ts` — only place that spawns `pi`.
- `Tools/Config.ts` — typed config loader with defaults.
- `Tools/Schema.ts` — `PiVerdict` types + Zod validator + `blockerId` helper.
- `Tools/ParseFallback.ts` — markdown-only fallback verdict.
- `Tools/VersionCheck.ts` — asserts `pi --version` ≥ `min_pi_version` (reads from stdout or stderr).
- `Tools/RenderPlanDisagreement.ts` — PLAN UX renderer.
- `Tools/RenderReframe.ts` — THINK REFRAME UX renderer.

The plugin lives separately at `~/.config/opencode/plugins/pai-pi-perspective/` and is registered in `opencode.json`. It does **not** spawn pi directly; it shells out to `Tools/InvokePi.ts` so the single-boundary invariant holds.

## Fixtures (acceptance)

- `Fixtures/agent-team-timer/` — VERIFY acceptance fixture (real prior-session bug from `~/dotfiles` commit `343e5c0`).
- `Fixtures/plan-bad-deps/` — PLAN acceptance fixture (5 planted defects: false parallelism, missing ISC coverage, deferred DOS mitigation, soft acceptance, scope drift).
- `Fixtures/think-misframed/` — THINK acceptance fixture (ops-dashboard ISA whose underlying need is a weekly digest; pi should REFRAME).

Each fixture has a `Grade.ts` that mechanically grades a real pi verdict against `expected-verdict.json`.

## PAI Memory Access

pi does **not** automatically use shared PAI memory.

PiPerspective is isolation-first: `Tools/InvokePi.ts` passes `--no-context-files`, `--no-session`, a temporary `--session-dir`, `--no-extensions`, `--no-skills`, and `--no-prompt-templates` on every invocation. THINK and PLAN also pass `--no-tools`, so those phases can only see the prompt payload assembled by the wrapper: the ISA, and for PLAN the drafted plan.

Phase-specific memory exposure:

| Phase  | PAI memory access |
|--------|-------------------|
| THINK  | No automatic access. Only content copied into the ISA is visible. |
| PLAN   | No automatic access. Only content copied into the ISA or plan is visible. |
| VERIFY | No automatic memory injection. VERIFY has read-only `read,grep,find,ls` tools, so it could theoretically read `~/.pai` if a prompt explicitly directed it to an absolute path, but PiPerspective does not supply PAI memory paths by default. |

If a future version needs stricter isolation, run VERIFY from a sandboxed working directory or denylist `~/.pai` for pi's read-only tool layer. If a future version needs shared-memory context, copy the exact relevant memory excerpt into the ISA/plan explicitly rather than giving pi ambient memory access.

## Invariants

- pi is invoked with `-p --no-session --session-dir <tmp> --no-context-files --no-extensions --no-skills --no-prompt-templates --append-system-prompt <phase-prompt>`.
- THINK and PLAN use `--no-tools`. VERIFY uses `--tools read,grep,find,ls`.
- pi never writes, never executes, never persists session.
- All three phases use the same model. No per-phase models in v1.
- One shell-out boundary: only `Tools/InvokePi.ts` spawns `pi`. The plugin and the renderers do not.

## Out of Scope

LEARN-phase auditor, RPC mode, bidirectional opencode↔pi conversation, AGENTS.md handoff standardization, per-phase models, streaming UI, cost telemetry, and replacing the Codex `Review` skill.
