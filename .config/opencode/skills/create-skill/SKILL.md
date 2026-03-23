---
name: create-skill
description: Create new OpenCode skills with recipe.yaml contracts, improve existing skills, or convert Claude Code skills into OpenCode format. Use when the user wants to write a skill from scratch, iterate on an existing skill, run test cases to validate a skill works, optimize a skill's description for better triggering, convert a .claude/skills or .claude/commands file, or generate a recipe.yaml for reproducible skill execution.
---

# Create Skill

A skill for creating and iteratively improving OpenCode skills. Every skill produced includes both a SKILL.md (natural-language instructions) and a recipe.yaml (authoritative execution contract).

The core loop is: capture intent → draft skill → draft recipe → test → evaluate → improve → repeat. Figure out where the user already is and jump in from there. If they have a draft SKILL.md, skip to Phase 2 or 3. If they just have an idea, start at Phase 1. If they want to vibe without running tests, do Phases 1–3 then jump to Phase 7.

## When NOT to Use

Do not silently rewrite unrelated skills because they seem related to what you just built. Do not create a new skill based on a single one-off user correction unless they explicitly ask. Do not spin up the full test loop for skills with purely subjective outputs — human review is sufficient for those.

---

## Phase 1 — Capture Intent

Start by understanding what the user wants. The current conversation might already contain a workflow worth capturing — if so, extract the key steps, tools used, corrections made, and input/output patterns from the history first before asking questions.

Determine:

1. **Purpose** — what should this skill enable the agent to do?
2. **Trigger conditions** — when should it activate? What user phrases or contexts?
3. **Output** — what does the skill produce? (files, decisions, reports, actions)
4. **Scope** — global (`~/.config/opencode/skills/`) or project-level (`.opencode/skills/`)?
5. **Test cases** — skills with objectively verifiable outputs benefit from test runs; skills with subjective outputs (writing style, tone, aesthetics) are better evaluated by human review. Suggest the right default and let the user decide.

**If updating an existing skill** rather than creating a new one: note the skill's directory name and `name` frontmatter field and preserve them exactly. Do not create a `skill-name-v2` variant — edit in place.

**If converting from Claude Code**, locate the source file first:
- `.claude/skills/<name>/SKILL.md`
- `.claude/commands/<name>.md`
- `~/.claude/skills/<name>/SKILL.md`
- `~/.claude/commands/<name>.md`

Read it before proceeding and apply the field mapping in `references/opencode-format.md`. Note that Claude Code skills won't have a recipe.yaml — Phase 3 will generate one from the converted SKILL.md structure, so pay attention to extracting the implicit workflow during conversion.

Ask probing questions about edge cases, input/output formats, success criteria, and dependencies. Don't write the first draft until the scope is clear enough to execute.

---

## Phase 2 — Draft and Write the Skill

Read `references/opencode-format.md` for the full format spec, naming rules, writing patterns, and tool name table.

Key principles:

- **Description is the trigger** — it's the primary mechanism the agent uses to decide whether to load the skill. Include what it does AND specific phrasings/contexts that should activate it. Lean a little pushy — agents tend to under-trigger skills. Instead of "Helps with PDFs", write "Extracts text, tables, and form data from PDF files. Use whenever the user mentions PDFs, wants to convert or extract from a document, or needs to fill or merge PDF files, even if they don't say 'PDF processing' explicitly."
- **Explain the why** — agents respond better to understanding the reasoning behind instructions than to rigid imperatives. If you find yourself writing ALWAYS or NEVER in all caps, pause and reframe with context instead.
- **Keep SKILL.md lean** — under 500 lines ideally. If longer, move detail into `references/` and point to it clearly from the skill body.
- **Bundle repeated work** — if every test run would independently write the same helper script, put it in `scripts/` and reference it from the skill.
- **Generalize, don't overfit** — skills run across many prompts. Avoid changes that only fix the specific test case in front of you.

After writing the draft, read it with fresh eyes before sharing. Then:

