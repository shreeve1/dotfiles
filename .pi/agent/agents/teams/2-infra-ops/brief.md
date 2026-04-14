# Infrastructure Ops Team

The infrastructure operations team for MSP small-business deployments.

## Domain
Small-business infrastructure operations — heterogeneous environments (Windows + Linux VMs, Docker containers, firewalls, switches, access points) managed remotely over SSH. Each deployment covers a single hypervisor with 5-10 VMs.

## Two-Phase Workflow
1. **Baseline Phase:** Explore infrastructure, discover hosts/services, document configuration state, establish baselines
2. **Response Phase:** Diagnose deviations from baseline, remediate incidents, generate runbooks

## Tensions
1. Remediation Speed vs. Root Cause Depth
2. Security Hardening vs. Operational Access
3. Exploration vs. Documentation Reliance
4. Template Standardization vs. Environment Specificity

## Roster
- **infra-investigator** (Investigator) — opus-4-6 — Discovery + root cause analysis (observe-class, read-only)
- **infra-searcher** (Searcher) — gpt-5.4 — Web research + vendor citations (observe-class, read-only)
- **infra-responder** (Responder) — gpt-5.4 — Restores service under pressure (act-class)
- **infra-operator** (Operator) — minimax-m2.5-highspeed — Preventive infrastructure maintenance (act-class)
- **infra-hardener** (Hardener) — gpt-5.4 — Reduces attack surface (act-class)

## When to Use
Use this team for infrastructure management tasks including:
- New client onboarding and baseline creation
- Incident response and remediation
- Security hardening and auditing
- Proactive maintenance and patching
- Documentation and runbook creation
