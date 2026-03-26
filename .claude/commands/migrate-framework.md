---
name: migrate-framework
description: Post-framework-creation migration tool. Migrates existing project skills to the new domain skill, converts SKILL.md to commands, and updates all references to use the new framework.
argument-hint: [domain-skill-name]
model: sonnet
hooks:
  Stop:
    - type: command
      command: "ls -la ~/.claude/skills/_archived/ 2>/dev/null | tail -10; ls -la .claude/commands/ 2>/dev/null | tail -10"
---

# Purpose

Run this command AFTER `/cc-create-framework` completes. It migrates existing project-level skills to the newly created domain skill, converts their SKILL.md files into commands using the `command-creator` subagent, and updates all skill references throughout the codebase.

---

## Phase 0: Detect Context

Before asking questions, gather the current state:

1. **Get CWD-based project skills**: List `{CWD}/.claude/skills/` if it exists
2. **Get global domain skills**: List `~/.claude/skills/` and identify candidates (created in last 2 hours or user-specified)
3. **Identify the target domain skill**: Either from `$ARGUMENTS` or by detecting recently created skills

If `$ARGUMENTS` provided a domain skill name, verify it exists at `~/.claude/skills/{domain}/SKILL.md`. If not found, report error and ask user to specify.

---

## Phase 1: Confirm Source Skills

Present the detected source skills from `{CWD}/.claude/skills/`:

```
Source Skills Detected (in {CWD}/.claude/skills/):
┌─────────────────┬──────────────────────────────────────┐
│ Skill           │ Files to Migrate                      │
├─────────────────┼──────────────────────────────────────┤
│ {skill-1}       │ SKILL.md, examples.md, scripts/...   │
│ {skill-2}       │ SKILL.md, reference.md               │
│ ...             │ ...                                   │
└─────────────────┴──────────────────────────────────────┘
```

Ask via AskUserQuestion:

**Q1** — header: `"Source skills"`, multiSelect: true
> "Which source skills should be migrated? (Select all that apply)"
- [List each detected skill as an option]
- "Other — I'll specify manually"

Collect: `source_skills` (array of skill names to migrate)

---

## Phase 2: Interactive File Selection

For each selected source skill, discover all files and let user choose what to migrate:

### Step 1: Scan Skill Contents

For each skill in `source_skills`:
```bash
find {CWD}/.claude/skills/{skill}/ -type f -o -type l | sort
```

Build a complete inventory grouped by type:
- Documentation: `*.md` files
- Scripts: `scripts/**/*`, `*.py`, `*.js`, `*.sh`
- Libraries: `lib/**/*`
- Templates: `templates/**/*`
- Config: `package.json`, `requirements.txt`, `*.yaml`, `*.json`
- Other: symlinks, binaries, misc files

### Step 2: Ask User Which Files to Migrate

Present the inventory and ask:

**Q2** — header: `"Files for {skill}"`, multiSelect: true
> "Which files from '{skill}' should be migrated?"
- "All documentation (*.md except SKILL.md)"
- "Scripts folder (scripts/)"
- "Library folder (lib/)"
- "Templates folder (templates/)"
- "Config files (package.json, etc.)"
- "Everything"
- "Let me select individually"

If "Let me select individually", show each file with a checkbox.

Collect: `files_to_migrate[{skill}]` (array of specific file paths)

---

## Phase 3: Confirm Target Domain

Show the detected or specified target domain skill:

**Q3** — header: `"Target domain"`, multiSelect: false
> "Confirm the target domain skill to migrate into:"
- "{domain-skill-name} — [description from SKILL.md if readable]"
- "Other — I'll specify a different domain"

Collect: `target_domain` (normalized domain name)

Also read `~/.claude/agents/{target_domain}/` to get list of available subagents. Store as `domain_subagents`.

---

## Phase 4: Preview Migration Plan

Build and display the complete migration plan:

```
Migration Plan
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Target Domain: {target_domain}
Source Skills: {source_skills}

Files to Migrate:
┌──────────────────────────────────────────────────────────────────┐
│ Source                                           → Destination   │
├──────────────────────────────────────────────────────────────────┤
│ {CWD}/.claude/skills/{skill}/{file}             → Domain skill/  │
│ ...                                                              │
└──────────────────────────────────────────────────────────────────┘

Commands to Create (via command-creator subagent):
┌──────────────────────────────────────────────────────────────────┐
│ Source SKILL.md                                  → Command        │
├──────────────────────────────────────────────────────────────────┤
│ {CWD}/.claude/skills/{skill}/SKILL.md           → {skill}.md    │
└──────────────────────────────────────────────────────────────────┘

References to Update:
- Commands with `skills: [{old-skill}]` → `skills: [{target_domain}]`
- Subagents with `skills: [{old-skill}]` → `skills: [{target_domain}]`

Archived After Success:
- Original source skill folders → ~/.claude/skills/_archived/{skill}/

Rollback Available:
- If any step fails, files are restored from staging area
```

