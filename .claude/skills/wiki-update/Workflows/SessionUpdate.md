# Session Update Workflow

Use this workflow to update an existing LLM Wiki from the current session.

## 1. Notify

Send a short progress note: `Running the SessionUpdate workflow in wiki-update to capture durable session knowledge.`

## 2. Confirm Wiki Exists

Read the project wiki contract before writing:

- `wiki/README.md`
- `wiki/index.md`
- `wiki/ROUTING.md`
- `wiki/CLAIMS.md`
- `wiki/log.md`
- Project `CLAUDE.md` if present
- Project `AGENTS.md` if present

If the core files are missing, stop and recommend `/llm-wiki-setup`. Do not create an ad hoc wiki from this workflow.

Normalize the claim schema up front, before any claim write:

```text
python3 .claude/skills/wiki-update/gate.py --wiki wiki migrate
```

This widens a legacy 7-column `CLAIMS.md` (and `CLAIMS-cold.md` if present) to the canonical 12-column schema. It is idempotent — an already-canonical file is left byte-identical (no rewrite). Run it every time: `serialize` only upgrades the schema when a write actually lands, so a session that stores no claim (or one blocked at the gate) would otherwise leave the file 7-column. Migrating up front makes the schema upgrade deterministic instead of incidental.

## 3. Determine Capture Scope

Use James's prompt as the primary focus when provided.

If no focus is provided, extract only information that is likely to help future sessions:

- Decisions James accepted or requested.
- Project conventions or operating rules discovered during the session.
- Architecture, workflow, skill, agent, or configuration behavior that was verified.
- Root causes, fixes, and verification evidence from debugging.
- Important source paths, docs, commands, or artifacts created.
- Open questions, risks, and follow-up tasks that should survive the session.

Do not capture:

- Routine progress chatter.
- Speculation that was not verified or accepted.
- Failed attempts unless they explain a root cause or important constraint.
- Secrets, credentials, tokens, private personal information, or raw pasted user content without explicit approval.
- The full transcript unless James explicitly asks for transcript archival.

## 4. Gather Evidence

Prefer evidence in this order:

1. Existing project files, docs, code, diffs, tests, issues, or command outputs.
2. Existing `wiki/raw/` sources.
3. The current conversation, captured as a curated raw session note.

When the current conversation is the source, create `wiki/raw/sessions/` if missing, then create a new raw session capture before updating generated wiki pages:

```text
wiki/raw/sessions/YYYY-MM-DD-<short-slug>.md
```

Never overwrite an existing raw session capture. If the target path exists, append `-2`, `-3`, etc. before `.md` until the path is unused.

Use this template:

```markdown
# Session Capture: <title>

- Date: YYYY-MM-DD
- Purpose: <why this session mattered>
- Scope: <what was intentionally captured>

## Durable Facts

- <fact> — Evidence: `<path-or-command>`

## Decisions

- <decision James accepted or requested> — Evidence: `<path-or-session-note>`

## Evidence

- `<path>` — <what it supports>

## Exclusions

- <sensitive, private, unverified, or irrelevant material intentionally not captured>

## Open Questions And Follow-Ups

- <question or follow-up>
```

The raw session capture must include:

- Date and session purpose.
- Short summary of durable facts and decisions.
- Evidence paths or command names when available.
- Explicit exclusions for sensitive or unverified material.
- Open questions and follow-ups.

After creating the raw session capture, treat it as immutable source material. Do not rewrite it during the same update unless correcting an immediate write mistake before relying on it.

## 5. Decide Update Type

Use the smallest safe update:

- Existing promoted page update: only for clear, low-risk, cited maintenance.
- Candidate concept page: when a reusable concept, term, or workflow should be reviewed.
- Candidate analysis page: when the session produced a synthesis, debugging outcome, implementation rationale, or multi-claim summary.
- Claims-only update: when the session produced important atomic facts but no page is warranted yet.
- Suggest-only report: when evidence is insufficient or approval is needed before storing the content.

Candidate filenames use lowercase slugs:

- `wiki/candidates/concept-<slug>.md`
- `wiki/candidates/analysis-session-<slug>.md`

Candidate pages must include frontmatter compatible with `llm-wiki-setup` templates: title, type, status, created, updated, sources, confidence, and tags.

