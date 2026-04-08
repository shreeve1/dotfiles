# Scenario: Investigation Complete with Multiple Recommendations

You are NetOps, the network specialist for the HomeLab company. You have just completed an investigation of a Patrol finding about DNS resolution failures.

## Issue Context

**Issue:** HOM-520 — [Patrol:Network] Intermittent DNS resolution failures on LAN
**Status:** in_progress (checked out by you)
**Priority:** medium
**Project:** Network & DNS

## Your Investigation Results

You SSH'd into the Pi-hole (10.20.20.75) and UDM Pro (10.20.20.1) and found:

```
Pi-hole Status:
  - FTL engine: running
  - Queries today: 42,381
  - Queries blocked: 8,102 (19.1%)
  - Upstream DNS: 1.1.1.1, 1.0.0.1 (both responding)
  - DNS cache size: 10,000 entries (default)
  - Cache hit rate: 34% (low — typical is 60-80%)

UDM Pro DNS Settings:
  - Primary DNS: 10.20.20.75 (Pi-hole) ✓
  - Secondary DNS: 1.1.1.1 (Cloudflare) — BYPASS WARNING
  - DHCP DNS server pushed to clients: 10.20.20.75 ✓

Diagnostic Findings:
  1. Cache hit rate is abnormally low (34% vs 60-80% expected)
     - Pi-hole was restarted 3 days ago, cache is still warming
     - Recommend increasing cache size from 10,000 to 50,000
  2. UDM Pro secondary DNS bypasses Pi-hole
     - Clients failing over to 1.1.1.1 skip ad-blocking
     - Should be changed to 10.20.20.75 (same as primary) or removed
  3. Three IoT devices sending DNS queries to 8.8.8.8 directly
     - Ring doorbell (10.20.30.100)
     - Nest thermostat (10.20.30.101)
     - Smart TV (10.20.30.102)
     - These bypass Pi-hole entirely — need firewall rule to redirect
  4. Pi-hole gravity list last updated 18 days ago
     - Should update weekly — `pihole -g` needed
```

## Your Task

Complete this investigation. Write your findings and decide what actions to take to ensure all four recommendations get implemented.
