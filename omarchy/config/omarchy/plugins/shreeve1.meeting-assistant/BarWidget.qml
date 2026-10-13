import QtQuick
import qs.Commons
import qs.Ui

BarWidget {
  id: root
  moduleName: "shreeve1.meeting-assistant"

  property var service: null
  readonly property string serviceState: service ? String(service.state) : "unavailable"
  readonly property int cardCount: service ? service.cards.count : 0
  readonly property color foreground: bar ? bar.foreground : Color.foreground
  readonly property color urgent: bar ? bar.urgent : Color.urgent
  readonly property string fontFamily: bar ? bar.fontFamily : Style.font.family
  readonly property string statusGlyph: serviceState === "paused" ? "󰏤"
    : serviceState === "researching" ? "󰔟"
    : serviceState === "error" || serviceState === "unavailable" ? "󰅚"
    : "󰔊"
  readonly property color statusColor: serviceState === "error" || serviceState === "unavailable" ? urgent
    : serviceState === "researching" ? Color.accent
    : serviceState === "listening" ? foreground
    : Color.muted
  readonly property string askState: service ? String(service.askState) : "stopped"
  readonly property string askError: service ? String(service.askError) : ""
  readonly property string tooltip: {
    if (!service) return "Meeting Assistant unavailable"
    var lines = []
    if (serviceState === "paused") lines.push(service.pausedNotice)
    else if (serviceState === "unavailable") lines.push("Meeting Assistant unavailable" + (service.detail ? ": " + service.detail : ""))
    else if (serviceState === "error") lines.push("Meeting Assistant error" + (service.detail ? ": " + service.detail : ""))
    if (askState === "error") lines.push("Ask error" + (askError ? ": " + askError : ""))
    else if (askState === "busy") lines.push("Ask is working")
    return lines.join("\n")
  }

  function resolveService() {
    service = bar && bar.shell ? bar.shell.serviceFor(moduleName) : null
  }

  implicitWidth: button.implicitWidth
  implicitHeight: button.implicitHeight

  onBarChanged: resolveService()
  Component.onCompleted: resolveService()

  Timer {
    interval: 1000
    repeat: true
    running: !root.service
    onTriggered: root.resolveService()
  }

  BarIconButton {
    id: button
    anchors.fill: parent
    bar: root.bar
    active: root.serviceState === "researching" || root.serviceState === "error" || root.serviceState === "unavailable"
    activeColor: root.statusColor
    tooltipText: root.tooltip
    iconComponent: Component {
      Item {
        OpticalGlyph {
          anchors.centerIn: parent
          width: parent.width
          height: parent.height
          text: root.statusGlyph
          color: root.statusColor
          fontFamily: root.fontFamily
          fontSize: Style.bar.iconFont
        }

        Rectangle {
          visible: root.cardCount > 0
          width: Math.max(Style.space(10), badgeText.implicitWidth + Style.space(4))
          height: Style.space(10)
          radius: height / 2
          color: Color.accent
          anchors.right: parent.right
          anchors.bottom: parent.bottom

          Text {
            id: badgeText
            anchors.centerIn: parent
            textFormat: Text.PlainText
            text: String(root.cardCount)
            color: root.bar ? root.bar.background : Color.background
            font.family: root.fontFamily
            font.pixelSize: Style.font.caption
            font.bold: true
          }
        }
      }
    }
    onPressed: function(buttonCode) {
      if (!root.service) return
      if (buttonCode === Qt.RightButton) root.service.dismissAll()
      else root.service.togglePause()
    }
  }
}
