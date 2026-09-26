# session-log

Hermes plugin port of the Pi `session-log` extension. Enabled interactive CLI/TUI parent sessions append Pi-compatible Markdown to `.sessions/` at the nearest git root. Gateway messaging, cron, batch, and delegated child sessions are skipped. The first file is written with a fallback session-id name; a bounded auxiliary `title_generation` call renames it when possible.

Caveat: one-shot `hermes -z` hard-exits (`os._exit`) right after the turn, before the background title call returns, so those logs keep the `<date>_<session_id>.md` name. Interactive sessions live long enough for the rename.
