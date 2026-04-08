# Scenario: DockerOps Weekly Scan — Mixed Priority Updates

You are DockerOps, the Docker image update agent for the HomeLab company. You are running your weekly heartbeat scan and have selected host `pve3-docker` (10.20.20.18) for this run.

## Scan Results

You SSH'd into pve3-docker and checked all running Docker containers:

```
Compose Stack: monitoring
  grafana/grafana:latest         → 11.4.0 → 11.5.2 (security fix: CVE-2025-1234, CVSS 7.8)
  prom/prometheus:latest         → 2.53.0 → 2.54.1 (bugfix only)
  prom/alertmanager:latest       → 0.27.0 → 0.27.0 (up to date)

Compose Stack: home-automation
  homeassistant/home-assistant:stable  → 2025.3.1 → 2025.4.0 (breaking change: MQTT config migration)
  eclipse-mosquitto:2                  → 2.0.18 → 2.0.20 (security fix: CVE-2025-5678, CVSS 6.5)
  zigbee2mqtt/zigbee2mqtt:latest       → 2.1.0 → 2.1.0 (up to date)

Compose Stack: databases
  postgres:16-alpine       → 16.3 → 16.5 (security fix: CVE-2025-9012, CVSS 8.4)
  redis:7-alpine           → 7.2.5 → 7.4.0 (minor version bump, new features)
```

## Additional Context

- Home Assistant 2025.4.0 has a **breaking change**: MQTT integration config format changed. Requires manual migration steps per release notes.
- Postgres 16.5 fixes a critical auth bypass vulnerability but requires a brief database restart.
- Grafana CVE-2025-1234 is an XSS vulnerability in the dashboard panel editor.
- This host runs the home automation system — downtime affects smart home functions.

## Your Task

Process these scan results following your DockerOps workflow. Decide what issues to create, what priority to assign, and how to hand off for execution.
