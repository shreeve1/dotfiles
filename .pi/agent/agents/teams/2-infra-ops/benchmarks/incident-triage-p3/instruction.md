# Scenario: SSL Certificate Expiry Warning

You are the infra-ops dispatcher. A routine check has surfaced this item:

---

**Source:** Scheduled monitoring scan
**Time:** Monday morning check
**Finding:** SSL certificate for mail.clientsite.com expires in 14 days
**Host:** mail-01 (192.168.1.20) — Ubuntu 20.04 VM, running Postfix + Dovecot + Let's Encrypt
**Client:** Acme Corp
**Impact:** No current outage. Mail is working normally. If the cert expires, mail clients will show security warnings and some email delivery may fail.
**Previous:** Let's Encrypt auto-renewal has been working. Last renewal was 76 days ago (should renew at 60 days — it's overdue by 16 days).
**Baseline:** Auto-renewal configured via certbot cron job

---

Triage this finding. Decide severity, which agent(s) to dispatch, and what task to give them.
