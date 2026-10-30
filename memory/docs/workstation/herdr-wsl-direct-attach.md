---
title: Herdr WSL Direct Attach Workaround
summary: On wrk, direct WSL herdr attachment stayed stable for two hours after native Windows herdr repeatedly timed out its WSL SSH endpoint.
type: doc
status: promoted
created: 2026-10-30
updated: 2026-10-30
topics: [workstation]
---

## Active memory

On wrk, native Windows herdr 0.9.5 repeatedly logged `endpoint health check timed out` for its `wsl` saved machine (`wsl-wrk`, `127.0.0.1:2222`), then reconnected in roughly 2–3 seconds. WSL's herdr server had no restarts.

Workaround from a Windows Terminal PowerShell tab:

```powershell
wsl.exe -d Ubuntu-24.04 -- /home/james/.local/bin/herdr
```

This attaches directly to the existing WSL server without stopping panes. On 2026-10-30, follow-up showed the same main client connected for about two hours with no disconnect or health-check failure. Short-lived terminal attach/observe helper connections are separate from the main client.

This narrows the failure to the native Windows client/SSH bridge path; it does not establish the underlying cause. Do not treat WSL or herdr server restarts as the fix.

## Related

- [wrk WSL port exposure](memory/docs/workstation/wrk-wsl-port-exposure.md) documents the Windows-to-WSL IPv4 addressing used by the SSH endpoint.
