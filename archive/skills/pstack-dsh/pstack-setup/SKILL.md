---
name: pstack-setup
description: Configure pstack's DSH role routes and reasoning budget in a machine-local file.
disable-model-invocation: true
---

# Setup pstack for DSH

Write `~/.dsh/pstack-models.md`. This file is read only by the namespaced pstack skills. It is not an automatically injected DSH rule and does not affect the user's existing agent setup.

## 1. Load current state

Read `~/.dsh/pstack-models.md` if it exists. Otherwise begin with every role set to `inherit-parent`.

## 2. Choose a budget

Use `ask_user_question` with these options:

- `unlimited — provider default or maximum supported effort`
- `large — xhigh reasoning when supported`
- `medium — high reasoning when supported`
- `small — medium reasoning when supported`

The budget is a ceiling, not permission to invent unsupported effort identifiers.

## 3. Choose role routes

Show every role below. A route has three optional parts:

```text
provider/model | reasoning_effort
```

`inherit-parent` means omit provider, model, and reasoning overrides when delegating. Never write a provider, model, or effort unless it has been confirmed in the current DSH environment or explicitly supplied by the user.

Roles:

- feature and refactoring worker
- bug-fix worker
- performance worker
- hillclimb worker
- judgment and prose
- hardest tasks
- how explorer
- how explainer
- why investigators
- why synthesizer
- reflect tooling
- reflect judgment
- arena runners
- arena cross-judge pool
- swarm workers
- architect runners
- interrogate reviewers

Panel roles contain a comma-separated list. One delegate runs per list entry. Ask whether to accept the inherited defaults or configure specific roles.

## 4. Validate

Every configured provider/model and reasoning effort must be known to work in DSH. If availability cannot be confirmed, use `inherit-parent` rather than guessing.

## 5. Write

Write the whole file idempotently:

```md
# Pstack DSH model configuration

Budget: medium

feature and refactoring worker: inherit-parent
bug-fix worker: inherit-parent
performance worker: inherit-parent
hillclimb worker: inherit-parent
judgment and prose: inherit-parent
hardest tasks: inherit-parent
how explorer: inherit-parent
how explainer: inherit-parent
why investigators: inherit-parent
why synthesizer: inherit-parent
reflect tooling: inherit-parent
reflect judgment: inherit-parent
arena runners: inherit-parent, inherit-parent, inherit-parent, inherit-parent
arena cross-judge pool: inherit-parent, inherit-parent, inherit-parent, inherit-parent
swarm workers: inherit-parent
architect runners: inherit-parent, inherit-parent, inherit-parent, inherit-parent
interrogate reviewers: inherit-parent, inherit-parent, inherit-parent, inherit-parent
```

## 6. Confirm

Tell the user where the file was written. The new mapping applies the next time a pstack skill delegates work. Re-running `/pstack-setup` replaces the mapping.
