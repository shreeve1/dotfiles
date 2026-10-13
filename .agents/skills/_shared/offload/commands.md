# Offload commands

Resolve `GUARD` to this installed skill directory's absolute `git_guard.py` path and `RETURN_STATE` to its `return_state.py`. The project need not contain these skills. Keep private files in a durable mode-0700 directory outside working-tree inputs, preferably `<absolute-git-common-dir>/offload-receipts/<slug>/`. Resolve the directory with `git rev-parse --path-format=absolute --git-common-dir`. Capture subprocess output privately with `umask 077`.

## Snapshot request

Write this shape with observed values. The slug uses `YYYYMMDD` and three short lowercase words. The source and target paths are absolute. The Mirror root is the full source root SHA and its URL is freshly verified.

```json
{
  "slug": "20261011-fix-small-task",
  "brief_path": ".offload/20261011-fix-small-task/brief.md",
  "source": {"host": "SOURCE_HOST", "path": "/absolute/source/repo"},
  "target": {"host": "TARGET_HOST", "path": "/absolute/target/project"},
  "mirror": {"url": "TARGET_HOST:/absolute/mirror", "path": "/absolute/mirror", "root": "FULL_ROOT_SHA"}
}
```

The prose file has nonempty `## Goal`, `## State`, `## Decisions`, `## Non-goals`, `## Next steps`, `## Dependencies`, `## Access gaps`, `## Verification` and `## Finish` sections. Use `None` explicitly for an empty decision or gap list. Mark a cold goal `unrefined` in State. Separate project readiness from pending worker provisioning. Finish gives the actual helper/private metadata paths and Result command below, including `--allowlist` when reviewed exceptions were used.

```sh
python3 "$GUARD" snapshot --repo "$SOURCE" --request "$REQUEST" --brief-prose "$PROSE"
```

Save the successful receipt durably as `RECEIPT`. It holds independent Snapshot and Brief identities. Keep the source-local policy and allowance objects it names. Do not reconstruct authority from returned files.

Bind these variables from the independent receipt before push or startup. Reject missing fields.

| Variable | Receipt field |
| --- | --- |
| `SLUG` | `identity.slug` |
| `BRANCH` | `identity.branch` |
| `ROOT` | `identity.root` |
| `SNAPSHOT` | `identity.snapshot` |
| `BRIEF_PATH` | `identity.brief_path` |
| `BRIEF_COMMIT` | `brief_commit` |
| `MIRROR` | `mirror.path` |
| `MIRROR_URL` | `mirror.url` |

`brief_commit` is top-level. The other task identities are under `identity`.

After the user approves the reported filenames and historical exposure, push only the new branch. A blank expected ref in the lease means it must not already exist.

```sh
git -C "$SOURCE" push --no-verify --force-with-lease="refs/heads/$BRANCH:" \
  "$MIRROR_URL" "refs/heads/$BRANCH:refs/heads/$BRANCH"
git ls-remote "$MIRROR_URL" "refs/heads/$BRANCH"
```

Require the full remote SHA to equal the receipt's Brief transport commit. This creation-only lease does not authorize overwriting an existing Offload.

## Ordered startup

Run these stages from the source after the approved, scanned Snapshot and Brief push passes its exact creation-only lease and full remote-SHA comparison. Resolve `HOST` and saved herdr `MACHINE_ID` from the verified profile. Use the receipt bindings above. Use fresh capture paths in the durable mode-0700 `STATE` directory for each attempt, with `umask 077`. Keep command output private. Stop on a failed command or stage gate.

Use the installer's recorded canonical skill/helper paths and hashes for the current installed version. Verify installation once if that record is absent or the installed version changes. Newly added skills need a fresh omp catalog. The worker reads its task-required skills and Brief normally, without a per-worker URI-discovery ritual. Installation evidence does not replace fresh mutable checkout, hook, identity, configuration or runtime checks.

### 1. Create the actual checkout

```sh
umask 077
herdr --machine "$MACHINE_ID" worktree create --cwd "$MIRROR" \
  --branch "$BRANCH" --label "offload:$SLUG" --no-focus > "$CREATE_JSON"
WORKTREE=$(python3 -c 'import json,sys; r=json.load(open(sys.argv[1]))["result"]; print(r.get("worktree",{}).get("path") or r["root_pane"]["cwd"])' "$CREATE_JSON")
PANE=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["result"]["root_pane"]["pane_id"])' "$CREATE_JSON")
WORKSPACE=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["result"]["workspace"]["workspace_id"])' "$CREATE_JSON")
AGENT="offload-$SLUG"
UNIT="$AGENT.scope"
```

