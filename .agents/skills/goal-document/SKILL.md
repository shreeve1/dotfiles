---
name: goal-document
description: Use when creating or revising a project's goal document (what the project is for, who relies on it, what to protect, priorities when goals conflict) for agents to consult on judgement calls, including a mission statement or commander's intent for agents, or when a project's agents keep escalating, piling up rules or over-engineering because nothing says what matters.
---

# Goal document

A goal document is the project's **commander's intent**: one page saying what the project is for and why, so an agent facing a call nobody wrote a rule for decides the way the owner would. It states the destination, never the route. Rules keep only the hard limits; everything else is judgement guided by this page.

Background: `references/research.md`. When the owner asks why this approach, or wants an example, open the matching article in `references/sources/`.

## 1. Look before asking

Read the project's instructions (`AGENTS.md`, `CLAUDE.md`), README, any policy, autonomy or rules files, and recent friction: escalations, rejected plans, stalled work, rules added after an incident. If a goal document already exists, revise it rather than starting over. Done when you can tell the owner, in a few lines, what the project appears to be for and where agents have been getting stuck (in a new project: what the owner fears going wrong). Never ask what the files already answer.

## 2. Draw out the intent

Ask only what you need to reach a shared understanding with the owner: one question at a time, open-ended and in the owner's words, with no example answers until you know the why. Stop asking once the ground below is covered and confirmed. Build each question on their last answer or on friction you found ("Three tickets escalated over a self-clearing job queue. Is a small, explained data change something you want to hear about?"). Ground to cover, never read out as a list:

- **Who it serves** and what each of them would notice going wrong.
- **What is irreplaceable**: the data, setup time or trust that can't be rebuilt. This usually outranks uptime.
- **What is best effort**: what may break, go down or wait.
- **What is still an experiment**: parts where the owner is learning, and whether agents should tune those freely or involve the owner.
- **What should reach the owner**, and what they want to stop seeing.
- **Anti-goals**: what would count as failure even if everything technically works (for example, the owner becoming the bottleneck).

Play back each part in plain words as soon as you understand it. Mark everything you inferred as your proposal, with your reason, and ask what's wrong or missing. Done when the owner has confirmed every part, including a **priority order** for when goals conflict.

## 3. Test it on real calls

Take two or three real past decisions from the project (an escalation, a rule that blocked work, a near miss); in a new project, realistic scenarios the owner agrees are likely. For each, say what an agent holding only the draft would do. Where that differs from what the owner wants, the draft is missing something: fix it and repeat. Done when the owner agrees with every outcome.

## 4. Write it

Use `goal-template.md`. Keep it to about one page: intent, people, priorities and boundaries, never procedures. Its job is the call no rule covers; once it grows procedures it becomes a second rulebook and agents stop judging. Leave environment facts (addresses, hosts, schedules, versions) in the files that own them and point to those. Show the owner the full text; write nothing until they approve it. Put it at the repo root as `GOALS.md` unless the project has a clear home for such documents. An agent that finds the document wrong or out of date proposes an edit to the owner and changes nothing itself.

## 5. Point agents at it

Add one line to the project's instructions file (`AGENTS.md`, or `CLAUDE.md` when it is a separate file), near the top, with a leading trigger. It loads on every run, so keep it to this one line, with the document's actual path:

```
**Before any judgement call** (a tradeoff, a risk call, whether to escalate, anything no rule covers): read `GOALS.md` and decide as it directs.
```

## 6. Name what it replaces

List the existing rules the goal document now makes redundant, or that conflict with it. For each, say what it was guarding against and whether judgement plus the goal document covers it. Present these as the owner's decisions; change no rule in this skill. Hard limits stay as rules: irreversible actions, security boundaries, shared systems, time windows.

## 7. Finish

Commit only your own paths if the project uses git. Tell the owner where the document is, which instructions point at it, and which rules are candidates to cut.
