---
title: Jev as a verify-final Checker - Test Results
summary: Jev tested 2026-10-29/30 to replace or gate verify-final's GLM checks; too inaccurate so far. Tuning run and ledger in ~/jev-tune.
type: doc
status: promoted
created: 2026-10-30
updated: 2026-10-30
topics: []
---

## Active memory

- Why Jev was tried: James's cost concern is the GLM Coding Plan, not speed or dollars. verify-final's checks on `glm-5.3-flash` use the plan he keeps GLM 5.3 on as his fallback. He wants Jev made usable over time by tuning, not switched on blind. durable-bot is out of scope for this work.
- Jev (TypeSafe) only returns yes/no, choice or score answers, cannot read files and cannot write a correction, so code must pick the evidence and the main agent writes the fix.
- Replay 1, 2026-10-29 (57 past cases, a ~7k-token session excerpt per answer, three questions per sentence): caught 9 of 35 matched GLM-found false claims and flagged 13 of 20 clean answers. For 12 of the 35, the file that disproved the claim was never read in the session.
- Replay 2, 2026-10-29 (a pi-warden-style "did you actually check" step for commit, push, test and restart claims, 150 random turns since 2026-10-12): Jev flagged 44%, 35 of those with the matching command in the turn. Judging one claim against only the matching command lines, it agreed on 49 of 65 backed claims. Real unbacked run-time claims were rare.
- Tuning run, 2026-10-30 (autoagent skill, self-driven, in `~/jev-tune`, its own git repo; ledger `results.tsv`, design `program.md`): Jev as a gate that clears low-risk answers so they skip GLM, labelled by GLM's past verdicts, sessions since 2026-10-14, a third of sessions held out. At the threshold keeping 90% of GLM's catches on train: baseline cleared 4 of 59 clean answers; after 8 iterations it cleared 9 of 59 on train and 4 of 32 on holdout (37 of 38 catches kept), then plateaued.
- Kept changes: the claim question limited to file-checkable claims (the GLM prompt's scope), and answer risk combined across claims as a noisy-or. Discarded (6): claim risk as contradicted minus supported, extra risk for unaddressed claims, verdict wording, weighting by claim probability, a higher claim threshold, stricter evidence matching.
- Main failure: Jev rates true claims "contradicted" when the excerpt code picked is related but not about the exact point (for example, a `find` output for "Desktop is empty").
- The 90% catch-keep share is a provisional call; James has not set the accuracy bar.
- `~/jev-tune/data/` holds redacted session excerpts and cached Jev answers; delete it when the work ends.

## Related

- [verify-final Logs and How to Measure It](memory/docs/verify-final-logs.md) - the checker model, the GLM plan and the log statuses these tests used as labels.
