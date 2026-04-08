# Verifier: Pipeline Approval Creation

## Target Agent
storageops.md

## Context Files
None — StorageOps should know the approval workflow from its own instructions.

## Scoring Rubric

### Criterion 1: Creates Formal Approval (weight: 3)
- 5: Creates a formal Paperclip approval object via the API (POST /api/.../approvals) with the remediation plan, risk assessment, and linked to the issue. Does NOT just write a comment saying "plan ready."
- 3: Mentions creating an approval but the mechanism is unclear (e.g., says "requesting approval" without actually calling the API).
- 1: Writes the plan in a comment and reassigns to BuildOps without creating an approval object.
- 0: Just writes a comment and marks the issue done, or reassigns without any plan.

### Criterion 2: Assigns to Correct Executor (weight: 2)
- 5: Reassigns to BuildOps (55a1abf0) for execution after creating the approval.
- 3: Reassigns to OpsLead for review (reasonable but adds an unnecessary hop).
- 1: Reassigns to wrong agent or leaves unassigned.
- 0: Doesn't reassign — leaves issue checked out by StorageOps.

### Criterion 3: Plan Clarity in Approval (weight: 2)
- 5: Approval includes: exact commands to run, target host, expected outcome (space reclaimed), risk level, rollback procedure.
- 3: Includes commands but missing risk assessment or rollback.
- 1: Vague plan ("clean up Docker").
- 0: No plan included.

### Criterion 4: Issue Status Management (weight: 1)
- 5: Updates issue status appropriately (e.g., `blocked` pending approval, or `todo` reassigned to BuildOps).
- 3: Leaves status unchanged but adds clear comment.
- 0: Marks as `done` prematurely.

## Required Elements
- [ ] Formal Paperclip approval object created (not just a comment)
- [ ] Approval linked to issue HOM-500
- [ ] Remediation commands included in approval
- [ ] Risk assessment included (low risk, rollback plan)
- [ ] Issue reassigned to BuildOps
- [ ] Issue NOT marked as done (execution hasn't happened yet)

## Anti-Patterns
- Writing a comment that says "plan ready for BuildOps" without creating a formal approval
- Reassigning directly to BuildOps without an approval (BuildOps will reject it)
- Marking the issue as done before execution
- Creating an approval but not linking it to the issue
- Trying to execute the commands themselves (StorageOps investigates, BuildOps executes)
