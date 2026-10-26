---
title: wrk WSL Port Exposure
summary: A WSL server bound to 0.0.0.0 on wrk is reachable from NetBird peers but not the LAN; Windows tools must use 127.0.0.1, not localhost.
type: doc
status: promoted
created: 2026-10-26
updated: 2026-10-26
topics: []
---

## Active memory

wrk runs WSL2 with `networkingMode=mirrored`; the Hyper-V VM firewall is on with inbound Block. Measured 2026-10-26 with test listeners on ports 19432 and 19439:

- **NetBird peers reach it.** A WSL server bound to `0.0.0.0` answers at `http://100.95.235.60:<port>` from aidev with no firewall rule added. NetBird runs on the Windows side (`wt0`), which carries the traffic into WSL.
- **The LAN does not.** The same port at wrk's LAN address (`10.20.20.176`) times out from aidev and from Windows itself. So servers on wrk that listen on all addresses are NetBird-only in practice; the Hyper-V firewall is what limits them, not the app.
- **Windows to WSL:** use `127.0.0.1:<port>`. `localhost` works in Chrome but timed out in PowerShell `Invoke-WebRequest`. Windows can't reach a WSL listener through wrk's own NetBird IP either.

If a peer can't reach a WSL port, check first whether the server bound `127.0.0.1` instead of `0.0.0.0` (`ss -ltn`).

## Related

- Machine IPs and ssh users: dotfiles `AGENTS.md` "Machine topology".
- Shares the WSL networking context of [pi footer git polling](memory/docs/pi-footer-git-polling.md): both are about wrk's WSL-Windows bridge.
