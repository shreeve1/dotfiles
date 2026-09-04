# dsh-learn-panel — shaped build

**One line:** the dsh sidebar becomes the learner's activity surface (quiz cards now,
coding challenges later) so the main chat stays pure teaching — the same
content-left / interaction-right split used by mainstream learning platforms,
implemented natively inside dsh.

Session: `.memlog.md` in this directory. Grounding evidence: `grounding.md`.

---

## Why this exists

The `teach` skill's `quiz-ui.md` requires every quiz to go through a harness
question tool and **stops** if none matches. Today that means `ask_user_question`,
which dumps A/B/C/D into the chat transcript — the exact pollution the panel is
meant to remove. This plugin gives `teach` a question surface that lives beside
the conversation instead of inside it.

## Core decisions (from the session)

| Decision | Choice | Why |
|---|---|---|
| Metaphor | Sidebar = **instrument panel** (teacher's logistics), not learner scratchpad | `teach`'s philosophy: struggle stays in the material, the system absorbs logistics |
| What moves out of chat | Quiz cards + coding challenges; the *verdict* | The answer's explanation stays in chat — that's teaching |
| Return leg | `agent.followup()` for both activities | Learner needs feedback; teacher needs to see the answer |
| Verdict | **Green light** — panel shows pass/fail, chat carries only the *why* | A correct answer costs the thread nothing visible |
| Who grades | **The teacher (main LLM session)** — not a local answer key | Judgement on partially-right answers stays with the teacher |
| Card lifetime | Dies on answer | FSRS resurfacing needs durable storage + scheduler = a second project |
| Card author | Teacher, live | One teacher / one mind; pre-authored banks are the many-to-many thing `teach` rejects |
| Panel at rest | The mermaid DAG `teach` already writes | Free — sidebar renders mermaid fences today |
| Shape | **One tab = lesson shell**; activities are contents, not separate tabs | User's own reframe: DAG must also deliver/switch to quiz + code |

## Verified mechanics (checked against source + official docs, not memory)

1. **Mermaid is free.** `MermaidMarkdown` swaps `language-mermaid` fences for live
   diagrams in the sidebar's markdown preview (lazy chunk, only when a fence
   exists). "DAG at rest" = open the `.md` `teach` already writes. Zero code.
   *Source: `dsh-better-sidebar/lib/types/client/mermaid.d.ts`, `mermaid-blocks.d.ts`.*

2. **The return leg is sanctioned public API.**
   `docs/subsystems/core.md:55` — *"`Agent` is the surface every plugin (UI, hooks,
   orchestrators) programs against; `ctx.agents.get(id)` returns it... `followup`,
   `steer`, and `inject` are fixed-preset aliases [of `send`]."*
   - `agent.followup(UserMessage)` — wakes the agent, logs a `user/message`
     surface event. **The submit path.**
   - `agent.inject(UserMessage{source:{kind:'plugin',plugin:…}})` — durable context
     the next model request sees, **not** a wake-up; renders as a collapsed context
     row, not a chat bubble. **The silent-rider path.**
   - `exec.agent` is handed to every tool (`cookbook/adding-a-tool.md`), so the
     tool that pushed the card holds the agent handle for the answer.
   - **Caveat:** `followup()` returns no handle — its `MessageId` marks inbox
     insertion, not a later answer. The panel cannot await a verdict; it renders
     green locally and lets the explanation arrive as a normal turn.
   - Precedent: DSH's own skills subsystem pushes catalog updates via `inject()`;
     the scheduler queues due work via `followup()`. Side Chat
     (`sidechat-routes.ts:117-146`) uses both, aimed at a child session.

3. **No new session event needed.** Plugin-added `SessionEventMap` entries are
   **log-only** — not surface events, contributing nothing to derived history
   (`docs/subsystems/session.md:595`). `followup` already produces a proper
   surface `user/message`, satisfying "model-visible ⟺ logged" via the stock path.

4. **Sidebar extension surface:** `ctx.betterSidebar.registerTab(descriptor)` →
   disposer; per-conversation-session scoped; `openTab({meta})` persists
   JSON state across reloads; `badge()` for a pending-card pill; declarative
   `settings.pluginToggles` for plugin-owned prefs.

