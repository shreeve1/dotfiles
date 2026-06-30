# State YAML — `build_audits` schema

External reference — the on-disk schema for the `build_audits:` block that
`/dev-build`'s wave audits append to `plans/.<feature>.state.yml`. Loaded when
Phase 7.5 writes audit state. The decision of *when* to create the stub, the
`build_only` sentinel, and the append-don't-overwrite rule for `rounds:` live
inline in `SKILL.md` (Phase 7.5 "State-file location"); this file owns only the
schema.

`/dev-build`'s wave audits append to `plans/.<feature>.state.yml` under a
`build_audits:` key (one entry per audited wave). This is additive to
`/dev-plan`'s loop state — if a `rounds:` block exists from `/dev-plan --loop`,
leave it untouched and add `build_audits:` alongside. If no state file exists,
create the stub described in Phase 7.5 "State-file location" first. Findings are
stored **verbatim** so the trail can be reconstructed later.

```yaml
build_audits:            # one entry per audited wave
  - wave: 1
    reviewer: pi         # always pi
    reviewer_model: null # set when --reviewer-model given
    started: "2026-06-03T16:00:00Z"
    files_audited: ["src/foo.py", "tests/test_foo.py"]
    outcome: passed      # passed | auto_fixed | escalated_to_user | overridden | audit_skipped
    skip_reason: null    # when outcome=audit_skipped: reviewer_unavailable | doc_only | zero_diff | reviewer_timeout | reviewer_failed | malformed_output
    error_excerpt: null  # when skip_reason in {reviewer_failed, malformed_output, reviewer_timeout}: last ~50 lines of reviewer output

    attempts:            # one entry per audit attempt — initial always present; second appears only when auto-fix-and-retry-and-re-audit fired
      - attempt: 1       # 1 = initial audit; 2 = post-fix re-audit
        kind: initial
        started: "2026-06-03T16:00:00Z"
        findings:
          critical: ["[CRITICAL] <verbatim with Affected files line>"]
          warning: ["[WARNING] <verbatim>"]
          note: ["[NOTE] <verbatim>"]
        counts: { critical: 1, warning: 1, note: 0 }
        # present on the initial attempt only when outcome=auto_fixed:
        fix_summary: null
        files_edited: []          # union of Affected files across all Critical findings, edited in 7.5.5 step 2
        validation_command: null  # what was run in 7.5.5 step 3
        validation_passed: null   # bool
      - attempt: 2       # only when outcome=auto_fixed; reports the post-fix re-audit
        kind: post_fix_reaudit
        started: "2026-06-03T16:02:00Z"
        findings: { critical: [], warning: [], note: ["[NOTE] No findings — diff looks correct."] }
        counts: { critical: 0, warning: 0, note: 1 }
```

The findings sections must hold **verbatim reviewer output** so an AI reviewing
this state YAML later can reconstruct the audit trail without a separate audit
markdown.
