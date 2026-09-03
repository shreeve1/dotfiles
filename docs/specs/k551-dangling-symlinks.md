# k551 — Remove the 31 dangling symlinks and the dead install loop that makes them

**Goal:** Thirty-one symlinks under `$HOME` point into this repo at paths that no
longer exist. When this spec is delivered, `install.sh` no longer declares links
it cannot create, a repeatable `bin/prune-dead-links` removes the residue on any
machine this repo syncs to, and a fresh `find` for dangling repo-pointing links
under `$HOME` returns nothing.

**Repo:** /home/james/dotfiles   **Branch:** auto/k551

```yaml
gate:
  cwd:  .
  argv: [./check.sh]
```

## Background — the two clusters, and why the gate is silent about them

**Cluster A — 18 links under `~/.codex/skills/`.** `install.sh` loops over
`"$DOTFILES_DIR"/.codex/skills/*` and calls `link_path` for each entry, but
`.codex/skills/` does not exist in this repo. Commit `506f4c7` ("Archive Codex
skills and update dotfiles", 2026-06-20) moved all 17 of those skills to
`.codex/archive/`; the loop was left behind. The 18th link, `to-issues`, was
retired separately and now lives at `.claude/archive/to-issues`. The retirement
was deliberate, so this spec deletes the loop rather than restoring the skills —
the skills remain readable under `.codex/archive/`.

Two further links in that directory, `orca-cli` and `orchestration`, point at
`~/.agents/skills/` and resolve correctly. They are not created by this repo and
must survive.

**Cluster B — 13 links, install residue.** Ten sit inside
`~/.config/opencode-bak-20260509T233610Z/`, a backup directory `link_path`
created on 2026-05-09 (`install.sh` backs a target up as `$target-bak-$stamp`
before replacing it). The remaining three are `~/.config/nushell`,
`~/.pi/agent-sessions` and `~/AGENTS.md`. All thirteen point at repo paths that
have since been removed, and `install.sh` no longer declares any of them.

`check.sh` deliberately does **not** report any of this. Its dangling-link check
is scoped to the mappings `install.sh` declares *today*, so that a gate fails for
the change under test and not for ambient residue predating it. That scoping is
correct and **this spec does not change it** — which is why the gate cannot serve
as this item's acceptance command, and the item brings its own.

## Items

### 1. Delete the dead `.codex/skills` loop and add `bin/prune-dead-links`

**Delivers:** `install.sh` stops declaring links to `.codex/skills/*`, a
directory this repo does not contain, so a fresh `bash install.sh` no longer
recreates the 18 Cluster A links. A new `bin/prune-dead-links` deletes symlinks
under `$HOME` that point **into this repo** and do not resolve, clearing all 31
and leaving every other broken link alone. Because the loop is gone first, the
cleanup is permanent rather than undone by the next install.

**Blocked by:** none.

```yaml
survey:                       # exit 0 once the script exists and is executable
  cwd:  .
  argv: [test, -x, bin/prune-dead-links]
acceptance:                   # exit 0 when no repo-pointing dangling link remains
  cwd:  .
  argv: [bin/prune-dead-links, --check]
scope:
  writes:   [install.sh, bin/prune-dead-links]
  protects: [check.sh, .codex/archive/, .claude/archive/, .config/]
```

**Notes:**

`bin/prune-dead-links` is **(new)** — it does not exist yet, and neither does the
`--check` flag its acceptance command names. Everything else referenced here
exists today.

*The loop.* It is the seven-line `for skill_dir in "$DOTFILES_DIR"/.codex/skills/*`
block immediately after the four `link_path ".codex/..."` calls in the Codex
section. There is exactly one occurrence of `for skill_dir in` in the file
(verified). Leave the four `link_path` calls above it alone — `config.toml`,
`AGENTS.md`, `hooks.json` and `rules` all exist and resolve. Deleting the loop is
not covered by the acceptance command (it would only show up on a re-install);
it is a diff-level change for Review to confirm.

*The script, and the safety rule that matters most:* **delete a symlink only when
`readlink` resolves it into `$DOTFILES_DIR` and the target does not exist.** A
broken link pointing anywhere else is not this repo's residue.
`~/.claude/debug/latest`, `~/.config/google-chrome/SingletonLock`,
`~/.config/orca/SingletonLock` and `~/.config/pulse/*-runtime` are broken by
design — lock and rotation pointers owned by other programs — and deleting them
is out of scope, as is anything resolving into `~/.agents/skills/`.

`--check` reports without deleting and exits non-zero if any repo-pointing
dangling link remains; bare invocation deletes and exits 0. Search depth 3 from
`$HOME`, excluding `$HOME/dotfiles` and `$HOME/.cache`, matching the reproduction
command below. Honour `DOTFILES_DIR` with the same `${DOTFILES_DIR:-$HOME/dotfiles}`
default `install.sh` uses, so the script is testable against a fixture. The
script is run from the repo like `check.sh` and is **not** linked into `$HOME`,
so it needs no `link_path` entry.

*Reproduction*, worth re-running by hand once this lands, since the gate will not:

```
find "$HOME" -maxdepth 3 -type l -not -path "$HOME/dotfiles/*" \
  -not -path "$HOME/.cache/*" -exec test ! -e {} \; -print
```

It should print only the non-repo links named above, and none pointing at
`/home/james/dotfiles/`.

## Related, deliberately not folded in

**k527** — `.claude/commands` is empty in git while `CLAUDE.md` calls it
canonical — is the same class of defect (a declared surface that does not exist)
and is unresolved pending a user decision. It is a separate card and stays separate.
