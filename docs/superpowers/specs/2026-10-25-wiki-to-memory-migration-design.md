# Wiki to Memory Migration — Design

Date: 2026-10-25. Status: draft for James's approval.

## Intent

James's starter agent (`~/starter-agent`) has a memory system that works well in personal bots: a `CONTEXT.md` of shared terms, a `memory/` folder whose index, glossary and rules are read at the start of every session, and the `personal-memory` skill, which captures durable facts at the end of every task without asking. Memory grows from what James asks of a project and works out in it.

The project wikis (`llm-wiki-setup` + `wiki-update`) do the same job worse: reads are conditional, writes go through raw captures, candidates, promotion and a claim gate, and pages and claims only grow. Several wikis are stale (symphony, pi-rmm since July; cliproxyapi, openwork, tatoo never committed) and homelab holds 477 claims and 199 raw session files.

This project migrates every project wiki to the starter-agent memory system and removes the wiki system entirely, so there is one way to remember things and no leftover to confuse an agent.

## Goals

- Every project that has a wiki ends with a `memory/` folder in the starter-agent layout, holding the still-true, durable content of its wiki.
- Each project's `AGENTS.md` (or `CLAUDE.md`) carries the starter agent's session-start read and end-of-task capture rules, adapted to the project.
- One `personal-memory` skill, in dotfiles, used by every project.
- No wiki remains: no `wiki/` folders, no wiki skills, no wiki instructions, no wiki scripts.

## Non-goals

- No change to `~/starter-agent`. It is James's template; he updates it himself.
- No change to `~/testy-bot` outside `testy-bot/resume/`. Testy-bot keeps its own vendored `personal-memory` and follows starter-agent Releases.
- No git hooks. No `.githooks/` in projects and no global `pre-commit`. The memory audit is run by the agent, as the skill already says to.
- No global memory rule in `~/.agents/AGENTS.md`. Rules live in each project's own instructions file.
- No shared cross-project memory store. A fact about project B learned in project A is written into B's `memory/` (B is a sibling under `~/`).
- No Hermes changes. The default Hermes agent (`~/.hermes/SOUL.md`) is being retired; the media profile, the one still in use, has no references to the project wikis. Other profiles (genops, projectlean, personal) are left as they are.
- `openwork` is out of scope: no longer used, left untouched.

## Anti-goals

- Bulk-converting claims into notes. A 1:1 claim→note dump recreates the bloat. Migration is by judgment: only what is still true and would help a future session.
- Keeping the wiki "just in case". Git history, or a tarball for non-git projects, is the way back.
- Memory that depends on git. Git is a nice-to-have: when a project is a repo, memory changes are committed; when it is not, memory works the same with no history.
- Personal or starter-agent-specific content leaking into the dotfiles skill copy (Releases, Editions, Codex workspace notes, client-only wording that does not apply).

## Approaches considered

1. **Run the full starter-agent setup per project.** Copies the whole Release (~40 skills, video tooling) into a fresh folder. Rejected: wrong for code repos, and the setup builds a new folder rather than upgrading in place.
2. **Install the memory core in place and migrate by judgment.** Chosen. Each project gets the `memory/` scaffold and the `AGENTS.md` memory sections; an agent sorts the wiki content into notes using the starter agent's "Where things go" table.
3. **Scripted claim→note conversion.** Rejected: fast but produces hundreds of unpruned thin notes.

Skill location: **one copy in dotfiles** (`~/dotfiles/.agents/skills/personal-memory/`, reached on every machine through the `~/.agents/skills` symlink), chosen over a vendored copy per project to avoid ~10 drifting copies. Memory rules: **in each project's own instructions file**, chosen over the global `AGENTS.md`, so a project carries its rules with it.

## Constraints

