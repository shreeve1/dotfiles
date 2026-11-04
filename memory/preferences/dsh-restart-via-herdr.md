---
title: dsh restarts go through herdr-handoff
summary: From inside a dsh session, hand a dsh restart (e.g. after a plugin install) to a herdr-handoff task so the console isn't left hanging.
type: preference
status: promoted
created: 2026-11-04
updated: 2026-11-04
topics: [workstation]
---

## Active memory

- When working in a dsh session and a change (such as installing a dsh plugin) needs dsh restarted, don't restart it from that session. Hand the restart to a herdr task via the `herdr-handoff` skill (`task` mode). The task runs the restart, checks the service came back and reports back. (James, 2026-11-04.)
- Why: restarting dsh kills the session asking for it mid-turn. On 2026-11-04 a turn ended "Task stopped: the DSH process exited", and James had to type "continue".
- First check whether a restart is needed: client-only plugins can load on a page reload. `@clxzl/dsh-mobile-adapt` did.
- superagent's restart command: `~/src/dsh-superagent/scripts/dsh-superagent restart`. Exit 0 means running; 3 means waiting for setup.

## Related

- [dsh-superagent Test Install on wsl](memory/docs/workstation/dsh-superagent-test.md) - the dsh profile this applies to.
- [Herdr two-way collaboration](memory/preferences/herdr-two-way-collaboration.md) - how herdr task tabs report back.
