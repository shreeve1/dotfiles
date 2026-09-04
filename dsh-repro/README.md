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

## Install path (verified this session)
Run `pnpm install --ignore-scripts` in the profile dir. The 5 shreeve1 plugins
ship a prebuilt `lib/`, so a fresh machine installs WITHOUT a build toolchain.
Verified: all 5 install with a valid `main` entry under `--ignore-scripts`.

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
