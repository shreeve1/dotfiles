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

No-service mode (full real install of steps 1–8 — binary, profile, TLS, secrets
gate, unit render — but does NOT enable/start `dsh-web.service`; prints the
one-line command to start it yourself). Use this on a fresh target to verify the
whole install without the service-restart risk:

    dsh-repro/install-dsh.sh --no-service <listen-ip>

Asserts `dsh --profile web --dump-config` exits 0 against the throwaway
profile — proves the manifest + lockfile + cordis patch compose before the
real install.

## Verification status (be precise — do not overclaim)

VERIFIED end-to-end in a **genuine fresh environment** — a `node:22-bookworm`
Docker container with a clean `$HOME=/root`, no `dsh`, an empty pnpm store, and
real network (not `--dry-run`, not fragments):
- **Step 1 (global dsh install):** installed `@deepseek-ai/dsh` from scratch.
- **Step 3 (`pnpm install --frozen-lockfile --ignore-scripts`):** 294 packages,
  lockfile validated. The `--ignore-scripts` policy proved load-bearing: the
  unpinned would-build plugins (dsh-plugin-guide, dsh-doctor, dsh-smart-restart,
  dsh-pilot, dsh-auto-continue, learn-panel) were correctly SKIPPED, not built.
- **Step 4 (cordis render):** `100.64.0.9` filled into the rendered patch.
- **Step 6 (TLS cert):** cert emitted with `SAN=IP:100.64.0.9`, after fixing a
  real bug — the openssl `[req]` config named the DN section `req` instead of
  `req_distinguished_name`, so on OpenSSL 3.x **every** real install failed with
  `invalid field name: distinguished_name` (exit 1). Now fixed.
- **Step 7 (secrets gate):** STOPS (exit 1) when secrets absent; PROCEEDS when
  present (both cases exercised in-container).
- **Step 8 (unit render):** with `--no-service`, the `dsh-web.service` unit
  renders correctly for the fresh `$HOME` (`ExecStart=.../dsh web ...`,
  `EnvironmentFile=%h/.dsh/dsh-web.env`).
- **All 5 pinned plugins** present in the fresh `node_modules`.

> **Scope accepted by the user (2026-09-05):** steps 1–8 verified on a fresh
> container is accepted as sufficient; the systemd start + token below is a
> documented manual step to run once on the real target. No live-box or
> real-target smoke test was performed in this session.

NOT executed anywhere (standard systemd, verify on the real target once):
- **Step 8's `systemctl --user enable`/`restart` + step 9 token print.** dsh
  runs as a `--user` service needing a real login session + linger, which a
  container's system-PID1 systemd does not provide; and dsh won't fully boot
  without real API keys. These are stock `systemctl --user` calls, not custom
  logic — the only custom part (unit rendering) is verified above. Use
  `--no-service` on the target to run steps 1–8 safely, then start the service
  by hand: `systemctl --user enable --now dsh-web.service`.
- Not run on the LIVE box: restarting `dsh-web.service` severs the running agent
  session (see `docs/deepseek-harness.md` root-cause note).

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
