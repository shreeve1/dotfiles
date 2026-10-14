---
id: 062
title: Meeting Assistant — Ask box and Ask agent in the Overlay
status: pending
labels: [ready-for-agent]
blocked_by: []
parent: 061
created: 2026-10-07
updated: 2026-10-07
actor: grill-with-docs
---

## Problem Statement

During a call I can see Research Cards but cannot ask a follow-up, run an action, or use a skill from the same place. I want to press one key, type in the Overlay, and talk to an agent that runs from `~/Documents/itastack`, with that project's memory, skills and tools (for example pulling a Halo ticket).

## Solution

Add an Ask box to the Overlay, backed by one long-lived omp process (the Ask agent). One Timeline shows my messages, the agent's streamed replies and the Research Cards. Decisions and their tradeoffs are in `docs/adr/0015-meeting-assistant-ask-agent.md`. Vocabulary is in `CONTEXT.md` (Ask, Ask agent, Timeline, Persona, Saved conversation). This ticket amends ticket 061 and ADR 0014 in three places, listed under "What this reverses".

## What this reverses

- **061 story 13 and ADR 0014, "the Overlay never takes keyboard focus".** The Overlay takes focus only while the Ask box is open.
- **061 story 18 and "Status and control", "pause sends no text anywhere".** Replaced by the pause promise below.
- **ADR 0014, "the surface is card-sized".** The open surface is larger, so a screen share hides a larger rectangle while the box is open.
- **ADR 0014 privacy sentence.** The Ask agent has no general-topic-only rule and no limit on how much transcript it can read. The research workers keep both.

## The pause promise

One wording, used in the ADR, the Overlay label and the bar tooltip:

> While paused, the Meeting Assistant starts no research and creates no cards, and cards not yet sent are dropped, so call text spoken during the pause is never researched or attached to an Ask message. Ask keeps working. It still re-sends the whole saved conversation to the model on every turn, including earlier cards and anything you typed, and the Ask agent can read the live transcript file if you ask it to. Pause does not stop recording.

Short form for the bar tooltip and Overlay: "Paused: new call text is not researched or attached. Earlier cards and your chat still go to Ask."

Notes that the build must keep true:
- The helper keeps reading the transcript locally while paused. `watch_transcript` calls `read_transcript` on every poll and ingests with `seed=True`, which marks paused records as seen. This must stay.
- The known leak is still open until fixed: a Whisper record written after `resume` but spoken during the pause is researched. Fix: keep one `seed_before` cutoff in the helper. It is set to the helper's start time at launch, and to `now` at `resume` (after the catch-up read, before clearing `paused`). `ingest` marks any new Utterance with `started_at < seed_before` as seeded, never researched. Use `started_at`, so a segment spanning the resume or the restart is dropped too. A first word after resume or restart may be dropped; that fails safe. The cutoff is not persisted: the start-time value covers a restart, so resume, then restart, then a delayed paused-speech record is still dropped. Until this ships, the promise above is not fully true: a delayed transcript line can still be researched after resume.
- The bar icon shows `unavailable`, never `paused`, until the helper confirms pause with a status event.

## User Stories

1. As someone on a call, I want `SUPER + M` to open the Ask box and focus it, so that I can type without reaching for the mouse.
2. As someone on a call, I want the same key, Esc, or a click away to close the box and return focus to the app I was in, so that I am never trapped.
3. As someone on a call, I want Enter to send and keep the box open, so that I can ask a follow-up. While the agent is busy, Enter queues my message and the Timeline shows it as queued.
4. As someone on a call, I want replies to stream in as they are produced, so that I can start reading at once.
5. As someone on a call, I want Research Cards, my messages and replies in one Timeline with dividers at Meeting start and end, so that I can read the call as one thread.
6. As someone on a call, I want a card arriving while I type to never move my cursor or take the box.
7. As someone on a call, I want unsent cards to ride along with my next message as untrusted reference text, so that the agent knows what the cards said, and I want my typed text delivered unchanged, so that slash commands still work.
8. As someone on a call, I want `/skill:<name>` and the slash commands omp lists for that folder to work as in my terminal, so that I can run skills and actions.
9. As someone on a call, I want builtin slash commands that would change the session or send data elsewhere blocked, so that the plugin's state stays correct.
10. As someone on a call, I want an optional skill, set in settings, loaded with my first Ask message of each Meeting, so that the agent starts each call with a playbook.
11. As someone on a call, I want a Persona file I can edit, always on, so that the agent has a stable role.
12. As someone on a call, I want the saved conversation and cards kept under `~/Documents/itastack/artifacts/meeting-assistant/` and resumed after a restart or reboot, so that I can follow up on an earlier call.
13. As someone on a call, I want a "new conversation" control that deletes the saved conversation and cards, so that I can start clean.
14. As someone on a call, I want `dismissAll` to hide cards from the Overlay's card stack only, with nothing deleted from the Timeline or disk.
15. As someone on a sensitive call, I want pause to stop research and card creation, drop cards not yet sent, and leave Ask working, with the label and tooltip saying exactly what still goes out (the pause promise above).
16. As someone on a call, I want failures shown as an error line with a manual retry that shows what it will resend, a stop control, and a "no response" line after 120 s, so that I always know what state the agent is in.
17. As someone on a call, I want the Ask agent to start on the first hotkey press and keep running, resuming the saved conversation.
18. As someone on a call, I want the Ask model to be a setting, default `openrouter/deepseek/deepseek-v4-flash-0731` at thinking `low`.
19. As someone on a call, I want the Ask agent not to copy call text to a third model provider, so that the advisor route is off for this process only.

