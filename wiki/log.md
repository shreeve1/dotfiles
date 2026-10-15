# Wiki Log

Append entries with this format:

## [YYYY-MM-DD] type | Title

- Actor: agent or human
- Inputs: paths or prompt summary
- Outputs: changed pages
- Notes: key decisions or unresolved questions

## 2026-10-05

- **Update** (session-update, Claude Code skills link): `~/.claude/skills` replaced with a symlink to `dotfiles/.agents/skills` (old dir kept as `~/.claude/skills.bak-openrig`; its `openrig-skills` was identical to the repo copy). `install.sh` gained `link_path ".agents/skills" ".claude/skills"`; `AGENTS.md` Claude-lane bullet updated. Claims-only update: C-0139 admitted via gate (cited to `install.sh`, verified against the live symlink). No raw capture, candidate, or promotion needed.

## 2026-10-03

- **Promote** (omarchy bare-metal and Surface recovery → promoted): `wiki/candidates/analysis-session-omarchy-bare-metal-and-surface-recovery.md` → `wiki/analyses/analysis-session-omarchy-bare-metal-and-surface-recovery.md` (Branch B: copy → verify → remove; no `git mv`). Legacy claims C-0130..C-0133 still pointed at the candidate path; repaired via gated `demote --force` + `check --apply` re-adds as C-0135..C-0138 pointing at the promoted page. Root index rows moved in the existing table format; `wiki/analyses/index.md` extended in its bullet style.
- **Promote** (projectlean wiki-first SOUL → promoted): `wiki/candidates/analysis-session-projectlean-wiki-first-soul.md` → `wiki/analyses/analysis-session-projectlean-wiki-first-soul.md` (Branch B). Stale "Candidate Promotion Notes" section (promotion-still-requires-approval) removed on the promoted copy; promotion is autonomous under the current contract. No claims existed for this candidate.
- **Promote** (OpenCode subagents source summary → promoted): `wiki/candidates/source-opencode-subagents.md` → `wiki/sources/opencode-subagents.md` (Branch B, new `wiki/sources/` directory). Candidate failed the OKF `# Citations` check; fixed by adding the Citations section, then verified and promoted. Candidate Promotion Notes removed; `wiki/sources/index.md` created in bullet style.
- **Update** (session-update, wiki skills made autonomous): llm-wiki-setup and wiki-update contracts updated for fully autonomous operation (same-run verify-and-promote, auto-omission of sensitive material, no approval questions). Raw capture `wiki/raw/sessions/2026-10-03-wiki-skills-autonomous.md`; promoted `wiki/analyses/analysis-session-wiki-skills-autonomous.md`; claim C-0134 admitted via gate after independent verify (3/3 VERIFIED); page-path convention fixed by gated prune + re-add (eval 15/16 held). Dotfiles `AGENTS.md` gained the `## LLM Wiki` section (transitional OKF wording; root index legacy table-format).

## 2026-09-19 session-update | Omarchy bare-metal configuration and Surface recovery

- Actor: Hermes Agent
- Inputs: current session; committed Omarchy work from `02b18771` through `542dac3e`; `install.sh`; `omarchy/README.md`; `omarchy/HARDWARE-surface-laptop-7.md`; `omarchy/config/hypr/{monitors,bindings}.lua`; `omarchy/bin/hypr-deck`.
- Outputs: `wiki/raw/sessions/2026-09-19-omarchy-bare-metal-and-surface-recovery.md`; `wiki/candidates/analysis-session-omarchy-bare-metal-and-surface-recovery.md`; `wiki/CLAIMS.md` C-0130..C-0133 via `gate.py ADMIT`; `wiki/eval/omarchy.eval`; `wiki/index.md`; `wiki/ROUTING.md`; `wiki/log.md`.
- Notes: Captured the portable user-config versus host-repair boundary; Hypr Deck service and fixed workspace placement; four Surface repair areas; and the kernel-update rebuild order. The configured independent checker could not authenticate to DeepSeek, so the documented fallback was used: each claim was re-grounded against exact current source lines before gate admission. No existing candidate, route, or claim overlapped or contradicted this topic. Scheduled maintenance merged RPIV stage-order claim C-0107 into related pipeline-mechanics claim C-0106 through gated consolidation; active claims dropped 28→27 while the pre-existing 15/16 eval baseline held. Candidate awaits promote/discard. Host-specific monitor output names may change after dock/hardware changes; kernel overrides should be retired when upstream support lands.
## 2026-09-19 session-update | projectlean wiki-first SOUL staging

