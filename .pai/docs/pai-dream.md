# pai-dream

`pai-dream` turns redacted canonical events into proposed durable memories. It does not accept raw payloads and it does not promote memories directly into instruction-eligible state.

## Providers

- `local`: local/offline rules-only provider, enabled by default for this AFK slice.
- `deterministic`: deterministic test double for repeatable fixtures.
- `claude-inference`: documented future option only. It is disabled by default and deferred to #019 because real provider calls may transmit redacted but still sensitive local context outside the machine.

## Safety Boundaries

- Input events must be canonical `pai.event.v1` envelopes with no `payload` or `payloads` fields.
- Proposed memories are written with `review_status: proposed`, low or medium trust, source event IDs, provenance, confidence, assertion type, and review queue entries.
- Provider failures happen before memory writes. Existing raw events, accepted memories, and review queue state remain unchanged.

## CLI

```bash
pai-dream run --provider local --runtime-home ~/.pai
pai-dream run --provider deterministic --runtime-home /tmp/pai-fixture
```
