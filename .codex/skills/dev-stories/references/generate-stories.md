# GenerateStories Workflow


## Contents

- [Variables](#variables)
- [Instructions](#instructions)
- [Workflow](#workflow)
- [Example](#example)
- [Validation](#validation)
- [Report](#report)

read an implementation plan and generate user stories that describe UI flows for testing with Playwright browser automation. The stories follow a YAML-based format that maps directly to testable browser interactions.

## Variables

PATH_TO_PLAN: $ARGUMENTS — Path to the implementation plan to generate stories from.
PLAN_OUTPUT_DIRECTORY: `artifacts/plans/{slug}/`

## Instructions

- If no `PATH_TO_PLAN` is provided, STOP immediately and ask the user to provide it (ask the user). Suggest any `.md` files found under `artifacts/plans/` and `artifacts/specs/` as options.
- read and deeply understand the plan at `PATH_TO_PLAN`.
- read the story format specification at `StoryFormat.md` (in the Stories skill root) to understand the expected output structure.
- Analyze the plan for all user-facing UI flows, interactions, and features.
- Generate user stories that cover the critical paths a user would take through the UI.
- Each story must be a concrete, step-by-step browser workflow that can be automated.
- Stories should cover: happy paths, navigation flows, form interactions, error states, and edge cases where relevant.
- Focus on **observable behavior** — what the user sees, clicks, and verifies.
- Do NOT include backend-only tasks, deployment steps, or non-UI concerns.
- If the plan references specific URLs, use them. Otherwise use placeholder URLs with clear comments.

## Workflow

1. **Validate input** — Confirm `PATH_TO_PLAN` exists. Search `artifacts/plans/` for the plan. If missing, list available `.md` files from those directories and ask the user to pick one.

2. **read the plan** — Parse the plan document thoroughly. Identify all UI-facing features, pages, components, and user interactions described.

3. **read the story format** — Load `StoryFormat.md` from the Stories skill root to understand the exact YAML structure and action verbs expected.

4. **Identify flows** — Extract every distinct user flow from the plan. Consider:
   - Page loads and initial states
   - Navigation between pages/views
   - Form submissions and validation
   - Interactive elements (buttons, modals, dropdowns, toggles)
   - Error states and recovery
   - Authentication flows (if applicable)
   - CRUD operations visible in the UI
   - Responsive/viewport behaviors (if mentioned)

5. **Write stories** — For each flow, create a story with:
   - A descriptive `name` that explains what is being tested
   - A `url` for the starting page
   - A `workflow` with step-by-step instructions using action verbs: Navigate, Click, Verify, Fill, Select, Wait, Scroll, Hover, Press, Upload

6. **Prioritize coverage** — Order stories from most critical (core functionality, happy paths) to least critical (edge cases, polish).

7. **Generate filename** — Derive from the plan filename: if the plan is `my-feature.md`, the stories file is `my-feature-stories.md`.

8. **Save stories** — Write to `PLAN_OUTPUT_DIRECTORY/<plan-name>-stories.md`.

## Example

Given a plan for a "User Authentication" feature, the output would look like:

```yaml
stories:
  - name: "Login page loads correctly"
    url: "http://localhost:3000/login"
    workflow: |
      Navigate to http://localhost:3000/login
      Verify the login form is visible with email and password fields
      Verify a "Sign In" button is present
      Verify a "Forgot Password?" link is visible

  - name: "Successful login with valid credentials"
    url: "http://localhost:3000/login"
    workflow: |
      Navigate to http://localhost:3000/login
      Verify the login form is visible
      Fill the email field with "testuser@example.com"
      Fill the password field with "validpassword123"
      Click the "Sign In" button
      Wait for navigation to complete
      Verify the dashboard page loads
      Verify the user's name appears in the header

  - name: "Login fails with invalid credentials"
    url: "http://localhost:3000/login"
    workflow: |
      Navigate to http://localhost:3000/login
      Fill the email field with "testuser@example.com"
      Fill the password field with "wrongpassword"
      Click the "Sign In" button
      Verify an error message "Invalid email or password" is displayed
      Verify the user remains on the login page

  - name: "Logout returns to login page"
    url: "http://localhost:3000/dashboard"
    workflow: |
      Navigate to http://localhost:3000/dashboard
      Verify the dashboard is loaded and user is authenticated
      Click the user menu in the header
      Click the "Sign Out" option
      Wait for navigation to complete
      Verify the login page is displayed
```

## Validation

After saving, verify the generated stories file:

1. **File exists** at the expected path in `PLAN_OUTPUT_DIRECTORY`
2. **Valid YAML structure** — contains `stories:` root key
3. **Required fields** — every story has `name`, `url`, and `workflow` fields
4. **Workflow boundaries** — every workflow starts with a `Navigate` step and ends with a `Verify` step
5. **No duplicate story names** — each story name is unique
6. **Coverage completeness** — all UI flows from the plan are represented

If any validation fails, fix the stories file before completing.

## Report

After creating the stories file:

```
User Stories Generated

File: PLAN_OUTPUT_DIRECTORY/<filename>-stories.md
Source Plan: PATH_TO_PLAN
Stories: <count> user stories covering <count> UI flows

Coverage:
- <flow category 1>: <count> stories
- <flow category 2>: <count> stories
- <flow category 3>: <count> stories

Next steps:
- Review stories for completeness
- Run UI tests: /playwright-browser <path-to-stories>
```
