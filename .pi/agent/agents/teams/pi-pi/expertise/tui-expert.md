# TUI Expert — Core Knowledge

## Component Interface
- `render(width: number): string[]` — lines must not exceed width
- `handleInput?(data: string)` — keyboard input when focused
- `wantsKeyRelease?` — for Kitty protocol key release events
- `invalidate()` — clear cached render state

## Built-in Components (from @mariozechner/pi-tui)
- Text, Box, Container, Spacer, Markdown, Image, SelectList, SettingsList
- From @mariozechner/pi-coding-agent: DynamicBorder, BorderedLoader, CustomEditor

## Input Architecture (Critical)
### Full Pipeline
```
process.stdin (raw mode) → StdinBuffer (10ms batch splitting)
  → ProcessTerminal → TUI.handleInput(data) → focused component.handleInput(data)
```

### TUI.handleInput Flow
1. Run through `inputListeners` (extensions can intercept/consume/transform)
2. Consume terminal cell size responses
3. Global debug key (Shift+Ctrl+D)
4. Check overlay visibility
5. Forward to `focusedComponent.handleInput(data)` (filter key releases unless wantsKeyRelease)
6. Call `requestRender()` after handling

### CustomEditor.handleInput Flow (during agent execution)
1. Check extension shortcuts (`onExtensionShortcut`)
2. Check paste image keybinding
3. Check `app.interrupt` (escape) — if autocomplete NOT active, calls `onEscape()`
4. Check `app.exit` (ctrl+d) — only when editor empty
5. Check all other app action handlers
6. Fall through to parent Editor for text editing

### Escape Key During Agent Execution
- `defaultEditor.onEscape` is dynamically replaced based on context:
  - **Default/streaming**: calls `restoreQueuedMessagesToEditor({abort: true})` → `agent.abort()`
  - **Compaction**: calls `session.abortCompaction()`
  - **Retry**: calls `session.abortRetry()`
- Pattern: save previous handler → install new → restore on completion

### Abort Chain
```
onEscape → agent.abort() → AbortController.abort()
  → signal propagates to agentLoop (streamAssistantResponse, executeToolCalls)
  → agent_end event with stopReason: "aborted"
  → InteractiveMode.handleEvent cleans up UI
```

## Non-Blocking Architecture
- stdin events are async (Node event loop)
- TUI handleInput is sync per keystroke (fast)
- Agent execution is all async/await — never blocks event loop
- requestRender() uses process.nextTick()
- Main loop `getUserInput()` → `session.prompt()` doesn't block input processing

## Extension Input Injection Points
1. `ctx.ui.onTerminalInput(handler)` — global TUI input listener, can consume/transform
2. `CustomEditor.onExtensionShortcut` — checked first in editor handleInput
3. `defaultEditor.onEscape` replacement — context-specific escape behavior
4. `BorderedLoader` pattern — escape → onAbort, provides AbortSignal

## Key Rules
1. Always use theme from callback — not imported directly
2. Always type DynamicBorder color param: `(s: string) =>`
3. Call `tui.requestRender()` after state changes in handleInput
4. Return `{ render, invalidate, handleInput }` for custom components
5. Cache rendered output with `cachedWidth/cachedLines` pattern
6. Invalidate must rebuild themed content (not just clear cache)

## Theming in Components
- `theme.fg(color, text)` for foreground
- `theme.bg(color, text)` for background  
- `theme.bold(text)` for bold
- `getMarkdownTheme()` for Markdown components

## Focusable Interface (IME Support)
- `CURSOR_MARKER` for hardware cursor positioning
- Container propagation for embedded inputs
- TUI sets `focused = true` and scans for marker

## Keyboard Input API
- `matchesKey(data, Key.up/down/enter/escape/etc.)`
- `Key.ctrl("c")`, `Key.shift("tab")`, `Key.alt("left")`
- String format: `"enter"`, `"ctrl+c"`, `"shift+tab"`

## Width Utilities
- `visibleWidth(str)` — display width ignoring ANSI codes
- `truncateToWidth(str, width, ellipsis?)` — truncate with ellipsis
- `wrapTextWithAnsi(str, width)` — word wrap preserving ANSI codes

## UI Patterns
1. Selection Dialog: SelectList + DynamicBorder + ctx.ui.custom()
2. Async with Cancel: BorderedLoader with signal
3. Settings/Toggles: SettingsList + getSettingsListTheme()
4. Status Indicator: ctx.ui.setStatus(key, styledText)
5. Widgets: ctx.ui.setWidget(key, lines | factory, { placement })
6. Custom Footer: ctx.ui.setFooter(factory)
7. Custom Editor: extend CustomEditor, ctx.ui.setEditorComponent(factory)
8. Overlays: ctx.ui.custom(component, { overlay: true, overlayOptions })

## Overlay System
- `ctx.ui.custom(factory, { overlay: true })` renders on top of existing content
- `overlayOptions`: width, minWidth, maxHeight, anchor, offsetX/Y, row, col, margin, visible()
- OverlayHandle: hide(), setHidden(), isHidden(), focus(), unfocus(), isFocused()
- Overlays are disposed on close — create fresh instances

## Terminal Protocol
- Kitty keyboard protocol (flags 1+2+4) for unambiguous key events
- Fallback: xterm modifyOtherKeys mode 2
- StdinBuffer handles batched input splitting with 10ms timeout
- Bracketed paste mode for paste detection
- drainInput() on shutdown to prevent key release leaking to parent shell
