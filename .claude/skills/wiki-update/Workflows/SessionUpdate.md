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
- Project `AGENTS.md` if present

If the core files are missing, stop and recommend `/llm-wiki-setup`. Do not create an ad hoc wiki from this workflow.

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
6. When the session contradicts existing claims, keep both claims and add notes such as `contradicts C-XXXX` or `supersedes C-XXXX`; do not delete the older claim.
7. Create a candidate analysis page when a contradiction is important enough to explain.

## 7. Apply Wiki Updates

When updating the wiki:

1. Add the raw session capture under `wiki/raw/sessions/` if conversation evidence is used.
2. Create or update candidate pages in `wiki/candidates/` unless a promoted update is clearly safe.
3. Update `wiki/CLAIMS.md` for important atomic claims. Assign claim IDs by scanning existing `C-####` IDs and using the next available zero-padded integer.
4. Update `wiki/index.md`: promoted-page sections for promoted pages only, candidate review queue for candidates.
5. Update `wiki/ROUTING.md` when the new content provides a durable route. Mark candidate routes as candidate/non-authoritative.
6. Append a `session-update` entry to `wiki/log.md` with inputs, outputs, and unresolved questions.

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
- Open questions or suggested next ingest/promote action.
