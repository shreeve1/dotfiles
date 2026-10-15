# Session Capture: T3 SSH environments and load-balancing prerequisites

- Date: 2026-10-14 (omarchy local date; server clocks were on 2026-10-15)
- Purpose: Preserve verified remote-connection traps, not the status of individual project repairs.
- Scope: T3 Code 0.0.46-nightly.20261014.3132, private SSH environments, service executable visibility and repository grouping.

## Durable Facts

- T3's SSH launcher only adopts a default-home server when its persisted HTTP origin is `localhost` or `127.0.0.1`. Its readiness probes and forwarded destination use loopback. A default-home server bound only to a NetBird IP is not adopted; the launcher attempts a second default-home server, which hits `ServerAlreadyRunningError`, while the UI waits for readiness.
- Binding the existing service to `127.0.0.1:3773` fixed that collision. Both native `__ssh-helper runtime-port` and `__ssh-helper wait-ready 3773 3000 1000` succeeded afterward, as did descriptor requests through temporary SSH tunnels. The user confirmed that adding the environments worked. This does not require a T3 account; T3 Connect authorization is a separate feature.
- Check the running server's executable search path, not an interactive SSH shell's. Both server processes lacked the user directory containing pi, despite pi being installed (`~/.npm-global/bin` on aidev; `~/.local/bin` on n8n). A binary's presence on disk does not prove T3 can launch it. Provider enablement and authentication are additional checks.
- Repository grouping uses repository identity rather than the project title. The URL normalizer strips transport/user syntax and `.git`, but does not resolve arbitrary SSH host aliases. `git@github-personal:owner/repo.git` normalizes to `github-personal/owner/repo`, not `github.com/owner/repo`. Preserve the intended SSH identity when correcting this; do not blindly replace a multi-account SSH alias.
- Automatic placement considers matching shared-project registrations, connection and provider usability, then scores resource headroom. In this build the score is `weight * cpuCount * (1 - cpuUtilization) * (availableMemoryBytes / totalMemoryBytes)`. Preferences are Prefer=100, Normal=50, Less often=25, Manual only=0: these are score weights, not percentages of jobs. CPU utilization >=95% or available-memory fraction <=5% excludes a candidate. This places new drafts; it does not migrate running threads or synchronize uncommitted changes.

## Source Evidence

- Installed desktop `resources/app.asar/apps/desktop/dist-electron/main.cjs`, SSH launch-script region, extracted as `/tmp/t3-main.cjs:137403-137526`: `resolve_default_runtime_port` rejects non-loopback origins; launcher invokes `serve --host 127.0.0.1 --base-dir "$DEFAULT_SERVER_HOME"`.
- Installed server bundle `apps/server/dist/binCli-CoSutiQf.mjs`, extracted as `/tmp/t3-server-cli.mjs:120796-120813`: `normalizeGitRemoteUrl` returns the literal SCP-style host and path. `src/project/RepositoryIdentityResolver.ts` region at lines 131620-131728 derives identity from `git remote -v`. Provider refinement in this build is Forgejo-specific, not generic SSH-alias resolution.
- Installed client `t3ProjectFile-vYvTboXz.js`: grouping functions `S`, `C`, `w` use repository identity; missing identity falls back to the environment/workspace key. `_chat-D1V39_Mu.js` functions `Aw` and `jw` contain the score and resource exclusions; `settings.connections-D-v-gOEH.js` array `xr` defines the preference weights.
- Live probes: read-only `/proc/<server-pid>/environ` inspection filtered to `PATH`, `shutil.which`, and file-existence checks; `ss -ltnp`; `GET /.well-known/t3/environment`; temporary OpenSSH forwarding followed by the same descriptor request. Temporary verification tunnels were closed.
- Desktop trace contained `Remote T3 server did not become ready on 127.0.0.1:3773` with `ServerAlreadyRunningError` for the existing userdata directory.
- Independent verifier exceeded its 120-second budget (exit 124). Fallback: re-read the cited installed source before storing these facts; no independent verdict claimed.

## Decisions

- User chose account-free SSH connections, not T3 Connect online-hub linking. No account credentials were copied between machines.

## Exclusions

- Authorization URLs/codes, bearer/session credentials, private file contents and full transcripts are omitted.
- Dirty-checkout counts, revision lag and unfinished per-project remediation are not durable wiki facts and are not recorded here.

## Open Questions And Follow-Ups

- Provider authentication and project build/test readiness require separate runtime checks; neither follows from a successful SSH connection.
- Recheck implementation details after a T3 upgrade; these findings are version-bound.
