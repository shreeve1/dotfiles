# Verifier: Maintenance Planning

## Target Agent
operator.md (from agents/infra-ops/)

## Context Files
context.md (from teams/2-infra-ops/)

## Scoring Rubric

### Criterion 1: Correct Dependency Ordering (weight: 3)
- 5: Respects all dependency constraints: (a) dc-01 must be up before docker-01 reboots (DNS fallback), (b) db-01 backup before PostgreSQL upgrade, (c) pfSense reboot scheduled when nurse station impact is minimized and communicated, (d) PBS verify doesn't overlap with backup-dependent operations. No circular or impossible ordering.
- 3: Most dependencies correct but one ordering mistake (e.g., rebooting docker-01 while dc-01 is down)
- 1: Major dependency violation (e.g., PostgreSQL upgrade before backup)
- 0: No dependency consideration

### Criterion 2: Rollback Plan Per Item (weight: 3)
- 5: Every maintenance item has a specific rollback: pfSense (boot to previous version or restore config backup), dc-01 (boot to last known good, or restore from backup if catastrophic), PostgreSQL (restore from pre-upgrade pg_dump), docker-01 (revert kernel with GRUB, or reinstall packages), PBS verify (cancel — non-destructive). Rollback steps are actionable, not just "roll back if it fails."
- 3: Rollback for the high-risk items (pfSense, dc-01, PostgreSQL) but missing for others
- 1: Generic "rollback if needed" without specific steps
- 0: No rollback planning

### Criterion 3: Timing and Feasibility (weight: 2)
- 5: All 6 items fit within 6 hours with realistic time estimates. Accounts for: boot times, update install times, verification after each step, and buffer for unexpected issues. Doesn't schedule items back-to-back without verification gaps. PBS verify (45 min) and backup restore test (30 min) can run in parallel with other work since they're non-disruptive.
- 3: Fits within the window but timing is tight or parallelization opportunities missed
- 1: Plan exceeds 6 hours or has unrealistic timing
- 0: No timing consideration

### Criterion 4: Pre-checks and Verification (weight: 2)
- 5: Includes pre-checks before starting (confirm backups are current, verify rollback media/configs are accessible, confirm nurse station has been notified) AND post-checks after each item (service comes back up, authentication works, DNS resolves, EHR is accessible). A clear "go/no-go" gate before each risky item.
- 3: Some pre/post checks but not systematic
- 1: "Verify it works" without specifics
- 0: No verification planning

### Criterion 5: Risk-Aware Sequencing (weight: 1)
- 5: Sequences items by risk awareness: starts with the backup restore test (validates recovery capability before making changes), does lower-risk items first to build confidence, saves the highest-risk item (pfSense firmware or dc-01 cumulative update) for when the team is warmed up but still has time budget for recovery. Explicitly notes which items are highest-risk.
- 3: Reasonable sequencing but doesn't articulate risk reasoning
- 1: Random or alphabetical ordering
- 0: Highest-risk items done first with no buffer

## Required Elements
- [ ] All 6 maintenance items included in the plan
- [ ] Dependency between dc-01 and docker-01 reboot is respected
- [ ] db-01 backup happens before PostgreSQL upgrade
- [ ] pfSense reboot impact on nurse station is addressed
- [ ] Rollback steps for pfSense, dc-01, and PostgreSQL are specific
- [ ] Plan fits within 6 hours with timing estimates
- [ ] Pre-flight checks included (backups current, rollback ready, nurse station notified)

## Anti-Patterns
- Rebooting docker-01 (Pi-hole) while dc-01 is also down (no DNS at all)
- PostgreSQL upgrade without a fresh backup first
- No rollback plan for pfSense firmware (if it bricks, ALL connectivity is lost)
- Scheduling all reboots back-to-back with no verification between them
- Ignoring the nurse station constraint (EHR must stay accessible except during pfSense reboot)
- Skipping the backup restore test ("we'll do it next quarter") — it's the one item that validates recoverability
