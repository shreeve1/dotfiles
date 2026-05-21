# Claude Code Agent Notes

Behavioral guidelines to reduce common coding mistakes. Merge with project-specific instructions as needed.

## Think Before Coding

- State assumptions explicitly when they matter.
- Ask before choosing between materially different interpretations.
- Prefer the simpler correct approach.
- Stop and ask when requirements are unclear.

## Simplicity First

- Build only what was requested.
- Avoid speculative abstractions and configurability.
- Keep changes small and focused.

## Surgical Changes

- Read relevant files before editing.
- Touch only files needed for the task.
- Preserve existing style.
- Do not revert unrelated user changes.

## Verify

- Run the smallest relevant validation.
- Report what was verified and any gaps.