Gate. Creation succeeded. The returned absolute worktree path, pane and workspace are nonempty and belong to this attempt. If both `result.worktree.path` and `result.root_pane.cwd` are present, they agree. There is no worktree-ID field. Preserve the actual path and workspace/pane IDs beside the source receipt. On timeout, inspect the existing creation before retrying.

### 2. Inventory and provision this checkout

Run [the batched worker inventory](inventory.md#batch-each-stage) with `CHECKOUT="$WORKTREE"`. Require the exact branch, `HEAD="$BRIEF_COMMIT"` and single full root `ROOT`. Project readiness is not worker readiness.

Apply only the Brief's approved provisioning plan to this checkout. Use [ignored-copy.md](ignored-copy.md) for each approved ignored `.mcp.json` or `.env` transfer. Record the recipe's post-transfer verification in the worker inventory. If provisioning changes hook, identity or runtime facts, refresh those changed facts together in one target call before advancing. A new gap outside the plan stops dispatch. Retain this attempt's records and resolve the gap in a new source Brief, not by changing the transported Brief.

Use the fresh absolute `TARGET_META` and `WORKER_RECEIPT`, `WORKER_ALLOWLIST` when used, and `WORKER_INVENTORY` paths named by Finish. The directory is beneath the approved private metadata parent, outside the checkout. Require source metadata files to be mode 0600 before copying. Create only this attempt's new directory.

```sh
META_CREATE=$(python3 -c 'import shlex,sys; print(shlex.join(["mkdir","-m","0700","--",sys.argv[1]]))' "$TARGET_META")
ssh -T -- "$HOST" "$META_CREATE" &&
scp -p -- "$RECEIPT" "$HOST:$WORKER_RECEIPT" &&
scp -p -- "$INVENTORY" "$HOST:$WORKER_INVENTORY"
```

After those commands succeed, if the Snapshot used reviewed allowances, transfer the original reviewed JSON separately.

```sh
scp -p -- "$ALLOWLIST" "$HOST:$WORKER_ALLOWLIST"
```

Gate. Actual-checkout dependencies and approved config have observed status. Private metadata is present outside the checkout with directory mode 0700 and file mode 0600. Finish names these actual target paths and includes `--allowlist` when used. Source-local authority blobs need not exist in this clone. For `policy_N` allowances, the effective target pre-commit bytes must hash to the receipt's exact `policy_blob`. Provision that same trusted hook under the approved plan or stop for review. A different policy cannot reuse positional allowances.

### 3. Enroll and prepare the original shell

```sh
herdr --machine "$MACHINE_ID" pane process-info --pane "$PANE" > "$PROCESS_BEFORE_JSON"
INITIAL_PID=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["result"]["process_info"]["shell_pid"])' "$PROCESS_BEFORE_JSON")
```

Read `result.process_info.foreground_process_group_id` and `foreground_processes` to require the available original shell at its prompt. Record only PID/name metadata in reports. Do not print argv or environment values. Run [the canonical enrollment block](freeze.md#contain-the-initial-shell). It combines scope properties and original-shell membership in one target call before startup. Preserve unit, initial PID, InvocationID and ControlGroup beside the receipt.

Bind `OMP_DIR` to the observed intended omp directory from the installed-version record. Set `CACHE_RESET` to `rehash` for zsh or `hash -r` for bash.

```sh
PATH_COMMAND=$(python3 -c 'import shlex,sys; print("export PATH="+shlex.quote(sys.argv[1])+":\"$PATH\"; "+sys.argv[2]+"; command -v omp; omp --version")' "$OMP_DIR" "$CACHE_RESET")
herdr --machine "$MACHINE_ID" pane run "$PANE" "$PATH_COMMAND" > "$PATH_RUN_TEXT"
herdr --machine "$MACHINE_ID" pane read "$PANE" --source recent --format text > "$PATH_READ_TEXT"
```

Gate. The original shell remains available at its prompt inside the new owned scope. The pane shows the intended omp path/version after cache flush. An SSH version result alone does not pass. No nested shell or launcher replaces the original shell.

### 4. Focus only when requested

Default creation remains `--no-focus`. If the user asks to watch, focus the actual workspace before starting omp.

```sh
herdr --machine "$MACHINE_ID" workspace focus "$WORKSPACE" > "$FOCUS_RESPONSE"
printf 'Target %s, label offload:%s, workspace %s, pane %s\n' "$HOST" "$SLUG" "$WORKSPACE" "$PANE"
```

Gate. Requested backend focus succeeded and the host, label and pane were announced. Backend focus does not prove the user's UI selected that machine. If the UI still shows Local, point to the target machine in the sidebar. Do not substitute a guessed workspace or disturb another user pane.

### 5. Start fresh omp and check membership

```sh
herdr --machine "$MACHINE_ID" agent start "$AGENT" --kind omp --pane "$PANE" > "$START_JSON"
herdr --machine "$MACHINE_ID" pane process-info --pane "$PANE" > "$PROCESS_AFTER_JSON"
```

Gate. Agent-start reports interactive readiness in the same pane. The original `shell_pid` is unchanged. Identify the actual omp PID from `result.process_info.foreground_processes` and bind `OMP_PID` to it. Run [the post-start membership block](freeze.md#check-agent-membership) in one separate target call. Require the recorded scope identity and actual shell/omp membership before prompting. A start timeout or failed gate stops dispatch. Read status and pane output before any retry.

### 6. Submit the Brief pointer

```sh
herdr --machine "$MACHINE_ID" agent prompt "$AGENT" \
  "Read skill://pstack-poteto-mode, the trusted repo AGENTS, $BRIEF_PATH and $WORKER_INVENTORY. Follow that Brief and begin. Keep your session journals and temporary summaries in $TARGET_META with mode 0600, not the checkout. After terminal Result, leave the checkout unchanged." > "$PROMPT_RESPONSE"
```

This submits Enter. Require explicit task acceptance or observed work on that Brief. Agent readiness alone is insufficient. If submission times out or acceptance is unclear, inspect before retrying.

```sh
herdr --machine "$MACHINE_ID" agent get "$AGENT" > "$AGENT_STATUS"
herdr --machine "$MACHINE_ID" pane read "$PANE" --source recent --format text > "$TASK_READ_TEXT"
```

Gate. The remote branch was verified, the fresh omp remains in its owned containment and the Brief prompt was accepted or its work observed. Complete [return control publication](#publish-return-control) before reporting safe-to-close. Normal dispatch does not wait for task completion. Leave the worker pane open until user-triggered return or cleanup.

Creation, process-info and agent-start captures are JSON. `pane run` and `pane read` return text. Parse each operation's documented response instead of treating every capture as JSON. Retain all runtime IDs and private paths with the receipt.

### Publish return control

Resolve the actual server-local herdr session from native `herdr status --json` on that server. An observed `server.session=null` means the unnamed default session. Keep it null and omit `--session`. A named session uses its exact observed selector. Verify that this session contains the recorded workspace, pane and worker agent. The laptop's saved `MACHINE_ID` is not this selector.

Write `DISPATCH_DRAFT` privately with the source's observed receipt byte digest and actual original-receiver identity. Keep the existing approved copied receipt, inventory and optional allowance paths. The target helper captures boot, machine, UID, PID birth and owned-scope facts itself.

```json
{
  "schema": 1,
  "receipt_path": "/actual/private/copied-receipt.json",
  "receipt_sha256": "SOURCE_OBSERVED_RECEIPT_SHA256",
  "inventory_path": "/actual/private/inventory.json",
  "allowlist_path": null,
  "herdr": {"session": null, "workspace": "ACTUAL_ID", "pane": "ACTUAL_ID", "agent": "offload-SLUG"},
  "scope": {"unit": "offload-SLUG.scope", "initial_pid": 123, "omp_pid": 456},
  "source": {
    "host": "OBSERVED_HOST", "user": "OBSERVED_USER", "uid": 1000,
    "repo": "/original/receiver", "common_dir": "/original/common-dir",
    "receipt_path": "/original/private/receipt.json",
    "guard_path": "/canonical/source/git_guard.py", "guard_sha256": "OBSERVED_HELPER_SHA256"
  },
  "routes": {
    "reverse": {
      "status": "verified", "ssh_alias": "OBSERVED_ALIAS", "user": "OBSERVED_USER",
      "port": 22, "host_key_alias": null, "config_path": null, "verified_at": "OBSERVED_UTC"
    },
    "forward": {"ssh_alias": "OBSERVED_FORWARD_ALIAS"}
  }
}
```

All template values come from observations. `routes.reverse` can instead be `{"status":"unavailable","reason":"Observed route gap."}`. Announce source-pull-only delivery in that case. Preserve this invocation's actual SSH port, optional HostKeyAlias and optional approved private `-F` configuration path. Read no credential or configuration contents.

```sh
PUBLISH_CMD=$(python3 -c 'import shlex,sys; print(shlex.join(sys.argv[1:]))' \
  python3 "$TARGET_RETURN_STATE" publish-dispatch --worktree "$WORKTREE" --slug "$SLUG")
ssh -T -- "$HOST" "$PUBLISH_CMD" < "$DISPATCH_DRAFT" > "$DISPATCH_RESPONSE"
```

Gate. Publication returned `ok=true`. The immutable `dispatch.json` is beneath the target's absolute Git common directory at `offload-receipts/$SLUG/`. Retain its absolute path and digest, actual worker path, target common directory and forward route beside the independent original receipt as `return-control.json`. Publish that locator exclusively through a private same-directory temporary file, file fsync, no-clobber link and directory fsync. A timeout requires reading and comparing the existing dispatch, not republishing or creating another worker. Only complete dispatch plus this durable locator passes safe-to-close.

The source locator has this shape. Read `root`, `slug` and receipt digest from the independent source receipt. The remaining target values come from successful publication, not a reconstructed Brief.

```json
{
  "schema": 1, "root": "FULL_ROOT_SHA", "slug": "SLUG",
  "receipt_sha256": "SOURCE_OBSERVED_RECEIPT_SHA256", "forward_alias": "OBSERVED_TARGET_ALIAS",
  "worker_path": "/actual/registered/worker", "common_dir": "/actual/target/common-dir",
  "state_dir": "/actual/target/common-dir/offload-receipts/SLUG",
  "dispatch_path": "/actual/target/common-dir/offload-receipts/SLUG/dispatch.json",
  "dispatch_sha256": "SUCCESSFUL_PUBLICATION_DIGEST"
}
```

## Worker Result

The worker commits its current work normally and leaves the exact expected checkout clean before the separate Result note. Automatic Finish uses `complete`. An explicit checkpoint or move-back uses `paused` after stopping new work and finishing or safely stopping the current tool. Finish routes this worker's session journals, temporary summaries and return records to its approved private metadata directory. Before Result, relocate only its own generated untracked notes there with mode 0600. Keep the checkout unchanged after terminal Result. Do not change global journal settings or ignore arbitrary files to pass the clean gate. Approved ignored MCP config stays outside commits.

```json
{"state":"complete","summary":"Completed work description.","verification":["Actual command and observed result."],"limitations":[],"next_steps":[]}
```

For a requested unfinished checkpoint, use `paused` with nonempty remaining steps.

```json
{"state":"paused","summary":"Checkpoint returned for continued work.","verification":[],"limitations":["Acceptance verification has not completed."],"next_steps":["Finish the remaining task work and run its acceptance checks."]}
```

```sh
python3 "$GUARD" result --repo "$WORKTREE" --expected "$RECEIPT" --summary "$SUMMARY" --allowlist "$WORKER_ALLOWLIST"
```

Omit `--allowlist` only when the Snapshot required no reviewed exceptions. Do not depend on a source-local Git blob being present in the worker's object database. A `policy_N` allowance with a different effective target policy refuses instead of masking a different rule.

The helper records the actual work tip and makes a separate normal Result commit. Matching complete or paused notes are rerunnable. A dirty tree, wrong branch, invalid state or inconsistent remaining steps refuses. Keep hook output private. Do not include checks that did not run. Return reports the state and remaining steps without claiming a paused task is solved.

## Return control

From the actual worker, resolve its absolute Git common directory and exact Offload slug. From a fresh server session, locate that slug only beneath approved Mirror common directories. From the source, use the original receipt and `return-control.json`. Read the private `dispatch.json`, `intent.json`, `freeze.json`, `pin.json` and attempt records as ordinary JSON. Require owned mode-0700 directories and mode-0600 regular files without symlink aliases. Multiple root or path matches require the specific worktree, not the newest timestamp.

Every helper call uses the recorded actual `WORKTREE` and explicit `SLUG`. Initial request and freeze require its exact clean branch. Pinned retries use the saved Result even if HEAD or the branch has moved. The four helper verbs own publication, request allocation, freeze and outcome. Herdr, SSH, source validation, semantic review and apply stay in the model's orchestration.

### Hand off from the worker

Before request, route this worker's subsequent session journals and temporary summaries to Finish's actual approved private metadata destination. Include end-of-turn journal generation. Preserve any already-generated owned note there without reading it or amending terminal Result. Produce or confirm the requested [terminal Result](#worker-result), then persist the candidate intent and allocate a unique controller attempt. If an unavoidable late hook still dirties the checkout, freeze refuses. Do not suppress or ignore that file to create a pin.

```sh
python3 "$RETURN_STATE" request --worktree "$WORKTREE" --slug "$SLUG" \
  --state "$TASK_STATE" > "$REQUEST_JSON"
```

Bind `ATTEMPT_ID`, `CONTROL_AGENT`, `FRESH_SESSION_DIR` and `CONTROL_CWD` from response fields `attempt_id`, `agent`, `session_dir` and `cwd`. Read `dispatch.herdr.session`. Use an empty shell variable only for its observed null value.

```sh
HERDR=(herdr)
if [ -n "$HERDR_SESSION" ]; then HERDR+=(--session "$HERDR_SESSION"); fi
"${HERDR[@]}" workspace create --cwd "$CONTROL_CWD" \
  --label "return:$SLUG:$ATTEMPT_ID" --no-focus > "$CONTROL_CREATE_JSON"
```

Parse the actual workspace and root pane from the same response fields as ordered startup. Capture its original shell PID through `pane process-info`. Prepare that shell's intended omp PATH using startup's cache-flush recipe. Require that shell outside the worker cgroup subtree before start.

```sh
"${HERDR[@]}" agent start "$CONTROL_AGENT" --kind omp --pane "$CONTROL_PANE" -- \
  --cwd "$CONTROL_CWD" --session-dir "$FRESH_SESSION_DIR" > "$CONTROL_START_JSON"
"${HERDR[@]}" pane process-info --pane "$CONTROL_PANE" > "$CONTROL_PROCESS_JSON"
"${HERDR[@]}" agent prompt "$CONTROL_AGENT" \
  "Read skill://offload-return. Continue the authorized attempt $ATTEMPT_ID for $WORKTREE, slug $SLUG. Use its private dispatch and intent. Your actual workspace is $CONTROL_WORKSPACE and pane $CONTROL_PANE. Keep your session journals and summaries under your private $CONTROL_CWD, never in $WORKTREE."
```

Require fresh omp readiness and its actual birth identity outside the worker subtree. Different pane IDs alone do not prove separation. The controller publishes durable acceptance before stopping the worker. After that acceptance, the worker performs no more task or return work and does not wait for delivery. Creation or prompt timeout requires inspection of the allocated attempt and actual processes before any retry.

### Freeze from the independent controller

Read the attempt's immutable intent and recorded worker control. Observe the controller's original shell and actual omp PIDs through the recorded server-local herdr session. Pass the actual workspace and pane. Include `--herdr-session "$HERDR_SESSION"` only for a recorded named session.

```sh
SESSION_ARGS=()
if [ -n "$HERDR_SESSION" ]; then SESSION_ARGS=(--herdr-session "$HERDR_SESSION"); fi
python3 "$RETURN_STATE" freeze --worktree "$WORKTREE" --slug "$SLUG" \
  --attempt "$ATTEMPT_ID" --controller-pid "$CONTROL_OMP_PID" \
  --shell-pid "$CONTROL_SHELL_PID" --workspace "$CONTROL_WORKSPACE" \
  --pane "$CONTROL_PANE" "${SESSION_ARGS[@]}" > "$FREEZE_RESPONSE"
```

Gate. `ok=true` binds the exact Result, retained ref and freeze proof. The helper checks the actual command and live controller identities outside the worker, publishes acceptance and pre-stop writer capture, stops only the owned incarnation, proves descendant-writer exit and rereads the clean exact branch before pinning. It reconciles interrupted proof/ref/pin publication without selecting another Result. A refusal is never followed by a manual stop. After success, close only the recorded worker pane if it remains. Keep its worktree and branch.

### Retry or pull the same pin

A later explicit server invocation runs `request` without `--state`, starts a fresh controller as above, then calls `freeze` with its new attempt. Existing proof and pin reconciliation needs no dead original controller arguments and stops no replacement scope. Delivery uses the same retained ref and Result.

A fresh source-side invocation uses its original receipt and locator to read the target pin over the existing forward SSH route. Allocate a separate attempt with `request --mode source-pull`, then call `freeze --attempt "$ATTEMPT_ID"` to confirm or reconcile that pin. Neither command requires an old pane or a server model. Perform the validation, review and apply below in this fresh source model. Record the observed outcome over that forward route. A source pull never fabricates controller acceptance.

### Record one delivery outcome

Contact the original receiver using the recorded standard SSH invocation, `BatchMode=yes`, strict host-key checking and a bounded connection timeout. Preserve actual port, user, optional HostKeyAlias and optional `-F` path. Reverify its host, UID, repository/common directory, single root, original receipt digest and canonical helper digest before delivery.

Use delivery `pending` with reason `offline`, `route`, `auth`, `identity`, `policy`, `receiver_busy` or `acknowledgement_unknown`. Record the observed detail. Generic SSH exit 255 alone does not establish offline. A reachable receiver without actual affected-writer quiescence remains `receiver_busy`. Preserve the pin in every pending case. No daemon or automatic retry is installed.

```json
{"delivery":"pending","reason":"offline","detail":"Observed connection refusal at the recorded endpoint.","paths":[],"source_ack":null}
```

Use `conflict` with actual conflicting paths, or `refused` with the actual safety failure. Use `applied` or `already_applied` only with the source-observed acknowledgement below and null reason/detail. Publish exactly one immutable outcome for this attempt.

```sh
python3 "$RETURN_STATE" outcome --worktree "$WORKTREE" --slug "$SLUG" \
  --attempt "$ATTEMPT_ID" < "$OUTCOME_JSON"
```

## Validate and apply

Perform these steps on the original receiver, using its retained original receipt and authority objects. The server controller can own review after that receiver's policy scan. A laptop chat is not required.

1. Reverify source identity, original receipt bytes and installed helper digest. Establish actual affected-writer quiescence from observed ownership or explicit user pause assurance. Retain that evidence, not a claim that a Git lock stops editors. If unproved, record pending `receiver_busy` and finish.
2. Use a fail-fast source common-directory apply lock to serialize Offload validation and apply. Keep affected writers paused across scan, review and apply. Choose a new collision-free `FETCH_REF` beneath `refs/offload-return/`.
3. Fetch only the retained server Result ref and require the fetched full SHA to equal `pin.result_commit`.

```sh
git -C "$RECEIVER" fetch --no-tags "$MIRROR_URL" \
  "refs/offload-return/$SLUG/result:$FETCH_REF"
test "$(git -C "$RECEIVER" rev-parse "$FETCH_REF")" = "$RESULT_SHA"
python3 "$GUARD" validate --repo "$RECEIVER" --expected "$RECEIPT" \
  --result-commit "$RESULT_SHA" > "$VALIDATE_JSON"
```

4. Require successful authoritative validation before inspecting the returned diff. Review that exact immutable SHA against every Brief acceptance criterion, actual verification claims, limitations and paused next steps. Record the decision bound to receipt digest and Result SHA in this attempt. A structural helper success is not semantic acceptance.
5. After accepted review, recheck writer quiescence and take the same source apply lock. Capture the actual receiving HEAD and actual index-byte digest before and after canonical apply. Use null for an absent index. The complete binary patch includes Brief and Result provenance. The receiver may retain unrelated dirty, staged and untracked work.

```sh
python3 "$GUARD" apply --repo "$RECEIVER" --expected "$RECEIPT" \
  --result-commit "$RESULT_SHA" > "$APPLY_JSON" 2> "$APPLY_STDERR"
```

6. Only after observing `applied` or `already_applied`, publish the following acknowledgement privately and atomically in a new source delivery record. `helper` is the full actual captured apply response, not reconstructed success fields. All binding and preservation fields come from the original receipt and actual source observations.

```json
{
  "schema": 1,
  "root": "FULL_ROOT_SHA", "slug": "SLUG",
  "receipt_sha256": "EXACT_ORIGINAL_RECEIPT_DIGEST",
  "snapshot": "FULL_SNAPSHOT_SHA", "result_commit": "EXACT_PINNED_RESULT_SHA",
  "source_path": "/actual/private/source/acknowledgement.json",
  "helper": {
    "ok": true, "result_commit": "EXACT_PINNED_RESULT_SHA", "work_tip": "ACTUAL_WORK_TIP",
    "suppressed": 0, "state": "complete", "next_steps": [],
    "status": "applied", "paths": ["ACTUAL_RETURNED_FILENAME"]
  },
  "head_before": "OBSERVED_RECEIVING_HEAD", "head_after": "SAME_OBSERVED_HEAD",
  "index_before_sha256": "OBSERVED_INDEX_DIGEST", "index_after_sha256": "SAME_OBSERVED_DIGEST",
  "writer_evidence": {"kind": "exclusive-owner", "detail": "Actual ownership or pause evidence."}
}
```

Use `exclusive-owner`, `observed-quiescent` or `user-paused` only for the evidence actually established. Transfer this actual ACK payload into `outcome.source_ack`. The kernel checks its binding, actual helper response and unchanged HEAD/index. Its `source_path` is only a locator. A lost SSH acknowledgement or `*_EFFECT_UNCERTAIN` result remains pending `acknowledgement_unknown`. A later explicit retry revalidates the same pin against the current receiver and uses canonical forward or complete reverse checking. Never infer success from an old ACK alone. Conflicts refuse the whole patch with actual paths. No merge, autostash, reset or partial fallback exists.

## Prep and history scan

Fetch an existing peer HEAD into an isolated inspection ref before comparing locally. Supply the observed target filesystem's available bytes, not the source's free space.

```sh
python3 "$GUARD" prep --repo "$SOURCE" --free-bytes "$TARGET_FREE_BYTES" --peer-tip "$PEER_SHA"
python3 "$GUARD" scan --repo "$SOURCE" --tip "$SOURCE_SHA"
```

Omit `--peer-tip` for an absent target copy. Prep reports both tips, unique commits and source dirty/untracked filenames. It refuses divergence, root mismatch and less than 15,000,000,000 free bytes. It does not choose an authority or change a checkout.

## Reviewed false positives

Append `--allowlist "$ALLOWLIST"` only after each match is reviewed. A file allowance names its exact blob object, exact path and stable rule ID. A metadata allowance names the exact commit object and `<commit>` path. The reason is required but never printed by the scanner.

```json
[{"object":"FULL_CONTENT_OBJECT_SHA","path":"exact/repo/path","rule":"RULE_ID_FROM_REPORT","reason":"Reviewed example, not a credential."}]
```

A new content object, another path or another rule still refuses. No path-only or global bypass is accepted. Retain the original allowlist with the source receipt. Genuine credentials remain a stop condition.

## Prep transport check

Generate a fresh token and check that the exact remote and local refs are absent. `SOURCE_SHA` is the user-selected retained source tip. `PREP_REF` is `refs/heads/offload/prep-check-<token>` and `VERIFY_REF` is a collision-free `refs/offload-prep-check/<token>`. Run the history scan first.

```sh
printf 'create %s %s\n' "$PREP_REF" "$SOURCE_SHA" | git -C "$SOURCE" update-ref --stdin
git -C "$SOURCE" push --no-verify --force-with-lease="$PREP_REF:" \
  "$MIRROR_URL" "$PREP_REF:$PREP_REF"
git -C "$SOURCE" fetch --no-tags --no-write-fetch-head "$MIRROR_URL" "$PREP_REF:$VERIFY_REF"
git -C "$SOURCE" rev-parse --verify "$VERIFY_REF"
```

Require the fetched full SHA to equal `SOURCE_SHA`. Before removing the remote temporary ref, verify it still names that same SHA. After a successful round trip, delete only these run-owned refs.

```sh
git -C "$SOURCE" push --no-verify --force-with-lease="$PREP_REF:$SOURCE_SHA" "$MIRROR_URL" ":$PREP_REF"
git -C "$SOURCE" update-ref -d "$VERIFY_REF" "$SOURCE_SHA"
git -C "$SOURCE" update-ref -d "$PREP_REF" "$SOURCE_SHA"
```

A changed ref fails the exact lease or compare-and-delete. Keep receipts on any failure and inspect before retrying. No user branch or prefix-wide cleanup is involved.

## Parent verification

```sh
python3 /home/james/dotfiles/.agents/skills/_shared/offload/verify.py
python3 /home/james/dotfiles/.agents/skills/_shared/offload/verify.py
```

These are rerunnable local fixtures. They do not exercise SSH, actual herdr containment, ignored-file transfer or a real deployment. Verify those through the actual target before accepting safe-to-close or return.
