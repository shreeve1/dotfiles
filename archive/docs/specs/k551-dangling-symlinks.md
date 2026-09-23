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
acceptance:                   # exit 0 when the path-safety fixtures all pass
  cwd:  .
  argv: [bin/prune-dead-links, --selftest]
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

*Comparing the target to `$DOTFILES_DIR` as text does not implement the safety
rule*, in either direction — both reproduced on fixtures:

- `$DOTFILES_DIR/../outside/missing` matches the prefix textually while resolving
  **outside** the repo, and would be deleted.
- a relative target such as `../dotfiles/gone` resolves **inside** the repo but
  never matches the prefix, so real residue would survive.

Canonicalize both sides before comparing. **Do not reach for `realpath -m` or
`readlink -f`:** this repo syncs to a Mac, where BSD `realpath` has no `-m`, and
`readlink -f` rejects a path that does not exist (which is every path this script
cares about). Walk up to the deepest existing ancestor, resolve it with `cd -P`
and `pwd -P` — POSIX, present everywhere, and safe on macOS's bash 3.2 — then
re-attach the missing remainder. `-P` is load-bearing: plain `cd` resolves `..`
logically, so an escape through an intermediate symlink still looks
repo-internal. A target whose missing remainder still contains `..` cannot be
resolved and must be **skipped, never deleted** — refusing to classify is the
safe answer ahead of an `rm`.

macOS ships bash **3.2.57** as `/bin/bash`, so the script must parse and run
there: no `mapfile`/`readarray`, no `declare -A`, no `local -n`, no `${var^}`
case modification, no `&>>`, no `;;&`, no globstar, no `printf -v`. Note that
`BASH_COMPAT=32` on a modern bash is **not** evidence of this — it adjusts
runtime semantics but still parses 4.x-only syntax (`bash -n` accepts `mapfile`
under it). Test against a real 3.2 interpreter; `docker run --rm bash:3.2` is
enough and is what this item used.

`--selftest` is the acceptance command because it is the only check that runs
identically on both machines. It covers absolute residue and relative residue
(must be pruned), and dotdot-escape, symlink-escape, foreign, resolving and
excluded-path links (must survive). Run it on every supported OS. `--check`
inspects the live `$HOME` and so cannot serve as acceptance: it reports the
machine's residue, not the code's correctness, and stays non-zero until the
pruner has been run bare once on that machine.

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
