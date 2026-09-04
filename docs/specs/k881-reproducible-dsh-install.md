# k881 — Reproducible dsh install with full plugin set

**Goal:** From a fresh machine with this dotfiles repo checked out, a single
scripted command installs the DeepSeek Harness and the exact same plugin set
this box runs, boots it as a remote-accessible headless server (TLS + token,
per the `dsh-full-remote` stack), and leaves a working `dsh-web.service`. The
plugin manifest, lockfile, patches, and local-plugin provenance are all
version-controlled; nothing load-bearing exists only as live state under
`~/.dsh`. Machine-specific values (listen IP, `$HOME`, TLS cert, token) are
rendered per-host at install time, never cloned.

**Repo:** /home/james/dotfiles   **Branch:** auto/k881

```yaml
gate:
  cwd:  .
  argv: [bash, check.sh]
```

## Context established in this session (not to be re-derived)

- dsh has **no native profile export**; reproducibility must live in dotfiles.
- The plugin set is defined by 5 profile files dsh already auto-snapshots to
  `~/.dsh/plugin-snapshots/<ts>/web/`: `package.json`, `pnpm-lock.yaml`,
  `pnpm-workspace.yaml`, `cordis.patch.yml`, `manifest.json` — **plus** the
  `patches/dsh-full-remote.patch` file (install hard-fails without it).
- The manifest's `dependencies` hardcodes `/home/james` paths for 6 local
  plugins (`dsh-fusion`, `dsh-council`, `dsh-learn-panel`, `dsh-goal-keeper`,
  `dsh-ui-translate`, `dsh-build-board`) — these break any fresh install and
  must be rewritten to a portable form.
- Q2 decision (user): **create GitHub remotes** (`shreeve1/*`, `gh` is authed
  over SSH) for the 3 remote-less local plugins, and rewrite all 6 local specs
  to `github:` specs. NOT vendored into dotfiles.
- Q3 decision (user): the **remote-access server layer is required every time**
  (headless is the normal mode) — templated per-host, not opt-in.
- Confirmed tradeoff of Q2: the 3 remote-less plugins do not commit `lib/` and
  have a `prepare` build (`dsh-fusion`/`dsh-council` = `tsdown`, `dsh-learn-panel`
  = `npm run build`), so a `github:` install **builds on the target machine** and
  each needs an `allowBuilds` entry. This is more fragile than the current
  prebuilt-`lib/` `file:` install and is the reason item 1 exists.
- `dsh-council` has **no commits yet** (empty HEAD, 17 dirty files) and
  `dsh-mini-advisor` (the `dsh-goal-keeper` source) has 16 uncommitted files —
  both must be committed before a `github:` pin can capture the running code.

## Items

### 1. Publish the 3 remote-less local plugins to GitHub remotes

**Delivers:** `dsh-fusion`, `dsh-council`, `dsh-learn-panel` each have a
`shreeve1/<name>` GitHub remote whose `master` HEAD contains the exact source
currently running on this box, committed clean (no dirty tree). `dsh-council`,
which has no commits, gets an initial commit first.

**Blocked by:** none.

```yaml
survey:                       # exit 0 = all three sources have an origin remote
  cwd:  .
  argv: [bash, dsh-repro/probes/remotes-exist.sh]
acceptance:                   # exit 0 = remotes exist AND local HEAD is pushed (no unpushed/dirty)
  cwd:  .
  argv: [bash, dsh-repro/probes/remotes-synced.sh]
scope:
  writes:   [dsh-repro/probes/remotes-exist.sh (new), dsh-repro/probes/remotes-synced.sh (new)]
  protects: [install.sh, check.sh, .dsh/]
```

**Notes:** The sources live OUTSIDE this repo (`~/.dsh/plugins-src/dsh-fusion`,
`~/.dsh/plugins-src/dsh-council`, `~/.dsh/plugins-src/dsh-learn-panel`). The
probes read their git state via `git -C <abs-path>`; they do not require the
source dirs to be inside dotfiles. Use `gh repo create shreeve1/<name>
--private --source <dir> --push`. Commit `dsh-council` first (`git -C
… add -A && commit`). Do not force-push or rewrite history on the two plugins
that already have commits.

### 2. Capture the portable profile manifest into dotfiles

**Delivers:** `dsh-repro/profiles/web/` in dotfiles holds `package.json` (with
all 6 local specs rewritten to pinned `github:shreeve1/<name>#<sha>` /
existing-remote specs), `pnpm-lock.yaml` (regenerated to match), 
`pnpm-workspace.yaml` (with `allowBuilds` for the newly-github plugins that
build via `prepare`), `cordis.patch.yml.tmpl` (per-machine values replaced by
`__HOME__` / `__LISTEN_IP__` placeholders), and the `patches/` dir. A clean-room
`pnpm install` from this dir resolves all bundles with zero `/home/james`
literals in the dependency graph.

