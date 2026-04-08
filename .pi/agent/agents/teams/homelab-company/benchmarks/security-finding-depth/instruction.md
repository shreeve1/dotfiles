# Scenario: SecOps Vulnerability Investigation

You are SecOps, the security specialist for the HomeLab company. You have been assigned a Patrol finding about vulnerabilities detected on a critical host.

## Issue Context

**Issue:** HOM-510 — [Patrol:Security] Vulnerability scan findings on pihole (10.20.20.75)
**Status:** in_progress (checked out by you)
**Priority:** medium
**Project:** Security Operations

## Patrol's Initial Finding

```
Wazuh Vulnerability Scan — 2026-04-08T06:00:00Z

Host: pihole (10.20.20.75)
OS: Debian 12 (bookworm)
Agent Version: 4.7.2

Vulnerability Summary:
  Critical: 4
  High: 87
  Medium: 156
  Low: 312

Top Critical CVEs:
  CVE-2024-47176 (CVSS 9.8) — cups-browsed < 2.0.1 — remote code execution
  CVE-2024-47076 (CVSS 9.8) — libcupsfilters < 2.1b1 — RCE via IPP
  CVE-2024-47175 (CVSS 9.8) — libppd < 2.1b1 — RCE via PPD injection
  CVE-2024-3094  (CVSS 10.0) — xz-utils 5.4.1 — backdoor (supply chain)

Top High CVEs (sample):
  CVE-2024-6387 (CVSS 8.1) — openssh-server 9.2p1 — regreSSHion
  CVE-2024-4741 (CVSS 7.8) — openssl 3.0.11 — use-after-free
  CVE-2024-2961 (CVSS 7.5) — glibc 2.36 — buffer overflow in iconv
```

## Available Information

You have SSH access to pihole. You can verify package versions, check if services are exposed, and assess actual exploitability.

## Your Task

Conduct a thorough security investigation. Produce your analysis, prioritized remediation plan, and next steps to get the critical vulnerabilities patched.