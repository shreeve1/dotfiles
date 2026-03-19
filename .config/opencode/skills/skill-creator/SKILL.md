---
name: skill-creator
description: Create new OpenCode skills, modify and improve existing skills, and measure skill quality through iterative testing. Use when users want to create a skill from scratch, edit or optimize an existing skill, run test cases to verify a skill works, iterate on skill quality with human feedback, or optimize a skill's description for better triggering accuracy. Activate this whenever someone says "create a skill", "make a skill", "improve this skill", "test this skill", "optimize skill triggering", or wants to turn a workflow into a reusable skill.
---

# Skill Creator

A skill for creating new OpenCode skills and iteratively improving them.

The process of creating a skill goes like this:

- Decide what the skill should do and roughly how it should do it
- Write a draft of the skill
- Create a few test prompts and run them with the skill loaded
- Help the user evaluate the results both qualitatively and quantitatively
  - While runs happen, draft quantitative assertions if there are none
  - Present results for the user to review and provide feedback
- Rewrite the skill based on feedback
- Repeat until satisfied
- Expand the test set and try again at larger scale

Your job when using this skill is to figure out where the user is in this process and jump in. Maybe they want to make a skill from scratch — help them narrow it down, write a draft, write test cases, run them, and iterate. Maybe they already have a draft — go straight to the eval/iterate loop.

Be flexible. If the user says "I don't need to run a bunch of evaluations, just vibe with me", do that instead.

After the skill is done, offer to optimize the description for better triggering.

---

## Communicating with the User

Pay attention to context cues about the user's technical familiarity. Some users are experienced engineers; others are less familiar with coding jargon.

- "evaluation" and "benchmark" are fine for most audiences
- For "JSON" and "assertion", look for cues that the user knows what those are before using them without explanation
- Briefly explain terms if in doubt

---

## Creating a Skill

### Capture Intent

Start by understanding the user's intent. The current conversation might already contain a workflow the user wants to capture (e.g., they say "turn this into a skill"). If so, extract answers from the conversation history first — the tools used, the sequence of steps, corrections the user made, input/output formats observed. The user may need to fill gaps, and should confirm before proceeding.

1. What should this skill enable the agent to do?
2. When should this skill trigger? (what user phrases/contexts)
3. What's the expected output format?
4. Should we set up test cases to verify the skill works? Skills with objectively verifiable outputs (file transforms, data extraction, code generation, fixed workflow steps) benefit from test cases. Skills with subjective outputs (writing style, design) often don't need them. Suggest the appropriate default based on the skill type, but let the user decide.

### Interview and Research

Proactively ask questions about edge cases, input/output formats, example files, success criteria, and dependencies. Wait to write test prompts until this part is ironed out.

If useful for research (searching docs, finding similar skills, looking up best practices), use `task` agents in parallel to gather context. Come prepared to reduce burden on the user.

### Write the SKILL.md

Based on the user interview, fill in these components:

- **name**: Skill identifier (kebab-case, 1-64 chars, `^[a-z0-9]+(-[a-z0-9]+)*$`)
- **description**: When to trigger, what it does. This is the primary triggering mechanism — include both what the skill does AND specific contexts for when to use it. All "when to use" info goes here, not in the body. Note: agents tend to "undertrigger" skills — to not use them when they'd be useful. To combat this, make descriptions a bit "pushy". Instead of "How to build a dashboard", write "How to build a dashboard. Use this whenever the user mentions dashboards, data visualization, internal metrics, or wants to display any kind of data, even if they don't explicitly ask for a 'dashboard.'"
- **the rest of the skill**

### Skill Writing Guide

#### OpenCode SKILL.md Format

Skills live at:
- **Project:** `.opencode/skills/<name>/SKILL.md`
- **Global:** `~/.config/opencode/skills/<name>/SKILL.md`
- **Cross-compatible:** `.claude/skills/<name>/SKILL.md` or `.agents/skills/<name>/SKILL.md`

#### Required Frontmatter

```yaml
---
name: skill-name
description: When and why agents should invoke this skill (1-1024 chars)
---
```

**Optional frontmatter fields:** `license`, `compatibility`, `metadata` (string key-value pairs). Unknown fields are ignored.

#### Anatomy of a Skill

```
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter (name, description required)
│   └── Markdown instructions
└── Bundled Resources (optional)
    ├── scripts/    - Executable code for deterministic/repetitive tasks
    ├── references/ - Docs loaded into context as needed
    └── assets/     - Files used in output (templates, icons, fonts)
```

