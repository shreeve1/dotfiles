import QtQuick
import Quickshell
import qs.Commons
import qs.Ui as Ui

Item {
  id: root
  property var host: null
  property var session: null
  property string voicePrefix: ""
  property string localStatus: ""
  readonly property color foreground: host ? host.foreground : "white"
  readonly property color muted: host ? host.muted : "#aaa"
  readonly property color accent: host ? host.accent : "#8bceb4"
  readonly property string fontFamily: host && host.fontFamily ? host.fontFamily : Style.font.menuFamily
  readonly property int fontInput: host ? host.fontInput : Style.font.heading
  readonly property int fontTitle: host ? host.fontTitle : Style.font.title
  readonly property int fontBody: host ? host.fontBody : Style.font.body
  readonly property int fontLabel: host ? host.fontLabel : Style.font.bodySmall
  readonly property int fontCaption: host ? host.fontCaption : Style.font.caption
  readonly property var approval: session ? session.approval : null

  function focusInput() { composer.forceActiveFocus(); composer.cursorPosition = composer.text.length }
  function beginVoice() { voicePrefix = session.draft ? session.draft.replace(/\s*$/, " ") : "" }
  function transcript(text, final) { session.draft = voicePrefix + text; composer.cursorPosition = composer.text.length }
  function dismiss() { session.dismiss() }
  function markdown(text) { return String(text).replace(/</g, "&lt;").replace(/!\[([^\]]*)\]\(([^)]*)\)/g, "[$1]($2)") }
  function syncMessages() {
    if (!session) return
    var rows = session.messages, follow = history.atYEnd || !history.count
    while (display.count > rows.length) display.remove(display.count - 1)
    for (var i = 0; i < rows.length; i++) {
      if (i >= display.count) display.append(rows[i])
      else if (display.get(i).id !== rows[i].id) display.set(i, rows[i])
      else if (display.get(i).text !== rows[i].text) display.setProperty(i, "text", rows[i].text)
    }
    if (follow) Qt.callLater(function() { history.positionViewAtEnd() })
  }
  function copyAnswer() {
    var text = session.answer()
    if (!text) return
    Quickshell.execDetached(["bash", "-lc", "printf %s \"$1\" | wl-copy", "keystroke-hermes-copy", text])
    localStatus = "Answer copied"
  }

  onSessionChanged: syncMessages()
  Component.onCompleted: Qt.callLater(focusInput)
  Connections {
    target: root.session
    function onMessagesChanged() { root.syncMessages() }
    function onDraftChanged() { if (composer.text !== root.session.draft) composer.text = root.session.draft }
    function onApprovalChanged() { if (root.approval) cancelPermission.forceActiveFocus(); else root.focusInput() }
  }
  Keys.onPressed: function(event) {
    if (event.key === Qt.Key_Escape) { host.cancel(); event.accepted = true }
  }

  component ActionButton: Ui.Button {
    id: control
    property alias label: control.text
    property bool available: true
    signal triggered()
    focusable: true; enabled: available; opacity: enabled ? 1 : 0.4
    foreground: root.foreground; accent: root.accent; fontFamily: root.fontFamily; fontSize: root.fontLabel
    width: implicitWidth; height: implicitHeight
    onClicked: triggered()
    Keys.onReturnPressed: event => { if (!event.isAutoRepeat) triggered(); event.accepted = true }
    Keys.onEnterPressed: event => { if (!event.isAutoRepeat) triggered(); event.accepted = true }
    Keys.onSpacePressed: event => { if (!event.isAutoRepeat) triggered(); event.accepted = true }
  }

  Item {
    id: top
    enabled: !root.approval
    x: Style.space(22); y: Style.space(12); width: parent.width - x * 2; height: Style.space(74)
    ActionButton { id: back; label: "←"; tooltipText: "Back to results"; onTriggered: host.goBack() }
    Row {
      anchors.left: back.right; anchors.leftMargin: Style.space(10); y: Style.space(8); spacing: Style.space(10)
      Text { text: "OMARCHY"; color: root.accent; font.family: root.fontFamily; font.pixelSize: root.fontCaption; font.letterSpacing: 2; font.weight: Font.Bold }
      Text { text: "›"; color: root.muted; font.family: root.fontFamily; font.pixelSize: root.fontLabel }
      Text { text: "Hermes"; color: root.muted; font.family: root.fontFamily; font.pixelSize: root.fontLabel }
    }
    Text {
      y: Style.space(43); width: parent.width; elide: Text.ElideMiddle
      text: (session.title || "Hermes") + " · " + session.cwd
      color: root.muted; font.family: root.fontFamily; font.pixelSize: root.fontLabel
    }
  }
  Rectangle { y: top.y + top.height; width: parent.width; height: 1; color: Util.alpha(root.foreground, 0.10) }

  ListModel { id: display }
  ListView {
    id: history
    enabled: !root.approval
    x: Style.space(22); y: top.y + top.height + Style.space(8)
    width: parent.width - x * 2; height: Math.max(0, status.y - y - Style.space(12))
    clip: true; spacing: Style.space(16); model: display; boundsBehavior: Flickable.StopAtBounds
    delegate: Item {
      required property string id
      required property string role
      required property string text
      width: history.width; height: label.height + body.height + Style.space(6)
      Text { id: label; text: parent.role === "user" ? "You" : parent.role === "activity" ? "Activity" : "Hermes"; color: parent.role === "user" ? root.muted : root.accent; font.family: root.fontFamily; font.pixelSize: root.fontLabel }
      TextEdit {
        id: body; y: label.height + Style.space(6); width: parent.width; height: contentHeight
        text: root.markdown(parent.text); textFormat: TextEdit.MarkdownText; wrapMode: TextEdit.Wrap
        readOnly: true; selectByMouse: true; color: root.foreground
        selectionColor: Style.selectionFillFor(root.foreground, root.accent)
        font.family: root.fontFamily; font.pixelSize: parent.role === "activity" ? root.fontLabel : root.fontTitle
        onLinkActivated: function(link) { if (/^https?:\/\//.test(link)) Qt.openUrlExternally(link) }
      }
    }
    Text { visible: !history.count; anchors.centerIn: parent; width: parent.width; horizontalAlignment: Text.AlignHCenter; wrapMode: Text.Wrap; text: session.busy ? "Connecting to Hermes…" : "Ask a question or give Hermes a task.\nResponses and tool activity stay in this view."; color: root.muted; font.family: root.fontFamily; font.pixelSize: root.fontTitle }
  }

  Text {
    id: status
    x: Style.space(22); y: inputBox.y - height - Style.space(10); width: parent.width - x * 2
    text: host && host.voice.active ? (host.voice.phase === "transcribing" ? "Finishing transcript…" : "Listening…") : session.error || root.localStatus || session.activity
    color: session.error ? Color.urgent : root.muted; elide: Text.ElideRight
    font.family: root.fontFamily; font.pixelSize: root.fontLabel
  }

  Ui.BorderSurface {
    id: inputBox
    enabled: !root.approval
    x: Style.space(18); width: parent.width - x * 2
    height: Math.min(Style.space(115), Math.max(Style.space(50), composer.contentHeight + Style.space(24)))
    y: bottom.y - height - Style.space(20); radius: Style.cornerRadius
    color: Style.controlFill(composer.activeFocus, false, root.foreground, root.accent)
    borderSpec: Border.controlSpec(composer.activeFocus ? "focus" : "normal", root.foreground, root.accent)
    Flickable {
      id: editorScroll
      x: Style.space(12); y: Style.space(12); width: parent.width - Style.space(80); height: parent.height - y * 2
      clip: true; contentWidth: width; contentHeight: Math.max(height, composer.contentHeight); boundsBehavior: Flickable.StopAtBounds
      TextEdit {
        id: composer
        width: editorScroll.width; height: Math.max(editorScroll.height, contentHeight)
        text: session.draft; wrapMode: TextEdit.Wrap; clip: true; selectByMouse: true
        color: root.foreground; selectionColor: Style.selectionFillFor(root.foreground, root.accent)
        font.family: root.fontFamily; font.pixelSize: root.fontInput
        onTextChanged: if (activeFocus && text !== session.draft) session.draft = text
        Keys.priority: Keys.BeforeItem
        Keys.onReleased: function(event) { if (host.voice.active && host.voiceTrigger === "hold" && host.isSuperKey(event.key)) { host.voiceStop(); event.accepted = true } }
        Keys.onPressed: function(event) {
          if (event.key === Qt.Key_Escape) { host.cancel(); event.accepted = true; return }
          if ((event.key === Qt.Key_Return || event.key === Qt.Key_Enter) && event.isAutoRepeat) { event.accepted = true; return }
          if (host.voice.active) {
            if (event.key === Qt.Key_Return || event.key === Qt.Key_Enter) { host.voiceStop(); event.accepted = true; return }
            if (host.isModifierKey(event.key)) return
            host.voiceCancel()
          }
          if ((event.key === Qt.Key_Left || event.key === Qt.Key_Backspace) && !text && !preeditText && event.modifiers === Qt.NoModifier) { host.goBack(); event.accepted = true; return }
          if ((event.key === Qt.Key_Return || event.key === Qt.Key_Enter) && !(event.modifiers & Qt.ShiftModifier)) { session.submit(); event.accepted = true }
        }
        Text { anchors.fill: parent; visible: !composer.text; text: session.messages.length ? "Follow up…" : "Ask anything…"; color: root.muted; font: composer.font }
      }
    }
    ActionButton { anchors.right: parent.right; anchors.rightMargin: Style.space(9); anchors.verticalCenter: parent.verticalCenter; visible: host && !host.voice.active; label: "Mic"; onTriggered: { root.focusInput(); host.voiceBegin("tap") } }
  }

  Rectangle { y: bottom.y - Style.space(10); width: parent.width; height: 1; color: Util.alpha(root.foreground, 0.10) }
  Row {
    id: bottom
    enabled: !root.approval
    x: Style.space(18); y: parent.height - height - Style.space(16); spacing: Style.space(8); height: Style.space(30)
    ActionButton { label: "Send"; available: session.draft.trim().length > 0 && !session.busy; onTriggered: session.submit() }
    ActionButton { label: "Stop"; available: session.busy; onTriggered: session.stop() }
    ActionButton { label: "Copy answer"; available: session.answer().length > 0; onTriggered: root.copyAnswer() }
    ActionButton { label: "New"; available: !session.busy; onTriggered: { session.newConversation("", session.cwd); root.focusInput() } }
  }

  Rectangle {
    anchors.fill: parent; visible: !!root.approval; color: host ? host.background : "#222"; z: 10
    MouseArea { anchors.fill: parent }
    Flickable {
      anchors.fill: parent; anchors.margins: Style.space(22); clip: true; contentHeight: permissionContent.height
      Column {
        id: permissionContent
        width: parent.width; spacing: Style.space(16)
        Text { text: "Hermes needs permission"; color: root.foreground; font.family: root.fontFamily; font.pixelSize: root.fontInput }
        Text { width: parent.width; wrapMode: Text.Wrap; text: session.approvalTitle(); color: root.foreground; font.family: root.fontFamily; font.pixelSize: root.fontTitle }
        TextEdit { width: parent.width; height: contentHeight; readOnly: true; selectByMouse: true; wrapMode: TextEdit.Wrap; color: root.muted; font.family: root.fontFamily; font.pixelSize: root.fontBody; text: session.approvalDetail() }
        Row {
          id: permissionButtons
          spacing: Style.space(10)
          Repeater {
            model: root.approval ? root.approval.params.options || [] : []
            ActionButton { required property var modelData; label: modelData.name || modelData.optionId; onTriggered: session.decide(modelData.optionId) }
          }
          ActionButton { id: cancelPermission; label: "Cancel"; onTriggered: session.decide("") }
        }
      }
    }
  }
}
