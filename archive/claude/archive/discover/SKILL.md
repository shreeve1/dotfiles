---
name: discover
description: Synthesize a Feature Requirements Document at .rpiv/artifacts/discover/ from the current session, asking clarifying questions ONLY for sections the session does not already cover. Pairs cleanly with `/grill-me` — run grill-me first to sort details, then `/discover` to convert that conversation into an FRD that kicks off the rralph loop. Falls back to a full one-question-at-a-time interview when the session is empty (fresh-feature mode). The FRD's Decisions block is consumed by `research` and propagates through Developer Context into `design`.
argument-hint: "[free-text | artifact path | (empty when session has feature context)]"
allowed-tools: Bash, Read, Edit, Write, Grep, Glob, Agent, AskUserQuestion
---

# Discover

You are tasked with producing a Feature Requirements Document (FRD) that downstream skills consume. Three principles shape the flow: (1) **session-aware** — if the current conversation already resolved intent / goals / decisions (typical after `/grill-me`), extract them verbatim instead of re-interviewing; only ask about genuinely uncovered sections; (2) **intent before agents** — when an intent question IS needed, it runs before any probe, so stated intent shapes the probe scope; (3) **lazy + confirm** — build the decision tree one layer at a time, and surface evidence-based pre-resolutions for confirmation rather than silently recording them.

## Input

`$ARGUMENTS` — free-text feature description, or path to an existing FRD / ticket / doc for refinement.

## Metadata

```!
node "${CLAUDE_SKILL_DIR}/../_shared/now.mjs"
echo
node "${CLAUDE_SKILL_DIR}/../_shared/git-context.mjs"
```

Copy values verbatim — do not reformat the timezone offset.

## Flow

1. Input → 1.5. Session coverage scan → 2. Intent question (only if uncovered) → 3. Codebase probe (gap-scoped, skip if coverage already cites evidence) → 4. Lazy tree (uncovered nodes only) → 5. Interview loop (uncovered nodes only) → 6. Synthesize FRD → 7. Write artifact → 8. Follow-ups

When the session is already saturated (typical after `/grill-me`), Steps 2-5 collapse to no-ops and the skill flows Input → Coverage scan → Synthesize → Write. When the session is empty, every step fires as in fresh-feature mode.

The final artifact is research-compatible — its Decisions block is translated into research's Developer Context and inherited by design.

## Steps

### Step 1: Input Handling

1. **No argument provided** — proceed unconditionally to Step 1.5. The coverage scan is the single decision point on whether the session has feature context. If the scan returns `empty-session` (no covered or partial rows), Step 1.5 emits the "provide input" prompt and waits — Step 1 never makes this call independently. This avoids two decision points using different criteria.

2. **Detect input shape** — parse the input:
   - If the argument is an existing file path (resolves to a readable `.md` under `.rpiv/artifacts/`, or any path the user mentions for refinement context), read it FULLY using the Read tool WITHOUT limit/offset. Treat its content as baseline context — the interview surfaces gaps, missing requirements, and unstated assumptions relative to what's already documented.
   - Otherwise → fresh-feature mode: the entire argument is the free-text feature description.

3. **Read any other files mentioned** in the prompt (tickets, docs, related artifacts, explicit `path:line` references) FULLY before proceeding.

**No agent dispatch in Step 1.** Only `Read` on user-named paths. Agent grounding starts in Step 3, after stated intent has shaped the probe scope.

Each invocation always writes a NEW timestamp-distinct artifact (Step 7) — there is no in-place stress-test append mode. To iterate on a prior FRD, either re-invoke discover (produces a fresh artifact) or manually Edit the prior artifact.

### Step 1.5: Session Coverage Scan

Before asking anything, inventory what the current conversation already settled. This is the gate that decides whether Steps 2-5 fire at all.

