# Story Format Specification

Stories follow a YAML-based format that maps directly to testable browser interactions for Playwright automation.

## YAML Structure

```yaml
stories:
  - name: "<Descriptive name of what is being tested>"
    url: "<starting URL for this flow>"
    workflow: |
      Navigate to <url>
      Verify <initial state or page load condition>
      <Step-by-step actions using: Click, Fill, Select, Hover, Scroll, Wait>
      Verify <expected outcome after actions>

  - name: "<Next story>"
    url: "<url>"
    workflow: |
      Navigate to <url>
      <actions>
      Verify <outcome>
```

## Required Fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Descriptive name explaining what is being tested |
| `url` | Yes | Starting URL for the flow |
| `workflow` | Yes | Step-by-step instructions using action verbs |

## Action Verbs Reference

Use these consistently in workflows:

| Verb | Usage | Example |
|------|-------|---------|
| **Navigate** | `Navigate to <url>` — Go to a page | `Navigate to http://localhost:3000/login` |
| **Verify** | `Verify <condition>` — Assert something is true | `Verify the dashboard page loads` |
| **Click** | `Click <element description>` — Click a button, link, etc. | `Click the "Sign In" button` |
| **Fill** | `Fill <field> with "<value>"` — Type into an input | `Fill the email field with "user@example.com"` |
| **Select** | `Select "<option>" from <dropdown>` — Choose from dropdown | `Select "United States" from the country dropdown` |
| **Wait** | `Wait for <condition>` — Pause until something happens | `Wait for navigation to complete` |
| **Scroll** | `Scroll to <element or position>` — Scroll the page | `Scroll to the bottom of the page` |
| **Hover** | `Hover over <element>` — Mouse hover | `Hover over the user menu` |
| **Press** | `Press <key>` — Keyboard input | `Press Enter` |
| **Upload** | `Upload "<file>" to <input>` — File upload | `Upload "avatar.png" to the profile image input` |

## Workflow Rules

1. Every workflow MUST start with a `Navigate` step
2. Every workflow MUST end with a `Verify` step
3. Use exact element descriptions that a tester or automation tool can identify
4. Include both happy paths and error states
5. Cover observable behavior — what the user sees, clicks, and verifies
6. Do NOT include backend-only tasks, deployment steps, or non-UI concerns
