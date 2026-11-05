# dsh-only guidance

Loaded by dsh on top of the shared `~/.agents/AGENTS.md`; pi, Codex and Claude Code never see this file. Add only, never contradict the shared file.

## herdr orchestration

When James mentions herdr tabs ("check my tabs", "start hub", "drive a1", "a1 <instruction>", "done a1", "open items"), a hub or tab-follow wake fires, he asks to start or pick up a session, this chat is about to start herdr tabs (herdr-handoff, herdr-fanout), or he approves a plan ("approved", "go", "hand it off"), first read `~/testy-bot/memory/rules.md` row "herdr tabs" and every file it names. `memory/...` links in those files are relative to `~/testy-bot`.

A chat that starts herdr tabs follows them itself: one `tab-follow` sentinel on its whole tab tree, including tabs those tabs start (steps: `memory/workflows/orchestration/plan-to-worker.md` "Follow tabs"). Never rely on per-report-file watches alone.

Orchestration memory has one home, `~/testy-bot/memory`, whatever project this chat is in. When James settles an orchestration decision, preference or workflow change (how tabs are started, followed, nudged, driven, merged or reported), save it there with the `personal-memory` skill under the `orchestration` topic, not in the current project's memory: read `~/testy-bot/memory/README.md` first, update an existing orchestration file in place where one fits, run its `indexes.py` and `gate.py audit` from `~/testy-bot`, then commit only those files there with `GIT_CONFIG_GLOBAL=~/.gitconfig git -C ~/testy-bot commit`.
