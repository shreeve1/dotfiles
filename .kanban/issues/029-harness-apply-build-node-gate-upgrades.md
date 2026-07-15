---
id: 029
title: harness-apply build-node gate upgrades (changed-files static check)
status: review
blocked_by: [028] 
parent: null
priority: 0
created: 2026-07-14
---

## What to build

Edit `.claude/skills/harness-apply/SKILL.md` to fix the commit-gate cost problem and close the build-node gap.

- Add a new `staged-static-check.sh` **script template** (in the Step 4 templates): reads bash stdin, acts only on `git commit`/`git push`, computes `git diff --cached --name-only --diff-filter=ACM` (plus unstaged tracked files when `-a`/`-am` is present), filters by extension, and runs `ruff check` + `mypy` (Python) / `eslint` + `tsc --noEmit` (JS/TS) on **only those files**. Time-boxed; `exit 2` blocks. Drop arms whose tool is absent.
- Rework Q7: make the changed-files static check the **recommended** `beforeGit` default. Split gap category 4 into 4a (changed-files static — recommended, fast, blocking) and 4b (whole-project typecheck/build/test — opt-in, with an explicit "slow — prefer CI / `dev-test`" warning). Update the `pre-git-checks.sh` narrative so the full suite is no longer a default commit gate.
- Add edit-time autofix to the `lint-on-edit.sh` template + Q10: offer `ruff check --fix` / `eslint --fix` (fail-open) as the recommended lint posture; keep blocking non-fix lint opt-in.
- Add `staged-static-check.sh` to the "Map of which hook goes where" table (`PreToolUse`/`Bash`) and add a Step 5 verify dry-check (non-git command passes; `git commit` with a lint-dirty staged file blocks; clean passes).
- Rename the embedded `personalize-harness` label in the five generated-script echo strings (`block-bash-pattern.sh`, `block-path-access.sh` ×3, `pre-git-checks.sh`) to a rename-proof generic label `harness-gate`, and sweep the rest of the file for `personalize-harness` self-references. NOTE: issue 028 adds a single "formerly `personalize-harness`" alias line near the top — that one line is intentional and stays; every OTHER occurrence must go.
- Add a behavioral smoke for the new gate template: create `.claude/skills/harness-apply/tests/staged-static-check-smoke.sh` that (a) `awk`-extracts the first ` ```bash ` fenced block following the `staged-static-check.sh` template marker in `../SKILL.md` into a temp file + `chmod +x`, (b) builds a throwaway git repo in `mktemp -d`, and (c) asserts the plan's T.1 cases: stage a `.py` with a ruff violation → the script exits 2; stage a clean `.py` → exit 0; a non-git command (`ls`) → exit 0; `git commit -am` with a lint-dirty tracked-but-unstaged file → still caught. Skip ruff/mypy arms gracefully if those tools are absent (assert the git-detection + diff-scoping logic regardless).

Reference: `/home/james/symphony/plans/harness-audit-apply-pairing-pi-gates.md`.

## Acceptance criteria

- [ ] SKILL.md contains a `staged-static-check.sh` template block that diffs `git diff --cached` and also handles `-a`/`-am`
- [ ] Q7 presents the changed-files static check as the recommended `beforeGit` default; whole-project checks are opt-in with a slow-warning
- [ ] `lint-on-edit.sh` offers `--fix` autofix (fail-open) as the recommended posture
- [ ] `staged-static-check.sh` appears in the hook-map table and a Step 5 dry-check
- [ ] no `personalize-harness` string remains anywhere in `harness-apply/SKILL.md` except the single "formerly" alias line (echo labels now `harness-gate`)
- [ ] `.claude/skills/harness-apply/tests/staged-static-check-smoke.sh` exists and passes the T.1 behavioral cases

## Verification

`grep -q 'staged-static-check.sh' .claude/skills/harness-apply/SKILL.md && grep -q 'diff --cached' .claude/skills/harness-apply/SKILL.md && grep -qE 'ruff check --fix|eslint --fix' .claude/skills/harness-apply/SKILL.md && test -z "$(grep 'personalize-harness' .claude/skills/harness-apply/SKILL.md | grep -v formerly)" && bash .claude/skills/harness-apply/tests/staged-static-check-smoke.sh`

## Blocked by

- Blocked by #028
