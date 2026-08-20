---
name: langgraph-preapproval-safety-gate
description: Move a deterministic safety gate from actuate/verify-time to the langgraph request_approval node so wrong-host/wrong-target nearest-guess proposals never page the operator.
---

# Move a deterministic safety gate from actuate/verify-time to pre-approval

Use when a langgraph investigation repeatedly produces wrong-target remediation
proposals (e.g. cross-host nearest-guess tuples reaching the Slack page),
because an existing deterministic gate runs only *after* the approval interrupt.

## Procedure

1. **Reuse the gate's authority verbatim.** The executor's helpers (e.g.
   `incident_affected_host`, `host_congruent`) are the existing congruence
   authority. Import them as a module (not as a duplication) so pre-approval
   and actuate-time verdicts can never diverge.

2. **Insert the guard in `request_approval`.** Place it AFTER the
   unknown-tuple hold block and BEFORE `port.disposition(...)`. Even a stale
   always-allow grant cannot bypass the gate this way.

3. **Add a new `HoldCause` enum value.** Do not reuse `policy_unsupported` —
   the operator digest must read the actual cause. Update
   `escalation.REASON_LABELS` and `escalation.REASON_PRECEDENCE` for the new
   value or the enum-coverage tests fail.

4. **Guard condition `incident_host is not None`.** Unresolved incidents
   should fall through to the page (existing tests signal without `instance`)
   and still fail-closed at the actuate backstop, not be further tightened
   here.

5. **Exempt propose-only sources** (wazuh / ADR 0012). They always page and
   never actuate, so congruence is irrelevant to them. The carve-out is
   `not propose_only` in the guard condition.

6. **Repoint existing cross-host tests.** They asserted the hold at actuate
   with `hold_cause=COMMAND_FAILED`. Now assert `hold_cause` is the new
   value, `approver.posted == []`, `__interrupt__ not in result`, no SSH argv,
   and the chain ends at `hold_and_escalate`.

7. **Add a congruent-path regression test.** Drives the happy path through
   the new guard with a host that matches `TARGET_HOSTS[target]`, asserting
   the run still suspends at `approval_interrupt` with
   `result["approval"]["status"] == "pending"`.

8. **Bump every count assertion.** `test_hold_cause_has_exactly_ten_values`
   → `_eleven_values`,
   `test_reason_precedence_is_a_total_order_of_the_ten` → `_eleven`. Update
   docstrings/headers that say "ten" or "nine" — including test-file module
   docstrings. Run the full `test_langgraph_*` suite, not just the targeted
   slice, because count assertions can hide behind grep-invisible cosmet-
   ics.

## Known limitation (record inline)

`TARGET_HOSTS[target]` for pct-exec targets (e.g. `npmplus → ("pve4",)`) is
the SSH host, not the service host. A legitimate affected-host incident for
such a target will now hold pre-approval — same terminal outcome as the
executor backstop, just earlier. Fixing the congruence authority requires a
separate `target → expected-incident-host` map shared by both gates; do NOT
overload `TARGET_HOSTS` (the executor needs the SSH destination).

## Anti-patterns

- Reusing `policy_unsupported` for a host-class hold — operator digest
  becomes misleading.
- Duplicating the authority instead of importing the executor helpers —
  pre-approval and backstop can diverge.
- Skipping the full-suite regression — count assertions often hide in
  cosmetic test names.
- Loosening the guard to `is_known(...)` only without `incident_host is not None`
  — would break tests whose signal omits `instance`.
