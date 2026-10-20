# Session Capture: Fabric Prewalk and supervisor probes

- Date: 2026-10-18 local (events extend into 2026-10-19 UTC).
- Purpose: synthetic live tests of trajectory handoff and verifier replacement, on Pi 1.2.0/Fabric 0.117.1.

## Durable Facts

- Trajectory Prewalk handed work to cliproxy/minimax-m3; every sampled Main state and Main assistant message remained cliproxy/claude-sonnet-5-5. Main re-ran node tests: 3 pass in the successful case, 3 pass/1 deliberately contradictory failure in the second. An unavailable executor failed without switching Main. Evidence: /tmp/fabric-prewalk-test.qFYZob/results.json and runs/case{1,2,3}/messages.json. requirePlan=false; hard executor crashes/timeouts, normal plan enforcement, actual proxy backend and prices were not tested.
- Standard reasoning supervisor: agent_settled/tool_error, read-only tools, steer, triggerTurn=true. In two long-lived RPC cases it independently read files, caught an omission and a file-count mismatch, sent one corrective message per case, then stopped. A stop acknowledgement caused an extra Main turn; no further loop observed for 35 seconds. Main and supervisor both used Sonnet. Evidence: /tmp/fabric-supervisor-test.tV299z/results.json and case{1-omission,2-falseclaim}/{messages.json,events.jsonl,mesh/actors/actors.json}.
- A single standalone pi -p case exited with beta.txt and FACT.txt missing. The same omission remained 60 seconds later, with no actor session/run artifact. An idle created actor record did not establish verification. Evidence: /tmp/fabric-supervisor-test.tV299z/case3-print/{results.json,print-stdout.log,mesh/actors/actors.json}. This is non-parity for this setup, not a general failure-rate estimate.
- Existing verify-final has a dedicated agent_before_settle path in non-TUI modes: .pi/agent/extensions/verify-final.ts. An asynchronous settlement actor alone is not equivalent.

## Decisions

No rollout/replacement decision. Keep current verifier and production settings unchanged pending discussion.

## Evidence and limitations

- verify-final was omitted only in isolated test processes. Fresh read-only cross-check confirmed the supervisor findings from artifacts. Versions checked separately against pi --version and installed package metadata.
- Actual fixture: alpha.txt=alpha-ok, beta.txt=beta-ok, FACT.txt=8; data.csv has header plus seven rows. Original controller incorrectly expected seven. Corrected analysis used actual files; Main fixed the controller to compute the line count without rerunning inference. Raw results retain original faulty verdict and correctedVerdict.
- Single cooperative synthetic sample per case, same supervisor/Main family. About 20 Prewalk and 43 supervisor experiment requests; no cost-saving claim.
- Initial no-inference supervisor smoke run inherited the production mesh root before isolation was fixed. It created no actor there; a transient participant heartbeat cannot be ruled out. Subsequent cases used scratch mesh roots.
- Temporary evidence: /tmp/fabric-prewalk-test.qFYZob/REPORT.md and /tmp/fabric-supervisor-test.tV299z/REPORT.md. This curated source preserves the bounded finding if scratch files expire.

## Exclusions

No credentials, provider config, or raw user transcript copied. No production feature enabled or verifier removed.

## Open Questions And Follow-Ups

Trial plan-required trajectory mode before automatic adoption. Verifier replacement needs demonstrated before-exit headless behavior, controlled correction loops, and a decision about cleanup gates.
