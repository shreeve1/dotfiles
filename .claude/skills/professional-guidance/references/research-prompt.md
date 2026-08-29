# Building the research prompt

Read this only when the user has picked a research tier in step 4 of
`SKILL.md`. Build from **the section for the tier they chose**.

Either way, the prompt you hand over is standalone. The research tool has none
of this conversation — no persona file, no clarifying answers, no idea who the
user is. Every fact the research depends on has to be written into the prompt
itself. Everything you write into it also leaves the tenant, which is why the
disclosure rule below exists.

## Which tier

**Both tiers are prompts the user pastes into Gemini.** The difference is which
Gemini mode and what it costs them — not who does the research. You never run
it yourself, at either tier.

| | **Regular Gemini chat prompt** | **Gemini Deep Research prompt** |
|---|---|---|
| Where the user runs it | An ordinary Gemini chat | Gemini's Deep Research mode |
| Cost to user | Free, ~1 minute | Paid quota + 10 min round trip |
| Size | 1–3 questions | 5–8 questions |
| Right for | A current figure, a definition, a standard practice, the present state of a rule, a spot-check on something you'd otherwise assume | Benchmarks, market or vendor comparisons, a regulatory landscape, anything where the sourcing has to hold up in front of a client |
| Wrong for | Anything needing sources weighed against each other | One fact you could have just asked for |

**Break ties toward the chat prompt.** A thin Gemini chat answer can be
escalated later on evidence; a Deep Research run spent on a one-line question
can't be refunded.

## Rules for both tiers

1. **Write from the specialist's angle.** You already adopted the persona in
   step 3. Ask for what *that specialist's methodology* needs — a compensation
   analyst and an M&A analyst researching "the same" company want different
   things.
2. **Load in the real specifics, then flag what you loaded.** Size, industry,
   geography, headcount, dollar figures, timeline, vendor names, regulatory
   regime, the actual constraint. Anonymize where the user would want it (say
   "a 40-person MSP in the Pacific Northwest" rather than naming the client)
   unless the name is what makes the research work. **Either way, the user
   makes the final call:** under the code block, name what's in the prompt that
   might not belong in a third-party tool — client names, PHI, CUI/FCI,
   personnel names, hostnames/IPs, ticket numbers, contract terms — and offer
   to reissue it scrubbed. Never assert that a prompt is safe to paste.
3. **Ask questions, not topics.** "What is the market rate for X" beats
   "research X compensation."
4. **Every question must be externally answerable.** Drop anything whose real
   answer lives in the user's own contracts, PSA, documentation, or head — that
   burns the run and returns filler. If you catch yourself writing one, that's
   a signal to go look it up in first-party data instead.
5. **Bound the scope.** Recency window, geography, org size band. Write the
   recency window **relative to today's date** ("the last 24 months") or
   compute it from the actual current date; never copy a hardcoded year range
   out of this file.
6. **Ask for citations inline**, and for an explicit note where the data is
   thin or sources disagree.
7. **Never invent a fact to fill a slot.** If a specific you need is unknown,
   either ask the user for it before writing the prompt (step 4 allows this) or
   write it in as an explicit open variable — "the organization is under 50
   staff; treat exact headcount as unknown." No `[insert X]` placeholders, no
   notes to the user inside the block, no quietly assumed numbers.
8. **Keep it copy-paste clean.** The code block contains the prompt and nothing
   else.

---

## Tier 1 — Regular Gemini chat prompt

For the user to paste into an ordinary Gemini chat — not Deep Research mode,
and not something you run in this session.

Short and surgical. Two or three sentences of context, the question, the
bounds, and what shape the answer should take. Do not dress a one-question
prompt up as a brief — length here buys nothing and invites a rambling answer.

### Template

```
<One or two sentences of context: who is asking, what decision it feeds.>

<The question, stated specifically. One to three of them, numbered if more
than one.>

Constraints: <geography / org size / recency window relative to today>.

Give me the figure or the direct answer first, then cite your sources with
links. If the data is thin or sources disagree, say so rather than averaging
it into a single number. Keep it under <length>.
```

### Worked example

Routed persona: **HR Policy Advisor → Compensation Analyst**. The specialist
needs one current number to price a replacement hire; everything else about the
plan comes from first-party data and the persona's own methodology.

```
I'm pricing a replacement hire for an on-site field IT technician role at a
small managed service provider, placed full-time at a healthcare client site.

1. What is the current salary range for on-site / field IT technicians at
   managed service providers in Washington and Oregon, by experience level?
2. Does healthcare-environment experience carry a measurable premium in that
   range?

Constraints: US Pacific Northwest, employers of 20-100 people, data from the
last 24 months.

Give me the ranges first, then cite your sources with links. If the surveys
disagree, show the spread rather than averaging it. Keep it under 400 words.
```

---

## Tier 2 — Deep Research prompt

The full brief. Worth building only when the decision genuinely rests on
multiple sources weighed against each other.

### Template

Adapt freely — this is a shape, not a form to fill in.