## Implementation Decisions

### Surface and focus
- Same Overlay surface and namespace `omarchy-meeting-assistant`. The existing `no_screen_share` rule covers it, but only `grim` was exercised, as in ADR 0014. [INFERENCE for the screencast portal]
- Focus sequence on open: `None` (passive) → `Exclusive` for 75 ms → `OnDemand` while open → `None` on close. A plain `None` → `OnDemand` switch does not take focus on an already-mapped surface (Hyprland `LayerSurface.cpp`). The surface must also be visible when there are no cards: `visible: (cards.count > 0 || askOpen)`.
- A card arriving mid-typing changes content only, never `keyboardFocus`.
- Click-away uses `HyprlandFocusGrab` on the Overlay window, active while the box is open, `onCleared` closes it (the `Ui/PopupCard.qml` pattern). `KeyboardPanel.qml`'s full-screen dismiss surface is not used, because a full-screen surface on this namespace would black out a screen share. A bar popup opening also clears the grab and closes the box; accepted.
- Passive state: `mask: Region {}` (click-through). Open state: the mask covers the surface. `exclusionMode` stays `Ignore`.
- Open size: width is the card width, height is a constant (box plus a Timeline viewport) capped at about 40% of the monitor height. The Timeline scrolls inside it and never changes the surface height while streaming. The surface resizes only on open and close. Cards do not leave the Timeline while the box is open.
- On open the box uses the focused monitor and ignores `overlayMonitor`, so Esc returns focus to the right window. The Overlay is never moved between monitors while open.
- Hotkey: `o.bind("SUPER + M", "Meeting Assistant: Ask", "omarchy-shell meeting-assistant toggleAsk")` in `omarchy/config/hypr/bindings.lua`. Needs a new `IpcHandler` function `toggleAsk`. Do not reuse `toggle`, which pauses. `SUPER + M` checked free in the global submap on 2026-10-07 with `hyprctl binds -j` (878 binds; only `SUPER + SHIFT + M` Music and `SUPER + SHIFT + ALT + M` Music TUI use M). It does not fire inside HyprVim submaps.
- `toggleAsk` opens the box and shows an error line when the helper is down.

### The Ask agent process
- One omp RPC process, started on the first `ask_open`, launched from `~/Documents/itastack` with `--cwd`, `--session-dir <artifacts>/chat`, `--continue`, `--model` and thinking passed explicitly (a resumed session restores its saved model; the explicit flag wins), `--append-system-prompt <Persona file>`, `--config <plugin>/ask-overlay.yml` and `-e <plugin>/ask-context.ts`. It does not use the research workers' tool, rule or skill restrictions.
- `ask-overlay.yml` is shipped with the plugin and contains `advisor: {enabled: false}`. Verified on 2026-10-07 twice: with the overlay no `__advisor.jsonl` was written, without it one was. It affects that process only. `--thinking low` is honoured on `--continue` over a session saved at `high` (measured). A different saved MODEL being overridden by `--model` is still unverified.
- The write-confirm rule comes from `AGENTS.md` line 85 in the project load ("Name any change to a client or connected system ... exactly and confirm it first"), not from the Persona. The Persona may be missing or empty. The rule is an instruction, not a gate (ADR 0015).
- `--continue` resumes the newest non-empty session in `--session-dir` by file mtime; an empty dir starts fresh (probed). The plugin keeps exactly one session in that dir and nothing else writes there.
- **new conversation:** abort any turn, close stdin and wait for exit (kill after a few seconds), `rm -rf` the whole `chat` dir including the per-session sidecar dirs, delete `cards.jsonl` and `timeline.jsonl`, restart lazily on the next key press. RPC `new_session` and deleting the dir under a live process are NOT used: the first leaves the old file so `--continue` resumes it, and the second recreates a partial session (both probed).
- Meeting end stops research workers, not the Ask process. On helper quit, abort the turn, kill after 2 s; the next ask says the previous turn was interrupted. Ask works whatever the research state (unavailable, idle, paused).
- `/new` and `/clear` are not builtins over RPC and reach the model as text. "New conversation" is the plugin's own control only.