#### Progressive Disclosure

Skills use a three-level loading system:
1. **Metadata** (name + description) — Always in context (~100 words)
2. **SKILL.md body** — In context whenever skill triggers (<500 lines ideal)
3. **Bundled resources** — As needed (unlimited, scripts can execute without loading)

**Key patterns:**
- Keep SKILL.md under 500 lines; if approaching this limit, add a layer of hierarchy with clear pointers about where to follow up
- Reference files clearly from SKILL.md with guidance on when to read them
- For large reference files (>300 lines), include a table of contents

**Domain organization**: When a skill supports multiple domains/frameworks:
```
cloud-deploy/
├── SKILL.md (workflow + selection)
└── references/
    ├── aws.md
    ├── gcp.md
    └── azure.md
```
The agent reads only the relevant reference file.

#### Principle of Lack of Surprise

Skills must not contain malware, exploit code, or any content that could compromise system security. A skill's contents should not surprise the user in their intent if described. Don't create misleading skills or skills designed to facilitate unauthorized access or data exfiltration.

#### Writing Patterns

Prefer using the imperative form in instructions.

**Defining output formats:**
```markdown
## Report structure
ALWAYS use this exact template:
# [Title]
## Executive summary
## Key findings
## Recommendations
```

**Examples pattern:**
```markdown
## Commit message format
**Example 1:**
Input: Added user authentication with JWT tokens
Output: feat(auth): implement JWT-based authentication
```

### Writing Style

Explain to the model why things are important rather than piling on heavy-handed MUSTs. Use theory of mind and make the skill general rather than super-narrow to specific examples. Start by writing a draft, then look at it with fresh eyes and improve it.

### Test Cases

After writing the skill draft, come up with 2-3 realistic test prompts — the kind of thing a real user would actually say. Share them with the user: "Here are a few test cases I'd like to try. Do these look right, or do you want to add more?" Then run them.

Save test cases to `<skill-name>-workspace/evals/evals.json`. Don't write assertions yet — just the prompts. Draft assertions in the next step while runs are in progress.

```json
{
  "skill_name": "example-skill",
  "evals": [
    {
      "id": 1,
      "prompt": "User's task prompt",
      "expected_output": "Description of expected result",
      "files": []
    }
  ]
}
```

