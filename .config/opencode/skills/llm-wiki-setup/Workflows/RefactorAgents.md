# Refactor AGENTS.md Workflow

Use this workflow to add project-local LLM Wiki operating rules to `AGENTS.md` while preserving existing instructions.

## Rules

- Read `AGENTS.md` before editing.
- If `AGENTS.md` does not exist, create it with a concise project agent guide and the LLM Wiki section from `Templates.md`.
- If it exists, preserve every existing rule unless James explicitly approves removal.
- Prefer a light reorganization over a rewrite.
- Do not duplicate existing sections.
- Keep the LLM Wiki section operational, not philosophical.

## Procedure

1. Identify existing sections and project-specific rules.
2. Determine whether a `LLM Wiki` section already exists.
3. If absent, insert the section after project overview/editing conventions if present; otherwise append it near the end.
4. If present, update it to include directories, required files, ingest, query, promotion, and lint workflows.
5. Preserve local style: heading levels, tone, and path formatting. Remap the template's `##` and `###` heading depths to fit the surrounding `AGENTS.md` hierarchy instead of pasting them verbatim when that would break structure.
6. Verify no existing non-wiki instruction was removed.

## Required Content

The final `AGENTS.md` must mention:

- `wiki/raw/` is immutable.
- `wiki/candidates/` is the review gate.
- Read `wiki/ROUTING.md` and `wiki/index.md` before wiki-backed answers.
- Append operations to `wiki/log.md`.
- Track factual claims in `wiki/CLAIMS.md`.
- Offer to save durable query outputs as candidate pages.

## Verification

Use a diff review before claiming completion. Confirm:

- Existing rules remain present.
- The LLM Wiki section exists once.
- Paths match the project wiki layout.
