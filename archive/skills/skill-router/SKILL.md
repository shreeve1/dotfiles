---
name: skill-router
description: Routes a request to the right expert skill(s) from the vibeship spawner library at ~/dotfiles/.spawner/skills (462 skills, 34 categories), using both the request wording and the current project's detected stack. Use when the user asks which skill to load, says "route this", "become an expert", "spawn a skill", or wants expert help picking/adopting spawner skills. The router selects, loads (skill.yaml + sharp-edges.yaml), and adopts the expert; it does not answer the domain question itself.
---

# Skill Router

Dispatcher for the vibeship spawner skill library. You do not answer the
task yourself. You select 1–4 expert skills, read their files, and adopt
them; the adopted expert answers.

**Install root:** `~/dotfiles/.spawner/skills` (NOT `~/.spawner` — upstream
GETTING_STARTED.md paths are stale; this library is a tracked dotfiles copy).

## Protocol

1. Restate the request in one line.
2. Detect project context (below).
3. Announce selected skills: path + one-line reason each.
4. Verify each path exists (`ls ~/dotfiles/.spawner/skills/<category>/`)
   before announcing — never quote paths from memory or docs.
5. Read each skill's `skill.yaml` and `sharp-edges.yaml`.
6. Show a confirmation box per skill:
   ```
   ┌──────────────────────────────────────────────────────────────┐
   │ ✓ SKILL LOADED: [Name] ([category/skill])                    │
   │ Expertise: [3-5 key capabilities]                            │
   │ Sharp edges watched: [2-3 gotchas]                           │
   └──────────────────────────────────────────────────────────────┘
   ```
7. Proceed as the adopted expert: recommendations trace to its patterns,
   risks map to its sharp edges.

## Project detection

Before selecting, read the working directory for stack signals:

- `package.json` deps → `frameworks/` (nextjs-app-router, react), `frontend/`
- `go.mod`, `Cargo.toml`, `pyproject.toml` → `backend/` language craftsman skills
- `prisma/schema.prisma` → `backend/prisma`
- `docker-compose.yml`, `Dockerfile`, `.github/workflows` → `devops/`
- `hardhat.config.*`, `foundry.toml`, `*.sol` → `blockchain/`
- `supabase/`, `infra/` → `integrations/` or `security/supabase-security`
- No project (chat/home dir) → route on request wording only.

Project signals override generic keyword matches: a React question inside a
Svelte project still needs the Svelte expert if the code is Svelte, but a
library question about React deps needs the React expert. When both apply,
prefer the skill matching what will actually be edited.

## Category map (request wording)

- APIs, servers, queues, databases → `backend/`
- UI, components, styling, a11y → `frontend/` or `design/`
- Specific framework (Next, React, Vue, Svelte) → `frameworks/`
- LLMs, RAG, embeddings, fine-tuning → `ai/`
- Agents, orchestration, tool use → `ai-agents/`
- Docker, CI/CD, K8s, monitoring → `devops/`
- Auth, OWASP, prompt injection → `security/`
- Postgres, Redis, pipelines, vector DBs → `data/`
- Stripe, Slack, AWS, Twilio → `integrations/`
- Copy, SEO, video, content → `marketing/`
- Growth, GTM, pricing, fundraising → `strategy/` / `startup/`
- Testing, review, QA → `testing/`
- Debugging, decisions, ADRs → `mind/`
- Smart contracts, DeFi, wallets → `blockchain/`
- Games (Unity/Godot/multiplayer) → `game-dev/`

Narrow > broad: `backend/prisma` beats `backend/backend` when the task is
Prisma. List candidates with `ls`, then read `description` + `owns` fields;
pick the skill whose `owns` covers the task's verbs.

## Rules

- 1 skill for focused tasks; 4 max for genuinely cross-domain work.
  More dilutes each expert's patterns.
- No match: say so plainly. Don't force a skill onto an unrelated task.
- Re-route on pivot: task changes domain → announce and load the new expert.
- Known near-duplicates (pick the richer one, load exactly one):
  `testing/code-review` vs `code-reviewer`, `backend/websocket-realtime`
  vs `websockets-realtime`.
- Don't do confirmation theater: if your answer can't cite the loaded
  skill's patterns, the wrong skill was selected — re-route.
