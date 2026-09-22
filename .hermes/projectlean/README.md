# projectlean — portable lean Hermes profile package

A tracked, portable, project-scoped Hermes profile. Vendors six skill
trees, a portable runtime config, a non-loaded SOUL template, a
non-loaded router template, and a Python-stdlib installer / verifier /
candidate-prep tool.

## Layout

```
.hermes/projectlean/
├── README.md
├── bin/
│   ├── install-projectlean.py        # idempotent installer
│   ├── verify-projectlean.py         # preflight + postapply + backup checks
│   └── prepare-context-candidates.py # stage router/SOUL candidates
├── templates/
│   ├── project-hermes-router.md.template
│   ├── projectlean-soul.md.template
│   └── projectlean-config.json.template
├── skills/                           # six vendored trees, byte-identical
│   ├── grill-me/
│   ├── handoff/
│   ├── hermes-agent/
│   ├── independent-reviewer/
│   ├── llm-wiki-setup/
│   └── wiki-update/
├── manifest.json                     # generated; SHA over each asset
└── tests/                            # hermetic, fake hermes CLI
```

## Public contract

- Default profile name: `projectlean`.
- Default clone source: `default`.
- CLI toolsets (enabled): `file`, `terminal`, `vision`, `skills`.
- CLI toolsets (explicitly disabled): `web`, `browser`, `code_execution`,
  `video`, `image_gen`, `video_gen`, `x_search`, `tts`, `stt`, `memory`,
  `todo`, `session_search`, `connections`, `clarify`, `delegation`,
  `cronjob`, `homeassistant`, `spotify`, `yuanbao`, `computer_use`,
  `a2a`, `kanban`, `messaging`.
- Memory: disabled (`memory_enabled=false`,
  `user_profile_enabled=false`, `provider=""`).
- Portable runtime config: matches `templates/projectlean-config.json.template`.
- Managed marker: `<profile-dir>/projectlean.managed.json`.
- Backup directory: `$XDG_STATE_HOME/hermes/projectlean/<profile>/backups/`
  (or `~/.local/state/...` when XDG is unset); use `--backup-dir` to override.
  Backup directories are mode `0700` and files mode `0600` on POSIX.

## Runbook

### 1. Preflight the package

```sh
python3 .hermes/projectlean/bin/verify-projectlean.py --mode preflight
```

Checks: manifest-backed vendored-asset integrity, portable config, SOUL
template static contract, and capability probes of the Hermes CLI
(`hermes --version` /
`prompt-size --json`) without hardcoding version, tool count, or
universe size.

### 2. Install

```sh
python3 .hermes/projectlean/bin/install-projectlean.py --profile projectlean --clone-from default --repo "$PWD"
```

Behavior:

- **No profile yet** → creates `projectlean` cloned from `default`,
  stages the six vendored skill trees, sets the portable config, and
  writes the managed marker.
- **Profile exists, not managed** → refuses; rerun with
  `--adopt-unmanaged` to back up the existing `config.yaml`, `.env`,
  `skills/`, and `SOUL.md` (timestamped, full) and then take it over.
- **Profile exists, managed** → re-applies the manifest idempotently.

Backups default to private profile state outside the package and target repo.
An explicit `--backup-dir` is accepted only when it is also outside both.

The installer never writes `SOUL.md` and never materialises
`.hermes.md` / `HERMES.md` / `AGENTS.md` / `CLAUDE.md` / `.cursorrules`.

### 3. Candidate prep

```sh
python3 .hermes/projectlean/bin/prepare-context-candidates.py --repo "$PWD"
```

Walks the project under Hermes precedence (`.hermes.md` / `HERMES.md`
upward, then `AGENTS.md` / `CLAUDE.md` / `.cursorrules` in the repo
root), stages a bounded, marked router-section merge patch (or a
recommended-target candidate if no active context exists) plus a SOUL
candidate, all under private XDG state
`$XDG_STATE_HOME/hermes/projectlean/context-candidates/<UTC-stamp>/`
(or `~/.local/state/...` when XDG is unset). Use `--output-dir` to select
another directory outside the package and repo. Existing
content is preserved; an existing marked projectlean section is left
alone. `--staging-name` may select a predictable staging subdirectory, but
only as a single 1-64 character identifier: it must start with a letter or
digit and may then contain only letters, digits, hyphens, or underscores.

### 4. Materialise the human-approved pieces

The installer prints these as manual steps on success:

1. Copy `templates/projectlean-soul.md.template` over the profile
   `SOUL.md`, after backing the live one up.
2. For no active context, after review copy the staged
   `context-preview.md` to `<repo>/.hermes.md`.
3. For an existing active context, review the staged full semantic merge in
   `context-preview.md`, then after approval back up that active file and copy
   the staged preview over the same active path. This preserves all existing
   content and appends only the bounded marker-delimited router section; it
   never creates or replaces `.hermes.md` merely because it is the default
   name. An already marked section is staged unchanged.

### 5. Post-apply verification

```sh
python3 .hermes/projectlean/bin/verify-projectlean.py --mode postapply
```

Asserts:

- managed marker present and references the source manifest;
- installed skill hashes match the vendored source hashes;
- live CLI toolsets contain exactly the approved four and none of the
  forbidden (kanban / messaging / memory / todo / delegation / cronjob
  / web / browser / ...);
- explicit disabled toolset list matches;
- exact live config values match the portable contract;
- profile `SOUL.md` byte-matches the human-installed template;
- profile skill directory set is exactly the six;
- prompt-size structure contains the approved toolsets, no forbidden
  ones, and no exact version/tool count is asserted.

### 6. Rollback

For a one-shot install:

```sh
ls "${XDG_STATE_HOME:-$HOME/.local/state}/hermes/projectlean/projectlean/backups/"
python3 .hermes/projectlean/bin/verify-projectlean.py --mode backup-check --backup /private/backup/<label>-<stamp>
```

Then restore by copying the backup tree over the profile directory.
The installer never deletes the profile itself; profile rollback is a
separate, deliberate `hermes profile delete <name>`.

## Safety constraints

- No protected file write: SOUL.md, `.hermes.md`, `HERMES.md`,
  `AGENTS.md`, `CLAUDE.md`, `.cursorrules`.
- No destructive profile delete on restore.
- `--adopt-unmanaged` is the only path that mutates an existing
  unmanaged profile, and it always backs up first.
- Backups are timestamped and self-describing
  (`BACKUP_MANIFEST.json`); restoring from an incomplete backup is
  detected by `verify-projectlean.py --mode backup-check`.
- All hashing and search is Python stdlib. No `rg`, `sha256sum`, or
  other external CLI.
- No hardcoded version, tool count, or universe size; the verifier
  asserts presence/absence of named toolsets only.

## Tests

```sh
cd .hermes/projectlean
python3 -B -m unittest discover -s tests -v
```

Tests use a fake `hermes` CLI on a temp `PATH`, isolated profile/state roots,
and `-B` so the canonical run writes no cache files into the package. Coverage:
fresh install, idempotence, refusal
of unmanaged mutation, adoption backup, injected failure restore,
merge preservation of an active project context, forbidden toolset
detection, unsupported capability, and no protected writes.
