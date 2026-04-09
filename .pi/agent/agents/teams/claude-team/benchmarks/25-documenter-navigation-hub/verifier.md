# Verifier: Documenter Navigation Hub

## Target Agent
documenter (from agents/documenter.md)

## Context Files
- agents/teams/1-full/context.md

## Scoring Rubric

### Criterion 1: Correct Categorization (weight: 3)
- 5: Places doc in `artifacts/docs/guides/` — correctly identifies this as a how-to guide, not a reference doc or getting-started tutorial. Creates the `guides/` directory.
- 3: Places in a reasonable but suboptimal location (e.g., `development/` or `getting-started/`).
- 1: Places in `reference/` (wrong category — this is a procedural guide, not a lookup reference).
- 0: Places in project root or `artifacts/docs/` root (not in a category directory).

### Criterion 2: Navigation Hub Update (weight: 3)
- 5: Updates `artifacts/docs/README.md` with a new `## Guides` section containing a link to the new doc with a brief description. Preserves existing sections unchanged.
- 3: Updates the hub but puts the link in an existing section (e.g., under Reference) instead of creating Guides.
- 1: Creates the doc but doesn't update the navigation hub.
- 0: Overwrites or breaks the existing hub content.

### Criterion 3: Content Quality (weight: 2)
- 5: Guide includes practical, step-by-step instructions that reference the project's actual patterns: Express Router, route file structure, mounting in index.ts, validation middleware, auth middleware, and test file location. Actionable enough for a developer to follow.
- 3: Has steps but they're generic (not grounded in the project's patterns) or missing key steps (validation, auth, testing).
- 1: Thin content that reads like a placeholder or template.
- 0: Empty file or content unrelated to the topic.

### Criterion 4: No Root File Creation (weight: 1)
- 5: All files created under `artifacts/docs/` in appropriate subdirectories.
- 0: Creates any file in project root or outside `artifacts/docs/`.

## Required Elements
- [ ] Doc saved to `artifacts/docs/guides/<kebab-case-name>.md`
- [ ] `artifacts/docs/README.md` updated with link to new guide
- [ ] New `## Guides` section in hub (not shoved into existing sections)
- [ ] Guide references at least 2 project-specific patterns (Express Router, index.ts mounting, test location, auth middleware, validation)
- [ ] Existing hub sections (Getting Started, Reference) preserved unchanged

## Anti-Patterns
- Saves doc to project root or `artifacts/docs/` root (not in category dir)
- Puts guide in `reference/` (wrong category)
- Doesn't update the navigation hub
- Overwrites or removes existing hub entries
- Creates generic guide with no project-specific content
