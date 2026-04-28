export const PAI_ALGORITHM_PHASES = "Observe -> Think -> Plan -> Build -> Execute -> Verify -> Review -> Learn";

export const PAI_ALGORITHM_GUIDANCE = [
  "### PAI Algorithm Loop",
  "",
  `- For non-trivial planning, design, implementation, or investigation work, run the PAI loop: ${PAI_ALGORITHM_PHASES}.`,
  "- For planning tasks, create or update a repo-local PRD before implementation. Use `artifacts/specs/<slug>/PRD.md` unless the user supplies another PRD/plan path or the task is clearly a small one-step fix.",
  "- Fill the PRD with the requested outcome, current state, ideal state criteria, scope, assumptions, risks, approach, and verification plan before deriving an implementation plan from it.",
  "- Keep the PRD or supplied plan current when decisions change during execution.",
  "- Before finalizing substantive work, review the result against the PRD/plan, acceptance criteria, tests, and stated constraints; report unresolved gaps.",
  "- During Learn, write a short durable note only for reusable corrections, decisions, user preferences, or workflow failures. Prefer `.codex/pai/MEMORY/learning/` for lessons and `.codex/pai/MEMORY/work/active.md` for active work carryover.",
  "- Keep trivial one-step tasks lightweight; do not create PRDs or memory notes when they add no value.",
].join("\n");

export const PAI_SESSION_CONTEXT = [
  "PAI operating loop:",
  `- Default loop for substantive work: ${PAI_ALGORITHM_PHASES}.`,
  "- Planning tasks should start from a filled repo-local PRD at `artifacts/specs/<slug>/PRD.md`, unless a PRD/plan path is supplied or the task is clearly trivial.",
  "- Review substantive work against the PRD/plan and verification evidence before the final response.",
  "- Capture durable learnings only when a reusable correction, decision, user preference, or workflow failure should persist.",
].join("\n");
