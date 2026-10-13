import QtQuick
import QtQuick.Layouts
import qs.Commons
import qs.Ui

// The Ask box: Timeline above, input below. The Overlay window owns the size
// and the keyboard-focus sequence; this item only fills it.
BorderSurface {
  id: root

  required property var assistant

  readonly property color textColor: Color.notifications.text
  readonly property color dimColor: Qt.darker(textColor, 1.4)
  readonly property bool busy: assistant.askState === "busy"
  readonly property bool paused: assistant.state === "paused"

  property bool confirmingNew: false

  function submit() {
    var text = input.text
    if (text.trim() === "") return
    if (assistant.ask(text)) {
      input.clear()
      timeline.jumpToEnd()
    }
  }

  function requestNewConversation() {
    if (!confirmingNew) {
      confirmingNew = true
      confirmTimer.restart()
      return
    }
    confirmTimer.stop()
    confirmingNew = false
    assistant.newConversation()
  }

  radius: Style.cornerRadius
  color: Color.notifications.background
  borderSpec: Border.surfaceSpec("notifications", "border", Color.notifications.border, Math.max(1, Style.space(2)))
  clip: true

  Component.onCompleted: {
    timeline.jumpToEnd()
    Qt.callLater(function() { input.forceActiveFocus() })
  }

  Timer {
    id: confirmTimer
    interval: 4000
    onTriggered: root.confirmingNew = false
  }

  ColumnLayout {
    anchors.fill: parent
    anchors.topMargin: root.contentTopInset + Style.space(8)
    anchors.rightMargin: root.contentRightInset + Style.space(10)
    anchors.bottomMargin: root.contentBottomInset + Style.space(10)
    anchors.leftMargin: root.contentLeftInset + Style.space(10)
    spacing: Style.space(6)

    RowLayout {
      Layout.fillWidth: true
      spacing: Style.space(6)

      Text {
        textFormat: Text.PlainText
        Layout.fillWidth: true
        text: "Ask"
        font.family: Style.font.family
        font.pixelSize: Style.font.title
        font.bold: true
        color: root.textColor
      }

      Button {
        text: root.confirmingNew ? "Delete saved conversation?" : "New conversation"
        fontSize: Style.font.bodySmall
        foreground: root.confirmingNew ? Color.urgent : root.dimColor
        onClicked: root.requestNewConversation()
      }
    }

    Text {
      textFormat: Text.PlainText
      Layout.fillWidth: true
      visible: root.paused
      text: root.assistant.pausedNotice
      font.family: Style.font.family
      font.pixelSize: Style.font.caption
      color: Color.accent
      wrapMode: Text.Wrap
    }

    TimelineView {
      id: timeline
      Layout.fillWidth: true
      Layout.fillHeight: true
      assistant: root.assistant
    }

    RowLayout {
      Layout.fillWidth: true
      visible: root.busy
      spacing: Style.space(6)

      Text {
        id: busyText
        textFormat: Text.PlainText
        text: "Working…"
        font.family: Style.font.family
        font.pixelSize: Style.font.caption
        color: root.dimColor

        SequentialAnimation on opacity {
          running: root.busy
          loops: Animation.Infinite
          NumberAnimation { from: 1; to: 0.35; duration: 600 }
          NumberAnimation { from: 0.35; to: 1; duration: 600 }
        }
      }

      Item { Layout.fillWidth: true }

      Button {
        text: "Stop"
        bordered: true
        fontSize: Style.font.bodySmall
        onClicked: root.assistant.stopAsk()
      }
    }

    TextField {
      id: input
      Layout.fillWidth: true
      placeholderText: root.busy ? "Message (queued until the reply ends)" : "Ask"
      text: root.assistant.askDraft
      focus: true
      onTextChanged: root.assistant.askDraft = text
      onAccepted: root.submit()
      Keys.onEscapePressed: root.assistant.askEscape()
    }
  }

  Keys.onEscapePressed: assistant.askEscape()
}