See `references/schemas.md` for the full schema (including the `assertions` field, which you'll add later).

---

## Running and Evaluating Test Cases

This section is one continuous sequence — don't stop partway through.

Put results in `<skill-name>-workspace/` as a sibling to the skill directory. For example, if the skill is at `~/.config/opencode/skills/my-skill/SKILL.md`, the workspace is `~/.config/opencode/skills/my-skill-workspace/`. Within the workspace, organize results by iteration (`iteration-1/`, `iteration-2/`, etc.) and within that, each test case gets a directory named after the eval (`eval-0/`, `eval-1/`, etc.). Create directories as you go.

```
my-skill-workspace/
├── evals/
│   └── evals.json
├── history.json
├── iteration-1/
│   ├── feedback.json
│   ├── benchmark_summary.json
│   ├── extract-table-data/
│   │   ├── eval_metadata.json
│   │   ├── with_skill/
│   │   │   ├── outputs/
│   │   │   ├── transcript.md
│   │   │   └── grading.json
│   │   └── without_skill/
│   │       ├── outputs/
│   │       ├── transcript.md
│   │       └── grading.json
│   └── generate-chart/
│       └── ...
└── iteration-2/
    └── ...
```

### Step 1: Spawn All Runs

For each test case, launch two `task` agents in the same turn — one with the skill loaded, one without. This is important: launch everything at once so it all finishes around the same time.

**With-skill run** — use `task` with `builder` subagent type:

```
Execute this task with the following skill loaded:
- Skill content: <paste SKILL.md content or path>
- Task: <eval prompt>
- Input files: <eval files if any, or "none">
- Save outputs to: <workspace>/iteration-<N>/eval-<ID>/with_skill/outputs/
- Save a transcript of your work process to: <workspace>/iteration-<N>/eval-<ID>/with_skill/transcript.md
- Outputs to save: <what the user cares about>
```

**Baseline run** — use `task` with `builder` subagent type:
- **Creating a new skill**: no skill at all. Same prompt, save to `without_skill/outputs/`.
- **Improving an existing skill**: the old version. Before editing, snapshot the skill (`cp -r <skill-path> <workspace>/skill-snapshot/`), then give the baseline agent the snapshot. Save to `old_skill/outputs/`.

Write an `eval_metadata.json` for each test case. Give each eval a descriptive name based on what it's testing. If this iteration uses new or modified eval prompts, create these files for each new eval directory.

```json
{
  "eval_id": 0,
  "eval_name": "descriptive-name-here",
  "prompt": "The user's task prompt",
  "assertions": []
}
```

### Step 2: While Runs Are In Progress, Draft Assertions

Don't just wait for runs to finish — use this time productively. Draft quantitative assertions for each test case and explain them to the user. If assertions already exist in `evals/evals.json`, review them and explain what they check.

Good assertions are objectively verifiable and have descriptive names — they should read clearly so someone glancing at the results immediately understands what each one checks. Subjective skills (writing style, design quality) are better evaluated qualitatively.

Update the `eval_metadata.json` files and `evals/evals.json` with the assertions once drafted.

### Step 3: Grade the Results

Once all runs are done:

1. **Grade each run** — use a `task` agent with `validator` subagent type. Read `references/grader.md` for the full grading instructions and pass them to the agent. The grader evaluates each assertion against the outputs and saves results to `grading.json` in each run directory. For assertions that can be checked programmatically, write and run a script rather than eyeballing it.

2. **Aggregate results** — for each eval, compare the with-skill and baseline scores. Create a summary:
   ```json
   {
     "eval_name": "descriptive-name",
     "with_skill": {"pass_rate": 0.85, "passed": 6, "failed": 1},
     "baseline": {"pass_rate": 0.35, "passed": 2, "failed": 5},
     "delta": "+0.50"
   }
   ```

3. **Analyze patterns** — read the results across all evals. Look for:
   - Assertions that always pass regardless of skill (non-discriminating)
   - High-variance evals (possibly flaky)
   - Time/token tradeoffs
   See `references/analyzer.md` for detailed analysis guidance.

### Step 4: Present Results to the User

Present results directly in the conversation. For each test case, show:
- **Prompt**: the task that was given
- **With-skill output**: summary or key files
- **Baseline output**: summary or key files (collapsed if verbose)
- **Grades**: assertion pass/fail with evidence
- **Benchmark summary**: aggregate comparison

If outputs are files the user needs to inspect, save them and tell the user where they are.

Ask for feedback: "How does this look? Anything you'd change?"

### Step 5: Collect Feedback

The user provides feedback inline. Empty feedback means it looked fine. Focus improvements on test cases where the user had specific complaints.

Save feedback to `<workspace>/iteration-<N>/feedback.json`:

```json
{
  "reviews": [
    {"eval_name": "descriptive-name", "feedback": "the chart is missing axis labels"},
    {"eval_name": "another-test", "feedback": ""}
  ],
  "status": "complete"
}
```

---

## Improving the Skill

This is the heart of the loop. You've run the test cases, the user has reviewed the results, and now you need to make the skill better based on their feedback.

### How to Think About Improvements

1. **Generalize from the feedback.** Skills will be used many times across many different prompts. Here, you and the user are iterating on only a few examples because it's fast. But if the skill works only for those examples, it's useless. Rather than fiddly overfitting changes or oppressively constrictive MUSTs, if there's a stubborn issue, try branching out — different metaphors, different patterns. It's cheap to try.

2. **Keep the prompt lean.** Remove things that aren't pulling their weight. Read the transcripts, not just the final outputs — if the skill makes the model waste time on unproductive steps, try getting rid of those parts.

3. **Explain the why.** Try hard to explain the **why** behind everything you're asking the model to do. Today's LLMs are smart. They have good theory of mind and when given a good harness can go beyond rote instructions. Even if the user's feedback is terse, actually understand the task and transmit this understanding into the instructions. If you find yourself writing ALWAYS or NEVER in all caps, that's a yellow flag — reframe and explain the reasoning so the model understands why. That's a more humane, powerful, and effective approach.

4. **Look for repeated work across test cases.** Read the transcripts from test runs and notice if the agents all independently wrote similar helper scripts or took the same multi-step approach. If all test cases resulted in the agent writing a similar script, that's a strong signal the skill should bundle that script. Write it once, put it in `scripts/`, and tell the skill to use it.

Take your time and really think things over. Write a draft revision, then look at it fresh and make improvements. Get into the head of the user and understand what they want and need.

### The Iteration Loop

After improving the skill:

1. Apply your improvements to the skill
2. Rerun all test cases into a new `iteration-<N+1>/` directory, including baseline runs. If creating a new skill, the baseline is always `without_skill` (no skill) — that stays the same across iterations. If improving an existing skill, use your judgment on what makes sense as baseline.
3. Present results to the user with the previous iteration's outputs for comparison
4. Wait for the user to review
5. Read the new feedback, improve again, repeat

Keep going until:
- The user says they're happy
- The feedback is all empty (everything looks good)
- You're not making meaningful progress

After each iteration, update `<workspace>/history.json` to track version progression:

```json
{
  "started_at": "2026-01-15T10:30:00Z",
  "skill_name": "example-skill",
  "current_best": "iteration-2",
  "iterations": [
    {"version": "iteration-1", "parent": null, "avg_pass_rate": 0.65, "feedback_summary": "Missing axis labels"},
    {"version": "iteration-2", "parent": "iteration-1", "avg_pass_rate": 0.85, "feedback_summary": "Looks great"}
  ]
}
```

See `references/schemas.md` for the full schema.

---

## Advanced: Blind Comparison

For more rigorous comparison between two versions of a skill, there's a blind comparison system. Read `references/comparator.md` and `references/analyzer.md` for details. The idea: give two outputs to an independent `task` agent (type: `validator`) without telling it which is which, and let it judge quality. Then analyze why the winner won.

This is optional and most users won't need it. The human review loop is usually sufficient.

To run a blind comparison:

1. For each eval, launch a `task` agent with `validator` type, passing:
   - Output A (without labeling which skill produced it)
   - Output B
   - The eval prompt
   - The instructions from `references/comparator.md`

2. After comparison, launch an analysis `task` agent with `general` type, passing:
   - The comparison results
   - Both skill versions
   - Both transcripts
   - The instructions from `references/analyzer.md`

---

## Description Optimization

The `description` field in SKILL.md frontmatter is the primary mechanism that determines whether an agent invokes a skill. After creating or improving a skill, offer to optimize the description for better triggering accuracy.

### How Skill Triggering Works

Understanding the triggering mechanism helps design better eval queries. Skills appear in the agent's `available_skills` list with their name + description, and the agent decides whether to consult a skill based on that description. The important thing to know is that agents only consult skills for tasks they can't easily handle on their own — simple, one-step queries like "read this PDF" may not trigger a skill even if the description matches perfectly, because the agent can handle them directly with basic tools. Complex, multi-step, or specialized queries reliably trigger skills when the description matches.

This means your eval queries should be substantive enough that an agent would actually benefit from consulting a skill. Simple queries like "read file X" are poor test cases — they won't trigger skills regardless of description quality.

### Step 1: Generate Trigger Eval Queries

Create 20 eval queries — a mix of should-trigger and should-not-trigger. Save as JSON:

```json
[
  {"query": "the user prompt", "should_trigger": true},
  {"query": "another prompt", "should_trigger": false}
]
```

The queries must be realistic — concrete, specific, with good detail. Include file paths, personal context, column names, URLs. A mix of lengths, focusing on edge cases rather than clear-cut ones.

Bad: `"Format this data"`, `"Extract text from PDF"`, `"Create a chart"`

Good: `"ok so my boss just sent me this xlsx file (its in my downloads, called something like 'Q4 sales final FINAL v2.xlsx') and she wants me to add a column that shows the profit margin as a percentage. The revenue is in column C and costs are in column D i think"`

For **should-trigger** queries (8-10): different phrasings of the same intent — some formal, some casual. Include cases where the user doesn't explicitly name the skill or file type but clearly needs it. Throw in uncommon use cases and cases where this skill competes with another but should win.

For **should-not-trigger** queries (8-10): the most valuable ones are near-misses — queries that share keywords or concepts with the skill but actually need something different. Think adjacent domains, ambiguous phrasing where a naive keyword match would trigger but shouldn't, and cases where the query touches on something the skill does but in a context where another tool is more appropriate. Don't make them obviously irrelevant — "Write a fibonacci function" as a negative test for a PDF skill is too easy.

### Step 2: Review with User

Present the eval set to the user for review. Let them edit queries, toggle should-trigger, add/remove entries. Use `question` tool to confirm the final set.

### Step 3: Evaluate the Description

For each query in the eval set, use a `task` agent with `general` type to simulate the triggering decision:

```
You are evaluating whether a skill description would trigger for a given user query.

Available skill:
- Name: <skill-name>
- Description: <current description>

User query: <eval query>

Would you load this skill to handle this query? Answer YES or NO, with a brief reason.
```

Split the eval set into 60% train and 40% held-out test. Run each query 3 times for reliability. Evaluate the current description on both sets, then propose improvements based on what failed on the training set. Re-evaluate each new description on both train and test, iterating up to 5 times. Select the best description by test score rather than train score to avoid overfitting.

### Step 4: Iterate on the Description

Based on what failed:
- If should-trigger queries didn't trigger: the description needs more coverage of those use cases
- If should-not-trigger queries did trigger: the description is too broad

Rewrite the description and re-evaluate. Repeat 3-5 times, tracking scores per iteration.

### Step 5: Apply the Result

Take the best-performing description and update the skill's SKILL.md frontmatter. Show the user before/after and report the scores.

---

## Converting Skills from Other Formats

If the user wants to convert an existing Claude Code skill (`.claude/skills/`) or command (`.claude/commands/`) into OpenCode format, use the `metaprompt-opencode` skill instead. It handles field mapping, syntax cleanup, and format validation for cross-platform conversion.

The skill-creator is for building and iterating on skills from scratch or improving existing OpenCode skills.

---

## Updating an Existing Skill

The user might ask to update an existing skill, not create a new one. In this case:

- **Preserve the original name.** Note the skill's directory name and `name` frontmatter field — use them unchanged.
- **Copy to a writeable location before editing** if the installed skill path is read-only. Copy to `/tmp/skill-name/`, edit there, and copy back.
- **Snapshot before editing.** Before making changes, copy the current version to the workspace so you have a baseline for comparison.

---

## Validation

Before saving any skill, validate it. Run the validation script:

```bash
python <skill-creator-path>/scripts/validate_skill.py <path-to-SKILL.md>
```

This checks:
- Frontmatter is valid YAML with required fields
- `name` matches `^[a-z0-9]+(-[a-z0-9]+)*$` and is 1-64 chars
- `name` matches the parent directory name
- `description` is 1-1024 chars
- No common formatting issues

If the script is not available, manually verify:
- [ ] `name` matches `^[a-z0-9]+(-[a-z0-9]+)*$`, 1-64 chars
- [ ] `name` matches the directory name containing SKILL.md
- [ ] `description` is 1-1024 chars and describes trigger conditions
- [ ] Frontmatter delimited with `---`, valid YAML
- [ ] Body has at minimum: title heading + purpose + trigger conditions
- [ ] File path is `<base>/<name>/SKILL.md`

---

## Reference Files

The `references/` directory contains documentation for specialized tasks:

- `references/schemas.md` — JSON structures for evals.json, grading.json, benchmark results, and other data files used during skill evaluation
- `references/grader.md` — Instructions for grading assertions against outputs. Read this when you need to grade test case results via a `task` agent with `validator` type.
- `references/comparator.md` — Instructions for blind A/B comparison between two outputs. Read this when running blind comparisons via a `task` agent with `validator` type.
- `references/analyzer.md` — Instructions for analyzing benchmark results and understanding why one version beat another. Read this when analyzing comparison or benchmark data via a `task` agent with `general` type.

The `scripts/` directory contains executable tools:

- `scripts/validate_skill.py` — Validates a SKILL.md file's frontmatter and structure

---

## Core Loop Summary

To reinforce the workflow:

1. Figure out what the skill is about
2. Draft or edit the skill
3. Run test prompts with the skill loaded (via `task` agents)
4. Evaluate the outputs with the user:
   - Present results inline for human review
   - Run quantitative assertions
5. Repeat until satisfied
6. Optionally optimize the description for triggering

Use `todowrite` to track your progress through these stages so nothing gets missed. Specifically, add items like:
- "Draft SKILL.md for <name>"
- "Write 2-3 test cases and get user approval"
- "Run test cases (with-skill + baseline) and grade results"
- "Present results to user and collect feedback"
- "Iterate on skill based on feedback"
- "Offer description optimization"

This is important — without explicit tracking, it's easy to skip the evaluation step and jump straight from writing to "done".
