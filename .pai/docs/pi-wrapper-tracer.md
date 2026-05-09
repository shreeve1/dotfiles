# Pi Wrapper Tracer

The Pi adapter is wrapper-first. It gives Pi a canonical PAI session identity and redacted wrapper-level lifecycle metadata without reading Pi auth files and without depending on deep Pi TypeScript extension points.

## Wrapper-only contract

| Surface | Owner | Notes |
| --- | --- | --- |
| Session identity | `pai-run pi` (#005 wrapper) | Pi inherits `PAI_SESSION_ID`, `PAI_HARNESS=pi`, `PAI_TARGET_CLI=pi`, optional `PAI_PROJECT_ID`. |
| Lifecycle events | Pi wrapper tracer | `session.start`, `session.launch`, `session.degraded_capability`, `session.stop`. |
| Tool output observation | Deferred | `can_observe_tool_output: false`; emitted as a degraded capability event. |
| Final response observation | Deferred | `can_observe_final_response: false`; emitted as a degraded capability event. |
| Native session ID attachment | Deferred | `can_attach_native_session_id: false`; emitted as a degraded capability event. |
| Deep Pi TypeScript extension | Deferred | Out of scope until Pi lifecycle boundaries are proven by the wrapper. |

## Rules

- The Pi tracer never reads `.pi/agent/auth.json` or any equivalent provider credential file. Tests assert the source contains no read of those paths.
- The tracer renders an installer fixture from the shared `#018` install contract and never mutates `~/.pi/agent/config.json` live.
- All emitted events flow through `prepareEventForDestination("sqlite", …)` and `evaluatePolicy`, so envelopes are payload-free, redaction-tagged, and policy-stamped.
- Capabilities Pi cannot enforce surface as explicit `session.degraded_capability` events instead of silent success.
- Deeper Pi extension work (hooks, plugin extension points, native session attach) stays deferred until the wrapper boundary is proven.