- `~/.agents/skills` → `~/dotfiles/.agents/skills`; that is where the shared skill lands. Dotfiles syncs via `origin/main` (pull --rebase before, push after).
- Global `core.hooksPath` is `~/.config/git/hooks` (graphify). Do not touch it.
- Dotfiles checks: `style-check` and `bash tests/run-all.sh` before pushing (dotfiles `AGENTS.md`).
- cliproxyapi and tatoo are not git repos and stay that way. Their memory works without history. Back their `wiki/` up to a tarball (e.g. `~/wiki-archive/<project>-wiki.tar.gz`) before deleting, since git cannot recover it.
- Homelab's live Prometheus (CT 127, `10.20.20.40`, access in `homelab/hosts/lxc-monitoring.md`) loads 10 alert rules whose `runbook` annotation points at `https://wiki.testytech.net/...`, which does not resolve. See "Homelab extra" in Part 2.
- `~/dotfiles-drawio` is a worktree of dotfiles on branch `drawio-skill`; its `wiki/` disappears when that branch merges or rebases onto main. Do not edit it separately.

## Part 1: the dotfiles skill copy

Copy `~/starter-agent/.agents/skills/personal-memory/` (SKILL.md, reference.md, the five scripts, `tests/`) into `~/dotfiles/.agents/skills/personal-memory/`, then adapt:

