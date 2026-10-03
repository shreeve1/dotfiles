---
name: pstack-setup
description: Configure which agents pstack uses per role and at what reasoning depth. Detects your available agents and writes ~/.agents/pstack-models.md, which pstack skills read when they pick a subagent. Use for /skill:pstack-setup, "configure pstack models", "pstack budget", or changing pstack's model choices.
---

# Setup pstack

Write pstack's model settings to `~/.agents/pstack-models.md`, one agent per role. pstack skills read this file when they pick a `task` agent. The file is a symlink into dotfiles: overwrite its contents, never replace the link.

## Steps

### 1. Detect available agents

The valid values are the omp agents `pstack-opus`, `pstack-sol`, and `pstack-glm`, plus the alias `inherit-parent`. Confirm each agent exists in `~/.omp/agent/agents/` before writing it. Never write an agent you have not confirmed. `inherit-parent` is always valid even though it is not a detected agent.

### 2. Load current state

The default role-to-agent mapping is the file shape shown in step 5. If the settings file already exists, read it and treat its `# budget` line and its role values as the current choices. Otherwise start from those defaults.

### 3. Budget, map, and confirm

**(a) Ask for a budget.** Prefer `ask` over free text. Offer these four options with these exact labels, and name the current budget when the file records one.

- `unlimited — keep max`
- `large — xhigh reasoning`
- `medium — high reasoning`
- `small — medium reasoning`

**(b) Apply it.** Map the budget to each agent's `thinkingLevel` frontmatter: `unlimited` leaves every level as in the default shape. `large`, `medium`, and `small` set `thinkingLevel` to `xhigh`, `high`, or `medium` for every role's agent, panel entries included. `inherit-parent` does not change. On a re-run, keep any role the user previously changed away from the default agent.

**(c) Show the roles and confirm.** Show every role with its agent and thinking level. Ask whether to accept as-is or change specific roles, offering the detected agents plus `inherit-parent` (the role runs on the parent chat model) as the options. Prefer `ask` over free text. For panel roles (arena runners, architect runners, interrogate reviewers, arena cross-judge pool) the value is a list of the three agents, and one `task` spawn runs per entry, so the list length sets the fan-out. `arena cross-judge pool` is also a list, but Arena selects one value from it whose model family differs from the parent's when possible. `swarm workers` is the default agent for every worker unless a race or comparison assigns another agent per arm.

### 4. Validate

Every agent written must exist in `~/.omp/agent/agents/`. `inherit-parent` always passes. If a chosen agent is not available, stop and ask again.

### 5. Write the settings file

Write `~/.agents/pstack-models.md` with a `# budget` line with the chosen label and its target thinking level, and one line per role, using the same labels poteto-mode uses. Overwrite the whole file so re-runs stay idempotent. Shape:

```
# pstack agent configuration. One line per role. Delete a line to fall back to the skill default.
# `inherit-parent` as a value: the role runs on the parent chat model (use the default `task` agent). Entries in a panel list still count toward its fan-out.
# budget: unlimited (max)
feature, refactoring: pstack-glm
bug-fix: pstack-glm
perf-issue: pstack-glm
hillclimb: pstack-glm
judgment and prose: pstack-opus
hardest tasks: pstack-opus
how explorer: pstack-glm
how explainer: pstack-opus
why investigators: pstack-glm
why synthesizer: pstack-opus
reflect tooling: pstack-sol
reflect judgment, divergent, synthesizer: pstack-opus
arena runners: pstack-opus, pstack-sol, pstack-glm
arena cross-judge pool: pstack-opus, pstack-sol, pstack-glm
swarm workers: pstack-glm
architect runners: pstack-opus, pstack-sol, pstack-glm
interrogate reviewers: pstack-opus, pstack-sol, pstack-glm
```

### 6. Confirm

Tell the user the file was written. pstack skills read `~/.agents/pstack-models.md` when they pick a `task` agent. Re-running this skill updates it.

### 7. Offer a verification skill (optional)

Check whether the project has a way to drive the real app for proof (a `verify-*` skill, or an existing harness). If not, offer once: "want a project-local verification skill, so agents can drive the app the way a user does and prove changes work? I can generate one with /create-verification-skill." On yes, invoke `/skill:pstack-create-verification-skill`. On no, move on without pushing.
