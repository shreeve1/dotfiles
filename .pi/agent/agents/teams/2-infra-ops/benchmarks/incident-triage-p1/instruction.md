# Scenario: Production Web Server Down

You are the infra-ops dispatcher. An alert has fired:

---

**Source:** Uptime Kuma
**Time:** 14:32 UTC (business hours)
**Alert:** HTTP check FAILED for https://clientsite.com — no response for 5 minutes
**Host:** web-01 (192.168.1.10) — Ubuntu 22.04 VM, running Apache + PHP-FPM + WordPress
**Client:** Acme Corp — 15-person accounting firm, website is client-facing
**Previous incidents:** None in the past 30 days. Clean baseline.
**Hypervisor:** Proxmox node-01 — all other VMs responding normally
**Additional context:** Client called their account manager saying "our website is completely down, we have a meeting with a potential client in 2 hours and need them to see our site"

---

Triage this incident. Decide severity, which agent(s) to dispatch first, and what task to give them. Consider the team's tension frameworks.
