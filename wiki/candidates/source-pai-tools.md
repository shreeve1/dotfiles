---
title: PAI Tools Source Summary
type: source-summary
status: candidate
created: 2026-05-16
updated: 2026-05-16
sources:
  - wiki/raw/pai-tools.md
confidence: medium
tags:
  - pai
  - tools
  - cli
  - utilities
---

# PAI Tools Source Summary

## Summary

The PAI Tools source documents single-purpose CLI utilities consolidated from individual skills. Its stated philosophy is that simple utilities do not need separate skills and should be documented in one tools reference for direct execution. Source: `wiki/raw/pai-tools.md`.

The source documents utilities for AI inference, image background removal/addition, YouTube transcript extraction, voice narration, local audio/video transcription, YouTube API metrics, and TruffleHog secret scanning. Source: `wiki/raw/pai-tools.md`.

The source also defines integration points with Art, Blogging, Research, Metrics, and Security workflows, plus guidance for adding new utility tools directly under `~/.pai/PAI/Tools/` with Title Case filenames and no subdirectories. Some tool paths or skill names may need reconciliation against the current repo before operational use. Source: `wiki/raw/pai-tools.md`.

## Extracted Entities

| Entity | Description | Source |
|---|---|---|
| PAI Tools | Central reference for single-purpose PAI CLI utilities. | `wiki/raw/pai-tools.md` |
| Inference.ts | Unified AI inference tool with fast, standard, and smart levels. | `wiki/raw/pai-tools.md` |
| RemoveBg.ts | remove.bg-backed image background removal utility. | `wiki/raw/pai-tools.md` |
| AddBg.ts | Utility for adding solid background colors to transparent images. | `wiki/raw/pai-tools.md` |
| GetTranscript.ts | YouTube transcript extraction utility using fabric/yt-dlp. | `wiki/raw/pai-tools.md` |
| extract-transcript.py | Local faster-whisper transcription utility. | `wiki/raw/pai-tools.md` |
| YouTubeApi.ts | YouTube Data API wrapper for channel and video metrics. | `wiki/raw/pai-tools.md` |
| TruffleHog | System CLI for scanning secrets and credentials. | `wiki/raw/pai-tools.md` |

## Extracted Concepts

| Concept | Description | Source |
|---|---|---|
| Tool consolidation | Simple CLI utilities should be documented centrally instead of becoming separate skills. | `wiki/raw/pai-tools.md` |
| Inference levels | `fast`, `standard`, and `smart` map to different model/capability trade-offs. | `wiki/raw/pai-tools.md` |
| Flat tools directory | New utility tools go directly in `~/.pai/PAI/Tools/` with no subdirectories. | `wiki/raw/pai-tools.md` |
| Deprecated skill consolidation | Several older skills were consolidated into tools or system CLIs. | `wiki/raw/pai-tools.md` |

## Decisions And Policies

- Simple utilities should be documented and executed directly instead of split into separate skills. Source: `wiki/raw/pai-tools.md`.
- New utility tools should use Title Case filenames in a flat `~/.pai/PAI/Tools/` directory. Source: `wiki/raw/pai-tools.md`.
- Tools should be documented with location, usage examples, triggers, and environment variables where relevant. Source: `wiki/raw/pai-tools.md`.
- TruffleHog is the documented system tool for pre-commit/security secret scanning. Source: `wiki/raw/pai-tools.md`.

## Candidate Promotion Notes

If promoted, this page should become `wiki/sources/pai-tools.md` with medium confidence and a live-path reconciliation pass. It should route to PAI Runtime, Skills And Agents, Installation And Operations, and Decisions.