1. Create the skill directory: `<scope>/<name>/`
2. Write `SKILL.md`
3. Write any bundled `scripts/`, `references/`, or `assets/` files
4. Read the file back to confirm no corruption
5. Verify: frontmatter has `name` and `description`, name matches directory

**If skipping tests** (subjective skill or user preference): jump to Phase 7 after Phase 3.

---

## Phase 3 — Draft and Write the Recipe

Every skill gets a companion `recipe.yaml` that defines its authoritative execution contract. The recipe pins: workflow steps, required parameters, expected outputs, and validation criteria. SKILL.md provides the natural-language elaboration; the recipe is what makes runs reproducible and comparable.

Read `references/recipe-schema.md` for the full schema specification, field reference, formatting rules, and annotated examples.

### Check for Existing Recipe

Before drafting, check if `recipe.yaml` already exists in the skill directory. If it does:
- **Updating an existing skill**: Read the existing recipe first. Preserve its structure as a starting point and merge any changes from the updated SKILL.md into it rather than regenerating from scratch.
- **New skill with a pre-created recipe**: Use `question` to confirm: "A recipe.yaml already exists. Overwrite it, or use it as a starting point?"

If no existing recipe, proceed with extraction or interview below.

### Extracting the Recipe from the Skill

Since you just wrote (or are looking at) the SKILL.md, extract the recipe structure from it:

1. **Title and description**: Derive `title` from the SKILL.md's `# Title` heading and `description` from the frontmatter description (condensed to 1-2 sentences if needed).
2. **Workflow steps**: Map each Phase heading to a workflow step. Use the phase name as the step name, summarize the description to 1-3 sentences.
3. **Parameters**: Look at `question` tool usage patterns, Variables sections, and input references in the skill. Each distinct user input becomes a parameter with an inferred type.
4. **Outputs**: Look at `write` tool usage, file creation patterns, and artifact references. Each distinct output becomes an output entry.
5. **Validation**: Look at verification sections, acceptance criteria, and `bash` commands used for checking. Each becomes a validation entry.
6. **Decision points**: Any phase that pauses for user review or approval is a decision point.

If the skill is minimal (fewer than 2 extractable workflow steps or no parameters), note this and use `question` to ask: "This skill appears minimal. Should I generate a minimal recipe with what I found, or would you like to define the recipe interactively?"

### Interactive Interview (Alternative)

If extraction yields too little or the user prefers manual control, conduct a structured interview using `question` for each schema section:

- **Parameters**: For each one, gather: key (kebab-case), type, required flag, default, options (if select), description. Use `question` to ask "Add another parameter?" after each. Zero parameters is valid.
- **Workflow steps**: For each one, gather: name, description (1-3 sentences), which parameters it consumes, what outputs it produces, whether it's a decision point. Use `question` to ask "Add another step?" after each.
- **Outputs**: For each one, gather: id (kebab-case), description, type (file/intermediate/artifact), glob pattern (if file), required flag.
- **Validation**: For each one, gather: name, type (shell/content), command (if shell) or target + contains (if content). Note that validation is recommended but zero checks is acceptable.

### Building the YAML