- Actor: Hermes Kanban worker
- Inputs: `.hermes/templates/projectlean-soul.md.template`, `.hermes/bin/{install-projectlean.py,verify-projectlean.py}`, `.hermes/docs/project-scoped-hermes-spec.md`, deterministic preflight/post-apply probes.
- Outputs: `wiki/raw/sessions/2026-09-19-projectlean-wiki-first-soul.md`, `wiki/candidates/analysis-session-projectlean-wiki-first-soul.md`, `wiki/index.md`, `wiki/ROUTING.md`, `wiki/log.md`.
- Notes: Candidate only. The installer is non-writing for `SOUL.md`; a human-approved backup/copy remains required before exact parity, prompt-size, and a real wiki-backed query can establish final acceptance. No claims added; source code and spec remain authoritative.

## 2026-09-19 session-update | projectlean SOUL final apply

- Actor: Hermes Kanban worker
- Inputs: `.hermes/templates/projectlean-soul.md.template`, `.hermes/bin/{install-projectlean.py,verify-projectlean.py}`, protected-copy receipt, post-apply verifier, prompt-size, and Hermes wiki-backed query.
- Outputs: `wiki/raw/sessions/2026-09-19-projectlean-soul-final-apply.md`, updated `wiki/candidates/analysis-session-projectlean-wiki-first-soul.md`, `wiki/index.md`, `wiki/ROUTING.md`, `wiki/log.md`.
- Notes: Captured the accepted merged communication/wiki-first/project-native-follow-up contract and final exact-parity receipt. Candidate remains non-authoritative pending James's promotion approval. No claims or external issues created.

## 2026-09-19 session-update | projectlean query skill repair

- Actor: Hermes Kanban worker
- Inputs: one-shot projectlean wiki query, failed post-apply receipt, idempotent installer, final post-apply and SHA-parity receipts.
- Outputs: `wiki/raw/sessions/2026-09-19-projectlean-query-skill-repair.md`, updated `wiki/candidates/analysis-session-projectlean-wiki-first-soul.md`, `wiki/ROUTING.md`, `wiki/log.md`.
- Notes: Runtime query left extra profile skill directories; the installer restored the six-tree invariant without writing SOUL.md. No claims or external issues created.

## 2026-09-04 promote | dsh-board pipeline analysis → promoted

- Actor: Claude Code (James: "promote")
- Inputs: `wiki/candidates/analysis-session-dsh-board-pipeline.md`; target category `analyses`.
- Outputs: `wiki/analyses/dsh-board-pipeline.md` (promoted, `status: promoted`, `promoted: 2026-09-04`); removed `wiki/candidates/analysis-session-dsh-board-pipeline.md`; `wiki/index.md` (moved row from candidate queue to Analyses); `wiki/ROUTING.md` (route now points at promoted path); `wiki/log.md`.
- Notes: No duplicate promoted page existed (only `rpiv-pipeline.md`). Claims C-0123..C-0129 already carried `page: wiki/analyses/dsh-board-pipeline.md`, so no claim rewiring was needed. Crash-safe order: copied + set promoted frontmatter + verified target, then removed candidate. Frontmatter OKF-conformant (type, sources, `# Citations`, no `[[wikilinks]]`).

## 2026-09-04 session-update | dsh-board pipeline loop fixes + full autonomy

