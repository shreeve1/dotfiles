# Verifier: Context Compression Awareness

## Target Agent
scout (from agents/scout.md)

## Context Files
- agents/teams/1-full/context.md

## Scoring Rubric

### Criterion 1: Output Compression (weight: 3)
- 5: Report is ≤80 lines. Synthesizes patterns and relationships; never dumps raw file contents or full function signatures. Every line earns its place.
- 3: Report is 80-120 lines. Mostly summarized but includes some unnecessary detail (full import lists, verbose type definitions, or exhaustive function enumerations).
- 1: Report is 120-180 lines. Significant raw content or per-file dumps with minimal synthesis.
- 0: Report exceeds 180 lines or pastes large code blocks verbatim.

### Criterion 2: Downstream Relevance Filtering (weight: 3)
- 5: Report is laser-focused on what the planner needs for email digest: the notification pipeline, template system (especially `{{#each}}`), the unused `digestFrequency` preference field, queue structure, and EmailProvider interface. De-emphasizes or omits SMS/Push/Webhook details.
- 3: Covers relevant areas but gives equal weight to irrelevant providers (SMS, Push, Webhook) or spends significant space on test file details.
- 1: Lists everything found without prioritizing by relevance to the digest feature.
- 0: Misses the key integration points (unused digestFrequency field, template each-blocks, queue structure).

### Criterion 3: Structural Clarity (weight: 2)
- 5: Clear sections (Structure, Key Findings, Relationships, Handoff Notes). File:line references for key integration points. End-to-end flow summary showing notification → queue → provider path.
- 3: Has sections and some file:line references but missing flow summary or relationship mapping.
- 1: Flat list of findings without clear organization.
- 0: Unstructured prose dump.

### Criterion 4: Gaps Flagged (weight: 1)
- 5: Explicitly notes what was NOT explored (e.g., "did not read test files in detail", "webhook dispatcher irrelevant to digest") and what the planner might still need to investigate.
- 3: Mentions some limitations but doesn't clearly distinguish explored vs. skipped areas.
- 1: No mention of what was omitted or why.
- 0: Claims comprehensive coverage of all files.

## Required Elements
- [ ] Report is ≤120 lines total
- [ ] File:line references for at least 4 key integration points (not every function)
- [ ] Identifies the unused `digestFrequency` field in UserPreferences as a key finding
- [ ] Identifies TemplateEngine's `{{#each}}` support as relevant to digest rendering
- [ ] Identifies that `sendBulk` has no digest/aggregation concept
- [ ] Does NOT paste full function bodies or multi-line code blocks (>5 lines)

## Anti-Patterns
- Dumps full file contents or function implementations verbatim
- Reports on every file equally without prioritizing by digest relevance
- Exceeds 150 lines (context budget awareness failure)
- Lists all 15 files with equal detail instead of focusing on the 5-6 relevant ones
- Omits the Handoff Notes section (planner can't act without modification targets)
