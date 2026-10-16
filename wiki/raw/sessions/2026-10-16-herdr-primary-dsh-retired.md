# Session Capture: herdr + pi is the primary agent surface; dsh retired

- Date: 2026-10-16
- Purpose: James retired DeepSeek Harness (dsh) and confirmed that pi agents in herdr panes, spread across the three machines, are how his main agents run now. AGENTS.md still named dsh as the primary surface, so every session started with a false premise.
- Scope: the retirement decision, the verified herdr topology across omarchy/aidev/itan8n, and the herdr web ui install on aidev that replaces dsh's phone/browser role.

## Durable Facts

- `dsh-web.service` was stopped and disabled on aidev and itan8n on 2026-10-16. Nothing listens on :3080 on either machine, and no dsh processes remain. Packages, `~/.dsh` and the unit files were left in place. — Evidence: `systemctl --user is-enabled dsh-web.service` → `disabled` on both
- itan8n's `a2a-tls-proxy.service` (TLS front for the dsh A2A endpoint, :8443 → :3080) was already inactive and disabled, so it was left untouched. — Evidence: `systemctl --user is-active/is-enabled a2a-tls-proxy.service`
- Each machine runs its own long-lived `herdr server` (aidev since 2026-09-21, itan8n since 2026-09-22), started by herdr itself, not systemd. Its workspaces and pi agents are local to that machine. — Evidence: `ps -C herdr`, `herdr pane list`
- Cross-machine viewing uses herdr's saved machines: a client runs `ssh -T <alias> … herdr remote-client-bridge` with `BatchMode=yes` and `StrictHostKeyChecking=yes`. The live machine lists differ per machine; the repo seed `herdr/endpoints.json` matches only omarchy's. — Evidence: `herdr machine list --json` on each machine; `docs/herdr.md`
- pi does not read `.agents/AGENTS.md`. Its user-level context file is `<agent-dir>/AGENTS.md` (`~/.pi/agent/AGENTS.md`), and none exists. pi does discover `~/.agents/skills`, and it loads project `AGENTS.md` from cwd and its parents. — Evidence: pi 1.2.0 `docs/configuration.md` § Context files, `docs/skills.md:61`; `readlink ~/.pi/agent/AGENTS.md` → missing
- herdr web ui (devswha/herdr-web-ui 0.4.11) is installed on aidev as a herdr plugin at `https://100.95.230.15:7443` over NetBird, fronted by Caddy. A raw TLS tunnel (socat) breaks sign-in with `403 Use controls from this app`: no `X-Forwarded-Proto` reaches the app, so its same-origin check fails on every browser POST. — Evidence: `docs/herdr.md` § herdr web ui on aidev; `server/machine-security.ts` `sameOrigin()` upstream
- The web ui's TLS cert is dsh's `~/.dsh/dsh-tls.{crt,key}`, so `~/.dsh` on aidev cannot be deleted wholesale. — Evidence: `~/.config/herdr-web-tls/Caddyfile` on aidev

## Decisions

- dsh is retired; pi inside herdr is the primary agent surface on all three machines. James said "I'm no longer using it" and "this is how my main agents run now". — Evidence: this session; `AGENTS.md` § Primary agent surface
- herdr web ui runs on aidev, the always-on server, rather than on the laptop. — Evidence: this session; `docs/herdr.md`

## Evidence

- `AGENTS.md` — rewritten primary-surface section, canonical-surfaces lane, topology row, browser-automation bullet
- `docs/herdr.md` — § How the three machines connect; § herdr web ui on aidev

## Exclusions

- The herdr web ui access token value and how it was read: omitted (secret).
- Pairing codes: none were generated; nothing to record.

## Open Questions And Follow-Ups

- `.agents/AGENTS.md` (global guidance) is not loaded by pi at all. Decide whether to link `~/.pi/agent/AGENTS.md` → `dotfiles/.agents/AGENTS.md` in `install.sh`. That would put its ~185 lines in every pi turn.
- `docs/deepseek-harness.md`, the `dsh-plugin-build`/`dsh-plugin-guide` skills, `README.md`'s dsh rows and `~/.dsh/AGENTS.md` links remain. Archive or delete is undecided.
- `herdr/endpoints.json` seed is omarchy-shaped; seeding it onto aidev/itan8n would add a self-entry.
