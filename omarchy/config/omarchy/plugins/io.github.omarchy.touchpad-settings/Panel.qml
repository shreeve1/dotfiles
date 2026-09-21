pragma ComponentBehavior: Bound
import QtQuick
import QtQuick.Layouts
import Quickshell.Io
import qs.Commons
import qs.Ui
Panel {
  id: root
  moduleName: "io.github.omarchy.touchpad-settings"
  ipcTarget: moduleName
  manageIpc: false
  readonly property string fontFamily: bar ? bar.fontFamily : Style.font.family
  implicitWidth: button.implicitWidth
  implicitHeight: button.implicitHeight
  onOpenedChanged: if (opened) touchpad.refresh()

  function adjust(key, delta, minimum, maximum) {
    var scale = key === "sensitivity" ? 20 : 10
    var current = Number(touchpad.draft[key])
    // Quantize in integer ticks rather than accumulating binary floating-point
    // error across repeated button presses.
    var next = Math.round((current + delta) * scale) / scale
    touchpad.setDraft(key, Math.max(minimum, Math.min(maximum, next)))
  }
  Service { id: touchpad }

  BarIconButton {
    id: button
    anchors.fill: parent
    bar: root.bar
    text: "󰕵"
    active: root.opened
    tooltipText: "Touchpad settings"
    onPressed: function(buttonCode) { if (buttonCode === Qt.RightButton) touchpad.refresh(); else root.toggle() }
  }
  IpcHandler {
    target: root.ipcTarget
    function open(): void { root.open() }
    function close(): void { root.close() }
    function toggle(): void { root.toggle() }
    function refresh(): string { touchpad.refresh(); return "ok" }
  }
  KeyboardPanel {
    id: panel
    anchorItem: button
    owner: root
    bar: root.bar
    open: root.opened
    focusTarget: keyCatcher
    contentWidth: panel.fittedContentWidth(Style.space(400))
    contentHeight: panel.fittedContentHeight(column.implicitHeight)
    PanelKeyCatcher {
      id: keyCatcher
      anchors.fill: parent
      onCloseRequested: root.close()
      onActivateRequested: if (touchpad.available && !touchpad.busy) touchpad.submit()
      Column {
        id: column
        width: parent.width
        spacing: Style.space(10)
        PanelHero {
          width: parent.width
          title: "Touchpad settings"
          meta: touchpad.available ? "Hyprland / libinput" : "Reading touchpad settings"
          detail: touchpad.error
        }
        PanelSectionHeader { text: "POINTER"; foreground: Color.foreground; fontFamily: root.fontFamily }
        RowLayout {
          width: parent.width
          Text { text: "Sensitivity  " + Number(touchpad.draft.sensitivity || 0).toFixed(2); color: Color.foreground; Layout.fillWidth: true }
          Button { text: "−"; onClicked: root.adjust("sensitivity", -.05, -1, 1) }
          Button { text: "+"; onClicked: root.adjust("sensitivity", .05, -1, 1) }
        }
        RowLayout {
          width: parent.width
          Text { text: "Scroll factor  " + Number(touchpad.draft.scroll_factor || 0).toFixed(1); color: Color.foreground; Layout.fillWidth: true }
          Button { text: "−"; onClicked: root.adjust("scroll_factor", -.1, .1, 2) }
          Button { text: "+"; onClicked: root.adjust("scroll_factor", .1, .1, 2) }
        }
        PanelSectionHeader { text: "TOUCHPAD"; foreground: Color.foreground; fontFamily: root.fontFamily }
        Repeater {
          model: [
            { key: "natural_scroll", label: "Natural scrolling" },
            { key: "tap_to_click", label: "Tap to click" },
            { key: "clickfinger_behavior", label: "Clickfinger behavior" },
            { key: "disable_while_typing", label: "Disable while typing" },
            { key: "tap_and_drag", label: "Tap and drag" },
            { key: "middle_button_emulation", label: "Middle-button emulation" }
          ]
          delegate: Toggle {
            required property var modelData
            width: column.width
            label: modelData.label
            checked: !!touchpad.draft[modelData.key]
            onClicked: touchpad.setDraft(modelData.key, !checked)
          }
        }
        Button {
          width: parent.width
          text: touchpad.busy ? "Applying…" : "Apply settings"
          enabled: touchpad.available && !touchpad.busy
          onClicked: touchpad.submit()
        }
        Text {
          width: parent.width
          text: "Changes apply with hyprctl and save per user. Startup restore is a no-op until you apply."
          color: Qt.darker(Color.foreground, 1.4)
          wrapMode: Text.WordWrap
        }
      }
    }
  }
}
