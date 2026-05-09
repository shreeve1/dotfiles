# OpenCode Adapter Tracer

The OpenCode tracer is a source-controlled template and library only. It does not edit `~/.config/opencode/opencode.json`, reorder plugins, enable adapters, or mutate live runtime/auth state.

## Responsibility Matrix

| Responsibility | Owner | Notes |
| --- | --- | --- |
| Routing | Existing `pai-mode-router` plugin | The tracer must not route modes. |
| ISA sync | Existing `pai-isa-sync` plugin | The tracer must not write ISA sync artifacts. |
| Containment | Existing `pai-containment-guard` plugin | The tracer records policy/degraded events only. |
| Event emission | Shared OpenCode adapter | Canonical redacted events go to `~/.pai`. |
| Retrieval | Shared OpenCode adapter | Uses `pai-memory context`/trust-gated memory APIs. |
| Reflection | `pai-dream`/reflection pipeline | The tracer must not run reflection. |
| Config audit | Existing `pai-config-audit` plugin | Read-only audit remains plugin-owned. |

## Rules

- Install output is a validated fixture from the shared installer contract.
- Live OpenCode config and plugin ordering are never changed in this slice.
- Retrieval uses bounded context from accepted, medium/high-trust, non-inferred memories only.
- Existing plugin-owned routing, ISA sync, and containment must not be duplicated.
- If an OpenCode surface cannot enforce a decision, emit an explicit degraded capability event instead of silently claiming success.