## MoSCoW

### Must (the MVP — this is the whole v1)
- One tab registered via `ctx.betterSidebar.registerTab({ id: 'learn' })`, injected
  from the client half; registration returns a disposer (effect rule).
- One tool `learn_card` via `defineTool`: teacher pushes
  `{ question, options[], strand? }` — **no answer key** (the teacher grades).
  Returns only its declared `output.schema` value (delivery receipt), never prose.
- Delivery to the panel via the `AgentOpenRegistry` pattern already in the sidebar:
  per-session queue, consume-on-send, replay on attach.
- Learner answers → `agent.followup()` with the chosen option → **the teacher
  grades** and pushes the verdict back to the panel; it explains in chat only when
  the answer is wrong or partial.
- Green light is rendered from the **teacher's verdict**, not a local key. This
  needs a second tool (`learn_verdict`) or a second call of the same tool carrying
  `{ cardId, verdict }` — see Open questions.
- Panel at rest renders the lesson mermaid file.
- Schemastery `Schema<Config>`; nothing tunable hardcoded.

### Should (v1.1, cheap, no new risk)
- `badge()` showing a pending-card count on the tab.
- Debounced **attempt summary** riding `agent.inject()` on submit
  (`attempts`, `time-to-answer`) — one structured line, consented by the act of
  submitting. **Not** a keystroke stream.
- Keyboard reachability of the panel (Codecademy treats panes as separately
  navigable regions; a panel you can't reach mid-thought won't get used).

### Could (later, each is its own project)
- Coding challenge — **gated on a constrained runner** (see Won't).
- FSRS resurfacing wired to the installed `review` / `coach` skills.
- Strand-map view (`known`/`edge`/`unknown`/`blocked`) as the resting panel.
- Flowchart-as-quiz: render the DAG with one node blanked, learner fills it.

### Won't (this time — named so they don't creep back)
- **Running learner code anywhere near the session shell.** The sidebar's terminal
  is a real shell on the real machine with real secrets. Any execution needs a
  constrained sandbox (time/memory/network/filesystem limits) and **explicit Run**
  — never auto-run. This is a precondition, not a detail.
- Per-keystroke telemetry (floods context, persists unconsented drafts).
- Generated images, pre-authored card banks, multiple activity tabs.

## Build order

1. **Preflight** — `dsh-plugin-guide` loaded (done); confirm extension points:
   client-side `betterSidebar.registerTab`, host-side `ctx.tools.register`.
2. **Scaffold** — `dsh-plugin-dev new dsh-learn-panel --lang ts --git`, or copy
   `~/.dsh/plugin-dev/plugin-template`. Clear every `@your-scope` / placeholder id.
3. **Implement** — host half (tool + per-session card queue + `followup` on answer),
   client half (tab + card renderer + local grading). Registration is an effect
   throughout.
4. **Gate (all three green before install)** — `plugin_check` `action: check`,
   `strict: true` → `dsh-plugin-dev check --strict --json` →
   `dsh-plugin-dev verify`.
5. **Install** — `dsh plugin --profile web add <spec>`, one plugin per restart,
   then the deps==bundled cross-check from `docs/deepseek-harness.md`.
6. **Teach-side** — add a row to `quiz-ui.md`'s tool table so the skill recognises
   the panel as a valid question surface. **Without this the skill will not use it.**

## Open questions for the build

- **RESOLVED: the teacher grades.** Consequence to design: the round trip is
  card → answer (`followup`) → verdict (tool call back to the panel). The panel
  must hold a `cardId` and show a *pending* state between answer and verdict,
  because `followup()` returns no handle and the verdict arrives on the teacher's
  next turn. Decide: one tool with a `verdict` variant, or two tools
  (`learn_card` / `learn_verdict`).
- Should a wrong answer auto-open the explanation in chat, or wait for the learner
  to ask? (Green light means correct answers stay silent; wrong ones must teach.)
- **`quiz-ui.md` edit or plugin-side tool alias?** Editing the skill is honest but
  forks a shared file; registering under a name the table already lists is
  hackier but zero-touch.
- Does the panel need a "no card pending" empty state beyond the DAG?
