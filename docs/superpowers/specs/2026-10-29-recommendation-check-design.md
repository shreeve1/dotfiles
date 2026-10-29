# Recommendation check: design

Date: 2026-10-29. Status: draft for approval.

## Intent

Agents recommend architecture that does not fit the system they are working
inside: a hook a harness does not have, a framework feature that does not
exist, or a hand-built script, service or layer where documentation or a
popular open-source project already covers the need. The worst cases are
work on AI agents and harnesses, and front-end/back-end stacks. Some models
(minimax-m3 named) are trusted less than others.

The recommendation check is a second pair of eyes on every recommendation.
It says "this is not possible", "this premise is wrong", or "this already
exists, look at it before recommending further", with the source. The agent
then revises its advice. A late finding beats none.

## Goals

- Run automatically on answers that recommend something.
- Ground each recommendation in sources, in this order: the working
  directory's own memory and docs, official documentation for the products
  it depends on (local copies first, then the web), and, when the
  recommendation is to build something, popular open-source projects that
  already do it.
- Judge each recommendation and its stated premises, not just attach links.
  The Syncthing example (below) needed the checker to read the docs page and
  compare it with the claim.
- Deliver findings to the agent as a correction it must act on.

## Non-goals

- No judging of taste, style or naming. Design choices the sources leave
  open get no finding (same rule as the grill ledger check).
- No running commands, installing projects or testing a recommendation.
  The checker stays read-only plus web search and fetch.
- Not a replacement for the fact-check (claims about files) or the
  completion check (was the request done). They keep running as today.
- No change to Claude Code, Codex, omp or OpenCode in this version.

## Anti-goals

- Noise: a finding on most answers, or findings on advice the sources do
  not contradict. A check that cries wolf gets turned off.
- Pushing the agent into scope growth: "also consider X" is not a finding.
- Interrupting the agent mid-task for a stale point.

## Decided (owner)

- Automatic, not on request.
- The agent receives the finding and revises its advice.
- Search focus: official documentation and open-source projects. Popular
  open-source projects are in scope.
- Slow is acceptable.
- Checker model: the same as the fact-check, now `cliproxy/glm-5.3-flash`
  on the z.ai GLM Coding Plan.

## Decided (my calls, open to override)

- **Late findings wait for the agent to finish.** When a finding arrives
  while the agent is working, it is queued as a follow-up
  (`pi.sendUserMessage(text, { deliverAs: "followUp" })`) and delivered
  when the current run ends. When the agent is idle it starts a turn at
  once. It is still delivered if the user has sent new prompts since; today's
  "drop a stale result" rule stays for the fact-check and completion check.
  Reason: interrupting (`steer`) breaks the current task for a point about
  an earlier answer.
- **A late finding never interrupts and never takes priority.** It joins
  the queue behind the newer turn, which finishes first. Several late
  findings (from overlapping checks) are each delivered, oldest first, one
  follow-up each. Each concerns its own earlier answer, and the revision it
  causes is never checked again.
- **Interactive (TUI) only in this version.** Headless `pi -p` would have to
  wait up to the checker timeout at the end of every run.
  `ponytail:` headless runs get no recommendation check; add it at the
  `agent_before_settle` boundary if headless use needs it.
- **One checker call decides and checks.** It first decides whether the
  answer recommends an approach and stops with `NO_RECOMMENDATIONS` if not.
  That stop is cheap, so no separate first-pass model call.
- **Budget per answer:** at most 3 web searches and 3 page fetches,
  enforced by the prompt (the tools cannot cap themselves). Local reads are
  not capped.
- **No web search available** (no search config, over quota, or a search
  error): the checker uses local sources only and says so in its output.
  A recommendation it could not ground gets no finding. It is never
  reported as grounded. A checker run that fails outright logs `rec_error`
  and shows a warning, like today.
- **Settings:** the model is `VERIFY_FINAL_MODEL`, shared with the
  fact-check (the owner chose the same model). The timeout is separate,
  `VERIFY_RECOMMEND_TIMEOUT`, because web research runs longer.
- **Request history:** the same rolling last-three requests `--done` gets,
  latest last.
- **"Popular" means** a project with many stars for its niche and a commit
  in the last 12 months, as read from its repository page. Only reported
  when it clearly covers what was recommended.

## How it works

### Checker script: `verify-final --recommend -`

A third mode in `.agents/bin/verify-final`, beside `--check` and `--done`.
Input JSON `{"requests": [...], "answer": "..."}`, the same shape as
`--done`, so the checker knows what was asked.

- Runs `pi -p` with the existing read-only flags, plus
  `-e ~/.pi/agent/extensions/rpiv-web-tools` and
  `--tools read,grep,find,ls,web_search,web_fetch`. Spike 2026-10-29: this
  loads only the web-tools extension and `glm-5.3-flash` called
  `web_search` and returned the Syncthing docs URL.
