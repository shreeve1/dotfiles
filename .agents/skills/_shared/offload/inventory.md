# Target inventory

Run this read-only inventory for the project copy before prep, then for the actual returned worker worktree before agent startup. Record versions, presence and access gaps in the Brief, with separate project-ready and worker-ready states. Ignored files in a project copy are not inherited by a linked worktree. Do not install tools or start services during inventory.

## Batch each stage

Read the repo requirements before constructing a batch. Collect independent versions, available bytes, checkout identity, effective hook metadata, git identity presence and declared config presence in one target call for the project stage. Run a separate batch for the actual worker stage. Never reuse project results for that checkout or merge pre-start with post-start containment checks.

The following source-side Bash snippet is the core batch. Bind `CHECKOUT` to this stage's actual absolute path and `PI_BIN` to the intended installed executable. Populate the Bash array `CONFIG_PATHS` with repo-declared filenames or configured absolute paths. Add the repo-required version commands and read-only dependency/access checks inside the same target block before running it. Keep `INVENTORY` and `INVENTORY_ERR` as fresh mode-0600 captures outside the checkout.

```sh
umask 077
QUERY=$(python3 -c 'import shlex,sys; print(shlex.join(["sh","-s","--",*sys.argv[1:]]))' "$CHECKOUT" "$PI_BIN" "${CONFIG_PATHS[@]}")
ssh -T -- "$HOST" "$QUERY" > "$INVENTORY" 2> "$INVENTORY_ERR" <<'SH'
checkout=$1
pi_bin=$2
shift 2
export GIT_OPTIONAL_LOCKS=0 GIT_NO_REPLACE_OBJECTS=1 GIT_NO_LAZY_FETCH=1
git --version || printf 'git_version_check=failed\n'
python3 --version || printf 'python_version_check=failed\n'
"$pi_bin" --version || printf 'intended_pi_version_check=failed\n'
command -v pi || printf 'ssh_pi_path=absent\n'
python3 -c 'import shutil,sys; print("available_bytes="+str(shutil.disk_usage(sys.argv[1]).free))' "$checkout"
git --no-optional-locks -c core.fsmonitor=false -C "$checkout" rev-parse --show-toplevel
git --no-optional-locks -c core.fsmonitor=false -C "$checkout" symbolic-ref --short HEAD
git --no-optional-locks -c core.fsmonitor=false -C "$checkout" rev-parse --verify HEAD
git --no-optional-locks -c core.fsmonitor=false -C "$checkout" rev-list --max-parents=0 --all
hook=$(git --no-optional-locks -c core.fsmonitor=false -C "$checkout" rev-parse --path-format=absolute --git-path hooks/pre-commit) || exit 1
printf 'effective_precommit=%s\n' "$hook"
if [ -f "$hook" ]; then
	printf 'precommit_blob='
	git --no-optional-locks -C "$checkout" hash-object --stdin < "$hook"
elif [ -e "$hook" ] || [ -L "$hook" ]; then
	printf 'precommit_present=non-regular\n'
else
	printf 'precommit_present=no\n'
fi
for field in user.name user.email; do
	if git --no-optional-locks -C "$checkout" config --get "$field" >/dev/null; then
		printf '%s_configured=yes\n' "$field"
	else
		printf '%s_configured=no\n' "$field"
	fi
done
for path do
	case "$path" in /*) ;; *) path="$checkout/$path" ;; esac
	if [ -e "$path" ] || [ -L "$path" ]; then stat -- "$path"; else printf 'absent=%s\n' "$path"; fi
done
SH
```

Gate. Each declared dependency has an observed result or explicit access gap. Inspect failures in the private captures before claiming ready. A newly created target copy may have no HEAD at the project stage. The worker must have the exact expected branch, Brief HEAD and single full root. Compare live hook metadata with source authority when required, without executing the hook or printing its bytes.

Keep project-ready and worker-ready distinct. Append approved provisioning's observed results to the worker inventory. If provisioning changes mutable facts, refresh those facts together in one follow-up target call. Never cache hook policy, checkout identity or config presence across stages.

## Resolve requirements and gaps

1. Resolve the SSH host with `ssh -G HOST`. Verify its hostname, user and port against the saved herdr machine profile and the connected target. Use `herdr machine list --json` and select the saved machine ID or label. An SSH alias is not a herdr machine selector.
2. Read the repo's manifests, lockfiles, tool-version files, AGENTS instructions and verification scripts. Derive runtimes, package managers and required config from those files. Include their checks in the stage batch above. The ordered startup recipe compares the intended executable with the original pane shell's PATH and observes its version after cache flush.
3. Check dependency caches and build directories by names and sizes. Classify ignored files one by one as `copy`, `rebuild` or `ask`. Show filenames, not content. Ask before transferring any ignored local state. Rebuild dependencies when that is reproducible from the lockfile.
4. Check configuration and external access needed by the actual goal. List repo MCP config and credential requirements as gaps. Prefer their target-side bootstrap flow. An explicitly approved ignored config file, such as `.mcp.json`, may be transferred separately with [the guarded stdin recipe](ignored-copy.md). Repeat provisioning for the actual worker checkout. Approval is per file. MCP provisioning never uses the Offload branch. Existing Snapshot-held history remains unchanged and subject to the history warning.
5. For sops or age repos, check the target tools and configured age-key path exist. Report presence and permissions only. Never print an age private key or copy it. Use the target's existing key provisioning flow if it is absent.
6. For each approved `.env` transfer, use [the guarded stdin recipe](ignored-copy.md) on its exact worker-relative path. It requires ignored and untracked destination status, rejects symlink traversal and sets mode 0600 before bytes arrive. Never put values in arguments, logs, the Brief or chat.
7. Report missing access and the commands the fresh worker can run. A dependency inventory is not permission to modify existing services. Distinguish a missing tool, a missing credential and a running-service dependency.

Finish when each repository-declared dependency has an observed status in the actual worker checkout or an explicit access gap. Store post-creation worker observations privately and point the fresh agent to them. Resolve gaps within the Brief's approved provisioning plan; otherwise revise the source Brief before dispatch. For a cold goal, preserve unresolved dependency questions rather than inventing requirements.
