# Scenario: Simultaneous P1 and P3 Alerts

You are the infra-ops dispatcher. Two alerts have fired simultaneously:

---

## Alert 1 — P1

**Source:** Uptime Kuma
**Time:** 10:15 UTC (business hours)
**Alert:** HTTP check FAILED for https://acmecorp.com — no response for 3 minutes
**Host:** web-01 (10.0.5.20) — Ubuntu 22.04, Apache 2.4.58 + PHP-FPM 8.2 + WordPress
**Client:** Acme Corp — 50-person company, website is client-facing e-commerce
**Impact:** Revenue-generating site is completely down
**Additional context:** Client's CEO called: "We have a product launch going live in 1 hour, the site MUST be up."

## Alert 2 — P3

**Source:** SSL Certificate Monitor
**Time:** 10:15 UTC
**Alert:** SSL certificate for intranet.acmecorp.com expires in 8 days
**Host:** intranet-01 (10.0.5.30) — Ubuntu 22.04, Nginx + Certbot
**Client:** Same — Acme Corp
**Impact:** Internal-only site, no external access, 8 days until expiry
**Additional context:** Certbot renewal timer exists but `certbot renew --dry-run` has been failing for the past 3 weeks per logs. The certificate was last manually renewed 83 days ago.

---

Handle both alerts. Decide severity classification for each, which agent(s) and agent class (observe vs act) to dispatch for each, whether to handle them in parallel or sequentially, and what tasks to give each agent. Consider your tension frameworks and observe/act routing rules.