**Q4** — header: `"Proceed?"`, multiSelect: false
> "Execute this migration plan?"
- "Yes — proceed with migration"
- "Modify — I want to change something"
- "Cancel — abort migration"

If "Modify", ask what to change and rebuild the plan. If "Cancel", exit with no changes.

---

## Phase 5: Execute Migration

> **CRITICAL**: All destructive operations happen LAST. Files are copied first, verified, then originals are archived only after complete success.

### Step 1: Create Staging Area

```bash
mkdir -p ~/.claude/skills/_staging/{timestamp}/
```

Copy all files to migrate to staging as backup for rollback:
```bash
cp -r {CWD}/.claude/skills/{skill}/{file} ~/.claude/skills/_staging/{timestamp}/{skill}/
```

Store `staging_path` for rollback.

### Step 2: Copy Files to Domain Skill

For each source skill:
1. Create target directory: `~/.claude/skills/{target_domain}/migrated/{source-skill}/`
2. COPY (not move) selected files:
   - Documentation → `~/.claude/skills/{target_domain}/migrated/{source-skill}/`
   - Scripts → `~/.claude/skills/{target_domain}/migrated/{source-skill}/scripts/`
   - Lib → `~/.claude/skills/{target_domain}/migrated/{source-skill}/lib/`
   - Templates → `~/.claude/skills/{target_domain}/migrated/{source-skill}/templates/`
   - Config → `~/.claude/skills/{target_domain}/migrated/{source-skill}/`

**Verify** after each copy:
```bash
diff -r {source}/{file} {target}/{file} && echo "OK" || echo "MISMATCH"
```

If verification fails, ROLLBACK immediately (see Rollback section).

### Step 3: Convert SKILL.md to Command via Subagent

For each source skill's `SKILL.md`:

1. Read the SKILL.md content
2. Build `command_context` object:
   ```
   command_context = {
     domain:              target_domain,
     task_name:           skill_name,
     task_description:    <from SKILL.md description>,
     domain_skill_root:   "~/.claude/skills/{target_domain}",
     script_root:         "~/.claude/skills/{target_domain}/migrated/{skill_name}/scripts",
     subagent_names:      domain_subagents,
     primary_subagent:    <first in domain_subagents or ask user>,
     workflow_steps:      <extract from SKILL.md sections>,
     decision_points:     <extract from AskUserQuestion mentions>,
     output_format:       <from SKILL.md patterns>,
     invocation_style:    "both",
     skill_source:        "{CWD}/.claude/skills/{skill_name}/SKILL.md"
   }
   ```

3. **Spawn `command-creator` subagent** with the context:
   ```
   Task tool with subagent_type: "command-creator"
   ```

4. Wait for completion and verify command file was created at `{CWD}/.claude/commands/{skill-name}.md`

If command-creator fails, report error and offer to:
- Retry with modified context
- Skip this command and continue
- Abort and rollback

### Step 4: Update All References

Search for skills references in BOTH formats:

**Format 1: Scalar** (single skill)
```yaml
skills: skill-name
```

**Format 2: List** (multiple skills)
```yaml
skills:
  - skill-name
  - other-skill
```

Search locations:
1. `~/.claude/commands/*.md`
2. `{CWD}/.claude/commands/*.md`
3. `~/.claude/agents/**/*.md`
4. `{CWD}/.claude/agents/**/*.md`

For each file:
1. Read file content
2. Find all occurrences of source skill name in `skills:` context
3. Replace with target_domain
4. Preserve other skills in lists

Grep pattern to find both formats:
```bash
grep -l "skills:.*{source-skill}\|skills:\s*$\n\s*-\s*{source-skill}" {paths}
```

### Step 5: Verify All Operations

Run verification checklist:
```bash
# 1. All files exist in target
for f in {files_to_migrate}; do
  test -f ~/.claude/skills/{target_domain}/migrated/{skill}/$f && echo "OK: $f" || echo "MISSING: $f"
done

# 2. Commands were created
for skill in {source_skills}; do
  test -f {CWD}/.claude/commands/$skill.md && echo "OK: $skill.md" || echo "MISSING: $skill.md"
done

# 3. No remaining references to old skills
grep -r "skills:.*{source-skill}" ~/.claude/ {CWD}/.claude/ 2>/dev/null && echo "WARN: Old references remain" || echo "OK: No old references"
```

If verification fails, ROLLBACK.

### Step 6: Archive Source Skills (Only After Full Success)

For each source skill:
1. Move entire folder to `~/.claude/skills/_archived/{source-skill}-{timestamp}/`
2. If archive folder doesn't exist, create it

### Step 7: Clean Up Staging

```bash
rm -rf ~/.claude/skills/_staging/{timestamp}/
```

