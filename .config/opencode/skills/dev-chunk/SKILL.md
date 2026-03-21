---
name: dev-chunk
description: >-
  Break a PRD into independently plannable feature chunks for dev-plan.
  Use when the user wants to decompose a PRD into smaller pieces, chunk a
  spec for incremental planning, or prepare features for parallel dev-plan
  execution. Activates on "chunk this PRD", "break this into chunks",
  "decompose for planning", "split the PRD", or when a PRD has multiple
  features that should be planned separately.
---

# Break a PRD into Plannable Chunks

Take a PRD produced by `dev-prd` and decompose it into independently plannable feature chunks. Each chunk carries just enough shared context (vision, tech stack, data model) for `dev-plan` to work without needing the full PRD.

Use this skill when a PRD has multiple features that would benefit from being planned and built incrementally. Do NOT use it when the PRD has only one feature, the user wants to plan everything at once, or the user wants to jump straight to implementation.

---

## Inputs

- A PRD file path (typically `artifacts/specs/prd-<name>-<date>.md`)
- If no path provided, search `artifacts/specs/` for PRD files and let the user pick

## Outputs

- Chunk files: `artifacts/chunks/<prd-slug>/NNN-req-name.md`
- Manifest: `artifacts/chunks/<prd-slug>/manifest.json`

---

## Phase 1 — Load and Parse the PRD

1. **Locate the PRD.**
   If the user provided a file path, use `read` to load it. Otherwise, use `glob` to find `artifacts/specs/prd-*.md`. If multiple PRDs match, use `question` to let the user pick. If none found, tell the user to run `dev-prd` first.

2. **Extract the shared context header** — these sections get included in every chunk so `dev-plan` has enough context to work independently:
   - Product name (from the document title)
   - Vision / Problem Statement
   - Target User
   - Tech Stack & Constraints
   - Data Model (entities, tables, relationships)
   - Key Interfaces / Integrations
   - Third-Party Integrations (external services or libraries)
   - Project Structure (suggested file/folder layout, if present)
   - Out of Scope (v1) — the PRD's global exclusions list; this feeds every chunk's Scope Boundary section
   - Open Questions — carry forward to chunks where relevant

   Keep this lean. Copy the relevant sections but trim verbose prose — a few sentences per item is enough.

3. **Extract features** by scanning for `#### Feature: <Name> #req-<id>` headings. For each feature capture:
   - Feature name and `#req-<id>` tag
   - Priority tier — determined by the parent `### Must Have (v1)` or `### Should Have (v1 stretch)` heading
   - All content under the feature heading until the next `####` or `###`:
     - User stories
     - Acceptance criteria (GIVEN/WHEN/THEN blocks)
     - Technical notes
   - Cross-references to other `#req-*` tags found in the feature's content — these become dependencies

4. **Parse Should Have features carefully.** The `### Should Have (v1 stretch)` section may not use `#### Feature:` headings — items might be bullet points or short paragraphs with `#req-<id>` tags inline. When this happens:
   - Treat each bullet or paragraph with a `#req-*` tag as a separate feature
   - Use the bullet text (or first sentence) as the feature name
   - If no `#req-*` tag is present on a Should Have item, generate a synthetic tag from the item text
   - Capture whatever acceptance criteria exist, even if not in formal GIVEN/WHEN/THEN format

5. **Handle missing `#req-*` tags globally.** If the PRD has no `#req-*` tags anywhere, fall back to `####` headings as feature boundaries. Generate synthetic tags from feature names (e.g., "User Authentication" becomes `#req-user-authentication`).

6. **Cross-validate against the Requirement Tags table.** The PRD's `## Requirement Tags` table maps every tag to a feature and priority. After extracting features, check that every tag in the table has a corresponding extracted feature. If any tags are missing, re-scan the PRD for those features — they may be in an unexpected location or format.

---

## Phase 2 — Propose Chunks

7. **Present proposed chunks** to the user as a summary table:

   ```
   Proposed chunks from: <PRD name>

   | # | Chunk                | Req Tag        | Priority  | Depends On     |
   |---|----------------------|----------------|-----------|----------------|
   | 1 | User Authentication  | #req-auth      | Must Have | —              |
   | 2 | Dashboard            | #req-dashboard | Must Have | #req-auth      |
   | 3 | Data Export           | #req-export    | Should Have | #req-dashboard |
   ```

   Number chunks in dependency order (see ordering rules below).

8. **Ask the user to review** using `question` with these options:
   - "Save chunks as proposed" (first/default option)
   - "Merge some chunks together"
   - "Split a chunk into smaller pieces"
   - "Exclude some chunks"

   **If merge:** Ask which chunks to combine. Create a single merged chunk containing both feature sections. Use the lower chunk number. Both req tags appear in the manifest entry.

   **If split:** Ask which chunk and how to divide it. The user describes the split boundary. Create two chunks from the original.

   **If exclude:** Ask which chunks to skip. Mark them as `excluded` in the manifest but do not create chunk files for them.

   Repeat the review loop until the user confirms the final set.

---

## Phase 3 — Write Chunks

9. **Create the output directory** using `bash`:

   ```sh
   mkdir -p artifacts/chunks/<prd-slug>
   ```

   The `<prd-slug>` is the PRD filename without its `.md` extension (e.g., `my-app-prd`).

10. **Write each chunk file** as `NNN-req-name.md` using `write` and the chunk template below. Numbering rules:
   - Zero-padded 3-digit prefix: `001-`, `002-`, etc.
   - Slug the req name: lowercase, hyphens for spaces
   - Dependencies always get lower numbers than the chunks that depend on them

