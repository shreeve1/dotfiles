---
title: PAI Notification System Source Summary
type: source-summary
status: candidate
created: 2026-05-16
updated: 2026-05-16
sources:
  - wiki/raw/pai-notification-system.md
confidence: medium
tags:
  - pai
  - notifications
  - voice
  - opencode
---

# PAI Notification System Source Summary

## Summary

The Notification System source documents voice notifications for PAI workflows and task execution. It describes task-start announcements, context-aware text/voice phrasing, workflow invocation notification formats, and when to skip notifications to avoid redundancy or notification fatigue. Source: `wiki/raw/pai-notification-system.md`.

The source says Algorithm phase voice announcements are disabled and task completion voice is handled by `StopOrchestrator.hook.ts` through `handlers/VoiceNotification.ts`, which extracts the response's `🗣️` line and posts to the voice server. Source: `wiki/raw/pai-notification-system.md`.

The source also documents external notification channels including ntfy, Discord, Telegram, and desktop alerts, with smart routing for task completion, long tasks, background agents, errors, and security events. Some hook paths and version references appear historical relative to the current OpenCode plugin runtime and should be reconciled before promotion. Source: `wiki/raw/pai-notification-system.md`.

## Extracted Entities

| Entity | Description | Source |
|---|---|---|
| Notification System | PAI voice and external notification guidance. | `wiki/raw/pai-notification-system.md` |
| Voice Server | Local `localhost:8888/notify` endpoint for voice notifications. | `wiki/raw/pai-notification-system.md` |
| StopOrchestrator | Hook path referenced for task completion voice. | `wiki/raw/pai-notification-system.md` |
| VoiceNotification | Handler referenced for extracting completion voice lines. | `wiki/raw/pai-notification-system.md` |
| ntfy | Mobile push notification channel. | `wiki/raw/pai-notification-system.md` |
| Telegram | Automation alert channel using `~/.pai/secrets/telegram-env.sh`. | `wiki/raw/pai-notification-system.md` |

## Extracted Concepts

| Concept | Description | Source |
|---|---|---|
| Context-aware announcements | Start messages should match the user's request type and use an appropriate gerund. | `wiki/raw/pai-notification-system.md` |
| Workflow-only executing format | `Executing...` format should be used only for real workflow files. | `wiki/raw/pai-notification-system.md` |
| Notification skip rules | Conversational, direct skill, quick utility, and sub-workflow cases should skip extra notifications. | `wiki/raw/pai-notification-system.md` |
| Smart routing | External channels are routed by event type and task duration. | `wiki/raw/pai-notification-system.md` |
| Event log channel | Structured events are appended to an `events.jsonl` observability channel. | `wiki/raw/pai-notification-system.md` |

## Decisions And Policies

- Do not announce fake workflows; only use workflow wording for actual workflow files. Source: `wiki/raw/pai-notification-system.md`.
- Skip redundant notifications for conversational responses, quick utilities, direct skill handling, and sub-workflows. Source: `wiki/raw/pai-notification-system.md`.
- Algorithm entry and phase transitions should not call the voice server. Source: `wiki/raw/pai-notification-system.md`.
- Telegram notification credentials are documented as `~/.pai/secrets/telegram-env.sh`. Source: `wiki/raw/pai-notification-system.md`.

## Candidate Promotion Notes

If promoted, this page should become `wiki/sources/pai-notification-system.md` with medium confidence and reconciliation against current OpenCode plugin files. It should route to OpenCode Runtime, PAI Runtime, Installation And Operations, and Decisions.
