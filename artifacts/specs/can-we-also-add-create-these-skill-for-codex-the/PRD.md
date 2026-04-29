# Add Matt Pocock Engineering Skills To Codex

## Requested Outcome

Add the four upstream engineering skills from `mattpocock/skills` to this dotfiles repo as Codex skills, expose them through `/home/james/.codex/skills` symlinks, and stage them for tracking.

Target upstream skill paths:

- `skills/engineering/diagnose`
- `skills/engineering/to-issues`
- `skills/engineering/to-prd`
- `skills/engineering/improve-codebase-architecture`

## Current State

- Repo-managed Codex skills live under `.codex/skills/`.
- User-level Codex skills are exposed from `/home/james/.codex/skills/`.
- Existing repo-managed skills use absolute symlinks from `/home/james/.codex/skills/<name>` to `/home/james/dotfiles/.codex/skills/<name>`.
- `grill-me` and `windmill` were just moved into `.codex/skills/` and staged.

## Ideal State Criteria

- Each requested upstream skill exists under `.codex/skills/<skill-name>/`.
- Each skill has a valid `SKILL.md` with Codex-readable `name` and `description` frontmatter.
- Any upstream bundled resources required by the skill are preserved.
- `/home/james/.codex/skills/<skill-name>` is a symlink to the repo-managed skill directory.
- The new skill files are staged in git.
- No backup skill directories containing `SKILL.md` are left under scanned skill roots.

## Scope

In scope:

- Fetch current upstream skill files from GitHub.
- Copy/adapt only the requested four skill directories into `.codex/skills/`.
- Create or replace user-level symlinks for those four names.
- Stage the repo-local skill files and this PRD.

Out of scope:

- Editing unrelated Codex skills.
- Creating commits.
- Refactoring upstream skill wording beyond compatibility fixes required for Codex.
- Installing dependencies globally.

## Assumptions

- Use the upstream folder names as Codex skill names: `diagnose`, `to-issues`, `to-prd`, and `improve-codebase-architecture`.
- If upstream skills are already in Codex `SKILL.md` format, preserve them directly.
- If a symlink or directory with a target skill name already exists in `/home/james/.codex/skills`, inspect it before replacing it.

## Risks

- Upstream skill content may use conventions from another agent runtime; if so, minimal adaptation may be required.
- Copying incomplete directories could break a skill that references bundled scripts or references.
- Leaving real duplicate directories under `/home/james/.codex/skills` could create duplicate visible skills.

## Approach

1. Inspect upstream contents and local skill naming conflicts.
2. Copy the four upstream skill directories into `.codex/skills/`.
3. Validate each `SKILL.md` frontmatter and preserve needed resources.
4. Create `/home/james/.codex/skills` symlinks pointing to the repo-managed directories.
5. Stage the new files and verify git/index state.

## Implementation Notes

- Upstream source commit: `f71bb975bfae2dc0d31c529c7dd4a8479ecc3748`.
- The copied skills are preserved as upstream authored except for minimal Codex compatibility edits:
  - Replace unavailable `/setup-matt-pocock-skills` guidance with asking for issue tracker and triage label details.
  - Replace Claude-style `Agent tool` wording with Codex-compatible local exploration and optional Codex sub-agent wording.
  - Remove links to the sibling `grill-with-docs` skill files that were not requested for installation.

## Verification Plan

- Check each repo-local skill directory contains `SKILL.md`.
- Check `/home/james/.codex/skills/<skill-name>` resolves to `/home/james/dotfiles/.codex/skills/<skill-name>`.
- Check no target skill name is left as an unmanaged real directory in `/home/james/.codex/skills`.
- Check `git status --short` and `git diff --cached --name-status` for the new staged files.