11. **Write `manifest.json`** using `write` and the manifest structure below.

---

## Phase 4 — Report

12. Print a summary showing:
    - Number of chunks created
    - Output directory path
    - Dependency order visualization (simple list)
    - Suggested next step

    Example:
    ```
    Created 4 chunks in artifacts/chunks/my-app-prd/

    Dependency order:
      001-user-authentication (no deps)
      002-user-profiles       → depends on 001
      003-dashboard           → depends on 001
      004-data-export         → depends on 003

    Next: Plan the first chunk:
      /skill:dev-plan artifacts/chunks/my-app-prd/001-user-authentication.md
    ```

    **Important:** Always pass the chunk file path directly to `dev-plan`. `dev-plan` auto-discovers source docs in `artifacts/specs/` and `artifacts/brainstorming/` but does NOT search `artifacts/chunks/`. Passing the file path ensures `dev-plan` reads the chunk as its primary source. After planning, update `manifest.json` status from `pending` to `planned`.

---

## Chunk File Template

```markdown
# Chunk: <Feature Name>

> **Source PRD:** `<prd-file-path>`
> **Chunk:** <NNN> of <total>
> **Req Tags:** #req-<id>
> **Priority:** <Must Have | Should Have>

<!-- For merged chunks, list all tags: **Req Tags:** #req-<id1>, #req-<id2> -->

## Product Context

**Product:** <product name>
**Vision:** <1-2 sentence vision from PRD>
**Tech Stack:** <tech stack summary from PRD>

### Data Model (Relevant)

<Only the data model entities relevant to THIS feature.
Copy from the PRD data model section. Omit unrelated entities.>

### Key Interfaces

<Only the interfaces/integrations relevant to THIS feature.
Omit this section entirely if none apply.>

### Third-Party Integrations

<Only the external services or libraries relevant to THIS feature.
Omit this section entirely if none apply.>

### Project Structure

<Include the suggested file/folder layout from the PRD if present.
Omit this section if the PRD has no project structure.>

## Feature: <Feature Name> #req-<id>

<!-- For merged chunks, use "## Features" (plural) with a subsection per feature. -->

### User Stories

<Copy user stories exactly from the PRD.>

### Acceptance Criteria

<Copy acceptance criteria exactly from the PRD.
Preserve the GIVEN/WHEN/THEN format.>

### Technical Notes

<Copy any technical notes from the PRD for this feature.
Omit this section if none exist.>

## Dependencies

<List dependency chunks, or state "None — this chunk can be planned independently.">

- **#req-<dep-id>**: <dep feature name> (chunk NNN)

## Scope Boundary

This chunk covers ONLY the <feature name> feature. Do not include:

- <1-2 items explicitly out of scope that might be confused as in-scope>

**Global exclusions from PRD:**

- <Copy relevant items from the PRD's "Out of Scope (v1)" section>

## Open Questions

<Copy any open questions from the PRD that are relevant to THIS feature.
Omit this section if none apply.>
```

---

## Manifest Structure

```json
{
  "prd_source": "artifacts/specs/<name>-prd.md",
  "created_at": "<ISO 8601 timestamp>",
  "output_dir": "artifacts/chunks/<prd-slug>/",
  "chunks": [
    {
      "number": 1,
      "file": "001-req-name.md",
      "feature": "Feature Name",
      "req_tag": "#req-id",
      "priority": "must_have",
      "depends_on": [],
      "status": "pending"
    },
    {
      "number": 2,
      "file": "002-req-name.md",
      "feature": "Feature Name 2",
      "req_tag": "#req-id2",
      "priority": "must_have",
      "depends_on": ["#req-id"],
      "status": "pending"
    }
  ],
  "excluded": []
}
```

**Status values:**
- `pending` — chunk created, not yet planned
- `planned` — `dev-plan` has produced a plan for this chunk
- `built` — `dev-build` has executed the plan for this chunk
- `excluded` — user chose to skip this chunk during the review step

**Updating status:** Neither `dev-plan` nor `dev-build` currently know about the manifest. After running `dev-plan` on a chunk, manually update its status in `manifest.json` from `pending` to `planned`. After `dev-build` completes, update from `planned` to `built`. Use `edit` to change the status field in place. This keeps the manifest useful as a progress tracker across the full PRD.

---

## Dependency Ordering Rules

When numbering chunks:

1. Chunks with NO dependencies get the lowest numbers
2. A chunk's number must be HIGHER than all of its dependencies
3. Within the same dependency tier, order by priority (Must Have before Should Have)
4. Within the same priority, preserve the PRD's original feature order

---

## Edge Cases

- **Single-feature PRD:** Create one chunk. The lean context + scope boundary format is still useful for `dev-plan`.
- **Circular dependencies:** Flag to the user with `question`, asking them to choose which direction the dependency flows. Break the cycle before writing chunks.
- **Merged chunks:** Use the first chunk's number. Combine both features under a `## Features` section (plural). Store both req tags as an array in the manifest entry's `req_tag` field.
- **Very large features:** If a single feature has 10+ user stories, suggest splitting it. But only split if the user agrees — some features are legitimately large.

---

## Tool Usage Summary

| Tool | Purpose |
|------|---------|
| `read` | Load the PRD file |
| `glob` | Find PRD files in `artifacts/specs/` |
| `write` | Create chunk files and `manifest.json` |
| `bash` | Create output directory (`mkdir -p`) |
| `question` | Confirm chunks, handle merge/split/exclude decisions |
| `todowrite` | Track progress through phases |
