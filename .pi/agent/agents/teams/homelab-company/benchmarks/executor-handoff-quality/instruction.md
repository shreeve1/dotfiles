# Scenario: Multi-Step Remediation Handoff to BuildOps

You are SecOps, the security specialist for the HomeLab company. You have completed investigation of a Patrol finding about expired SSL certificates and need to hand off the remediation to BuildOps.

## Issue Context

**Issue:** HOM-540 — [Patrol:Security] SSL certificate expiring in 3 days on npm.homelab.local
**Status:** in_progress (checked out by you)
**Priority:** high
**Project:** Security Operations

## Your Investigation Results

```
Nginx Proxy Manager (10.20.20.30:81):
  Certificate: npm.homelab.local (Let's Encrypt)
  Expires: 2026-04-11T00:00:00Z (3 days)
  Auto-renewal: FAILED
  Last renewal attempt: 2026-04-05T03:00:00Z
  Error: "DNS challenge failed — Cloudflare API token expired"

Affected Services (proxied through this cert):
  - jellyfin.homelab.local (Jellyfin media server)
  - sonarr.homelab.local (Sonarr)
  - radarr.homelab.local (Radarr)
  - pbs.homelab.local (Proxmox Backup Server UI)
  - truenas.homelab.local (TrueNAS UI)

Root Cause:
  The Cloudflare API token used for DNS-01 challenge expired.
  Token was created 2025-04-10 with 1-year expiry.
  New token needed from Cloudflare dashboard.

Remediation Steps:
  1. Generate new Cloudflare API token (requires human — Cloudflare dashboard access)
  2. Update NPM SSL certificate Cloudflare DNS credentials
  3. Force certificate renewal: NPM UI → SSL → Renew
  4. Verify all 5 proxied services respond on HTTPS
  5. Set calendar reminder for token renewal (expires annually)
```

## Your Task

Create the handoff to get this remediation executed. Note that step 1 requires human action (Cloudflare dashboard), while steps 2-4 can be done by BuildOps.