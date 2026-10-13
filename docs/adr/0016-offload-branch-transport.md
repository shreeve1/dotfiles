---
status: accepted
---
# Offload work travels as `offload/*` branches, never pushed to `main`

The `offload` skills hand a task between the laptop and a server (aidev, itan8n) by pushing an `offload/<slug>` branch to the other machine's Mirror. The agent's work later comes back into the original receiving working tree. Neither side pushes to the other's `main`. Return stays user-triggered, whether requested from the worker pane, a fresh server session, or the original source.

The laptop works directly on `main`, which moves constantly and is almost never clean. In a throwaway-repo test, pushing to a peer's checked-out `main` is rejected, and `receive.denyCurrentBranch=updateInstead` fails whenever the peer's tree is dirty. Rebase and fast-forward-only both refuse on a dirty tree. The skills say "apply", never "merge" or "land" (see Landing in `CONTEXT.md`).

An Offload starts from a Snapshot of the dirty tree. Return applies the binary, full-index Snapshot-to-Result delta with `git apply --check`, then `git apply`. That leaves HEAD and the index alone, keeps unrelated edits made after the Offload, and refuses conflicting changes without partial application. There is no merge, reset, autostash or three-way fallback.

The laptop `~/Documents/itastack` has a `pre-push` hook that refuses every push. Offload pushes use `git push --no-verify`, and the skills apply it only to the Mirror remote. Any other remote still hits the hook. See `memory/decisions/workstation/decision-offload-bypasses-pre-push.md` in `~/Documents/itastack`.

## Considered options

- Push straight to the peer's `main` with `updateInstead`: fails whenever the peer's tree is dirty, which on the laptop is always.
- One canonical side per project, the other only pulls: rules out work that starts on the server.
- The server merges into the laptop over ssh: changes the laptop tree while the user may be editing it.

## Consequences

- Each machine keeps its own `main`. A Mirror's `main` goes stale on purpose.
- The Brief travels as a committed file on the Offload branch, so the record comes back with the work. Each repo declares the Brief path in its own `AGENTS.md`, because a repo may ignore a default location (itastack ignores `/docs/`).
- The Snapshot is built with a temporary index, shows the user its file list first, and excludes `.env*`, `.pem`, `.key`, `.pfx`, `.p7m`, `.kdbx` and `.mcp.json` names. Excluded files already tracked retain their committed content; exclusions do not remove history.
- The server agent commits its work first. A separate Result-only commit records that work commit as `work_tip`, avoiding a note that refers to its own SHA. Return applies the Snapshot-to-Result delta so the tracked Brief and Result come back too. A requested in-flight return uses a `paused` Result with remaining `next_steps`; it does not claim the task is complete. Every recorded Result is terminal; continuing requires a fresh Offload with a new slug and receipt.
- A dedicated user systemd scope contains each Offload agent and its tool processes. Return stops that exact scope and verifies that its cgroup is empty before it reads the final branch and applies changes. An idle agent alone does not exclude concurrent writes.
- A server-side return hands control to a fresh omp in an independent herdr workspace. That controller survives worker shutdown and can review the result without a laptop chat. A native one-shot controller alone cannot perform the required semantic acceptance review.
- Private dispatch and source locator records survive chat loss. The lifecycle helper pins the exact Result only after captured writers exit and the clean branch is reread. Task state remains `complete` or `paused`; delivery state is separate.
- An unreachable receiver leaves a retained Result ref and a pending outcome. A later explicit server retry or source-side pull uses that same pin. Delivery requires original-source policy validation, diff inspection, acceptance review, receiving-writer quiescence, and revalidating apply. No daemon or automatic retry is installed.

## Observed verification (2026-10-12)

- The shared helper's 40-case suite passed twice. The four skills and helper are installed narrowly on the laptop, aidev and itan8n. Start a fresh omp session to discover newly added skills; retained session catalogs do not refresh automatically.
- A fresh omp 18.7.0 on aidev completed `offload/20261012-prove-tiny-task`. Snapshot `80a3404722cdb2f8b696b09f92d78474134c864b`, proof-only work commit `a83a5f9261d21af2d2b8e4df481d045ed668745c`, complete Result `3369922b43a7bbe32ef3de2b85789b4ba7406265`. The original shell, omp and tool broker exited, and the recorded cgroup was absent before the final tip was fetched.
- Return added only the Brief pair, `proof.txt` and `result.json` under `.offload/20261012-prove-tiny-task/`. Python checked the exact proof bytes. Receiving HEAD remained `956c08cf9ed908870c37e08358251849ec007759`; index bytes and every prior workfile row were unchanged. Concurrent user commits and newer unrelated edits were preserved.
- Real prep push/fetch/delete checks passed for dotfiles and itastack. The retained itastack copy is `aidev:/home/james/offload/itastack-ca330ed`; only its approved ignored `.mcp.json` was copied, mode 0600. Both connector initialization handshakes returned HTTP 200. No client-data tools were invoked; dirty laptop itastack work was not transferred.
- The deployment skill's canonical instructions were exercised read-only against aidev's existing dsh installation. It refused to treat the file-only proof as deployment authority. There were zero mutation attempts; selected service properties, file hashes, stat rows and listener presence were unchanged. Build, start, health and rollback remain unexercised.
- The visible scratch hello-world demo focused aidev workspace `w1G` before starting fresh omp 18.7.0 in pane `w1G:p1`. The user confirmed it was visible; the exact hello file bytes were checked and the session was left open. Startup instructions now use one recipe in `.agents/skills/_shared/offload/commands.md`, with stage-local batched checks and focus-before-start only when requested. Approval, scanning, provisioning and freeze gates remain unchanged.
- The integrated lifecycle suite passed all 52 cases, and the complete suite passed all 92. An in-memory mutation that accepted changed receiving HEAD failed the ACK regression. Production files were not modified for that check.
- Actual same-pane return on aidev froze `offload/20261012-hop-back-two` and pinned Result `e8c9ebc7a303e7e40f03b0b72d6946775d399183`. The independent controller shell and omp survived outside the worker cgroup; every captured writer exited. Stopping only an owned test relay produced a kernel-bound `pending` outcome with reason `offline`, while the receiver remained unchanged.
- After the old controller closed and the relay returned, a fresh server controller applied the same pin to the original isolated laptop fixture. The actual source ACK matched receiving HEAD and index hashes. Exact proof bytes and unrelated staged, unstaged, and untracked work were preserved. Only the Brief pair, Result note, and `proof.txt` returned.
- With both server controller panes closed, a fresh source omp pulled the same pin and observed `already_applied`. Another fresh source attempt after a deliberate local edit observed `APPLY_CONFLICT`; all watched receiving bytes, modes, HEAD, and index remained unchanged. The fixture edit was then restored. Private evidence is retained under `.git/offload-verification/server-return-d6adb2adfe/`.
- Seven reviewed runtime and test files were installed narrowly on aidev and itan8n after checking every existing file against its saved baseline. Installed hashes matched the laptop; `git_guard.py` was unchanged. The canonical aidev CLI replayed the existing pin as `already_pinned`. On itan8n, the installed helper read real process identity and the native user-systemd interface. The full return round trip was exercised on aidev, not itan8n.

## History-cleanup boundary

The credential-bearing archive was removed from the approved reachable histories and recovery refs on the laptop, GitHub and both servers. Original saved stashes were preserved: laptop 3, aidev 6, itan8n 10. The independent history audit by `zai/glm-5.3:high` passed.

Unreachable original objects, private recovery material, GitHub caches and other clones may retain the original credentials. Credentials were not rotated or proven revoked.
