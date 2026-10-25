# Personal Memory Reference

Rare operations for the `personal-memory` skill: setting up the system, recovering missing scaffold, and linting memory health. `SKILL.md` covers everyday capture and reads; open this file only for one of these three.

## Setup Workflow

Use when installing memory in a project. The skill is global (`~/.agents/skills/personal-memory/`); only the scaffold is copied into the project.

1. From the project root: `cp -r ~/.agents/skills/personal-memory/scaffold memory`, then move `memory/AGENTS-memory.md` out of `memory/` (step 3 uses it).
2. Set `memory/schema.json`: `topics` for this project, and `client_folder` / `client_subjects` if the project keeps coming back to a set of things (hosts, services, customers). Otherwise leave `client_subjects` empty and delete the "Work on one client" row from `memory/rules.md`.
3. Paste the sections of `AGENTS-memory.md` into the project's `AGENTS.md` (or `CLAUDE.md`). Keep everything else in that file.
4. Git repos only: add `memory/raw/` to `.gitignore`. No hooks.
5. Create topic folders and other `memory/` folders only as content needs them.
6. Run `indexes.py`, then `gate.py --memory memory audit`; it must exit 0. Report changed files.

## Recovery Workflow

Scaffold or personal files may be missing in a fresh copy of a
project. Before writing any promoted memory in a run, ensure the scaffold
exists first, then recover the personal files:

- If `memory/README.md` or `memory/TEMPLATES.md` is missing, recreate it — it is
  scaffold, not personal state. Restore `README.md` as the memory
  contract and `TEMPLATES.md` as the canonical templates, copying it from
  `~/.agents/skills/personal-memory/scaffold/`.
- If `memory/index.md` is missing, recreate it from the `TEMPLATES.md` index template before writing promoted memory.
- `memory/log.md` is retired. Never recreate it.
- Missing personal files are normal, not an error.

## Lint Workflow

Use when asked to review memory health or before broad cleanup.

Run the deterministic index audit first:

`python3 ~/.agents/skills/personal-memory/gate.py --memory memory audit`

It reports promoted files missing from `memory/index.md`, index entries pointing to files that no longer exist, topic-folder problems (a promoted file directly in `workflows/`/`decisions/`, a topic folder not in `memory/schema.json`, a sub-index missing a file or drifted from `indexes.py`), and Client Memory problems (missing frontmatter keys, unknown subject, subject/client not matching the folders, note not on its hub, hub out of date, hub without an `index.md` row), and exits non-zero when anything needs fixing. It also prints `crowded` warnings (a memory folder holding more than 15 `.md` files directly) but does not fail on them. Fix hub problems by running `hubs.py`; fix sub-index drift by running `indexes.py`. `memory/candidates/` is not audited. For `gate.py audit` to recognize an index entry, the row must carry the file path either backticked (`` `memory/decisions/<topic>/decision-x.md` ``) or as a markdown link (`[title](memory/decisions/<topic>/decision-x.md)`).

Then also check for:

- Index rows pointing to missing files.
- Promoted files missing from `memory/index.md`.
- Empty promoted topic files.
- Conflicting active promoted rules.
- Cross-links pointing to memory files that do not exist (report only — broken links are tolerated, not auto-removed).

Report findings before making broad changes. Safe deterministic fixes include removing stale rows and adding missing index rows for existing files.

Note on `gate.py`: `audit` checks `memory/index.md` against the promoted files and Client Memory on disk, checks `memory/rules.md`, and prints lean-memory warnings (size, summary length, history lines, superseded files). `stale` lists notes not updated or verified in 90 days. It checks structure only; it does not check whether a memory item is true (see the grounding rule in Capture Workflow).
