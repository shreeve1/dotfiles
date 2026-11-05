---
title: Pi Slash Commands Run Before Input Events
summary: Pi 1.5.0 dispatches registered slash commands before input handlers; command handlers receive no input-origin field.
type: doc
status: promoted
created: 2026-11-05
updated: 2026-11-05
topics: [knowledge]
---

In Pi 1.5.0, `AgentSession.prompt()` tries `_tryExecuteExtensionCommand(text)` before `_runInputHandlers()`. A handled registered slash command returns immediately, so no `input` event is emitted for it. Confirmed against the installed `dist/core/agent-session.js` implementation.

An extension cannot require its `input` handler to set an operator-origin flag before a registered slash-command handler: real dispatch never sets that flag. Tests that manually emit `input` before invoking the command do not model Pi's ordering. `ExtensionCommandContext` has no input-source field; removing the gate is not evidence of operator origin. Approval-sensitive command behavior needs a separately verified confirmation boundary and a test through real dispatch.

## Related

- [Fabric host program messages](memory/docs/knowledge/fabric-host-program-run-messages.md): another Pi/Fabric lifecycle detail that custom helper extensions must account for.
