import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import QtQuick.Effects
import Quickshell
import Quickshell.Io
import qs.Commons
import qs.Ui
import "Model.js" as Model

Panel {
  id: root
  moduleName: "meviusisback.agent-orchestr"
  ipcTarget: "meviusisback.agent-orchestr"
  manageIpc: false
  onOpenedChanged: {
    if (!root.opened) {
      if (root.replyCardId) root.cancelReply()
      root.selectedIndex = -1
    }
  }

  // Bar slot sizing driven by activeItem
  implicitWidth: root.barShowsText ? Math.max(dataButton.implicitWidth, Style.space(130)) : Style.bar.iconSlot
  implicitHeight: Style.bar.iconSlot

  readonly property color foreground: bar ? bar.foreground : Color.foreground
  readonly property color dim: Qt.darker(foreground, 1.6)
  readonly property color urgent: bar ? bar.urgent : Color.urgent
  readonly property color accent: Color.accent
  readonly property string fontFamily: bar ? bar.fontFamily : Style.font.family
  readonly property color track: Style.selectedFillFor(foreground, Color.accent)

  // Configuration settings
  readonly property int refreshIntervalSec: Math.max(1, Number(root.setting("refreshIntervalSec", 3)) || 3)
  readonly property string barDisplay: String(root.setting("barDisplay", "Icon"))
  readonly property bool showIdleInBar: Boolean(root.setting("showIdleInBar", false))
  readonly property int maxTaskLength: Math.max(20, Number(root.setting("maxTaskLength", 45)) || 45)
  // Privacy option for screen-sharing: when on, no agent-supplied prompt/task
  // text is rendered anywhere in the widget (bar ticker or card), only counts,
  // status words and the repo breadcrumb. The collector still returns the text.
  readonly property bool privacyHidePrompts: Boolean(root.setting("privacyHidePrompts", false))

  readonly property bool barShowsText: barDisplay.toLowerCase() === "status" || barDisplay.toLowerCase() === "compact"

  // Live state
  property var rawData: ({
    ok: false,
    connected: false,
    summary: { total: 0, working: 0, idle: 0, waiting: 0, active_agents: [], headline: "Loading…" },
    agents: [],
    workspaces: []
  })

  property var summary: rawData && rawData.summary ? rawData.summary : ({ total: 0, working: 0, idle: 0, waiting: 0, headline: "Offline" })
  property var agents: rawData && rawData.agents ? rawData.agents : []
  property bool loading: false
  property string selectedFilter: "all" // "all" | "working" | "idle"
  property string lastFocusedPane: ""
  property string replyCardId: ""
  property string replyState: "idle" // idle | sending | accepted | failed
  property string replyError: ""
  property string replyPayload: ""
  property string replyDraft: ""
  // Keyboard navigation: -1 means no card is highlighted yet (first arrow key
  // press selects the first card rather than moving from it).
  property int selectedIndex: -1
  property bool replyFieldFocused: false

  // Ordered filter ids matching the visible tab row, used for Left/Right
  // keyboard cycling between filters.
  readonly property var filterOrder: {
    var order = ["all", "working"]
    if (root.summary.completed > 0) order.push("completed")
    if (root.summary.waiting > 0) order.push("waiting")
    order.push("idle")
    return order
  }

  function clampSelection() {
    var n = (root.filteredAgents || []).length
    if (n === 0) { root.selectedIndex = -1; return }
    if (root.selectedIndex >= n) root.selectedIndex = n - 1
  }

  function moveSelection(delta) {
    var n = (root.filteredAgents || []).length
    if (n === 0) { root.selectedIndex = -1; return }
    if (root.selectedIndex < 0) {
      root.selectedIndex = delta > 0 ? 0 : n - 1
    } else {
      root.selectedIndex = Math.max(0, Math.min(n - 1, root.selectedIndex + delta))
    }
    if (agentListView) agentListView.positionViewAtIndex(root.selectedIndex, ListView.Contain)
  }

  function cycleFilter(delta) {
    var order = root.filterOrder
    var i = order.indexOf(root.selectedFilter)
    if (i < 0) i = 0
    root.selectedFilter = order[(i + delta + order.length) % order.length]
    root.selectedIndex = -1
  }

  function selectedAgent() {
    var list = root.filteredAgents || []
    if (root.selectedIndex < 0 || root.selectedIndex >= list.length) return null
    return list[root.selectedIndex]
  }

  // Enter on a highlighted card expands it: shows full prompt/activity detail
  // and, when the agent can accept a reply, opens the composer and focuses the
  // input. Enter again on the same card collapses it.
  function activateSelected() {
    var agent = root.selectedAgent()
    if (!agent) { root.moveSelection(1); return }
    var id = String(agent.pane_id || root.selectedIndex)
    if (root.replyCardId === id) { root.cancelReply(); return }
    root.replyCardId = id
    root.replyState = "idle"
    root.replyError = ""
    root.replyDraft = ""
  }

  function replyTarget(agent) {
    if (!agent || agent.can_reply !== true) return ""
    // pane_id is the backend's opaque, session/machine-qualified target. The
    // display-only reply_target is only the raw Herdr pane name.
    return String(agent.pane_id || "")
  }

  function replyAllowed(agent) {
    return Boolean(agent && agent.can_reply === true &&
      agent.status !== "blocked" && agent.status !== "waiting" &&
      agent.status !== "unreachable" && agent.status !== "stale")
  }

  function cancelReply() {
    root.replyCardId = ""
    root.replyState = "idle"
    root.replyError = ""
    root.replyDraft = ""
    root.replyFieldFocused = false
    // The reply TextField just lost focus; hand keyboard focus back to the
    // panel key catcher so arrow navigation and Enter work again without a
    // click. Deferred so it runs after the composer is hidden.
    Qt.callLater(function() { if (root.opened && keyCatcher) keyCatcher.forceActiveFocus() })
  }

  function submitReply(agent, text) {
    if (!replyAllowed(agent) || root.replyState === "sending" || !String(text || "").trim()) return
    var target = root.replyTarget(agent)
    if (!target) return
    root.replyDraft = String(text)
    root.replyPayload = JSON.stringify({ target_id: target, text: root.replyDraft })
    root.replyError = ""
    root.replyState = "sending"
    replyProc.running = true
  }

  function handleReplyResult(exitCode, output) {
    if (root.replyState !== "sending") return
    var result = null
    var bounded = String(output || "").substring(0, 16384)
    try { result = JSON.parse(bounded) } catch (e) { result = null }
    if (exitCode === 0 && result && result.ok === true) {
      root.replyState = "accepted"
      root.replyDraft = ""
      root.fetchStatus()
      return
    }
    root.replyState = "failed"
    root.replyError = result && result.message ? String(result.message).substring(0, 240) : "Reply failed; delivery was not retried."
  }

  readonly property var filteredAgents: {
    var list = root.agents || []
    if (root.selectedFilter === "working") {
      return list.filter(function(a) { return a.status === "working" })
    }
    if (root.selectedFilter === "completed") {
      return list.filter(function(a) { return a.status === "completed" || a.status === "done" })
    }
    if (root.selectedFilter === "waiting") {
      return list.filter(function(a) { return a.status === "waiting" })
    }
    if (root.selectedFilter === "idle") {
      return list.filter(function(a) { return a.status === "idle" || a.status === "error" })
    }
    return list
  }

  onFilteredAgentsChanged: root.clampSelection()

  function alpha(c, a) { return Qt.rgba(c.r, c.g, c.b, a) }

  function scriptPath() {
    return Qt.resolvedUrl("agent_ctl.py").toString().replace(/^file:\/\//, "")
  }

  function fetchStatus() {
    if (!fetchProc.running) {
      root.loading = true
      fetchProc.running = true
    }
  }

  function focusPane(paneId) {
    if (!paneId) return
    var agent = root.agents.find(function(a) { return a.pane_id === paneId })
    if (agent && agent.can_focus === false) return
    root.lastFocusedPane = paneId
    focusProc.command = ["python3", root.scriptPath(), "focus", paneId]
    focusProc.running = true
    root.close()
  }

  function killTarget(paneId) {
    if (!paneId) return
    killProc.command = ["python3", root.scriptPath(), "kill", paneId]
    killProc.running = true
  }

  function launchAgent(agentName) {
    launchProc.command = ["python3", root.scriptPath(), "launch", agentName || ""]
    launchProc.running = true
    root.close()
  }

  // Periodic status poll with fast live updates when popup is open or agents are active
  Timer {
    interval: {
      if (root.opened) return 2000
      if (root.summary.working > 0 || root.summary.waiting > 0) return 3000
      return Math.max(3000, root.refreshIntervalSec * 1000)
    }
    running: true
    repeat: true
    triggeredOnStart: true
    onTriggered: root.fetchStatus()
  }
  // Live pulsing animation for working and waiting agents
  property real pulseOpacity: 1.0
  SequentialAnimation on pulseOpacity {
    running: (root.summary.working > 0 || root.summary.waiting > 0)
    loops: Animation.Infinite
    NumberAnimation { to: 0.35; duration: 750; easing.type: Easing.InOutQuad }
    NumberAnimation { to: 1.0; duration: 750; easing.type: Easing.InOutQuad }
  }

  // Background processes
  Process {
    id: fetchProc
    // The payload is bounded inside agent_ctl.py (dump_status_json: agent cap
    // plus a hard byte ceiling) rather than by `python3 … | head -c`, so the
    // collector itself is Quickshell's direct child. That matters for the stall
    // timer below: terminating the process only signals the direct child, and a
    // shell wrapper would leave the real collector running and leaked.
    command: ["python3", root.scriptPath(), "status"]
    stdout: StdioCollector {
      waitForEnd: true
      onStreamFinished: {
        root.loading = false
        var output = text || ""
        if (output.length > 262144) {
          output = output.substring(0, 262144)
        }
        try {
          var data = JSON.parse(output)
          root.rawData = data
        } catch (e) {
          // ignore transient parse error
        }
      }
    }
    stderr: StdioCollector {
      waitForEnd: true
      onStreamFinished: root.loading = false
    }
  }

  // A collector tick that wedges (an unreadable or odd file in some agent's
  // session tree is the realistic case) must not leave the widget stuck on
  // "Loading…" forever: fetchStatus() no-ops while fetchProc.running, so a
  // Process that never exits can't be re-run. Give up on one that overstays,
  // exactly as the shell's own widgets do, and keep trying on the next tick.
  Timer {
    id: fetchStallTimer
    interval: 18000
    running: fetchProc.running
    repeat: true
    onTriggered: {
      if (fetchProc.running) {
        fetchProc.running = false
        root.loading = false
      }
    }
  }

  Process {
    id: focusProc
  }

  Process {
    id: killProc
    stdout: StdioCollector {
      waitForEnd: true
      onStreamFinished: root.fetchStatus()
    }
  }

  Process {
    id: launchProc
  }

  Process {
    id: replyProc
    command: ["python3", root.scriptPath(), "reply"]
    stdinEnabled: true
    stdout: StdioCollector { id: replyOut; waitForEnd: true }
    stderr: StdioCollector { id: replyErr; waitForEnd: true }
    onStarted: write(root.replyPayload + "\n")
    onExited: function(exitCode) {
      // The backend emits one bounded JSON object. Parse only after the process
      // exits so a partial line cannot be mistaken for an accepted reply.
      root.handleReplyResult(exitCode, replyOut.text)
    }
  }

  Timer {
    id: replyStallTimer
    interval: 20000
    running: replyProc.running
    repeat: false
    onTriggered: {
      if (replyProc.running) {
        replyProc.running = false
        root.replyState = "failed"
        root.replyError = "Reply timed out; delivery may be ambiguous. It was not retried."
      }
    }
  }

  IpcHandler {
    enabled: true
    target: root.ipcTarget
    function open(): void { root.open() }
    function close(): void { root.close() }
    function toggle(): void { root.toggle() }
    function refresh(): void { root.fetchStatus() }
    function focus(paneId: string): void { root.focusPane(paneId) }
    function kill(paneId: string): void { root.killTarget(paneId) }
  }

  IpcHandler {
    enabled: true
    target: "agent-orchestr"
    function open(): void { root.open() }
    function close(): void { root.close() }
    function toggle(): void { root.toggle() }
    function refresh(): void { root.fetchStatus() }
    function focus(paneId: string): void { root.focusPane(paneId) }
    function kill(paneId: string): void { root.killTarget(paneId) }
  }

  // ------------------------------------------------------------- Bar Button (Icon Mode)
  BarIconButton {
    id: button
    anchors.fill: parent
    visible: !root.barShowsText
    bar: root.bar
    text: "" // glyph disabled; using iconComponent SVG for reliable rendering
    iconComponent: Component {
      Image {
        anchors.fill: parent
        source: Qt.resolvedUrl("assets/icons/agent.svg")
        sourceSize.width: Style.bar.iconCanvas * 2
        sourceSize.height: Style.bar.iconCanvas * 2
        fillMode: Image.PreserveAspectFit
      }
    }
    tooltipText: Model.getTooltipText(root.summary)
    active: root.summary.working > 0 || root.summary.waiting > 0
    activeColor: root.summary.waiting > 0 ? "#F59E0B" : root.accent
    onPressed: function(buttonCode) {
      if (buttonCode === Qt.RightButton) {
        root.fetchStatus()
      } else if (buttonCode === Qt.MiddleButton && root.agents.length > 0) {
        root.focusPane(root.agents[0].pane_id)
      } else {
        root.toggle()
      }
    }

    // Active Badge on top of BarIconButton
    Rectangle {
      id: iconBadge
      visible: root.summary.working > 0 || root.summary.waiting > 0 || (root.showIdleInBar && root.summary.total > 0)
      anchors.top: parent.top
      anchors.right: parent.right
      anchors.topMargin: Style.space(2)
      anchors.rightMargin: Style.space(2)
      implicitWidth: badgeInnerRow.implicitWidth + Style.space(6)
      implicitHeight: Style.space(13)
      radius: Style.space(7)
      color: root.summary.waiting > 0 ? "#F59E0B" : (root.summary.working > 0 ? root.accent : root.alpha(root.foreground, 0.2))

      RowLayout {
        id: badgeInnerRow
        anchors.centerIn: parent
        spacing: Style.space(2)

        Text {
          text: String(root.summary.waiting > 0 ? root.summary.waiting : (root.summary.working > 0 ? root.summary.working : root.summary.total))
          textFormat: Text.PlainText
          font.family: root.fontFamily
          font.pixelSize: Style.space(8)
          font.bold: true
          color: (root.summary.working > 0 || root.summary.waiting > 0) ? Color.background : root.foreground
        }
      }
    }
  }

  // ------------------------------------------------------------- Bar Button (Data / Status Mode)
  Item {
    id: dataButton
    anchors.fill: parent
    visible: root.barShowsText

    function triggerPress(buttonCode) {
      if (root.bar) root.bar.hideTooltip(dataButton)
      if (buttonCode === Qt.RightButton) {
        root.fetchStatus()
      } else if (buttonCode === Qt.MiddleButton && root.agents.length > 0) {
        root.focusPane(root.agents[0].pane_id)
      } else {
        root.toggle()
      }
    }

    implicitWidth: chipIcon.implicitWidth + chipLabel.implicitWidth + (chipBadge.visible ? chipBadge.implicitWidth + Style.space(4) : 0) + Style.space(18)
    implicitHeight: Math.max(chipIcon.implicitHeight, chipLabel.implicitHeight)

    RowLayout {
      anchors.centerIn: parent
      spacing: Style.space(6)

      Text {
        id: chipIcon
        text: ""
        textFormat: Text.PlainText
        font.family: root.fontFamily
        font.pixelSize: Style.font.body
        color: root.summary.waiting > 0 ? "#F59E0B" : (root.summary.working > 0 ? root.accent : root.foreground)
      }

      Text {
        id: chipLabel
        text: Model.formatBarHeadline(root.summary, root.barDisplay, root.maxTaskLength, root.privacyHidePrompts)
        textFormat: Text.PlainText
        font.family: root.fontFamily
        font.pixelSize: Style.font.caption || Style.space(11)
        font.weight: (root.summary.working > 0 || root.summary.waiting > 0) ? Font.DemiBold : Font.Normal
        color: root.summary.waiting > 0 ? "#F59E0B" : (root.summary.working > 0 ? root.foreground : root.dim)
        elide: Text.ElideRight
        Layout.maximumWidth: Style.space(220)
      }

      Rectangle {
        id: chipBadge
        visible: root.summary.working > 0 || root.summary.waiting > 0
        implicitWidth: Style.space(6)
        implicitHeight: Style.space(6)
        radius: Style.space(3)
        color: root.summary.waiting > 0 ? "#F59E0B" : root.accent
        opacity: root.pulseOpacity
      }
    }

    MouseArea {
      id: dataMouse
      anchors.fill: parent
      acceptedButtons: Qt.LeftButton | Qt.RightButton | Qt.MiddleButton
      hoverEnabled: true
      onClicked: function(mouse) { dataButton.triggerPress(mouse.button) }
      onContainsMouseChanged: {
        if (!root.bar) return
        if (containsMouse) root.bar.showTooltip(dataButton, Model.getTooltipText(root.summary))
        else root.bar.hideTooltip(dataButton)
      }
      Component.onCompleted: if (root.bar && root.bar.registerClickTarget) root.bar.registerClickTarget(dataButton)
      Component.onDestruction: if (root.bar && root.bar.unregisterClickTarget) root.bar.unregisterClickTarget(dataButton)
    }
  }

  // ------------------------------------------------------------- Popup Panel
  // This panel contains a reply TextField, so it must use the layer-shell
  // keyboard-aware popup. PopupCard is pointer-only and cannot acquire
  // compositor keyboard focus even when a child calls forceActiveFocus().
  KeyboardPanel {
    id: popup
    anchorItem: root.barShowsText ? dataButton : button
    bar: root.bar
    owner: root
    open: root.opened
    contentWidth: Style.space(480)
    contentHeight: Style.space(680)
    focusTarget: keyCatcher

    // Keyboard driver: arrows / j k move card selection, Left/Right cycle
    // filters, Enter opens the selected card's reply composer, Escape closes.
    // `blocked` hands keys straight to the reply TextField while it is focused
    // so the user can type normally.
    PanelKeyCatcher {
      id: keyCatcher
      anchors.fill: parent
      blocked: root.replyFieldFocused
      onMoveRequested: function(dx, dy) {
        if (dy !== 0) root.moveSelection(dy)
        else if (dx !== 0) root.cycleFilter(dx)
      }
      onReturnRequested: root.activateSelected()
      onCloseRequested: {
        if (root.replyCardId) root.cancelReply()
        else root.close()
      }
      onTabRequested: function(direction) { root.cycleFilter(direction) }

    ColumnLayout {
      anchors.fill: parent
      anchors.margins: Style.space(4)
      spacing: Style.space(12)

      // --------------------------------------------------------- Header Row
      RowLayout {
        Layout.fillWidth: true
        spacing: Style.space(14)

        Text {
          text: ""
          color: root.summary.waiting > 0 ? "#F59E0B" : (root.summary.working > 0 ? root.accent : root.foreground)
          textFormat: Text.PlainText
          font.family: root.fontFamily
          font.pixelSize: Style.space(32)
          Layout.alignment: Qt.AlignVCenter
        }

        ColumnLayout {
          Layout.fillWidth: true
          Layout.alignment: Qt.AlignVCenter
          spacing: Style.space(2)

          Text {
            text: "Agent Orchestrator"
            color: root.foreground
            textFormat: Text.PlainText
            font.family: root.fontFamily
            font.pixelSize: Style.font.title
            font.bold: true
          }

          Text {
            text: Model.originSummaryText(root.agents)
            textFormat: Text.PlainText
            color: root.dim
            font.family: root.fontFamily
            font.pixelSize: Style.font.caption
            elide: Text.ElideRight
            Layout.fillWidth: true
          }
        }

        // Refresh Button
        BorderSurface {
          implicitWidth: Style.space(32)
          implicitHeight: Style.space(32)
          radius: Style.cornerRadius
          color: refreshMouse.containsMouse ? Style.normalFillFor(root.foreground, root.accent) : "transparent"
          borderSpec: Border.controlSpec("normal", root.foreground, root.accent)
          Layout.alignment: Qt.AlignVCenter

          Text {
            anchors.centerIn: parent
            text: "󰑐"
            color: root.foreground
            textFormat: Text.PlainText
            font.family: root.fontFamily
            font.pixelSize: Style.space(14)
            rotation: root.loading ? 360 : 0
            Behavior on rotation { NumberAnimation { duration: 600; easing.type: Easing.InOutCubic } }
          }

          MouseArea {
            id: refreshMouse
            anchors.fill: parent
            hoverEnabled: true
            cursorShape: Qt.PointingHandCursor
            onClicked: root.fetchStatus()
          }
        }
      }

      // --------------------------------------------------------- Filter Tabs
      RowLayout {
        Layout.fillWidth: true
        spacing: Style.space(6)

        Repeater {
          model: {
            var tabs = [
              { id: "all", label: "All (" + (root.summary.total || 0) + ")" },
              { id: "working", label: "Active (" + (root.summary.working || 0) + ")" }
            ]
            if (root.summary.completed > 0) {
              tabs.push({ id: "completed", label: "Done (" + (root.summary.completed || 0) + ")" })
            }
            if (root.summary.waiting > 0) {
              tabs.push({ id: "waiting", label: "Prompt (" + (root.summary.waiting || 0) + ")" })
            }
            tabs.push({ id: "idle", label: "Idle (" + (root.summary.idle || 0) + ")" })
            return tabs
          }

          Rectangle {
            required property var modelData
            Layout.fillWidth: true
            implicitHeight: Style.space(26)
            radius: Style.space(13)
            color: {
              if (root.selectedFilter !== modelData.id) return root.alpha(root.foreground, 0.06)
              if (modelData.id === "completed") return root.alpha("#10B981", 0.2)
              if (modelData.id === "waiting") return root.alpha("#F59E0B", 0.2)
              return root.alpha(root.accent, 0.2)
            }
            border.width: 1
            border.color: {
              if (root.selectedFilter !== modelData.id) return "transparent"
              if (modelData.id === "completed") return "#10B981"
              if (modelData.id === "waiting") return "#F59E0B"
              return root.accent
            }

            Text {
              anchors.centerIn: parent
              text: modelData.label
              textFormat: Text.PlainText
              font.family: root.fontFamily
              font.pixelSize: Style.space(11)
              font.weight: root.selectedFilter === modelData.id ? Font.DemiBold : Font.Normal
              color: {
                if (root.selectedFilter !== modelData.id) return root.foreground
                if (modelData.id === "completed") return "#10B981"
                if (modelData.id === "waiting") return "#F59E0B"
                return root.accent
              }
            }
            MouseArea {
              anchors.fill: parent
              cursorShape: Qt.PointingHandCursor
              onClicked: root.selectedFilter = modelData.id
            }
          }
        }
      }

      // --------------------------------------------------------- Agent Cards List
      ScrollView {
        Layout.fillWidth: true
        Layout.fillHeight: true
        clip: true
        ScrollBar.vertical.policy: ScrollBar.AsNeeded

        ListView {
          id: agentListView
          width: parent.width
          model: root.filteredAgents
          spacing: Style.space(8)
          boundsBehavior: Flickable.StopAtBounds

          delegate: Rectangle {
            required property var modelData
            required property int index

            width: agentListView.width - Style.space(4)
            implicitHeight: cardContent.implicitHeight + Style.space(16)
            radius: Style.cornerRadius

            color: {
              if (cardMouseArea.containsPress) return root.track
              if (cardMouseArea.containsMouse) return root.alpha(root.foreground, 0.1)
              if (modelData.status === "working") return root.alpha(root.accent, 0.08)
              if (modelData.status === "completed" || modelData.status === "done") return root.alpha("#10B981", 0.08)
              if (modelData.status === "waiting") return root.alpha("#F59E0B", 0.1)
              return root.alpha(root.foreground, 0.04)
            }
            border.width: (index === root.selectedIndex || modelData.status === "working" || modelData.status === "waiting" || modelData.status === "completed" || modelData.status === "done") ? 1.5 : 1
            border.color: {
              if (index === root.selectedIndex) return root.accent
              if (modelData.status === "working") return root.alpha(root.accent, root.pulseOpacity * 0.8)
              if (modelData.status === "completed" || modelData.status === "done") return root.alpha("#10B981", 0.6)
              if (modelData.status === "waiting") return root.alpha("#F59E0B", root.pulseOpacity * 0.8)
              if (modelData.focused) return root.alpha(root.foreground, 0.3)
              return root.alpha(root.foreground, 0.08)
            }
            Behavior on color { ColorAnimation { duration: 120 } }

            ColumnLayout {
              id: cardContent
              z: 1
              anchors.fill: parent
              anchors.margins: Style.space(10)
              spacing: Style.space(6)

              // Card Header: Brand Icon + Name + Origin Pill + Model + Status Badge + Terminate Button
              RowLayout {
                Layout.fillWidth: true
                spacing: Style.space(7)

                // Agent Brand SVG Mark
                Image {
                  source: Qt.resolvedUrl(Model.agentIconPath(modelData.agent))
                  sourceSize.width: Style.space(20)
                  sourceSize.height: Style.space(20)
                  Layout.preferredWidth: Style.space(20)
                  Layout.preferredHeight: Style.space(20)
                  fillMode: Image.PreserveAspectFit
                }

                // Agent Name
                Text {
                  text: modelData.agent_display || Model.agentDisplayName(modelData.agent)
                  textFormat: Text.PlainText
                  font.family: root.fontFamily
                  font.pixelSize: Style.font.body
                  font.bold: true
                  color: root.foreground
                  elide: Text.ElideRight
                  Layout.maximumWidth: Style.space(140)
                }

                // Origin Pill (Herdr vs Terminal vs Desktop)
                Rectangle {
                  implicitWidth: originRow.implicitWidth + Style.space(8)
                  implicitHeight: Style.space(16)
                  radius: Style.space(4)
                  color: root.alpha(Model.originColor(modelData.origin), 0.15)
                  border.width: 1
                  border.color: root.alpha(Model.originColor(modelData.origin), 0.4)

                  RowLayout {
                    id: originRow
                    anchors.centerIn: parent
                    spacing: Style.space(3)
                    Image {
                      visible: Boolean(Model.originIconPath(modelData.origin))
                      source: Model.originIconPath(modelData.origin) ? Qt.resolvedUrl(Model.originIconPath(modelData.origin)) : ""
                      sourceSize.width: Style.space(9)
                      sourceSize.height: Style.space(9)
                      fillMode: Image.PreserveAspectFit
                    }
                    Text {
                      visible: !Boolean(Model.originIconPath(modelData.origin)) && Boolean(Model.originIcon(modelData.origin))
                      text: Model.originIcon(modelData.origin)
                      textFormat: Text.PlainText
                      font.family: root.fontFamily
                      font.pixelSize: Style.space(8)
                      color: Model.originColor(modelData.origin)
                    }
                    Text {
                      text: Model.originBadgeText(modelData.origin)
                      textFormat: Text.PlainText
                      font.family: root.fontFamily
                      font.pixelSize: Style.space(8)
                      font.bold: true
                      color: Model.originColor(modelData.origin)
                    }
                  }
                }

                // Model Chip (if present)
                Rectangle {
                  visible: Boolean(modelData.model)
                  implicitWidth: Math.min(modelText.implicitWidth + Style.space(8), Style.space(120))
                  implicitHeight: Style.space(16)
                  radius: Style.space(4)
                  color: root.alpha(root.foreground, 0.1)

                  Text {
                    id: modelText
                    anchors.centerIn: parent
                    text: modelData.model || ""
                    textFormat: Text.PlainText
                    font.family: root.fontFamily
                    font.pixelSize: Style.space(9)
                    color: root.dim
                    elide: Text.ElideRight
                    width: Math.min(implicitWidth, Style.space(110))
                  }
                }

                Item { Layout.fillWidth: true }

                // Status Pill
                Rectangle {
                  implicitWidth: statusPillRow.implicitWidth + Style.space(8)
                  implicitHeight: Style.space(18)
                  radius: Style.space(9)
                  color: root.alpha(Model.statusColor(modelData.status, root.foreground, root.accent, root.urgent), 0.2)
                  border.width: 1
                  border.color: Model.statusColor(modelData.status, root.foreground, root.accent, root.urgent)

                  RowLayout {
                    id: statusPillRow
                    anchors.centerIn: parent
                    spacing: Style.space(4)

                    Rectangle {
                      visible: modelData.status !== "completed" && modelData.status !== "done"
                      width: Style.space(5)
                      height: Style.space(5)
                      radius: Style.space(3)
                      color: Model.statusColor(modelData.status, root.foreground, root.accent, root.urgent)
                      opacity: modelData.status === "working" ? root.pulseOpacity : 1.0
                    }

                    Text {
                      text: Model.statusBadgeText(modelData.status)
                      textFormat: Text.PlainText
                      font.family: root.fontFamily
                      font.pixelSize: Style.space(9)
                      font.bold: true
                      color: Model.statusColor(modelData.status, root.foreground, root.accent, root.urgent)
                    }
                  }
                }

                // Terminate / Close Button (Replaces Focus button)
                Rectangle {
                  implicitWidth: Style.space(22)
                  implicitHeight: Style.space(22)
                  visible: modelData.can_reply === true
                  radius: Style.space(6)
                  color: replyMouse.containsMouse ? root.alpha(root.accent, 0.3) : root.alpha(root.foreground, 0.08)
                  border.width: 1
                  border.color: replyMouse.containsMouse ? root.accent : "transparent"

                  Text {
                    anchors.centerIn: parent
                    text: "↩"
                    textFormat: Text.PlainText
                    font.family: root.fontFamily
                    font.pixelSize: Style.space(13)
                    color: replyMouse.containsMouse ? root.accent : root.dim
                  }

                  MouseArea {
                    id: replyMouse
                    anchors.fill: parent
                    hoverEnabled: true
                    cursorShape: Qt.PointingHandCursor
                    onClicked: {
                      root.replyCardId = String(modelData.pane_id || index)
                      root.replyState = "idle"
                      root.replyError = ""
                      root.replyDraft = ""
                    }
                  }
                }

                Rectangle {
                  implicitWidth: Style.space(22)
                  implicitHeight: Style.space(22)
                  visible: modelData.can_control !== false
                  radius: Style.space(6)
                  color: killMouse.containsMouse ? root.alpha(root.urgent, 0.35) : root.alpha(root.foreground, 0.08)
                  border.width: 1
                  border.color: killMouse.containsMouse ? root.urgent : "transparent"

                  Text {
                    anchors.centerIn: parent
                    text: "✕"
                    textFormat: Text.PlainText
                    font.family: root.fontFamily
                    font.pixelSize: Style.space(10)
                    font.bold: true
                    color: killMouse.containsMouse ? root.urgent : root.dim
                  }

                  MouseArea {
                    id: killMouse
                    anchors.fill: parent
                    hoverEnabled: true
                    cursorShape: modelData.can_control === false ? Qt.ArrowCursor : Qt.PointingHandCursor
                    onClicked: if (modelData.can_control !== false) root.killTarget(modelData.pane_id)
                  }
                }
              }

              // Task Title
              Text {
                Layout.fillWidth: true
                text: root.privacyHidePrompts ? "Session details hidden" : (modelData.title || "Active agent session")
                textFormat: Text.PlainText
                font.family: root.fontFamily
                font.pixelSize: Style.font.caption
                font.weight: modelData.status === "working" ? Font.DemiBold : Font.Normal
                color: root.foreground
                wrapMode: Text.Wrap
                maximumLineCount: 2
                elide: Text.ElideRight
              }

              // Activity Detail (if running tool, prompt question, or concluding tail)
              Text {
                visible: !root.privacyHidePrompts && Boolean(modelData.detail) && modelData.detail !== modelData.title
                Layout.fillWidth: true
                text: modelData.detail || ""
                textFormat: Text.PlainText
                font.family: root.fontFamily
                font.pixelSize: Style.space(10)
                font.italic: modelData.status === "idle"
                color: {
                  if (modelData.status === "waiting") return "#F59E0B"
                  if (modelData.status === "working") return root.accent
                  return root.dim
                }
                font.weight: (modelData.status === "waiting" || modelData.status === "working") ? Font.DemiBold : Font.Normal
                wrapMode: Text.Wrap
                maximumLineCount: 3
                elide: Text.ElideRight
              }

              // Breadcrumbs / Location Metadata
              RowLayout {
                Layout.fillWidth: true
                spacing: Style.space(6)

                // Repo / Directory Pill
                Rectangle {
                  implicitWidth: Math.min(repoText.implicitWidth + Style.space(10), Style.space(140))
                  implicitHeight: Style.space(16)
                  radius: Style.space(4)
                  color: root.alpha(root.foreground, 0.08)

                  RowLayout {
                    id: repoText
                    anchors.centerIn: parent
                    spacing: Style.space(3)
                    Text {
                      text: "📁"
                      textFormat: Text.PlainText
                      font.pixelSize: Style.space(9)
                    }
                    Text {
                      text: modelData.repo || modelData.cwd || "~"
                      textFormat: Text.PlainText
                      font.family: root.fontFamily
                      font.pixelSize: Style.space(9)
                      color: root.foreground
                      elide: Text.ElideRight
                      Layout.maximumWidth: Style.space(110)
                    }
                  }
                }

                // Workspace & Tab Location. With privacyHidePrompts on, only the
                // workspace name is shown: tab and pane labels can carry the
                // task text too (Orca renames its tab to "<task> · <model>"), so
                // they are task text and must be hidden like the title.
                Text {
                  Layout.fillWidth: true
                  text: {
                    if (root.privacyHidePrompts) return modelData.workspace || ""
                    var parts = []
                    if (modelData.workspace) parts.push(modelData.workspace)
                    if (modelData.tab) parts.push(modelData.tab)
                    if (modelData.pane_label && modelData.pane_label !== modelData.tab) parts.push(modelData.pane_label)
                    return parts.join(" > ")
                  }
                  textFormat: Text.PlainText
                  font.family: root.fontFamily
                  font.pixelSize: Style.space(9)
                  color: root.dim
                  elide: Text.ElideRight
                }
              }

              // Expanded detail — shown for the same card whose composer is open
              // (Enter on a selected card, or the reply button). Renders the full
              // latest prompt and latest activity/reply un-truncated and wrapped,
              // plus metadata, so the user can read context before replying.
              ColumnLayout {
                id: expandedDetail
                visible: !root.privacyHidePrompts
                         && root.replyCardId === String(modelData.pane_id || index)
                         && (Boolean(modelData.title) || Boolean(modelData.detail))
                Layout.fillWidth: true
                spacing: Style.space(4)
                z: 2

                Rectangle { Layout.fillWidth: true; implicitHeight: 1; color: root.alpha(root.foreground, 0.12) }

                Text {
                  visible: Boolean(modelData.title)
                  Layout.fillWidth: true
                  text: "Latest prompt"
                  textFormat: Text.PlainText
                  font.family: root.fontFamily
                  font.pixelSize: Style.space(9)
                  font.bold: true
                  color: root.dim
                }
                Text {
                  visible: Boolean(modelData.title)
                  Layout.fillWidth: true
                  text: modelData.title || ""
                  textFormat: Text.PlainText
                  font.family: root.fontFamily
                  font.pixelSize: Style.space(11)
                  color: root.foreground
                  wrapMode: Text.Wrap
                }

                Text {
                  visible: Boolean(modelData.detail) && modelData.detail !== modelData.title
                  Layout.fillWidth: true
                  text: "Latest activity"
                  textFormat: Text.PlainText
                  font.family: root.fontFamily
                  font.pixelSize: Style.space(9)
                  font.bold: true
                  color: root.dim
                }
                Text {
                  visible: Boolean(modelData.detail) && modelData.detail !== modelData.title
                  Layout.fillWidth: true
                  text: modelData.detail || ""
                  textFormat: Text.PlainText
                  font.family: root.fontFamily
                  font.pixelSize: Style.space(11)
                  color: root.dim
                  wrapMode: Text.Wrap
                }

                Text {
                  Layout.fillWidth: true
                  text: {
                    var bits = []
                    if (modelData.model) bits.push(String(modelData.model))
                    if (modelData.agent_display) bits.push(String(modelData.agent_display))
                    if (modelData.herdr_session) bits.push("session " + modelData.herdr_session)
                    if (modelData.cwd) bits.push(String(modelData.cwd))
                    return bits.join("  ·  ")
                  }
                  textFormat: Text.PlainText
                  font.family: root.fontFamily
                  font.pixelSize: Style.space(9)
                  color: root.dim
                  wrapMode: Text.Wrap
                }
              }

              // One-at-a-time Herdr reply composer. The card MouseArea remains
              // underneath this child, so typing and button clicks retain focus.
              ColumnLayout {
                id: replyComposer
                visible: root.replyCardId === String(modelData.pane_id || index)
                Layout.fillWidth: true
                spacing: Style.space(5)
                z: 2

                TextField {
                  id: replyField
                  Layout.fillWidth: true
                  placeholderText: "Reply to this Herdr agent…"
                  text: root.replyDraft
                  enabled: root.replyState !== "sending" && root.replyState !== "accepted" && root.replyAllowed(modelData)
                  selectByMouse: true
                  onTextChanged: if (replyComposer.visible) root.replyDraft = text
                  onAccepted: root.submitReply(modelData, text)
                  Keys.onPressed: function(event) {
                    if (event.key === Qt.Key_Escape) {
                      root.cancelReply()
                      keyCatcher.forceActiveFocus()
                      event.accepted = true
                    } else if (event.key === Qt.Key_Return || event.key === Qt.Key_Enter) {
                      root.submitReply(modelData, text)
                      event.accepted = true
                    }
                  }
                  onVisibleChanged: if (visible && root.replyAllowed(modelData)) Qt.callLater(function() { forceActiveFocus() })
                  // While this field holds focus the PanelKeyCatcher is blocked
                  // (see keyCatcher.blocked) so keystrokes reach the editor.
                  onActiveFocusChanged: root.replyFieldFocused = activeFocus
                }

                RowLayout {
                  Layout.fillWidth: true
                  Text {
                    visible: modelData.status === "waiting" || modelData.status === "blocked"
                    text: "Open to answer"
                    textFormat: Text.PlainText
                    color: "#F59E0B"
                    font.family: root.fontFamily
                    font.pixelSize: Style.space(10)
                  }
                  Text {
                    visible: root.replyState === "sending"
                    text: "Sending…"
                    textFormat: Text.PlainText
                    color: root.dim
                    font.family: root.fontFamily
                    font.pixelSize: Style.space(10)
                  }
                  Text {
                    visible: root.replyState === "accepted"
                    text: modelData.status === "working" ? "Queued" : "Sent"
                    textFormat: Text.PlainText
                    color: "#10B981"
                    font.family: root.fontFamily
                    font.pixelSize: Style.space(10)
                  }
                  Text {
                    visible: root.replyState === "failed"
                    text: root.replyError
                    textFormat: Text.PlainText
                    color: root.urgent
                    font.family: root.fontFamily
                    font.pixelSize: Style.space(10)
                    elide: Text.ElideRight
                    Layout.fillWidth: true
                  }
                  Item { Layout.fillWidth: true }
                  Rectangle {
                    implicitWidth: Style.space(62)
                    implicitHeight: Style.space(24)
                    radius: Style.space(5)
                    color: cancelReplyMouse.containsMouse ? root.alpha(root.foreground, 0.16) : root.alpha(root.foreground, 0.08)
                    Text { anchors.centerIn: parent; text: "Cancel"; textFormat: Text.PlainText; color: root.foreground; font.family: root.fontFamily; font.pixelSize: Style.space(10) }
                    MouseArea { id: cancelReplyMouse; anchors.fill: parent; onClicked: root.cancelReply() }
                  }
                  Rectangle {
                    implicitWidth: Style.space(112)
                    implicitHeight: Style.space(24)
                    radius: Style.space(5)
                    visible: root.replyAllowed(modelData)
                    color: sendReplyMouse.containsMouse ? root.alpha(root.accent, 0.35) : root.alpha(root.accent, 0.22)
                    Text {
                      anchors.centerIn: parent
                      text: modelData.status === "working" ? "Queue follow-up" : "Send"
                      textFormat: Text.PlainText
                      color: root.foreground
                      font.family: root.fontFamily
                      font.pixelSize: Style.space(10)
                      font.bold: true
                    }
                    MouseArea {
                      id: sendReplyMouse
                      anchors.fill: parent
                      enabled: root.replyState !== "sending"
                      onClicked: root.submitReply(modelData, replyField.text)
                    }
                  }
                }
              }
            }

            // Click entire card to focus pane / window
            MouseArea {
              id: cardMouseArea
              anchors.fill: parent
              cursorShape: modelData.can_focus === false ? Qt.ArrowCursor : Qt.PointingHandCursor
              hoverEnabled: true
              onClicked: if (modelData.can_focus !== false) root.focusPane(modelData.pane_id)
            }
          }
        }
      }

      // --------------------------------------------------------- Footer
      Rectangle {
        Layout.fillWidth: true
        implicitHeight: Style.space(28)
        radius: Style.cornerRadius
        color: root.alpha(root.foreground, 0.04)

        RowLayout {
          anchors.fill: parent
          anchors.leftMargin: Style.space(8)
          anchors.rightMargin: Style.space(8)

          // Socket / Service connection indicator
          RowLayout {
            spacing: Style.space(5)
            Rectangle {
              width: Style.space(6)
              height: Style.space(6)
              radius: Style.space(3)
              color: root.rawData.connected ? "#10B981" : "#38BDF8"
            }
            Text {
              text: (root.rawData.connected && root.rawData.orca_connected) ? "Herdr · Terminal · Orca Live"
                    : (root.rawData.connected) ? "Herdr + Terminal Live"
                    : (root.rawData.orca_connected) ? "Orca Scanner Active"
                    : "Standalone Scanner Active"
              textFormat: Text.PlainText
              font.family: root.fontFamily
              font.pixelSize: Style.space(9)
              color: root.dim
            }
          }

          Item { Layout.fillWidth: true }

          // Keyboard hint
          Text {
            text: "↑↓ select · Enter expand/reply · Esc close"
            textFormat: Text.PlainText
            font.family: root.fontFamily
            font.pixelSize: Style.space(9)
            color: root.dim
          }
        }
      }
    }
    }
  }
}
