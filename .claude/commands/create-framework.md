---
name: create-framework
description: Interview-driven framework wizard. Asks targeted questions at each phase before generating a tailored skill, subagents, and command. Never generates generic content.
argument-hint: [domain-description]
model: sonnet
disallowed-tools: []
hooks:
  Stop:
    - type: command
      command: "ls -la ~/.claude/skills/ ~/.claude/agents/ ~/.claude/commands/ 2>/dev/null | tail -20"
---

# Purpose

Interview-driven wizard for creating a Claude Code framework. Each phase asks targeted questions and waits for your answers before generating anything. Nothing is generated until the information needed to make it accurate has been collected.

**Rule**: Never generate a file until the interview for that phase is complete.

---

## Phase 0: Scan Project Context

Before asking anything, gather existing context:

1. Read `CLAUDE.md` if it exists — note existing patterns, client libraries, script locations
2. Scan for relevant scripts: `Glob "scripts/**/*.{py,js}"` and `Glob "lib/**/*.js"`
3. Check for existing `.claude/skills/`, `.claude/agents/`, `.claude/commands/`
4. **List all existing domain skills** — `ls ~/.claude/skills/` — and note their names. These are candidate domains the user might be extending.
5. Note what you found — this informs the questions you ask

If `$ARGUMENTS` was provided, use it as the starting domain description. Otherwise proceed to Phase 1 to discover it.

---

## Phase 1: Domain Discovery

Ask these two questions together (single AskUserQuestion call with 2 questions):

**Q1** — header: `"Domain type"`, multiSelect: false
> "What kind of domain is this framework for?"
- "REST API or web service integration"
- "CLI tool or command-line workflow"
- "Data processing or analysis pipeline"
- "Other — I'll describe it below"

**Q2** — header: `"Existing code"`, multiSelect: false
> "Does this project have existing scripts or client libraries for this domain?"
- "Yes — Python scripts or client"
- "Yes — JavaScript / Node.js scripts"
- "Both Python and JS"
- "No — starting from scratch"

**After Q2:**
If the user says existing code exists, check `CLAUDE.md` and the scan results from Phase 0 to identify the actual files. Read 1-2 of the most relevant ones to understand the existing patterns. Do not ask the user to name them if you can find them yourself.

Collect: `domain_name`, `domain_type`, `existing_scripts` (file paths if found)

---

## Phase 1.5: Domain Mode — New or Existing?

This phase determines whether you are building a **new domain** from scratch or adding a **new command to an existing domain**. This controls which phases run next.

Ask:

**Q_mode** — header: `"Domain mode"`, multiSelect: false
> "Is this a new domain, or are you adding a new command to an existing domain?"
- "New domain — create skill, subagents, and command"
- "Existing domain — add a command only (skip skill and subagent generation)"

**If "Existing domain":**

List the domain skills found in Phase 0 and ask:

**Q_domain_select** — header: `"Which domain?"`, multiSelect: false
> "Which existing domain does this command belong to?"
- [List each domain found in `~/.claude/skills/` as an option, e.g. "halopsa-api", "ticket-research", etc.]
- "Other — I'll type the name"

Once the user selects or types a domain name, set:

```
domain_mode = "existing"
domain_skill_root = ".claude/skills/{selected_domain}"
domain_agents_root = ".claude/agents/{selected_domain}"
script_root = ".claude/skills/{selected_domain}/scripts"
```

Also scan existing subagents for this domain: `ls ~/.claude/agents/{selected_domain}/`. Store the list as `existing_subagents`.

Confirm with the user:

> "Got it. This domain has these existing subagents: {existing_subagents list}. New scripts for this command will go in `{script_root}/`. The command file will be created at `.claude/commands/{command_name}.md`."

Then **skip Phase 2 and Phase 3** and jump to Phase 4. (Phase 4 will check whether the workflow needs a new subagent after collecting the steps.)

**If "New domain":**

Set:
```
domain_mode = "new"
```

Continue to Phase 2.

---

## Phase 2: Skill Layer Interview

> **Only run this phase if `domain_mode = "new"`.**

Ask these three questions together before generating the SKILL.md:

**Q3** — header: `"Operations"`, multiSelect: true
> "Which operation types does this skill cover? (Select all that apply)"
- "Query / search / read data"
- "Create new records or resources"
- "Update or modify existing records"
- "Delete or remove records"

**Q4** — header: `"Critical notes"`, multiSelect: false
> "Are there gotchas, required patterns, or constraints users MUST know about?"
- "Yes — specific parameter types or formats required"
- "Yes — authentication or credential requirements"
- "Yes — sequencing or ordering constraints"
- "No major gotchas"

**Q5** — header: `"Tool access"`, multiSelect: false
> "What level of tool access does this skill need?"
- "Read-only: Read, Glob, Grep"
- "Read + execute: add Bash"
- "Read + write: add Write and Edit"
- "Full access: all tools including Task"

> **Note for code generation**: `tools:` is NOT a supported frontmatter attribute in SKILL.md files. Tool access from Q5 should be documented in the skill body under a `## Tools Required` section, and applied to subagent frontmatter (`tools:` IS valid in `.claude/agents/` files).

