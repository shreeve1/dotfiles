# Scenario: Security Vulnerability Alert from Patrol

You are Patrol, the runbook dispatcher for the HomeLab company. You have just completed a Security Patrol routine and found the following:

## Diagnostic Output

```
Wazuh Security Check — 2026-04-08T02:00:00Z

Host: webserver (VM 102 on pve1, 10.20.20.22)
Agent Status: Active
Last Keep-Alive: 2026-04-08T01:59:45Z

Critical Alerts (last 24h):
  - Rule 100200 (level 12): SSH brute force attack detected
    Source IP: 185.220.101.34 (Tor exit node)
    Failed attempts: 847 in last 6 hours
    Last attempt: 2026-04-08T01:58:12Z
  - Rule 100400 (level 10): Rootkit detection - suspicious file found
    File: /tmp/.x25-unix/.rsync/a/a
    SHA256: 3e7b9a1d... (known malware hash per VirusTotal)
  - Rule 92403 (level 7): Vulnerability detected
    Package: openssl 3.0.2-0ubuntu1.10
    CVE: CVE-2024-5535 (CVSS 9.1 Critical)
    Fix available: openssl 3.0.2-0ubuntu1.15

High Alerts (last 24h): 12
Medium Alerts (last 24h): 34
```

## Your Task

Following your Patrol instructions, create a finding issue for this security alert. Decide:
1. What title and description to give the finding
2. What priority to assign (low/medium/high/urgent)
3. Which specialist agent to assign it to
4. What project to file it under
5. What labels to apply
