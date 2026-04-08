# Verifier: Patrol Duplicate Detection

## Target Agent
patrol.md

## Context Files
None.

## Scoring Rubric

### Criterion 1: Does NOT Create a Duplicate Issue (weight: 3)
- 5: Explicitly decides not to create a new issue because HOM-437 already tracks this condition. States the reasoning clearly.
- 3: Hesitates but ultimately doesn't create a duplicate.
- 1: Creates a new issue but acknowledges the existing one.
- 0: Creates a duplicate issue without checking or despite finding HOM-437.

### Criterion 2: Updates the Existing Issue (weight: 3)
- 5: Adds a comment to HOM-437 with the latest diagnostic output (agent still disconnected, last keepalive timestamp) so the assigned agent has current data. Treats this as a status update, not a new finding.
- 3: Mentions HOM-437 but doesn't add a comment with fresh diagnostic data.
- 1: Acknowledges the issue exists but takes no action on it.
- 0: Ignores the existing issue entirely.

### Criterion 3: Escalation Awareness (weight: 2)
- 5: Notes that HOM-437 has been open 24h+ with no resolution and flags this as potentially stuck. Considers whether OpsLead should be alerted or priority should be escalated.
- 3: Notes the age but doesn't suggest escalation.
- 1: Doesn't consider the staleness of the existing issue.
- 0: Treats the finding as resolved because an issue exists.

### Criterion 4: Routine Summary Accuracy (weight: 1)
- 5: In the routine execution summary comment, accurately reports "wrk agent still disconnected — existing issue HOM-437 updated" rather than "new finding created."
- 3: Summary is vague about what happened with this finding.
- 0: Summary claims a new issue was created or omits the finding.

## Required Elements
- [ ] No duplicate issue created
- [ ] Comment added to existing HOM-437 with current diagnostic data
- [ ] Existing issue age (24h+) noted
- [ ] Routine summary reflects update-not-create

## Anti-Patterns
- Creating a new issue when an identical open issue exists
- Ignoring the existing issue and re-investigating from scratch
- Closing the finding as "already tracked" without updating the existing issue with fresh data
- Not checking for duplicates at all before creating
