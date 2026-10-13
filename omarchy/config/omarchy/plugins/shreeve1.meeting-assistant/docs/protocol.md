# Meeting Assistant helper protocol

The helper `bin/meeting-assistant` is a headless Python 3 program (standard library only). `Service.qml` starts it, reads its stdout, and writes commands to its stdin. All logic lives in the helper. The QML only renders and forwards.

Vocabulary is the "Meeting assistant" section of `~/dotfiles/CONTEXT.md`: Meeting, Utterance, Source, Research Card, Overlay.

## Command line

```
meeting-assistant [--socket PATH] [--sessions-dir PATH] [--omp CMD] [--model ID]
                  [--thinking LEVEL] [--concurrency N] [--timeout SEC] [--state-dir DIR]
                  [--ask-model ID] [--ask-thinking LEVEL] [--ask-skill NAME] [--persona PATH]
                  [--ask-dir DIR] [--ask-cwd DIR] [--ask-timeout SEC]
```

| Flag | Default |
|---|---|
| `--socket` | `$XDG_RUNTIME_DIR/voxtype-meeting-service/voxtype-meeting-service.sock` (fallback `/run/user/<uid>/...`) |
| `--sessions-dir` | `${XDG_DATA_HOME:-~/.local/share}/voxtype-meeting-service/sessions` |
| `--omp` | `~/.local/bin/omp` if it is an executable file, else `omp` |
| `--model` | `openrouter/deepseek/deepseek-v4-flash-0731` |
| `--thinking` | `low` |
| `--concurrency` | `2` |
| `--timeout` | `90` (seconds, per research run) |
| `--state-dir` | `$XDG_RUNTIME_DIR/meeting-assistant` (worker config overlay and worker cwd live here) |
| `--ask-model` | `openrouter/deepseek/deepseek-v4-flash-0731` |
| `--ask-thinking` | `low` |
| `--ask-skill` | empty (no per-Meeting skill); a bare skill name, sent as `/skill:<name>` |
| `--persona` | `~/.config/omarchy/plugins/shreeve1.meeting-assistant/persona.md` |
| `--ask-dir` | `~/Documents/itastack/artifacts/meeting-assistant` |
| `--ask-cwd` | `~/Documents/itastack` |
| `--ask-timeout` | `120` (seconds with no output from the Ask agent while a turn is open; positive float) |

`~` is expanded in `--state-dir`, `--persona`, `--ask-dir` and `--ask-cwd`.

## stdin (JSON lines)

```
{"cmd":"pause"}
{"cmd":"resume"}
{"cmd":"quit"}
```

The Ask commands (`ask_open`, `ask`, `stop`, `retry`, `new`) are objects with `cmd` and are listed under "Ask".

End of input means quit. Unknown commands and malformed lines are ignored with an `error` event.

## stdout (JSON lines, flushed per line)

### status

```
{"type":"status","state":S,"meeting":SESSION_ID|null,"detail":STRING|null,"active_runs":N,"paused":BOOL}
```

`state` is chosen by the first rule that matches:

1. `paused` when the pause flag is set.
2. `unavailable` when the capture service socket is missing or unreachable.
3. `idle` when there is no live Meeting (`capture_active` false).
4. `error` when the last run failed, no run is in flight, and the Meeting is live. Cleared when the next run starts. `detail` carries the message.
5. `researching` when at least one run is in flight.
6. `listening` otherwise.

A status line is emitted at startup and whenever any field changes. Identical consecutive lines are not repeated.

### card

```
{"type":"card","id":STRING,"question":STRING,"answer":STRING,
 "sources":[{"url":STRING,"title":STRING|null}],
 "utterance":{"source":"mic"|"system","sequence":N,"text":STRING},
 "lag_ms":N|null,"research_ms":N}
```

- `id` is unique per card within the helper process.
- `utterance` is the newest Utterance in the window that triggered the run.
- `lag_ms` is the delay from that Utterance's `ended_at` to the moment the card was emitted. `null` when `ended_at` does not parse. The capture service's `ended_at` is not an exact end of speech, so treat this as an upper bound.
- `research_ms` is the delay from the helper first seeing the Utterance to the card being emitted.
- A card is only emitted when it has at least one source URL that appeared in a `web_search` result of the same run. Runs that answer `NONE` emit nothing.

### error

```
{"type":"error","message":STRING}
```

Run failures, timeouts, a worker using a forbidden tool, unparsable model output. One line per event. Never fatal to the helper.

## Behavior contract