- Actor: Claude Code (dsh, interactive session shepherding card k881 Blocked→Archive)
- Inputs: this session's board work + committed files `dsh-board/{HANDLERS.md,preamble.md,render-jobs.sh,INSTALL.md}`, `~/.dsh/profiles/web/node_modules/@nanmicoder/dsh-agent-teams/lib/{state,scheduler,members}.js`, runtime `cron_list`/`systemctl`/`ss` observations, throwaway git ff-only tests. Commits a0a4399d, ab963f22, 136ad06d.
- Outputs: `wiki/raw/sessions/2026-09-04-dsh-board-loop-fixes.md`; `wiki/candidates/analysis-session-dsh-board-pipeline.md` (candidate); `wiki/CLAIMS.md` C-0123..C-0129 (7 claims via gate.py ADMIT); `wiki/eval/dsh-board.eval`; `wiki/index.md` candidate queue; `wiki/ROUTING.md` new "dsh-board Build Pipeline" route; `wiki/log.md`.
- Notes: Captured the board's non-obvious mechanics — handlers are agent-prose not code; HANDLERS-live-via-symlink vs preamble-frozen-in-prompts deploy split; the captain-death Build↔Decompose loop (team bound to captainSessionId, per-process scheduler dies with the tick, dependent tasks strand) and its composite-task fix; spec-committed Decompose gate; fully autonomous ff-only Merge with git-verified safety rails; cron staggering vs MiniMax 429; cron_disable persisted-override across restart; smart_restart canary-stall latency. Load-bearing claims independently verified against `state.js`/`scheduler.js`/`INSTALL.md` and observed exit codes before writing. Unresolved: composite-task + auto-merge fixes deployed but not yet exercised by an autonomous run on a fresh card (k881 was hand-driven); 4 non-blocking k881 review findings pending an optional follow-up card; smart_restart canary-stall cause unexplained.

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

## 2026-10-13

**Update** (session-update): captured the offload omp→pi migration — machine inventory, narrow rename surface, server pi 1.2.0 provisioning, untracked-extension quarantine, live itan8n smoke, and follow-up debt (pyright findings, suite hang, aidev defaultModel). Raw: `wiki/raw/sessions/2026-10-13-offload-omp-to-pi-migration.md`.

**Promote**: `wiki/candidates/analysis-session-offload-omp-to-pi-migration.md` → `wiki/analyses/analysis-session-offload-omp-to-pi-migration.md` (Branch B, frontmatter verified, indexes/routing wired, 4 claims admitted via gate, eval slice `wiki/eval/offload.eval` added).

## 2026-10-14

**Update** (session-update): captured T3 Code's provider-driver architecture and the path to enable pi as a first-party provider — drivers are compile-time (no runtime custom-provider UI), pi landed in v0.0.46+ (only nightly/preview as of 2026-10-14), PiDriver talks `pi --mode rpc` directly (no `pi-acp` adapter), and pi is OFF BY DEFAULT with the settings-form toggle hidden — enable via hand-edit of `~/.t3/userdata/settings.json`. Raw: `wiki/raw/sessions/2026-10-14-t3-code-pi-provider.md`.

**Promote**: `wiki/candidates/analysis-session-t3-code-pi-provider.md` → `wiki/analyses/analysis-session-t3-code-pi-provider.md` (Branch B fresh promotion; frontmatter, citations, OKF conformance verified; indexes `/root` and `/analyses`, ROUTING entry, and CLAIMS.md claims C-0150..C-0153 all wired to the promoted path via demote-and-re-add to recover the page field). T3 Code was switched to nightly (`t3 update --channel nightly -y`, 0.0.45 → 0.0.46-nightly.20261014.3132) and pi was enabled in `~/.t3/userdata/settings.json` (`settings.json.bak-2026-10-14` left in place). Maintenance gate (writes_since_maint=20) is due; hot/cold demote scheduled in §7b.

