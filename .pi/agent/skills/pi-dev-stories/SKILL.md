---
name: pi-dev-stories
description: Generate Playwright user stories from an implementation plan. Use when a UI feature needs browser-driven acceptance tests — converts plan tasks into testable user flows with action verbs, selectors, and assertions. Output is consumable by a UI tester (e.g., bowser/ui-reviewer) to validate behavior end-to-end.
---

# Generate User Stories

> **Canonical paths (MANDATORY):** Read `~/.pi/agent/skills/PATHS.md` before any file output. All artifact paths in this skill resolve through that reference. Deviation is a bug — surface it instead of working around it.

Use this skill to convert a plan's UI-touching tasks into structured user stories that can be executed by a Playwright runner. The output is a single `stories.md` file co-located with the plan.

Do not use this skill for non-UI plans (pure backend, infrastructure, library work). It is designed for plans where acceptance is observable in a browser.

---

## Variables

- `PATH_TO_PLAN` — explicit plan path (optional; if omitted, discover the most recent plan)
- `PLAN_DIRECTORIES` — `artifacts/plans/`
- `SLUG` — derived from the plan's parent directory (e.g., for `artifacts/plans/add-dark-mode/plan.md`, slug is `add-dark-mode`)
- `STORIES_FILE` — `artifacts/plans/${SLUG}/stories.md`

---

## Workflow Overview

1. Discover and read the plan
2. Identify UI-touching tasks
3. Generate stories per UI task
4. Validate the YAML
5. Save and report

---

## Phase 1 — Discover the Plan

If `PATH_TO_PLAN` is provided, use it.

If not, use `bash` to find recent plans:

```sh
find artifacts/plans -name 'plan.md' -o -name 'shard-*.md' 2>/dev/null | xargs ls -t 2>/dev/null | head -20
```

Present 1–3 candidates with `ask_user` (type: select). If none found, ask the user for a path.

Once selected, derive `SLUG` from the parent directory of the plan file. Use `read` to inspect the plan.

---

## Phase 2 — Identify UI-Touching Tasks

Parse the plan's `## Step by Step Tasks` section. A task is UI-touching when it:
- modifies a component, page, route, layout, or template
- changes a form, button, dialog, or interactive element
- adjusts user-visible copy, validation, or error states
- alters navigation, redirects, or auth flow
- updates styling that has functional implications (e.g., a hidden element becoming visible)

Skip tasks that are purely backend (DB migrations, API logic without a UI surface, build config, etc.) — note them as "Out of scope for stories" in the report.

If zero tasks are UI-touching, stop and report the plan has no UI surface to test.

---

## Phase 3 — Generate Stories

For each UI task, write one or more stories. Aim for 1 story per acceptance criterion, not 1 story per task.

### Story format

Each story is a YAML block in `stories.md`:

```yaml
- id: story-1
  title: User can toggle dark mode from settings
  task_ref: "[2.1]"     # plan task ID this validates
  url: /settings
  preconditions:
    - "User is logged in"
  steps:
    - navigate: /settings
    - click: { selector: "[data-testid='theme-toggle']" }
    - wait_for: { selector: "html[data-theme='dark']", timeout_ms: 2000 }
  assertions:
    - element_visible: { selector: "[data-testid='dark-mode-active']" }
    - text_equals:
        selector: "[data-testid='theme-label']"
        expected: "Dark"
    - css_property:
        selector: body
        property: background-color
        matches: "rgb(15, 15, 15)"  # or whatever the dark bg is
  cleanup:
    - click: { selector: "[data-testid='theme-toggle']" }   # restore default
```

### Action verbs (use these only)

| Verb | Args | Purpose |
|------|------|---------|
| `navigate` | url string | Go to a URL |
| `click` | `{ selector }` | Click an element |
| `fill` | `{ selector, value }` | Fill an input |
| `select` | `{ selector, value }` | Select a dropdown option |
| `check` / `uncheck` | `{ selector }` | Checkbox/radio |
| `press` | `{ key }` | Keyboard key (e.g., "Enter") |
| `hover` | `{ selector }` | Hover an element |
| `wait_for` | `{ selector, timeout_ms? }` | Wait for element |
| `wait_for_url` | `{ pattern, timeout_ms? }` | Wait for URL match |
| `screenshot` | `{ name }` | Capture screenshot |

### Assertion verbs

| Verb | Args | Purpose |
|------|------|---------|
| `element_visible` | `{ selector }` | Element is present + visible |
| `element_hidden` | `{ selector }` | Element is hidden or absent |
| `text_equals` | `{ selector, expected }` | Exact text match |
| `text_contains` | `{ selector, substring }` | Substring match |
| `attribute_equals` | `{ selector, attribute, expected }` | Attribute value |
| `css_property` | `{ selector, property, matches }` | Computed style |
| `url_matches` | `{ pattern }` | URL regex/glob |
| `count_equals` | `{ selector, expected }` | Element count |

### Selector rules

- **Prefer `[data-testid='...']`** — stable, decoupled from styling.
- Fall back to `[aria-label='...']`, `role=...` if test IDs aren't available in the codebase.
- **Avoid** XPath, deeply nested CSS, or text-based selectors unless the text is part of the assertion itself.

If the codebase doesn't use test IDs and the plan introduces UI elements, **the plan should add test IDs** as part of the implementation. Note this in the report so `pi-dev-build` adds them.

---

## Phase 4 — Validate

Before saving, check:
1. Every story has a unique `id`.
2. Every story references at least one plan `task_ref` (`[N.M]` format).
3. Every step uses a verb from the allowed list.
4. Every assertion uses a verb from the allowed list.
5. Stories cover every UI-touching task at least once.
6. Selectors are testid-first where possible.

If any check fails, fix before saving. Don't save half-validated stories.

---

## Phase 5 — Save and Report

Write to `STORIES_FILE` using `write`. The file format:

```md
---
slug: <slug>
plan: artifacts/plans/<slug>/plan.md
generated: <ISO timestamp>
story_count: <N>
---

# User Stories: <plan title>

These stories validate the UI-touching tasks in the plan. Run them with the
project's Playwright runner (or via `bowser` / `ui-reviewer`) after build.

## Stories

```yaml
<the story YAML blocks>
```

## Coverage Map

| Story | Task | Description |
|-------|------|-------------|
| story-1 | [2.1] | <one-line summary> |
| story-2 | [2.1] | <one-line summary> |
| story-3 | [2.3] | <one-line summary> |

## Out of Scope (no UI surface)

- [1.1] <task description>
- [3.4] <task description>
```

### Report

```text
✅ User Stories Generated

Slug:    <slug>
File:    artifacts/plans/<slug>/stories.md
Stories: <count> covering <count> UI-touching tasks
Skipped: <count> non-UI tasks (listed in Out of Scope)

Next step:
  Run with the Playwright runner / bowser / ui-reviewer after pi-dev-build completes.
  If selectors require new data-testid attributes, pi-dev-build should add them.
```

---

## Notes

- **One stories file per plan.** If a plan is sharded, generate stories at the parent slug level (`artifacts/plans/<slug>/stories.md`), not per shard.
- **Stories are not the test runner.** This skill produces the spec; an external runner executes it. Don't try to run stories from inside this skill.
- **Test IDs over text.** Text-based selectors break on copy edits. Encourage `data-testid` adoption as part of the plan.
- **Deterministic flows only.** If the plan introduces non-deterministic UI (animations, async state without observable settled signals), the story must include explicit `wait_for` steps tied to settled-state markers.