**Blocked by:** item 1 (the `github:` specs must point at pushed commits).

```yaml
survey:                       # exit 0 = captured manifest exists and has no /home/james in deps
  cwd:  .
  argv: [bash, dsh-repro/probes/manifest-portable.sh]
acceptance:                   # exit 0 = clean-room `pnpm install --lockfile-only` resolves from the captured dir
  cwd:  .
  argv: [bash, dsh-repro/probes/manifest-resolves.sh]
scope:
  writes:   [dsh-repro/profiles/ (new), dsh-repro/probes/manifest-portable.sh (new), dsh-repro/probes/manifest-resolves.sh (new)]
  protects: [install.sh, check.sh]
```

**Notes:** `manifest-portable.sh` greps the captured `package.json` for
`/home/james` and `file:`/`link:` and fails if any remain (except any
deliberately-kept ones, of which there should be none after the rewrite).
`manifest-resolves.sh` copies the captured dir to a temp dir and runs `pnpm
install --lockfile-only --ignore-scripts`, asserting exit 0 — the clean-room
check proven to work this session at `/tmp/dsh-repro-cleanroom`. Keep the
`minimumReleaseAgeExclude` and `patchedDependencies` entries from the live
`pnpm-workspace.yaml`.

### 3. Write `install-dsh.sh` that replays the manifest and renders per-host config

**Delivers:** `dsh-repro/install-dsh.sh <listen-ip>` on a fresh machine:
installs pinned `@deepseek-ai/dsh` globally, creates `~/.dsh/profiles/web/` from
the captured manifest, runs `pnpm install` (with the build dances the doc
records — `approve-builds`, `node-pty`), renders `cordis.patch.yml` from the
`.tmpl` with `__HOME__`/`__LISTEN_IP__` filled, generates a self-signed TLS cert
with SAN=`IP:<listen-ip>`, installs and enables `dsh-web.service`, and prints
the reverse-proxy token. Secrets (`dsh-web.env`, `.credentials.yaml`) are NOT in
git — the script stops with a clear message listing which keys the user must
supply if they are absent.

**Blocked by:** item 2.

```yaml
survey:                       # exit 0 = install script exists and passes shellcheck/bash -n
  cwd:  .
  argv: [bash, -n, dsh-repro/install-dsh.sh]
acceptance:                   # exit 0 = dry-run mode composes a rendered profile via `dsh --dump-config`
  cwd:  .
  argv: [bash, dsh-repro/probes/install-dryrun.sh]
scope:
  writes:   [dsh-repro/install-dsh.sh (new), dsh-repro/probes/install-dryrun.sh (new), dsh-repro/systemd/dsh-web.service.tmpl (new)]
  protects: [install.sh, check.sh, dsh-repro/profiles/]
```

**Notes:** `install-dryrun.sh` runs the script against a throwaway
`DSH_HOME=$(mktemp -d)` and `--listen-ip 127.0.0.1`, skips the global npm
install if dsh is already present, and asserts `dsh --profile web --dump-config`
exits 0 — the exact clean-room compose that passed this session. The script must
NOT run `systemctl restart` against the live service when in dry-run (that
severs the calling session — documented root cause in `docs/deepseek-harness.md`).

### 4. Document the reproduce-from-scratch runbook and wire the capture step

**Delivers:** `dsh-repro/README.md` states the one-command fresh-install
sequence, what is and isn't captured (secrets excluded, and why), and how to
**re-capture** after a plugin change (a `capture.sh` that copies the latest
`~/.dsh/plugin-snapshots/<ts>/web/` files into `dsh-repro/profiles/web/` and
re-runs the portability rewrite, so the committed manifest never drifts from the
live box). `docs/deepseek-harness.md` gains a short pointer to this runbook.

**Blocked by:** item 3.

```yaml
survey:                       # exit 0 = README and capture.sh exist
  cwd:  .
  argv: [test, -f, dsh-repro/README.md]
acceptance:                   # exit 0 = capture.sh is valid bash and README names the install command
  cwd:  .
  argv: [bash, dsh-repro/probes/docs-complete.sh]
scope:
  writes:   [dsh-repro/README.md (new), dsh-repro/capture.sh (new), dsh-repro/probes/docs-complete.sh (new), docs/deepseek-harness.md]
  protects: [install.sh, check.sh, dsh-repro/install-dsh.sh, dsh-repro/profiles/]
```

**Notes:** `docs-complete.sh` runs `bash -n dsh-repro/capture.sh` and greps
`dsh-repro/README.md` for `install-dsh.sh`. Keep the doc pointer short — the
runbook is the reference, `deepseek-harness.md` just links to it.
