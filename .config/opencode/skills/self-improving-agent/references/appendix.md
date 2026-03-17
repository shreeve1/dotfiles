# Self-Improving Agent Appendix

## Memory Layout

```text
artifacts/self-improving-agent/memory/
├── semantic-patterns.json
├── episodic/
│   └── YYYY/
│       └── YYYY-MM-DD-<session-id>.jsonl
└── working/
    ├── current_session.json
    ├── last_command.json
    └── last_error.json
```

## Episodic Record Shape

Each JSONL line is one event captured by the plugin.

```json
{
  "id": "ep-...",
  "timestamp": "2026-03-15T12:00:00.000Z",
  "session_id": "...",
  "tool": "bash",
  "status": "success",
  "exit_code": 0,
  "title": "Runs tests",
  "args": {},
  "output_preview": "...",
  "metadata": {}
}
```

## Suggested Interpretation Rules

- Repeated errors with the same cause -> candidate anti-pattern
- Repeated success with the same intervention -> candidate best practice
- User praise tied to a specific approach -> raise confidence
- Conflicting evidence -> keep both notes or lower confidence

## Automatic Promotion

The plugin automatically tracks repeated tool outcomes in `semantic-patterns.json` metadata.

- Threshold: `2` occurrences of the same `tool + status + summary`
- Source: `auto_tool_outcome`
- Pattern IDs: `pat-auto-...`
- Working file for the latest promotion: `artifacts/self-improving-agent/memory/working/last_promotion.json`

This is intentionally conservative. It is good at preserving repeated operational signals, but it does not replace manual retrospective analysis.

## Minimal Review Loop

1. Read recent episodic logs.
2. Identify one or two strong patterns.
3. Update semantic memory.
4. Optionally update one target skill.
5. Report the evidence and confidence.