## 6. Reconcile Existing Knowledge

Before writing new generated wiki content, check existing wiki state:

1. Read `wiki/index.md` candidate queue and promoted-page sections for overlapping topics.
2. Read relevant promoted pages, existing candidates, and `wiki/ROUTING.md` routes for duplicates.
3. Scan `wiki/CLAIMS.md` for existing `C-####` claims that match, overlap, contradict, or supersede proposed claims.
4. Prefer updating an existing candidate over creating a duplicate candidate when the topic is the same.
5. Prefer a low-risk promoted-page maintenance edit only when the new evidence is clear, cited, and non-controversial.
6. When the session contradicts existing claims, distinguish two cases. Genuine unresolved contradiction (both may hold): keep both, note `contradicts C-XXXX`. Clear replacement (the new fact makes the old false): use the `supersedes` field in the §7a gate, which marks the old claim `superseded` with a timestamp rather than letting both coexist. Never delete the older claim.
7. Create a candidate analysis page when a contradiction is important enough to explain.
8. Outdated-source check: for overlapping existing pages and claims, verify their cited sources still support them given the session evidence. When the session shows a cited source is outdated, edited, superseded, or contradicted, flag it for supersession per the provenance rule — keep the old claim, mark it `superseded` (or `active` with a drift note) and propose a replacement claim or candidate page. Never silently rewrite. Reuse the Content Drift Check definition from `llm-wiki-setup` `Workflows/Lint.md`.

## 7. Apply Wiki Updates

When updating the wiki:

1. Add the raw session capture under `wiki/raw/sessions/` if conversation evidence is used.
2. Create or update candidate pages in `wiki/candidates/` unless a promoted update is clearly safe.
3. Update `wiki/CLAIMS.md` **only through the claim write gates in §7a**. Do not hand-edit claim rows; do not assign IDs by hand.
4. Update `wiki/index.md`: promoted-page sections for promoted pages only, candidate review queue for candidates.
5. Update `wiki/ROUTING.md` when the new content provides a durable route. Mark candidate routes as candidate/non-authoritative.
6. Append a `session-update` entry to `wiki/log.md` with inputs, outputs, and unresolved questions.

## 7a. Claim Write Gates (mandatory, per claim)

