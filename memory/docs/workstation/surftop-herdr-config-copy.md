---
title: Surftop's herdr config is a manual copy
summary: surftop gets no herdr symlink: its config.toml is a real file that drifts, so re-copy it from home/herdr/config.toml after repo changes.
type: doc
status: promoted
created: 2026-10-31
updated: 2026-10-31
topics: [workstation]
---

## Active memory

- `install.sh` symlinks `home/herdr/config.toml` to `~/.config/herdr/config.toml` (line 205) on the Linux machines only. The Windows installer does not touch herdr, so surftop's copy at `C:\Users\james\.config\herdr\config.toml` is a real file: every repo change to `home/herdr/config.toml` must be copied over by hand.
- Sync loop from a Linux machine, over NetBird (`james@100.95.222.42`, intermittently flaky; retry):
  - `scp james@100.95.222.42:.config/herdr/config.toml /tmp/surftop-config.toml` and `diff` it against `home/herdr/config.toml` first. Copy the whole file only when the only difference is the change you mean to bring; otherwise edit surgically so machine-specific lines survive.
  - Back up first on surftop: `copy "C:\Users\james\.config\herdr\config.toml" "C:\Users\james\.config\herdr\config.toml-bak-<UTCstamp>"` (same naming as `install.sh`).
  - Push with `scp home/herdr/config.toml james@100.95.222.42:.config/herdr/config.toml`, scp it back and `diff` or `md5sum` both: identical hashes is the proof.
- surftop's ssh shell is cmd.exe: no pipes or `head`, git only at `"C:\Program Files\Git\cmd\git.exe"`. `scp` with a relative path resolves against `C:\Users\james`.
- Verify the parse, not just the bytes: `ssh james@100.95.222.42 'herdr config check'` prints `config: ok`.
- herdr reads its config at client start: a running `herdr.exe` on surftop keeps the old settings until it is restarted. Don't restart it from a session; it takes James's panes with it.
- Last sync 2026-10-31: brought `host_cursor = "native"` and left the two files byte-identical.

## Related

- [Herdr Projects Board Removed](memory/decisions/workstation/decision-herdr-projects-removed.md): the same per-machine drift, for a removal.
- `docs/herdr.md` "Synced": which herdr files are symlinked, seeded or machine-local by design.
