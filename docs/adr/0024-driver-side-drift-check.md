---
status: accepted
---
# 0024 — Driver-side drift check against the spec and grill ledger

Partially supersedes [0007](./0007-ralph-single-worker-per-issue.md): the driver runs one reviewer again, for one narrow question.

Scope: local `.kanban` boards only. `bin/gralph`'s GitHub mode (no `--board`) has no drift check, and a GitHub spec issue has no frontmatter for a `ledger:` line.

## Context

Work drifted from what the user agreed in the grill. The pipeline is grill → `/to-spec` → `/to-tickets` → `tralph` workers → `/finish-spec`, and every step after the spec trusted the spec:

- `/to-spec` wrote the spec from the conversation. A long grill loses its early decisions from context, and nothing compared the spec with the grill ledger (`.kanban/grilling/<topic>.md`).
- The per-ticket review lives inside the worker (ADR 0007). The worker rules on its own reviewers' findings, and only an upheld high-severity finding blocks, so a worker can reject a real spec contradiction. The default worker model is a small one (`cliproxy/deepseek-v4.1-flash`).
- Board mode recorded every DONE lane with a hardcoded `reviewGate: "accepted"` and never spawned or read a reviewer.
- `/finish-spec` walked the spec's acceptance criteria, not the grill.

## Decision

Check against the grill at three points.

- **Ledger format.** The `grilling` skill keeps fixed `## Decisions` and `## Defaults` headings; the three checks read those. Defaults are advisory unless they name user-visible behaviour or scope. For a ledger without those headings, A and B read the whole ledger.
- **A — `/to-spec`.** The spec gets a `ledger:` frontmatter line. Before publishing, every ledger decision is shown to the user as honoured, MISSING or CONTRADICTED, and the user approves the table.
- **C — both local-board drivers, per ticket.** After a worker's DONE, the driver (not the worker) runs `.agents/skills/ralph/ralph-drift-check.sh`.
  - The reviewer is one fresh `pi -p` on `cliproxy/claude-opus-5-5`, falling back to `cliproxy/gpt-6.1-sol`. It is read-only by construction (`--tools read,grep,find,ls`, no skills or context files); the ticket, spec, ledger and diff arrive on stdin. Nothing in the working tree is modified or reverted.
  - It answers only whether the diff contradicts a recorded decision or builds something under Out of Scope, and a finding must quote both the decision and the code. It ends with `DRIFT_CHECK: PASS | DRIFT | DEGRADED | SKIPPED | ERROR`.
  - The range covers the whole ticket: from the parent of its first `(#ID)` commit to HEAD, so a resumed or retried ticket's earlier work is checked.
  - `DRIFT` and `ERROR` (ticket or named spec missing, bad range, script missing) block. `PASS`, `DEGRADED` (no model answered) and `SKIPPED` (no spec) do not; the verdict is recorded on the ticket under `## Drift check`.
  - Sequential (`ralph-loop.sh`), including `--review-loop`: the ticket goes `blocked` with a `## Blocker` that starts **Drift check — needs the user** and tells workers not to edit the spec or ledger. The loop stops if the status cannot be set.
  - Board (`bin/gralph --board`): the diff is taken from the lane worktree but the ticket and spec from the live board, so an uncommitted board is still checked. A blocked lane does not land, its branch is kept, the ticket is parked `blocked`, and a `ready-for-human` repair ticket with the findings is filed (like a bounced lane). The other lanes still land; the run exits 3.
  - The `tralph-shepherd` skill raises drift blocks with the user and never hands them back to a worker.
- **B — `/finish-spec`.** A step walks every ledger decision against the merged code as honoured, contradicted or not applicable (process decisions, superseded lines). A contradiction is a gap, and the spec cannot close while one stands.

One script serves both drivers, because a behaviour added to only one driver does not exist in the other.

## Considered options

- **Use a bigger worker model.** Drifts less but still drifts, costs more on every ticket, and gives no signal for how much drift there is. `RALPH_MODEL` can still be switched per run.
- **Strengthen the worker's own review.** The worker still rules on the findings; the conflict of interest is the gap.
- **Check only at `/finish-spec`.** Catches drift after the whole spec is built, when it costs most to fix.
- **Detect and revert reviewer edits after the fact** (the first version). Reverted other sessions' edits in a shared tree; replaced by a tool allowlist.
- **Retry a drift-blocked lane with `--replan`** (the first version). Broke when another lane in the same run had landed; replaced by the repair-ticket path.

## Consequences

- One extra strong-model call per spec'd ticket. ADR 0007's cost argument still holds for the general review; this reviewer has a narrow prompt and a narrow block rule.
- A false DRIFT stalls a ticket until the user looks. Mitigation: findings must quote the decision, Defaults are advisory, and the user decides.
- Specs written before this have no `ledger:` line: C checks them against the spec only, B skips the ledger walk.
- In a shared tree, the sequential range can include another session's commit made during the ticket; a finding citing a file the ticket never touched is a false positive for the user to dismiss.
- Wiki claim C-0157 ("board mode never spawns a reviewer") is superseded.
