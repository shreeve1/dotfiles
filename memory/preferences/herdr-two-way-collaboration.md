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

James values keeping task sessions warm while the parent is checking and integrating their work, so missing pieces and updates can go back to the same session without rebuilding its context. He sees this as an optional alternative or backup to Superpowers subagent execution, not a universal replacement. The optional workflow is implemented in `.agents/skills/herdr-fanout/SKILL.md`; use it only when explicitly selected or offered and accepted. Optional warm reviewer tabs are in `.agents/skills/independent-review/references/herdr.md`; subagent review remains the default. Those skills own the parent-managed acceptance and bounded fix cycle; this preference is not a second procedure. The design rationale is in `docs/superpowers/specs/2026-10-31-herdr-fanout-design.md`.

James normally accepts the recommended merge and worktree cleanup. He wants the session that opened a task tab to finish that work for him, rather than repeatedly presenting those choices.

The global rule and standing approval live in `.agents/AGENTS.md` under Side work. `.agents/skills/herdr-handoff/SKILL.md` owns the coordination contract, reply-address lookup, launch recovery, result verification and the integration/cleanup sequence; follow those rather than treating this preference as a second procedure.

## Reference

- `.agents/skills/herdr-handoff/SKILL.md` owns opening task tabs; `herdr agent prompt` carried follow-ups and the return report in the reviewed sessions.