**After Q3–Q5:**
If Q4 indicated gotchas exist, tell the user: "Describe the critical gotchas or constraints you want documented in the skill." Wait for their free-text response before continuing.

Build `skill_context` object:
```
skill_context = {
  domain: <domain_name>,
  domain_type: <from Q1>,
  operations: <from Q3 multi-select>,
  gotchas: <list from user or empty>,
  tool_access: <from Q5>,
  existing_scripts: <paths found in Phase 0>
}
```

**Spawn skill-author subagent** with `skill_context`. Wait for completion.

After skill-author reports done, show the path of the generated file, then ask:

**Q6** — header: `"Skill review"`, multiSelect: false
> "SKILL.md has been generated. How does it look?"
- "Good — move on to subagent design"
- "Regenerate — I'll give more detail"
- "I'll edit it manually later — continue"
- "Show me what was generated first"

If "Show me", read the file and display its key sections. Then re-ask.
If "Regenerate", ask: "What needs to be different?" Wait for response, update `skill_context`, re-spawn skill-author.

Set after completion:
```
domain_skill_root = ".claude/skills/{domain_name}"
script_root = ".claude/skills/{domain_name}/scripts"
```

---

## Phase 3: Subagent Design Interview

> **Only run this phase if `domain_mode = "new"`.** For existing domains, subagent gap detection happens in Phase 4 after the workflow is collected.

Ask these two questions before generating any subagents:

**Q7** — header: `"Subagent count"`, multiSelect: false
> "How many specialized subagents do you need?"
- "1 — single general-purpose subagent"
- "2 — two distinct roles"
- "3 — three specialized roles"
- "Suggest based on the domain"

**Q8** — header: `"Role split"`, multiSelect: false
> "How should the responsibilities be divided?"
- "By entity type (e.g., ticket manager, appointment scheduler, client manager)"
- "By operation (reader, writer, updater)"
- "By pipeline stage (validator, processor, reporter)"
- "By lifecycle (creator, manager, deleter)"

**After Q7–Q8:**

If the user chose a specific split (not "Suggest"), ask:
> "Name the subagents and briefly describe each one's scope. For example: 'ticket-manager: handles ticket CRUD and actions' / 'appointment-scheduler: creates and manages appointments'"

Wait for their response. Parse out the subagent names and their descriptions.

If "Suggest based on domain", derive subagent names from the domain and operations collected in Phase 2. Explain your proposed split to the user before proceeding. Ask them to confirm or modify.

Build `subagent_context` object:
```
subagent_context = {
  domain: <domain_name>,
  skill_path: ".claude/skills/{domain_name}/SKILL.md",
  subagent_definitions: [
    { name: "...", responsibility: "...", scope_included: [...], scope_excluded: [...] },
    ...
  ],
  tool_access: <from Phase 2 Q5>
}
```

**Spawn framework-builder subagent** with `subagent_context`. Wait for completion.

After framework-builder reports done, show the created file paths, then ask:

**Q9** — header: `"Subagent review"`, multiSelect: false
> "Subagents have been generated. How do they look?"
- "Good — move on to command design"
- "Regenerate with corrections"
- "I'll edit manually — continue"

If "Regenerate", ask what needs to change. Update `subagent_context` and re-spawn.

Set after completion:
```
domain_agents_root = ".claude/agents/{domain_name}"
subagent_names = <list of generated subagent names>
```

---

## Phase 4: Command Design Interview

The command should be named after what the user is trying to accomplish, not the architecture. Think `ticket-research` or `sched-workload`, not `manage-tickets`.

Start by telling the user: "Now let's design the command. This is the thing a user runs to get something done."

**Task name**: Ask the user what to call the command. Give 2-3 examples based on the domain. Wait for their answer — this is free text, not a question with options.

**Workflow steps**: Ask: "Walk me through what happens when someone runs this command, step by step. For example: fetch the ticket → ask for duration → check availability → create appointment." Wait for their free-text response. Parse the steps out of their answer.

**Decision points**: Ask: "At which steps does the user need to make a choice? Those get an interactive prompt." Wait for their answer.

### Subagent gap check (existing domains only)

If `domain_mode = "existing"`, after collecting workflow steps, compare them against the `existing_subagents` list from Phase 1.5. For each workflow step, determine which existing subagent would handle it.

If all steps map cleanly to existing subagents, proceed — no new subagent needed.

If one or more steps don't map to any existing subagent's responsibility, tell the user:

> "Looking at your workflow, these steps don't seem covered by the existing subagents ({existing_subagents list}): {unmapped steps}. This workflow may need a new subagent."

Then ask:

**Q_gap_subagent** — header: `"New subagent?"`, multiSelect: false
> "Do you want to create a new subagent for the uncovered steps?"
- "Yes — I'll describe it"
- "No — the existing subagents can handle it"

If "Yes": Ask the user to name and describe the new subagent. Spawn `framework-builder` in lightweight mode to generate just that one agent file in `{domain_agents_root}/`. Add the new subagent to `subagent_names`.

If "No": Proceed with existing subagents only.

### Continue command design

Then ask these two structured questions:

