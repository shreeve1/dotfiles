---
title: Stale Docs Can Be Fixed Without Asking
summary: Agents may fix stale doc text (retired machine, stopped service, old path) after checking live state; code, config or unverifiable truth still needs James.
type: decision
status: promoted
created: 2026-11-01
updated: 2026-11-02
topics: [workstation]
---

## Decision

James approved this team-wide rule on 2026-11-01 (17:10 and 17:21 PT; relayed by Chief): an agent may fix stale docs without asking him first.

- **Stale** means text about something retired, removed or no longer true: a decommissioned machine, a service no longer running, an old path.
- Check the live state first and write what is true now. Delete a section only when the thing it describes is gone.
- Then follow the repo's rules: commit only the files you changed, by exact path, and run `bash tests/run-all.sh`. Pushing, and `git pull --ff-only` on the other machines, need James's OK first (show him the diff).
- Tell James afterwards what changed.

Still ask James first when:

- the current truth can't be verified;
- the change touches code, config or anything a machine runs;
- it deletes anything other than doc text.

## Related

- Changed 2026-11-02 (James via Chief): the push step was removed; every push needs James's OK.
- [Dotfiles Git Sync](memory/docs/workstation/dotfiles-git-sync.md): how commits reach the other machines.
