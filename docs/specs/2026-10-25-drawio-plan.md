# drawio skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A `drawio` skill that starts/stops a tiny Node server so James edits `.drawio` files in a browser while the AI edits the same files on disk.

**Architecture:** `server.mjs` serves an index page, an editor page that iframes `embed.diagrams.net` in embed mode, and a small JSON file API with mtime-based conflict detection. `drawio.mjs` is the cross-platform controller (start/stop/status) that spawns the server detached and records state. `SKILL.md` + `reference/` teach the agent the workflow and the file format.

**Tech Stack:** Node 24, built-ins only (`node:http`, `node:fs`, `node:child_process`, `node:test`). No npm dependencies.

**Spec:** `docs/specs/2026-10-24-drawio-design.md`

## Global Constraints

- Node built-ins only; must run on Linux and native Windows (no bash in the skill's commands).
- No HTTPS, no token. Default bind `127.0.0.1`; `--host` to expose (e.g. NetBird IP).
- Default port 8740. Idle shutdown after 4 hours without a request.
- Serves the folder given by `--dir` (default: current working directory).
- State file: `~/.drawio-server.json`. One server at a time; `start` with a running server stops it first.
- Saved XML is uncompressed (`compressXml` off in the editor config).
- Never overwrite a file whose on-disk mtime differs from the one the browser loaded.
- Repo style: run `bin/style-check` on changed files; tests runnable via `bash tests/run-all.sh`.

## Review Focus

- Path traversal (`?file=../../etc/passwd`, absolute paths, non-`.drawio` names) → 400, nothing read or written.
- Both sides edited: AI wrote the file while the browser has unsaved edits → save returns 409, page warns, neither copy lost.
- New diagram name in a missing subfolder (`plans/x.drawio`) → folders created on save.
- Port already in use by something else → `start` fails with a clear message, no stale state file.
- Stale state file (server crashed / machine rebooted) → `status` says not running and `stop` cleans up without error.

---

## File structure

- Create `.agents/skills/drawio/SKILL.md`: trigger, start/stop, placement rules, turn-taking loop, brainstorming hookup.
- Create `.agents/skills/drawio/reference/format.md`: `.drawio` XML anatomy, safe editing rules, flowchart style strings, layout spacing.
- Create `.agents/skills/drawio/scripts/server.mjs`: HTTP server. Exports `createServer(opts)` for tests.
- Create `.agents/skills/drawio/scripts/drawio.mjs`: CLI controller.
- Create `.agents/skills/drawio/scripts/drawio.test.mjs`: `node:test` suite.
- Create `tests/drawio.test.sh`: runs `node --test .agents/skills/drawio/scripts/drawio.test.mjs`.

### Task 1: File API server

**Files:** Create `scripts/server.mjs`, `scripts/drawio.test.mjs`, `tests/drawio.test.sh` (paths under `.agents/skills/drawio/` unless noted).

**Interfaces:**
- Produces: `createServer({ dir: string, idleMs?: number, onIdle?: () => void }) -> http.Server` (not listening).
- Routes (all `file` params are paths relative to `dir`, `/` separators):
  - `GET /api/health` → `200 {"ok":true,"dir":<abs dir>}`
  - `GET /api/list` → `200 {"files":[{"file":"plans/a.drawio","mtime":<ms>}]}`: recursive, skips `.git`, `node_modules`, dot-dirs; sorted by path.
  - `GET /api/file?file=` → `200 {"xml":string,"mtime":number}` or `404 {"mtime":null}`
  - `PUT /api/file?file=` body `{"xml":string,"baseMtime":number|null}` → `200 {"mtime":number}`; `409 {"mtime":<disk mtime>}` when disk mtime ≠ `baseMtime` (or file exists and `baseMtime` is null); creates parent dirs.
  - Invalid `file` (absolute, contains `..` segment, resolves outside `dir`, not ending `.drawio`) → `400`.
- Run as main: `node server.mjs --dir D --host H --port P [--idle-minutes N]` listens and prints one line `drawio-server-started {"url":...}`; exits on idle.

- [ ] **Step 1: Write failing tests** in `drawio.test.mjs` (temp dir per test, server on port 0):
  - `health returns dir`
  - `put then get round-trips xml and mtime`
  - `put with stale baseMtime returns 409 and leaves disk unchanged`
  - `put new file with baseMtime null creates nested folders`
  - `put with baseMtime null on existing file returns 409`
  - `rejects traversal`: `../x.drawio`, `/etc/x.drawio`, `a/../../x.drawio`, `a.txt` all → 400
  - `list is recursive and skips .git`
  - `idle timeout calls onIdle` (idleMs 200)
- [ ] **Step 2:** `bash tests/drawio.test.sh` → FAIL (module missing).
- [ ] **Step 3: Implement `server.mjs`.** Validate with `path.resolve(dir, file)` + `startsWith(dir + path.sep)`. mtime = `Math.round(stat.mtimeMs)`. Idle: reset a timer on every request, `unref()` it.
- [ ] **Step 4:** `bash tests/drawio.test.sh` → all pass.
- [ ] **Step 5:** Commit `feat(drawio): file API server`.

### Task 2: Index and editor pages

**Files:** Modify `scripts/server.mjs`, `scripts/drawio.test.mjs`.

**Interfaces:**
- `GET /` → HTML: list of diagrams linking `/edit?file=<encoded>`, and a "New diagram" form (name input, relative path allowed, `.drawio` appended if missing) that navigates to `/edit?file=`.
- `GET /edit?file=` → HTML editor page (400 on invalid file).
- Editor page behaviour (inline script):
  - iframe `https://embed.diagrams.net/?embed=1&proto=json&spin=1&configure=1&saveAndExit=0&noExitBtn=1&libraries=1&ui=atlas`.
  - On `configure` event post `{action:"configure",config:{compressXml:false}}`; on `init` load via `GET /api/file` and post `{action:"load",xml,autosave:0,title}` (empty string for 404 = blank diagram).
  - On `save` event: `PUT` with `baseMtime`; on 200 post `{action:"status",message:"Saved",modified:false}` and store new mtime; on 409 show a banner: "This diagram changed on disk since you opened it. Your edits are still here. Reload loses them; Save as copy keeps both." with buttons Reload and Save as copy (`<name>-mine.drawio`).
  - Track `modified` from `{event:"autosave"}`/`{event:"save"}`; poll `GET /api/file` mtime every 2s (use a `HEAD`-cheap `?stat=1` variant returning `{mtime}`): if changed and not modified → reload silently; if changed and modified → show the banner.
  - Title shows file path; link back to `/`.

- [ ] **Step 1: Failing tests:** `index lists files with edit links`; `edit page embeds diagrams.net and the file name`; `edit page rejects invalid file`; `stat=1 returns only mtime`.
- [ ] **Step 2:** run → FAIL.
- [ ] **Step 3:** Implement. HTML-escape file names.
- [ ] **Step 4:** run → PASS. Manual check in a browser against a running server: open, draw a box, save, confirm file on disk is uncompressed XML; edit file on disk, confirm page reloads.
- [ ] **Step 5:** Commit `feat(drawio): editor and index pages`.

### Task 3: Controller CLI

**Files:** Create `scripts/drawio.mjs`; modify `scripts/drawio.test.mjs`.

**Interfaces:**
- `node drawio.mjs start [--dir D] [--host H] [--port 8740] [--idle-minutes 240]`: stops any recorded server, spawns `server.mjs` detached (`detached:true, stdio` to a log at `~/.drawio-server.log`, `windowsHide:true`, `unref()`), waits up to 5s for `/api/health`, writes state `{pid,host,port,dir,url,started}` to the state file, prints `url` and `dir`. On failure prints the log tail, removes state, exits 1.
- `stop`: kills recorded pid (ignore ESRCH), removes state, prints `stopped` or `not running`.
- `status`: prints `running <url> <dir>` if pid alive and health ok, else `not running` (and removes stale state). Exit 0 either way.
- `--state-file F` (hidden, for tests) overrides `~/.drawio-server.json`.
- Printed URL uses `--host` value, or `localhost` when bound to `127.0.0.1`.

- [ ] **Step 1: Failing tests** (spawn the CLI with a temp `--state-file`, random high port):
  - `start then status reports running url`
  - `stop then status reports not running`
  - `status with stale state file reports not running and removes it`
  - `start on a busy port exits 1 and writes no state`
  - `start twice replaces the first server` (first pid gone)
- [ ] **Step 2:** run → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** run → PASS.
- [ ] **Step 5:** Commit `feat(drawio): start/stop/status controller`.

### Task 4: Skill docs

**Files:** Create `SKILL.md`, `reference/format.md`.

`SKILL.md` contains, in order:
1. Frontmatter: `name: drawio`; description starting "Use when" covering: planning or brainstorming a flow, workflow, process or structure with James on a shared editable diagram; starting/stopping the draw.io server; reading or editing `.drawio` files.
2. Where diagrams go: project root (git root of cwd, else cwd) `diagrams/<topic>.drawio`; diagram for a plan → beside the plan file, `<plan-name>.drawio`. Start the server with `--dir` at the project root so both kinds show up.
3. Start/stop: exact commands with the skill dir path (`node <skill-dir>/scripts/drawio.mjs start --dir <root>`); on a headless host add `--host <NetBird IP>` (aidev `100.95.230.15`, wrk WSL needs `--host 0.0.0.0` only if browsing from another machine); give James the printed URL; `stop` when the session ends.
4. Turn-taking loop: ask James to Save before you edit; read the file; edit with the rules in `reference/format.md`; tell him what changed (his page reloads itself); repeat. After he saves, re-read before your next edit and describe what he changed.
5. Brainstorming hookup: in a brainstorming session, when a flow, sequence, state, or structure comes up, offer the draw.io canvas (in place of the visual companion) and sketch the current understanding there; record decisions in the spec, not only the diagram.
6. Pointer: "Before writing or editing any `.drawio` XML, read `reference/format.md`."

`reference/format.md` covers: file skeleton (`mxfile` > `diagram` > `mxGraphModel` > `root` with cells `0` and `1`); vertex and edge cell attributes; compressed diagrams (base64 deflate) and that the server saves uncompressed; preserve ids and geometry of existing cells, change only what's asked; new ids unique and readable (`step-validate`); flowchart style strings (process, decision rhombus, start/end ellipse, data parallelogram, swimlane/container, note) and edge style (`edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;`); layout grid (160×60 shapes, 80 px gaps, top-to-bottom), placing new shapes in empty space and not moving James's; labels with `html=1` escaping; tell James about Arrange > Layout for tidy-up; a minimal complete example (start → step → decision → two ends).

- [ ] **Step 1:** Write both files.
- [ ] **Step 2: Verify format.md:** create `diagrams/example.drawio` from the example in a temp dir, open it through the running server in a browser, confirm it renders; delete it.
- [ ] **Step 3: Verify the skill triggers and is followable:** fresh subagent given only the skill and "help me plan a bot that triages support emails, use a diagram", in a temp git repo. Pass: it starts the server with `--dir` at the repo root, creates `diagrams/<topic>.drawio` that opens cleanly, and gives the URL.
- [ ] **Step 4:** `bin/style-check` on the new files; `bash tests/run-all.sh`.
- [ ] **Step 5:** Commit `feat(drawio): skill docs`; `git pull --rebase`, push.
