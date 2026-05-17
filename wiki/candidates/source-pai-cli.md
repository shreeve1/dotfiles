---
title: PAI CLI Source Summary
type: source-summary
status: candidate
created: 2026-05-16
updated: 2026-05-16
sources:
  - wiki/raw/pai-cli.md
confidence: medium
tags:
  - pai
  - cli
  - algorithm
  - arbol
---

# PAI CLI Source Summary

## Summary

The CLI source describes PAI 4.0 command-line tools and marks the system as under active development. It says PAI provides two bun-based CLIs: the Algorithm CLI for running the Algorithm against PRDs and the Arbol CLI for running actions and pipelines locally. Source: `wiki/raw/pai-cli.md`.

The Algorithm CLI section documents loop mode, interactive mode, flags, status/control commands, PRD resolution, dashboard integration, parallel-agent assignment, and effort-level decay. Because it is PRD-centric, these claims should be reconciled against the newer ISA-first Algorithm doctrine before operational use. Source: `wiki/raw/pai-cli.md`.

The Arbol CLI section documents `pai.ts` for local action and pipeline execution, JSON input methods, UNIX-style action piping, verbose mode, lower-level runner and pipeline runner commands, two-tier USER/SYSTEM resolution for actions and pipelines, and shell aliases. Source: `wiki/raw/pai-cli.md`.

## Extracted Entities

| Entity | Description | Source |
|---|---|---|
| Algorithm CLI | Bun CLI for running Algorithm loop or interactive sessions against PRDs. | `wiki/raw/pai-cli.md` |
| Arbol CLI | `pai` CLI for running actions and pipelines locally. | `wiki/raw/pai-cli.md` |
| Arbol Runner | Low-level action execution engine. | `wiki/raw/pai-cli.md` |
| Pipeline Runner | YAML pipeline runner that chains actions sequentially. | `wiki/raw/pai-cli.md` |
| PRD Resolution | CLI logic for finding PRD files by path, ID, or project path. | `wiki/raw/pai-cli.md` |

## Extracted Concepts

| Concept | Description | Source |
|---|---|---|
| Loop mode | Autonomous Algorithm iteration until criteria pass, block, fail, pause, or stop. | `wiki/raw/pai-cli.md` |
| Interactive mode | OpenCode session launched with PRD context. | `wiki/raw/pai-cli.md` |
| Action composition | Arbol CLI outputs JSON to stdout for UNIX-style action piping. | `wiki/raw/pai-cli.md` |
| Two-tier action resolution | Runners search USER actions/pipelines before system actions/pipelines. | `wiki/raw/pai-cli.md` |

## Decisions And Policies

- Both PAI CLI tools use `bun` as runtime. Source: `wiki/raw/pai-cli.md`.
- Algorithm loop mode can partition failing criteria across parallel agents. Source: `wiki/raw/pai-cli.md`.
- The Arbol CLI accepts input via stdin pipe, `--input`, or named parameters. Source: `wiki/raw/pai-cli.md`.
- USER actions and pipelines override system/framework actions and pipelines in runner resolution. Source: `wiki/raw/pai-cli.md`.

## Candidate Promotion Notes

If promoted, this page should become `wiki/sources/pai-cli.md` with medium confidence and explicit reconciliation against current Algorithm ISA behavior and live CLI files. It should route to PAI Runtime, Actions Pipelines And Flows, Extensibility And Customization, Installation And Operations, and Decisions.
