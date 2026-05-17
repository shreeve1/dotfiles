---
title: PAI Flows Source Summary
type: source-summary
status: candidate
created: 2026-05-16
updated: 2026-05-16
sources:
  - wiki/raw/pai-flows.md
confidence: medium
tags:
  - pai
  - flows
  - pipelines
  - arbol
  - cloudflare
---

# PAI Flows Source Summary

## Summary

The Flows source describes PAI 4.0 Flows as the outermost execution layer that connects external sources to internal Pipelines and destinations on a schedule. It marks the system as under active development and says personal flow configurations are stored in `USER/FLOWS/`. Source: `wiki/raw/pai-flows.md`.

The source documents Cloudflare/Arbol flow architecture: cron-triggered Flow workers fetch sources, call Pipeline workers via service bindings, use Bearer-token authentication, and rely on Cloudflare Cron Triggers, Service Bindings, Secrets, and Workers. Source: `wiki/raw/pai-flows.md`.

The source also documents flow naming, `flow-index.json`, `flow-state.json`, manual triggers, health checks, cost considerations, troubleshooting, and the Loop Gate pattern where Flows, not Pipelines, control iteration with a mandatory `maxIterations` cap. Source: `wiki/raw/pai-flows.md`.

## Extracted Entities

| Entity | Description | Source |
|---|---|---|
| Flows | Scheduled source-to-pipeline-to-destination orchestration layer. | `wiki/raw/pai-flows.md` |
| Flow Worker | Cloudflare Worker that fetches sources and calls pipelines. | `wiki/raw/pai-flows.md` |
| `flow-index.json` | Local registry for flow definitions. | `wiki/raw/pai-flows.md` |
| `flow-state.json` | Runtime state file for flow history and errors. | `wiki/raw/pai-flows.md` |
| Loop Gate | Flow-level iteration pattern with exit criteria. | `wiki/raw/pai-flows.md` |

## Extracted Concepts

| Concept | Description | Source |
|---|---|---|
| Scheduled orchestration | Flows connect sources to pipelines on cron schedules. | `wiki/raw/pai-flows.md` |
| Service bindings | Flow workers call pipeline workers through internal Cloudflare service bindings. | `wiki/raw/pai-flows.md` |
| Shared Bearer auth | Workers use shared Bearer-token authentication and pass tokens downstream. | `wiki/raw/pai-flows.md` |
| Cost mitigation | Longer intervals, deduplication, filtering, and cheaper models reduce flow cost. | `wiki/raw/pai-flows.md` |
| Loop Gate | Flows can repeat pipeline execution until deterministic exit criteria pass. | `wiki/raw/pai-flows.md` |

## Decisions And Policies

- Flow IDs use `F_` plus `UPPER_SNAKE_CASE` and the `F_SOURCE_PIPELINE` pattern. Source: `wiki/raw/pai-flows.md`.
- Health endpoints are public, while other Flow endpoints require Bearer-token auth. Source: `wiki/raw/pai-flows.md`.
- Disabling a local flow entry does not stop Cloudflare cron execution; cron must be removed/redeployed or the Worker deleted. Source: `wiki/raw/pai-flows.md`.
- Looping Flows must have a `maxIterations` cap and deterministic exit criteria. Source: `wiki/raw/pai-flows.md`.

## Candidate Promotion Notes

If promoted, this page should become `wiki/sources/pai-flows.md` with medium confidence and reconciliation against current `~/.pai/PAI/FLOWS/`, Cloudflare Worker config, and Arbol source code. It should route to PAI Runtime, Actions Pipelines And Flows, Installation And Operations, and Decisions.
