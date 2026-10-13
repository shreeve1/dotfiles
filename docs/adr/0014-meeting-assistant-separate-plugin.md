---
status: accepted
---
# Meeting Assistant is a separate plugin that reads the transcript file

The Meeting Assistant is its own Omarchy plugin. It reads the Voxtype Meeting Transcriber's `transcript.jsonl` by pathname on every change, because the capture service replaces the file atomically (`service/src/transcript/mod.rs`) and an open handle or appended-bytes tail would miss updates. The capture service stays unchanged: its documented scope excludes AI summarization, and it only emits an Utterance after 700 ms of silence plus a Whisper job, so Research Cards arrive late. That lag is measured in the plugin before any service work on partial transcripts.

## Considered Options

- Add the assistant into the transcriber plugin: breaks its stated scope.
- Standalone plugin with its own audio capture: duplicates a working pipeline.

## Consequences

- Microphone and system Utterances are deduplicated by fuzzy match, since speakers re-capture the other side's audio.
- Research runs through persistent `omp --mode rpc` processes on `openrouter/deepseek/deepseek-v4-flash-0731`. Transcript text leaves the machine (OpenRouter, then the search provider); the system prompt tells the model to search general topics only, and the plugin offers a pause toggle for sensitive calls. This describes the research workers only; the Ask agent is a second route with different limits (see ADR 0015).
- While the Ask box is closed the Overlay never takes keyboard focus (ADR 0015 changes this while the box is open). Screen-capture exclusion was tested on 2026-10-06 with `grim` on Hyprland 0.56.2. `hl.layer_rule({ match = { namespace = "^omarchy-meeting-assistant$" }, no_screen_share = true })` is accepted (no config errors) and does hide the Overlay from capture: the card region came out black. With a full-screen Overlay surface the rule blacked out the whole capture, because the compositor hides the entire surface rectangle. While the box is closed the Overlay is therefore sized to the card column, so only the card rectangle is hidden. This covers the compositor's own capture path, which is what `grim` and the screencast portal use [INFERENCE for the portal; only `grim` was exercised]. It does not cover a physical camera or a meeting app's own tools. Verify with a real screen share before relying on it.
