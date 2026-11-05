---
title: dsh ssh-workspace picker patch
summary: Local patch for the ssh-workspace Add-workspace Local option; verify served dsh plugin clients via the plugins/ rev URL, not the bare ?? path.
type: doc
status: promoted
created: 2026-11-04
updated: 2026-11-04
topics: [workstation]
---

## Active memory

- The `@shiqyka/dsh-ssh-workspace` plugin's Add-workspace "Local" option called the native folder picker, which this dsh never mounts (caddy's non-loopback `trustedHosts` forces "browse"), failing with "directoryPicker.pick needs the native capability". The local patch hands Local to dsh's own occupant flow (native or browse) when one exists. Patched file: `~/.dsh/profiles/superagent/node_modules/@shiqyka/dsh-ssh-workspace/lib/client.js`, marker comment `ponytail: local patch`. Original + diff backup: `~/.dsh/backup-ssh-workspace-picker-20261104-164519/` (2026-11-04). A plugin reinstall/upgrade overwrites the patch — reapply from the diff, same caveat as the fixed-token patch.
- Verifying dsh serves a patched plugin client: restart dsh first, then log in (token from the newest `~/src/dsh-superagent/.artifacts/dsh-superagent-superagent-*.log`, or the permanent login URL), fetch `/` and extract the `plugins/...&rev=<hash>` URLs from the page HTML. The bare `/??<pkg>/client.js` path returns the app-shell HTML, not the plugin code. Fetch the rev URL and grep for the patch marker: plugin bundles are served unminified, so comments survive. Login answers 303 and needs a cookie jar.
- Verified 2026-11-04 after `dsh-superagent restart`: both the individual client URL and the grouped 20-plugin bundle served the marker.

## Related

- [dsh Permanent Browser Login](memory/docs/workstation/dsh-browser-login.md) - another local dsh patch with the same reapply-after-upgrade caveat.
- [dsh restarts go through herdr-handoff](memory/preferences/dsh-restart-via-herdr.md) - never restart dsh from inside a dsh session.
- [dsh-superagent Test Install on wsl](memory/docs/workstation/dsh-superagent-test.md)
