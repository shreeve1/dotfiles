---
title: dsh-superagent Halo Project Watching
summary: James's chosen design for superagent watching Halo projects - live per-project tickets, silent in project channels, drafts only.
type: doc
status: promoted
created: 2026-11-04
updated: 2026-11-04
topics: [workstation]
---

## Active memory

- Why (2026-11-04): Halo projects are James's main bottleneck. Project information arrives from several places: each project's Slack channel, Halo actions and emails, Outlook, 3CX calls, and scheduling.
- Chosen design: option C, live watching. Each Halo project becomes one long-running superagent ticket. New activity in the project's Slack channel and in Halo goes to that project's worker. The worker raises only what needs James in `#ai-james`. Options A (on demand) and B (daily digest) were not chosen.
- Team boundary: superagent must not bother the team. It never posts in project channels and replies only in `#ai-james`. It must still read every teammate's message there (James, 2026-11-04): project channels are a common place work gets assigned to him, so a teammate's post can start or update his work. It works only on James's projects: the assigned technician shows in Halo and in each project's Slack channel. All projects are currently James's, but a project may be assigned to a teammate.
- Project channels follow names such as `#rce---network-modernization-2026` and `#cpti-bss-transition-2026` (mostly public). James approved Nathan joining them (Slack shows one "joined" message).
- Autonomy: everything is a draft to start (client emails, Halo updates, appointments). James's existing instructions in `~/Documents/itastack` (`AGENTS.md`, `memory/rules.md`, including the email and Halo client-reply drafting row) define how drafts are made; superagent should follow those, not new rules.
- How James talks to it (2026-11-04): Slack only for now, not a DSH session, a herdr/pi tab or a Slack DM. Every Slack message goes through the router.
- Questions (2026-11-04, option A): the router can't answer by itself, so a question becomes a small ticket that a worker answers through itastack. Added as text in the team "Ticket scope" prompt (prompt revision 2), with no code change. Routing a message to a project's existing ticket by name (option B) waits for option C. A ticket ends when its worker reports ready (completed); a later reply in its thread reopens it. `stop` in the thread ends it early.
- Visible-work exception (James, 2026-11-04): itastack's rule that research and changes happen only in a visible pi/herdr tab does not block superagent; its workers count as visible because James steers them in Slack. Written into the team "Ticket scope" prompt (revision 3), not into itastack's shared files. Changes still need James's yes in the thread.
- Purpose (James, 2026-11-04): superagent is one candidate to replace startday's poll loop, and possibly startday as a whole; `dispatch.py` will be removed from startday. Treat `~/Documents/itastack/.agents/skills/startday` as the reference for what to replace: its Halo rules (book, reply_owed, close_out, overdue_task, end-user note, 7-day idle, left queue), the scheduled-and-acknowledged skip, one tab per ticket, and the 3-tab cap. Superagent has Slack, Feishu and GitHub sources but no Halo source. The Halo side watches all of James's tickets, matching startday, not projects only (James, 2026-11-04).
- Reachable through itastack MCP (checked 2026-11-04, read-only): Halo (tickets, actions, appointments including `find_free_slot`, ticket email), M365 (tenant `ita`, among others), 3CX (tenant `ita`), Exchange (tenant `omep` only). Whether M365 reads James's own mailbox, and what 3CX exposes for call logs, is not yet verified. The Slack bot's scopes include channel history, join and DMs (`im:history`).

## Related

- [dsh-superagent Test Install on wsl](memory/docs/workstation/dsh-superagent-test.md): the install, the Slack app, the fork branch and the James-only scope.
