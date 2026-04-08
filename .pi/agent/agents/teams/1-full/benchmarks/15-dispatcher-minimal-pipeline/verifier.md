# Verifier: Minimal Viable Pipeline

## Target Agent
dispatcher.md (from ~/.pi/agent/agents/teams/1-full/)

## Context Files
- ~/.pi/agent/agents/teams/1-full/context.md

## Scoring Rubric

### Criterion 1: Pipeline Length Correctness (weight: 3)
- 5: Request 1 uses 1–2 agents (builder, optionally reviewer). Request 2 uses 1–2 agents (builder, optionally reviewer). Request 3 uses 2–3 agents (builder + reviewer or tester for multi-file). Request 4 uses 4+ agents (planner → builder → reviewer → tester, possibly red-team) — clear scaling with risk.
- 3: Generally shorter pipelines for simple tasks and longer for complex, but one request is off by 2+ agents (e.g., 4-agent pipeline for README fix)
- 1: All requests get similar pipeline lengths regardless of complexity
- 0: Simple tasks get longer pipelines than the security task, or all requests get 1-agent pipelines

### Criterion 2: Justification for Each Agent (weight: 3)
- 5: Every agent in every pipeline has a specific reason tied to the request's risk or scope. No agent is included "just in case" or "for thoroughness."
- 3: Most agents justified but 1–2 are included without clear reasoning
- 1: Agents listed but justifications are generic ("reviewer checks quality")
- 0: No justifications provided

### Criterion 3: Removal Consequence Analysis (weight: 2)
- 5: For each pipeline, explains the concrete failure mode if one agent is removed (e.g., "removing reviewer from Request 3 risks missed rename in one of the 3 files")
- 3: Removal consequences described for some requests but generic for others
- 1: Generic "things could go wrong" without specific failure modes
- 0: No removal analysis

### Criterion 4: Efficiency vs Safety Tradeoff (weight: 2)
- 5: Request 4 (CSRF/security) gets a full pipeline with explicit security review. Requests 1–2 skip steps with stated low-risk justification. The dispatcher never sacrifices safety for speed — it only saves steps where risk is genuinely low.
- 3: Mostly balanced but either over-pipelines a trivial task OR under-pipelines the security task
- 1: Treats all requests as equally risky or equally trivial
- 0: Skips verification on the security task to be "efficient"

## Required Elements
- [ ] Request 1 (README fix) uses ≤2 agents
- [ ] Request 4 (CSRF) uses ≥4 agents including security-focused review
- [ ] Pipeline length increases from Request 1 → Request 4
- [ ] Each agent in each pipeline has a stated justification
- [ ] At least 2 requests include "what goes wrong if you remove an agent" analysis

## Anti-Patterns
- Identical pipeline for all 4 requests
- 4+ agents for the README fix (over-engineering)
- ≤2 agents for CSRF protection (under-engineering)
- Including planner for single-line changes
- Justifying agents with "just to be safe" instead of specific risk
- Skipping all verification to minimize pipeline length
