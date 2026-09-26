pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Controls
import Quickshell.Io
import qs.Commons
import qs.Ui

Panel {
  id: root

  moduleName: "io.github.omarchy.touchpad-settings"
  ipcTarget: moduleName
  manageIpc: false

  readonly property color foreground: bar ? bar.foreground : Color.foreground
  readonly property color accent: Color.accent
  readonly property color urgent: bar ? bar.urgent : Color.urgent
  readonly property string fontFamily: bar ? bar.fontFamily : Style.font.family
  readonly property bool controlsEnabled: touchpad.available && !touchpad.busy

  implicitWidth: button.implicitWidth
  implicitHeight: button.implicitHeight

  onOpenedChanged: if (opened) touchpad.refresh()

  function draftNumber(name, fallback) {
    var value = Number(touchpad.draft[name])
    return Number.isFinite(value) ? value : fallback
  }

  function quantized(value, minimum, maximum, step) {
    var number = Number(value)
    if (!Number.isFinite(number)) number = minimum
    var ticks = Math.round((number - minimum) / step)
    var snapped = minimum + ticks * step
    return Number(Math.max(minimum, Math.min(maximum, snapped)).toFixed(6))
  }

  function setSnappedDraft(name, value, minimum, maximum, step) {
    touchpad.setDraft(name, quantized(value, minimum, maximum, step))
  }

  Service {
    id: touchpad
  }

  BarIconButton {
    id: button
    anchors.fill: parent
    bar: root.bar
    text: "󰕵"
    active: root.opened
    tooltipText: "ThinkPad Input"
    onPressed: function(buttonCode) {
      if (buttonCode === Qt.RightButton) touchpad.refresh()
      else root.toggle()
    }
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
    contentWidth: panel.fittedContentWidth(Style.space(390))
    contentHeight: panel.fittedContentHeight(panelColumn.implicitHeight, Style.space(560))

    PanelKeyCatcher {
      id: keyCatcher
      anchors.fill: parent
      onCloseRequested: root.close()
      onActivateRequested: if (root.controlsEnabled) touchpad.submit()

      ScrollView {
        id: scrollArea
        anchors.fill: parent
        clip: true
        ScrollBar.horizontal.policy: ScrollBar.AlwaysOff
        ScrollBar.vertical.policy: panelColumn.implicitHeight > height ? ScrollBar.AsNeeded : ScrollBar.AlwaysOff

        Binding {
          target: scrollArea.contentItem
          property: "interactive"
          value: panelColumn.implicitHeight > scrollArea.height
        }

        Column {
          id: panelColumn
          width: scrollArea.availableWidth
          spacing: Style.space(14)

          PanelHero {
            width: parent.width
            title: "ThinkPad Input"
            meta: touchpad.error !== ""
              ? "Input devices unavailable"
              : touchpad.busy
                ? "Reading or applying settings"
                : "ELAN touchpad and TrackPoint"
            detail: touchpad.error !== ""
              ? "Error"
              : touchpad.busy
                ? "Working"
                : touchpad.available ? "Ready" : ""
            foreground: root.foreground
            fontFamily: root.fontFamily
            iconOpacity: touchpad.available ? 1.0 : 0.55
            iconComponent: Component {
              Text {
                textFormat: Text.PlainText
                text: "󰕵"
                color: root.foreground
                font.family: root.fontFamily
                font.pixelSize: Style.font.display
              }
            }
          }

          Text {
            visible: touchpad.error !== ""
            width: parent.width
            textFormat: Text.PlainText
            text: touchpad.error
            color: root.urgent
            font.family: root.fontFamily
            font.pixelSize: Style.font.body
            font.bold: true
            wrapMode: Text.WordWrap
          }

          PanelSectionHeader {
            text: "TOUCHPAD"
            foreground: root.foreground
            fontFamily: root.fontFamily
          }

          Column {
            width: parent.width
            spacing: Style.space(6)
            enabled: root.controlsEnabled
            opacity: enabled ? 1.0 : 0.55

            Item {
              width: parent.width
              implicitHeight: Math.max(touchpadSpeedLabel.implicitHeight, touchpadSpeedValue.implicitHeight)

              Text {
                id: touchpadSpeedLabel
                anchors.left: parent.left
                text: "Pointer speed"
                color: root.foreground
                font.family: root.fontFamily
                font.pixelSize: Style.font.subtitle
                font.bold: true
              }

              Text {
                id: touchpadSpeedValue
                anchors.right: parent.right
                text: root.quantized(
                  touchpadSpeed.dragging ? touchpadSpeed.liveValue : root.draftNumber("touchpad_sensitivity", 0),
                  -1, 1, 0.05).toFixed(2)
                color: Qt.darker(root.foreground, 1.4)
                font.family: root.fontFamily
                font.pixelSize: Style.font.caption
                font.bold: true
              }
            }

            PanelSlider {
              id: touchpadSpeed
              bar: root.bar
              width: parent.width
              minimum: -1
              maximum: 1
              step: 0.05
              value: root.draftNumber("touchpad_sensitivity", 0)
              onMoved: function(value) {
                root.setSnappedDraft("touchpad_sensitivity", value, minimum, maximum, step)
              }
            }
          }

          Column {
            width: parent.width
            spacing: Style.space(6)
            enabled: root.controlsEnabled
            opacity: enabled ? 1.0 : 0.55

            Item {
              width: parent.width
              implicitHeight: Math.max(scrollFactorLabel.implicitHeight, scrollFactorValue.implicitHeight)

              Text {
                id: scrollFactorLabel
                anchors.left: parent.left
                text: "Scroll speed"
                color: root.foreground
                font.family: root.fontFamily
                font.pixelSize: Style.font.subtitle
                font.bold: true
              }

              Text {
                id: scrollFactorValue
                anchors.right: parent.right
                text: root.quantized(
                  scrollFactor.dragging ? scrollFactor.liveValue : root.draftNumber("scroll_factor", 1),
                  0.1, 2, 0.1).toFixed(1) + "×"
                color: Qt.darker(root.foreground, 1.4)
                font.family: root.fontFamily
                font.pixelSize: Style.font.caption
                font.bold: true
              }
            }

            PanelSlider {
              id: scrollFactor
              bar: root.bar
              width: parent.width
              minimum: 0.1
              maximum: 2
              step: 0.1
              value: root.draftNumber("scroll_factor", 1)
              onMoved: function(value) {
                root.setSnappedDraft("scroll_factor", value, minimum, maximum, step)
              }
            }
          }

          Repeater {
            model: [
              {
                key: "natural_scroll",
                label: "Natural scrolling",
                description: "Move content in the same direction as your fingers."
              },
              {
                key: "tap_to_click",
                label: "Tap to click",
                description: "Register a light tap as a click."
              },
              {
                key: "clickfinger_behavior",
                label: "Clickfinger behavior",
                description: "Choose click actions by the number of fingers on the clickpad."
              },
              {
                key: "disable_while_typing",
                label: "Disable while typing",
                description: "Ignore accidental touchpad input while keys are pressed."
              },
              {
                key: "tap_and_drag",
                label: "Tap and drag",
                description: "Keep dragging after a tap without holding the clickpad down."
              },
              {
                key: "middle_button_emulation",
                label: "Touchpad middle-click emulation",
                description: "Press the left and right touchpad click actions together for a middle click. This is separate from TrackPoint scrolling."
              }
            ]

            delegate: Toggle {
              required property var modelData
              width: panelColumn.width
              label: modelData.label
              description: modelData.description
              foreground: root.foreground
              accent: root.accent
              fontFamily: root.fontFamily
              checked: !!touchpad.draft[modelData.key]
              enabled: root.controlsEnabled
              opacity: enabled ? 1.0 : 0.55
              onClicked: touchpad.setDraft(modelData.key, !checked)
            }
          }

          PanelSeparator {
            foreground: root.foreground
          }

          PanelSectionHeader {
            text: "TRACKPOINT"
            foreground: root.foreground
            fontFamily: root.fontFamily
          }

          Column {
            width: parent.width
            spacing: Style.space(6)
            enabled: root.controlsEnabled
            opacity: enabled ? 1.0 : 0.55

            Item {
              width: parent.width
              implicitHeight: Math.max(trackpointSpeedLabel.implicitHeight, trackpointSpeedValue.implicitHeight)

              Text {
                id: trackpointSpeedLabel
                anchors.left: parent.left
                text: "Pointer speed"
                color: root.foreground
                font.family: root.fontFamily
                font.pixelSize: Style.font.subtitle
                font.bold: true
              }

              Text {
                id: trackpointSpeedValue
                anchors.right: parent.right
                text: root.quantized(
                  trackpointSpeed.dragging ? trackpointSpeed.liveValue : root.draftNumber("trackpoint_sensitivity", 0),
                  -1, 1, 0.05).toFixed(2)
                color: Qt.darker(root.foreground, 1.4)
                font.family: root.fontFamily
                font.pixelSize: Style.font.caption
                font.bold: true
              }
            }

            PanelSlider {
              id: trackpointSpeed
              bar: root.bar
              width: parent.width
              minimum: -1
              maximum: 1
              step: 0.05
              value: root.draftNumber("trackpoint_sensitivity", 0)
              onMoved: function(value) {
                root.setSnappedDraft("trackpoint_sensitivity", value, minimum, maximum, step)
              }
            }
          }

          Toggle {
            width: parent.width
            label: "Hold middle button to scroll"
            description: "Reserve the physical TrackPoint middle button: hold it and move the stick to scroll. Turn this off to use normal middle clicks."
            foreground: root.foreground
            accent: root.accent
            fontFamily: root.fontFamily
            checked: !!touchpad.draft.trackpoint_middle_scroll
            enabled: root.controlsEnabled
            opacity: enabled ? 1.0 : 0.55
            onClicked: touchpad.setDraft("trackpoint_middle_scroll", !checked)
          }

          PanelSeparator {
            foreground: root.foreground
          }

          Button {
            width: parent.width
            text: touchpad.busy ? "Working…" : "Apply settings"
            iconText: touchpad.busy ? "󰑓" : ""
            iconSpinning: touchpad.busy
            active: touchpad.busy
            bordered: true
            focusable: true
            foreground: root.foreground
            accent: root.accent
            fontFamily: root.fontFamily
            enabled: root.controlsEnabled
            opacity: enabled ? 1.0 : 0.55
            onClicked: touchpad.submit()
          }

          Text {
            width: parent.width
            textFormat: Text.PlainText
            text: touchpad.busy
              ? "Controls are locked while the controller finishes."
              : "Changes stay staged until Apply. Saved settings are restored at startup."
            color: Qt.darker(root.foreground, 1.4)
            font.family: root.fontFamily
            font.pixelSize: Style.font.caption
            wrapMode: Text.WordWrap
          }
        }
      }
    }
  }
}
