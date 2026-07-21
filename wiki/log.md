# Wiki Log

Append entries with this format:

## [YYYY-MM-DD] type | Title

- Actor: agent or human
- Inputs: paths or prompt summary
- Outputs: changed pages
- Notes: key decisions or unresolved questions

## 2026-07-21 session-update | Two-layer verification — grounding gate (pi-duo) + completeness review (gap-review)

- Actor: Pi (grill-with-docs session)
- Inputs: James's question on whether the constant-verifier sidekick should become a Pi extension (like pi-duo) for automated tasks; `~/symphony` as the test project; `.pi/agent/extensions/pi-duo/{extensions/pi-duo.ts,src/duo-core.ts}`, `.pi/agent/extensions/pi-subagents/`, `.claude/skills/v2-pane-orch/`.
- Outputs: `docs/adr/0001-verification-two-layers.md`, `CONTEXT.md`, `.pi/agent/extensions/gap-review/{index.js,package.json,tests/gap-review-smoke.sh}`, `.pi/agent/settings.json{,.template}`, `.gitignore`, `CLAUDE.md`, `wiki/raw/sessions/2026-07-21-gap-review-completeness-layer.md`, `wiki/CLAIMS.md` (C-0119..C-0122 via gate.py ADMIT), `wiki/index.md`, `wiki/log.md`.
- Notes: Distinguished grounding failure (false claim) from completeness failure (material omission). pi-duo's verifier is a tool-less (completeSimple) in-band grounding gate — competent at false claims (synthetic probes passed) but structurally unable to catch omissions (prompt forbids demanding extra work). Reproduced the real pain on `~/symphony/contract_gate.py`: pi-duo shipped a correct answer omitting ~13 behaviors; a fresh tooled reviewer found them. Decision = two layers (pi-duo grounding + on-demand completeness review). gap-review extension automates the completeness layer at `turn_end` (detached fresh `pi -p` reviewer, async, always-on). The comparison confounded stance/context/tools, so no single lever was isolated. Claims-only update — no promoted wiki page, since the model is authoritative in the ADR + CONTEXT.md + CLAUDE.md (matches the ponytail precedent). `gate.py audit` clean. Unresolved: which lever (freshness/tools/stance) is decisive for completeness; `PI_GAP_MIN_CHARS=200` is an unconfirmed default; bash-touched files are invisible to gap-review.

- Actor: Claude Code
- Inputs: James request to update wiki after removing pi-moa (`@duyviet1804/pi-moa`) from the Pi harness during the @tintinweb→nicobailon/pi-subagents migration. pi-moa extension dir, `moa.json`, `moa-fast.json`, and all settings/CLAUDE.md references are gone from the repo.
- Outputs: `wiki/CLAIMS.md` (removed C-0119..C-0123), `wiki/ROUTING.md` (removed pi-moa section), `wiki/index.md` (removed candidate row), deleted `wiki/candidates/analysis-session-pi-moa-fusion.md` and `wiki/eval/pi-moa.eval`, `wiki/log.md`.
- Notes: Discard, not supersede — the subject system no longer exists in the repo, so the pi-moa runbook/claims describe a removed extension. `raw/sessions/2026-07-11-pi-moa-*.md` retained per the immutable-raw rule (historical record of the install/tuning sessions). Candidate was never promoted, so no promoted page to retire. `gate.py audit` clean after (13 active, budget 40). Unrelated `source-opencode-subagents` candidate still awaits promote/discard.

## 2026-06-04 session-update | RPIV pipeline driver and companion skills

- Actor: Claude Code
- Inputs: current session on the `rpiv-run` pipeline; `bin/rpiv-run`, `.claude/skills/rpiv-monitor/SKILL.md`, `.claude/skills/gap-sweep/SKILL.md`, `.claude/skills/rpiv-merge/SKILL.md`; commits `bfaafaa`, `794a79c`, `edcd3c5`
- Outputs: `wiki/raw/sessions/2026-06-04-rpiv-pipeline-skills.md`, `wiki/candidates/analysis-session-rpiv-pipeline.md`, `wiki/index.md`, `wiki/ROUTING.md`, `wiki/CLAIMS.md`, `wiki/log.md`
- Notes: Captured the RPIV pipeline architecture (default engine, fresh `rpiv/<TS>` branch not a worktree, file-based cross-engine handoff, `.rpiv/run/<TS>/.base` base-ref persistence) and the three companion skills as a curated raw session note plus one candidate analysis page; added a non-authoritative "RPIV Pipeline Automation" routing section; recorded claims C-0106 through C-0115 (C-0115 marked medium confidence as not yet exercised end-to-end). Excluded the downstream cleon-ui-pi feature merge and pm2 restart as non-durable.

## 2026-06-04 promote | RPIV Pipeline Driver And Companion Skills

- Actor: Claude Code
- Inputs: `wiki/candidates/analysis-session-rpiv-pipeline.md`
- Outputs: `wiki/analyses/rpiv-pipeline.md`, `wiki/index.md`, `wiki/ROUTING.md`, `wiki/CLAIMS.md`, `wiki/log.md`
- Notes: Promoted the RPIV pipeline analysis candidate into `wiki/analyses/` (status: promoted). Moved the index row from the candidate review queue to the Analyses section, marked the RPIV Pipeline Automation route as promoted/authoritative, and repointed claims C-0106 through C-0115 to the promoted page path. Candidate file removed after the target was verified.