- **Starting point.** Utterances already in the transcript when a Meeting is first seen are marked seen and never researched.
- **Trigger.** Every new Utterance that survives deduplication triggers research immediately. At most `--concurrency` runs are in flight. Extra Utterances coalesce into one pending window that starts when a slot frees. In-flight runs are never cancelled by newer speech.
- **Window.** The last six accepted Utterances in chronological order, or all unprocessed ones when there are more, capped at 20.
- **Deduplication.** A new Utterance is dropped when an accepted Utterance from the other Source overlaps it in time, or is within 2 seconds, and the normalised text is closely similar (shorter text mostly contained in order in the longer). The copy that arrived first is kept. Decisions are final per `(source, sequence)`.
- **Transcript file.** Re-read by pathname when its inode, size or mtime changes. Never held open. The file is replaced atomically on every transcription job, can reorder lines, and does not exist until the first job finishes. Utterances are keyed by `(source, sequence)`. Blank text is ignored.
- **Live Meeting.** Asked of the capture service socket with `{"op":"status"}` every 2 seconds. Live means `capture_active` is true. The Meeting directory is `<sessions-dir>/<session_id>`. A new `session_id` replaces the old Meeting and drops all state from it.
- **Pause.** Kills in-flight runs without emitting their cards. Utterances arriving while paused, and Utterances present in the transcript at the moment of resume, are marked seen and never researched. Resume continues from new Utterances only. Pause persists across helper restarts until `resume`: the helper keeps a `paused` marker file in `--state-dir`, reads it before its first status, starts no worker while paused, and leaves it in place on `quit`, SIGTERM and stdin EOF. The default state dir is a per-user runtime dir that is cleared on reboot, so pause does not survive a reboot.
- **Meeting ends.** Workers are stopped. State returns to `idle`.
- **Ask.** Works in every research state: paused, `unavailable`, idle, no Meeting. Meeting end stops research workers, not the Ask agent.
- **The pause promise.** While paused, the Meeting Assistant starts no research and creates no cards, and cards not yet sent are dropped, so call text spoken during the pause is never researched or attached to an Ask message. Ask keeps working. It still re-sends the whole saved conversation to the model on every turn, including earlier cards and anything you typed, and the Ask agent can read the live transcript file if you ask it to. Pause does not stop recording.

## Ask

One long-lived `omp --mode rpc` process (the Ask agent), driven by `bin/ask_agent.py` (state machine) and `bin/ask_pure.py` (slash classification, cards payload, `Store`). It starts on the first `ask_open` or `ask` and keeps running until `new` or helper quit.

Launch:

```
omp --mode rpc --cwd <ask-cwd> --session-dir <ask-dir>/chat --continue
    --model <ask-model> --thinking <ask-thinking> --append-system-prompt <persona>
    --config <plugin>/ask-overlay.yml -e <plugin>/ask-context.ts
```

Environment: `MEETING_ASSISTANT_CARDS_FILE=<ask-dir>/cards-pending.json`. `<ask-dir>` and `<ask-dir>/chat` are created with mode 0700. The Ask agent uses the same `--omp` command as the research workers.

The Persona file is created from `persona.default.md` (parent directories included) when missing. If it cannot be created or read, or `<ask-dir>` cannot be prepared, or the extension marker command is absent from `get_available_commands`, `ask_open` and `ask` emit `ask_error` and research carries on.

### Slash commands

`ask` text is classified before anything is sent. `!` text is refused. A `/skill:<name>` is passed only when `skill:<name>` is in `get_available_commands`. A command named in `BLOCKLIST`, `ALIASES` or `EXTRA_BLOCKED` is refused. Any other command whose `source` is `builtin` and which is not in `ALLOWLIST` is refused. Everything else passes through. The lists are the constants in `bin/ask_pure.py` (`BLOCKLIST`, `ALIASES`, `EXTRA_BLOCKED`, `ALLOWLIST`); the measurements behind them are in ticket 062, "Live check results". A refusal emits `ask_error` with `retry:false`, sends nothing to the agent and writes no cards file.

An allowlisted builtin (`/dirs`, `/context`, `/tools`, `/jobs`, `/changelog`) runs inside omp without starting an agent turn. Measured on omp 18.6.3 (`tests/fixtures/ask_local_builtins.jsonl`): the prompt produces one `command_output` frame `{"type":"command_output","text":...}`, then the prompt `response` with `data.agentInvoked:false`; no `agent_start`, `message_*`, `prompt_result` or `session_settled` follows, and the next ordinary prompt runs normally. `AskAgent` buffers `command_output` text while the current turn has not started an agent turn. On the `agentInvoked:false` response it emits one `ask_delta` with the text (newline-joined; skipped when empty), then `ask_end` `completed` with the same text, then goes idle (or starts the next queued turn) and ignores any later `prompt_result` for that id. A `command_output` with no send in flight becomes a standalone `ask_end` for a new turn and does not change state. While a real turn is busy, a slash command that would run locally is refused with `ask_error` `{message:"Wait for the current reply before running a slash command", retry:false, retry_preview:null}` and nothing is sent, because the queued local case is unmeasured.

