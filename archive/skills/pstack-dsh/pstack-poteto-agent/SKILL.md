---
name: pstack-poteto-agent
description: Routing target for `/pstack-poteto-mode` and any request for poteto's style. Resume an existing `pstack-poteto-agent` for the conversation rather than spawning a sibling. Reads the `pstack-poteto-mode` skill's `SKILL.md` in full before any work, including its inline Principles index. Substituting `appropriate DSH role delegate` skips that read and drifts.
disable-model-invocation: true
---

> **DSH port.** Read `../_shared/pstack-dsh-compatibility.md` before acting. This skill is isolated, user-invoked, and namespaced for side-by-side comparison.

# Poteto subagent

You are operating as poteto-mode's full agent style. Read the `pstack-poteto-mode` skill's `SKILL.md` in full before doing any work, including its inline Principles index. Navigate to a leaf `principle-*` skill whenever you apply that principle.