### Cards ride along
- Cards go to the agent through the plugin-shipped extension `ask-context.ts`, using `before_agent_start` to return a hidden `cards` message in the same turn. The `prompt` message is exactly what the user typed. Probed on omp 18.6.3: a card before `/skill:x` stops dispatch, a card after it becomes the skill's arguments, and a context-only `steer` or `follow_up` while idle starts a full model turn.
- The extension reads one plugin-owned file, `MEETING_ASSISTANT_CARDS_FILE`, shape `{"entries":[{id,text,header,cards[]},...]}`, an append-only queue with one entry per send that has cards, matched at delivery to the submission's `event.prompt`. The sent marker is the sibling file `<file>.sent`, a JSON array of delivered entry ids. Omp has no `session_settled` or `prompt_result` extension event, so ids are persisted at `agent_end` when `willContinue` is not true. A follow-up batch dequeued inside one run fires `before_agent_start` again before `agent_end`, so the extension also keeps an in-process published id set filled at `message_end` of the hidden message (measured: without it a card was injected twice). A single mutable slot lost cards for queued sends (see Check 5).
- The helper checks the extension loaded (a marker command in `get_available_commands`) before enabling Ask. A failed load is silent otherwise.
- One extension owns all injected context and returns one combined message. Measured on 18.6.3: every `before_agent_start` message is kept, not just the first, so this is a design choice and not a workaround.
- Unsent = cards with `at` after `last_sent_at`, recorded only once omp accepts the send. Cap: the newest 10 cards of the current Meeting, 4000 characters total; older cards are still saved. Each card is a JSON string inside a fixed `<untrusted-cards>` fence with the closing text escaped. Only question, answer and source URLs are sent, never `utterance.text`.
- **At pause start, every unsent entry is dropped from the ride-along**, queued sends already written but not yet delivered included (cards still saved and shown). A retry appends a new entry with the same text, header and cards and a NEW `id`, because the extension skips an already-sent id; it never re-collects cards. When Stop returns queued sends to the input box, the helper removes those turns' entries and rolls `last_sent_at` back to the earliest value from before those sends. The ride-along header says "Listening is paused" when paused.

