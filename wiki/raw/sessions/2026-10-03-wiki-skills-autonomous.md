# Session Capture: wiki skills made autonomous (auto-promote, no approval gates)

- Date: 2026-10-03
- Purpose: `llm-wiki-setup` and `wiki-update` skills updated so wiki updates and candidate promotion run without asking James; AGENTS.md refactor made autonomous; dotfiles `AGENTS.md` aligned.
- Scope: skill contract text only (no gate.py changes); dotfiles AGENTS.md LLM Wiki section added.

## Durable Facts

- Candidate promotion is now autonomous and same-run: candidates are verified (frontmatter, OKF conformance, citations, duplicates) and promoted via `llm-wiki-setup` `Workflows/Promote.md` in the same run; no human approval step. — Evidence: `~/.agents/skills/llm-wiki-setup/Workflows/Promote.md`, `wiki-update/Workflows/SessionUpdate.md` §7 step 3
- Promote crash safety: Branch A (target exists) surgically merges and verifies before candidate removal; Branch B (no target) copy → verify → delete, never `git mv` (removes source pre-verification); failed verification deletes the unverified target copy and leaves the candidate retryable. Failed candidates are never auto-discarded. — Evidence: `Workflows/Promote.md` step 6 + Discarding section
- No question is ever asked: sensitive/private/secret material is omitted automatically and logged (SessionUpdate §8), lint defers broad rewrites/drift/supersession as evidence-based findings (Lint step 4), duplicate conflicts default to merge and log.
- Ingest and Query workflows now route their candidates through Promote.md same-run (Ingest step 13, Query Save-Back step 5); raw-source inspection in Query is autonomous.
- The AGENTS.md/CLAUDE.md refactor in Setup runs autonomously (Setup step 5, RefactorAgents Rules); the injected compact section requires running `/wiki-update` before task completion instead of proposing/deferring.
- Dotfiles `AGENTS.md` now carries the compact `## LLM Wiki` section (wiki-first search, autonomous promotion, mandatory end-of-run wiki check).

## Decisions

- James requested full autonomy: auto update + auto promote wiki entries, and the project AGENTS.md update path autonomous — no approval gates remain except data-loss blockers (dotfiles install repo target, unrelated existing `wiki/`).
- Verification gates (gate.py, claim verify, promote checks) kept: they check truth/budget, which approval never did. — Evidence: `wiki-update/Workflows/SessionUpdate.md` §7a/§8a

## Evidence

- `~/.agents/skills/llm-wiki-setup/{SKILL.md,Architecture.md,Templates.md,Workflows/*}` — autonomy contract
- `~/.agents/skills/wiki-update/{SKILL.md,Workflows/SessionUpdate.md}` — same-run promotion, §8 auto-omission
- `AGENTS.md` — new `## LLM Wiki` section (lines 108-132)

## Exclusions

- None sensitive; all content is skill-contract and repo documentation.

## Open Questions And Follow-Ups

- Runtime obedience unproven: first real `/wiki-update` run must end with an empty candidate queue and populated promoted indexes.
- Dotfiles wiki has three pre-existing parked candidates (see `wiki/index.md` queue) from before the autonomy change; a promote pass could clear them.
