---
name: drawio
description: Shared draw.io canvas that James edits in a browser while you edit the same .drawio file on disk. Use when planning or brainstorming a flow, workflow, process, agent or bot design, or system structure with James; when he asks for a diagram or flowchart he can edit himself; when starting, stopping or checking the draw.io server; or when reading or editing any .drawio file.
---

# drawio

James drags shapes in the full draw.io editor in his browser; you read and edit the same `.drawio` file on disk. You take turns. A tiny Node server (no dependencies) serves the editor page and the files; the editor itself loads from `embed.diagrams.net`, so his browser needs internet, but diagrams never leave the host.

`<skill-dir>` below is this skill's base directory, as your harness reports it when the skill loads. Paths differ per machine, so use that one.

## Where diagrams go

Diagrams live with the work they describe:

- **Belongs to a plan:** beside the plan file, named after it. `plans/bot-intake.md` → `plans/bot-intake.drawio`.
- **Otherwise:** `<project root>/diagrams/<topic>.drawio`. Project root is the git root of the working directory, else the working directory.

Start the server with `--dir <project root>` so both kinds appear in its list.

## Start, stop, status

```
node <skill-dir>/scripts/drawio.mjs start --dir <project root>
node <skill-dir>/scripts/drawio.mjs status
node <skill-dir>/scripts/drawio.mjs stop
```

- Default bind is `127.0.0.1:8740`: fine when James's browser runs on the same machine (wrk desktop, surftop).
- When his browser is on another machine (a headless host like aidev), bind the NetBird IP: `--host <ip>`. aidev is `100.95.230.15`; get any host's IP with `netbird status` or from the dotfiles `AGENTS.md` table. Pass `--url-host <name>` if he prefers a name in the link.
- WSL on wrk: a browser on wrk's Windows side reaches the default `localhost` link.
- `start` replaces any server already running, so one call switches projects. Other flags: `--port`, `--idle-minutes` (default 240; it exits by itself after that long without a browser request).
- Give James the printed `url`. Link straight to a diagram with `<url>edit?file=<path relative to --dir>`; a path that doesn't exist yet opens a blank diagram that is created on first Save.
- Run `stop` when the session's diagram work is done.

## Taking turns

The file on disk is the shared state. The page saves only when James presses Save (Ctrl+S), and it polls the file every 2 s.

1. **Before you edit an existing diagram**, ask James to save, then read the file. (A new diagram has nothing to save: write it, then give him the link.) If he changed it since your last turn, say in a line or two what he changed (added, moved, relabelled, deleted), because that is his half of the conversation.
2. **Edit** following `reference/format.md`.
3. **Tell him** what you changed. His page reloads by itself when he has no unsaved edits.
4. If he had unsaved edits when you wrote, his page shows a banner instead: Reload takes your version, Save as copy keeps his as `<name>-mine.drawio`. If a `-mine` file appears, read both and merge them into the original yourself, then delete the copy once he agrees.

Before writing or editing any `.drawio` XML, read [`reference/format.md`](reference/format.md).

## In brainstorming

This canvas is the editable form of the brainstorming skill's visual companion. When a flow, sequence of steps, set of states, or structure comes up, offer to sketch it on the canvas instead of describing it, in a message of its own. When he has already asked for a diagram, skip the offer and sketch. Then:

- Sketch the current understanding: rough, labelled, few shapes. Put each open question or guess in a yellow note shape beside the step it concerns, so he can see what to correct.
- Read his edits as answers. A deleted box is a rejected step; a new arrow is a dependency he cares about. Confirm what you read before building on it.
- Decisions belong in the spec or design doc; the diagram illustrates them. When you next write that doc, link the diagram's path from it.