- Timeout `VERIFY_RECOMMEND_TIMEOUT`, default 300 s.
- Prompt steps: (1) list each recommendation (an approach, architecture,
  tool choice or thing to build), or reply `NO_RECOMMENDATIONS`; (2) name
  the system each one runs inside (harness, framework, product, platform)
  from the answer and the request; (3) read local sources first: `memory/`,
  `docs/`, `AGENTS.md`, `README*` under the working directory, and known
  local doc trees (pi's own docs folder for pi questions); (4) then official
  docs on the web; (5) for a build recommendation only, search for an
  existing open-source project.
- Output, one line per problem, nothing for a recommendation that holds:
  - `IMPOSSIBLE | <source> | <recommendation> -- <what the system cannot do>`
  - `WRONG | <source> | <premise> -- <what the source says instead>`
  - `EXISTS | <url> | <recommendation> -- <what already covers it>`
  - or exactly `NO_RECOMMENDATIONS` / `NO_FINDINGS`.
  `<source>` is a URL or `file:line`. A line without a source is dropped by
  the parser.
- Prints the findings with an instruction for the agent, or
  `verify-final: recommendations hold`. The instruction: re-read the source
  for each finding, then restate the advice as a complete, standalone
  message opening with `Revised: <recommendation>; <what changed and why>`
  or `Kept: <recommendation>; <why the finding does not apply>`. Because the
  finding may arrive after the user moved on, the instruction quotes the
  recommendation and says it concerns an earlier answer.
- Logs to `~/.cache/verify-final.log` as `rec_none`, `rec_clean`,
  `rec_found`, `rec_error`, `rec_cached`, with counts per verdict. Same
  24-hour clean cache, keyed `kind="recommend"`.
- Kill switch `VERIFY_RECOMMEND=0`; `VERIFY_FINAL=0` turns off all checks.

### Pi extension: `.pi/agent/extensions/verify-final.ts`

- In the TUI `agent_settled` path, start `--recommend` alongside the
  fact-check and completion check, same 500-character minimum, on any turn
  (read-only answers recommend too).
- It is not awaited with the other two: their merged follow-up goes out as
  today. The recommendation result is handled on its own when it arrives.
- On arrival: if findings, send one follow-up (idle: start a turn; busy:
  `deliverAs: "followUp"`). At most one per user prompt. Mark it so no check
  runs on the agent's revision (reuse the `lastFollowupSeq` guard, extended
  to a queued follow-up). Discard only on session shutdown.
- A `rec_error` shows a one-line warning notice, like today.

## Example the design must handle

A minimax-m3 answer about a stalled Syncthing transfer between WSL and
Windows on wrk said a `.syncthing.<name>.tmp` file means the pull is stuck,
and recommended a systemd timer that pauses and resumes the peer. The
official docs (`docs.syncthing.net/users/syncing.html`, "Temporary Files")
say every transfer writes a temporary file and keeps one for up to a day
after an error (`keepTemporariesH`, default 24). Expected findings: `WRONG`
on the `.tmp` premise with that URL. The timer itself is possible
(`POST /rest/system/pause`), so it gets no `IMPOSSIBLE` line.

## Acceptance

- `tests/verify-final-recommend.test.sh` with the existing fake checker:
  parser keeps sourced lines and drops unsourced ones; `NO_RECOMMENDATIONS`
  sends nothing; a late result is still delivered after a new prompt; a
  busy agent gets `deliverAs: "followUp"`; no check runs on the revision;
  `VERIFY_RECOMMEND=0` disables it.
- Live runs with the real model on three fixtures: the Syncthing answer
  (expects `WRONG` on the `.tmp` premise), a pi-extension answer that
  proposes a hook pi does not have (expects `IMPOSSIBLE` citing pi's docs),
  and an answer with no recommendation (expects `NO_RECOMMENDATIONS`).
- Full suite `tests/run-all.sh` passes; ADR 0015 gets an addendum.

## Costs and limits

- About 87 of 236 long answers in one week used recommendation wording
  (rough keyword count), so around 12 full checks a day plus cheap
  `NO_RECOMMENDATIONS` runs. Model usage comes from the GLM plan quota.
- Web search uses each machine's `rpiv-web-tools` config (aidev: Exa).
  At the cap (3 searches and 3 fetches per check, about 12 checks a day
  in aidev's sessions) that is up to about 1,080 searches and 1,080 page
  fetches a month. Provider choice is still open. A machine without a
  search key runs the check with local sources only.

## Left to the builder

Prompt wording, parser details, test layout, and log field order.
