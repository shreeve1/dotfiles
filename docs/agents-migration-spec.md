# Task: Migrate CLAUDE.md → AGENTS.md system-wide (AGENTS standard)

Paste this whole file to a coding agent (Claude Code, Codex, pi, etc.) running on
the target machine (Mac or the n8n Linux box). It is self-contained.

## Goal
On THIS machine, ensure no *loadable agent-instruction* `CLAUDE.md` remains:
first pull already-migrated repos from their remotes, then for every genuine
`CLAUDE.md` in a working tree, either rename it to `AGENTS.md` or fold it into an
existing `AGENTS.md`. Commit per repo. **Do NOT push without asking me.**

## Why (context you need)
Codex, pi / oh-my-pi, and DeepSeek Harness (dsh) all read `AGENTS.md` natively.
Claude Code (2.x) reads `CLAUDE.md` and on some builds does NOT auto-load
`AGENTS.md` — verify on this machine if it matters (step 5). pi's context loader
uses a HARDCODED candidate list `[AGENTS.md, CLAUDE.md]` and picks the first per
directory, so the ONLY way to stop pi loading a given `CLAUDE.md` is for the file
not to exist. Hence: eliminate the files.

## Set your roots
    ROOTS="$HOME"        # add project roots, space-separated, e.g.:
    # Mac:   ROOTS="$HOME $HOME/1-testytech $HOME/prototype"
    # Linux: ROOTS="$HOME /srv /opt/projects"   # wherever your repos live

## Step 0 — Scan (case-insensitive), then classify. Do NOT rename yet.
    for R in $ROOTS; do
      find "$R" -type d \( -name .git -o -name node_modules -o -name site-packages \
        -o -name .venv -o -name .cache \) -prune -o -iname 'claude.md' -type f -print
    done

EXCLUDE (never touch — regenerated, or not agent files):
- Under node_modules/, site-packages/, .venv/, .cache/, any pnpm/npm/uv store,
  ~/.claude/MEMORY/, Trash / .Trash, and anything already under an `archive/` dir.
- FALSE POSITIVES that are NOT agent instructions — leave them:
  - `**/popular-web-designs/templates/claude.md` — a web-design brand reference
    beside apple.md/airbnb.md; it starts "# Design System".
  - Files whose basename only *ends* in "claude.md" (e.g. `SuperClaude.md`,
    `Gemini+claude.md`). Only act when the basename is EXACTLY `CLAUDE.md`.
- When unsure, OPEN the file: convert only if the content is agent/project
  guidance (commands, architecture, conventions, "guidance to Claude Code").
  Skip design docs, brand guides, brand-named templates, or arbitrary data.

## Step 1 — Pull already-migrated repos (fast-forward only)
For each git repo under your roots that has a remote:
    git -C <repo> pull --ff-only
This pulls CLAUDE.md→AGENTS.md renames already pushed from the main machine
(pi-rmm, homelab [main + feat/migrate-qbittorrent-to-gluetun], symphony,
cleon-ui-claude, cleon-ui-pi, 3cx-web-chat, and any others with a shared remote).
If a pull refuses (divergence), STOP and report that repo — do not merge/rebase.

## Step 2 — Convert remaining genuine CLAUDE.md, per repo
For each genuine `CLAUDE.md` still present after the pull:
- If NO `AGENTS.md` in the same directory:
    git -C <repo> mv CLAUDE.md AGENTS.md       # or plain `mv` if untracked / no-git
- If an `AGENTS.md` already exists (MERGE — never clobber):
    - If AGENTS.md is just a pointer ("read CLAUDE.md ..."), replace it with
      CLAUDE.md's full content.
    - Else fold CLAUDE.md's unique sections into AGENTS.md (drop duplicated
      sections; delete now-wrong "supplements/see CLAUDE.md" lines), remove
      CLAUDE.md.
- Fix files that REFERENCE the renamed file by path (a SKILL.md pointing at
  `templates/CLAUDE.md`, a hook comment, a doctor script). Leave generic
  "CLAUDE.md / AGENTS.md as a concept" mentions alone.
- Commit ONLY the rename/merge — do not sweep unrelated working-tree changes:
    git -C <repo> commit -m "chore: rename CLAUDE.md -> AGENTS.md (AGENTS standard)"

## Step 3 — Non-default branches (ASK first)
If a repo tracks CLAUDE.md on non-default branches (feature/agent branches), LIST
them and ask before converting — they aren't loaded unless checked out, and many
are ephemeral. Convert only on explicit approval (use a temporary worktree:
`git worktree add /tmp/wt <branch>`, rename+commit there, then
`git worktree remove`).

## Step 4 — dsh config (ONLY if this machine runs dsh)
If `~/.dsh/profiles/web/cordis.patch.yml` exists, append this block so dsh stops
reading CLAUDE.md entirely (its default is `[AGENTS.md, CLAUDE.md]`):

    - id: agent-instructions
      config:
        instructionFileCandidates: ["AGENTS.md"]
        localInstructionFileCandidates: ["AGENTS.local.md"]

Back the file up first, confirm it's still valid YAML, then restart dsh
(`dsh web`, or the host's smart-restart). If this machine does NOT run dsh, skip.

## Step 5 — Claude Code check (if Claude Code is used here — esp. the Mac)
In a temp git dir containing ONLY an `AGENTS.md` with a unique marker:
    claude -p "reply SEEN if <marker> is in your context, else NOTSEEN"
If NOTSEEN, this Claude Code build does not auto-load AGENTS.md. For any repo you
actively drive with Claude Code, either keep a `CLAUDE.md` symlink
(`ln -s AGENTS.md CLAUDE.md`) or accept it loads no project doc there.

## Step 6 — Verify
Re-run the Step-0 scan. Confirm zero genuine agent-instruction `CLAUDE.md` remain
in working trees (only excluded/false-positive categories may remain). Report:
what was renamed/merged, what was excluded and why, which repos have commits
awaiting my push, and anything ambiguous you skipped.

## Hard rules
- Never push without explicit approval.
- Never commit my unrelated uncommitted work — commit only the rename/merge.
- Fast-forward pulls only; stop and report on divergence.
- When a file's nature is ambiguous, SKIP it and list it — do not guess.

---
Note: the dotfiles repo's own migration IS now committed and pushed (repo-root
CLAUDE.md -> AGENTS.md, install.sh/README/docs updates, and the .claude->archive
experiment). So `git pull --ff-only` on the dotfiles clone here brings it in.
After pulling dotfiles, if the Claude Code lane was in use on this machine you may
want to re-run `bash install.sh` (it now skips the archived .claude links). The
dsh `instructionFileCandidates` config (step 4) is per-machine and is NOT carried
by the dotfiles pull — apply it locally only if this machine runs dsh.