---

## Rollback Procedure

If ANY step fails, execute rollback:

```
ROLLBACK TRIGGERED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Reason: {failure reason}
Step that failed: {step name}

Restoring from staging: {staging_path}

Actions:
1. Remove any files copied to domain skill
2. Remove any commands created
3. Restore original files from staging (if modified)
4. Report what was rolled back

Migration aborted. Original files are unchanged.
```

Rollback commands:
```bash
# Remove migrated files
rm -rf ~/.claude/skills/{target_domain}/migrated/{source-skill}/

# Remove created commands
rm -f {CWD}/.claude/commands/{skill}.md

# Restore any modified files from staging
cp -r ~/.claude/skills/_staging/{timestamp}/{skill}/* {CWD}/.claude/skills/{skill}/
```

---

## Phase 6: Report

Display final summary:

```
Migration Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Target Domain: {target_domain}

Migrated Files:
┌─────────────────┬───────────────────────────────────────────────┐
│ Source Skill    │ Files Migrated                               │
├─────────────────┼───────────────────────────────────────────────┤
│ {skill-1}       │ 5 files → ~/.claude/skills/{domain}/migrated/ │
│ {skill-2}       │ 3 files → ~/.claude/skills/{domain}/migrated/ │
└─────────────────┴───────────────────────────────────────────────┘

Created Commands (via command-creator):
- {CWD}/.claude/commands/{skill-1}.md
- {CWD}/.claude/commands/{skill-2}.md

Updated References:
- ~/.claude/commands/{cmd-1}.md: skills: [{skill-1}] → skills: [{domain}]
- ~/.claude/agents/{agent-1}.md: skills: [{skill-1}] → skills: [{domain}]

Archived:
- ~/.claude/skills/_archived/{skill-1}-{timestamp}/
- ~/.claude/skills/_archived/{skill-2}-{timestamp}/

Usage:
/{skill-1} [args]   — Now uses {domain} domain skill
/{skill-2} [args]   — Now uses {domain} domain skill

Next Steps:
1. Review generated commands and adjust workflows as needed
2. Test each command to verify domain skill integration
3. Remove archived skills after confirming everything works
```

---

## Error Handling

**No source skills found**: If `{CWD}/.claude/skills/` is empty or doesn't exist, inform user:
> "No project skills found in {CWD}/.claude/skills/. Migration requires existing skills to migrate."

**Target domain not found**: If specified domain skill doesn't exist:
> "Domain skill '{domain}' not found at ~/.claude/skills/{domain}/SKILL.md. Run /cc-create-framework first."

**File conflicts**: If destination files exist:
- "Overwrite existing"
- "Skip this file"
- "Archive existing first"
- "Abort migration"

**command-creator failure**: If subagent fails to create command:
> "Failed to create command for '{skill}'. Reason: {error}"
Options: "Retry with different context" | "Skip this command" | "Abort and rollback"

**Partial failure**: Trigger rollback. Report what was attempted and that everything was restored.

---

## File Types Reference

| Type | Pattern | Action |
|------|---------|--------|
| Documentation | `*.md` (except SKILL.md) | Copy to migrated/ |
| Scripts | `scripts/**/*`, `*.py`, `*.js`, `*.sh` | Copy to migrated/scripts/ |
| Libraries | `lib/**/*` | Copy to migrated/lib/ |
| Templates | `templates/**/*` | Copy to migrated/templates/ |
| Config | `package.json`, `requirements.txt`, `*.yaml` | Copy to migrated/ |
| Symlinks | Any symlink | Resolve and copy target, or skip with warning |
| SKILL.md | `SKILL.md` | Convert via command-creator |
| node_modules | `node_modules/` | SKIP (regenerate from package.json) |
| Binaries | Compiled files | Copy with warning |

---

## Validation

After migration, verify:

```bash
# Check files were moved
ls -la ~/.claude/skills/{domain}/migrated/

# Check commands were created
ls -la {CWD}/.claude/commands/

# Check NO references to old skills remain (both formats)
grep -E "skills:.*{old-skill}|skills:\s*$" ~/.claude/**/*.md {CWD}/.claude/**/*.md 2>/dev/null

# Check archived
ls -la ~/.claude/skills/_archived/
```

---

## Review Notes

**Date**: 2025-02-20
**Reviewer**: /cc-dev-review

**Changes Made**:
1. Added Phase 2: Interactive File Selection — scans all files and lets user choose what to migrate
2. Changed Step 3 to spawn `command-creator` subagent instead of inline conversion
3. Added staging area and rollback procedure for safe recovery from partial failures
4. Reordered execution: copy first, verify, then archive only after success
5. Fixed reference update to handle both scalar (`skills: name`) and list (`skills:\n  - name`) YAML formats
6. Added handling for node_modules (skip), symlinks (resolve or warn), and config files
