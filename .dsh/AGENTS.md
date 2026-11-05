# dsh-only guidance

Loaded by dsh on top of the shared `~/.agents/AGENTS.md`; pi, Codex and Claude Code never see this file. Add only, never contradict the shared file.

## herdr orchestration

When James mentions herdr tabs ("check my tabs", "start hub", "drive a1", "a1 <instruction>", "done a1", "open items"), a hub or tab-follow wake fires, he asks to start or pick up a session, this chat is about to start herdr tabs (herdr-handoff, herdr-fanout), or he approves a plan ("approved", "go", "hand it off"), first read `~/testy-bot/memory/rules.md` row "herdr tabs" and every file it names. `memory/...` links in those files are relative to `~/testy-bot`.

A chat that starts herdr tabs follows them itself: one `tab-follow` sentinel on its whole tab tree, including tabs those tabs start (steps: `memory/workflows/orchestration/plan-to-worker.md` "Follow tabs"). Never rely on per-report-file watches alone.