### Cards ride along

Cards saved since `last_sent_at`, for the current Meeting only, are appended before each send that has cards to `<ask-dir>/cards-pending.json` (temp file plus rename, mode 0600, existing entries kept):

```
{"entries":[{"id":UUID,"text":STRING,"header":STRING,"cards":[STRING,...]},...]}
```

One entry per send that has cards. `text` is the exact typed text of that send. Each element of `cards` is a JSON string `{"question","answer","sources":[URL,...]}` with `</` escaped as `<\/`, so a card cannot close the extension's fence. At most the newest 10 cards and 4000 characters are sent per entry. The utterance text is never included. The typed text is sent unchanged as the `prompt` message. A send with nothing to send adds no entry and never removes or rewrites other entries, so a queued send's entry survives later sends. While paused no entry is added. `last_sent_at` advances to the newest included card's `at` only when omp accepts the send; the value before the advance is remembered per turn. `retry` appends a new entry (new `id`) with the same `text`, `header` and `cards`. `pause` sets `last_sent_at` to now and clears every unsent entry, queued sends included, so cards unsent at pause are in no later send (they stay saved and shown). `new` deletes the file and `.sent`. When Stop returns queued sends to the input box (`ask_restored`), the entries of those turns are removed and `last_sent_at` rolls back to the earliest remembered value among them when that is earlier, so the cards return with the retyped message.

The extension matches an entry at delivery. `before_agent_start` carries the submission's exact text as `event.prompt`; the extension injects the first unsent entry whose `text` equals it, as one hidden `meeting-assistant-cards` message. If the prompt is a joined batch (texts separated by a blank line), the first unsent entry whose `text` is one of those parts matches. If nothing matches and the prompt starts with `/` (slash and skill dispatch can transform the text), the only unsent entry is used, and with several unsent entries nothing is injected. The extension appends delivered entry ids to `cards-pending.json.sent`, a JSON array, at `agent_end` when `willContinue` is not true; an in-process set of ids published at `message_end` covers batches dequeued inside one run. The helper drops entries listed in `.sent` whenever it writes the file.

The per-Meeting skill (`--ask-skill`) is sent as its own prompt, `/skill:<name>`, before the first `ask` of each Meeting (identified by `session_id`), never without a user message, and is marked sent once omp accepts it. A missing skill emits `ask_error` and nothing is sent for that `ask`.

### Persisted files (`--ask-dir`)

| File | Contents |
|---|---|
| `chat/` | the omp session (one session, resumed with `--continue`) |
| `cards.jsonl` | one line per `card` and `divider` entry |
| `timeline.jsonl` | one line per `user` and `reply` entry (display text only) |
| `cards-pending.json`, `.sent` | the ride-along file and the extension's sent marker |

Entries: `{kind:"card",id,at,meeting,question,answer,sources,created_at}`, `{kind:"divider",id,at,event,meeting}`, `{kind:"user",id,at,turn,text}`, `{kind:"reply",id,at,turn,text,status}`. The transcript `utterance` is never saved. A write failure emits one `ask_error` and never stops the helper.

### stdin

```
{"cmd":"ask_open"}
{"cmd":"ask","text":STRING}
{"cmd":"stop"}
{"cmd":"retry"}
{"cmd":"new"}
```