**Update** (session-update): captured the tralph triage-label / `.kanban` board / spec-trail work — one eligibility rule in `board.sh` behind two drivers (`ralph-loop.sh` for `--jobs 1`, `bin/gralph` for `--jobs >=2`), what board mode does not enforce (coordinator records a lane's DONE as approved with no reviewer; the enforcing design is an open decision), the fail-closed spec contracts, and gotchas (new tests skipped by `git add -A`, a failed lane only retries with `--replan`, session transcripts by `find -name`). Inputs: this session's diffs and commits `dd6444a7`..`b34dccae`, plus an independent verify of 9 claims (8 VERIFIED; 1 FALSE on the `spec-check` unknown-id detail, corrected before promotion). Outputs: raw capture `wiki/raw/sessions/2026-10-14-tralph-labels-spec-trail.md`; 6 claims admitted via gate (C-0154..C-0159); eval slice `wiki/eval/tralph-board.eval`. Unresolved: whether to add a coordinator-side reviewer; active-ticket resume skips the spec-check; `ralph-loop.service` does not pass `--spec`. Excluded: Meeting Assistant ticket specifics (061/062), test counts, reviewer model names.

**Promote**: `wiki/candidates/analysis-session-tralph-labels-spec-trail.md` → `wiki/analyses/analysis-session-tralph-labels-spec-trail.md` (Branch B fresh promotion; frontmatter, citations and OKF conformance verified before the candidate was removed; root index and `analyses/index.md` listed, route added, claims point at the promoted path).

**Lint** (wiki cleanup): structural pass over `wiki/`. Fixed: two promoted analyses missing from `wiki/analyses/index.md` (Omarchy/Surface, Projectlean SOUL); added `wiki/sources/index.md`; replaced links to repo files that are not wiki pages (`/omarchy/*.md`, `/concepts/pi-extensions.md` -> `docs/pi-extensions.md`) with plain paths. Claims: moved the `C-0001` placeholder and eleven claims whose cited sources left the live tree to `CLAIMS-cold.md` via `gate.py demote --force` (history kept): C-0111, C-0112 (rpiv-monitor skill archived 2026-06-14), C-0116, C-0117 (retired Claude Code lane), C-0123..C-0129 (dsh-board archived 2026-09-23). Hot file 39 -> 28 active of 40. Eval slice: removed the eight cases pinned only by those claims (the dsh-board `frozen` case was already failing on a case mismatch, `FROZEN` in the claim); 24/24 pass. `ROUTING.md` notes the moves. False positive: the `[[wikilinks]]` hit in this log is literal text. Deferred, not auto-fixed: C-0118 stays hot (still true, eval-pinned) but cites `.claude/skills/wiki-update/...`, whose live path is `.agents/skills/wiki-update/...`; repair is demote-and-re-add through the gate. C-0150..C-0153 cite another repo (T3 Code), so their paths are expected not to exist here, and C-0146..C-0149 are older cold copies of them. No claim was rewritten or superseded.

**Update** (session-update, T3 SSH environments): extended the existing T3 Code analysis with the loopback-only default-server adoption requirement, service PATH versus interactive PATH, repository identity and SSH-alias normalization, and resource-weighted new-thread placement. Curated raw source: `wiki/raw/sessions/2026-10-14-t3-ssh-load-balancing.md`; claim C-0160 admitted through the gate with a regression case in `wiki/eval/t3-code.eval`; root/analyses indexes and routing updated. Independent verifier timed out at 120 seconds (exit 124); documented fallback re-grounded the installed-build source and live readiness/SSH-tunnel probes. No candidate or supersession needed: cited maintenance of the existing page. Authorization codes and credentials omitted. Per-project repairs, provider authentication and project build/test readiness remain outside this capture. Scheduled demotion ran and found no eligible cold claims; the existing maintenance reminder remains, with no safe consolidation proposed.

## 2026-10-15

**Update** (maintenance, pstack removal): removed all active pstack skills and assets per ADR 0019 (supersedes ADR 0012) — 46 `.agents/skills/pstack-*` dirs, `_shared/pstack-omp-compatibility.md`, `.agents/pstack-models.md`, and the omp role agents (`pstack-{opus,sol,glm,comment-sicko}`, `poteto-agent`). Repaired the offload worker prompt and `implement` worker-rules references; dropped the stale `archive/pstack/` ignore. Edited this wiki's `analyses/analysis-session-offload-omp-to-pi-migration.md` follow-up to close the pstack audit. No new knowledge captured: the decision and scope live in committed `docs/adr/0019-remove-pstack-skills.md`, so no candidate, claim, or route was created.
