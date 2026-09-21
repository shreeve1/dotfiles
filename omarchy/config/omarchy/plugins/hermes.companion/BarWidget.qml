import QtQuick
import Quickshell
import Quickshell.Io
import Quickshell.Wayland
import qs.Ui
import qs.Commons

BarWidget {
  id: root
  moduleName: "hermes.companion"

  readonly property string home: Quickshell.env("HOME")
  readonly property string statePath: (Quickshell.env("XDG_STATE_HOME") !== "" ? Quickshell.env("XDG_STATE_HOME") : home + "/.local/state") + "/hermes-companion/state.json"
  readonly property string pluginDir: home + "/.config/omarchy/plugins/hermes.companion"
  readonly property string daemon: pluginDir + "/daemon/companion.py"
  property string hermesDir: home + "/.hermes/hermes-agent"
  readonly property string python: hermesDir + "/venv/bin/python"
  property bool hermesMissing: false
  function probeHermes() {
    if (hermesProbe.running) return
    hermesProbe.command = ["test", "-x", root.python]
    hermesProbe.running = true
  }
  FileView {
    path: root.pluginDir + "/companion.json"
    watchChanges: true
    printErrors: false
    onFileChanged: reload()
    onLoaded: { try { var c = JSON.parse(String(text() || "")); if (c.hermes_dir) root.hermesDir = c.hermes_dir } catch (e) {} ; root.probeHermes() }
  }
  Process {
    id: hermesProbe
    onExited: function(exitCode) { root.hermesMissing = exitCode !== 0 }
  }
  Component.onCompleted: probeHermes()

  property var st: ({})
  property double nowMs: Date.now()
  readonly property bool alive: !!st.updated && (nowMs / 1000 - st.updated) < 90
  readonly property string status: hermesMissing ? "no-hermes" : (alive ? String(st.status || "watching") : "offline")
  readonly property bool eyes: !!st.eyes
  readonly property bool muted: !!st.muted
  readonly property bool listening: !!st.listening
  readonly property string profile: String(st.profile || "Coding")
  readonly property bool thinking: st.thinking !== false
  readonly property bool toasts: st.toasts !== false
  property bool actions: st.actions === true
  readonly property var remarks: st.remarks || []
  readonly property var visionCfg: st.vision || ({})
  readonly property var reasoningCfg: st.reasoning || ({})
  readonly property var modelRows: st.models || []

  property bool popupOpen: false
  property bool modelsPage: false
  property bool profilesPage: false
  property string expandedPicker: ""
  // Panel contract consumed by the shell's bar-widget coordinator
  // (Bar.qml findPanelWidget -> BarModel.pickPanelSlot). Exposing opened/open/close
  // lets `omarchy-shell shell toggle hermes.companion` route to the single correct
  // per-monitor instance (open -> focused monitor; close/toggle -> the open copy),
  // instead of every instance reacting independently.
  readonly property bool opened: popupOpen
  // Pin detaches the panel into a separate view-only floating overlay window
  // (see PinnedOverlay below): it stays above other windows on this monitor and
  // across workspaces, is click-through everywhere except its card, and does not
  // steal keyboard focus. Clicking the pinned card (or Super+Alt+A) opens the
  // normal interactive panel to type. Pinning closes the interactive popup so it
  // stops grabbing focus.
  property bool pinned: false
  onPinnedChanged: if (pinned) forceClose()
  function open() {
    modelsPage = false
    profilesPage = false
    popupOpen = true
    Qt.callLater(function() { if (root.popupOpen && !root.modelsPage && !root.profilesPage) askField.forceActiveFocus() })
  }
  function close() { forceClose() }
  function forceClose() { popupOpen = false; modelsPage = false; profilesPage = false; expandedPicker = "" }
  function openModels() {
    profilesPage = false
    modelsPage = true
    expandedPicker = ""
    Qt.callLater(function() { if (root.modelsPage) backButton.forceActiveFocus() })
  }
  function closeModels() {
    modelsPage = false
    expandedPicker = ""
    Qt.callLater(function() { if (root.popupOpen && !root.modelsPage && !root.profilesPage) askField.forceActiveFocus() })
  }
  function openProfiles() {
    modelsPage = false
    profilesPage = true
    expandedPicker = ""
    Qt.callLater(function() { if (root.profilesPage) profilesBackButton.forceActiveFocus() })
  }
  function closeProfiles() {
    profilesPage = false
    Qt.callLater(function() { if (root.popupOpen && !root.modelsPage) askField.forceActiveFocus() })
  }
  function toggleModelsPicker(role) { expandedPicker = expandedPicker === role ? "" : role }
  onPopupOpenChanged: if (!popupOpen) { modelsPage = false; profilesPage = false; expandedPicker = "" }

  readonly property string glyph: {
    switch (status) {
      case "offline": return "󰚌"
      case "no-hermes": return "󰀦"
      case "error": return "󰀦"
      case "thinking": return "󰔟"
      case "speaking": return "󰔊"
      case "listening-request": return "󰍬"
      case "approval": return "󰆍"
      case "paused": return "󰈉"
      default: return eyes ? "󰛐" : "󰈉"
    }
  }
  readonly property color glyphColor: {
    if (status === "offline") return Qt.darker(bar.barForeground, 2.0)
    if (status === "error" || status === "no-hermes") return bar.urgent
    if (listening) return Color.urgent
    if (status === "approval") return Color.urgent
    if (status === "thinking" || status === "speaking" || status === "listening-request") return Color.accent
    return bar.barForeground
  }

  implicitWidth: glyphText.implicitWidth + Style.space(14)
  implicitHeight: barSize

  FileView {
    path: root.statePath
    watchChanges: true
    printErrors: false
    onFileChanged: reload()
    onLoaded: { try { root.st = JSON.parse(String(text() || "")) } catch (e) { root.st = ({}) } }
    onLoadFailed: root.st = ({})
  }
  Timer { interval: 15000; running: true; repeat: true; onTriggered: root.nowMs = Date.now() }

  Process { id: ctl }
  function control(cmd) {
    ctl.command = [root.python, root.daemon, "--ctl", cmd]
    ctl.running = true
  }

  // "sending" follows the daemon: set on submit, cleared when it leaves thinking/speaking.
  property bool sending: false
  onStatusChanged: if (sending && status !== "thinking" && status !== "speaking") sending = false
  Timer { id: sendGuard; interval: 90000; onTriggered: root.sending = false }
  Process { id: askProc }
  function sendText() {
    var t = askField.text.trim()
    if (t === "" || root.sending) return
    root.sending = true
    sendGuard.restart()
    askField.text = ""
    askProc.command = [root.python, root.daemon, "--ctl", "text " + t]
    askProc.running = true
  }
  Process { id: svc }
  function service(op) {
    svc.command = ["systemctl", "--user", op, "hermes-companion.service"]
    svc.running = true
  }

  Text {
    id: glyphText
    anchors.centerIn: parent
    textFormat: Text.PlainText
    text: root.glyph
    color: root.glyphColor
    font.family: root.bar.fontFamily
    font.pixelSize: Style.font.icon
    Behavior on color { ColorAnimation { duration: 160 } }
    SequentialAnimation on opacity {
      running: root.status === "thinking" || root.status === "listening-request"
      loops: Animation.Infinite
      NumberAnimation { to: 0.35; duration: 500 }
      NumberAnimation { to: 1.0; duration: 500 }
      onRunningChanged: if (!running) glyphText.opacity = 1.0
    }
  }

  MouseArea {
    anchors.fill: parent
    hoverEnabled: true
    cursorShape: Qt.PointingHandCursor
    acceptedButtons: Qt.LeftButton | Qt.MiddleButton | Qt.RightButton
    onClicked: function(mouse) {
      if (mouse.button === Qt.MiddleButton) root.control("hush")
      else if (mouse.button === Qt.RightButton) root.control("listen")
      else if (root.popupOpen) { root.pinned = false; root.forceClose() }  // explicit close clears pin
      else root.open()
    }
    onEntered: if (root.bar) root.bar.showTooltip(root, root.hermesMissing ? "Hermes Agent not found at " + root.hermesDir + " — run install.sh" : "Hermes: " + root.status + (root.st.last_observation ? " — " + root.st.last_observation : "") + "\n(right-click to ask, middle-click to hush)")
    onExited: if (root.bar) root.bar.hideTooltip(root)
  }

  // Inline component: a titled, provider-grouped scrollable model list with
  // an effort ButtonGroup + Thinking switch underneath.
  component ModelPicker: Column {
    id: picker
    property string title: ""
    property string role: "vision"
    property bool visionOnly: false
    property bool allowSame: false
    property string current: ""
    property string emptyLabel: "Not set"
    property string effort: "low"
    property bool thinking: true
    property bool showControls: true
    property bool expanded: false
    spacing: Style.space(6)

    readonly property var rows: {
      var out = []
      if (allowSame) out.push({ value: "", label: "Same as vision model", header: false, vision: true, same: true })
      var src = root.modelRows
      var pendingHeader = null
      for (var i = 0; i < src.length; i++) {
        var r = src[i]
        if (r.header) { pendingHeader = r; continue }
        if (visionOnly && r.vision !== true) continue
        if (pendingHeader) { out.push(pendingHeader); pendingHeader = null }
        out.push(r)
      }
      return out
    }

    BorderSurface {
      width: parent.width
      height: Style.spacing.popupRowHeight
      radius: Style.cornerRadius
      color: picker.expanded ? Style.selectedFillFor(root.bar.foreground, Color.accent) : "transparent"
      borderSpec: Border.controlSpec("normal", root.bar.foreground, Color.accent)
      Text {
        textFormat: Text.PlainText
        anchors.left: parent.left
        anchors.leftMargin: Style.spacing.controlPaddingX
        anchors.verticalCenter: parent.verticalCenter
        text: (picker.expanded ? "▾ " : "▸ ") + picker.title
        color: root.bar.foreground
        font.family: root.bar.fontFamily
        font.pixelSize: Style.font.body
        font.bold: true
      }
      Text {
        textFormat: Text.PlainText
        anchors.left: parent.left
        anchors.leftMargin: parent.width * 0.38
        anchors.right: parent.right
        anchors.rightMargin: Style.spacing.controlPaddingX
        anchors.verticalCenter: parent.verticalCenter
        text: picker.current === "" ? picker.emptyLabel : picker.current
        color: Qt.darker(root.bar.foreground, 1.4)
        font.family: root.bar.fontFamily
        font.pixelSize: Style.font.caption
        elide: Text.ElideLeft
      }
      MouseArea {
        anchors.fill: parent
        cursorShape: Qt.PointingHandCursor
        onClicked: root.toggleModelsPicker(picker.role)
      }
    }
    BorderSurface {
      visible: picker.expanded
      width: parent.width
      height: Style.space(140)
      radius: Style.cornerRadius
      color: "transparent"
      borderSpec: Border.controlSpec("normal", root.bar.foreground, Color.accent)

      ListView {
        id: list
        anchors.fill: parent
        anchors.margins: Style.space(3)
        clip: true
        spacing: 1
        boundsBehavior: Flickable.StopAtBounds
        model: picker.rows
        currentIndex: {
          var m = picker.rows
          for (var i = 0; i < m.length; i++) if (!m[i].header && m[i].value === picker.current) return i
          return -1
        }
        Component.onCompleted: Qt.callLater(function() { list.positionViewAtIndex(Math.max(0, list.currentIndex), ListView.Contain) })
        onModelChanged: Qt.callLater(function() { list.positionViewAtIndex(Math.max(0, list.currentIndex), ListView.Contain) })
        delegate: Rectangle {
          required property var modelData
          required property int index
          width: list.width
          height: modelData.header ? Style.spacing.popupRowHeight * 0.9 : Style.spacing.popupRowHeight
          radius: Style.cornerRadius / 2
          readonly property bool isHeader: !!modelData.header
          readonly property bool isCurrent: !isHeader && modelData.value === picker.current
          color: isHeader ? "transparent"
               : isCurrent ? Style.selectedFillFor(root.bar.foreground, Color.accent)
               : (rowHover.hovered ? Style.hoverFillFor(root.bar.foreground, Color.accent) : "transparent")
          HoverHandler { id: rowHover; enabled: !parent.isHeader }
          Text {
            textFormat: Text.PlainText
            anchors.left: parent.left
            anchors.right: parent.right
            anchors.verticalCenter: parent.verticalCenter
            anchors.leftMargin: parent.isHeader ? Style.spacing.controlPaddingX / 2 : Style.spacing.controlPaddingX * 1.6
            anchors.rightMargin: Style.spacing.controlPaddingX
            text: parent.isHeader
              ? ("▸ " + modelData.label + (modelData.error ? "  (" + modelData.error + ")" : ""))
              : ((parent.isCurrent ? "󰄬 " : "") + modelData.label + (modelData.vision === null || modelData.vision === undefined ? "  ·  vision?" : (modelData.vision === false && !modelData.same ? "  ·  text-only" : "")))
            color: parent.isHeader ? Qt.darker(root.bar.foreground, 1.4) : (parent.isCurrent ? Color.accent : root.bar.foreground)
            font.family: root.bar.fontFamily
            font.pixelSize: parent.isHeader ? Style.font.caption : Style.font.bodySmall
            font.bold: parent.isHeader
            elide: Text.ElideRight
          }
          MouseArea {
            anchors.fill: parent
            enabled: !parent.isHeader
            cursorShape: Qt.PointingHandCursor
            onClicked: if (modelData.value !== picker.current) root.control("set-" + picker.role + " " + (modelData.value === "" ? "same" : modelData.value))
          }
        }
      }
    }
    Row {
      visible: picker.expanded && picker.showControls
      width: parent.width
      spacing: Style.space(8)
      Text {
        textFormat: Text.PlainText
        text: "Effort"
        anchors.verticalCenter: parent.verticalCenter
        color: Qt.darker(root.bar.foreground, 1.4)
        font.family: root.bar.fontFamily
        font.pixelSize: Style.font.caption
        font.bold: true
      }
      ButtonGroup {
        anchors.verticalCenter: parent.verticalCenter
        foreground: root.bar.foreground
        fontFamily: root.bar.fontFamily
        fontSize: Style.font.bodySmall
        options: ["low", "medium", "high"]
        value: picker.effort
        enabled: picker.thinking
        opacity: picker.thinking ? 1.0 : 0.4
        onChanged: function(v) { if (v && v !== picker.effort) root.control("set-" + picker.role + "-effort " + v) }
      }
      Item { width: Style.space(6); height: 1 }
      ToggleSwitch {
        anchors.verticalCenter: parent.verticalCenter
        checked: picker.thinking
        foreground: root.bar.foreground
        onToggled: root.control("toggle-" + picker.role + "-thinking")
      }
      Text {
        textFormat: Text.PlainText
        text: "Thinking"
        anchors.verticalCenter: parent.verticalCenter
        color: root.bar.foreground
        font.family: root.bar.fontFamily
        font.pixelSize: Style.font.bodySmall
        MouseArea { anchors.fill: parent; cursorShape: Qt.PointingHandCursor; onClicked: root.control("toggle-" + picker.role + "-thinking") }
      }
    }
  }

  // KeyboardPanel (not PopupCard): the popup needs keyboard focus for the text field.
  KeyboardPanel {
    id: popup
    anchorItem: root
    bar: root.bar
    owner: root
    open: root.popupOpen
    focusTarget: root.modelsPage ? backButton : (root.profilesPage ? profilesBackButton : askField)
    contentWidth: popup.fittedContentWidth(Style.space(440))
    contentHeight: popup.fittedContentHeight(column.implicitHeight)

    Column {
      id: column
      anchors.fill: parent
      spacing: Style.space(8)

      Column {
        id: mainPage
        visible: !root.modelsPage && !root.profilesPage
        width: parent.width
        spacing: Style.space(8)

        Row {
        width: parent.width
        spacing: Style.space(8)
        Text {
          textFormat: Text.PlainText
          text: root.glyph
          color: root.bar.foreground
          font.family: root.bar.fontFamily
          font.pixelSize: Style.font.displayLarge
          anchors.verticalCenter: parent.verticalCenter
        }
        Column {
          width: parent.width - Style.space(40)
          Text {
            textFormat: Text.PlainText
            text: "Hermes Companion"
            color: root.bar.foreground
            font.family: root.bar.fontFamily
            font.pixelSize: Style.font.subtitle
            font.bold: true
          }
          Text {
            textFormat: Text.PlainText
            text: root.status + (root.st.ticks ? "  ·  " + root.st.ticks + " ticks, " + (root.st.frames_sent || 0) + " frames" : "")
            color: Qt.darker(root.bar.foreground, 1.4)
            font.family: root.bar.fontFamily
            font.pixelSize: Style.font.caption
          }
        }
      }

      Text {
        textFormat: Text.PlainText
        width: parent.width
        wrapMode: Text.Wrap
        text: root.st.last_observation || "(no observation yet)"
        color: Qt.darker(root.bar.foreground, 1.2)
        font.family: root.bar.fontFamily
        font.pixelSize: Style.font.bodySmall
        font.italic: true
      }

      Flow {
        width: parent.width
        spacing: Style.space(6)
        Button { text: root.eyes ? "󰛐 Eyes on" : "󰈉 Eyes off"; foreground: root.bar.foreground; selected: root.eyes; onClicked: root.control("toggle-eyes") }
        Button { text: root.muted ? "󰖁 Quiet" : "󰕾 Talks"; foreground: root.bar.foreground; selected: !root.muted; onClicked: root.control("toggle-mute") }
        Button { text: root.toasts ? "󰍡 Toasts" : "󰍥 Toasts"; foreground: root.bar.foreground; selected: root.toasts; tooltipText: "On-screen output toasts"; onClicked: root.control("toggle-toasts") }
        Button { text: "󰆍 Actions"; foreground: root.bar.foreground; selected: root.actions; tooltipText: "Let requests run commands via a helper subagent (risky ones ask first)"; onClicked: root.control("toggle-actions") }
        Button { text: root.pinned ? "󰐃 Pinned" : "󰤱 Pin"; foreground: root.bar.foreground; selected: root.pinned; tooltipText: "Keep this panel open (ignore click-away)"; onClicked: root.pinned = !root.pinned }
      }
      Row {
        spacing: Style.space(6)
        Button { text: root.listening ? "󰓛 Stop" : "󰍬 Listen"; foreground: root.bar.foreground; selected: root.listening; tooltipText: root.listening ? "Stop continuous microphone listening" : "Start continuous microphone listening (also: right-click the icon)"; onClicked: root.control("listen") }
        Button { text: "Hush"; foreground: root.bar.foreground; onClicked: root.control("hush") }
        Button { text: "Look now"; foreground: root.bar.foreground; onClicked: root.control("tick") }
        Button { text: root.alive ? "Restart" : "Start"; foreground: root.bar.foreground; onClicked: root.service(root.alive ? "restart" : "start") }
        Button { text: "Stop"; foreground: root.bar.foreground; visible: root.alive; onClicked: root.service("stop") }
      }

      Text {
        textFormat: Text.PlainText
        visible: root.hermesMissing
        width: parent.width
        wrapMode: Text.Wrap
        text: "⚠ Hermes Agent not found at " + root.hermesDir + ". Run " + root.pluginDir + "/install.sh"
        color: root.bar.urgent
        font.family: root.bar.fontFamily
        font.pixelSize: Style.font.caption
      }
      Text {
        textFormat: Text.PlainText
        visible: !!root.st.last_error && !root.hermesMissing
        width: parent.width
        wrapMode: Text.Wrap
        text: "⚠ " + root.st.last_error
        color: root.bar.urgent
        font.family: root.bar.fontFamily
        font.pixelSize: Style.font.caption
      }

      Rectangle { width: parent.width; height: 1; color: Qt.darker(root.bar.foreground, 3) }

      // ---- Compact model summary ----
      BorderSurface {
        width: parent.width
        height: Style.spacing.popupRowHeight * 1.45
        radius: Style.cornerRadius
        color: modelsSummaryHover.hovered ? Style.hoverFillFor(root.bar.foreground, Color.accent) : "transparent"
        borderSpec: Border.controlSpec("normal", root.bar.foreground, Color.accent)
        Column {
          anchors.left: parent.left
          anchors.right: summaryChevron.left
          anchors.leftMargin: Style.spacing.controlPaddingX
          anchors.rightMargin: Style.spacing.controlPaddingX
          anchors.verticalCenter: parent.verticalCenter
          spacing: 1
          Text {
            textFormat: Text.PlainText
            text: "Models"
            color: root.bar.foreground
            font.family: root.bar.fontFamily
            font.pixelSize: Style.font.body
            font.bold: true
          }
          Text {
            textFormat: Text.PlainText
            width: parent.width
            text: "Vision: " + (root.visionCfg.model || "Not set") + "  ·  Reasoning: " + (root.reasoningCfg.model || "Same as vision")
            color: Qt.darker(root.bar.foreground, 1.4)
            font.family: root.bar.fontFamily
            font.pixelSize: Style.font.caption
            elide: Text.ElideRight
          }
        }
        Text {
          id: summaryChevron
          textFormat: Text.PlainText
          anchors.right: parent.right
          anchors.rightMargin: Style.spacing.controlPaddingX
          anchors.verticalCenter: parent.verticalCenter
          text: "›"
          color: root.bar.foreground
          font.family: root.bar.fontFamily
          font.pixelSize: Style.font.subtitle
        }
        HoverHandler { id: modelsSummaryHover }
        MouseArea { anchors.fill: parent; cursorShape: Qt.PointingHandCursor; onClicked: root.openModels() }
      }

      // ---- Compact profile summary ----
      BorderSurface {
        width: parent.width
        height: Style.spacing.popupRowHeight * 1.45
        radius: Style.cornerRadius
        color: profilesSummaryHover.hovered ? Style.hoverFillFor(root.bar.foreground, Color.accent) : "transparent"
        borderSpec: Border.controlSpec("normal", root.bar.foreground, Color.accent)
        Column {
          anchors.left: parent.left
          anchors.right: profilesSummaryChevron.left
          anchors.leftMargin: Style.spacing.controlPaddingX
          anchors.rightMargin: Style.spacing.controlPaddingX
          anchors.verticalCenter: parent.verticalCenter
          spacing: 1
          Text { textFormat: Text.PlainText; text: "Profiles"; color: root.bar.foreground; font.family: root.bar.fontFamily; font.pixelSize: Style.font.body; font.bold: true }
          Text { textFormat: Text.PlainText; width: parent.width; text: "Active: " + root.profile; color: Qt.darker(root.bar.foreground, 1.4); font.family: root.bar.fontFamily; font.pixelSize: Style.font.caption; elide: Text.ElideRight }
        }
        Text {
          id: profilesSummaryChevron
          textFormat: Text.PlainText
          anchors.right: parent.right
          anchors.rightMargin: Style.spacing.controlPaddingX
          anchors.verticalCenter: parent.verticalCenter
          text: "›"
          color: root.bar.foreground
          font.family: root.bar.fontFamily
          font.pixelSize: Style.font.subtitle
        }
        HoverHandler { id: profilesSummaryHover }
        MouseArea { anchors.fill: parent; cursorShape: Qt.PointingHandCursor; onClicked: root.openProfiles() }
      }

      }

      Column {
        id: modelPageColumn
        visible: root.modelsPage
        width: parent.width
        spacing: Style.space(8)
        Row {
          width: parent.width
          spacing: Style.space(8)
          Button {
            id: backButton
            text: "‹  Back"
            foreground: root.bar.foreground
            focusable: true
            onClicked: root.closeModels()
            Keys.onPressed: function(event) {
              if (event.key === Qt.Key_Escape || event.key === Qt.Key_Left || event.key === Qt.Key_Backspace) {
                root.closeModels()
                event.accepted = true
              }
            }
          }
          Text { textFormat: Text.PlainText; text: "Models"; color: root.bar.foreground; font.family: root.bar.fontFamily; font.pixelSize: Style.font.subtitle; font.bold: true; anchors.verticalCenter: parent.verticalCenter }
        }
        Text { textFormat: Text.PlainText; width: parent.width; text: "Choose a model and tune its thinking options."; color: Qt.darker(root.bar.foreground, 1.4); font.family: root.bar.fontFamily; font.pixelSize: Style.font.caption; wrapMode: Text.Wrap }
        ModelPicker {
          width: parent.width
          title: "Vision model"
          role: "vision"
          visionOnly: true
          current: root.visionCfg.model || ""
          effort: root.visionCfg.effort || "low"
          thinking: root.visionCfg.thinking !== false
          expanded: root.expandedPicker === "vision"
        }
        ModelPicker {
          width: parent.width
          title: "Reasoning model"
          role: "reasoning"
          allowSame: true
          current: root.reasoningCfg.model || ""
          emptyLabel: "Same as vision"
          effort: root.reasoningCfg.effort || "low"
          thinking: root.reasoningCfg.thinking !== false
          showControls: (root.reasoningCfg.model || "") !== ""
          expanded: root.expandedPicker === "reasoning"
        }
      }

      Column {
        id: profilesPageColumn
        visible: root.profilesPage
        width: parent.width
        spacing: Style.space(8)
        Row {
          width: parent.width
          spacing: Style.space(8)
          Button {
            id: profilesBackButton
            text: "‹  Back"
            foreground: root.bar.foreground
            focusable: true
            onClicked: root.closeProfiles()
            Keys.onPressed: function(event) {
              if (event.key === Qt.Key_Escape || event.key === Qt.Key_Left || event.key === Qt.Key_Backspace) {
                root.closeProfiles()
                event.accepted = true
              }
            }
          }
          Text { textFormat: Text.PlainText; text: "Profiles"; color: root.bar.foreground; font.family: root.bar.fontFamily; font.pixelSize: Style.font.subtitle; font.bold: true; anchors.verticalCenter: parent.verticalCenter }
        }
        Text { textFormat: Text.PlainText; width: parent.width; text: "Choose how Hermes observes, responds, and interrupts."; color: Qt.darker(root.bar.foreground, 1.4); font.family: root.bar.fontFamily; font.pixelSize: Style.font.caption; wrapMode: Text.Wrap }
        ButtonGroup {
          width: parent.width
          options: ["Coding", "Meeting", "Quiet"]
          value: root.profile
          foreground: root.bar.foreground
          fontFamily: root.bar.fontFamily
          fontSize: Style.font.bodySmall
          onChanged: function(v) { if (v !== root.profile) root.control("set-profile " + v) }
        }
        Text {
          textFormat: Text.PlainText
          width: parent.width
          text: root.profile === "Meeting"
            ? "Silent assistance with passive screen observation paused."
            : (root.profile === "Quiet"
                ? "No passive observation; Hermes responds only when explicitly asked."
                : "Proactive screen-aware help with optional spoken responses and actions.")
          color: Qt.darker(root.bar.foreground, 1.2)
          font.family: root.bar.fontFamily
          font.pixelSize: Style.font.bodySmall
          wrapMode: Text.Wrap
        }
      }

      Rectangle { visible: !root.modelsPage && !root.profilesPage; width: parent.width; height: 1; color: Qt.darker(root.bar.foreground, 3) }

      // ---- Text request ----
      Row {
        visible: !root.modelsPage && !root.profilesPage
        width: parent.width
        spacing: Style.space(6)
        TextField {
          id: askField
          width: parent.width - askBtn.width - Style.space(6)
          placeholderText: "Ask Hermes… (Enter to send)"
          font.family: root.bar.fontFamily
          font.pixelSize: Style.font.body
          foreground: root.bar.foreground
          enabled: root.alive && !root.sending
          onAccepted: root.sendText()
        }
        Button {
          id: askBtn
          anchors.verticalCenter: parent.verticalCenter
          iconText: root.sending ? "󰔟" : "󰒊"
          iconSpinning: root.sending
          foreground: root.bar.foreground
          enabled: root.alive && !root.sending && askField.text.trim() !== ""
          opacity: enabled ? 1.0 : 0.4
          tooltipText: "Send"
          onClicked: root.sendText()
        }
      }

      Rectangle { visible: !root.modelsPage && !root.profilesPage; width: parent.width; height: 1; color: Qt.darker(root.bar.foreground, 3) }

      // ---- Recent remarks: scrollable, fixed height ----
      Text {
        visible: !root.modelsPage && !root.profilesPage
        textFormat: Text.PlainText
        text: "Recent"
        color: Qt.darker(root.bar.foreground, 1.4)
        font.family: root.bar.fontFamily
        font.pixelSize: Style.font.caption
        font.bold: true
      }
      Flickable {
        visible: !root.modelsPage && !root.profilesPage
        id: remarksFlick
        width: parent.width
        // Grow downward as the chat grows: track content height, but cap so the
        // whole card can't exceed the screen (reserve room for the header,
        // controls and input above). Base the cap on the popup's available height
        // when known, else a large fraction of the screen, so it never collapses
        // to a tiny floor before the panel has finished mapping.
        readonly property real growCap: {
          var avail = popup.availableCardHeight || 0
          if (avail > 400) return avail - Style.space(300)
          var sh = popup.screenH || 0
          if (sh > 400) return sh * 0.6
          return Style.space(600)
        }
        height: Math.min(growCap, remarksCol.implicitHeight)
        contentHeight: remarksCol.implicitHeight
        clip: true
        boundsBehavior: Flickable.StopAtBounds
        // Chronological order (oldest→newest): keep the newest exchange in view.
        function toBottom() { contentY = Math.max(0, contentHeight - height) }
        onContentHeightChanged: Qt.callLater(toBottom)
        Connections {
          target: root
          function onPopupOpenChanged() { if (root.popupOpen) Qt.callLater(remarksFlick.toBottom) }
          function onRemarksChanged() { Qt.callLater(remarksFlick.toBottom) }
        }
        Column {
          id: remarksCol
          width: remarksFlick.width
          spacing: Style.space(6)
          Repeater {
            model: root.remarks
            delegate: Text {
              textFormat: Text.PlainText
              width: remarksCol.width
              wrapMode: Text.Wrap
              text: Qt.formatTime(new Date(modelData.ts * 1000), "HH:mm") + "  " + modelData.text
              color: modelData.urgency === "urgent" ? root.bar.urgent : root.bar.foreground
              font.family: root.bar.fontFamily
              font.pixelSize: Style.font.bodySmall
            }
          }
          Text {
            textFormat: Text.PlainText
            visible: root.remarks.length === 0
            text: "Nothing said yet."
            color: Qt.darker(root.bar.foreground, 1.6)
            font.family: root.bar.fontFamily
            font.pixelSize: Style.font.bodySmall
          }
        }
      }
    }
  }

  // ---- Pinned floating overlay -------------------------------------------
  // A separate wlr-layer-shell Overlay window shown only while pinned. It floats
  // above other windows on this monitor and persists across workspace switches
  // (layer surfaces are output-scoped, not workspace-bound). keyboardFocus None
  // means it never steals keystrokes from other apps (view-only). The input mask
  // is limited to the card rectangle, so clicks anywhere else pass through to the
  // window underneath. Clicking the card opens the normal interactive panel to
  // type; Super+Alt+A does the same from anywhere.
  PanelWindow {
    id: pinnedWin
    visible: root.pinned
    screen: root.QsWindow && root.QsWindow.window ? root.QsWindow.window.screen : null
    color: "transparent"
    exclusionMode: ExclusionMode.Ignore
    WlrLayershell.namespace: "hermes-companion-pinned"
    WlrLayershell.layer: WlrLayer.Overlay
    WlrLayershell.keyboardFocus: WlrKeyboardFocus.None
    anchors { top: true; bottom: true; left: true; right: true }

    // Only the card rectangle receives pointer input; the rest is click-through.
    mask: Region { item: pinnedCard }

    readonly property int cardWidth: Math.round(Math.min(Style.space(440), width - Style.space(24)))
    readonly property int cardMaxHeight: Math.round(height - Style.space(48))

    BorderSurface {
      id: pinnedCard
      x: Math.round(pinnedWin.width - width - Style.space(12))   // top-right of the monitor
      y: Style.space(12)
      width: pinnedWin.cardWidth
      height: Math.min(pinnedWin.cardMaxHeight, pinnedContent.implicitHeight + padding * 2)
      color: Color.popups.background
      borderSpec: Border.surfaceSpec("popups", "border", Color.popups.border, Math.max(1, Style.space(2)))
      padding: Style.spacing.popupPadding
      radius: Style.cornerRadius

      MouseArea {
        anchors.fill: parent
        acceptedButtons: Qt.LeftButton
        cursorShape: Qt.PointingHandCursor
        // Click the pinned card to open the interactive panel and type a question.
        onClicked: root.open()
      }

      Column {
        id: pinnedContent
        anchors.fill: parent
        anchors.margins: pinnedCard.padding
        spacing: Style.space(6)

        Row {
          width: parent.width
          spacing: Style.space(6)
          Text {
            textFormat: Text.PlainText
            text: "󰐃 Hermes — pinned"
            color: Qt.darker(root.bar.foreground, 1.2)
            font.family: root.bar.fontFamily
            font.pixelSize: Style.font.caption
            font.bold: true
            width: parent.width - unpinBtn.width - Style.space(6)
            elide: Text.ElideRight
          }
          Text {
            id: unpinBtn
            textFormat: Text.PlainText
            text: "󰤱 unpin"
            color: root.bar.foreground
            font.family: root.bar.fontFamily
            font.pixelSize: Style.font.caption
            MouseArea { anchors.fill: parent; cursorShape: Qt.PointingHandCursor; onClicked: root.pinned = false }
          }
        }

        Flickable {
          id: pinnedFlick
          width: parent.width
          height: Math.min(pinnedWin.cardMaxHeight - Style.space(40), pinnedCol.implicitHeight)
          contentHeight: pinnedCol.implicitHeight
          clip: true
          boundsBehavior: Flickable.StopAtBounds
          function toBottom() { contentY = Math.max(0, contentHeight - height) }
          onContentHeightChanged: Qt.callLater(toBottom)
          Connections {
            target: root
            function onRemarksChanged() { Qt.callLater(pinnedFlick.toBottom) }
          }
          Column {
            id: pinnedCol
            width: pinnedFlick.width
            spacing: Style.space(6)
            Repeater {
              model: root.remarks
              delegate: Text {
                textFormat: Text.PlainText
                width: pinnedCol.width
                wrapMode: Text.Wrap
                text: Qt.formatTime(new Date(modelData.ts * 1000), "HH:mm") + "  " + modelData.text
                color: modelData.urgency === "urgent" ? root.bar.urgent : root.bar.foreground
                font.family: root.bar.fontFamily
                font.pixelSize: Style.font.bodySmall
              }
            }
            Text {
              textFormat: Text.PlainText
              visible: root.remarks.length === 0
              text: "Nothing said yet."
              color: Qt.darker(root.bar.foreground, 1.6)
              font.family: root.bar.fontFamily
              font.pixelSize: Style.font.bodySmall
            }
          }
        }
      }
    }
  }
}




