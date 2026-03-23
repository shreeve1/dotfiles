---
name: create-recipe
description: "Generate or extract recipe.yaml files that define authoritative workflow contracts for OpenCode skills. Use when asked to create a recipe, generate recipe.yaml, add a recipe to a skill, extract a recipe from an existing skill, or define a structured execution spec for reproducible skill runs."
---

# create-recipe

Generate or extract recipe.yaml files that define authoritative workflow contracts for OpenCode skills.

## Activation Contract

Two modes:
- **New mode**: Build a recipe.yaml from scratch through structured interview
- **Retrofit mode**: Analyze an existing SKILL.md and extract its implicit workflow, parameters, outputs, and validation into a recipe.yaml

The recipe is the **authoritative execution contract**. SKILL.md provides natural-language elaboration. The recipe pins: workflow steps, required parameters, expected outputs, and validation criteria.

### Variables
- `TARGET_SKILL_DIR` — path to the skill directory where recipe.yaml will be written
- `MODE` — "new" or "retrofit"

## Phase 1 — Determine Mode

Use `question` to ask the user whether to create a new recipe or retrofit an existing skill.

If **retrofit**:
1. Use `glob` to find SKILL.md files in both `~/.config/opencode/skills/*/SKILL.md` and `~/.opencode/skills/*/SKILL.md`
2. Present the list with `question` for selection
3. Set `TARGET_SKILL_DIR` to the selected skill's directory
4. Verify no existing `recipe.yaml` already exists there. If it does, use `question` to confirm overwrite.

If **new**:
1. Use `question` to capture the skill name and brief purpose
2. Set `TARGET_SKILL_DIR` to `~/.config/opencode/skills/<skill-name>/`
3. Verify the directory exists (it should contain a SKILL.md already, or the user is pre-creating the recipe)

## Phase 2 — Gather Context

### New Mode Interview

Conduct a structured interview using `question` for each schema section:

**Parameters** — For each parameter, ask:
- key (kebab-case name)
- type (string | number | boolean | select | file)
- required (yes/no)
- default value (if not required)
- options list (if type is select)
- description

Use `question` to ask "Add another parameter?" after each one. Allow zero parameters.

**Workflow Steps** — For each step, ask:
- step name (short imperative label)
- description (1-3 sentences of what happens)
- which parameters it consumes (from the already-defined params)
- what outputs it produces (collect output names)
- whether it's a decision point (must pause for user input)

Use `question` to ask "Add another workflow step?" after each.

**Outputs** — For each output, ask:
- id (kebab-case name)
- description
- type (file | intermediate | artifact)
- glob pattern (if file type)
- required (yes/no)

**Validation** — For each validation check, ask:
- name (human-readable label)
- type (shell | content)
- If shell: the command to run
- If content: which output id to check, and what strings it should contain

Use `question` to ask "Add another validation?" after each. Allow zero validations (with a note that validation is recommended).

### Retrofit Mode Extraction

1. Use `read` to load the target SKILL.md fully
2. **Extract workflow steps**: Look for phase headings (## Phase N, ### Phase N, numbered sections). Map each phase to a workflow step with: step number, name (from heading), description (first paragraph or summary).
3. **Extract parameters**: Look for `question` tool usage patterns, Variables sections, input references. Each distinct input becomes a parameter with inferred type.
4. **Extract outputs**: Look for `write` tool usage, file creation patterns, artifact references. Each distinct output becomes an output entry.
5. **Extract validation**: Look for "Validation Commands", "Acceptance Criteria", verification sections, `bash` commands used for checking. Each becomes a validation entry.
6. **Handle minimal skills**: If extraction yields fewer than 2 workflow steps or no parameters, note this and use `question` to ask the user: "This skill appears minimal. Should I generate a minimal recipe with what I found, or would you like to add more detail interactively?"
7. Present the full extracted structure as formatted text output, then use `question` with options: "Looks good, proceed" / "Let me adjust some sections" / "Start over with manual interview instead"

## Phase 3 — Draft Recipe

Assemble the recipe.yaml content from gathered data.

Load the schema reference by reading `references/recipe-schema.md` from the create-recipe skill directory for formatting rules.

Build the YAML string following these formatting rules:
- 2-space indentation (never tabs)
- Double-quote all string values
- `true`/`false` for booleans
- Omit optional sections that are empty (don't use `[]`)
- Keep lines under 120 characters
- Add a cross-reference comment as the first line: `# See SKILL.md in this directory for detailed phase instructions`

Assemble all sections: version (always "1.0.0"), title, description, parameters, workflow, outputs, validation.

## Phase 4 — Review and Refine

Output the complete drafted recipe as text (recipes can be 50-100+ lines, too large for question options).

Then use `question` with these options:
- "Accept and write to disk"
- "Modify a specific section"
- "Regenerate from scratch"

If "Modify a specific section":
1. Use `question` to ask which section (parameters / workflow / outputs / validation / metadata)
2. Walk through that section's interview again
3. Regenerate the recipe and present again
4. Loop until the user accepts

## Phase 5 — Write and Validate

1. Check if `recipe.yaml` already exists at `TARGET_SKILL_DIR/recipe.yaml`. If so, confirm overwrite with `question` (unless already confirmed in Phase 1).
2. Use `write` to create the file at `TARGET_SKILL_DIR/recipe.yaml`
3. Validate YAML syntax by running: `python3 -c "import yaml; yaml.safe_load(open('<path>'))"` with `bash`
4. If validation fails, fix the YAML and retry
5. Use `read` to confirm the file was written correctly

## Guardrails

- Never overwrite an existing recipe.yaml without explicit user confirmation
- Validate YAML is parseable before declaring success
- Ensure the target skill directory exists before writing
- Keep generated recipes under 200 lines; if a recipe exceeds this, suggest simplifying validation or splitting complex skills
- Do not modify the target skill's SKILL.md — the recipe is a companion file, not a replacement
- All parameter keys and output ids must be unique within a recipe
- Step numbers must be sequential starting at 1

## Report

After writing and validating, output:

```
Recipe Created

File: <path to recipe.yaml>
Mode: <new | retrofit>
Source: <SKILL.md path if retrofit, or "interview" if new>

Summary:
- Parameters: <count>
- Workflow steps: <count>
- Outputs: <count>
- Validations: <count>

YAML validation: passed
```