### Conversation behavior
- Enter while busy sends `prompt` with `streamingBehavior: "followUp"`, never a plain `prompt` (a plain one errors). The Timeline shows the queued line from `queue_update` and offers `remove_queued_message`. `steer` is not used (it does not interrupt a running tool). The helper sets the follow-up mode explicitly.
- Stop sends `abort_and_restore_queue` with an id, so a queued message returns to the box. Measured on 18.6.3 (`tests/fixtures/ask_abort_restore.jsonl`): the run ends (`agent_end`), then `response` `{"id":ID,"command":"abort_and_restore_queue","success":true,"data":{"steering":[],"followUp":[{"text":...}]}}` (the id is echoed only if the request had one), then `prompt_result` `aborted` for each queued prompt and the running one, then `session_settled`; the queued prompts never run. The helper emits `ask_restored` `{messages:[{turn,text}]}` from that data, falling back to its own dropped queue on `success:false` (older omp) or an exit before the reply, and removes the restored messages' `user` entries from `timeline.jsonl`. Stop kills a running bash tool. A write or MCP call already started can still finish, and Stop does not undo it. The Timeline shows tool start and end lines. The key for Stop is not chosen; see "Open decisions".
- The 120 s limit means no stdout event of any kind from the Ask process while a turn is open. Tool activity counts. At 120 s the helper shows "no response" and offers Stop; it does not kill the process. An `agent_start` with no preceding send is shown as an unsolicited reply (background job notices). The helper ignores `extension_ui_request` frames.
- Turn boundaries, measured on 18.6.3 with a real busy-send trace (`tests/fixtures/ask_busy_send.jsonl`, prompts A idle, then B and C as `followUp`): queued prompts run inside ONE live run. omp emits no `agent_start`, `agent_end`, `prompt_result` or `session_settled` between them. A queued turn begins at the `message_start` frame with `role:"user"` whose text equals the queue head (omp also emits `turn_start` and `queue_update`). The run ends with one `agent_end`, then one `prompt_result` per prompt (order B, C, A in the trace), then one `session_settled`. So the helper ends the current turn and starts the next at that user message, takes a prompt's `status` from its `prompt_result`, and treats `session_settled` only as "process idle". A turn does not end at `turn_end` (one prompt can have several). A slash or skill prompt records no user message, so a queued prompt is matched by text, not by counting. Verified against real omp through the helper: three busy sends gave three `ask_end` events, each with only its own text, and one `idle` after the last. Local-only builtins are the exception (`tests/fixtures/ask_local_builtins.jsonl`, measured on 18.6.3 for `/dirs /context /tools /jobs /changelog last 1`): each sends one `command_output` frame, then the prompt `response` with `data.agentInvoked:false`, and no `agent_start`, `message_*`, `prompt_result` or `session_settled` at all; the next ordinary prompt runs normally. The helper buffers the `command_output` text and treats that response as the turn's completion: one `ask_delta` with the text, `ask_end` `completed` with the same text, then idle (or the next queued turn). A later `prompt_result` for it is ignored, a `command_output` with no send in flight becomes a standalone `ask_end`, and a slash command typed while a real turn is busy is refused with `ask_error` "Wait for the current reply before running a slash command" because the queued local case is unmeasured.
- The helper never resends a message. omp may retry a failed model request itself (shown as an `auto_retry` line). A manual retry shows "Retry sends: <first 60 characters> + N cards; tools already run may repeat".
- Slash handling: pass `/` messages through. The helper reads `get_available_commands` at startup and refuses (a) the blocklist of 40 builtins and their aliases (`models`, `worktree`, `plugin`, `force:`) listed under "Live check results", and (b) the non-builtin commands that reach the model as writes or tool-set changes: at least `init` and `fusion`. The allowlist is `jobs`, `changelog`, `tools`, `context`, `dirs`. Anything with `source == builtin` and not on the allowlist is refused, so a builtin added by a later omp is blocked until reviewed. `!` is not supported.
- The first message of a fresh conversation can take extra seconds because `AGENTS.md` makes the agent read `memory/index.md` and `CONTEXT.md`. The Timeline shows those tool lines.
- The per-Meeting skill is sent with the first Ask message after a Meeting starts, once per Meeting, shown as a collapsed line. It carries no Meeting title, transcript or card text. No turn runs at Meeting start without a key press.

### Storage
- `~/Documents/itastack/artifacts/meeting-assistant/` (git-ignored, checked with `git check-ignore`): `chat/` (the omp session and its sidecar dirs), `cards.jsonl`, `timeline.jsonl`.
- `cards.jsonl`: one line per card or divider, `{kind, id (uuid), at, ...}`. Cards keep only `question`, `answer`, `sources`, `created_at`; the `utterance` field is dropped before saving. The card event gains `at`.
- `timeline.jsonl`: Ask messages with their display text, so a restore never shows ride-along quotes. The Timeline order is by `at`.
- Timeline replay and Overlay rendering read these files in the helper and make no model call.
- "New conversation" deletes only the above. It does not delete anything the agent wrote into `memory/`, `research/`, `notes/` or `reports/`, omp logs under `~/.omp`, or provider-side copies. The Persona default tells the agent not to save call or card text to memory.

### Helper contract (update `docs/protocol.md`)
- stdin: `{"cmd":"ask_open"}`, `{"cmd":"ask","text":S}`, `{"cmd":"stop"}`, `{"cmd":"retry"}`, `{"cmd":"new"}`. The service's `send()` takes an object, not only a command string.
- stdout: `timeline` (once at startup, entries), `divider` (`meeting_start` / `meeting_end`, meeting, at), `ask_status` (`stopped|starting|idle|busy|error`, turn), `ask_delta` (turn, text), `ask_tool` (turn, name, phase), `ask_queued`, `ask_restored` (messages: `[{turn,text}]`), `ask_end` (turn, status `completed|aborted|error|no_response`), `ask_error`. The QML must also handle `error`, which it ignores today.

