# Session Capture: OpenCode plugin edits need a server restart

- Date: 2026-10-25
- Purpose: building and live-testing the OpenCode verify-final plugin on wrk's native Windows OpenCode showed how OpenCode loads and reloads global plugins.
- Scope: plugin reload and load-count behaviour, and how to restart a remote Windows OpenCode server. The plugin's design is in ADR 0015.

## Durable Facts

- Editing a loaded OpenCode plugin file re-runs its `setup` with the cached module, so the new code does not run. It runs only after the background server (`opencode-cli`) restarts. Reopening the desktop app did not load it; ending `opencode-cli.exe` did. — Evidence: `docs/adr/0015-end-of-turn-verify-hooks.md` (OpenCode addendum); live tests on wrk 2026-10-25.
- OpenCode loads a global plugin once per location (twice in practice). Both copies share module state and each receives every event, so a plugin that reacts to events must dedupe by event id. — Evidence: `docs/adr/0015-end-of-turn-verify-hooks.md`; `.config/opencode/plugins/verify-final.ts` (`firstSeen`).
- On Linux machines (aidev, itan8n) the server is the user unit `opencode-server`; `systemctl --user restart opencode-server` reloads plugins. — Evidence: session commands on 2026-10-25.
- On a Windows machine over ssh, `opencode-cli service start` exits when the ssh session closes. A one-off scheduled task with `/it` started in the logged-in session keeps it running. — Evidence: surftop restart on 2026-10-25.

## Decisions

- James chose to record the restart gotcha in the wiki. — Evidence: session note.

## Evidence

- `docs/adr/0015-end-of-turn-verify-hooks.md` — reload and double-load behaviour.
- `.config/opencode/plugins/verify-final.ts` — event-id dedupe.

## Exclusions

- The OpenCode service password in `.config/opencode/service.json` was not captured.

## Open Questions And Follow-Ups

- James declined filing an upstream OpenCode bug report for the reload behaviour.
