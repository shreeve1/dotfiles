# AGENTS.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

Tradeoff: These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

Don't assume. Don't hide confusion. Surface tradeoffs.

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

Minimum code that solves the problem. Nothing speculative.

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

Touch only what you must. Clean up only your own mess.

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

Define success criteria. Loop until verified.

Transform tasks into verifiable goals:

- "Add validation" -> "Write tests for invalid inputs, then make them pass"
- "Fix the bug" -> "Write a test that reproduces it, then make it pass"
- "Refactor X" -> "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

1. [Step] -> verify: [check]
2. [Step] -> verify: [check]
3. [Step] -> verify: [check]

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

* * *

These guidelines are working if: fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

<!-- PAI-CODEX-PORT:START -->
## PAI Codex Port

- This block defines the Codex-native PAI defaults; system, developer, and project AGENTS.md instructions still override it.
- Upstream PAI material under `.codex/pai` is advisory unless restated here or in an invoked PAI skill.
- Use `$pai-core` for PAI philosophy, memory routing, TELOS context, and port conventions.
- Consult `.codex/pai/USER` only when user-owned context is relevant to the current task.
- Use `.codex/pai/MEMORY` for durable local observations only when the task creates information worth preserving.
- Generated PAI skills are installed from `.codex/pai/skills/pai-*` into `$HOME/.agents/skills/pai-*`; existing `.codex/skills` dev-pipeline skills remain separate.
- Unsupported audio, desktop-alert, terminal-title, and provider-specific runtime behavior is intentionally disabled in this port.

### PAI Algorithm Loop

- For non-trivial planning, design, implementation, or investigation work, run the PAI loop: Observe -> Think -> Plan -> Build -> Execute -> Verify -> Review -> Learn.
- For planning tasks, create or update a repo-local PRD before implementation. Use `artifacts/specs/<slug>/PRD.md` unless the user supplies another PRD/plan path or the task is clearly a small one-step fix.
- Fill the PRD with the requested outcome, current state, ideal state criteria, scope, assumptions, risks, approach, and verification plan before deriving an implementation plan from it.
- Keep the PRD or supplied plan current when decisions change during execution.
- Before finalizing substantive work, review the result against the PRD/plan, acceptance criteria, tests, and stated constraints; report unresolved gaps.
- During Learn, write a short durable note only for reusable corrections, decisions, user preferences, or workflow failures. Prefer `.codex/pai/MEMORY/learning/` for lessons and `.codex/pai/MEMORY/work/active.md` for active work carryover.
- Keep trivial one-step tasks lightweight; do not create PRDs or memory notes when they add no value.
<!-- PAI-CODEX-PORT:END -->