### Settings (manifest keys and helper flags)
- `askModel` (default `openrouter/deepseek/deepseek-v4-flash-0731`) → `--ask-model`. Separate from the research model.
- `askThinking` (default `low`) → `--ask-thinking`.
- `askSkill` (default empty = none; bare skill name, sent as `/skill:<name>`) → `--ask-skill`. Omp does NOT report a missing skill (measured: the text goes to the model as a plain message), so the helper checks `skill:<name>` against `get_available_commands`, shows an error line and sends nothing when it is absent.
- `personaPath` (default `~/.config/omarchy/plugins/shreeve1.meeting-assistant/persona.md`, created from a shipped default if missing; read at launch, so edits apply after the Ask process restarts) → `--persona`.
- `--ask-dir` (default `~/Documents/itastack/artifacts/meeting-assistant`), `--ask-cwd` (default `~/Documents/itastack`), `--ask-timeout` (default 120, injectable for tests).
- Changing any of them restarts the Ask process at the next idle moment.

### Docs and code touched by the build
- `docs/protocol.md`, ADR 0014 lines 16–17, 061 story 13 and the Overlay-behavior line, `manifest.json` description ("passive overlay"), `Service.qml` line 188 (`keyboardFocus: None`) and its "full-screen fixed surface" comment, the CONTEXT.md intro, and `~/Documents/itastack/memory/workflows/meeting-assistant-plugin.md`.

## Testing Decisions

- Same seam as 061, the helper, with a fake omp. Assert only on stdout events, stdin to the fake, and files. Never assert on prompt wording.
- Live checks against the real omp first, recorded in this ticket before the build: (1) record a real streamed turn and base the fake on it; (2) a session dir holding two sessions, `--continue` resumes the Ask session; (3) `/skill:<name>` runs over RPC with the extension loaded; (4) each builtin slash command, with the blocklist written to `docs/protocol.md`; (5) the extension loads and `get_available_commands` shows its marker.
- Helper tests: concatenated `ask_delta` text equals the final reply, tool events keep order, no delta follows an abort; killed and restarted Ask process resumes; after `new`, a killed and restarted helper does not resume old text; Enter while busy sends a follow-up and shows a queued line; retry sends the same text and the same cards once; the injectable timeout fires only when no event arrives, and tool events reset it; pause does not block `ask`; cards unsent at pause are not in any send; ride-along carries only question, answer and sources; a card containing the closing fence does not end the block; stdin text to the fake equals the typed text byte-for-byte for a `/skill:` message even with unsent cards; the per-Meeting skill is sent once per Meeting with the first ask and never at Meeting start; the shipped config overlay and extension are in the launch arguments; the helper refuses a blocklisted builtin; restart while paused and a delayed record wholly inside the pause and one spanning the resume are all not researched (the pause fix).
- A card, Persona and extension unavailable at launch each show an error line and do not crash.
- Smoke through the real shell: press the key with no cards and with cards; type; Esc returns focus to the previous window on a one-monitor and a two-monitor layout; click a window on the same monitor and on another monitor and confirm the box closes and the click lands; same key closes; a card landing mid-typing does not move focus; a `grim` capture with the box open hides only the Overlay rectangle; the bar icon and Overlay show the paused label; the box opens with no cards and no Meeting.

## Live check results (2026-10-07)

All measured against `~/.local/bin/omp` 18.6.3 over `--mode rpc`, one temp session dir per probe under `/tmp/SliceBLiveChecks/`, never the real `artifacts/`. Launch used: `omp --mode rpc --cwd ~/Documents/itastack --session-dir <tmp>/chat --continue --model openrouter/deepseek/deepseek-v4-flash-0731 --thinking low --append-system-prompt PLUGIN/persona.default.md --config PLUGIN/ask-overlay.yml -e PLUGIN/ask-context.ts`, env `MEETING_ASSISTANT_CARDS_FILE=<tmp file>`. Prompts were harmless ("reply with only the word ok", a one-file `read`, `/skill:pstack-bro`). Files created: `ask-overlay.yml`, `ask-context.ts`, `persona.default.md`, `tests/fixtures/ask_turn.jsonl`.

### Overlay (ticket line 78, re-verified)
- Measured: the same trivial turn with no `--config` wrote `<session>/__advisor.jsonl`; with `ask-overlay.yml` the dir held only the session `.jsonl`. `/advisor status` in the overlay run: "Advisor is disabled."
- Measured: `--thinking low` IS honoured on `--continue`. A session saved at `high` (`thinking_level_change high` entries in both files) resumed with `--thinking low`, and `get_state` returned `thinkingLevel: "low"`. Line 78's "UNVERIFIED" can become "verified". NOT tested: `--model` overriding a DIFFERENT saved model on resume (the saved and flag models were the same in every probe), so line 77's claim that the explicit flag wins stays unverified here (the RPC docs say it does).