```
You are conducting deep research to support <the specialist role and what they
are producing>.

CONTEXT
<3-6 sentences of the real situation: who the organization is, size, industry,
geography, what happened, what decision is being made, the constraints and
timeline that matter. Written so a stranger could act on it.>

RESEARCH QUESTIONS
1. <specific, externally answerable question>
2. <...>
3. <...>
(5-8 total, ordered by how much the decision depends on them)

SCOPE AND CONSTRAINTS
- Timeframe: prioritize sources from <window relative to today>; note where
  older material is still the standard reference.
- Geography / jurisdiction: <region>.
- Comparable organizations: <size band, sector, model>.
- Out of scope: <what not to spend effort on>.

SOURCES
Prioritize <the source types that matter for this domain>. Cite every
substantive claim inline with a link. Where sources disagree, present both
positions and say which is better supported and why. Distinguish clearly
between hard data, industry consensus, and single-source opinion.

DELIVERABLE
Produce a structured report with: an executive summary of the findings that
bear on the decision; one section per research question; <tables/comparisons
where relevant>; and a closing section listing open questions and where
reliable data does not exist. Flag anything that looks likely to change in the
next 12 months.
```

### Worked example

Same routing — **HR Policy Advisor → Compensation Analyst**
(`agent-personas/legal-hr/HR-Policy-Advisor.txt`) — but here the user is
handing a written replacement plan to the client, so benchmarks, ramp
timelines, and credentialing lead times all have to be sourced. That is what
justifies the spend over the tier-1 chat prompt above. The size, region, and client
sector came from a short follow-up ask under step 4.1 — they were not assumed.

```
You are conducting deep research to support a compensation and workforce
planning analysis for a managed IT services provider.

CONTEXT
A 40-person managed service provider in the Pacific Northwest (US) places
dedicated on-site technicians at client sites. Their on-site technician at a
mid-size healthcare client has resigned with two weeks' notice. The client is
asking what the replacement plan is. The provider needs to understand the real
cost and timeline to hire, onboard, and ramp a replacement on-site technician
who can work in a HIPAA-regulated environment, what the ramp plan should look
like, and what retention practices reduce turnover in this specific role.

RESEARCH QUESTIONS
1. What is the current salary range for on-site / field IT technicians at
   managed service providers in the US Pacific Northwest, broken out by
   experience level and by whether healthcare-environment experience is
   required?
2. What is the typical time-to-fill for this role in this market, and how has
   that trended over the last three years?
3. What is the documented all-in cost of turnover for a technical service role
   at this level, including recruiting, onboarding, lost billable hours, and
   client-relationship risk?
4. What onboarding and ramp timelines do managed service providers report for
   placing a technician into an established client site, and what specific
   practices measurably shorten them?
5. What does a documented ramp plan for an embedded on-site technician
   typically contain — shadowing periods, runbook handover, escalation paths,
   competency checkpoints — and what does the evidence say about which
   elements matter most?
6. What credentialing, background-check, and HIPAA-training requirements
   typically gate a technician's start date at a healthcare client, and how
   long does each take?
7. What retention practices show measurable effect on turnover for embedded /
   on-site technicians specifically, as opposed to general IT staff?

SCOPE AND CONSTRAINTS
- Timeframe: prioritize sources from the last 24 months; note where an older
  benchmark is still the standard reference.
- Geography: US, with Washington/Oregon specificity where available.
- Comparable organizations: managed service providers and IT services firms,
  20-100 employees.
- Out of scope: enterprise internal IT departments, offshore or remote-only
  staffing models.

SOURCES
Prioritize industry compensation surveys, managed-services industry
association and benchmark reports, BLS and state labor data, healthcare
compliance guidance, and IT services trade publications. Cite every
substantive claim inline with a link. Where sources disagree, present both
positions and say which is better supported and why. Distinguish hard data
from industry consensus and from single-source opinion.

DELIVERABLE
Produce a structured report with: an executive summary of the findings that
bear on the replacement decision; one section per research question; a salary
comparison table by experience level and a timeline table for the
hire-to-productive sequence; and a closing section listing open questions and
where reliable data does not exist. Flag anything likely to change in the next
12 months.
```

---

## Handing it over

Disclosure warning first, then the mechanics. Two or three lines.

**Regular Gemini chat prompt:**

> Read that before you paste it — it goes to Google. If anything in there
> shouldn't (client name, personnel names, ticket numbers), say the word and
> I'll reissue it scrubbed.
>
> Paste it into a regular Gemini chat — no need for Deep Research on this one —
> and paste the answer back here. Should take a minute; I'll hold off on <the
> deliverable> until it lands.

**Gemini Deep Research prompt:**

> Read that before you paste it — it leaves our tenant and goes to Google. If
> anything in there shouldn't (client name, personnel names, ticket numbers,
> contract terms), say the word and I'll reissue it scrubbed.
>
> Run it in Gemini Deep Research, then bring the report back however's easiest
> — upload the file, paste the text, or drop the Docs link. I'll hold off on
> <the deliverable> until it lands.

## Reading what comes back

- Accept a result from any research tool, not only Gemini, and note which one
  produced it when you summarize.
- On a long report, read it fully but summarize **against your own numbered
  questions** rather than restating the report's structure.
- Check the load-bearing numbers for citations. An uncited figure in an
  LLM-synthesized answer is a claim, not a fact — verify it or label it.
- **Escalating tier 1 → tier 2 requires evidence**, not appetite: the chat
  answer was uncited, self-contradictory, or silent on something the
  deliverable rests on. Say which, and what the Deep Research run would buy,
  before spending the user's quota.
- If a Deep Research report answers fewer than about half the questions, say so
  and offer a tightened second prompt rather than building on thin material.
