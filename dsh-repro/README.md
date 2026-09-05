# dsh-repro — captured portable dsh web profile

Snapshot of the live `~/.dsh/profiles/web` manifest, made portable for a
reproducible install on another machine. Captured by this session.

## Files
- `profiles/web/package.json` — plugin manifest. The 5 local plugins are pinned
  to `github:shreeve1/<name>#<sha>` (built `lib/` committed in each repo).
- `profiles/web/pnpm-lock.yaml` — frozen dependency graph.
- `profiles/web/pnpm-workspace.yaml` — `allowBuilds` (incl. the 5 pinned repos),
  `patchedDependencies`, `minimumReleaseAgeExclude`.
- `profiles/web/cordis.patch.yml` — per-machine config; STILL contains this box's
  IP/paths. Template it (`__HOME__`, `__LISTEN_IP__`) before use elsewhere.
- `profiles/web/patches/dsh-full-remote.patch` — pnpm patch (install fails without it).

## Install path (DOCUMENTED POLICY — verified this session)
Install with:

    pnpm install --frozen-lockfile --ignore-scripts

`--ignore-scripts` is REQUIRED, not optional: the 5 shreeve1 plugins ship a
prebuilt `lib/`, so a fresh machine installs WITHOUT a build toolchain, and the
unpinned third-party plugins that would otherwise try (and can fail) to build
are skipped. Verified this session end-to-end: the FULL captured manifest (28
deps) completes `pnpm install --frozen-lockfile --ignore-scripts` with exit 0
and all 5 pinned entrypoints resolve to a valid `main` (fusion/council/
learn-panel/goal-keeper `lib/index.js`, build-board `index.js`).

Do NOT run a plain `pnpm install --frozen-lockfile` (without --ignore-scripts):
unpinned third-party specs (e.g. dsh-plugin-guide) trigger a git-prepare build
that needs its own allowBuilds entry and can fail in the pnpm sandbox.

## Known caveats (verified, not yet resolved)
1. **dsh-ui-translate is REMOVED** from this manifest. It is third-party
   (RadicalGitter), commits no `lib/`, and its `prepare` build fails in pnpm's
   git-prepare sandbox. Add it back manually after install, or fork it to
   shreeve1 with committed `lib/`. It was in the live profile's bundles.
2. **Other unpinned `github:` specs still drift.** Several third-party plugins
   (e.g. dsh-plugin-guide, dsh-md-annotator) use unpinned `github:` specs; a
   fresh lockfile resolves them to current HEAD, and some need their own
   `allowBuilds` entry (the lockfile pins them, but regenerating re-drifts).
   Pin them to SHAs for full reproducibility — that is spec k881 item 2+.
3. **Building-from-source of the 3 tsdown plugins (fusion/council/learn-panel)
   can fail** in the pnpm sandbox (missing devDeps). Use `--ignore-scripts` and
   the committed `lib/`; do not rely on their `prepare`.

## Reproduce from scratch

On a fresh machine with this dotfiles repo checked out:

    dsh-repro/install-dsh.sh <listen-ip>

`<listen-ip>` is the IP `dsh-full-remote` will listen on (e.g. your netbird
tailnet IP, or `127.0.0.1` for a localhost-only install). The script installs
pinned `@deepseek-ai/dsh` globally, copies the captured profile into
`~/.dsh/profiles/web/`, renders `cordis.patch.yml` from
`profiles/web/cordis.patch.yml.tmpl` (`__HOME__`, `__LISTEN_IP__` filled),
generates a self-signed TLS cert with `SAN=IP:<listen-ip>`, installs and
enables `dsh-web.service` from `systemd/dsh-web.service.tmpl`, and prints the
reverse-proxy token.

Secrets NOT in git: `~/.dsh/dsh-web.env` (env vars: `CLIPROXY_API_KEY`,
`DEEPSEEK_API_KEY`) and `~/.dsh/.credentials.yaml` (provider API keys). The
script stops with a clear message listing which keys are missing — create them
manually, then re-run.

Dry-run mode (no writes outside `$(mktemp -d)`, no `systemctl`, no global npm
install):

    dsh-repro/install-dsh.sh --dry-run 127.0.0.1

Asserts `dsh --profile web --dump-config` exits 0 against the throwaway
profile — proves the manifest + lockfile + cordis patch compose before the
real install.

## Verification status (be precise — do not overclaim)

Tested in this workspace:
- **Steps 1–5 (binary present, profile copy, frozen `pnpm install
  --ignore-scripts`, cordis render, `--dump-config` compose):** VERIFIED via
  `--dry-run` — exit 0, 294 packages, all 5 pinned entrypoints resolve.
- **Step 6 (TLS cert):** VERIFIED in isolation after fixing a real bug — the
  openssl `[req]` config named the DN section `req` instead of
  `req_distinguished_name`, so on OpenSSL 3.x every real install failed with
  `invalid field name: distinguished_name` (exit 1). Fixed; corrected config
  now emits a cert with `SAN=IP:<listen-ip>`.
- **Step 7 (secrets gate):** VERIFIED — stops when `dsh-web.env` /
  `.credentials.yaml` are absent, proceeds when present.

NOT yet executed anywhere (verify on the target, once):
- **Steps 8–9 (systemd `enable`/`restart` of `dsh-web.service`, token print).**
  Not run here on purpose: restarting the live `dsh-web.service` severs the
  running agent session (see `docs/deepseek-harness.md` root-cause note). These
  paths are unproven — expect to shake them out on the first real fresh-machine
  run.
- The whole script has **never run on a genuinely fresh machine** (no dsh, no
  pnpm store, different `$HOME`). `--dry-run` proves the plugin/profile half on
  an already-set-up box only.

## Re-capture

After adding, removing, or upgrading a plugin on the live box, the committed
manifest must be re-pinned:

    dsh-repro/capture.sh

Copies the latest `~/.dsh/plugin-snapshots/<ts>/web/` files into
`profiles/web/`, re-templates `cordis.patch.yml.tmpl`, and prints a warning if
`package.json` still contains `/home/james` paths or `file:`/`link:` specs (a
local plugin must be re-pinned to a `github:shreeve1/<name>#<sha>` spec per
k881 item 1 before the portability rewrite is a no-op). Run
`probes/manifest-portable.sh` and `probes/manifest-resolves.sh` before
committing the re-capture.
