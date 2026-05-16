# Progress: <goal name>

Append-only log. One entry per **checkpoint attempt** (not per checkpoint — multiple attempts produce multiple entries with `Attempt: N`). Newest at the bottom.

<!--
Entry format (copy this when appending — do NOT leave this comment block in real entries):

---

## <YYYY-MM-DD HH:MM> — Checkpoint: <Cn name> — Attempt: <N>

**Did:** <what changed, 1-3 lines>
**Validation:** `<command run>` → <pass | fail | partial | not-run>
**Verified:** <what the run actually proved>
**Remains:** <what's left toward the stopping condition>
**Blocked?** <no | yes — reason and what unblocks it>
**Next:** <next checkpoint name or "stopping condition met">

---

Pause entry format (when the goal is paused):

---

## <YYYY-MM-DD HH:MM> — PAUSED

**Current checkpoint:** <Cn name>
**Last validation:** `<command>` → <pass | fail | not-run>
**In-flight changes:** <git status --short + diff --stat summary, 3-5 lines>
**Blocker:** <reason or "none, user-requested pause">
**Resume instructions:** <one line — what to verify, what to do next>

---

Verify entry format (written by work.md §7 after invoking the verifier; never written by the work agent alone):

---

## <YYYY-MM-DD HH:MM> — VERIFY

**Verdict:** <done | not-done | unclear>
**Verifier model:** <provider/model from .verify-last.json>
**Reasoning:** <2-4 sentences from .verify-last.json>
**Validation rerun:** `<command>` → exit <N>
**Evidence checked:** <bullets from .verify-last.json>
**Missing to be done:** <bullets — only when verdict is not-done or unclear>

---
-->
