# OpenCode Subagent Reference

This is the on-demand catalog for OpenCode subagent routing. Delegation is default-ON for non-trivial work: preserve primary context, pass complete context, parallelize independent work, and use direct tools only for exact known-file/single-probe work or a documented `Delegation exception:`. The mode router highlights obvious broad/non-trivial prompts with `DELEGATION_REQUIRED: true`; it does not block direct tools.

## Code And Execution

| Trigger | Subagent | Why |
| --- | --- | --- |
| Multi-file implementation, refactor, or feature build at E3+ | `forge` | GPT-family code producer for completeness. |
| One-task focused implementation with TDD | `builder` | Lightweight focused implementation. |
| Generic single-task work | `builder` | Lightweight executor. |
| System design, architecture, specs | `general` | Broad planning or architecture exploration. |
| Python CLI plus SQLite tooling | `python-sqlite-cli` | Stdlib CLI, SQLite, FTS5, argparse specialist. |

## Investigation And Review

| Trigger | Subagent | Why |
| --- | --- | --- |
| Explore unfamiliar code or flows | `explorer` | Fast codebase scout. |
| Validate completed work | `validator` | Read-only acceptance check. |
| E4/E5 final cross-vendor gate | `cato` | Read-only GPT-family auditor. |
| Anthropic-side strategy review | `quick-review-opus` | Strict verdict schema. |
| OpenAI-side strategy review | `quick-review-codex` | Opposing vendor verdict. |

## Browser, UI, And Web

| Trigger | Subagent | Why |
| --- | --- | --- |
| Validate live user stories | `browser-qa` | Playwright pass/fail reports. |
| General browser automation | `browser-automation` | Scrape, fill forms, screenshots, PDFs. |
| Visual screenshots or comparisons | `ui-reviewer` | Visual capture and analysis. |
| Console errors | `devtools-console` | JS exception specialist. |
| Network, CORS, payload issues | `devtools-network` | Request/response specialist. |
| Web performance | `devtools-performance` | Core Web Vitals, memory, long tasks. |
| Mixed DOM/console/network inspection | `devtools-inspector` | General DevTools inspector. |

## Infrastructure

| Trigger | Subagent | Why |
| --- | --- | --- |
| Discover live hosts/environments | `infra-scout` | Read-only reconnaissance. |
| Plan state-changing infra work | `infra-planner` | Reviewable execution packet. |
| Verify post-change evidence | `infra-validator` | Read-only validation. |
| Execute approved Linux/Unix packet | `executor-ssh` | Runs reviewed packet only. |
| Execute approved Windows packet | `executor-powershell` | Runs reviewed packet only. |

Pipeline rule: infra work goes scout -> planner -> human review -> executor -> validator.

## Research And Framework Work

| Trigger | Subagent | Why |
| --- | --- | --- |
| Quick current lookup | `web-searcher` | Fast source lookup. |
| LLM/agent research | `llm-ai-agents-and-eng-research` | Domain scanner. |
| New skill file | `skill-author` | SKILL.md structure. |
| New command file | `command-creator` | Workflow command author. |
| Complete framework set | `framework-builder` | Skill plus agents plus commands. |
| New subagent config | `meta-agent` | Agent definition generator. |

## Parallel Patterns

- Context-preserving scout: use `explorer` before broad repo discovery so the primary context does not fill with search output.
- Investigation fan-out: run multiple `explorer` agents over separate areas.
- Cross-vendor review: run `quick-review-opus` and `quick-review-codex` together.
- Browser bug triage: run console, network, and performance specialists in parallel.
- E4/E5 close-out: finish work, then `validator`, then `cato`.

## Delegation Exceptions

- Narrow exact-file or single-probe work can finish without broad context loading.
- No tool work is needed.
- The task needs unstated conversation context that cannot be provided in a complete prompt.
- James explicitly asked me to do it myself.

When an exception is used in Algorithm mode, write `Delegation exception:` with the reason in the DELEGATION GATE.

Disabled: `anvil` is not configured in this OpenCode port. Use `forge` for GPT-family code production.
