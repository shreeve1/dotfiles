# Verifier: Cross-Platform Diagnosis

## Target Agent
analyst.md (from agents/infra-ops/)

## Context Files
context.md (from teams/2-infra-ops/)

## Scoring Rubric

### Criterion 1: Root Cause Identification (weight: 3)
- 5: Correctly identifies that the machine account password rotation broke the AD trust for TrueNAS. TrueNAS still has the old password, so Kerberos authentication between TrueNAS and AD is broken. New Kerberos service ticket requests for `cifs/nas-01` fail because the shared secret is out of sync.
- 3: Identifies the password rotation as the cause but doesn't explain the Kerberos mechanism
- 1: Blames the wrong component (e.g., "AD group membership issue" or "SMB share permissions")
- 0: Cannot identify the root cause

### Criterion 2: Explains Partial Failure Pattern (weight: 3)
- 5: Correctly explains why only 3 users are affected: users with cached/valid Kerberos service tickets from before the password rotation can still access the share (ticket was issued when trust was intact). The 3 affected users' service tickets expired or were never cached (e.g., they logged in fresh this morning, or their tickets had shorter lifetimes). Once all cached tickets expire, ALL users will be affected.
- 3: Notes that some users work and some don't, suggests caching is involved, but doesn't fully explain the Kerberos ticket caching mechanism
- 1: Can't explain the partial failure (e.g., "might be a permissions issue for those specific users")
- 0: Doesn't address why only some users are affected

### Criterion 3: Cross-Platform Awareness (weight: 2)
- 5: Addresses both Windows and Linux clients. Notes that the Ubuntu user (rlopez) authenticates via the same Kerberos/AD mechanism (likely via sssd or winbind + krb5), so the same root cause applies. Remediation covers both platforms (Windows clients may need `klist purge` + re-auth, Linux clients may need `kdestroy` + `kinit`).
- 3: Mentions both platforms but remediation only covers one
- 1: Only addresses Windows or only addresses Linux
- 0: Ignores the platform difference entirely

### Criterion 4: Remediation Plan Quality (weight: 2)
- 5: Provides a clear remediation sequence: (1) Re-join TrueNAS to AD with the new machine account password, (2) Verify SMB service is sharing with Kerberos auth, (3) Have affected users purge cached tickets and re-authenticate, (4) Verify access restored for all 3 users on both platforms. Includes rollback: if re-join fails, temporarily revert the machine account password.
- 3: Correct general approach but missing steps or platform-specific details
- 1: Vague ("fix the AD trust") without specific steps
- 0: Wrong remediation

### Criterion 5: Predictive Warning (weight: 1)
- 5: Warns that this will get worse — as more users' cached tickets expire, more will be affected. This is urgent even though only 3 users are impacted now. Also recommends a process improvement: future machine account rotations should include re-joining dependent services.
- 3: Mentions urgency but doesn't explain the escalation pattern
- 1: Treats this as a stable 3-user issue
- 0: No urgency assessment

## Required Elements
- [ ] Root cause: machine account password rotation broke AD trust for TrueNAS
- [ ] Kerberos mechanism explained (service ticket issuance fails with stale shared secret)
- [ ] Partial failure explained via cached vs. expired Kerberos tickets
- [ ] Both Windows and Linux remediation steps included
- [ ] Re-join TrueNAS to AD as the primary fix
- [ ] Warning that more users will be affected as tickets expire

## Anti-Patterns
- Blaming AD group membership (all 3 users ARE in the group — this was already checked)
- Suggesting SMB share permission changes (permissions are fine)
- Ignoring the password rotation clue (it's the smoking gun)
- Windows-only remediation (rlopez is on Ubuntu)
- No urgency — treating 3/8 affected as a stable, low-priority issue
