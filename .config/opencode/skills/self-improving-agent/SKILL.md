---
name: self-improving-agent
description: Learn from recent OpenCode sessions, tool results, and user feedback to extract reusable patterns, update local memory, and optionally improve OpenCode skills. Use when the user asks to self-improve, evolve a skill, review lessons learned, analyze recent mistakes, or capture reusable guidance from experience.
---

# Self-Improving Agent

Use this skill when the user wants the system to learn from recent work, not when they just want a one-off answer. In OpenCode, this skill pairs with a local plugin that records session events into `artifacts/self-improving-agent/memory/`. Use those memory files as the source of truth, then make narrow, traceable updates.

Do not silently rewrite many skills at once. Prefer updating memory first, then improve specific skills only when the user asks or when the target is obvious and low risk.

---

## OpenCode Adaptation

This is an OpenCode-native adaptation of the original Claude-oriented skill.

- Event capture comes from the local plugin at `plugins/self-improving-agent/index.js`.
- Working memory lives in `artifacts/self-improving-agent/memory/working/`.
- Episodic logs live in `artifacts/self-improving-agent/memory/episodic/` as JSONL files.
- Semantic patterns live in `artifacts/self-improving-agent/memory/semantic-patterns.json`.
- Repeated tool outcomes are auto-promoted into semantic patterns after they recur enough times.
- If the `agent_attribution` tool is available, use it before attributing assistant output to a specific agent.

---

## When To Use It

Use this skill when the user says or implies:

- "self-improve"
- "learn from this"
- "summarize lessons learned"
- "what patterns should we keep"
- "improve this skill based on recent work"
- "review recent failures and evolve the workflow"

Do not use it for general debugging, one-off retros, or routine file edits that do not need durable learning.

---

## Inputs To Gather

Start with the smallest useful set of inputs:

1. Read `artifacts/self-improving-agent/memory/working/current_session.json` if it exists.
2. Read `artifacts/self-improving-agent/memory/working/last_error.json` if it exists and errors matter.
3. Read `artifacts/self-improving-agent/memory/semantic-patterns.json`.
4. Read the most recent episodic log files under `artifacts/self-improving-agent/memory/episodic/`.
5. If agent ownership matters, call `agent_attribution`.
6. If the user named a target skill, read that skill before proposing or applying changes.

Prefer `glob`, `read`, and `grep` over shell exploration.

---

## Workflow

## Phase 1 - Extract Experience

For each relevant recent episode, capture:

- task or situation
- tool or workflow used
- outcome: success, partial, or error
- root cause if visible
- what worked well
- what should change next time

Keep concrete facts separate from interpretation.

## Phase 2 - Abstract Patterns

Turn repeated or clearly reusable experiences into patterns.

Good abstractions:

- "Verify callback implementations before assuming refresh logic exists"
- "Run targeted validation before broad test suites when narrowing regressions"
- "Record the chosen workspace before testing when worktrees are involved"

Avoid weak abstractions from a single ambiguous incident.

Confidence heuristics:

- repeated pattern or explicit user confirmation -> high confidence
- one strong but isolated success/failure -> medium confidence
- speculative interpretation -> low confidence, keep as a note not a rule

---

## Phase 3 - Update Memory

When the user wants durable learning, update `artifacts/self-improving-agent/memory/semantic-patterns.json` with a concise entry:

```json
{
  "id": "pat-YYYY-MM-DD-slug",
  "name": "Short pattern name",
  "source": "retrospective|user_feedback|implementation_review|error_analysis",
  "confidence": 0.8,
  "applications": 1,
  "created": "YYYY-MM-DD",
  "category": "debugging|testing|workflow|skills|frontend|backend",
  "pattern": "One-line reusable lesson",
  "problem": "What problem it prevents or solves",
  "solution": {
    "summary": "What to do next time"
  },
  "quality_rules": [
    "Rule 1",
    "Rule 2"
  ],
  "target_skills": [
    "skill-name"
  ]
}
```

Preserve existing entries. Add or update only what you can justify from the evidence.

The plugin now performs a narrow automatic version of this step for repeated tool outcomes. Use manual updates for higher-level lessons, user feedback, or cross-skill guidance that the plugin cannot infer safely.

---

## Phase 4 - Improve Skills Carefully

Only edit a skill when at least one of these is true:

- the user explicitly asked to improve that skill
- the pattern clearly belongs to one skill and the update is small
- the existing skill contains guidance contradicted by recent evidence

When editing a skill:

1. Read the target `SKILL.md` first.
2. Make the smallest useful change.
3. Use an evolution marker so the change is traceable.
4. Prefer adding a checklist item, anti-pattern, or decision note over large rewrites.

Use this marker format:

```markdown
<!-- Evolution: YYYY-MM-DD | source: pat-YYYY-MM-DD-slug | reason: brief reason -->
```

If correcting bad guidance, use:

```markdown
<!-- Correction: YYYY-MM-DD | was: old guidance | reason: why it failed -->
```

---

## Phase 5 - Report Back

Report in a compact format:

- what evidence you used
- patterns extracted
- memory updates made
- skill files changed, if any
- confidence level and any open uncertainty

If the evidence is thin, say so directly and suggest gathering more sessions before hardening the pattern.

---

## Guardrails

- Do not overfit one anecdote into a universal rule.
- Do not edit unrelated skills just because they are nearby.
- Do not delete old patterns unless the user asks for cleanup and you have a clear replacement.
- Do not hide uncertainty; lower the confidence instead.
- Do not invent user feedback that was never given.

---

## Related Files

- `plugins/self-improving-agent/index.js`
- `artifacts/self-improving-agent/memory/semantic-patterns.json`
- `artifacts/self-improving-agent/memory/working/current_session.json`
- `artifacts/self-improving-agent/memory/working/last_error.json`
- `skills/self-improving-agent/references/appendix.md`
