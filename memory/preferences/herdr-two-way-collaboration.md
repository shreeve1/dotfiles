---
title: Herdr two-way collaboration
summary: James wants visible two-way herdr tasks; the originating session owns verification, local merge, worktree cleanup and tab closure.
type: preference
status: promoted
created: 2026-10-31
updated: 2026-10-31
---

## Preference

James explicitly liked how ops-board-scheduling opened the route-race task in a separate herdr tab and the sessions communicated back and forth. For work that warrants a separate session, favour this visible, two-way collaboration over a one-way handoff that makes James carry messages between agents. This is not a request to delegate every small task.

James values keeping task sessions warm while the parent is checking and integrating their work, so missing pieces and updates can go back to the same session without rebuilding its context. He sees this as an optional alternative or backup to Superpowers subagent execution, not a universal replacement. He approved the design direction for `herdr-fanout`: parent-owned coordination and a bounded fix cycle, with optional warm reviewer tabs in `independent-review` and existing subagent review remaining the default. Initial reviewers start fresh; the same reviewers check fixes. The approved direction uses at most three fix/re-review rounds per unit and keeps unresolved accepted high/medium findings blocking. The design is in `docs/superpowers/specs/2026-10-31-herdr-fanout-design.md`; implementation availability must be checked rather than assumed.

James normally accepts the recommended merge and worktree cleanup. He wants the session that opened a task tab to finish that work for him, rather than repeatedly presenting those choices.

The global rule and standing approval live in `.agents/AGENTS.md` under Side work. `.agents/skills/herdr-handoff/SKILL.md` owns the coordination contract, reply-address lookup, launch recovery, result verification and the integration/cleanup sequence; follow those rather than treating this preference as a second procedure.

## Reference

- `.agents/skills/herdr-handoff/SKILL.md` owns opening task tabs; `herdr agent prompt` carried follow-ups and the return report in the reviewed sessions.
