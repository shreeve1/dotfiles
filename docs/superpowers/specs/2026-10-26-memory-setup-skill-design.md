# memory-setup skill: give any folder memory, or move old knowledge into it

Date: 2026-10-26. Source repo: `~/starter-agent` (pushes to `shreeve1/starter-agent`). Dotfiles copies from it.

## Intent

The wiki-to-memory migration (`2026-10-25-wiki-to-memory-migration-design.md`, ledger in `.superpowers/sdd/2026-10-25-wiki-to-memory-migration/progress.md`) was done nine times by hand. The procedure, the sorting brief and the rulings learned along the way live in `/tmp`, a ledger and one session's context. A future session asked to "set up memory here" or "bring my old notes/wiki across" should find all of it in one skill.

James shares the starter-agent with friends and family, for personal and work use. The skill must not predict what kind of project it is. It tells a future AI session how to work out the situation from what is in the folder and what the owner says, then guides it through.

## Goals

- One new skill, `memory-setup`, in `~/starter-agent/.agents/skills/memory-setup/`, whose only job is: give a folder memory, and/or move existing knowledge into that memory.
- It handles any source: nothing, an old agent setup (instructions files, ChatGPT or Claude saved memories, custom instructions), loose notes or exports (Obsidian, Notion, a docs folder), or an LLM wiki inside a code repo.
- It works in plain Claude Cowork with no git, no Python and no subagents. Git, Python scripts and parallel subagents are speedups when present, never requirements.
- The starter-agent is the single source of `personal-memory` and `memory-setup`. Dotfiles gets byte-identical copies through a small sync script, with no hand adaptations.
- Setup README "First setup" steps 3-6 call `memory-setup` instead of spelling out the work, so a new workspace and an existing folder follow the same path.

## Non-goals

- No change to everyday capture (`personal-memory` SKILL.md behaviour), the memory layout, templates or the audit rules.
- No new memory features (no new note types, folders or schema keys).
- No new Release number; this is a "Local changes" entry (see Decisions).
- Not migrating any more projects now; pi-rmm, symphony and openwork keep their wikis.
- No automation that runs without the owner: no hooks, no scheduled jobs.

## Anti-goals (would be a failure even if it works)

- A skill that only works on James's machines (assumes `~/.agents`, git, subagents, `ssh`, GitHub).
- A skill that drops or deletes the owner's content without showing it first and getting an OK.
- Jargon a friend can't follow in what the agent says to the owner ("claims", "OKF", "verdict counts") without a plain explanation.
- Two copies of `personal-memory` drifting again.
- `memory-setup` triggering on "remember this" (that stays `personal-memory`).

## Constraints

- Windows and Cowork first; PowerShell and POSIX both work. Paths may contain spaces.
- Python 3.11+ standard library only (`CODING_STANDARDS.md`); a `reviewer` agent reviews skill-script diffs before commit.
- Hooks are off in James's starter-agent workspace: run `python .githooks/pre-commit` by hand before each commit (secret scan, memory audit, every `.agents/skills/*/tests`).
- Shipped files hold no personal content. `MANIFEST.json` records every shipped file with class and sha256 (LF-normalised).
- Git safety in someone else's dirty repo: never stash, reset, restore, checkout or clean; stage only your own paths.

## Approaches

- **A. A page in `.agents/setup/`.** Close to the material it builds on, but setup step 10 deletes `.agents/setup/` once a workspace is set up, so later sessions can't find it; dotfiles would copy a non-skill folder. Rejected.
- **B. Extend `personal-memory`.** Nothing new to sync, but its description would have to trigger on setup and migration as well as "remember this", mixing a daily skill with a one-off procedure. Rejected.
- **C. New skill `memory-setup` next to `personal-memory`.** Survives setup, stays out of daily capture, reuses `personal-memory`'s scaffold and scripts. **Chosen by James.**

## Design

### Skill layout

```
.agents/skills/memory-setup/
  SKILL.md              procedure (below)
  where-things-go.md    destination table (moved from setup README)
  tracking-model.md     Client Memory question (moved from ADAPTING.md)
  sorting.md            verdicts, the bar for keeping, how to present the sort
  subagent-brief.md     template brief for parallel sorters (optional speedup)
  code-repos.md         extra steps when the folder is a code repo or the source is a wiki
```

