# Claude Adapter Tracer

The Claude tracer is source-controlled template code only. It does not edit `~/.claude/settings.json`, auth files, permissions, hooks, or live Claude runtime state.

## Behavior

- If `PAI_SESSION_ID` exists, Claude hook observations attach to that canonical session.
- If `PAI_SESSION_ID` is absent, the tracer creates a canonical session ID and emits `session.created_by_native_adapter`.
- Hook observations map into redacted canonical events for session, prompt, tool, policy, and stop surfaces.
- Existing hook commands are inventoried and preserved in the generated template list; policy routing is explicit, not implicit.
- Install output is an install-plan fixture validated by the installer contract. Live application is deferred to a HITL safe installer issue.

## Template Boundary

Tracer issues may render templates and validate install plans. They may not mutate live Claude config. Any future installer must show exact config changes, backups, symlinks, adapter enablement, and rollback notes before James approves live application.
