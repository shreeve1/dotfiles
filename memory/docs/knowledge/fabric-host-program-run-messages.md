---
title: Fabric Host Program Runs Post to Chat and Context
summary: pi-fabric 0.131.4 shows every host program run in chat and sends it to the model; fabric-auto-start hides its own setup runs.
type: doc
status: promoted
created: 2026-11-03
updated: 2026-11-03
topics: [knowledge]
---

pi-fabric 0.131.4 posts every program run through the `pi-fabric:program:run:v1` event as a `pi-fabric-program-run` custom message with `display: true` (`dist/programs/host.js`); it has no quiet option. pi turns custom messages into user messages for the model, so each run also costs context.

`.pi/agent/extensions/fabric-auto-start.ts` runs its helper setup this way on every settle. It recognises its own runs by `details.sha256` (sha256 of its control program), hides successful ones with `registerMessageRenderer` and drops them in a `context` handler. Failed runs stay visible. Any other extension using host program runs needs the same treatment, or upstream needs a quiet flag.