### Check 1: streamed turn, fixture
- Sent `{"id":"t1","type":"prompt","message":"..."}` (told the model to `read` one file once and answer `done`), read stdout until `session_settled`. Saved to `tests/fixtures/ask_turn.jsonl`, 42 frames, one per line, in arrival order, extension loaded.
- Measured frame order: `ready`, `extension_ui_request` (setWidget autoresearch, from a user-level extension), `advisor_cost_changed`, `available_commands_update` x2, `response` (get_available_commands), `response` (prompt, `success:true`, no `data` key for an agent turn), `agent_start`, `turn_start`, `message_start`/`message_end` (user), `message_start`, 13x `message_update` (`toolcall_start`, `toolcall_delta`..., `toolcall_end`), `message_end`, `tool_execution_start`, `tool_execution_end`, `message_start`/`message_end` (toolResult), `turn_end`, `turn_start`, `message_start`, `message_update` x3 (`text_start`, `text_delta`, `text_end`), `message_end`, `turn_end`, `agent_end` (`isTerminal:true, yielded:true`), `extension_ui_request`, `prompt_result` (`status:"completed", sessionSettled:true`), `session_settled`.
### Check 2: two sessions, `--continue`
- Ran with `--thinking high`: session A ("remember ALPHA"), then RPC `new_session` (response `{"cancelled":false}`), session B ("remember BETA"). The dir then held two `.jsonl` files and no sidecar dirs (no advisor).
- Restart with `--continue`: resumed B (newest mtime), `messageCount` 2, answered `BETA`. After `touch` on A's file and another restart: resumed A, answered `ALPHA`. Confirms line 80 (newest by mtime) and the note on line 81 that `new_session` leaves the old file behind.

### Check 3: `/skill:<name>` with the extension loaded
- Skill used: `pstack-bro` (`disable-model-invocation`, text only, no tools). Sent `{"type":"prompt","message":"/skill:pstack-bro"}`. Measured: response `success:true`, `agent_start`, a hidden `custom` message `customType:"skill-prompt"` with the skill body, an assistant reply, `agent_end`, `prompt_result completed`, `session_settled`. The user message itself is not recorded as a user message; the skill body replaces it.
- Measured, nonexistent skill: `/skill:nonexistent-zzz` is NOT an error. Response `success:true`, no error frame, the literal text goes to the model as an ordinary user message, `prompt_result completed`. So "A missing skill shows an error line" (line 116) must be done by the helper from `get_available_commands` (`skill:<name>` present or not); omp will not report it.
- Measured, with a card pending (see check 5): dispatch still worked, the card did not stop it.

### Check 4: builtin slash commands
- Source: `get_available_commands`, `source == "builtin"`, 45 entries. Aliases exist and the helper must match them too: `models` = `model`, `worktree` = `wt`, `plugin` = `plugins`, `force:` = `force`.
- Executed only these, all measured harmless: `/context`, `/dirs`, `/tools`, `/jobs`, `/changelog last 1`, plus the read-only forms `/dump`, `/usage show`, `/session info`, `/advisor status`, `/fast status`, `/slow status`, `/skillful status`, `/model`, `/effort` (no args). Each returned `command_output` then a `response` with `data.agentInvoked:false`, no `agent_start`, no `prompt_result`, no `session_settled`, and `config.yml`/`models.yml` hashes were unchanged afterwards. A builtin does not run `before_agent_start`, so a pending card stays pending (measured with `/dirs`). Not executed: everything on the block list.
- What each does (from the `description` field; behaviour of unexecuted ones is from that text only, [INFERENCE] beyond it):
  - security: plan/run/import/export OMP security scans. model: show model (no args measured read-only; with an argument it may switch, untested). switch: switch model for this session. fast, slow, skillful, extended-context, computer: toggles. ratchet: build an eval and hillclimb unattended. prewalk: arm or restart prewalk. modelpreset: list/save/switch/delete presets. effort: set or show thinking level (the plugin owns it). advisor: toggle advisor (turns on a third provider, story 19). export: session to HTML. trace: open stats dashboard. dump: full transcript as text with the system prompt (no-arg form measured read-only; output size not measured). share: encrypted link or gist. browser: toggle. todo: edit/export/import todos. session: `info|delete|pin`. usage: `show|reset`. stats: launch a local dashboard server. mcp, ssh, marketplace, plugins, reload-plugins: manage servers and plugins. fresh: reset provider stream state. compact, shake, handoff: rewrite the transcript or compact it. pin, rename, move, wt, add-dir, remove-dir: change the session. retry: re-run the last failed turn. memory: manage memory. force: force the next turn to use a tool.
  - jobs: list background jobs. changelog: print changelog. tools: list tools. context: show context use. dirs: list workspace dirs.
