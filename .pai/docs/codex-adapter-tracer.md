# Codex Adapter Tracer

The Codex tracer is a source-controlled template and library for connecting the existing Codex PAI port to canonical `~/.pai` session events. It does not edit live Codex config, auth files, approval policy, or hook registrations.

## Behavior

- `PAI_SESSION_ID` from `pai-run codex` attaches hook observations to the existing canonical session.
- Direct Codex hook launches derive a canonical session from Codex hook `session_id` when present, or create a managed native adapter session when no hook session is available.
- Hook observations map to redacted canonical events before storage: session start, prompt submit, policy/tool observations, tool output, and stop/final response.
- Canonical writes target `~/.pai`; `.codex/pai/MEMORY` remains a legacy bridge-read surface during migration.
- PRD-first Codex enforcement remains compatible until ISA migration is complete.

## Installer Boundary

Tracer issues only render and validate install fixtures with `renderInstallPlanFixture("codex")`. Live application is deferred to the HITL safe installer issue. The template must not mutate `~/.codex`, `.codex/hooks.json`, auth files, approval settings, or live hooks.