1. **Scan the current session** (developer turns + your own prior turns) for content that maps to FRD sections. Build an internal **coverage map** with one row per FRD section.

   **Source-of-truth carve-outs**:
   - **Baseline-FRD-path argument** — when Step 1 read an existing FRD because the user passed `/discover [path]`, that file's content is **baseline-only** and does NOT count toward coverage. The user's documented intent in that mode is "refine via fresh interview" — silently saturating the map from the baseline FRD would defeat that. Treat the baseline FRD as reference material for the interview, not as session content.
   - **Files mentioned in the prompt and Read for context** — same rule. Reading a ticket / spec / doc to ground the conversation does not constitute session coverage.
   - **Coverage rows only credit explicit developer/agent turns** in this conversation (typically the grill-me exchange or any other in-session discussion).

   The coverage map is built per FRD section. Use a markdown table with three columns: FRD section, Covered? (`yes` / `no` / `partial`), Evidence (turn reference, quote, or `file:line`). One row per section:

   - Problem & Intent
   - Goals / Non-Goals
   - Functional Requirements
   - Non-Functional Requirements
   - Constraints & Assumptions
   - Acceptance Criteria
   - Recommended Approach
   - Decisions

   FRD sections NOT in the coverage map — `Summary` (derived), `Open Questions` (only populated from explicit deferrals), `Suggested Follow-ups` (probe/interview observations), `References` (derived from input files) — are populated by Step 6 unconditionally.