No new scripts. The `personal-memory` scripts (`indexes.py`, `hubs.py`, `gate.py`) do the generated files and the check; without Python the skill says how to write index rows by hand, as setup step 6 does today.

### SKILL.md

Frontmatter description triggers on: set up memory in this folder/project/repo, give this project memory, migrate or bring across an old wiki, notes, saved memories or agent setup into memory. It says it is not for saving a single fact (that is `personal-memory`).

The procedure, written as judgment with checkpoints, not a checklist:

1. **Look at what's there.** The target folder (is there already a `memory/`? an `AGENTS.md`/`CLAUDE.md`? is it a git repo? is it code?), and the source the owner names, if any. Ask the owner what they want remembered and where the old material is; ask them to paste or export anything an app keeps out of reach (ChatGPT memories, Claude project instructions). Check which tools exist only when a step needs them, and never install anything without the owner's OK.
2. **Settle where the skills live** (see "Skill reachability" below) and **the tracking model** (`tracking-model.md`): what people or things the owner keeps coming back to. This comes before sorting so tracked facts have a home.
3. **Set up memory** if there is none: copy `personal-memory/scaffold/` to `memory/`, set `memory/schema.json` (topics, `client_folder`, `client_subjects`), paste the `AGENTS-memory.md` sections into the folder's instructions file (create `AGENTS.md` if none; keep everything else in an existing one), add `memory/raw/` to `.gitignore` in a git repo. A folder that already has `memory/` skips this step.
4. **Code repos and wikis:** read `code-repos.md` now (pre-flight before sorting).
5. **Sort** the source with `sorting.md`. Small sources: sort in the session. Large ones (rule of thumb: more than ~100 items or pages) with subagents: split into batches and dispatch read-only sorters with `subagent-brief.md`, then spot-check their output. Without subagents: same verdicts, done in batches in the session.
6. **Show the owner** the sort (`sorting.md`, "Presenting"): kept items grouped by destination, dropped items counted by reason with examples, backlog items with where they'd go. Ask once per group. Nothing is written or deleted until the owner says OK.
7. **Write** the approved notes with `personal-memory` templates: one `memory/rules.md` row per kept note that a task should load, glossary rows, index rows. Run `indexes.py`, `hubs.py`, then `gate.py --memory memory audit` until it exits 0 (Python present); otherwise write rows by hand.
8. **Retire the source** only if it lived in the folder and the owner agreed: archive anything not committed, then remove it; repoint live references (`code-repos.md`). An external source (another app, the old workspace) is never edited or deleted.
9. **Check and finish.** Run the project's tests if code changed. In git: stage only your own paths, commit (hooks run; never `--no-verify`), push only if the project already pushes and the owner agrees. Tell the owner in plain words what moved where, what was left behind and why.

### Reference files

- **`where-things-go.md`**: the current setup README table, unchanged in substance, plus rows learned in the migration: a not-yet-built plan or decision goes to the project's own backlog or issue tracker (not memory); a fact the project's docs or code already state is linked, never copied. Rows that only apply to a full starter workspace (own skills, old copies of shipped skills, documents and the folder map) are marked "workspace only".
- **`tracking-model.md`**: ADAPTING.md's "Tracking model" section moved verbatim; ADAPTING.md keeps a one-line pointer to it.
- **`sorting.md`**: one verdict per item:
  - `covered <where>`: the folder's own docs, code or existing memory already say it.
  - `stale <why>`: no longer true, contradicted now, or about something retired.
  - `history <why>`: true once but a one-off (timeline, status snapshot, count, "as of").
  - `meta`: about the old system itself (its registry, gates, ingest).
  - `backlog <where>`: a plan or decision for something not built yet.
  - `keep <destination> <slug>`: becomes a note; destination from `where-things-go.md`.
  - `client <short> <subject> <slug>`: a lasting fact about one tracked person or thing.
  - `glossary <term> | <meaning>`: a shorthand name.

  The bar for `keep`/`client`: still true now (re-checked against the current folder), not already stated elsewhere, and something a future session would get wrong and couldn't cheaply rediscover. The bar is the rule, not a quota; say that a wiki usually keeps well under 15%, while a person's own saved instructions keep most. Related items group under one slug. Credentials never cross. "Presenting" covers how to show the owner the sort in plain words, explaining what each drop reason means.
