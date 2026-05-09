# pai-dream

`pai-dream` turns redacted canonical events into proposed durable memories. It does not accept raw payloads and it does not promote memories directly into instruction-eligible state.

## Providers

- `local`: local/offline rules-only provider, enabled by default for this AFK slice.
- `deterministic`: deterministic test double for repeatable fixtures.
- `claude-inference`: opt-in real-provider placeholder. It is disabled by default, requires explicit approval flags, carries privacy labels, and currently has no configured transport in this safe enablement slice.

Real-provider privacy labels shown before enablement:

- `redacted-local-context`: the provider may receive redacted summaries derived from local events.
- `external-provider`: the provider is outside the local machine boundary.
- `review-gated-output`: provider output can only create proposed memories that require review.

## Safety Boundaries

- Input events must be canonical `pai.event.v1` envelopes with no `payload` or `payloads` fields.
- Redaction validation runs before any external provider transport path.
- Proposed memories are written with `review_status: proposed`, low or medium trust, source event IDs, provenance, confidence, assertion type, and review queue entries.
- Provider failures happen before memory writes. Existing raw events, accepted memories, and review queue state remain unchanged.
- Local/offline mode is the default for routine distillation. Use a real provider only when local rules are insufficient and after explicitly accepting the privacy labels.

## CLI

```bash
pai-dream run --provider local --runtime-home ~/.pai
pai-dream run --provider deterministic --runtime-home /tmp/pai-fixture
pai-dream run --provider claude-inference --enable-provider --approve-provider
```
