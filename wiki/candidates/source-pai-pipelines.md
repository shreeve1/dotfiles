---
title: PAI Pipelines Source Summary
type: source-summary
status: candidate
created: 2026-05-16
updated: 2026-05-16
sources:
  - wiki/raw/pai-pipelines.md
confidence: medium
tags:
  - pai
  - pipelines
  - actions
  - arbol
  - flows
---

# PAI Pipelines Source Summary

## Summary

The Pipelines source describes PAI 4.0 Pipelines as sequential workflows that chain Actions together through a pipe model. It marks the system as under active development and says personal pipeline definitions are stored under `USER/PIPELINES/`. Source: `wiki/raw/pai-pipelines.md`.

The source distinguishes Actions from Pipelines: Actions are single-step units, while Pipelines coordinate multiple dependent steps with accumulated data. The final action can access every field produced by preceding actions because each step preserves upstream context. Source: `wiki/raw/pai-pipelines.md`.

The source documents Arbol YAML pipeline definitions, local `PIPELINE.md` format, naming conventions, action-vs-pipeline decision guidance, pipeline creation steps, execution flow, and best practices such as atomic steps, passthrough preservation, data-flow documentation, and reusable Actions. Source: `wiki/raw/pai-pipelines.md`.

## Extracted Entities

| Entity | Description | Source |
|---|---|---|
| Pipelines | Sequential workflows that chain Actions. | `wiki/raw/pai-pipelines.md` |
| Arbol YAML pipeline | Ordered action list used by Arbol workers. | `wiki/raw/pai-pipelines.md` |
| `PIPELINE.md` | Local pipeline documentation/definition format. | `wiki/raw/pai-pipelines.md` |
| `USER/PIPELINES/` | Personal pipeline definition location. | `wiki/raw/pai-pipelines.md` |

## Extracted Concepts

| Concept | Description | Source |
|---|---|---|
| Sequential dependency | Pipelines are for ordered, dependent multi-step workflows. | `wiki/raw/pai-pipelines.md` |
| Passthrough accumulation | Each action preserves prior fields and adds its own output. | `wiki/raw/pai-pipelines.md` |
| Pipeline iteration boundary | Pipelines run once; Flows control any iteration. | `wiki/raw/pai-pipelines.md` |
| Reusable actions | Actions should not be tightly coupled to one pipeline. | `wiki/raw/pai-pipelines.md` |

## Decisions And Policies

- Use an Action for a single clear input/output task and a Pipeline for multiple dependent steps. Source: `wiki/raw/pai-pipelines.md`.
- Pipeline steps should be atomic and split when one step does multiple things. Source: `wiki/raw/pai-pipelines.md`.
- Pipelines should preserve upstream context rather than discarding prior fields. Source: `wiki/raw/pai-pipelines.md`.
- Pipeline definitions should document what each action reads and what fields it adds. Source: `wiki/raw/pai-pipelines.md`.

## Candidate Promotion Notes

If promoted, this page should become `wiki/sources/pai-pipelines.md` with medium confidence and reconciliation against current `~/.pai/PAI/PIPELINES/` and Arbol source code. It should route to PAI Runtime, Actions Pipelines And Flows, and Decisions.
