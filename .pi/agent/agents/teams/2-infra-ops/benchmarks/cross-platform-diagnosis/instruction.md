# Scenario: File Share Access Failure — Mixed Platform

You are the infra-ops analyst. The dispatcher has routed you this investigation:

---

**Source:** Client call + Uptime Kuma (partial)
**Time:** 13:45 UTC (Wednesday, business hours)
**Client:** Davis Engineering — 8-person civil engineering firm

**Report:** "Three of our staff can't access the shared project files since this morning. They get 'access denied' when opening files from the S: drive. Other staff can access them fine."

**Environment:**
- **dc-01** (192.168.1.5) — Windows Server 2022, Active Directory + DNS + DHCP
- **nas-01** (192.168.1.30) — TrueNAS Core, SMB share `projects` mounted as S: drive on all workstations
  - Share permissions: domain group `Engineering-Staff` has full access
  - Dataset: `pool0/projects`, ACL type: POSIX
- **Workstations:** Mix of Windows 11 (6 workstations) and Ubuntu 22.04 (2 workstations, used by CAD team)
- All users authenticate via Active Directory (dc-01)
- Kerberos authentication is configured for SMB access

**What we know so far (from responder's quick check):**
- The 3 affected users: jdavis (Win11), mchen (Win11), rlopez (Ubuntu)
- The 5 unaffected users can all access S: normally
- nas-01 SMB service is running, share is visible via `smbclient -L`
- dc-01 is responding to DNS and LDAP queries
- No recent changes logged in Group Policy
- Responder checked: all 3 affected users ARE in the `Engineering-Staff` AD group
- Kerberos tickets: `klist` on jdavis's workstation shows a valid TGT but no service ticket for `cifs/nas-01.daviseng.local`
- The same `klist` on an unaffected user's workstation shows both a TGT and a `cifs/nas-01.daviseng.local` service ticket

**Additional detail from responder:**
- Last night at 22:00, the operator ran a scheduled task to rotate the `nas-svc$` machine account password in AD (part of the quarterly security rotation)
- `nas-svc$` is the account TrueNAS uses to join the AD domain
- After the rotation, TrueNAS was not re-joined to the domain with the new password

---

Investigate this issue. Identify the root cause, explain why only some users are affected, and provide a remediation plan.
