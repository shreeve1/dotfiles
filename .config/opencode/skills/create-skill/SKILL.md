---
name: create-skill
description: Create new OpenCode skills, improve existing skills, or convert Claude Code skills into OpenCode format. Use when the user wants to write a skill from scratch, iterate on an existing skill, run test cases to validate a skill works, optimize a skill's description for better triggering, or convert a .claude/skills or .claude/commands file into OpenCode format.
---

# Create Skill

A skill for creating and iteratively improving OpenCode skills.

The core loop is: capture intent → draft the skill → run test cases → evaluate with the user → improve → repeat. Figure out where the user is in this process and jump in from there. If they already have a draft, skip straight to testing. If they just have an idea, start from the beginning. If they just want to vibe without running tests, that's fine too.

---

## Phase 1 — Capture Intent

Start by understanding what the user wants. The current conversation might already contain a workflow to capture — if so, extract the key steps, tools used, corrections made, and input/output patterns from the history first. Fill gaps with the user before writing anything.

Determine:

1. **Purpose** — what should this skill enable the agent to do?
2. **Trigger conditions** — when should it activate? What user phrases or contexts?
3. **Output** — what does the skill produce? (files, decisions, reports, actions)
4. **Scope** — global (`~/.config/opencode/skills/`) or project-level (`.opencode/skills/`)?
5. **Test cases** — skills with verifiable outputs benefit from test runs; subjective skills often don't need them. Suggest the right default based on skill type.

If this is a **conversion** from Claude Code, locate the source file first:
- `.claude/skills/<name>/SKILL.md`
- `.claude/commands/<name>.md`
- `~/.claude/skills/<name>/SKILL.md`
- `~/.claude/commands/<name>.md`

Read it before proceeding and apply the field mapping in `references/opencode-format.md`.

Ask probing questions about edge cases, input/output formats, success criteria, and dependencies. Don't write the first draft until the scope is clear enough to execute.

---

## Phase 2 — Draft the Skill

See `references/opencode-format.md` for the full OpenCode skill format, naming rules, and writing patterns.

Key principles:

- **Description is the trigger** — it's the primary mechanism the agent uses to decide whether to load the skill. Include what it does AND specific contexts/phrasings that should activate it. Lean a little "pushy" — agents tend to under-trigger skills, so be explicit. Instead of "Helps with PDFs", write "Extracts text, tables, and form data from PDF files. Use whenever the user mentions PDFs, wants to convert or extract from a document, or needs to fill or merge PDF files, even if they don't say 'PDF processing' explicitly."
- **Explain the why** — today's models respond better to understanding the reason behind instructions than to rigid MUSTs. If you find yourself writing ALWAYS or NEVER in all caps, pause and reframe with context.
- **Keep SKILL.md lean** — under 500 lines ideally. If longer, use `references/` subdirectory files and point to them clearly from the skill body.
- **Bundle repeated work** — if every test run would independently write the same helper script, put it in `scripts/` and reference it from the skill.
- **Generalize, don't overfit** — skills run across many different prompts. Avoid changes that only fix the specific test case in front of you.

After writing the draft, read it with fresh eyes before sharing.

---

## Phase 3 — Test the Skill

Come up with 2-3 realistic test prompts — the kind of thing a real user would actually say. Share them with the user: "Here are a few test cases I'd like to try. Do these look right, or do you want to add more?" Then run them.

For each test case, spawn two `task` agents in the same message:

**With-skill run:**
```
Read the skill at <path>/SKILL.md and follow its instructions to accomplish this task:
<test prompt>

Save any file outputs to: <workspace>/iteration-1/<test-name>/with-skill/
Report what you did and what you produced.
```

**Baseline run** (for new skills: no skill; for improvements: snapshot the current skill first, then point at the snapshot):
```
Accomplish this task using only your general capabilities — do not use any skill:
<test prompt>

Save any file outputs to: <workspace>/iteration-1/<test-name>/baseline/
Report what you did and what you produced.
```

Organize results in a workspace sibling to the skill directory: `<skill-name>-workspace/iteration-1/<test-name>/`.

While the test runs are in progress, draft assertions for each test case — observable, specific things that should be true about the output. Good assertions are objectively checkable. Subjective qualities (tone, style, aesthetic) are better evaluated qualitatively by the user.

---

## Phase 4 — Present Results and Get Feedback

Once runs complete, present each test case to the user:

- The prompt
- The with-skill output
- The baseline output (or previous-iteration output for improvements)
- The assertion results (pass/fail with evidence)

Ask for feedback on each. Empty feedback means it looked fine. Focus improvements on the test cases where the user had specific complaints.

---

## Phase 5 — Improve and Iterate

After getting feedback:

1. **Generalize from feedback** — the goal is a skill that works across many different prompts, not just these test cases. Avoid fiddly overfit fixes.
2. **Read the task transcripts, not just outputs** — if the agent wasted time on unproductive steps, identify which instructions caused that and remove them.
3. **Look for repeated work** — if both test runs independently wrote the same helper script, bundle it in `scripts/`.
4. **Make the smallest useful change** — don't rewrite everything at once; targeted improvements are easier to evaluate.

Apply improvements, create `iteration-2/` in the workspace, rerun all test cases (including baselines), present results, get feedback. Keep going until:
- The user says they're satisfied
- All feedback is empty
- You're not making meaningful progress

---

## Phase 6 — Write and Verify the Final Skill

1. Create the skill directory: `<scope>/<name>/`
2. Write `SKILL.md`
3. Write any bundled `scripts/`, `references/`, or `assets/` files
4. Read the file back to confirm no corruption
5. Verify: frontmatter has `name` and `description`, name matches directory, no invalid syntax in body

---

## Phase 7 — Description Optimization (Optional)

After the skill is in good shape, offer to optimize the description for better triggering accuracy.

Generate 20 eval queries — a mix of should-trigger and should-not-trigger. Make them realistic and specific (file paths, personal context, casual phrasing, edge cases). The negative cases should be genuine near-misses that share keywords with the skill but actually need something different — "write a fibonacci function" is too easy a negative for most skills.

For **should-trigger** queries (8-10): vary the phrasing — formal, casual, implicit. Include cases where the user doesn't name the skill but clearly needs it. Include edge cases where this skill competes with another but should win.

For **should-not-trigger** queries (8-10): adjacent domains, ambiguous phrasing where keyword matching would incorrectly fire the skill, cases where the query touches the skill's domain but a simpler direct approach is more appropriate.

Share the eval set with the user for review before testing. Then use `task` agents to evaluate how well the current description triggers on each query, iterate on the description language, and report the before/after accuracy.

---

## Reference Files

- `references/opencode-format.md` — Full OpenCode skill format spec, naming rules, frontmatter fields, writing patterns, and Claude Code conversion field mapping

---

## Report

After writing the skill:

```
Skill created: <name>
Path: <full path to SKILL.md>
Mode: New | Improved | Converted from <source>

Description: "<description>"
Sections: <list of ## headings>
Bundled resources: <list or "none">

Validation:
  name format ............. pass
  description length ....... pass
  frontmatter valid ........ pass
  body complete ............ pass

Test iterations: <N>
```
