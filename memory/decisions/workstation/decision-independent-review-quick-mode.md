---
title: Independent Review Quick Mode
summary: Quick review mode: one fast reviewer covering gaps and breakage, diff plus call sites, max 5 findings; the full review is unchanged.
type: decision
status: promoted
created: 2026-10-29
updated: 2026-10-29
topics: [workstation]
---

## Decision

On 2026-10-29 James asked for a lighter run of the `independent-review` skill: full reviews are good but heavy and slow. The skill (dotfiles `.agents/skills/independent-review/`) now has a **quick mode** with no other switch:

- It fires only when his message adds "quick" (or "fast"); the plain ask keeps the full lens set. Full mode's lens table and model table are unchanged.
- One reviewer, lens `Quick` in `references/lenses.md`: the Gaps questions with the Skeptic correctness questions folded in.
- Model order `cliproxy/gpt-6-luna`, `cliproxy/glm-5.3-flash`, `cliproxy/minimax-m3`, `cliproxy/deepseek-v4.1-flash`; the first that is not Main's own model wins, then the usual fallback on quota or 429.
- Reads the change and its direct callers only; caps output at five high/medium findings and drops "What Went Well"; skips the cross-reviewer deduplication pass.

He named those four fast models himself; all four exist through cliproxy. Quick mode accepts blindness to design-level and minimalism findings, and says so in its verdict.

## Notes

- Parallelism was already there: full mode runs its lenses at once, so one reviewer saves cost and merging effort more than wall-clock. The slow parts are the big reviewer models and the thorough read of callers, tests, docs and config.

## Related

- [Fabric Child Model Tiers](memory/docs/knowledge/fabric-child-model-tiers.md): an unnamed child inherits Main's model, which is why quick mode names a model per reviewer.
