# Task 6 report: Dotfiles sync and final checks

## TDD evidence

- RED: after writing `tests/sync-starter-skills.test.sh`, `bash tests/sync-starter-skills.test.sh` failed with exit 2 because `bin/sync-starter-skills` did not exist.
- GREEN: after implementing the script, the same command passed and printed `sync-starter-skills tests: PASS`.

The test covers byte-identical copies, upstream deletion, preserving another skill, destination paths with spaces, skipped `__pycache__`, and missing-starter exit 2 with an unchanged destination.

## Sync output

`bin/sync-starter-skills` ran against `/home/james/starter-agent` and printed these changed paths:

```text
.agents/skills/personal-memory/SKILL.md
.agents/skills/personal-memory/gate.py
.agents/skills/personal-memory/hubs.py
.agents/skills/personal-memory/indexes.py
.agents/skills/personal-memory/reference.md
.agents/skills/personal-memory/scaffold/AGENTS-memory.md
.agents/skills/personal-memory/scaffold/README.md
.agents/skills/personal-memory/sweep.py
.agents/skills/personal-memory/tests/test_bloat.py
.agents/skills/personal-memory/tests/test_hubs.py
.agents/skills/personal-memory/tests/test_indexes.py
.agents/skills/personal-memory/tests/test_rules.py
.agents/skills/memory-setup/SKILL.md
.agents/skills/memory-setup/code-repos.md
.agents/skills/memory-setup/sorting.md
.agents/skills/memory-setup/subagent-brief.md
.agents/skills/memory-setup/tests/test_layout.py
.agents/skills/memory-setup/tracking-model.md
.agents/skills/memory-setup/where-things-go.md
```

`diff -qr --exclude='__pycache__'` against both starter skill folders was empty.

## Style and skill tests

Initial style check found only the new shell test's shfmt issue. The prescribed `style-check --fix tests/sync-starter-skills.test.sh` fixed it. Final output:

```text
style-check: clean (1 shell, 0 python, 0 ts/js, 0 markdown)
```

No `.styleignore` change was needed. The synchronized files passed style-check, so no Markdown exception was added.

`bash tests/personal-memory.test.sh`:

```text
Ran 99 tests in 9.086s
OK
```

## Memory audits

All commands used the new synced `gate.py`; no project files were edited, and neither `hubs.py` nor `indexes.py` was run in those projects.

| Project | Exit | Result |
|---|---:|---|
| `~/homelab` | 0 | Success; warning that `CONTEXT.md` is 38929 bytes, over 24576 |
| `~/3cx-web-chat` | 0 | Success; warning that `CONTEXT.md` is 27449 bytes, over 24576 |
| `~/pi-durable` | 0 | Success |
| `~/tatoo` | 0 | Success |
| `~/cliproxyapi` | 0 | Success |
| `~/testy-bot/resume` | 0 | Success |
| `~/dotfiles` | 0 | `Success: Memory index and Client Memory are in sync.` |

The two `CONTEXT.md` messages are warnings only and were not caused by this task.

## Full suite

```text
ok     4s  tests/drawio.test.sh
ok    30s  tests/opencode-verify-final.test.sh
ok    12s  tests/personal-memory.test.sh
ok     1s  tests/sync-starter-skills.test.sh
ok     4s  tests/verify-final-cleanup.test.sh
ok     0s  tests/verify-final-wording.test.sh

run-all: 7 passed, 0 failed
```

## Files changed

- Added executable `bin/sync-starter-skills`.
- Added `tests/sync-starter-skills.test.sh`.
- Added `memory/docs/starter-agent-skill-source.md`.
- Added the corresponding `memory/index.md` and `memory/rules.md` entries.
- Synchronized `.agents/skills/personal-memory/**` and created `.agents/skills/memory-setup/**` from `~/starter-agent`.

No `.styleignore` change was made. Foreign existing dotfiles changes under `.pi/agent`, `bin/ab-input`, and `.config/opencode` were not staged or touched.

## Self-review and concerns

The sync script validates both required source `SKILL.md` files before writing, compares file bytes rather than timestamps, deletes only inside the two destination skill folders, skips `__pycache__`, handles spaces through `pathlib`, and leaves unrelated skills alone. The missing-source test confirmed the destination remains unchanged.

The only concerns are the two pre-existing `CONTEXT.md` size warnings noted above. Per the controller ruling, nothing was pushed, no other-machine pulls were run, and no project memory files were modified.
