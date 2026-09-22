# advisor

A second-model watchdog for **Hermes Agent** — a port of the DeepSeek Harness
`dsh-goal-keeper` / `dsh-mini-advisor` plugin to Hermes' native plugin surface.

Each turn, a second (advisor) model reviews the slice of transcript produced
since the last review. When something matters — a bug, a security hole, a wrong
turn, or a premature "done" — it injects **one** short, weighable advisory note
into the primary agent's current turn:

```
<advisory advisor="advisor" severity="blocker" guidance="weigh this, do not blindly obey">
The password is logged in plaintext in auth.py:42.
</advisory>
```

Severity is one of `nit | concern | blocker`. The `guidance` attribute reminds
the primary agent to weigh the advice, not blindly obey it.

## How it maps onto Hermes (vs. the dsh original)

| Concern | dsh-goal-keeper | this plugin |
|---|---|---|
| Trigger | `session/event → turn/end` | `pre_llm_call` hook (fires at turn start) |
| Advice injection | appends a user-role note to the next turn | returns `{"context": ...}` from `pre_llm_call` → injected into *this* turn's user message (ephemeral, cache-safe) |
| Second model | `ctx.llm.stream` | `ctx.llm.complete_structured` (JSON schema verdict) |
| Per-session toggle | `/keeper on\|off\|status` | `/advisor on\|off\|status` |
| Goals / tasks | native dsh goal + todo services | **not ported** — Hermes has no equivalent same-session goal service on the plugin `ctx`. Only the advice channel is ported. |

Because `pre_llm_call` is both the review trigger and the injection channel,
there is no cross-turn injection state to juggle — simpler than the dsh version.

## Install / enable

The plugin lives at `~/.hermes/plugins/advisor/` (synced here from
`dotfiles/.hermes/plugins/advisor/`). Plugins are opt-in — enable it:

```bash
hermes plugins enable advisor
# or, in config.yaml:
#   plugins:
#     enabled: [advisor]
```

Restart Hermes. On each turn you'll see advisories appear when the advisor model
flags something; use `/advisor status` to check state.

## Configuration (all optional)

```yaml
plugins:
  enabled: [advisor]
  entries:
    advisor:
      settings:
        enabled: true          # global default; /advisor overrides per session
        min_delta_chars: 40    # skip reviews smaller than this many chars
        max_delta_chars: 12000 # cap the transcript slice fed to the advisor
        persona: "…"           # override the reviewing persona/system prompt
```

### Running the advisor on a cheaper model

By default the advisor borrows the user's active model (zero-config). To pin it
to a cheaper/faster model, the plugin registers an `advisor` auxiliary task —
point config at it:

```yaml
auxiliary:
  advisor:
    provider: openrouter
    model: anthropic/claude-3-5-haiku
```

No trust-gate grant is needed: an auxiliary task the plugin registered itself is
always allowed. If `auxiliary.advisor` is unset, the call falls through to the
active model.

## Per-session toggle: `/advisor`

| Command | Effect |
|---|---|
| `/advisor` or `/advisor status` | Report this session's state and whether it comes from the global default or a session override. |
| `/advisor on` | Turn the advisor on for this session. |
| `/advisor off` | Turn the advisor off for this session — no reviews, no advice. |

## Behaviour notes

- **Fail-open.** If the advisor LLM call fails (no adapter, timeout, bad config),
  the error is logged and the primary turn proceeds untouched.
- **Subagents are skipped.** Delegated child sessions (those with a
  `parent_session_id`) are not reviewed, to avoid advise-storming delegated work.
- **No replay / no repeats.** A per-session cursor means already-reviewed
  transcript is never re-reviewed, and an identical back-to-back note is
  suppressed.
- **Cache-safe.** Advice rides the user-message injection channel, so the system
  prompt stays byte-stable and the prompt cache prefix is preserved.

## Tests

Pure logic + the full `pre_llm_call` path (with a stubbed `ctx.llm`) are covered
by `/tmp/advisor_test.py` during development; run it with `python3` against this
directory. All paths verified against the installed `hermes-agent` source.
