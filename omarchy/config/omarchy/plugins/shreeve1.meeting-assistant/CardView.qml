import QtQuick
import QtQuick.Layouts
import qs.Commons
import qs.Ui

BorderSurface {
  id: root

  property string question: ""
  property string answer: ""
  property var sources: []
  property var lagMs: null
  property double expiresAt: 0

  readonly property color bodyColor: Qt.darker(Color.notifications.text, 1.15)
  readonly property color dimColor: Qt.darker(Color.notifications.text, 1.4)
  readonly property var cardBorderSpec: Border.surfaceSpec("notifications", "border", Color.notifications.border, Math.max(1, Style.space(2)))
  readonly property var hosts: hostsOf(sources)
  readonly property string footer: {
    var parts = []
    if (typeof lagMs === "number" && isFinite(lagMs)) parts.push("ready " + (lagMs / 1000).toFixed(1) + "s after speech")
    if (hosts.length > 0) parts.push(hosts.join(" · "))
    return parts.join("  ·  ")
  }

  property real appear: 0
  property real vanish: 1

  function hostsOf(list) {
    var out = []
    var items = Array.isArray(list) ? list : []
    for (var i = 0; i < items.length && out.length < 3; i++) {
      var url = String(items[i] && items[i].url !== undefined ? items[i].url : items[i] || "")
      var match = /^[a-z][a-z0-9+.-]*:\/\/(?:[^\/?#@]*@)?([^\/?#:]+)/i.exec(url)
      if (!match) continue
      var host = match[1].toLowerCase().replace(/^www\./, "")
      if (out.indexOf(host) === -1) out.push(host)
    }
    return out
  }

  implicitWidth: Style.space(380)
  implicitHeight: mainColumn.implicitHeight + borderTop + borderBottom
  radius: Style.cornerRadius
  color: Color.notifications.background
  borderSpec: cardBorderSpec
  clip: true
  opacity: appear * vanish

  Component.onCompleted: {
    appearAnim.start()
    var remaining = root.expiresAt - Date.now() - 1000
    vanishDelay.duration = Math.max(0, remaining)
    vanishAnim.start()
  }

  NumberAnimation {
    id: appearAnim
    target: root
    property: "appear"
    from: 0
    to: 1
    duration: 200
    easing.type: Easing.OutCubic
  }

  SequentialAnimation {
    id: vanishAnim
    PauseAnimation { id: vanishDelay }
    NumberAnimation {
      target: root
      property: "vanish"
      to: 0
      duration: 1000
    }
  }

  ColumnLayout {
    id: mainColumn
    anchors.top: parent.top
    anchors.left: parent.left
    anchors.right: parent.right
    anchors.topMargin: root.borderTop
    anchors.leftMargin: root.borderLeft
    anchors.rightMargin: root.borderRight
    spacing: Style.space(4)

    Text {
      textFormat: Text.PlainText
      Layout.fillWidth: true
      Layout.leftMargin: Style.space(12)
      Layout.rightMargin: Style.space(12)
      Layout.topMargin: Style.space(10)
      text: root.question
      font.family: Style.font.family
      font.pixelSize: Style.font.title
      font.bold: true
      color: Color.notifications.text
      maximumLineCount: 1
      elide: Text.ElideRight
    }

    Text {
      textFormat: Text.PlainText
      Layout.fillWidth: true
      Layout.leftMargin: Style.space(12)
      Layout.rightMargin: Style.space(12)
      text: root.answer
      font.family: Style.font.family
      font.pixelSize: Style.font.body
      color: root.bodyColor
      wrapMode: Text.WordWrap
      maximumLineCount: 6
      elide: Text.ElideRight
    }

    Text {
      textFormat: Text.PlainText
      Layout.fillWidth: true
      Layout.leftMargin: Style.space(12)
      Layout.rightMargin: Style.space(12)
      Layout.bottomMargin: Style.space(10)
      visible: root.footer.length > 0
      text: root.footer
      font.family: Style.font.family
      font.pixelSize: Style.font.caption
      color: root.dimColor
      maximumLineCount: 1
      elide: Text.ElideRight
    }
  }
}
