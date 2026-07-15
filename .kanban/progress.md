# Ralph Progress Log

This file tracks implementation notes across Ralph iterations.

# Conventions & Decisions

- Skill renaming follows `git mv` (preserves rename detection) + `# formerly: <old>` frontmatter comment + H1 title `Foo (formerly Bar)`. Operators searching old names still find them.
- `.pi/agent/settings.json.template` is the source-of-truth JSON; the dead `rpiv-pi` package + extension entries (lines 17–20 and ~25 pre-clean) have been removed — `rpiv-pi` lives only in `.pi/agent/archive/` and is non-functional.
- Shared contract convention: new cross-skill schemas live in `.claude/skills/_shared/<name>.md` with a YAML block + closed-set enum, not prose. Both producer and consumer skills cite the same file.
- Pairing rule (harness-audit / harness-apply): auditor emits the gap handoff block, applier consumes it and skips already-answered questions. Schema v1 has 8 gate categories and the four-element coverage set `{claude-global, claude-project, pi, missing}`.
- Dimension-6 finding vocabulary is fixed: every Dimension-6 finding must name the surface, the gate category, and the missing anchor. The four named patterns are recorded in `harness-audit/SKILL.md` Phase 3 ("build agent writes with no afterWrite format/lint gate", "no changed-files static gate before commit", "gates present in Claude, missing in Pi", "gate fires in Pi but scripts are missing on disk"). Downstream consumers of audit specs can pattern-match those phrases.

# Iteration Log

## #031 harness-audit Dimension 6 + gap handoff — 2026-07-15

**What changed:** Added Dimension 6 to the audited-dimensions table; extended Phase 2 inventory to walk three surfaces (claude-global, claude-project, pi adapter) and emit per-category coverage; added a "build-node gap guidance" paragraph to Phase 3 with four named patterns; inserted the `## Harness gap handoff` block (per the shared contract schema v1) into the emitted spec template; added a `Run /harness-apply <scope>` next-step line alongside `/dev-plan`; expanded the glossary with `gate`, `build node`, and `surface`; added a "No `harness-apply` invocation" bullet to the NOT-do list so the detect-and-hand-off boundary is explicit.

**Files:** `.claude/skills/harness-audit/SKILL.md`, `.kanban/issues/031-*.md`.

**Decisions:** The spec template's `## Harness gap handoff` block is a fenced YAML-ish block with the same `category / coverage / surface` shape the shared contract defines, plus a `recommended_scope: <project|global>` so `harness-apply` can pre-fill its scope question. The `surfaces_present` field is emitted as a top-level key (separate from per-gate `surface` lists) so the consumer can short-circuit fast: if `pi: false` but Claude surfaces are true, the audit can still produce a meaningful "gates present in Claude, missing in Pi" finding. Glossary additions follow the existing "if a finding needs a term not in CONTEXT.md, propose adding it" rule. Caught and fixed one stale reference in the Phase 2 list: "conditional-4 triggered" → "conditional-5 triggered" (the conditional dimension was renumbered to 5 in #028).

**Conventions established:** See top of this file. The Dimension-6 finding vocabulary is the durable one: every audit-spec Dimension-6 finding from this skill will use one of the four named patterns so downstream consumers can pattern-match.

**Notes for next iteration:** #032 is now eligible (blocked_by 028 + 029 + 030, all done). The two paired skills are ready to be closed: harness-audit emits the handoff, harness-apply consumes it. A re-audit of *this* dotfiles repo against Dimension 6 would (per the actual on-disk state at this commit) report: most gate categories `coverage: missing` on every surface — the `~/.claude/hooks/*.sh` scripts from the harness-apply templates are not yet installed on this machine; the adapter wiring is in place but the gates it would invoke are absent. That's a follow-up issue, not in #031's scope.

## #030 global Pi adapter (harness-gates) — 2026-07-15

**What changed:** Added `.pi/agent/extensions/harness-gates/` (ESM `index.js` + `package.json` + smoke test). Registered `"extensions/harness-gates"` as a positive entry in both `.pi/agent/settings.json` and `.pi/agent/settings.json.template`.

**Files:** `.pi/agent/extensions/harness-gates/{package.json,index.js,tests/harness-gates-smoke.sh}`, `.pi/agent/settings.json.template`.

**Decisions:** Script discovery is `~/.claude/hooks/` → `<projectRoot>/.claude/hooks/` (project wins); missing scripts are silently skipped (opportunistic — never crashes the adapter). Result-side `format-on-edit.sh` and `lint-on-edit.sh` are fail-open by design (their stderr is surfaced as a notification but doesn't flip `isError`); `validate-syntax.sh` exit-2 DOES flip `isError=true`. Bash gates and the path gate both run sequentially; the FIRST exit-2 wins, others are short-circuited. Smoke test imports the adapter as ESM and drives the exported `runBashGates` / `runPathGate` / `findProjectRoot` directly via a tiny inline Node driver — no pi runner needed for verification.

**Conventions established:** The synthesized stdin contract is documented in one place (top-of-file comment in `index.js`): bash gates read `{tool_input:{command}}`; the path gate reads `{tool_name, tool_input:{file_path}}`; result gates read `{tool_input:{file_path}}`. The script templates in `harness-apply/SKILL.md` and the Pi adapter MUST stay aligned through that comment — it's the only coupling point.

**Notes for next iteration:** #032 (blocked by #028, #029, #030) is now eligible. #031 (blocked only by #028) was eligible earlier and still is — both can run in parallel. The `~/.claude/hooks/*.sh` files for the global gates (block-bash-pattern, block-path-access, pre-git-checks, staged-static-check, format-on-edit, validate-syntax, lint-on-edit) are still not installed on this machine; until they are, the adapter is a no-op (everything passes through) but the wiring is in place so any future `harness-apply` run that generates them lights up automatically.

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
