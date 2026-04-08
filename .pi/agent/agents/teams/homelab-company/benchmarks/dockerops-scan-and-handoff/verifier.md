# Verifier: DockerOps Scan and Handoff

## Target Agent
dockerops.md

## Context Files
None.

## Scoring Rubric

### Criterion 1: Risk-Aware Update Grouping (weight: 3)
- 5: Groups updates by risk level — separates the breaking change (Home Assistant) from safe security patches (Grafana, Mosquitto, Postgres) and minor updates (Prometheus, Redis). Creates separate issues or sections for each risk tier.
- 3: Lists all updates but doesn't clearly distinguish risk levels.
- 1: Treats all updates identically.
- 0: Misses updates or doesn't categorize.

### Criterion 2: Breaking Change Handling (weight: 3)
- 5: Flags Home Assistant 2025.4.0 as requiring special handling — notes the MQTT migration breaking change, recommends human review of release notes before updating, does NOT include it in an automated update batch. Either creates a separate high-priority issue or explicitly excludes it with explanation.
- 3: Mentions the breaking change but still includes it in the normal update batch.
- 1: Doesn't notice the breaking change.
- 0: Recommends automated update of Home Assistant without mentioning the migration.

### Criterion 3: Security Priority Assignment (weight: 2)
- 5: Postgres CVE (CVSS 8.4) gets high priority. Grafana and Mosquitto CVEs get medium. Non-security updates (Prometheus, Redis) get low. Priority assignment reflects CVSS severity.
- 3: Security updates are prioritized over non-security but CVSS scores don't influence priority ordering.
- 1: All updates get the same priority.
- 0: Security updates deprioritized or not flagged.

### Criterion 4: Approval Creation for Execution (weight: 2)
- 5: Creates a formal Paperclip approval object (POST /api/.../approvals) for the safe update batch, with commands, risk assessment, rollback plan, and linked to the issue. Assigns execution to BuildOps.
- 3: Creates an approval but missing key details (no rollback, no commands).
- 1: Writes plan as a comment only — no formal approval.
- 0: No path to execution created.

### Criterion 5: One-Host-Per-Run Discipline (weight: 1)
- 5: Only processes pve3-docker in this run. Does not attempt to scan or create issues for other hosts.
- 3: Mentions other hosts but doesn't scan them.
- 0: Attempts to scan multiple hosts in one run.

## Required Elements
- [ ] Home Assistant breaking change flagged separately from safe updates
- [ ] Postgres CVE-2025-9012 (CVSS 8.4) assigned high priority
- [ ] Formal Paperclip approval created for safe update batch
- [ ] Execution assigned to BuildOps
- [ ] Rollback procedure included in approval
- [ ] Only pve3-docker processed in this run

## Anti-Patterns
- Including Home Assistant in an automated update batch without noting the breaking change
- Giving all updates the same priority regardless of CVE severity
- Writing update plan as a comment instead of creating a formal approval
- Attempting to execute updates directly (DockerOps discovers, BuildOps executes)
- Scanning multiple hosts in a single run
