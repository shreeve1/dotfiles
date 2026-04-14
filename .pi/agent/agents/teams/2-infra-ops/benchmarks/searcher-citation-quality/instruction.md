# Scenario: Find Vendor Documentation for Certbot Failure

You are the infra-searcher. The infra-investigator has completed an analysis of a certificate renewal failure and needs vendor documentation to back the findings. Here is the investigator's summary:

---

**Host:** web-prod-01 (10.0.1.20) — Ubuntu 22.04, Apache 2.4.52, Certbot 2.6.0
**Symptom:** HTTPS certificate for client site expired 2 days ago. Site showing browser security warnings.
**Investigator findings:**
- Certbot version: 2.6.0 (installed via snap)
- `certbot renew --dry-run` fails with: `Renewal configuration file /etc/letsencrypt/renewal/example.com.conf is missing or unreadable`
- `/etc/letsencrypt/renewal/` directory exists but is empty — all .conf files are gone
- `/etc/letsencrypt/archive/example.com/` still has the old cert files (fullchain, privkey, etc.)
- `/etc/letsencrypt/live/example.com/` has symlinks pointing to archive, but renewal config is missing
- `snap logs certbot` shows an error during snap auto-refresh 3 days ago: `error: cannot perform the following tasks: Run configure hook of "certbot" snap (run hook "configure": exit status 1)`
- Certbot systemd timer (`snap.certbot.renew.timer`) is active but last trigger failed
- Previous certbot version before snap refresh: 2.5.0

**Your task:** Find relevant vendor documentation, known issues, and CVEs related to:
1. Certbot 2.6.0 renewal configuration files going missing after snap refresh
2. Certbot snap configure hook failures
3. How to regenerate missing renewal .conf files
4. Any CVEs affecting certbot 2.5.0 or 2.6.0

Use your structured citation output format. Be explicit if no CVEs are found.
