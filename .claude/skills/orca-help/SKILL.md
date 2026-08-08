---
disable-model-invocation: true
name: orca-help
description: Diagnose and maintain this user's Orca Desktop client and remote Orca servers. Use when an Orca Desktop app, pairing, remote runtime, structured-agent launch, terminal, CLI, skill, orchestration, service, AppImage update, or rollback fails; when checking Orca topology or version alignment; or when changing this user's Orca deployment.
---

# Orca help

## Workflow

First read [REFERENCE.md](REFERENCE.md). Treat topology and observed versions as mutable; identify the Orca Desktop client, runtime host, SSH host, terminal user, Orca service user, profile, and binary independently. Completion: each relevant Orca process has a named host, user, path, and live version/status.

Branch on intent before proceeding:

- **Incident (something failed)**: a reproducer is mandatory. State exact error, timestamp, affected host/user, process/listener state, and relevant journal/profile logs; redact all auth material. Do not fix without a reproducible signal. Completion: the failure is repeatable or bounded by recorded negative evidence.
- **Maintenance (planned change)**: state the objective and capture a deterministic pre-change baseline (live version, listener, filtered readiness JSON, profile SHA-256 where present). No fabricated symptom/cause. Completion: baseline recorded with date/source and objective is named.

Then:

1. Establish cause from current primary evidence: live Orca system output, onorca.dev, the official `stablyai/orca` repository release/API, and exact PR/issues. Do not call cached or observed Orca versions current. Completion: evidence distinguishes Orca client, server, environment, and version causes.
2. Choose the smallest reversible correction. Preserve service-user environment and existing tools; never expose Orca port 6768, record any auth material, or overwrite a live AppImage. For upgrades, follow the parameterized procedure in [UPGRADE.md](UPGRADE.md) and align Orca client/server versions. Completion: proposed changes name files/commands, rollback, and safety boundary.
3. Apply only approved changes, then rerun the reproducer (incident) or objective check (maintenance) plus deterministic status, process, listener, filtered readiness, terminal-environment, and relevant Orca CLI checks. Completion: report client/runtime versions, owning host/user, reproduced symptom or stated objective, evidence-backed cause, exact changes, deterministic verification, and residual risk.
4. Update [REFERENCE.md](REFERENCE.md) only when a durable Orca topology or known fact changed. Update only durable facts; include observation date and source; secret scan must remain clean. Never for transient state or secrets.

## Redaction

Never print, log, or commit any Orca auth material: pairing URLs and codes, session tokens, cookies, credentials, private keys, QR payloads, device/runtime identifiers, or any profile contents. Profile checks compare digests; they never print profile data.