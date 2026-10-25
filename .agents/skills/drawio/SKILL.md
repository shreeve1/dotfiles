---
name: drawio
description: Shared draw.io canvas that James edits in a browser while you edit the same .drawio file on disk. Use when James asks to talk about or brainstorm a subject with this skill (draw a seed diagram first); when planning or brainstorming a flow, workflow, process, agent or bot design, or system structure with James; when he asks for a diagram or flowchart he can edit himself; when starting, stopping or checking the draw.io server; or when reading or editing any .drawio file.
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

```sh
node <skill-dir>/scripts/drawio.mjs start --dir <project root>
node <skill-dir>/scripts/drawio.mjs status
node <skill-dir>/scripts/drawio.mjs stop
```

- Default bind is `127.0.0.1:8740`: fine when James's browser runs on the same machine (wrk desktop, surftop).
- When his browser is on another machine (a headless host like aidev), bind the NetBird IP: `--host <ip>`. aidev is `100.95.230.15`; get any host's IP with `netbird status` or from the dotfiles `AGENTS.md` table. Pass `--url-host <name>` if he prefers a name in the link.
- WSL on wrk: a browser on wrk's Windows side reaches the default `localhost` link.
- Run `status` before `start`. `start` replaces the running server, and another session may be using it: if it serves a different folder, ask James before replacing it (any tab open on the old folder switches saving off). Other flags: `--port`, `--idle-minutes` (default 240; it exits by itself after that long without a browser request).
- Give James the printed `url`. Link straight to a diagram with `<url>edit?file=<path relative to --dir>`; a path that doesn't exist yet opens a blank diagram that is created on first Save.
- Run `stop` when the session's diagram work is done.

## Taking turns

The file on disk is the shared state. The page saves only when James presses Save (Ctrl+S), and it polls the file every 2 s.

1. **Before you edit an existing diagram**, ask James to save, then read the file. (A new diagram has nothing to save: write it, then give him the link.) If he changed it since your last turn, say in a line or two what he changed (added, moved, relabelled, deleted), because that is his half of the conversation.
2. **Edit** following `reference/format.md`.
3. **Tell him** what you changed. His page reloads by itself when he has no unsaved edits.
4. If he had unsaved edits when you wrote, his page shows a banner instead: Reload takes your version, Save as copy keeps his as `<name>-mine.drawio`. His tab then edits the `-mine` copy. Read both, merge into the original, give him the original's link, and delete the copy once he has switched back and agrees.

Before writing or editing any `.drawio` XML, read [`reference/format.md`](reference/format.md).

## Kick-off: "let's talk about X and brainstorm"

When James invokes this skill along with a subject to talk about, invoking the skill means yes to the canvas. Your first message comes with a seed diagram, so he has something to react to from the start:

1. **Load the brainstorming skill** and follow it for the conversation. This section replaces its visual companion offer; everything else in that skill still applies.
2. **Look before you draw.** Read what the subject points at: the plan, spec, code, notes or earlier conversation it names or that obviously relates to it. Stop once you can sketch how it works today, or what he seems to want. When there is little or nothing to read, seed from the subject alone: a topic map of the usual parts of such a thing, mostly `?` labels, is still a better start than a blank page.
3. **Pick the shape** that fits the subject:
   - **Flow** (steps, a process, a pipeline, a bot or agent loop, a request path): a rough flowchart of what you know.
   - **Structure** (a system, its parts and how they connect): boxes for the parts, arrows for the connections.
   - **Topic map** (anything still fuzzy: an idea, a decision, a problem): the subject in the centre, branches for the parts, goals, constraints and options you found or he named.
4. **Seed it:** 5 to 12 shapes. Use his words for labels. Anything you filled in yourself ends its label with a question mark after a space ("Agent triages ?"). Add 2 to 4 yellow notes (200×80) with the open questions whose answers would change the diagram most, each placed next to the part it concerns. Put it where the placement rules above say, named after the subject.
5. **Serve it:** `status`, then `start` if needed, and check the XML.
6. **First message:** the direct link; one or two lines on what you drew and what you based it on; then the brainstorming skill's first message (a one-line subject counts as "they haven't said what they want", even when the files you read fill in a lot), ending with its single question. Make that question one the canvas can answer too: "fix it in the text or on the diagram, whichever is quicker."

From then on, follow **Taking turns** and the rules below.

## In brainstorming

This canvas is the editable form of the brainstorming skill's visual companion. When a flow, sequence of steps, set of states, or structure comes up, offer to sketch it on the canvas instead of describing it, in a message of its own. When he has already asked for a diagram, or opened with the kick-off above, skip the offer and sketch. Then:

- Sketch the current understanding: rough, labelled, few shapes. Put each open question or guess in a yellow note shape beside the step it concerns, so he can see what to correct.
- Keep the diagram in step with the conversation: when he settles something in text, update the canvas in the same turn and say so.
- Read his edits as answers. A deleted box is a rejected step; a new arrow is a dependency he cares about. Confirm what you read before building on it.
- Decisions belong in the spec or design doc; the diagram illustrates them. When you next write that doc, link the diagram's path from it.
