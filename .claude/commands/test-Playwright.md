---
name: test-Playwright
description: Run user story workflows against a live browser via Playwright and map results to acceptance criteria
argument-hint: [plan-path-or-url]
model: opus
---

# Test Playwright

Find or generate YAML user stories from a plan, deploy the `browser-qa` agent to execute them, then map results back to acceptance criteria with a structured pass/fail report.

## Variables

INPUT: $ARGUMENTS
SPECS_DIR: `specs/`
STORY_EXAMPLE: `~/.claude/skills/cc-playwright-browser/user_stories_example.md`

## Rules

- **NEVER edit project source files.** This command is verification only.
- **Check for existing stories first** before generating new ones — avoids duplicating `/dev-stories` work.
- **Every story workflow must start with Navigate and end with Verify.**
- **Present findings** to the user with AskUserQuestion offering next steps.

## Input Resolution

Resolve input in this priority order:

1. **Explicit plan path** — INPUT matches a file path (e.g., `specs/my-feature.md`). Read it directly.
2. **Explicit URL** — INPUT starts with `http://` or `https://`. Use this URL as the target and derive acceptance criteria from session context. Confirm criteria with AskUserQuestion before proceeding.
3. **Auto-find plan** — INPUT is empty. Look in SPECS_DIR for the most recently modified `.md` file (excluding `*-stories.md` files). If found, use it.
4. **Session context mode** — No plan found. Infer what was built from the conversation history. Use AskUserQuestion to confirm the inferred acceptance criteria and target URL before proceeding.

## Dev Server Detection

If no URL is specified in the plan, stories, or input, detect running dev servers:

```bash
for port in 3000 3001 3002 5173 5174 8080 8081 4200 4321; do
  curl -s -o /dev/null -w "%{http_code}" "http://localhost:$port" 2>/dev/null
done
```

If multiple servers respond, use AskUserQuestion to ask which one. If none respond, ask the user for a URL.

## Workflow

### Phase 1: Plan Analysis & Story Resolution

1. Read the plan and extract:
   - **Testing Promise** — verbatim from `## Testing Promise` section (or derive from criteria)
   - **Acceptance Criteria** — each criterion as a discrete item
   - **UI features** — pages, components, interactive elements mentioned
2. Derive the plan name from the filename (e.g., `my-feature.md` -> `my-feature`)
3. Check for existing stories at `specs/<plan-name>-stories.md`:
   - **If found and complete** — stories cover all UI-facing acceptance criteria. Use existing stories.
   - **If found but incomplete** — stories exist but miss some criteria. Read existing stories, then supplement with additional stories for uncovered criteria. Append to the file.
   - **If not found** — proceed to Phase 2 to generate stories.

### Phase 2: Story Generation (Conditional)

Only runs if stories need to be created or supplemented.

1. Read the story format example at STORY_EXAMPLE
2. For each UI-facing acceptance criterion, generate a YAML story with:
   - `name` — descriptive name of what is being tested
   - `url` — starting URL for the flow
   - `workflow` — step-by-step instructions using action verbs
3. Action verbs to use: Navigate, Click, Fill, Select, Verify, Wait, Scroll, Hover, Press, Upload
4. Every workflow:
   - Starts with `Navigate to <url>`
   - Ends with `Verify <expected outcome>`
   - Uses concrete selectors and values where possible
5. Order stories from most critical (core happy paths) to least critical (edge cases)
6. Save to `specs/<plan-name>-stories.md`

**Story format:**
```yaml
stories:
  - name: "<Descriptive name>"
    url: "<starting URL>"
    workflow: |
      Navigate to <url>
      Verify <initial state>
      <action steps>
      Verify <expected outcome>
```

### Phase 3: Environment Verification

1. Determine target URL from stories or dev server detection
2. Verify dev server is responding:
   ```bash
   curl -s -o /dev/null -w "%{http_code}" "<target-url>"
   ```
3. Verify Playwright is available:
   ```bash
   npx playwright --version
   ```
   If missing, install:
   ```bash
   npm install -D playwright && npx playwright install chromium
   ```
4. Create session directory:
   ```bash
   mkdir -p .playwright-sessions/test-pw-<plan-name>
   ```

### Phase 4: Story Execution

Deploy the `browser-qa` agent via the Task tool:

```
Task tool parameters:
  subagent_type: browser-qa
  prompt: |
    Execute the user stories in <path-to-stories-file> against <target-url>.

    For each story:
    1. Follow the workflow steps exactly
    2. Record PASS or FAIL for each story
    3. Capture screenshots at verification points
    4. On failure, record what was expected vs. what was found

    Save your report to .playwright-sessions/test-pw-<plan-name>/test-report.md
    Save screenshots to .playwright-sessions/test-pw-<plan-name>/test-artifacts/
```

Wait for the agent to complete and return its report.

### Phase 5: Map Results to Criteria

1. Read the agent's report from `.playwright-sessions/test-pw-<plan-name>/test-report.md`
2. For each acceptance criterion, find the story (or stories) that cover it
3. Map story PASS/FAIL to criterion status:
   - Story passed -> criterion PASS
   - Story failed -> criterion FAIL
   - No story covers the criterion -> NOT COVERED
4. Determine overall status:
   - **PASSED** — all stories pass AND all criteria are covered
   - **PARTIAL** — some pass, some fail, or some criteria not covered
   - **FAILED** — any story failed

### Phase 6: Report & Next Steps

Compile the verification report (see format below), then present to the user with AskUserQuestion:

- **Fix failures** — "Investigate and fix the failing stories"
- **Re-run stories** — "Re-execute the stories after changes"
- **Run /cc-test-CDT** — "Run runtime inspection via Chrome DevTools"
- **Run /test** — "Write and run code-level tests"
- **Run /cc-lighthouse-audit** — "Run Lighthouse quality audit"
- **Accept** — "Results acknowledged, no action needed"

## Report Format

```
Playwright Verification Report

Plan: <path or "Session Context">
Stories: <path to stories file>
Testing Promise: <text>
URL: <url>
Status: PASSED | FAILED | PARTIAL

Story Results:
| # | Story | Status | Verification Points |
|---|-------|--------|---------------------|
| 1 | <name> | PASS | N/N passed |
| 2 | <name> | FAIL | N/N — failed at: <step> |

Acceptance Criteria Coverage:
| # | Criterion | Covered By | Status |
|---|-----------|------------|--------|
| 1 | <text> | Story #1 | PASS |
| 2 | <text> | Story #2 | FAIL |
| 3 | <text> | (none) | NOT COVERED |

Summary: N/total stories passed, N/total criteria covered
Artifacts: specs/<plan-name>-stories.md, .playwright-sessions/test-pw-<plan-name>/
```

**Status logic:**
- **PASSED** — all stories pass AND all acceptance criteria are covered by at least one story
- **PARTIAL** — some stories pass but some criteria are not covered, or mixed results
- **FAILED** — any story failed
