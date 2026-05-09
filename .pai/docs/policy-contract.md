# PAI Policy Contract

`pai-policy` owns canonical policy decisions for CLI adapters. Adapters map local tool, permission, and lifecycle events into `PolicyRequest`, then apply the returned `PolicyResponse` through their native enforcement surface.

## Schemas

- `PolicyRequest` contains request identity, harness, event and action type, optional project context, redacted subject summary, adapter capabilities, sensitivity, and redaction status.
- `PolicyResponse` contains a stable decision id, one canonical action, reason, severity, optional required capability, optional user message, audit requirement, and optional degraded event.
- `AdapterCapabilities` declares whether an adapter can inject context, block tools, request confirmation, observe tool input/output/final response, set environment, and attach a native session id.

## Actions

Canonical actions are `allow`, `deny`, `confirm`, `warn`, `redact`, and `degrade`.

## Failure Behavior

- Memory, logging, and context-injection failures fail open as explicit `degrade` responses.
- Security-sensitive and destructive policy failures fail closed as `confirm` or `deny` when the adapter can enforce them.
- Security-sensitive and destructive policy failures become explicit degraded events when the adapter cannot block or request confirmation.
- Adapter capability mismatches must never look like silent success.