- Judgment calls: commands whose no-arg or `status` form is harmless but which have a mutating argument (`model`, `effort`, `fast`, `slow`, `skillful`, `advisor`, `usage`, `session`, `fresh`) are blocked by name; the helper may instead allow them only when the arguments match a fixed read-only set, if that is wanted. `dump` is blocked because it prints the system prompt and the whole transcript (including ride-along card text) into the client, not because it changes anything. `retry` is blocked because the helper owns retry (line 97).
- Non-builtin commands that the `source == builtin` rule does NOT cover: `fusion` (extension, changes the active tool set), `autoresearch` (extension), `green`, `review`, `annotate` (custom prompt templates), `init` (file template: "Generate AGENTS.md for current codebase", a write). These reach the model as prompts. Decide whether the helper blocks them too; at minimum `init` and `fusion`.
- Measured: `/new` is not a builtin over RPC. It went to the model as a user message and the model answered by reading `memory/index.md` (tool call), confirming lines 83 and 99.

Final blocklist (refuse; 40 builtins):
- security
- model
- switch
- fast
- slow
- skillful
- extended-context
- computer
- ratchet
- prewalk
- modelpreset
- effort
- advisor
- export
- trace
- dump
- share
- browser
- todo
- session
- usage
- stats
- mcp
- ssh
- fresh
- compact
- shake
- handoff
- pin
- retry
- memory
- rename
- move
- wt
- add-dir
- remove-dir
- marketplace
- plugins
- reload-plugins
- force

Final allowlist (pass through; 5 builtins):
- jobs
- changelog
- tools
- context
- dirs

