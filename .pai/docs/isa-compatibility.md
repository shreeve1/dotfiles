# ISA Compatibility

ISA is the canonical shared work artifact. PRD compatibility exists only to keep legacy Claude and Codex hooks working during migration.

## Mapping

- PRD title maps to ISA frontmatter `name` and the `Goal` section.
- PRD status maps to ISA frontmatter `phase`.
- PRD progress maps to ISA frontmatter `progress` and `Verification` context.
- PRD criteria map to ISA `Criteria` with stable `ISC-NN` IDs.
- PRD plan maps to ISA `Features` and imported `Decisions` notes.
- PRD changelog maps to ISA `Changelog`.
- PRD verification/finalization state maps to ISA `Verification`.

## Fixed ISA Section Order

Canonical ISA rendering uses this Algorithm order: Problem, Vision, Out of Scope, Principles, Constraints, Goal, Criteria, Test Strategy, Features, Decisions, Changelog, Verification.

## Compatibility PRDs

Compatibility PRDs are generated only when a legacy hook explicitly requires PRD-shaped state. They are marked `compatibility_write: true` and `canonical_source: ISA`; they are not the source of truth.

## Migration Order

1. read support
2. dual-read
3. canonical-write
4. legacy read-only
5. removal

Tests use fixtures only and do not invoke live Claude or Codex hooks.
