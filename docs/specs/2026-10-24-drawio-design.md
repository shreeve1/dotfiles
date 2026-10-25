# drawio skill: shared draw.io canvas for human + AI sessions

Date: 2026-10-24. Status: draft for approval.

## Intent

James plans bots, agent workflows and features by sketching flowcharts with an AI session. Mermaid needs code to edit; Excalidraw has no shape libraries; VS Code Remote-SSH is too heavy for small hosts like aidev. He wants one diagram both sides can edit in turns: he drags shapes in a browser, the AI edits the same file on disk.

Mostly used during brainstorming sessions, on aidev (headless, reached over NetBird), wrk (WSL) and surftop (native Windows).

## Goals

- A skill `drawio` in `.agents/skills/drawio/` (syncs to all machines).
- Start, stop and status of a lightweight server on demand.
- Full draw.io editor in any browser; Save writes the `.drawio` file on the host; the page picks up AI edits without manual reload.
- Agent guidance for working with draw.io: file format, editing without wrecking James's layout, flowchart conventions, the turn-taking loop.
- Hook into brainstorming: when a flow, process or structure comes up, put it on the canvas.

## Non-goals

- No HTTPS (NetBird-only use).
- No offline editor copy (option B; can be added later without changing the skill's interface).
- No edits to the superpowers brainstorming skill (npm-installed, overwritten on update).
- No multi-user live collaboration; turns, not simultaneous editing.

## Anti-goals

- Anything that sits resident and heavy (Java, Docker, VS Code server).
- Losing James's unsaved or layout work because the AI rewrote a file.

## Constraints

- Must run on Linux and native Windows (surftop has no bash): Node only, no npm dependencies. Node 24 confirmed on aidev and wrk; surftop unverified (was offline).
- Light: idle cost near zero; auto-shutdown after inactivity.

## Approaches

- **A. Tiny Node server + editor from embed.diagrams.net (picked).** One dependency-free file serves a page that iframes the official editor in embed mode, loads/saves files from a folder, and polls for on-disk changes. Trade-off: browser needs internet for the editor code; diagrams stay on the host.
- B. Same plus self-hosted editor assets. Offline, but 100MB+ per machine to download and keep updated.
- C. Official `jgraph/drawio` Docker image. Java, ~300MB resident, impractical on surftop.

James picked A.

## Decided

- Lightest option; no HTTPS.
- Diagrams live with the work: in the current project (the working directory, or its repo root), and when the diagram belongs to a plan, beside that plan in the plan's folder. The server serves whichever folder the session points it at (`--dir`, default the working directory).
- Skill includes draw.io working knowledge so it can prep any session on surftop/wrk/aidev.
- Used mainly in brainstorming.

## My calls (check these)

- Placement detail: no plan → `<project root>/diagrams/<topic>.drawio`; plan → same folder as the plan file, named after it (`<plan-name>.drawio`). One server at a time; starting with a different `--dir` replaces the running one.
- No access token. Binds `127.0.0.1` by default; pass `--host <netbird-ip>` when the browser is on another machine (the aidev case). Port defaults to 8740.
- Idle auto-shutdown after 4 hours without a browser request.
- One controller script: `node scripts/drawio.mjs start|stop|status [--dir] [--host] [--port]`. State (pid, port) in `~/.drawio-server.json`.
- Index page lists diagrams and offers "new diagram"; `/?file=name.drawio` opens one.
- Conflict handling: the page tracks the file's mtime; if the AI changed the file and the page has no unsaved edits, it reloads silently; if both changed, it warns instead of overwriting either side. The AI is told to ask James to save before editing.
- Files saved uncompressed so the AI can read and diff them.

## Left to the builder

- Exact page markup and polling interval.
- Wording and structure of the agent guidance, kept short with heavy reference disclosed.
