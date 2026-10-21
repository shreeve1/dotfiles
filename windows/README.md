# How I like Windows

This folder is my Windows standard: the setup, preferences and plumbing any
Windows machine of mine should match, and the rules for backing up the
config into this public repo.

## Principles

- **The keyboard is mine, not the vendor's** — CapsLock is Ctrl, done at the
  registry level so it works everywhere with no helper app.
- **Terminal-first** — PowerShell 7 with Oh My Posh, PSReadLine predictions,
  Windows Terminal sized 120×35.
- **Linux work lives in WSL2** — agents, dev tools and project files in
  Ubuntu; Windows stays for games, browser and desktop apps.
- **Machines reach each other over a private mesh** — no port-forwarding on
  routers, no public endpoints. Access secrets (mesh setup keys, unattended
  passwords, SSH keys) are always machine-local.
- **Minimal resident cruft** — no RMM agents, no bundled updaters I didn't
  choose; remote access is one tool plus the mesh.
- **Config worth keeping is committed here** — public-safe only, with a
  deliberate never-commit list.

## Files

- `setup-new-machine.md` — the standard, phase by phase, with pass checks and
  every trap learned the hard way.
- `config-backup.md` — what's captured, what must NEVER be committed, and the
  capture/restore commands.

## Public-repo safety, short version

**Safe:** program settings without identity or history (PowerToys, Terminal,
  PS profiles), the WSL plumbing files, the CapsLock→Ctrl registry snippet,
  the codex provider block (URL placeholdered).

**Never:** SSH keys / `authorized_keys`, RustDesk config (machine identity +
  password material), `AutoComplete.ahk` as-is (contains personal email and
  home address), PowerToys MRU/query history, any API key or setup key.

Private endpoints appear as placeholders here. See `config-backup.md` →
"Address policy" before committing anything with real internal addresses.
