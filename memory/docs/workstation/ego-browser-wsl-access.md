---
title: Ego Browser Skill Removed; WSL CLI Access
summary: Ego browser skill removed from all four active environments; browser apps remain installed and their updates may recreate skill links.
type: doc
status: promoted
created: 2026-11-04
updated: 2026-11-04
topics: [workstation]
---

## Active memory

James requested removal of the `ego-browser` skill from all systems on 2026-11-04. Removed and verified absent from agent skill locations on wrk WSL, wrk Windows, itan8n and surftop. Do not reinstall the skill without his request.

- Deleted the Linux skill directories; removed Windows skill junctions from the shared agents/Claude location, pi and OpenCode without deleting their targets.
- Ego browser applications, bundled skill files and browser data were not removed. Ego manages its skill links, so a later application update may recreate them.
- Active pi sessions need `/reload` or a restart to refresh skill discovery.
- On surftop, the bundled `ego-skills` junction could not be traversed over SSH (untrusted mount point). Verification through its direct version directory succeeded; that error did not indicate deleted bundle files.

### Existing CLI access

Verified on wrk from WSL on 2026-11-04:

- Ego Lite is installed and running on Windows at `C:/Program Files/Citro Labs/ego lite/Application/ego.exe`.
- The bundled CLI was `/mnt/c/Program Files/Citro Labs/ego lite/Application/0.6.2.7/ego-browser.exe`. The version directory can change on upgrade; locate `ego-browser.exe` under the application directory rather than assuming this version.
- `ego-browser` was absent from the WSL PATH and Windows `Get-Command`, but invoking the full executable path from WSL worked. No SSH connection or installation was needed.
- That executable's `skill` command printed the complete Windows v2.2.0 usage guide; this does not require reinstalling the removed agent skill.
- A read-only `nodejs -e 'const spaces = await listTaskSpaces(); console.log(JSON.stringify({ connected: true, taskSpaceCount: spaces.length }));'` call succeeded without opening or changing tabs.

## Related

- [Remote agent servers](memory/docs/workstation/remote-agent-servers.md): direct Windows command access from WSL is separate from the stopped remote agent servers.