## 2026-07-11 session-update | pi-moa Fusion advisor cost tuning

- Actor: Claude Code (Symphony unattended, issue #372)
- Inputs: task to experiment with cheaper pi-moa advisor combos keeping `cliproxy/claude-opus-4-8` aggregator; `wiki/candidates/analysis-session-pi-moa-fusion.md` runbook; `pi --list-models`; direct advisor smoke tests + a coding-advisor benchmark; end-to-end Fusion run.
- Outputs: `.pi/agent/moa.json` (advisor swap), `wiki/raw/sessions/2026-07-11-pi-moa-advisor-cost-tuning.md`, `wiki/candidates/analysis-session-pi-moa-fusion.md` (advisor table + cost-tuning section), `wiki/CLAIMS.md` (C-0123 via gate.py ADMIT), `wiki/eval/pi-moa.eval`, `wiki/index.md`, `wiki/log.md`.
- Notes: Replaced Fusion advisor `deepseek/deepseek-v4-pro` with `google/gemini-3.1-flash-lite` (kept as verifier). Benchmark: flash-lite 10.9s vs pro 18.0s, core angles covered; Opus aggregator carries synthesis depth so advisors need breadth not depth. Confirmed pi-moa resolves `google/*` via Pi's native catalog (not LiteLLM `gemini/` prefix) — end-to-end `pi --provider pi-moa --model Fusion` returned `MOA_OK` exit 0. Fusion Fast left unchanged (already single cheap advisor). Unresolved: absolute per-turn $ cost unmeasured; verifier model not cost-tested.

## 2026-07-11 session-update | pi-moa Fusion install and model-update runbook

- Actor: Claude Code
- Inputs: current session vendoring `@duyviet1804/pi-moa` into the Pi harness; `.pi/agent/extensions/pi-moa/{README.md,extensions/pi-moa.ts}`, `.pi/agent/moa.json`, `.pi/agent/moa-fast.json`, `.pi/agent/package.json`, dotfiles `CLAUDE.md`
- Outputs: `wiki/raw/sessions/2026-07-11-pi-moa-fusion-install.md`, `wiki/candidates/analysis-session-pi-moa-fusion.md`, `wiki/CLAIMS.md` (C-0119..C-0122 via gate.py ADMIT), `wiki/eval/pi-moa.eval`, `wiki/index.md`, `wiki/ROUTING.md`, `wiki/log.md`
- Notes: Captured how pi-moa selects models (moa.json/moa-fast.json referenceModels/aggregator/verifier fields, git-tracked so they sync), the edit→/reload→/pi-moa verify runbook with fail-loud validation, the pi-ai 0.80.6+ `compat` requirement, and the deepseek+cliproxy config decision with Opus 2-3x/turn cost note. One candidate analysis page (the model-update runbook, James's stated goal) awaiting promote/discard. Excluded PATH dedup and stale root-`pi` removal from the same session as non-pi-moa knowledge. Unresolved: aggregator cost unmeasured; `source-opencode-subagents` candidate still awaits promote/discard.

## 2026-06-23 session-update | ponytail vendoring and wiki claim-gate evolution

- Actor: Claude Code (Symphony unattended, issue #107 "wiki update 2")
- Inputs: `git log --since=2026-06-19` (commits `be3f485`, `f140f20`, `002501d`, `4e6c661`, `6af95c9`); dotfiles `CLAUDE.md`; `.claude/skills/wiki-update/{gate.py,Workflows/SessionUpdate.md}`. Invoking conversation had no engineering work, so scope was repo evolution since the 2026-06-20 cleanup.
- Outputs: `wiki/raw/sessions/2026-06-23-ponytail-and-wiki-gates.md`, `wiki/CLAIMS.md` (C-0116..C-0118 via gate.py ADMIT), `wiki/eval/ponytail.eval`, `wiki/ROUTING.md`, `wiki/log.md`
- Notes: Captured ponytail vendoring model (not plugin/pi-installed, sync reasons), the provider-file hook-wiring gotcha, and the gate.py-only claim-write rule as a curated raw note plus three gate-admitted claims; added an eval slice and a non-authoritative routing section. Claims-only update — no promoted page created, since the facts are authoritatively documented in `CLAUDE.md` and a page would duplicate it. Unresolved: long-standing `source-opencode-subagents` candidate still awaits James's promote/discard decision.

## 2026-06-20 cleanup | Remove retired-system wiki references

- Actor: Pi
- Inputs: James request to remove confusing retired-system references from all local wikis.
- Outputs: pruned retired-system source/candidate pages from this wiki; refreshed `wiki/README.md`, `wiki/index.md`, `wiki/ROUTING.md`, `wiki/CLAIMS.md`, and `wiki/log.md`.
- Notes: Kept only non-retired-system OpenCode subagent and RPIV pipeline wiki knowledge.