### Check 5: extension, marker, card ride-along
- Extension API read from the omp docs (`extensions.md`, `hooks.md`) and from the binary's `emitBeforeAgentStart` and `before_agent_start` caller. Factory `export default function (pi: ExtensionAPI)`, `pi.registerCommand`, `pi.on("before_agent_start", ...)` returning `{ message: { customType, content, display } }`.
- Measured: loaded with no `extension_error`. `get_available_commands` lists `{"name":"meeting-assistant-ask-context","description":"Marker: ...","input":{"hint":"arguments"},"source":"extension"}`. The helper checks `source == "extension"` and the name.
- Ride-along, measured: cards file `{"id":"c-1","header":"...","cards":["{\"question\":\"What is FAKECARD?\",...}"]}`, then `prompt` `reply with only the word ok`. The session file holds, in order: user message `[{"type":"text","text":"reply with only the word ok"}]` (byte-identical to the sent text, `attribution:"user"`), ONE `custom_message` `customType:"meeting-assistant-cards"` with `display:false` and content `header\n<untrusted-cards>\n<card>\n</untrusted-cards>`, then the assistant `ok`. A second `prompt` (same card file) did NOT inject again.
- Measured, abort: with a card pending, a long turn then `abort` gave `prompt_result status:"aborted"`; the card message was already in the session and the sent marker was written. An aborted turn counts as sent.
- Measured, `before_agent_start` messages (line 89): `ask-context.ts` returned one message and a second probe extension (`-e`, two handlers) returned one message per handler. ALL THREE reached the session as separate `custom_message` entries. In 18.6.3 the first message is NOT the only one kept (`hooks.md` says it is, for the legacy hook path; the binary's `emitBeforeAgentStart` pushes every message). One combined message is still the cleaner contract. Line 89's "UNVERIFIED" becomes "false in 18.6.3".
- Contract of `ask-context.ts` (queue shape, replaces the single-slot `{id?, header, cards[]}` file): `{"entries":[{"id":UUID,"text":STRING,"header":STRING,"cards":[STRING,...]},...]}`, appended by the helper, one entry per send that has cards. The sent marker is the sibling file `<cards file>.sent`, a JSON array of delivered entry ids appended by the extension at `agent_end` with `willContinue !== true`; the extension also keeps an in-process published id set filled at `message_end` of the hidden message. At `before_agent_start` the extension injects the first unsent entry whose `text` equals `event.prompt`, else the first unsent entry whose `text` is a blank-line-delimited part of a joined batch prompt, else, only when the prompt starts with `/` and exactly one entry is unsent, that entry; otherwise nothing. Missing or empty file, no `entries`, or invalid JSON injects nothing (invalid JSON logs a warning). A retry appends a new entry with a new `id`.
- Measured loss of the single-slot file (omp 18.6.3, real extension): A running, the helper wrote the payload for queued B, then C had no newer cards so the helper deleted the file: no message ever got cards, B's were lost. If C instead overwrote the file with its own payload, B received C's cards and B's own were lost. `before_agent_start` fires once per dequeued submission, later, in queue order.
- Measured `before_agent_start` event for queued submissions: `prompt` is that submission's exact sent text (events for A, B and C carried exactly the texts sent); the event also has `images` and `systemPrompt`. This is what the extension matches entries on. A joined batch is [INFERENCE from the docs, not measured]: the texts joined by two newlines. A slash or skill prompt may reach the extension transformed [INFERENCE], hence the single-unsent-entry fallback.
- Live check of the queue shape (`tests/test_ask_context_live.py`, real omp 18.6.3 and the real `ask-context.ts`, run once with `MEETING_ASSISTANT_LIVE_OMP=1`): A running, B and C queued. With an entry for B only: exactly one cards message, containing B's card. With entries for B and then C: two cards messages in order, B's card in the first only and C's in the second only. The user message texts of A, B and C were unchanged.
- What the extension API cannot express: `session_settled` and `prompt_result` are RPC frames, not extension events. The closest events are `agent_end` (extension form has `willContinue`, not `isTerminal`/`yielded`) and `session_stop` (advisory, can force continuations). The extension persists the marker at `agent_end` with `willContinue !== true`; per the docs this is after the yield and may precede `session_settled` when background jobs are pending [INFERENCE, not tested]. It cannot see an errored turn's `prompt_result.status` [not tested: provider error turn]. A crash between injection and `agent_end` would leave the marker unwritten and the card would be sent again after restart [INFERENCE, not tested]; that is a duplicate, not a loss.
- Not tested: a card pending when the first message of a fresh session runs `AGENTS.md` startup reads; a provider-error turn; a card file written during a running turn.

### What contradicts or refines the ticket
- Line 89: more than the first returned message IS kept (measured). Design (one combined message) still fine.
- Line 87: marking sent only at settle is insufficient; `before_agent_start` re-fires per follow-up batch inside one run (measured), so the extension also needs an in-process published key.
- Line 91: a byte-identical retry is never injected, because the extension treats an already-sent entry id as sent. The helper appends a new entry with a new `id` on retry. Superseded for the single-slot file by the queue shape in Check 5.
- Line 116: a missing skill is not an error from omp; the helper must check the command list.
- Line 98: `source == builtin` misses `init`, `fusion`, `autoresearch`, `green`, `review`, `annotate`; aliases (`models`, `worktree`, `plugin`, `force:`) must be matched.
- Line 78: thinking override on resume is verified (low beat saved high).
- Line 81: `new_session` leaving the old file confirmed (two files in one dir).
- `prompt` response carries no `data` for an agent turn; only builtins return `data.agentInvoked:false`. The "turn ended" signal is `prompt_result`, then `session_settled`.

## Out of Scope

- A gate on writes (confirm in the Overlay, `--approval-mode`). Declined; see ADR 0015.
- Auto-retry by the helper, `!` shell commands, a second Ask surface, a second model route.
- Any change to the Voxtype Meeting Transcriber.

## Open decisions

- **Stop key.** Esc closes the box (settled), so no key is chosen for Stop. Proposed: Esc stops a running turn first and closes on a second press.
- **Per-Meeting skill timing.** Refined from "at Meeting start" to "with the first Ask message of the Meeting", to avoid an unprompted turn with write tools. Change it if you disagree.

## Further Notes

- **Not yet verified:** how the chosen model handles ITAStack tool calls and planted text in a card; how `--approval-mode` behaves over RPC; abort of an in-flight MCP call; the click-away delivery and the `mask` plus `no_screen_share` interaction on a real desktop; resize flicker.
- **Unresolved bug in ticket 061's build:** the pause leak described above. Regressions required: a delayed record wholly inside the pause; a segment spanning the resume; restart while paused; delayed record after resume then restart.
- **Reviewed:** four independent read-only reviews on 2026-10-07 (protocol, session lifecycle, pause and focus, spec quality). Their accepted findings are in this ticket. One finding (a fixed guard block) was rejected because `AGENTS.md` line 85 already supplies the rule.
- Labels are empty on purpose. Add `ready-for-agent` when you want it built.
