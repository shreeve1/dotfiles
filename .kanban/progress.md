# Ralph Progress Log

This file tracks implementation notes across Ralph iterations.

# Conventions & Decisions

- Skill renaming follows `git mv` (preserves rename detection) + `# formerly: <old>` frontmatter comment + H1 title `Foo (formerly Bar)`. Operators searching old names still find them.
- `.pi/agent/settings.json.template` is the source-of-truth JSON; the dead `rpiv-pi` package + extension entries (lines 17–20 and ~25 pre-clean) have been removed — `rpiv-pi` lives only in `.pi/agent/archive/` and is non-functional.
- Shared contract convention: new cross-skill schemas live in `.claude/skills/_shared/<name>.md` with a YAML block + closed-set enum, not prose. Both producer and consumer skills cite the same file.
- Pairing rule (harness-audit / harness-apply): auditor emits the gap handoff block, applier consumes it and skips already-answered questions. Schema v1 has 8 gate categories and the four-element coverage set `{claude-global, claude-project, pi, missing}`.

# Iteration Log

## #029 harness-apply build-node gate upgrades (changed-files static check) — 2026-07-15

**What changed:** Added `staged-static-check.sh` template (cat 4a, `beforeGit` blocking, fast lint+type on `git diff --cached` only — also handles `-a`/`-am`); split Q7 into Q7a (recommended changed-files static) + Q7b (opt-in whole-project with "slow — prefer CI" warning); switched `lint-on-edit.sh` default to `--fix` fail-open (kept `--strict` opt-in); added `staged-static-check.sh` row to the hook-map table + Step 5 dry-check 4c; renamed all five generated-script echo labels (`block-bash-pattern.sh`, `block-path-access.sh` ×3, `pre-git-checks.sh`) + the new staged-static-check label to `harness-gate`; authored the smoke test.

**Files:** `.claude/skills/harness-apply/SKILL.md`, `.claude/skills/harness-apply/tests/staged-static-check-smoke.sh`.

**Decisions:** The diff --cached arm uses `--diff-filter=ACM` (Added/Copied/Modified — skips Deleted since lint on a deleted file is meaningless). The `-a`/`-am` arm adds tracked-but-unstaged via `git diff --name-only --diff-filter=ACM`. Per-check `timeout 60s` (cat 4a is supposed to be fast). Skip arms whose tool is absent — never block spuriously on missing ruff/mypy.

**Conventions established:** Smoke tests for SKILL.md script templates use `awk` to fence-extract the template block, `bash -n` it, and run against a `mktemp -d` fixture. The pattern is reusable for any future template-backed script in this skill (and matches the harness-gates Pi adapter smoke plan in #030).

**Notes for next iteration:** #030 (blocked by #028) and #031 (blocked by #028) are now eligible alongside #029's completion. #032 stays blocked on #029 (and #030, #028). Watch out for: the smoke test runs `ruff` with `--no-fix` behavior because the template doesn't pass `--fix` (it shouldn't — fast blocking check, not autofix); the lint-on-edit autofix is a different script. When #030 lands, the global Pi adapter will discover both scripts at runtime — no per-project wiring needed.

## #028 Rename skills to harness-audit/harness-apply + shared handoff contract — 2026-07-15

**What changed:** git-mv'd both skills; updated frontmatter name+description; added `formerly:` alias notes; authored `.claude/skills/_shared/harness-gap-handoff.md` (YAML schema, 8 gate categories, 4-value coverage set, recommended_scope); removed dead `rpiv-pi` config from `.pi/agent/settings.json.template`.

**Files:** `.claude/skills/harness-audit/SKILL.md`, `.claude/skills/harness-apply/SKILL.md`, `.claude/skills/_shared/harness-gap-handoff.md`, `.pi/agent/settings.json.template`.

**Decisions:** Kept `harness-apply/SKILL.md` in-body mentions of `personalize-harness` (5 script-template echo strings + 2 vocabulary cross-refs) untouched — they belong to #029 (gate-upgrades slice, plan 2.5/5.2). Scope discipline: #028 is rename+contract foundation only.

**Conventions established:** See top of this file. Most importantly: shared schemas go under `.claude/skills/_shared/`, not inline in either skill.

**Notes for next iteration:** #029 (blocked by #028) is now eligible. It must add the `staged-static-check.sh` template to `harness-apply`, rework Q7 (changed-files default; demote whole-suite), add lint autofix, and at last sweep the in-body `personalize-harness` references for the rename-proof label `harness-gate`.
