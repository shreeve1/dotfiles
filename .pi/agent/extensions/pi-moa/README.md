# pi-moa

`pi-moa` is a [Pi](https://pi.dev) `0.80.6+` package that adds a local Mixture of Agents (MoA) provider.

It registers one provider with two models:

| Model | Display name | Advisors |
|---|---|---|
| `Fusion` | `Pi MoA Fusion` | 2 advisors (default config) |
| `Fusion Fast` | `Pi MoA Fusion Fast` | 1 advisor (`moa-fast.json`) |

The model is not a hosted model by itself. It orchestrates other Pi models: several **advisor** models think in parallel, then one **aggregator** model reads their private advice and produces the final answer/tool call.

## Why use this?

Use `pi-moa` when you want a stronger answer than a single model usually gives:

- advisors can catch different mistakes
- the aggregator can compare multiple suggestions
- hard coding/debugging tasks get a second opinion automatically
- you can mix fast, cheap, or specialized models

Tradeoff: every user turn calls multiple models. With verification enabled, it also runs a private draft, verifier, and separate final acting pass, so it is slower and costs more than one normal model call.

## What's new in 0.2.6

Compared with `0.2.5`:

- **More general verification:** advisor, aggregator, and verifier guidance now derives acceptance criteria from the current request, repository contract, tests, and tool evidence instead of embedding suite-specific expected fixes.
- **Reliable advisor retries:** only complete successful advisor batches are cached; failed, aborted, or partial runs retry instead of reusing stale failure output.
- **Accurate model capabilities:** Fusion and Fusion Fast now mirror each configured aggregator's image input, context window, output-token limit, reasoning support, and thinking-level mapping when a session starts.
- **Stronger regression coverage:** tests now protect generic runtime prompts, failed-advisor retries, aggregator-derived metadata, image sanitization, missing-aggregator fallback, and pre-aborted requests.

No config migration is required. The model names, default topology, commands, credential isolation, verifier flow, and streaming tool loop remain compatible with `0.2.5`.

## Install

From npm:

```bash
pi install npm:@duyviet1804/pi-moa
```

Note: npm scoped packages require the `@`. `npm:duyviet1804/pi-moa` is not a valid npm package name.

Pinned version:

```bash
pi install npm:@duyviet1804/pi-moa@0.2.6
```

From git:

```bash
pi install git:github.com/duyviet1804/pi-moa
```

For local development:

```bash
pi install ./path/to/pi-moa
# or test once without installing
pi -e ./extensions/pi-moa.ts
```

## First-time setup: add the OpenCode Go API key

The default config uses these OpenCode Go models:

- `opencode-go:kimi-k2.7-code` (advisor)
- `opencode-go:glm-5.2` (advisor/verifier)
- `opencode-go:deepseek-v4-flash` (draft/final aggregator)

After installing `pi-moa`:

1. Start Pi with `pi`.
2. Run `/login`.
3. Choose **OpenCode Go** and paste your OpenCode API key.
4. Run `/model`, then choose `pi-moa` and `Fusion` or `Fusion Fast`.

Pi stores the key in `~/.pi/agent/auth.json` with user-only permissions (`0600`). Do not put it in `moa.json`, `moa-fast.json`, a prompt, or a committed file.

Alternatively, set the supported environment variable before starting Pi:

```bash
export OPENCODE_API_KEY="..."
pi --provider pi-moa --model Fusion
```

If you configure non-OpenCode providers, authenticate each configured provider normally.

## Quick start

Start Pi with the MoA model:

```bash
pi --provider pi-moa --model Fusion
```

One-shot examples:

```bash
pi --provider pi-moa --model Fusion --thinking max -p "Review this repository for likely bugs"
pi --provider pi-moa --model "Fusion Fast" --thinking max -p "Review this repository for likely bugs"
```

In the model selector, choose `Fusion:max` or `Fusion Fast:max`. The `max` request is passed to every inner model; Pi clamps it to each model's supported thinking level.

Check the installed extension version, active state, and current loaded configs for both model variants:

```text
/pi-moa
```

`/pi-moa:status` remains available as an alias.

## Configuration

Each model variant reads from its own config file:

| Model | Config file |
|---|---|
| `Fusion` | `moa.json` |
| `Fusion Fast` | `moa-fast.json` |

Config files live in:

```text
~/.pi/agent/moa.json
~/.pi/agent/moa-fast.json
```

If `PI_CODING_AGENT_DIR` is set, they live there instead:

```text
$PI_CODING_AGENT_DIR/moa.json
$PI_CODING_AGENT_DIR/moa-fast.json
```

If the file is missing, `pi-moa` uses the defaults below. If the file exists but is invalid, requests and the status command fail loudly so you do not accidentally run the wrong model mix.

The model picker derives image input, context-window, output-token, and reasoning capabilities from each configured aggregator when a session starts. After editing `moa.json` or `moa-fast.json`, run `/reload` to refresh picker metadata. Request-time config loading remains fail-loud.

### Default config

```json
{
  "referenceModels": [
    { "provider": "opencode-go", "model": "kimi-k2.7-code" },
    { "provider": "opencode-go", "model": "glm-5.2" }
  ],
  "aggregator": { "provider": "opencode-go", "model": "deepseek-v4-flash" },
  "verifier": { "provider": "opencode-go", "model": "glm-5.2" },
  "referenceTemperature": 0.2,
  "aggregatorTemperature": 0.1,
  "referenceMaxTokens": 650,
  "advisorContextMode": "postTool",
  "maxAdvisorRefreshesPerTurn": 1,
  "maxToolResultChars": 6000,
  "maxAdvisorContextChars": 20000,
  "includeToolResultsForAdvisors": true,
  "enableFullTrace": false,
  "enableVerifier": true,
  "verifierTemperature": 0,
  "verifierMaxTokens": 700,
  "maxVerifierLoops": 1
}
```

Create or edit them:

```bash
mkdir -p ~/.pi/agent
cp pi-moa.example.json ~/.pi/agent/moa.json
cp pi-moa-fast.example.json ~/.pi/agent/moa-fast.json
$EDITOR ~/.pi/agent/moa.json
$EDITOR ~/.pi/agent/moa-fast.json
```

### Config fields

| Field | Required | Meaning |
|---|---:|---|
| `referenceModels` | yes | Non-empty array of advisor models. Each item needs `provider` and `model`. |
| `aggregator` | yes | Model that receives advisor notes and produces the final response/tool call. |
| `referenceTemperature` | yes | Temperature for advisor calls. Lower is more deterministic. |
| `aggregatorTemperature` | yes | Temperature for the final aggregator call. |
| `referenceMaxTokens` | yes | Max output tokens for each advisor. Default is `650`; must be positive. |
| `advisorContextMode` | no | `initial`, `postTool`, or `full`. Defaults to `postTool`. |
| `maxAdvisorRefreshesPerTurn` | no | Max advisor runs per user turn as tool evidence changes. Defaults to `1`. |
| `maxToolResultChars` | no | Max source characters kept from each tool result before deterministic middle truncation. Defaults to `6000`. |
| `maxAdvisorContextChars` | no | Max total advisor transcript characters before deterministic middle truncation. Defaults to `20000`. |
| `includeToolResultsForAdvisors` | no | Include sanitized tool results in advisor context. Defaults to `true`. |
| `enableFullTrace` | no | Attach structured advisor/draft/verifier trace diagnostics. Defaults to `false`. |
| `enableVerifier` | no | Review a private draft before the streamed acting pass. Defaults to `true`. |
| `verifier` | no | Optional verifier model. If omitted, uses the first advisor different from the aggregator, then falls back to the aggregator only when necessary. |
| `verifierTemperature` | no | Verifier temperature. Defaults to `0`. |
| `verifierMaxTokens` | no | Max verifier output tokens. Defaults to `700`. |
| `maxVerifierLoops` | no | Max private verifier/revision cycles before the final acting pass. Defaults to `1`. |

Model names must match Pi's provider/model catalog. To discover models:

```bash
pi --list-models
pi --list-models opencode
```

## Example configs

### Cheaper/faster

Use shorter advice:

```json
{
  "referenceModels": [
    { "provider": "opencode-go", "model": "glm-5.2" }
  ],
  "aggregator": { "provider": "opencode-go", "model": "deepseek-v4-flash" },
  "referenceTemperature": 0.2,
  "aggregatorTemperature": 0.1,
  "referenceMaxTokens": 400
}
```

### More diverse advisors

Use multiple model families so they disagree in useful ways:

```json
{
  "referenceModels": [
    { "provider": "opencode-go", "model": "kimi-k2.7-code" },
    { "provider": "opencode-go", "model": "glm-5.2" }
  ],
  "aggregator": { "provider": "opencode-go", "model": "deepseek-v4-flash" },
  "referenceTemperature": 0.3,
  "aggregatorTemperature": 0.1,
  "referenceMaxTokens": 800
}
```
### Reset to defaults

```bash
rm ~/.pi/agent/moa.json
rm ~/.pi/agent/moa-fast.json
```

## How it works

For each user turn:

1. `pi-moa` builds a trimmed advisor context. By default it includes the latest user turn plus post-tool evidence.
2. It runs every `referenceModels` entry in parallel.
3. With verification enabled, the aggregator creates a private, tool-free draft.
4. A separate verifier reviews that draft. `REVISE` produces a revised private draft, bounded by `maxVerifierLoops`.
5. `pi-moa` appends the advisor notes, latest draft, and verifier review as a new final private context message; it never edits the user's original message.
6. The final acting aggregator receives normal Pi tools and streams text, thinking, or tool-call events directly to Pi.
7. Pi executes requested tools normally and repeats the process with the new evidence.

When `enableVerifier` is `false`, the private draft and verifier calls are skipped and the acting aggregator streams immediately after the advisors. Complete successful advisor batches are cached by sanitized context digest; failed, aborted, or partial batches are retried. When tool results change the digest, advisors refresh up to `maxAdvisorRefreshesPerTurn`; after that, the latest successful advice is reused.

## What advisors see

Advisors receive text-only conversation context:

- user text is included
- assistant text and tool-call summaries are included
- images are replaced with `[image omitted for MoA advisor]`
- tool results are included by default and truncated deterministically
- timestamps are ignored for cache keys
- advisors are instructed not to act; they only provide private guidance

Set `advisorContextMode` to `initial` to preserve the old behavior where advisors only see context up to the latest user message. The aggregator receives the normal Pi context plus a final synthetic private-guidance message.

## Optional full trace

Set `"enableFullTrace": true` to attach a structured `pi-moa.full-trace` diagnostic to the final assistant message. It records stage models, durations, usage, cache status, advisor text, private drafts, and verifier verdicts. It excludes API credentials, headers, hidden thinking, and does not directly record raw tool-result payloads. Trace diagnostics may still contain task-related advisor/draft text and increase session size, so they are disabled by default.

## Task-derived verification

For coding, debugging, and refactoring tasks, advisors extract acceptance criteria and risks from the user request, repository contract, tests, and supplied tool evidence. The aggregator and verifier apply the same generic discipline:

- inspect relevant source, tests, and evidence before changing behavior
- preserve documented API and data invariants
- consider boundary, failure, concurrency, mutation, and ordering behavior only when relevant
- run requested tests plus the smallest focused regression check
- do not weaken protected tests, invent requirements, or claim unverified actions

Runtime prompts intentionally contain no suite-specific expected fixes or hidden-test vocabulary.

## Update

Update this package:

```bash
pi update npm:@duyviet1804/pi-moa
```

Update all Pi packages:

```bash
pi update --extensions
```

## Uninstall

```bash
pi remove npm:@duyviet1804/pi-moa
```

Or, if installed from git:

```bash
pi remove git:github.com/duyviet1804/pi-moa
```

## Troubleshooting

### `No OpenCode Go API key found`

Authenticate OpenCode Go or export a key:

```bash
export OPENCODE_API_KEY="..."
```

### `Invalid Pi MoA config`

Your config file exists but is not valid. Fix the JSON or reset:

```bash
rm ~/.pi/agent/moa.json
rm ~/.pi/agent/moa-fast.json
```

### `Model not found in Pi catalog`

One configured `provider`/`model` pair does not exist in your Pi installation. Check available names:

```bash
pi --list-models
```

Then update `~/.pi/agent/moa.json`.

### The model is slow

That is expected: one prompt may call several advisors plus the aggregator. To speed it up, use `Fusion Fast` (1 advisor) or lower `referenceMaxTokens`.

### The package is installed but not visible

Try:

```bash
pi list
pi config
```

If Pi is already running, reload resources:

```text
/reload
```

## Package contents

```text
extensions/pi-moa.ts         # Pi extension that registers the pi-moa provider
src/moa-core.ts              # Testable MoA helpers
pi-moa.example.json          # Example config for Fusion
pi-moa-fast.example.json     # Example config for Fusion Fast
README.md                    # This file
package.json                 # Pi package manifest
```

## Security

- Inner-model credentials are resolved per request through Pi's `modelRegistry`. `pi-moa` passes them as request options only; it does not copy API keys into prompts, MoA config, or its own full-trace diagnostics.
- Wrapper-provider API keys, headers, and environment values are discarded. Only credentials resolved for the selected inner model are forwarded.
- The npm package allowlist excludes `.env*`, `auth.json`, sessions, and local configuration; `npm pack --dry-run` for `0.2.6` contains only the seven files listed above.
- Keep `enableFullTrace` disabled for sensitive work. A trace can persist task text and advisor/draft/verifier output even though it excludes request credentials and hidden thinking.
- Never paste credentials into prompts or tool output: those contents may be sent to configured advisors, the aggregator, and the verifier.
- Pi packages and extensions run with your local user permissions. Only install packages from sources you trust.

## License

MIT
