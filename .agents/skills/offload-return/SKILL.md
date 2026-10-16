---
name: offload-return
description: Use when the user requests returning completed or in-flight Offload work without moving HEAD or the index.
---

# Offload return

Read [the shared contract](../_shared/offload/contract.md). Return is user-triggered. The original receiving repo may be dirty. Only the frozen worker checkout must be clean. A recorded `complete` or `paused` Result is terminal. Continuing task work requires a fresh Offload, not reuse of this branch.

Use [the return control recipe](../_shared/offload/commands.md#return-control) for discovery, private records, handoff and pinned delivery. Its immutable source receipt supplies authority. Tracked Brief/Result files do not choose kill targets, receiving paths or policy.

## Select the return role

1. Discover the Offload by its actual checkout and absolute Git common directory, or by a supplied slug under known approved Mirror records. Reject ambiguous matches. Read the complete private dispatch record and check its original receipt digest, root, worker path, owner and modes. Source-side pull starts from the original source receipt and its recorded target control location.
2. If this invocation is inside the worker pane or cgroup, prepare the terminal Result and use the independent-controller handoff below. Never stop the worker scope from inside it.
3. A fresh authorized controller continues its own immutable intent and attempt. A later target retry creates a fresh attempt for the existing pin. A source-side pull uses the same target pin and original source authority locally. Neither needs the old chat, a live worker pane or a new Result.

Finish when the role, independent records, exact original receiver and requested task state are bound. A missing record or route is an explicit gap, not permission to reconstruct authority or choose another clone.

## Hand off from the worker

1. Stop launching task work. Finish or safely stop the current tool. Route this worker's journals and temporary summaries to its approved private metadata, not the checkout. For move-back, commit a normal checkpoint and record a separate `paused` Result with nonempty `next_steps`. For a completed-result request, require `complete`. If only a paused Result exists, obtain approval to return that checkpoint. Generic move-back needs no extra confirmation. Keep the checkout unchanged after terminal Result.
2. Run the recipe's `request` to persist the immutable user intent and allocate a unique attempt before creating or prompting a controller. Use its new no-focus herdr workspace outside the checkout, unique controller name of at most 32 characters and fresh session directory. Omit `--session` for the recorded unnamed default, or use the exact target-local named selector. The source's saved machine-profile ID is not a session selector.
3. Prepare the new pane's original shell PATH and start fresh pi. Verify actual controller shell, pi and control-command cgroups are outside the worker group and every descendant. Different pane IDs alone do not prove separation.
4. Submit only the trusted skill and intent pointer. Require durable attempt-local controller acceptance. On timeout, inspect that attempt before any resubmission. After acceptance, stop doing return work in the worker. The independent controller owns the remaining operation and may close this worker pane.

Finish when the recorded fresh controller accepted the exact intent and proved process separation. Do not wait in the worker for delivery or kill its own scope.

## Freeze and pin from the controller

Run the recipe's `freeze` from the independent controller. It publishes durable process-separated acceptance before stopping only the exact owned scope. It captures descendant writers and proves their exit before rereading the clean expected branch and separate terminal Result. Only then does it publish freeze proof, creation-only Result ref and pin. A pre-stop candidate SHA is not the final pin. Follow [freeze.md](../_shared/offload/freeze.md). After success, close only the recorded worker pane if it remains. Retain its Git worktree and branch.

The same command reconciles saved operation, proof, ref and pin under its fail-fast lock. Reuse an equal pin. Refuse a different ref or inconsistent proof. A crash or moved branch never authorizes selecting a new tip. An existing pin resumes delivery without restarting or stopping a replacement worker scope.

Finish when the durable post-freeze proof and exact Result/ref agree. Structural inspection on the target does not replace original-source policy validation or acceptance review.

## Validate and review before delivery

1. Use the independently verified reverse route to the original source, or the source's existing forward route for local pull. Reverify host/user, absolute repo/common directory, full root, original receipt digest, canonical helper and retained source policy/allowance authority. Never copy keys, disable hooks or substitute the target's policy.
2. If the receiver is proven unreachable, retain the pin with `pending` and an offline reason. Defer authoritative scan and returned-diff review. Missing route, rejected authentication, host-key mismatch, wrong identity and missing source authority are distinct access gaps or refusals. SSH exit 255 alone does not prove offline.
3. Establish quiescence of receiving writers on affected paths across scan, review and apply. Connectivity, an old source-session exit or a Git lock alone does not establish it. If no current evidence exists, retain pending delivery with a receiver-busy reason and require a source-side pull after the user pauses those writers. Do not kill unrelated receiving editors or agents.
4. Fetch the retained target Result ref into a collision-free source ref. Require the fetched SHA to equal the immutable pin. Run canonical `validate` on the original receiver with its original receipt before inspecting the returned diff. This scans under original source authority.
5. After authoritative validation succeeds, inspect that same immutable Result and review every Brief acceptance criterion, actual verification claim and limitation. Account for paused `next_steps` as remaining work. A well-formed Result alone is not correctness. The independent target controller can perform this review after the receiver's scan, without a source chat.

Finish when original-source validation and semantic acceptance review pass for the exact pin and receiving writers remain quiescent. Offline or access-gap outcomes stop this finite attempt without pretending this gate passed.

## Apply and acknowledge

On the original receiver, run canonical `apply` with its original receipt and the exact reviewed SHA. It revalidates and performs the complete Snapshot-relative binary/full-index patch. Preserve receiving HEAD, actual index and unrelated dirty work. Do not merge, reset, autostash or use partial, indexed or three-way fallback.

Report `applied` or `already_applied` only from the helper's observed response. A conflict leaves the whole patch unapplied. Save the bound ACK payload on the receiver with the actual helper response, unchanged HEAD/index evidence and actual writer-quiescence evidence. Publish that payload into the attempt outcome. Its source path is a locator, not proof. If the connection ends after apply may have run, retain pending acknowledgement. A later explicit retry or pull uses the same pin and current guarded checks. An old success record never overrides later receiving edits.

Run Brief verification only when authorized. Do not commit or start a receiving agent unless requested. End this controller turn after one observed outcome. No daemon, polling, automatic retry, deployment or task restart is part of return.

Report source, branch, Snapshot, work tip, exact Result/ref, task state and delivery outcome separately. Include applied or conflicting filenames, pending/refusal reason, checks exercised or deferred, and paused remaining steps. Retain refs, worktrees, private records and recovery proof until user-requested cleanup. A fresh source pull must remain possible after both original panes and chats disappear.
