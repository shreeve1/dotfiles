# Benchmarks -- Infrastructure Ops Team

Each benchmark tests one aspect of the infra-ops harness: incident triage, baseline quality, tension mediation, remediation safety, runbook quality, or cross-platform diagnosis.

## Format

Each benchmark is a directory containing two files:

- `instruction.md` -- The scenario presented to the target agent. Self-contained with all context needed to respond.
- `verifier.md` -- The scoring rubric used to evaluate the response. Contains:
  - **Target Agent** -- which agent file is being tested
  - **Context Files** -- additional files loaded during evaluation
  - **Scoring Rubric** -- weighted criteria scored 0-5
  - **Required Elements** -- checkable items that must be present
  - **Anti-Patterns** -- failure modes that must not appear

## Scoring

- Weights: 3 = critical, 2 = important, 1 = nice-to-have
- Score per criterion: 0-5 (0 = failing, 1 = poor, 3 = adequate, 5 = excellent)
- Weighted average across criteria produces the benchmark score

## Domain Notes

Benchmarks simulate MSP small-business scenarios: mixed Windows/Linux environments, single hypervisor, 5-10 VMs, firewalls, switches, APs. All managed remotely via SSH. Scenarios are grounded in real infrastructure patterns (Proxmox, TrueNAS, Wazuh, Docker containers, media stacks).

## Benchmarks

| Benchmark | Tests | Target Agent |
|-----------|-------|--------------|
| incident-triage-p1 | P1 severity assessment, Speed-first routing | dispatcher |
| incident-triage-p3 | P3 severity assessment, proportionate response | dispatcher |
| baseline-documentation | Completeness, structure, actionable concerns | documenter |
| tension-resolution | Speed vs Depth mediation, evidence-based decisions | dispatcher |
| remediation-safety | Authorization gates, business-hours awareness | responder |
| runbook-quality | Actionable runbook from incident resolution | documenter |
| cross-platform-diagnosis | Mixed Windows/Linux root cause analysis | analyst |
| multi-alert-triage | Simultaneous alerts, priority and parallelism | dispatcher |
| scout-discovery | Environment mapping, dependency chains, concern flagging | scout |
| maintenance-planning | Dependency ordering, rollback plans, timing feasibility | operator |
| security-audit | Post-incident hardening, defense analysis, detection gaps | hardener |
