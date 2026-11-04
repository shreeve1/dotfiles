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
- Team boundary: superagent must not bother the team. It watches project channels silently and replies only in `#ai-james`. It works only on James's projects: the assigned technician shows in Halo and in each project's Slack channel. All projects are currently James's, but a project may be assigned to a teammate.
- Project channels follow names such as `#rce---network-modernization-2026` and `#cpti-bss-transition-2026` (mostly public). James approved Nathan joining them (Slack shows one "joined" message).
- Autonomy: everything is a draft to start (client emails, Halo updates, appointments). James's existing instructions in `~/Documents/itastack` (`AGENTS.md`, `memory/rules.md`, including the email and Halo client-reply drafting row) define how drafts are made; superagent should follow those, not new rules.
- Reachable through itastack MCP (checked 2026-11-04, read-only): Halo (tickets, actions, appointments including `find_free_slot`, ticket email), M365 (tenant `ita`, among others), 3CX (tenant `ita`), Exchange (tenant `omep` only). Whether M365 reads James's own mailbox, and what 3CX exposes for call logs, is not yet verified. The Slack bot's scopes include channel history, join and DMs (`im:history`).

## Related

- [dsh-superagent Test Install on wsl](memory/docs/workstation/dsh-superagent-test.md): the install, the Slack app, the fork branch and the James-only scope.
