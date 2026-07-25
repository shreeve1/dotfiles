---
id: 039
title: Publish one child-closing batch PR
status: review
blocked_by: [037, 038]
parent: null
priority: 0
created: 2026-07-22
---

## What to build

Publish the completed `gralph/<parent>` batch branch and open one GitHub pull request. Publication is allowed only after every open `ready-for-agent` child of the parent has landed and the final integration command passes against the complete batch. The PR body must include closing references only for children whose accepted commits are present on the batch branch.

The coordinator may push and call `gh`; workers and reviewers may not. Creating or updating the PR must never directly close a child or parent issue—GitHub closes referenced children only when the PR merges.

## Acceptance criteria

- [ ] Publication fails closed while any required child is failed, blocked, unreviewed, or not landed.
- [ ] The integration verification command runs once more on the final batch tip immediately before push.
- [ ] Only the coordinator pushes `gralph/<parent>` and creates or updates the single batch PR.
- [ ] The PR body contains exactly one `Closes #N` reference for each landed child and none for excluded, failed, or blocked issues.
- [ ] Re-running publication updates or returns the existing PR rather than creating a duplicate.
- [ ] No `gh issue close` or equivalent direct child/parent closure occurs.
- [ ] Tests use fake `gh` and a local bare remote to cover success, incomplete batches, failed final verification, exact closing references, push failure, and idempotency.

## Verification

`bash tests/gralph-pr.test.sh`

## Blocked by

- Blocked by #037
- Blocked by #038
