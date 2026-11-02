---
title: Team Computer GitHub SSH
summary: Use the mounted SSH configuration for the github-personal alias; check clone-specific hooks.
type: doc
status: promoted
created: 2026-11-02
updated: 2026-11-02
topics: [workstation]
---

## GitHub access from the Team Computer

The github-personal SSH alias is configured under /srv/ssh, not the default ~/.ssh. For Git commands use:

    GIT_SSH_COMMAND="ssh -F /srv/ssh/config -i /srv/ssh/id_ed25519_github_personal -o IdentitiesOnly=yes -o UserKnownHostsFile=/srv/ssh/known_hosts" git <command>

The mount contains private credentials; never copy their contents into the repo or logs. This clone had no core.hooksPath or installed pre-push hook when checked on 2026-11-02. Hooks are clone-specific: inspect the effective hook configuration and actual hook before assuming a pre-push check runs; run the full suite independently before pushing.