- `ask_open` starts the Ask agent if it is stopped; idempotent.
- `ask` sends `text` byte-for-byte. While a turn runs it is queued as a follow-up and runs in the same omp run once the earlier reply finishes. omp gives no per-prompt idle signal in between, so the agent starts a queued turn at the `message_start` frame with `role:"user"` and the queue head's exact text, and ends the previous turn there. A turn's `status` comes from its `prompt_result`. `session_settled` only marks the process idle. See `tests/fixtures/ask_busy_send.jsonl` for the real frame order.
- `stop` aborts the running turn: the current turn ends `aborted` and queued turns are dropped (`ask_queued` `queued:false`). The helper sends `abort_and_restore_queue` with an `ask-N` id. omp (18.6.3, `tests/fixtures/ask_abort_restore.jsonl`) ends the run (`agent_end`), answers `{"type":"response","id":ID,"command":"abort_and_restore_queue","success":true,"data":{"steering":[{"text":S}],"followUp":[{"text":F}]}}` (the id is echoed only if the request had one), then sends `prompt_result` `aborted` for each queued prompt and the running one, then `session_settled`. The queued prompts never run and are never sent again. The `data` texts become `ask_restored`. An older omp answers `success:false`, and an exit before the reply also ends the wait; both restore from the locally dropped queue.
- `retry` resends the last failed or interrupted send: same text, same cards, new cards-file `id`.
- `new` stops the Ask agent (abort, close stdin, kill after 3 s), deletes `chat/`, `cards.jsonl`, `timeline.jsonl` and the cards files, and emits `timeline` with `entries:[]` and `ask_status` `stopped`. The agent restarts on the next `ask` or `ask_open`. RPC `new_session` is never used.

### stdout

`timeline` `{entries:[Entry]}` once at startup (from the saved files, in `at` order, before the Ask agent starts) and after `new` with `entries:[]`.

`card` gains `at` (RFC 3339 UTC, milliseconds).

`divider` `{id,at,event:"meeting_start"|"meeting_end",meeting}` at Meeting start and end.

`ask_status` `{state:"stopped"|"starting"|"idle"|"busy"|"error",turn:N|null,detail:STRING|null}`.

`ask_user` `{id,at,turn,text,queued}` echo of an accepted send.

`ask_delta` `{turn,text}` incremental assistant text.

`ask_tool` `{turn,name,phase:"start"|"end"}`.

`ask_queued` `{turn,text,queued}`; `queued:false` when the message starts running or is removed.

`ask_end` `{turn,status:"completed"|"aborted"|"error"|"no_response",text}`.

`ask_restored` `{messages:[{turn:N|null,text}]}` once per `stop` that dropped queued messages, never with an empty list. Texts are `data.steering` then `data.followUp`, oldest first; `turn` is the dropped turn with the same text (first unmatched wins) or `null`. The client removes those queued rows and puts the texts back in the Ask box. The helper also deletes their `user` entries from `timeline.jsonl`, since they never ran.

`ask_error` `{message,retry,retry_preview}`. Refusals, persona, directory and extension failures carry `retry:false` and `retry_preview:null`.

`error` stays the research-worker event. `status` is unchanged.

## Research worker

One `omp --mode rpc` process per concurrency slot, started when a Meeting becomes live, killed when it ends.

Launch flags, all required:

```
omp --mode rpc --no-session --no-extensions --no-skills --no-rules --no-lsp
    --tools web_search --thinking <level> --model <id>
    --config <state-dir>/worker.yml --system-prompt <fixed research prompt>
```

`worker.yml` contains:

```
disabledExtensions:
  - context-file:user:AGENTS.md
  - context-file:project:AGENTS.md
```

Probing on this machine showed `--no-rules` and `--no-skills` still leave the user's `~/.agents/AGENTS.md` in the system prompt. The overlay plus `--system-prompt` removes it (system prompt length 14,535 -> 553 characters, no `<file path=...>` blocks). The worker runs with `cwd` set to `<state-dir>/cwd`, an empty directory.

Per run, the helper sends `{"id":..,"type":"new_session"}`, waits for its response, sends `{"id":..,"type":"prompt","message":..}` and reads frames until `prompt_result` for that id. It never sends `bash`, `set_host_tools`, or any other command.

Frames used (observed live):

- `tool_execution_start` has `toolName` and `args`. Any `toolName` other than `web_search` kills the worker and emits an `error`.
- `tool_execution_end` has `result.content[].text`, the search hits. Source URLs must appear here.
- `message_end` with `message.role == "assistant"` has `message.content[]` items. The last assistant message's `type == "text"` items are the answer. Items with `type == "thinking"` or `"toolCall"` are ignored.
- `prompt_result` with `status` of `completed`, `aborted` or `error` ends the run.
- A terminal `agent_end` (`isTerminal` not `false`) must be followed by `prompt_result` within 5 s. Otherwise the run fails with `omp did not send prompt_result after agent_end; it is probably older than 18.6 (check which omp is first on PATH)` and the worker is killed. omp before 18.6 never sends `prompt_result`.

The model must answer exactly `NONE` or one JSON object `{"question":..,"answer":..,"sources":[{"url":..,"title":..}]}`. Code fences are stripped. Anything else is an error.

Utterance text enters the prompt only inside a quoted block of transcript data, together with the questions of the cards already emitted. The prompt tells the model to search general topics only and never client or person names.
