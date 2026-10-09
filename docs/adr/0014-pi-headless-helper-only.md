# 0014 — Pi is a headless helper; its interactive extensions are excluded

**Status:** Accepted (2026-10-09)

## Context

Pi is used as a worker/reviewer/checker behind other harnesses, not as the
interactive coding tool. Every helper call site already passes
`--no-extensions` and adds only explicit `-e` paths: `bin/pi-delegate`
(`:62-63`), `bin/gralph` (worker `:530`, review `:641`), and the verify command
in `.agents/skills/_shared/verify-claims.md`. Saved Pi sessions since
2026-09-01 (10) called only `read` (19) and `bash` (8); no extension tool was
used. Pi auto-discovers `~/.pi/agent/extensions/*/index.ts` regardless of the
`extensions`/`packages` settings lists, so removing list entries alone does not
unload anything.

## Decision

- `.pi/agent/settings.json` (live, gitignored) and `settings.json.template`
  (tracked seed): `packages: []`, and `extensions` holds an exact-file `-path`
  exclusion for every discovered extension entry point. Directory-level
  exclusions did not work (tested: `web-fetch` and `rpiv-web-tools` both still
  loaded and collided on `web_fetch`); exact entry files do.
- A plain `pi` now loads built-in tools only: `bash`, `edit`, `read`, `write`.
- Files stay on disk. `pi-delegate` still reads personas from
  `extensions/pi-subagents/agents/<role>.md` and still loads
  `rpiv-web-tools` for the researcher role through an explicit `-e`, which
  works even though that file is excluded.

## Consequences

- Pi Fusion, gap-review, pi-subagents, pi-lens, rpiv-*, workflows and the
  moshi/herdr integrations no longer load. ADRs 0001–0005 describe code
  that is still in the repo but inactive in Pi. omp Fusion (ADR 0006) is
  unaffected.
- A new extension dropped into `~/.pi/agent/extensions/` auto-loads until an
  exclusion line is added for its entry file.
- `bin/rralph --engine pi` (the default engine) launches a bare interactive
  `pi` and no longer gets the rpiv extensions. Not tested; use
  `--engine claude` or restore the exclusions if it breaks.
- Revert: restore the exclusion list from `settings.json.bak-20261009-helper-only`
  (or `git checkout` the template) and re-add the old `packages`.
- `.agents/bin/pi-helper-only` applies (and re-applies after a new extension is
  added) this configuration to a machine's live `~/.pi/agent/settings.json`;
  `--dry-run` previews. The template only seeds fresh installs.
