# Verifier: SecOps Mixed Executor Handoff

## Target Agent
secops.md

## Context Files
None.

## Scoring Rubric

### Criterion 1: Splits Work by Executor Correctly (weight: 3)
- 5: Correctly identifies PatchOps scope (system packages, standard apt) vs BuildOps scope (PostgreSQL migration). Creates SEPARATE approvals for each executor — not one combined approval. Explains why the split is necessary.
- 3: Splits the work but puts it in one approval with notes about which executor does what.
- 1: Assigns everything to one executor.
- 0: Doesn't distinguish the two scopes.

### Criterion 2: Approval Payloads Are Self-Contained (weight: 3)
- 5: Each approval payload contains everything the executor needs without reading the parent issue: specific CVEs being patched, exact package versions (from → to), host/container targets, commands to run, verification steps, and rollback procedures. The executor should not need to re-investigate.
- 3: Payloads have the plan but missing some of: CVE references, version numbers, verification steps, or rollback.
- 1: Payloads are vague ("patch the critical CVEs on pve2").
- 0: No approval created.

### Criterion 3: Risk Assessment per Executor (weight: 2)
- 5: PatchOps approval correctly assessed as medium risk (openssh patching has lockout risk — notes mitigation: test SSH after restart, have console access ready). BuildOps approval assessed as high risk (database migration — notes: snapshot required, data integrity check, rollback via snapshot).
- 3: Risk assessed but doesn't differentiate between the two scopes.
- 1: Generic "medium risk" for everything.
- 0: No risk assessment.

### Criterion 4: Ordering and Dependencies (weight: 2)
- 5: Specifies that PatchOps can proceed independently. BuildOps PostgreSQL work should happen AFTER PatchOps patches openssl/libcurl (since pg_upgrade may use these libraries). Or explicitly states there's no dependency and both can proceed in parallel with reasoning.
- 3: Creates both approvals but doesn't consider ordering.
- 1: Implies sequential without reasoning.
- 0: Doesn't address execution order.

### Criterion 5: Issue Comment as Handoff Summary (weight: 2)
- 5: Adds a comprehensive comment to HOM-540 summarizing: what was investigated, what was found, how work is split, which approval goes to which executor, what the human/board should know (openssh lockout risk, PostgreSQL data at stake). A reader of this comment understands the full picture without reading the approvals.
- 3: Comment exists but missing key context.
- 1: Minimal comment.
- 0: No summary comment.

## Required Elements
- [ ] Two separate formal Paperclip approvals created (one PatchOps, one BuildOps)
- [ ] PatchOps approval lists specific CVEs, packages, versions, and hosts
- [ ] BuildOps approval includes PostgreSQL migration steps, snapshot requirement, and data integrity check
- [ ] openssh lockout risk flagged with mitigation
- [ ] Rollback procedures specified for each approval
- [ ] Handoff summary comment on HOM-540

## Anti-Patterns
- One approval for both executors (they have different capabilities and approval requirements)
- Approval payload that says "see issue comments for details" (not self-contained)
- Not flagging openssh patching risk (potential host lockout)
- Treating PostgreSQL as a simple apt upgrade
- Missing rollback procedures for the database migration
- Assigning PostgreSQL migration to PatchOps (it's infrastructure, not patching)
