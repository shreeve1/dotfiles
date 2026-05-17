---
title: PAI Actions Source Summary
type: source-summary
status: candidate
created: 2026-05-16
updated: 2026-05-16
sources:
  - wiki/raw/pai-actions.md
confidence: medium
tags:
  - pai
  - actions
  - arbol
  - cloudflare
  - pipelines
---

# PAI Actions Source Summary

## Summary

The Actions source describes PAI 4.0 Actions as atomic, composable units of work that take JSON input, run single-purpose logic, and return JSON output. It explicitly marks the system as under active development, so operational claims should be reconciled against current Arbol and PAI runtime code before promotion. Source: `wiki/raw/pai-actions.md`.

The source defines the primitive hierarchy: Actions (`A_`) are single units of work, Pipelines (`P_`) chain actions in sequence through a pipe model, and Flows (`F_`) connect sources to pipelines and destinations on schedules. Source: `wiki/raw/pai-actions.md`.

The source documents local and Cloudflare/Arbol execution, action naming, `action.json`/`action.ts` structure, capability injection, Bearer-token authentication for Arbol Workers, and best practices including single responsibility, passthrough metadata, explicit capabilities, fail-fast validation, and idempotency. Source: `wiki/raw/pai-actions.md`.

## Extracted Entities

| Entity | Description | Source |
|---|---|---|
| Actions | Atomic JSON-in/JSON-out units of work. | `wiki/raw/pai-actions.md` |
| Arbol | Cloud architecture/project for action, pipeline, and flow workers. | `wiki/raw/pai-actions.md` |
| `action.json` | Action manifest containing name, schemas, and required capabilities. | `wiki/raw/pai-actions.md` |
| `action.ts` | Action implementation exporting `execute(input, ctx)`. | `wiki/raw/pai-actions.md` |
| ActionContext | Context object carrying runner-injected capabilities. | `wiki/raw/pai-actions.md` |

## Extracted Concepts

| Concept | Description | Source |
|---|---|---|
| JSON contract | Actions take JSON input and return JSON output. | `wiki/raw/pai-actions.md` |
| Pipe model | Output of one action becomes input of the next. | `wiki/raw/pai-actions.md` |
| Passthrough metadata | Actions preserve upstream metadata using `{ ...upstream, ...ownFields }`. | `wiki/raw/pai-actions.md` |
| Capability injection | Runners inject declared capabilities such as `llm`, `shell`, `readFile`, and `fetch`. | `wiki/raw/pai-actions.md` |
| Two-tier worker model | V8 isolates run LLM/API work; Sandbox workers run shell/system work. | `wiki/raw/pai-actions.md` |

## Decisions And Policies

- Actions should be single-purpose and split when they do more than one thing. Source: `wiki/raw/pai-actions.md`.
- Action IDs use `A_` plus `UPPER_SNAKE_CASE`, with verb-first names. Source: `wiki/raw/pai-actions.md`.
- Actions should declare required capabilities and fail fast on missing inputs or capabilities. Source: `wiki/raw/pai-actions.md`.
- Personal actions are stored under `USER/ACTIONS/`, while system/example actions are in `ACTIONS/`. Source: `wiki/raw/pai-actions.md`.

## Candidate Promotion Notes

If promoted, this page should become `wiki/sources/pai-actions.md` with medium confidence and reconciliation against current `~/.pai/PAI/ACTIONS/` and Arbol source code. It should route to PAI Runtime, Actions Pipelines And Flows, and Decisions.