Assemble `recipe.yaml` following these formatting rules:
- First line: `# See SKILL.md in this directory for detailed phase instructions`
- 2-space indentation (never tabs)
- Double-quote all string values
- `true`/`false` for booleans
- Omit optional sections that are empty (don't include `[]`)
- Keep lines under 120 characters
- Version is always `"1.0.0"`

### Review and Write

Present the complete drafted recipe as text output (recipes are typically 50-150 lines).

Use `question` with options:
- "Accept and write to disk"
- "Modify a specific section"
- "Regenerate from scratch"

If "Modify a specific section": ask which section (parameters / workflow / outputs / validation / metadata), walk through changes, regenerate, and present again. Loop until accepted.

When accepted:
1. Use `write` to create `<skill-dir>/recipe.yaml`
2. Validate YAML syntax: `python3 -c "import yaml; yaml.safe_load(open('<path>'))"`
3. If validation fails, fix the YAML and retry
4. Use `read` to confirm the file was written correctly

---

## Phase 4 — Test the Skill

Come up with 2–3 realistic test prompts — the kind of thing a real user would actually say. Share them with the user and confirm before running: "Here are a few test cases I'd like to try. Do these look right, or do you want to adjust?"

Before running, create the assertions file for this iteration so findings persist across sessions:

```
<skill-name>-workspace/
└── iteration-1/
    ├── evals.json          ← assertions for all test cases
    └── <test-name>/
        ├── with-skill/
        └── baseline/
```

Write `evals.json` now with the prompts and your drafted assertions (assertions can be empty initially — fill them during runs):

```json
{
  "skill_name": "<name>",
  "iteration": 1,
  "evals": [
    {
      "id": 1,
      "name": "descriptive-test-name",
      "prompt": "The realistic user prompt",
      "assertions": [
        "Output contains X",
        "File Y was created",
        "No error messages in output"
      ]
    }
  ]
}
```

For each test case, spawn two `task` agents **in the same message** so they run in parallel:

**With-skill run** — embed the full skill content directly so the agent operates under its guidance:
```
You are operating with the following skill loaded:

---
<paste full contents of SKILL.md here>
---

Using the skill above, accomplish this task:
<test prompt>

Save any file outputs to: <workspace>/iteration-1/<test-name>/with-skill/outputs/
Save a plain-text transcript of your reasoning and actions to:
  <workspace>/iteration-1/<test-name>/with-skill/transcript.md
Report what you did and what you produced.
```

**Baseline run** — no skill guidance, same prompt:
- For a **new skill**: no skill at all
- For **improving an existing skill**: embed the *previous* version of the skill

```
Accomplish this task using only your general capabilities — no skill guidance:
<test prompt>

Save any file outputs to: <workspace>/iteration-1/<test-name>/baseline/outputs/
Save a plain-text transcript of your reasoning and actions to:
  <workspace>/iteration-1/<test-name>/baseline/transcript.md
Report what you did and what you produced.
```

While the runs are in progress, finalize the assertions in `evals.json`. Good assertions are objectively checkable against the output files. Subjective qualities are better left to human review.

Since this skill always produces both SKILL.md and recipe.yaml, include recipe-specific assertions in every eval:
- `recipe.yaml exists in the skill directory`
- `recipe.yaml is valid YAML`
- `recipe workflow step count matches SKILL.md phase count`

---

## Phase 5 — Evaluate and Get Feedback

Once runs complete, grade each assertion against the outputs (check programmatically where possible — it's faster and reusable). Update `evals.json` with pass/fail results and evidence.

Present each test case to the user:

- The prompt
- The with-skill output (rendered or summarized)
- The baseline output
- Assertion results (pass/fail with one-line evidence each)

Ask for feedback. Empty feedback means it looked fine. Focus improvements on cases where the user had specific complaints.

---

## Phase 6 — Improve and Iterate

After getting feedback:

1. **Generalize from feedback** — the skill will run across many different prompts. Avoid fiddly overfit fixes; look for the underlying pattern.
2. **Read the transcripts, not just outputs** — check `with-skill/transcript.md` for each run. If the agent spent time on unproductive steps, find which instruction caused it and remove or reframe it.
3. **Look for repeated work** — if both runs independently wrote the same helper script, bundle it in `scripts/`.
4. **Make the smallest useful change** — targeted edits are easier to evaluate than rewrites.
5. **Keep the recipe in sync** — when you change SKILL.md phases, parameters, or outputs, update `recipe.yaml` to match. The recipe is the authoritative contract; it must reflect the actual workflow.
6. **Re-validate after every recipe edit** — run `python3 -c "import yaml; yaml.safe_load(open('<path>'))"` after touching recipe.yaml. Edits can introduce syntax errors silently.

Apply improvements to both files on disk. Create `iteration-2/` in the workspace with a fresh `evals.json` (copy forward the prompts and assertions, clear the results). Rerun all test cases including baselines. Present results. Get feedback. Repeat until:

- The user says they're satisfied
- All feedback is empty
- You're not making meaningful progress

---

## Phase 7 — Final Verification

After iteration is complete (or after Phase 3 for skills skipping tests):

1. Read `SKILL.md` back from disk
2. Run the validation checklist from `references/opencode-format.md`
3. Confirm any bundled `scripts/` files are executable if they need to be
4. Confirm `references/` files are referenced from the skill body with clear guidance on when to read them
5. Read `recipe.yaml` back from disk
6. Validate YAML syntax: `python3 -c "import yaml; yaml.safe_load(open('<path>'))"`
7. Verify recipe workflow steps match SKILL.md phases (same count, same names)
8. Verify recipe parameter keys are all referenced in at least one workflow step's `requires_input`
9. Verify recipe output ids are all referenced in at least one workflow step's `produces`

---

## Phase 8 — Description Optimization (Optional)

After the skill is in good shape, offer to optimize the description for better triggering accuracy. This is worth doing when the skill is complex or when its trigger conditions overlap with other skills.

Generate 20 eval queries — a mix of should-trigger and should-not-trigger. Make them realistic and specific: include file paths, personal context, casual phrasing, typos, edge cases. The negative cases should be genuine near-misses that share keywords with the skill but actually need something different. "Write a fibonacci function" is too easy a negative for most skills — the hard negatives are adjacent domains and ambiguous phrasing where keyword matching would fire incorrectly.

**Should-trigger (8–10):** vary the phrasing — formal, casual, implicit. Include cases where the user doesn't name the skill but clearly needs it. Include edge cases where this skill competes with another but should win.

**Should-not-trigger (8–10):** adjacent domains, queries that touch the skill's topic but where a simpler direct response is more appropriate, queries where a *different* skill is the right choice.

Share the eval set with the user for review and adjustment before testing.

To evaluate triggering, use a `task` agent for each query with this prompt:

```
You have the following skill available (name + description only, as it would appear in your available_skills list):

  Name: <skill-name>
  Description: <current description>

Given this user message, would you load this skill?
User message: "<query>"

Answer YES or NO, then explain your reasoning in one sentence.
```

Tally results. For any query that gave the wrong answer, examine the reasoning the agent returned — it will tell you exactly what in the description caused the mismatch. Revise the description to address those cases and rerun only the failing queries to confirm the fix. Report before/after accuracy and show the updated description.

---

## Reference Files

- `references/opencode-format.md` — Full OpenCode skill format spec, loading tiers, naming rules, frontmatter, writing patterns, tool name table, and Claude Code conversion field mapping
- `references/recipe-schema.md` — Full recipe.yaml schema specification, field-by-field reference, YAML formatting guide, and annotated examples

---

## Guardrails

**Skill guardrails:**
- Keep SKILL.md under 500 lines; move overflow to `references/`
- Generalize from feedback — don't overfit to a single test case
- When updating an existing skill, preserve the directory name and `name` frontmatter exactly
- Don't silently rewrite unrelated skills or create `-v2` variants

**Recipe guardrails:**
- Never overwrite an existing recipe.yaml without explicit user confirmation
- Validate YAML is parseable before declaring recipe success
- Keep generated recipes under 200 lines; if a recipe exceeds this, suggest simplifying or splitting
- All parameter keys and output ids in the recipe must be unique
- Step numbers must be sequential starting at 1
- The recipe must stay in sync with SKILL.md — if one changes, the other must be updated

---

## Report

After completing the skill:

```
Skill: <name>
Path: <full path to SKILL.md>
Mode: New | Improved | Converted from <source>

Description: "<description>"
Sections: <list of ## headings>
Bundled resources: <list or "none">

Validation:
  name format ............. pass / fail
  description length ....... pass / fail
  frontmatter valid ........ pass / fail
  body complete ............ pass / fail
  recipe YAML valid ........ pass / fail
  recipe-skill sync ........ pass / fail

Test iterations: <N | skipped>
Description optimization: <run | skipped>

Recipe: <path to recipe.yaml>
  Parameters: <count>
  Workflow steps: <count>
  Outputs: <count>
  Validations: <count>
```