- **Script paths.** Every `python3 .agents/skills/personal-memory/<script>.py` becomes `python3 ~/.agents/skills/personal-memory/<script>.py`, run from the project root. Scripts already default `--memory memory` relative to the working directory, so no code change is needed for that.
- **Skill lookup in `gate.py`.** The rules audit fails a `memory/rules.md` row naming a skill not found under `<project>/.agents/skills/`. Projects use global skills, so the check must also accept `~/.agents/skills/<name>/SKILL.md`. This is the one expected code change; add a test for it.
- **Remove starter-agent-only material:** Codex workspace / disabled-hooks lines, Release/Edition references, hooks references, and anything about `startday` that does not apply. Keep Client Memory: it is the right shape for things a project keeps coming back to (hosts, services, clients), as testy-bot already does with `client_folder: projects`.
- **`reference.md` Setup Workflow** becomes the per-project install procedure for Part 2 (create scaffold, `.gitignore` lines, add `AGENTS.md` sections). No hooks step.
- Existing references to the shared verify helper (`../_shared/verify-claims.md`) are fine to keep if the copy references it; otherwise not needed.
- **Git optional.** Rewrite the skill so git is a nice-to-have: "commit at end of task" and "the commit message is the log" apply only when the project is a git repo; otherwise capture ends after the audit. Conflict resolution stays "overwrite in place" either way. `gate.py`, `hubs.py` and `indexes.py` must work outside a repo (check; fix if they call git). The `AGENTS.md` sections in Part 2 step 4 follow the same rule.
- **Drop the Weekly Sweep and `sweep.py`** (and its test) from the copy. It deletes `.sessions/` and `artifacts/` files older than 90 days, and homelab and pi-rmm track those. (Builder's call; James did not ask for scheduled pruning.)

Templates the skill points at (`memory/README.md`, `memory/TEMPLATES.md`, `memory/schema.json`) are per project, copied from the starter agent and trimmed the same way.

## Part 2: per-project install and migration

Projects, in order. Pilot first; homelab last because it is largest.

| Order | Project | Instructions file | Wiki size | Notes |
| --- | --- | --- | --- | --- |
| 1 (pilot) | `pi-durable` | `AGENTS.md` | 18 pages, 43 claims | active, has `CONTEXT.md` |
| 2 | `dotfiles` | `AGENTS.md` | 17 pages, 48 claims | also hosts the skill |
| 3 | `3cx-web-chat` | `AGENTS.md` | 51 pages, 120 claims | |
| 4 | `pi-rmm` | `AGENTS.md` | 32 pages, 107 claims | stale since July |
| 5 | `symphony` | `AGENTS.md` | 95 pages, 115 claims | stale since July |
| 6 | `tatoo` | `CLAUDE.md` | 37 pages, 6 claims | not a git repo |
| 7 | `cliproxyapi` | `AGENTS.md` | 21 pages, 7 claims | not a git repo |
| 8 | `testy-bot/resume` | `AGENTS.md` | small | nested repo inside testy-bot |
| 9 | `homelab` | `AGENTS.md` | 111 pages, 477 claims | also `scripts/wiki/` |

Per project:

1. **Install scaffold.** `memory/` with `README.md`, `TEMPLATES.md`, `schema.json`, `index.md`, `glossary.md`, `rules.md`; topic folders created only as content needs them. `.gitignore` adds `memory/raw/`. Keep the existing `CONTEXT.md`; create one only if migrated content needs it.
2. **Settle the tracking model** per the starter agent's `ADAPTING.md` "Tracking model": what the project keeps coming back to (homelab: hosts and services; 3cx-web-chat: possibly customers). Set `client_folder` and `client_subjects` in `schema.json`, or leave Client Memory unused.
3. **Sort the wiki** with this mapping (from `.agents/setup/README.md` "Where things go"):

   | Wiki part | Destination |
   | --- | --- |
   | Active `decision` claims | `memory/decisions/<topic>/decision-<slug>.md` |
   | Active `gotcha`, `config-fact` claims | `memory/docs/<slug>.md`, or Client Memory when about a tracked thing |
   | Active `runbook-step` claims | `memory/workflows/<topic>/<slug>.md` |
   | `concepts/`, `analyses/` pages | Split into the above, one subject per note, ≤6144 bytes |
   | `entities/` | `memory/glossary.md` rows, plus a doc or Client Memory note where needed |
   | `sources/` summaries | Dropped unless they state a durable fact not elsewhere; then a doc note pointing at the real source path |
   | `ROUTING.md` branches | `memory/rules.md` rows, only where a task type genuinely needs specific files |
   | Superseded claims, `log.md`, `raw/sessions/`, `candidates/`, `eval/`, `.gate-state.json`, `CLAIMS-cold.md` | Dropped; git history keeps them |
   | `raw/` source documents still referenced by a note | Moved to a project docs folder (e.g. `docs/sources/`), not into `memory/` |

   Every kept item is re-grounded against the current repo before writing; a claim the code now contradicts is dropped. Facts the repo's own docs already state are not copied (link instead).
4. **Instructions file.** Replace the `LLM Wiki` section (homelab marks it with `<!-- wiki:start -->`) with the starter agent's "DO THIS FIRST" step, the "Memory capture: check at the end of every task" section and the "Personal workspace memory" section, adapted: skill path `~/.agents/skills/personal-memory/`, no hooks, no Codex/Release lines. Keep everything else in the file. Do not add the starter agent's non-memory rules (discussion-is-not-approval, commit-every-task, etc.) unless the project already has them.
5. **Review before deleting.** Show James the plan for the project in one message, grouped by destination, with counts and a list of what is dropped. Proceed on his OK. Ask about single items only when one is a judgment call he must make.
6. **Write, audit, delete.** Write the notes, run `indexes.py`, `hubs.py`, `gate.py --memory memory audit` until clean. Back up the wiki if the project is not a git repo, then delete `wiki/` (and `homelab/scripts/wiki/`).
7. **Fix live references, leave historical ones.** Live = anything an agent or a person follows today: instructions files, `hosts/`, `services/`, `docs/` outside `docs/archive/`, scripts. Repoint those to the memory note or real source, or remove the pointer. Historical = ADRs, `docs/archive/`, `.sessions/`, `artifacts/`, `archive/`: left as they are. Claim IDs (`C-0307`) in code comments and test fixtures are left as they are; they are historical citations, and git history still resolves them. (Builder's call.)
8. **Commit** if the project is a git repo: `memory: migrate wiki to memory`. Push where the repo already pushes to GitHub (homelab, pi-rmm, symphony, 3cx-web-chat, dotfiles); do not push pi-durable (its only remote is the retired omarchy laptop) or testy-bot/resume (no remote). Report what moved, what was dropped and why. (Builder's call.)

The pilot (pi-durable) is reviewed with James before the rest proceed; adjustments go into this procedure.

### Homelab extra: Prometheus runbook links

10 live rules (checked 2026-10-25 via `/api/v1/rules` on CT 127) carry a `runbook` URL into the wiki:

- `inertness-alerts.yml`, 7 rules (`HomelabStackRouterDown`, `HermesGatewayInert`, `HermesDispatcherProgressInert`, `HermesDispatcherProbeFailed`, `HermesDispatcherWatchdogAbsent`, `CT127ObservabilityReconcileFailed`, `WazuhDeliveryStalled`) → `/concepts/remediation-loop.md`. The test fixture `_test-fixtures/inertness-alerts_test.yml` repeats that URL 13 times.
- `wan-failover-alerts.yml`, 3 rules (`AidevWanFailoverStuckOnCellular`, `AidevWanFailoverStandbyDown`, `AidevWanFailoverCheckerStale`) → `/entities/hosts/aidev.md`. `AidevWanFailoverStandbyDown` was firing when checked.

Repoint before deleting the wiki:

1. WAN failover rules → the existing `## WAN failover (RNDIS tether)` section of `hosts/aidev.md`.
2. Inertness rules → a new `docs/runbooks/observability/inertness-alerts.md`, written from the still-true triage parts of `wiki/concepts/remediation-loop.md` (36 KB, mostly history of a retired engine) and `docs/adr/0028-inertness-detection-design.md`. It is a runbook a person follows during an alert, so it goes in `docs/`, not `memory/`.
3. URL form: the GitHub URL of the target file in `shreeve1/homelab`, with a section anchor, since `wiki.testytech.net` does not resolve. (Builder's call.)
4. Update the test fixture to match, run `promtool test rules` on the changed files, deploy per the monitoring README's "Deploy packet" section, reload Prometheus, and re-query `/api/v1/rules` to confirm no annotation still contains `wiki`.

## Part 3: remove the wiki system from dotfiles

After all projects are migrated:

- Delete `.agents/skills/llm-wiki-setup/` and `.agents/skills/wiki-update/`.
- Delete `.hermes/projectlean/skills/llm-wiki-setup/` and `.hermes/projectlean/skills/wiki-update/`, and update whatever in `.hermes/projectlean/` (manifest, installer, templates, tests) installs or names them.
- Remove the `.gitignore` lines for `.hermes/skills/llm-wiki-setup/` and `.hermes/skills/wiki-update/`, and `wiki/graphify-out/cache/` once the dotfiles wiki is gone.
- Replace the `## Wiki` section of `~/dotfiles/AGENTS.md` (dotfiles' own project file) as in Part 2 step 4. `~/.agents/AGENTS.md` (global) gets no memory rule; check it for wiki mentions and remove them.
- Sweep remaining references: `.agents/skills/research/SKILL.md` (names `wiki-update`), any other skill or doc naming `llm-wiki-setup`, `wiki-update`, `CLAIMS.md` or `wiki/index.md`. Leave graphify's `--wiki` export flag alone; it is a graphify feature, not this system.
- Run `style-check` and `bash tests/run-all.sh`; commit and push per the dotfiles sync rule.

## Done when

- `rg -l 'llm-wiki-setup|wiki-update|wiki/index.md|CLAIMS.md'` across `~/dotfiles` and every migrated project returns nothing outside the historical paths of Part 2 step 7 (ADRs, `docs/archive/`, `archive/`, `.sessions/`, `artifacts/`, `docs/superpowers/`) and claim-ID citations in code.
- No `wiki/` folder in any of the nine migrated locations (`dotfiles-drawio` clears when its branch catches up with main).
- Live Prometheus `/api/v1/rules` returns no annotation containing `wiki`.
- `gate.py --memory memory audit` exits 0 in every project.
- `~/starter-agent` has no changes (`git -C ~/starter-agent status` clean of this work).

## Left to the builder

- Topic names per project in `schema.json` (start from the starter agent's list; add with James's OK).
- How to split large analysis pages into notes.
- Wording of the adapted `AGENTS.md` sections, within the constraints above.