2. **Coverage rules** (strict where it matters, lax where grill-me typically lands):
   - **Problem & Intent** — `covered` only if the developer's own framing of the problem and affected party appears in the session in their own words. Recommended-by-agent framing does NOT count.
   - **Goals / Non-Goals** — `covered` if at least one explicit goal AND one explicit exclusion exist. Otherwise `partial`.
   - **Functional Requirements** — `covered` if each behavior the feature must exhibit can be extracted as an independently testable statement. Loose narrative ("it should work well") → `partial`.
   - **Non-Functional Requirements** — `covered` if perf / security / UX / reliability are each either explicitly addressed or explicitly out-of-scope. Silence on all four → `no`.
   - **Constraints & Assumptions** — `covered` if at least one constraint OR assumption was stated; bare absence is acceptable for trivial features → `partial` rather than `no`.
   - **Acceptance Criteria** — **strictest gate.** `covered` only if each criterion names a concrete command, output, file path, or visible behavior a reviewer could check. "Feature works correctly" / "UX is acceptable" → `no`. Default lean is `no` unless the session was explicit.
   - **Recommended Approach** — `covered` if a session turn (yours or the developer's) names the architectural shape (component, seam, integration point). Grill-me sessions typically land this.
   - **Decisions** — `covered` if every shape-level tradeoff that drove the recommended approach is recorded with chosen-side and rationale. `partial` if rationale is missing.

3. **Decide the mode**:
   - **Session-saturated** — every row `covered`. Skip Steps 2, 3, 4, 5 entirely. Proceed to Step 6 (Synthesize FRD) using session content as the source of truth. Cite session turns or `file:line` references that already appeared in the session as evidence.
   - **Gap mode** — some rows `partial` or `no`. Carry the coverage map into Step 2+; each downstream step operates ONLY on uncovered rows (see step-specific gates below).
   - **Empty session** — every row `no` (typical when `/discover` is the first command of the session). Behavior depends on whether an argument was passed:
     - **No argument AND no baseline FRD path** → emit the "provide input" prompt and wait:
       ```
       I'll capture feature intent into an FRD. Provide one of:

       `/discover [free-text feature description]`     — fresh interview, write a new FRD
       `/discover [existing artifact path]`            — refine an existing FRD/ticket/doc via fresh interview
       ```
       Re-run Step 1.5 after the developer replies.
     - **Argument present** (free-text or baseline FRD path) → fall through to Steps 2-5 in full fresh-feature mode. The argument becomes the seed for the intent question and probe.

4. **Show the developer the gap list (only if gaps exist).** Before firing Step 2, print a one-line summary:
   ```
   Session covers: <comma-separated covered sections>.
   Gaps to resolve: <comma-separated uncovered sections>.
   ```
   This is a transparency line, not a question — do NOT ask the developer to confirm the coverage map. They corrected the model during `/grill-me`; trust the coverage scan and move on.

5. **No coverage-map persistence.** The map lives only in your working memory for this skill invocation — it is not written into the FRD or anywhere on disk.

### Step 2: Foundational Intent Question

**Gate**: skip this step entirely if the coverage map (Step 1.5) marks **Problem & Intent** as `covered`. Lift the framing verbatim from the session into the Step 6 synthesis instead.

If Problem & Intent is `partial` or `no`, ask the foundational intent question. This is purely conversational — no agents, no recommendation, no `file:line` citations.

1. **Ask one open-ended `intent` question directly in the conversation** (plain chat, NOT the AskUserQuestion tool — the developer should generate the framing, not pick from a proposal). Prefix it with **❓ Question:** so the developer knows their input is needed:
   - Frame: "What problem are you solving and who hits it?" / "What does success look like for the person experiencing this today?" — phrase it for the specific feature.
   - **No `(Recommended)` option.** The developer should generate the framing, not pick from a proposal.
   - **No `file:line` citations** — codebase has nothing to say about intent.
   - Frame the question so the developer can name the affected party in their own words (e.g., end user / maintainer / operator) — route the answer, don't constrain it to a solution shape.
   - The question is open-ended free-text — the developer types the real framing in their reply.

2. **Capture the answer in the developer's own words.** This text feeds into the FRD's Problem & Intent section verbatim — do not paraphrase into agent prose.

3. **Probe-readiness check**: does the stated intent support a *narrow* probe slice (one component, one seam)? If yes → proceed to Step 3. If no (answer is too vague, e.g., "I dunno, feels slow"), ask **one more `intent` question** to sharpen scope, then re-check. Step 2 ends on probe-readiness, not at fixed N=1. Cap: 3 `intent` questions before falling through to Step 3 with whatever scope you have.

### Step 3: Lightweight Codebase Probe (parallel agents, intent-shaped)

**Gate**: skip this step entirely if the coverage map (Step 1.5) marks **Recommended Approach** as `covered` (per the coverage rule — naming the architectural shape is enough; `file:line` is not required). Reuse in-session evidence as Step 4's pre-resolution input. Grill-me sessions typically satisfy this — the developer already named the seam and the integration point, even when the exact `file:line` was not cited. The probe's purpose is to ground the interview in concrete code; when the session already grounded the discussion, the probe adds noise rather than value.

When the gate does not skip: probe only the seams tied to **uncovered** sections from the coverage map. Goal: ground the upcoming interview in concrete codebase evidence, with the probe slice shaped by the developer's stated intent from Step 2 — not by the raw input text.

1. **Pick the agent set.** Dispatch `codebase-locator`, `codebase-analyzer`, or both — nothing else. Cap: 2 agents per Step 3 invocation.

2. **Spawn the chosen agent(s) in parallel using the Agent tool.** Draft each prompt yourself from the developer's stated intent — keep the slice narrow (one component, one seam) and avoid breadth phrasing like "everything related to X". Shape per call:
   ```
   Agent({
     subagent_type: "codebase-locator",   // or "codebase-analyzer"
     description: "<3-5 word task>",
     prompt: "<your narrow-slice prompt, scoped to stated intent>"
   })
   ```
   The agent description on each subagent is the contract for what it expects in the prompt body.

3. **Wait for ALL agents to complete before proceeding to Step 4.**

4. **Read any clearly-relevant files** surfaced by the agents (≤5 files in main context, files <300 lines fully, larger files first 150 lines). Carry the agent reports and these files into Step 4 as evidence.

5. **Empty results are not fatal.** If the probe returns thin/empty results (greenfield, no precedent), record "no codebase precedent" as evidence — `scope` interview questions still work (they don't need `file:line`), and `shape` questions will shift to ungrounded "pick A or B by convention" mode.

### Step 4: Lazy Tree Setup + Pre-Resolution Confirmation

**Gate**: include in the tree ONLY the branches whose corresponding FRD section is `partial` or `no` in the coverage map (Step 1.5). Drop `covered` branches entirely — they already have answers waiting to flow into Step 6.

Synthesize the **next layer** of questions internally before asking anything. Lazy expansion — build only root + immediate uncovered children at this stage, not the full tree. Each subsequent layer is built after its parent resolves.

1. **Build root + immediate children (uncovered only)**:
   - **Root** — the developer's already-stated problem from Step 2 (or from the session, when Step 2 was skipped).
   - **Immediate children** — the foundational unresolved branches drawn from the uncovered rows of the coverage map: Goals/Non-Goals · Functional Requirements · Non-Functional Requirements (perf/security/UX/reliability) · Constraints · Acceptance Criteria · Recommended Approach.
   - Order branches by dependency (root → goals → constraints → solution shape → details). **This order drives the interview, not the FRD section order** — Step 6 redistributes answers into FRD sections.

2. **Mark evidence-based pre-resolutions** from Step 3 with `file:line` citations. Do NOT silently record them as Decisions yet.

3. **Coverage-filter pre-resolutions BEFORE asking.** For each pre-resolution, check whether the coverage map (Step 1.5) already shows a session turn confirming, contradicting, or selecting on this point:
   - **Session-confirmed** (the developer or you, in this session, already endorsed the position the probe inferred) → record as Decision directly, rationale `evidence: file:line + session-confirmed (turn ref)`. Do NOT include in the batch-confirm question. Re-asking it is the exact failure mode the session-aware gate exists to prevent.
   - **Session-contradicted** (the session settled on the opposite of what the probe inferred) → record the Decision in the developer's direction, rationale `evidence: file:line; session overrode probe inference (turn ref)`. Skip the question; the session has authority.
   - **Not addressed in session** → include in the batch-confirm question below.

4. **Batch-confirm the remaining pre-resolutions in a single `AskUserQuestion` call** before entering the interview loop. Frame each as: "From the probe I inferred — `<observed behavior>` (`file:line`). Keep this for the feature, or change it as part of the work?" The developer's confirm/correct is the actual Decision.

   - **Confirm** → record as Decision, rationale `evidence: file:line + confirmed`.
   - **Correct** → flip the Decision direction, schedule a Correction probe at Step 5 (≤1 additional agent on the new seam).
   - If every pre-resolution was resolved by the coverage filter above, skip this call entirely.

4. The lazy tree stays internal — do NOT present the tree to the developer unless asked.

### Step 5: Interview Loop

**Gate**: if the lazy tree (Step 4) is empty because every FRD section was `covered` in the coverage map, skip this step entirely and jump to Step 6. Otherwise walk only the uncovered nodes that survived the Step 4 gate. Do NOT manufacture questions for sections the session already covers — re-asking a settled point is the explicit failure mode this gate prevents.

Walk the lazy tree depth-first, parent before child. Expand the next layer (build a node's children) only after the node resolves. For each unresolved node:

1. **Classify the question by tier**:
   - **`intent`** — already done in Step 2. Do not re-ask intent in this loop.
   - **`scope`** (goals · non-goals · functional reqs · non-functional reqs · constraints) — recommendation grounded in stated intent. `file:line` citations only when an option references existing code; otherwise state "no codebase precedent" in the option description.
   - **`shape`** (architectural choice — which seam, which pattern, which integration point) — frame **dialectically**: name the tradeoff axis, not a winner. Each option's `description` MUST state what it optimizes for AND what it sacrifices, in the form "optimizes <X>, loses <Y>" (or "optimizes <X>, costs <Y>"). The lead option still carries `(Recommended)` with a one-line rationale, but the framing forces the developer to pick a side of an explicit tension rather than rubber-stamp a winner. Generate at least 2 candidate options before scoring — never present a single option masquerading as a choice. `file:line` citations required on every option that references existing code. Mirrors the `packages/rpiv-pi/skills/research/SKILL.md:103-142` checkpoint pattern. If no precedent exists, switch to ungrounded mode and label options as "convention A / convention B" with explicit "no codebase precedent" — the dialectic framing (X vs Y tradeoff) still applies.

     **Anti-rescoping**: if the probe finds something that could substitute for the requested build (e.g., feature already exists but isn't wired up), surface as an `intent` question with `file:line` — never silently redirect. Offer both "use what's there" and "build as asked".
   - **`detail`** (acceptance criteria · routine sub-decisions inside any branch) — batchable when 2-4 sibling leaves are independent.

2. **Recommended answer** (`scope` / `shape` / `detail`): derive from intent + Step 3 evidence + project conventions. Every non-intent question carries a recommendation labeled `(Recommended)`.

3. **Ask via `AskUserQuestion`.** Lead with the recommended option. Claude Code automatically adds an "Other" option that handles open-ended answers.

4. **Critical rules**:
   - Ask ONE question at a time. Wait for the answer before asking the next.
   - If a new evidence-based node surfaces mid-loop, batch-confirm it the way Step 4 does — never silently auto-record.

5. **Classify each response**:
   - **Decision** ("yes, that recommendation is right" / "use option B"): Record in Decisions. Resolve the node. Expand its children if any. Continue.
   - **Correction** ("no, the real intent is X" / "you missed Y"): Re-run targeted Step 3 grep on the new area; spawn at most **1 additional narrow agent per correction event** if the correction reveals a seam not yet probed. Adjust the affected subtree. Re-ask any descendants that depend on the corrected node.
   - **Scope adjustment** ("skip the UI part" / "include retries"): Update the tree — prune pruned branches, add new branches if needed. Record in Decisions. **Scope-creep**: every Decision must trace to a branch under the Step 2 request. Related-but-unrequested observations ("X is also broken") go to **Suggested Follow-ups** or trigger a one-shot expand-scope? question — never silently into Decisions.
   - **Cross-cutting answer** ("we also need audit / rate limiting / X" — affects multiple branches): Mark the new node as cross-cutting and **re-queue** it. When the walk reaches each affected parent (functional / non-functional / constraints), the cross-cutter fires under that parent's context. Same node, multiple parents resolved sequentially.
   - **Defer** ("not sure, leave for later"): Add to Open Questions. Resolve the node by deferral. Continue.

6. **Batching**: When 2-4 sibling `detail` leaves are independent (answers don't depend on each other), you MAY batch them in a single `AskUserQuestion` call. Keep dependent questions sequential. Do not batch `scope` or `shape` questions.

7. **Termination — depth check, not bucket-fill** (applies only when Step 5 actually runs; in session-saturated mode the loop never starts and these conditions are vacuously satisfied): stop the loop when:
   - (a) every uncovered branch has a Decision or a Deferral, AND
   - (b) the developer's own words appear in Problem/Goals (not paraphrased agent prose), AND
   - (c) no Decision is `Recommendation accepted` without at least one Rationale clause beyond `agreed`.

   Do not invent questions to pad the interview. Do NOT ask a final "looks good / want to adjust" rubber-stamp question — chain forward to research is automatic at Step 7.

**Total agent budget across the skill**: 0-4 dispatches per FRD, mode-dependent.
- Session-saturated mode: 0 (Step 3 skipped, Step 5 skipped).
- Gap mode with RA covered: 0 from Step 3, up to 2 from Step 5 corrections = 0-2.
- Gap mode with RA uncovered: 2 from Step 3 initial probe + up to 2 from Step 5 corrections = 2-4.
- Empty-session mode (fresh-feature): same as the RA-uncovered gap path = 2-4.

### Step 6: Synthesize FRD Body

Read `templates/frd.md` (relative to this skill folder) at runtime to confirm the section list and frontmatter shape — do not inline it from memory.

Compile output into the FRD. The source is **interview answers + session-context content** — for each FRD section, draw from whichever is authoritative:
- **`covered` row** → draw from the session. Quote the developer's own framing verbatim where possible; cite session `file:line` references where they were named.
- **`partial` row** → merge. Carry forward whatever the session already supplied, then append interview-loop answers (Step 5) that filled the gap. Session content first, interview additions after.
- **`no` row** → draw entirely from the interview-loop Q/A log (Step 5).
- **Empty-session mode** → every row was `no`, so every section comes from the interview. Equivalent to the original fresh-feature flow.

The interview's logical order (problem → goals → constraints → solution → details) is decoupled from the FRD's section order — redistribute answers into the template buckets here:

- **Summary** — 2-3 sentences capturing the settled feature concept.
- **Problem & Intent** — the developer's framing in their own words (from Step 2's answer, or from the session when Step 2 was skipped). Verbatim where possible.
- **Goals / Non-Goals** — explicit in/out lists from the interview.
- **Functional Requirements** — numbered, each independently testable.
- **Non-Functional Requirements** — perf, security, UX, accessibility, reliability constraints.
- **Constraints & Assumptions** — environmental, technical, schedule, organizational.
- **Acceptance Criteria** — observable pass conditions a reviewer can check. Each MUST name a concrete command, output, or visible behavior (e.g., "running `npm test` exits 0", "`/X` writes `path/to/Y`"). Reject vague phrasing like "feature works correctly" or "UX is acceptable".
- **Recommended Approach** — 1-2 sentences naming the architectural shape implied by the decisions (e.g., "new command in `packages/rpiv-pi/extensions/`, output to stdout, no persistence"). This text is what `research` passes to `scope-tracer` as the topic for breadth grounding.
- **Decisions** — full Q/A log per decision: `### [title]` + `**Question**:` (text as asked during the interview, or "Pre-resolved from codebase evidence — confirmed in Step 4", or "Settled in session prior to `/discover` — see conversation context (e.g., `/grill-me` exchange)") + `**Recommended**:` (or "n/a — `intent` question", or "n/a — session-derived") + `**Chosen**:` (developer's pick, evidence-derived answer, or the position the developer landed on in the prior session) + `**Rationale**:` (1 line — why, or `evidence: path/to/file.ext:line + confirmed` for codebase-derived, or a short quote/paraphrase pointing to the session reasoning for session-derived decisions). This block is the inheritance hook into research's Developer Context.
- **Open Questions** — only items the developer explicitly deferred.
- **Suggested Follow-ups** — related-but-out-of-scope items surfaced during the probe or interview that the developer did NOT add to scope (per the Step 5 scope-creep guardrail). One line per item: what was observed and where (`file:line` when applicable). Omit the section entirely if empty.
- **References** — input files, mentioned tickets, related artifacts.

### Step 7: Write Artifact, Present, Chain

1. **Determine metadata** (from the Metadata block above):
   - Filename: `.rpiv/artifacts/discover/<slug>_<topic>.md` — `<slug>` is the second tab-separated field on line 1 of the Metadata block above; `<topic>` is a kebab-case slug from the settled feature concept.
   - `repository:` ← `repo:` label; `branch:` / `commit:` ← matching labels.
   - `date:` / `last_updated:` ← `<iso>` (first tab-separated field on line 1 of the Metadata block above, offset verbatim).
   - Interviewer: `author:` from the Metadata block (fallback: `unknown`).

2. **Write the FRD** using the Write tool. Frontmatter `status: complete`. All template sections present and filled. The Write tool creates parent directories automatically — no `mkdir -p` needed in the skill.

3. **Present and chain**:
   ```
   Intent captured to:
   `.rpiv/artifacts/discover/<YYYY-MM-DD_HH-MM-SS>_<topic>.md`

   {N} requirements, {M} decisions, {K} open questions.
   Mode: <session-saturated | gap-mode | empty-session>.

   The FRD's Decisions block is translated into research's Developer Context and inherited by design.

   ---

   💬 Follow-up: discover writes a fresh FRD per call — re-invoke `/discover` to iterate (the prior FRD stays unchanged on disk).

   **Next step (manual chain):** `/research .rpiv/artifacts/discover/<YYYY-MM-DD_HH-MM-SS>_<topic>.md` — ground the intent in codebase reality.

   **Or kick off the rralph loop** (fire-and-forget, full pipeline research → design → plan → implement → validate → code-review → commit on a fresh branch):
   ```
   rralph                       # default engine = pi
   rralph --engine claude       # use Claude instead
   ```
   rralph picks up the newest FRD under `.rpiv/artifacts/discover/` automatically — no FRD path argument needed.

   > 🆕 Tip: for the manual chain, start a fresh session with `/new` first — chained skills work best with a clean context window. rralph spawns its own fresh sessions per step, so this tip does not apply to the rralph path.
   ```

### Step 8: Handle Follow-ups

- **Fresh artifact per call, no in-place append.** Discover deliberately writes a NEW timestamp-distinct FRD on every invocation — there is no `## Follow-up` append mode. The prior FRD stays unchanged on disk.
- **Iterate by re-invoking.** Three iteration paths:
  - `/discover [path-to-prior-FRD]` — refine a prior FRD via fresh interview (the prior FRD is read for context but does NOT saturate the coverage scan; see Step 1.5).
  - `/discover <free-text>` — fresh interview seeded by a new description.
  - `/discover` (no argument, in the same session) — re-run the coverage scan. New `/grill-me` turns since the prior `/discover` will be picked up and may flip rows from `partial` to `covered`. The natural iteration loop after grill-me corrections.
- **No rubber-stamp question.** NEVER ask a final "looks good / want to adjust" question — chain forward to research is automatic at Step 7.
- **Manual edits are allowed.** If the developer wants a one-off correction without re-running the full interview, they can Edit the FRD directly — the skill does not own follow-up surface area beyond fresh-artifact-per-call.

## Important Notes

These reinforce the critical rules from the steps above — listed here so they don't get lost in step-body detail.

- **Session-aware before interview-first**: Step 1.5 runs the coverage scan before anything else. Re-asking a question the session already settled (typical after `/grill-me`) is the explicit failure mode. Trust the coverage scan; do not loop on confirmed coverage. The `intent` question (Step 2) still precedes any agent dispatch — but only fires when intent is not yet covered.
- **Always one question at a time** (when questions ARE asked): Even with 2-4 batched independent `detail` leaves, that's still one `AskUserQuestion` call — wait for answers before asking the next round.
- **`intent` generates, `scope`/`shape`/`detail` reviews**: Intent is the developer's framing — they generate it. Scope, shape, and detail are proposals — they review them. The "developer reviews a proposal" model does not apply at the intent layer.
- **`file:line` is tier-conditional**: `intent` — never. `scope` — only when an option references existing code, otherwise label "no codebase precedent". `shape` — required on every option that references existing code; if no precedent exists, switch to ungrounded "convention A / convention B" mode. `detail` — same rule as `scope`.
- **Lazy tree, no full-tree pre-build**: Build only root + immediate children in Step 4. Expand each node's children only after the node resolves. Premature full-tree construction biases the dialogue.
- **Pre-resolutions confirm, never silently record**: Evidence-based nodes are batch-confirmed in Step 4 (or mid-loop if newly surfaced). The developer's confirm/correct is the actual Decision.
- **Cross-cutting answers re-queue, don't duplicate or drop**: When an answer affects multiple branches, mark the node cross-cutting and fire it under each affected parent during the walk.
- **Interview order ≠ FRD section order**: Walk the tree in dependency order (problem → goals → constraints → solution → details). Step 6 redistributes answers into FRD sections.
- **Light fan-out only**: Step 3 ≤2 agents (`codebase-locator` + optionally `codebase-analyzer`). Step 5 Corrections ≤1 additional agent per correction event. Breadth discovery (`scope-tracer`, broad sweeps, `integration-scanner`) belongs to `research` — chain forward instead of expanding scope here.
- **Never write or edit source files**: This skill produces an artifact only. Source-file changes are `implement`'s job, far downstream.
- **Fresh artifact every invocation**: Each `/discover` call writes a NEW timestamp-distinct file. To iterate on a prior FRD, re-invoke or manually Edit the prior file.
- **Critical ordering** — follow the numbered steps exactly:
  - ALWAYS read mentioned files before any agent dispatch (Step 1 → Step 1.5)
  - ALWAYS run the session coverage scan before any question or probe (Step 1.5)
  - ALWAYS skip Step 2 / 3 / 4 / 5 for sections the coverage map marks `covered`
  - ALWAYS ask the `intent` question before probing, when intent is NOT covered (Step 2 → Step 3)
  - ALWAYS shape the probe by stated intent, not the raw input text (Step 3)
  - ALWAYS batch-confirm pre-resolutions instead of silent auto-record (Step 4)
  - ALWAYS expand the tree lazily during the interview (Step 5)
  - ALWAYS re-queue cross-cutting answers under each affected parent (Step 5)
  - ALWAYS terminate on depth signal, not bucket-fill (Step 5)
  - ALWAYS synthesize from session content for `covered` sections and from the interview log for the rest (Step 6)
  - NEVER re-interview sections the session already settled (Step 1.5 gate)
  - NEVER write the FRD without either a covered intent or a Step 2 intent answer
  - NEVER ask a final "looks good / want to adjust" rubber-stamp question (anti-pattern per `a93e591`)
  - NEVER dispatch agents before Step 1.5 coverage scan completes, or — in gap mode — before Step 2's `intent` question is answered when intent is uncovered
