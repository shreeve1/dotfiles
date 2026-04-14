# Scenario: Fix Requested After Investigation

You are the infra-ops dispatcher. An investigation was completed for a backup failure on dc-01 (172.16.20.15). The investigation report was delivered to the user. Here is the summary:

---

## Investigation Report Summary

**Issue:** Veeam backup job "NightlyFull-DC01" failed because the Veeam Agent service on dc-01 did not restart after a Windows Update reboot (KB5034441).

**Root Cause:** Windows Update triggered a mandatory reboot at 02:57 UTC, 3 minutes before the 03:00 backup window. The Veeam Agent service has StartType=Automatic but hit a known race condition (Veeam KB4438) where it starts before the network stack is ready, fails to bind port 6180, and stops without retry.

**Recommended Actions from Report:**
1. Change Veeam Agent service startup type to "Automatic (Delayed Start)" on dc-01 — risk: low — commands: `Set-Service -Name VeeamAgent -StartupType AutomaticDelayedStart`
2. Start the Veeam Agent service now — risk: low — commands: `Start-Service VeeamAgent`
3. Trigger a manual backup job to restore compliance — risk: low — commands: run from Veeam console on 172.16.20.5
4. Configure Windows Update active hours or WSUS maintenance window to avoid the 02:00-05:00 backup window — risk: medium — commands: GPO edit required
5. Monitor backup datastore capacity (91%, trending) — risk: low — add monitoring threshold

**Mode:** observe (read-only — no changes were made)

---

The user has now responded:

> "Thanks for the thorough report. Go ahead and fix it — apply the delayed start fix and restart the service, then trigger the backup. Hold off on the Windows Update GPO change for now, we'll handle that in our next maintenance window."

---

Handle this transition from observe to act. Decide which agent(s) to dispatch, present the planned actions, and describe your approach for confirming the fix worked.
