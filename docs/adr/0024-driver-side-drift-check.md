---
status: accepted
---
# 0024 — Driver-side drift check against the spec and grill ledger

Partially supersedes [0007](./0007-ralph-single-worker-per-issue.md): the driver runs one reviewer again, for one narrow question.

## Context

Work drifted from what the user agreed in the grill. The pipeline is grill → `/to-spec` → `/to-tickets` → `tralph` workers → `/finish-spec`, and every step after the spec trusted the spec:

- `/to-spec` wrote the spec from the conversation. A long grill loses its early decisions from context, and nothing compared the spec with the grill ledger (`.kanban/grilling/<topic>.md`).
- The per-ticket review lives inside the worker (ADR 0007). The worker rules on its own reviewers' findings, and only an upheld high-severity finding blocks, so a worker can reject a real spec contradiction. The default worker model is a small one (`cliproxy/deepseek-v4.1-flash`).
- Board mode recorded every DONE lane with a hardcoded `reviewGate: "accepted"` and never spawned or read a reviewer.
- `/finish-spec` walked the spec's acceptance criteria, not the grill.

## Decision

Check against the grill at three points:

- **A — `/to-spec`.** The spec gets a `ledger:` frontmatter line. Before publishing, every ledger Decision and Default is shown to the user as honoured, MISSING or CONTRADICTED, and the user approves the table.
- **C — both drivers, per ticket.** After a worker's DONE, the driver (not the worker) runs `.agents/skills/ralph/ralph-drift-check.sh`: one fresh read-only `pi -p` reviewer on `cliproxy/claude-opus-5-5`, falling back to `cliproxy/gpt-6.1-sol`. It reads the ticket, its spec and the spec's ledger, and answers only whether the diff contradicts a recorded decision or builds something under Out of Scope. It ends with `DRIFT_CHECK: PASS | DRIFT | DEGRADED | SKIPPED`.
  - `DRIFT` blocks. Sequential: `done→blocked` with the findings in `## Blocker`. Board: the lane is recorded failed with sentinel `blocked` and reason `drift`, the findings and the drifted commit sha are kept in the run dir, and the lane branch is removed so a rerun with `--replan` can retry it.
  - `DEGRADED` (no model gave a verdict) and `SKIPPED` (no usable spec) never block.
  - A finding counts only when it quotes both the decision and the code (file:line).
- **B — `/finish-spec`.** A step walks every ledger decision against the merged code; a contradiction is a gap, and the spec cannot close while one stands.

One script serves both drivers, because a behaviour added to only one driver does not exist in the other.

## Considered options

- **Use a bigger worker model.** Drifts less but still drifts, costs more on every ticket, and gives no signal for how much drift there is. `RALPH_MODEL` can still be switched per run.
- **Strengthen the worker's own review.** The worker still rules on the findings; the conflict of interest is the gap.
- **Check only at `/finish-spec`.** Catches drift after the whole spec is built, when it costs most to fix.

## Consequences

- One extra strong-model call per spec'd ticket. ADR 0007's cost argument still holds for the general review; this reviewer has a narrow prompt and a narrow block rule.
- A false DRIFT stalls a ticket. Mitigation: findings must quote the decision; the user can fix the spec or ledger and set the ticket pending again.
- Sequential mode checks only the worker turn's commits (`WORKER_BASE_SHA..HEAD`); a resumed ticket's earlier-turn commits are not re-checked (marked `ponytail:` in `ralph-loop.sh`).
- Specs written before this have no `ledger:` line: C checks them against the spec only, B skips the ledger walk.
- Wiki claim C-0157 ("board mode never spawns a reviewer") is superseded.