- **`subagent-brief.md`**: the itastack brief (`/tmp/opencode/ita/brief.md`, `brief-pages.md`) generalised: placeholders for source path, read-only copy, folder description, docs to check, retired things, batch file and output path; same output format (Counts, Notes proposed, Glossary proposed, Backlog, Verdicts). Rules: sorters are read-only and write only their output file.
- **`code-repos.md`**: the lessons that only apply to a code repo or a wiki source:
  - Pre-flight: find everything that reads the old source before removing it: code imports and tools, container mounts, CI, scripts, and agent or assistant configs inside and outside the repo (for itastack, Nathan's Hermes files). Each one is repointed, removed with the source, or blocks removal; tell the owner which.
  - Dirty repo: list foreign changes first; archive uncommitted edits to the source (tarball outside the repo) before removing it; never stash, reset, restore, checkout or clean; stage only your own paths.
  - Live references (instructions, docs, skills, configs) to removed pages: repoint to the memory note or the real doc, or, when the page is only history, to a permalink at the last commit that had it (when the repo has a web remote); otherwise remove the pointer. Historical mentions (old plans, changelogs, ADRs) stay.
  - Instructions that said "update the wiki" now say "run the memory check".
  - Run the test suite after removing code that served the old source.

### Skill reachability (who can run the scripts)

`AGENTS-memory.md` and the skills must name a path that works where the folder is used:

- Global skills exist (`~/.agents/skills/personal-memory/`, James's machines): the folder's instructions point there; nothing is copied.
- The folder is the starter workspace itself: its `.agents/skills/` already has the skills.
- Otherwise (a friend's separate project folder): ask the owner whether to copy `personal-memory` into the folder's `.agents/skills/` (self-contained; Codex and Claude Code find it; Cowork needs a loader) or to always open the folder together with their workspace. Recommended: copy, and tell them an update of their workspace won't update the copy.

`AGENTS-memory.md` uses a `<skills>` placeholder that step 3 fills in with the chosen path, instead of a hard-coded `~/.agents/skills`.

### Making `personal-memory` identical in both places

The real drift (formatting ignored) is small. Each difference gets one version that works in both:

| Difference | Resolution |
|---|---|
| Script formatting | Starter scripts formatted with `ruff format` and the E741 names renamed, as dotfiles already did; dotfiles' style check then passes on a plain copy. |
| `gate.py` skill lookup (`root` only vs `root` + `Path.home()`) | Look under the project root, `Path.home()`, and the skills folder the script itself sits in (`Path(__file__).resolve().parents[1]`). |
| `gate.py` "git keeps it" messages | Say "git keeps it" only when the project is a git repo; otherwise drop the clause. |
| "Generated by" lines in `hubs.py`, `indexes.py` | Path-neutral: "Generated by the `personal-memory` skill (`hubs.py`)". Existing generated files change on next run; the audit ignores this line. |
| SKILL.md Scope paragraph | One paragraph: scripts live in this skill's folder; run them from the project root; git optional; hooks only where the workspace enables them. |
| SKILL.md Weekly Sweep | Kept; opens with "Only where a scheduled sweep is set up (`WEEKLY-SWEEP.md` in a starter workspace)". |
| IT-specific lines in the starter SKILL.md (the `halo`/`365` subject example) | Made generic (James): a neutral example of adding a subject that fits what the owner tracks. James's halo/365 specifics move to a memory note in his starter workspace. References to shipped skills such as `startday` stay, worded "where used". |
| `sweep.py` only in starter | Ships in both. |
| `scaffold/` only in dotfiles | Moves into the starter's `personal-memory/scaffold/` unchanged. It is the project-flavoured starting copy (neutral, no workspace or Codex lines) and is deliberately *not* kept identical to the workspace's own `memory/README.md` and `TEMPLATES.md`, which are the fuller workspace contract (Ticket Guides, Data Classes). A fresh starter workspace already has `memory/`, so it never uses the scaffold. No match test. |
| Command paths in SKILL.md and `reference.md` (`python3 .agents/skills/...` vs `python3 ~/.agents/skills/...`, about a dozen places) | One line near the top defines `<skills>`: the folder holding this skill's folder (`.agents/skills` in a workspace or a project copy, `~/.agents/skills` for a global install). Every command uses `python3 <skills>/personal-memory/<script>.py`, run from the project root. `AGENTS-memory.md` gets the real path written in at setup (step 3). |
| `reference.md` Setup Workflow | Replaced by a pointer to `memory-setup`; Recovery and Lint workflows stay, with the dotfiles wording (scaffold copy). |

### Dotfiles sync

- `bin/sync-starter-skills` copies `~/starter-agent/.agents/skills/{personal-memory,memory-setup}/` over dotfiles' `.agents/skills/` copies (delete files that no longer exist there; skip `__pycache__`), then prints `git diff --stat`. Fails clearly if `~/starter-agent` is missing. Run by hand; no hook or cron.
- `.styleignore` keeps `scaffold/**`; add `memory-setup/**` only if the style check rejects its tables.
- A dotfiles memory note plus `memory/rules.md` row: "Editing `personal-memory` or `memory-setup`": edit in `~/starter-agent`, commit there, then run `bin/sync-starter-skills`. Not in `AGENTS.md` (paid every turn).
- `tests/personal-memory.test.sh` keeps running the skill's tests.

### Setup README changes (starter-agent)

- "First setup": steps 3-6 become one step: "Run the `memory-setup` skill for this workspace, with the old setup as the source (or none)." Steps 1-2 and 7-10 stay.
- "Where things go" is replaced by a pointer to `memory-setup/where-things-go.md`.
- `ADAPTING.md` "Tracking model" becomes a pointer to `memory-setup/tracking-model.md`; ADAPTING's opening line still says the tracking model comes first.
- "A newer version arrived" and "Skills in the owner's app": unchanged. The Cowork loader step already loops over every skill folder, so `memory-setup` gets a loader on the owner's yes, and an update adds loaders for new skills.
- `START-HERE.md`: one line under "First setup" telling owners they can later ask "set up memory in `<folder>`" for any other project.

### Records

- `MANIFEST.json`: add every new file (`memory-setup/*`, `personal-memory/scaffold/*`) as `merge`; update sha256 for each changed file (LF-normalised, as `MANIFEST.md` says). A short snippet computes them; there is no generator script.
- `CHANGELOG.md` "Local changes": one entry describing the new skill, the setup README change and that the two `personal-memory` copies are now one.

## Decisions (Claude's calls, for James to check)

- Spec lives in dotfiles, not the starter-agent, so it doesn't ship to friends.
- No new script in `memory-setup`; `personal-memory`'s scripts are enough.
- Verdict `note` is renamed `keep` (plain word for friends); otherwise the itastack verdicts unchanged, plus `glossary`.
- "Local changes" entry, not Release 6.
- Sync is a by-hand script from starter-agent to dotfiles, one direction only.
- The scaffold stays the neutral project version; the workspace's own `memory/README.md` and `TEMPLATES.md` are not forced to match it (that would either push workspace lines into every project or rewrite the shipped templates, which the non-goals rule out).
- SKILL.md commands use a `<skills>` placeholder defined once at the top.
- Dry runs are done by a fresh subagent that is given only the skill folder and a scratch folder under `/tmp/opencode/`, so they test whether the skill works for someone who wasn't in this conversation. They leave nothing in either repo; their findings feed fixes before the final commit.

## Left to the builder

- Exact wording of SKILL.md and reference files (follow `writing-for-agents`), keeping SKILL.md short and pushing detail into the reference files.
- Test shape for the `gate.py` lookup and message changes and the scaffold-match test.
- Whether the sync script is bash or Python (dotfiles convention).
- Order of commits across the two repos (starter first, then dotfiles sync).

Pushing (James): once the dry runs and checks pass, push the starter-agent to `shreeve1/starter-agent` (this publishes to friends), then sync, commit and push dotfiles and pull on the other machines.

## Done when

- `memory-setup` exists in the starter-agent with the files above; `python .githooks/pre-commit` passes; a reviewer has read the script diffs.
- A dry run of `memory-setup` against a scratch folder with a few pasted "ChatGPT memories" and no Python sets up memory by hand and shows a sort before writing.
- A dry run against a scratch git repo with a small fake `wiki/` runs the pre-flight, archives, writes notes and passes `gate.py audit`.
- `bin/sync-starter-skills` leaves dotfiles' two skill folders byte-identical to the starter's; `bash tests/run-all.sh` passes in dotfiles; existing projects' `gate.py audit` still exits 0 (dotfiles, homelab, itastack spot-check).