**Q10** — header: `"Output"`, multiSelect: false
> "What does this command produce when it finishes?"
- "A report or analysis displayed in chat"
- "A created or updated record (ticket, appointment, etc.)"
- "A file saved to disk"
- "Multiple outputs — I'll describe below"

**Q11** — header: `"Invocation style"`, multiSelect: false
> "How do users start this command?"
- "With an argument: /command-name <id or value>"
- "Interactively: guided prompts, no arguments needed"
- "Both: argument if provided, prompts as fallback"
- "From context: infer from the conversation"

If Q10 was "Multiple outputs", ask them to describe the outputs before continuing.

Build `command_context` object:
```
command_context = {
  domain:              <domain_name>,
  task_name:           <name the user gave>,
  task_description:    <one sentence from domain description + task name>,
  domain_skill_root:   <set in Phase 1.5 or Phase 2 — e.g. ".claude/skills/halopsa-api">,
  script_root:         <set in Phase 1.5 or Phase 2 — e.g. ".claude/skills/halopsa-api/scripts">,
  subagent_names:      <list of names from Phase 3, or existing agents found in domain_agents_root>,
  primary_subagent:    <the subagent that does the core work — first invoked or most significant>,
  workflow_steps:      <ordered list parsed from user's description>,
  decision_points:     <steps the user identified as needing user choice>,
  output_format:       <from Q10 + any free-text detail>,
  invocation_style:    <from Q11>
}
```

> **Critical**: `script_root` in `command_context` MUST point to the domain skill's scripts folder — never a command-named folder. Scripts belong to the domain, not the command. This ensures all commands in the same domain share a single script location.

> **Note**: `primary_subagent` maps to the `subagent:` frontmatter field in the generated command file. This is required — it tells Claude which subagent handles the core delegation.

> **For existing domains**: If `domain_mode = "existing"`, read the existing domain skill SKILL.md to find what scripts already exist and pass them as context to the command-creator. The command should reference existing scripts where possible rather than creating duplicates.

**Spawn command-creator subagent** with `command_context`. Wait for completion.

---

## Phase 5: Final Report

Verify all files exist. The check varies by `domain_mode`:

**If `domain_mode = "new"`:**
```bash
test -f ~/.claude/skills/{domain}/SKILL.md && echo "Skill: OK" || echo "Skill: MISSING"
ls ~/.claude/agents/{domain}/*.md 2>/dev/null && echo "Subagents: OK" || echo "Subagents: MISSING"
test -f ~/.claude/commands/{task_name}.md && echo "Command: OK" || echo "Command: MISSING"
```

**If `domain_mode = "existing"`:**
```bash
test -f ~/.claude/commands/{task_name}.md && echo "Command: OK" || echo "Command: MISSING"
# If a new subagent was created in Phase 4 gap check, verify it too
# test -f ~/.claude/agents/{domain}/{new_agent}.md && echo "New subagent: OK" || echo "New subagent: MISSING"
```

Display summary table:

**New domain:**
```
Framework generation complete.

Created Files
┌──────────┬──────────────────────────────────────────────────────────┐
│   Type   │                         Path                             │
├──────────┼──────────────────────────────────────────────────────────┤
│ Skill    │ .claude/skills/{domain}/SKILL.md                        │
│ Subagent │ .claude/agents/{domain}/{agent-1}.md                    │
│ ...      │ ...                                                      │
│ Command  │ .claude/commands/{task_name}.md                         │
└──────────┴──────────────────────────────────────────────────────────┘

Scripts live at: .claude/skills/{domain}/scripts/
```

**Existing domain (command added):**
```
Command added to existing domain.

Created
┌─────────┬───────────────────────────────────────────────┐
│  Type   │                     Path                      │
├─────────┼───────────────────────────────────────────────┤
│ Command │ .claude/commands/{task_name}.md               │
└─────────┴───────────────────────────────────────────────┘

Domain skill:  .claude/skills/{domain}/SKILL.md  (unchanged)
Subagents:     .claude/agents/{domain}/           (unchanged)
Scripts root:  .claude/skills/{domain}/scripts/   (shared with all {domain} commands)
```

Then display:
```
Usage:
/{task_name} [arguments]

Next steps:
1. Test the command with a real request
2. Add any new scripts to {script_root}/
3. Fix any inaccurate paths or script references
4. Iterate — the first run reveals what's missing
```

---

## Error Handling

**Missing input**: If $ARGUMENTS is empty and the user types nothing in Phase 1, ask "What domain are you building this for?" before continuing.

**File conflict**: If a file already exists at the target path, ask:
- "Overwrite existing file"
- "Skip this file, keep existing"
- "Generate with a different name"

**Subagent failure**: Report which phase failed, what was completed, and what to retry. Do not continue to the next phase after a failure.

**User abandons phase**: If the user says "skip" or "just generate it", note that the output will be generic and may need manual editing. Proceed with best guesses from available context.

**No existing domains found**: If `domain_mode = "existing"` is selected but no skills are found in `~/.claude/skills/`, inform the user: "No existing domain skills were found. Switching to new domain mode." Then run Phases 2 and 3 normally.