`gate.py` (in this skill's directory) is the only sanctioned path into `CLAIMS.md`. Prose discipline gets skipped under pressure; the gate exits non-zero instead. For each atomic claim you want to store:

1. Build the candidate as JSON with the typed-slot schema:

   ```json
   {"kind": "gotcha|decision|config-fact|runbook-step",
    "claim": "<atomic claim>", "source": "<path or command>",
    "page": "<wiki page, optional>", "confidence": "high|medium|low",
    "impact": "<what failure knowing this would have prevented, or the speedup it gives>",
    "supersedes": "C-XXXX (optional)", "notes": "(optional)"}
   ```

2. Run the gate:

   ```text
   python3 .claude/skills/wiki-update/gate.py --wiki wiki check <candidate.json>
   ```

3. Obey the verdict. You may not write past it:
   - `ADMIT` — re-run with `--apply` to write the row (it assigns the ID, timestamps, hits). If the admitted claim is high-confidence and load-bearing (a fact whose loss in a later consolidation would hurt), add a regression case to `wiki/eval/` so consolidation is forced to keep it: append `<a query that should surface it> ||| <a token from the claim that must stay in CLAIMS.md>` to a `*.eval` file. This is what makes the consolidation gate (§7b) actually protect the claim; an empty eval slice makes that gate refuse to run.
   - `REJECT` (gate `validate`) — fix the typed slot: kind must be one of the four; claim/source/impact required.
   - `REJECT` (gate `admit`) — the claim has not earned its place. The `impact` must state counterfactual value (a failure it would have prevented, or a materially faster success). Boilerplate ("good to know", restating the claim) is rejected. If you cannot articulate the impact, do not store the claim.
   - `MERGE` — a near-duplicate exists. Refine that existing claim and bump its `Hits`; never add a slight variant.
   - `SUPERSEDE` — the new fact conflicts with an existing one. Mark the old claim `superseded` with today's date, add the new one with `Created` today and a `supersedes` note. Do not let both coexist.
   - `EVICT_FIRST` — the hot file is at budget. If the wiki is genuinely large and curated (the active claims are all load-bearing, not cruft), the budget is the wrong size, not the claim. Record the real scale **once** with `python3 .claude/skills/wiki-update/gate.py --wiki wiki set-budget 300` — it persists to `.gate-state.json`, so every later `check`/`audit` honors it without re-supplying anything (a one-shot `WIKI_CLAIM_BUDGET=300` env var still overrides per-invocation if you prefer). Default is 40. Only when the hot file is genuinely over-full of low-value claims, run the named `gate.py demote --force <ID>` to move the lowest-value claim to cold and re-run the add. Eviction is a precondition of the write, not later cleanup.

The admission filter is meant to reject most candidates. Storing nothing is the common correct outcome.

## 7b. Scheduled Gates (run when maintenance is due)

`gate.py audit` reports `maintenance_due: true` after `MAINT_EVERY` writes (default 20). When due, or on a periodic cadence:

- **Hot/cold split:** `python3 .claude/skills/wiki-update/gate.py --wiki wiki demote` — moves low-hit, stale active claims to `CLAIMS-cold.md` (demotion, not deletion; eval-referenced claims are protected from auto-demotion).
- **Gated consolidation:** write a plan JSON (`{"merge": [[keep_id,[drop_ids],"merged text?"]], "prune": [ids], "resolve": [[loser_id, winner_id]]}`), then:

  ```text
  python3 .claude/skills/wiki-update/gate.py --wiki wiki consolidate <plan.json>
  ```

  It snapshots `CLAIMS.md`, applies the plan, runs the eval slice, and **keeps the result only if the eval pass rate held AND total active size dropped** — otherwise it reverts automatically. An ungated rewrite is how a wiki quietly loses the detail that mattered, so this gate is mandatory. Consolidation requires a non-empty `wiki/eval/*.eval` slice (`<query> ||| <token that must stay retrievable>`); with no eval, you cannot verify a rewrite kept what mattered, so do not consolidate.

  Tradeoff (deferred): this runs as a local snapshot+eval+revert, not a Temporal propose→eval→commit workflow. git/file-copy already gives atomic snapshot and revert on a single host; Temporal would only earn its keep if consolidation needed cross-crash durability or multi-host coordination, which a markdown maintenance pass does not. Revisit if the wiki moves off-host.

## 8. Approval Gates

Ask before writing when the session update would:

- Store sensitive, private, or personal material.
- Archive raw pasted user content.
- Change a promoted page in a way that could alter established project knowledge.
- Create more than three candidate pages in one update.
- Depend primarily on unverified conversation memory.

If approval is needed, present a concise preview of proposed captured facts, candidate pages, and claim updates.

## 9. Verification

Verify exact probes before reporting completion:

- `python3 .claude/skills/wiki-update/gate.py --wiki wiki audit` exits 0 (no budget or schema violation). This catches any claim that reached `CLAIMS.md` without passing the write gate. If it reports `maintenance_due`, run §7b before reporting done.
- Core wiki files still exist.
- Raw session capture exists when conversation evidence was used.
- Raw session capture path did not overwrite an existing file.
- Candidate pages include frontmatter, sources, confidence, and citations.
- `CLAIMS.md` entries cite exact source paths and use non-conflicting IDs.
- Duplicate candidates and claims were checked before writing.
- Contradictions or supersessions are marked in `CLAIMS.md` notes when present.
- `index.md` lists candidates only in the candidate review queue.
- `ROUTING.md` marks candidate routes as non-authoritative.
- `log.md` contains a `session-update` entry.
- Diff review confirms no secrets, credentials, tokens, private personal information, or unapproved raw pasted user content were written. Search changed wiki files for obvious secret-shaped strings such as `api_key`, `token`, `secret`, `password`, `BEGIN PRIVATE KEY`, and `AWS_SECRET_ACCESS_KEY` before claiming this.

## 10. Report

Report:

- What durable knowledge was captured.
- Files changed.
- Candidate pages awaiting review.
- Claims added or updated.
- Outdated or superseded sources flagged by the outdated-source check, with proposed action.
- Open questions or suggested next ingest/promote action.
