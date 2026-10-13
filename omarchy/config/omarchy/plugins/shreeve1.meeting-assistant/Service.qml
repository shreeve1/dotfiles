import QtQuick
import Quickshell
import Quickshell.Hyprland
import Quickshell.Io
import Quickshell.Wayland
import qs.Commons

// Scope, not Item: Item already owns a `state` property.
Scope {
  id: service

  // Injected by omarchy-shell. Third-party services receive the capability
  // facade, whose barConfig is a live copy of shell.json's bar subtree.
  property var shell: null

  readonly property string pluginId: "shreeve1.meeting-assistant"
  readonly property int maxCards: 6

  readonly property string pausedNotice: "Paused: new call text is not researched or attached. Earlier cards and your chat still go to Ask."
  readonly property var askStates: ["stopped", "starting", "idle", "busy", "error"]
  readonly property var replyStatuses: ["completed", "aborted", "error", "no_response"]

  property string state: "unavailable"
  property string meeting: ""
  property string detail: ""
  property int activeRuns: 0
  property bool tearingDown: false

  property bool askOpen: false
  property string askMonitor: ""
  property string askState: "stopped"
  property int askTurn: -1
  property string askDetail: ""
  property string askDraft: ""
  property string askError: ""
  property string retryEntryId: ""
  property int errorSeq: 0

  // `cards` is the passive stack on the closed Overlay; dismissAll empties
  // only this. `timeline` keeps everything the Ask box shows.
  readonly property ListModel cards: ListModel {}
  readonly property ListModel timeline: ListModel {}

  readonly property string helperPath: String(Qt.resolvedUrl("bin/meeting-assistant")).replace(/^file:\/\//, "")

  // A service has no `settings` injection point; the bar-widget entry's
  // inline settings are the only per-plugin settings, so read them from the
  // layout entry in shell.barConfig.
  readonly property var settings: {
    var layout = shell && shell.barConfig ? shell.barConfig.layout : null
    var sections = ["left", "center", "right"]
    for (var s = 0; layout && s < sections.length; s++) {
      var entries = layout[sections[s]] || []
      for (var i = 0; i < entries.length; i++) {
        if (entries[i] && typeof entries[i] === "object" && entries[i].id === service.pluginId) return entries[i]
      }
    }
    return ({})
  }

  function setting(name, fallback) {
    var value = settings ? settings[name] : undefined
    return value === undefined || value === null ? fallback : value
  }

  readonly property string overlayMonitor: String(setting("overlayMonitor", ""))
  readonly property string focusedMonitorName: Hyprland.focusedMonitor ? String(Hyprland.focusedMonitor.name || "") : ""
  readonly property string chosenMonitor: overlayMonitor !== "" ? overlayMonitor : focusedMonitorName
  // While the box is open the Overlay stays on the monitor that was focused
  // at open, whatever overlayMonitor says, so Esc returns focus to the right window.
  readonly property string overlayScreenName: askOpen ? askMonitor : chosenMonitor
  readonly property real cardLifetimeMs: Math.max(10, Math.min(600, Number(setting("cardLifetimeSec", 45)) || 45)) * 1000

  // Same width as CardView.implicitWidth, so the open surface lines up with the card column.
  readonly property real askWidth: Style.space(380)
  readonly property real askMaxHeight: Style.space(520)

  readonly property string barPosition: shell && shell.bar ? String(shell.bar.position || "top") : "top"
  readonly property int barClearance: (shell && shell.bar && !shell.bar.barHidden ? Math.max(0, shell.bar.barSize) : Style.bar.sizeHorizontal) + Style.gapsOut
  readonly property int topMargin: barPosition === "top" ? barClearance : Style.gapsOut
  readonly property int rightMargin: barPosition === "right" ? barClearance : Style.gapsOut

  // The Ask flags are passed only when the setting has a value; the helper owns their defaults.
  readonly property var helperArgs: {
    var args = [
      "--model", String(setting("model", "openrouter/deepseek/deepseek-v4-flash-0731")),
      "--thinking", String(setting("thinking", "low")),
      "--concurrency", String(setting("concurrency", 2))
    ]
    var optional = [["--ask-model", "askModel"], ["--ask-thinking", "askThinking"], ["--ask-skill", "askSkill"], ["--persona", "personaPath"]]
    for (var i = 0; i < optional.length; i++) {
      var value = String(setting(optional[i][1], "")).trim()
      if (value === "") continue
      if (optional[i][0] === "--persona" && /^~(\/|$)/.test(value)) value = Quickshell.env("HOME") + value.slice(1)
      args.push(optional[i][0], value)
    }
    return args
  }
  readonly property string helperArgsKey: JSON.stringify(helperArgs)
  property string launchedArgsKey: ""

  function send(message) {
    if (!helper.running) return false
    var payload = typeof message === "string" ? { cmd: message } : message
    helper.write(JSON.stringify(payload) + "\n")
    return true
  }

  function pause() { send("pause") }
  function resume() { send("resume") }
  function togglePause() { send(state === "paused" ? "resume" : "pause") }
  function dismissAll() { cards.clear() }

  function startHelper() {
    launchedArgsKey = helperArgsKey
    helper.running = true
  }

  // The helper reads its flags once at launch, so a changed setting needs a
  // restart. Wait for idle so no turn or research run is cut off, and while
  // paused so a restart never silently resumes research.
  function restartIfSettingsChanged() {
    if (tearingDown || !helper.running || launchedArgsKey === helperArgsKey) return
    if (askState === "busy" || askState === "starting" || activeRuns > 0 || state === "paused") return
    send("quit")
  }

  onHelperArgsKeyChanged: restartIfSettingsChanged()
  onAskStateChanged: restartIfSettingsChanged()
  onActiveRunsChanged: restartIfSettingsChanged()
  onStateChanged: restartIfSettingsChanged()

  function toggleAsk() {
    if (askOpen) {
      closeAsk()
      return "closed"
    }
    askMonitor = focusedMonitorName !== "" ? focusedMonitorName : (Quickshell.screens.length > 0 ? String(Quickshell.screens[0].name) : "")
    askOpen = true
    ensureAskStarted()
    return "open"
  }

  function closeAsk() { askOpen = false }

  // The one place that decides what Esc does in the Ask box. Stop first
  // while a turn runs, then close: the proposed default, not confirmed.
  function askEscape() {
    if (askState === "busy") stopAsk()
    else closeAsk()
  }

  // ask_open is idempotent in the helper, so it is sent on every open and
  // before a send to a stopped agent (after `new` the agent restarts lazily).
  function ensureAskStarted() {
    if (!helper.running) {
      addError("The Meeting Assistant helper is not running.", false, "")
      return false
    }
    send({ cmd: "ask_open" })
    return true
  }

  function ask(text) {
    var message = String(text)
    if (message.trim() === "") return false
    if (!helper.running) {
      addError("The Meeting Assistant helper is not running.", false, "")
      return false
    }
    if (askState === "stopped") send({ cmd: "ask_open" })
    return send({ cmd: "ask", text: message })
  }

  function stopAsk() { send({ cmd: "stop" }) }

  function retryAsk() {
    retryEntryId = ""
    send({ cmd: "retry" })
  }

  function newConversation() {
    if (!helper.running) {
      addError("The Meeting Assistant helper is not running.", false, "")
      return
    }
    send({ cmd: "new" })
  }

  function handleEvent(event) {
    switch (event.type) {
    case "status":
      var valid = ["idle", "listening", "researching", "paused", "error", "unavailable"]
      state = valid.indexOf(event.state) !== -1 ? event.state : "error"
      meeting = event.meeting ? String(event.meeting) : ""
      detail = event.detail ? String(event.detail) : ""
      activeRuns = Number(event.active_runs) || 0
      break
    case "card": addCard(event); break
    case "timeline": setTimeline(event.entries); break
    case "divider": appendEntry(Object.assign({ kind: "divider" }, event), false); break
    case "ask_status": setAskStatus(event); break
    case "ask_user": addAskUser(event); break
    case "ask_delta": addAskDelta(event); break
    case "ask_tool": addAskTool(event); break
    case "ask_queued": setQueued(event); break
    case "ask_restored": restoreQueued(event.messages); break
    case "ask_end": endAsk(event); break
    case "ask_error":
      askError = String(event.message || "Ask failed")
      addError(askError, event.retry === true, event.retry_preview ? String(event.retry_preview) : "")
      break
    case "error":
      addError(String(event.message || "Meeting Assistant error"), false, "")
      break
    }
  }

  function nowIso() { return new Date().toISOString() }

  // ListModel needs every role present on the first row, so each row carries all of them.
  // `live` marks rows made by events of this helper run: turn numbers restart
  // at 1 on every run, so a restored row must never be matched by turn.
  function entryRow(kind, fields) {
    var row = {
      entryId: "", kind: kind, at: "", turn: -1, text: "", status: "", live: false,
      question: "", answer: "", sourcesJson: "[]", lagMs: -1,
      event: "", toolName: "", phase: "", queued: false,
      message: "", retry: false, retryPreview: ""
    }
    for (var key in fields) row[key] = fields[key]
    return row
  }

  function timelineRow(e, live) {
    if (!e || typeof e !== "object" || !e.id) return null
    var turn = typeof e.turn === "number" ? e.turn : -1
    var at = String(e.at || e.created_at || "")
    if (e.kind === "card") {
      if (!e.question || !e.answer) return null
      return entryRow("card", {
        entryId: String(e.id), at: at,
        question: String(e.question), answer: String(e.answer),
        sourcesJson: JSON.stringify(Array.isArray(e.sources) ? e.sources : []),
        lagMs: typeof e.lag_ms === "number" ? e.lag_ms : -1
      })
    }
    if (e.kind === "divider") {
      if (e.event !== "meeting_start" && e.event !== "meeting_end") return null
      return entryRow("divider", { entryId: String(e.id), at: at, event: e.event })
    }
    if (e.kind === "user") return entryRow("user", { entryId: String(e.id), at: at, turn: turn, text: String(e.text || ""), live: live })
    if (e.kind === "reply") {
      return entryRow("reply", {
        entryId: String(e.id), at: at, turn: turn, text: String(e.text || ""),
        status: replyStatuses.indexOf(e.status) !== -1 ? e.status : "completed", live: live
      })
    }
    return null
  }

  function appendEntry(e, live) {
    var row = timelineRow(e, live)
    if (!row) return
    for (var i = timeline.count - 1; i >= 0 && i >= timeline.count - 50; i--) {
      if (timeline.get(i).entryId === row.entryId) return
    }
    timeline.append(row)
  }

  function setTimeline(entries) {
    timeline.clear()
    retryEntryId = ""
    askError = ""
    var items = Array.isArray(entries) ? entries : []
    for (var i = 0; i < items.length; i++) appendEntry(items[i], false)
  }

  function setAskStatus(event) {
    askState = askStates.indexOf(event.state) !== -1 ? event.state : "error"
    askTurn = typeof event.turn === "number" ? event.turn : -1
    askDetail = event.detail ? String(event.detail) : ""
    if (askState === "error" && askDetail !== "") askError = askDetail
  }

  function addAskUser(event) {
    if (!event.id) return
    askError = ""
    retryEntryId = ""
    timeline.append(entryRow("user", {
      entryId: String(event.id), at: String(event.at || nowIso()),
      turn: Number(event.turn) || -1, text: String(event.text || ""), queued: event.queued === true, live: true
    }))
  }

  function findLive(kind, turn) {
    for (var i = timeline.count - 1; i >= 0; i--) {
      var row = timeline.get(i)
      if (row.live && row.kind === kind && row.turn === turn) return i
    }
    return -1
  }

  // Tool lines can fall between two stretches of one reply, so a delta
  // extends the last row only when that row is this turn's reply.
  function addAskDelta(event) {
    var turn = Number(event.turn)
    var text = String(event.text || "")
    if (text === "") return
    var last = timeline.count - 1
    var row = last >= 0 ? timeline.get(last) : null
    if (row && row.live && row.kind === "reply" && row.turn === turn) {
      timeline.setProperty(last, "text", row.text + text)
      if (row.status !== "streaming") timeline.setProperty(last, "status", "streaming")
      return
    }
    timeline.append(entryRow("reply", { entryId: "reply-" + turn + "-" + timeline.count, at: nowIso(), turn: turn, text: text, status: "streaming", live: true }))
  }

  function addAskTool(event) {
    var turn = Number(event.turn)
    var name = String(event.name || "tool")
    if (event.phase === "end") {
      for (var i = timeline.count - 1; i >= 0; i--) {
        var row = timeline.get(i)
        if (row.live && row.kind === "tool" && row.turn === turn && row.toolName === name && row.phase === "start") {
          timeline.setProperty(i, "phase", "end")
          return
        }
      }
    }
    timeline.append(entryRow("tool", { entryId: "tool-" + turn + "-" + timeline.count, at: nowIso(), turn: turn, toolName: name, phase: event.phase === "end" ? "end" : "start", live: true }))
  }

  function setQueued(event) {
    var turn = Number(event.turn)
    var i = findLive("user", turn)
    if (i >= 0) timeline.setProperty(i, "queued", event.queued === true)
    else if (event.queued === true) timeline.append(entryRow("user", { entryId: "queued-" + turn, at: nowIso(), turn: turn, text: String(event.text || ""), queued: true, live: true }))
  }

  function restoreQueued(messages) {
    var list = Array.isArray(messages) ? messages : []
    var texts = []
    for (var m = 0; m < list.length; m++) {
      if (!list[m] || typeof list[m].text !== "string") continue
      texts.push(list[m].text)
      if (typeof list[m].turn !== "number") continue
      var i = findLive("user", list[m].turn)
      if (i >= 0) timeline.remove(i)
    }
    if (texts.length === 0) return
    var restored = texts.join("\n\n")
    askDraft = askDraft !== "" ? restored + "\n\n" + askDraft : restored
  }

  // ask_end text is the whole reply. With one reply row it is authoritative;
  // with several (tool lines in between) the rows already hold the pieces.
  function endAsk(event) {
    var turn = Number(event.turn)
    var status = replyStatuses.indexOf(event.status) !== -1 ? event.status : "error"
    var text = String(event.text || "")
    var rows = []
    for (var i = 0; i < timeline.count; i++) {
      var row = timeline.get(i)
      if (row.live && row.kind === "reply" && row.turn === turn) rows.push(i)
    }
    if (rows.length === 0) {
      if (text !== "" || status !== "completed") {
        timeline.append(entryRow("reply", { entryId: "reply-" + turn + "-" + timeline.count, at: nowIso(), turn: turn, text: text, status: status, live: true }))
      }
      return
    }
    for (var j = 0; j < rows.length; j++) timeline.setProperty(rows[j], "status", j === rows.length - 1 ? status : "completed")
    if (rows.length === 1 && text !== "") timeline.setProperty(rows[0], "text", text)
  }

  function addError(message, retry, retryPreview) {
    var last = timeline.count > 0 ? timeline.get(timeline.count - 1) : null
    if (last && last.kind === "error" && last.message === message) {
      if (retry) {
        timeline.setProperty(timeline.count - 1, "retry", true)
        timeline.setProperty(timeline.count - 1, "retryPreview", retryPreview)
        retryEntryId = last.entryId
      }
      return
    }
    errorSeq += 1
    var id = "error-" + errorSeq
    timeline.append(entryRow("error", { entryId: id, at: nowIso(), message: message, retry: retry, retryPreview: retryPreview, live: true }))
    if (retry) retryEntryId = id
  }

  function addCard(event) {
    if (!event.id || !event.question || !event.answer) return
    cards.insert(0, {
      cardId: String(event.id),
      question: String(event.question),
      answer: String(event.answer),
      sourcesJson: JSON.stringify(Array.isArray(event.sources) ? event.sources : []),
      lagMs: typeof event.lag_ms === "number" ? event.lag_ms : -1,
      expiresAt: Date.now() + cardLifetimeMs
    })
    while (cards.count > maxCards) cards.remove(cards.count - 1)
    appendEntry(Object.assign({ kind: "card" }, event), false)
  }

  function expireCards() {
    var now = Date.now()
    for (var i = cards.count - 1; i >= 0; i--) {
      if (cards.get(i).expiresAt <= now) cards.remove(i)
    }
  }

  Component.onCompleted: startHelper()
  Component.onDestruction: {
    tearingDown = true
    restartTimer.stop()
  }

  Process {
    id: helper
    command: ["setpriv", "--pdeathsig", "TERM", service.helperPath].concat(service.helperArgs)
    stdinEnabled: true
    onExited: {
      service.state = "unavailable"
      service.detail = "helper exited"
      service.activeRuns = 0
      service.askState = "stopped"
      service.askTurn = -1
      service.askDetail = ""
      if (!service.tearingDown) restartTimer.restart()
    }
    stdout: SplitParser {
      onRead: function(data) {
        var event
        try { event = JSON.parse(data) } catch (e) { return }
        if (event && typeof event === "object" && !Array.isArray(event)) service.handleEvent(event)
      }
    }
  }

  Timer {
    id: restartTimer
    interval: 1000
    repeat: false
    onTriggered: if (!service.tearingDown && !helper.running) service.startHelper()
  }

  Timer {
    interval: 250
    repeat: true
    running: service.cards.count > 0
    onTriggered: service.expireCards()
  }

  IpcHandler {
    target: "meeting-assistant"

    function dismissAll(): string {
      service.dismissAll()
      return "ok"
    }

    function pause(): string {
      service.pause()
      return "ok"
    }

    function resume(): string {
      service.resume()
      return "ok"
    }

    function toggle(): string {
      service.togglePause()
      return "ok"
    }

    function toggleAsk(): string {
      return service.toggleAsk()
    }

    function status(): string {
      return JSON.stringify({
        state: service.state,
        meeting: service.meeting,
        detail: service.detail,
        activeRuns: service.activeRuns,
        cards: service.cards.count,
        askOpen: service.askOpen,
        askState: service.askState,
        askError: service.askError
      })
    }
  }

  // One window per monitor, shown only on the monitor the Overlay belongs to.
  // Closed: sized to the card column, input region empty (click-through), no
  // keyboard focus. Open: a fixed-size surface that takes keyboard focus; the
  // Timeline scrolls inside it, so streaming text never resizes the surface.
  // The size changes only on open and close.
  Variants {
    model: Quickshell.screens

    PanelWindow {
      id: overlay
      required property var modelData
      readonly property string screenName: String(modelData.name)
      readonly property bool hosting: service.askOpen && service.askMonitor === screenName
      readonly property real askHeight: Math.round(Math.max(Style.space(180), Math.min(service.askMaxHeight, modelData.height * 0.4)))
      property bool focusPrimed: false

      screen: modelData
      visible: service.overlayScreenName === screenName && (service.cards.count > 0 || service.askOpen)

      WlrLayershell.namespace: "omarchy-meeting-assistant"
      WlrLayershell.layer: WlrLayer.Overlay
      // Hyprland does not hand focus to an already-mapped layer surface that
      // flips from None to OnDemand, so prime with Exclusive first (the
      // sequence in Ui/KeyboardPanel.qml). Only `hosting` and `focusPrimed`
      // drive this, so a card arriving mid-typing never touches it.
      WlrLayershell.keyboardFocus: hosting
        ? (focusPrimed ? WlrKeyboardFocus.OnDemand : WlrKeyboardFocus.Exclusive)
        : WlrKeyboardFocus.None
      exclusionMode: ExclusionMode.Ignore
      color: "transparent"
      anchors { top: true; right: true }
      margins { top: service.topMargin; right: service.rightMargin }
      implicitWidth: hosting ? service.askWidth : cardColumn.implicitWidth
      implicitHeight: hosting ? askHeight : cardColumn.implicitHeight
      // An empty region is click-through; open, the region is the whole surface.
      mask: Region {
        width: overlay.hosting ? overlay.width : 0
        height: overlay.hosting ? overlay.height : 0
      }

      function beginFocusPrime() {
        if (hosting && backingWindowVisible) primeTimer.restart()
      }

      onHostingChanged: {
        focusPrimed = false
        if (hosting) beginFocusPrime()
        else primeTimer.stop()
      }
      onBackingWindowVisibleChanged: beginFocusPrime()

      Timer {
        id: primeTimer
        interval: 75
        onTriggered: if (overlay.hosting) overlay.focusPrimed = true
      }

      // Click-away without a full-screen dismiss surface: a full-screen
      // surface on this namespace would black out a screen share.
      HyprlandFocusGrab {
        active: overlay.hosting && overlay.backingWindowVisible
        windows: [overlay]
        onCleared: service.closeAsk()
      }

      Column {
        id: cardColumn
        visible: !overlay.hosting
        anchors.top: parent.top
        anchors.right: parent.right
        spacing: Style.space(8)

        Repeater {
          model: service.cards

          CardView {
            id: card
            required property var model
            question: model.question
            answer: model.answer
            sources: JSON.parse(model.sourcesJson)
            lagMs: model.lagMs < 0 ? null : model.lagMs
            expiresAt: model.expiresAt
          }
        }
      }

      Loader {
        anchors.fill: parent
        active: overlay.hosting
        sourceComponent: AskBox {
          assistant: service
        }
      }
    }
  }
}
