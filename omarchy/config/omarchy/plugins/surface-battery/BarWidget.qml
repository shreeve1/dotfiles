import QtQuick
import Quickshell
import Quickshell.Io
import qs.Commons
import qs.Ui

// Battery indicator for Surface laptops whose battery the kernel does not expose.
// Data comes from surface-battery-poller.service, which queries the Surface
// Aggregator Module over /dev/surface/aggregator and writes a JSON snapshot.
BarWidget {
  id: root
  moduleName: "surface-battery"

  readonly property string statePath: "/run/surface-battery/state.json"

  // Mirror omarchy.power: when a percentage is painted the button needs a wider
  // slot than the icon alone, otherwise the text overflows the fixed icon slot.
  readonly property bool showPercentage: setting("showPercentage", true) === true
  readonly property int horizontalPadding: {
    var n = Number(setting("horizontalPadding", 8))
    return isFinite(n) && n > 0 ? n : 0
  }
  readonly property bool vertical: root.bar ? root.bar.vertical : false

  property var battery: ({})

  readonly property bool present: battery.present === true
  readonly property string failure: battery.error === undefined ? "" : battery.error
  // No data yet vs. actively failing: hide for the former, show a warning glyph
  // for the latter so a broken poller is visible instead of a vanished widget.
  readonly property bool degraded: !present && failure !== ""
  readonly property int percent: battery.percent === undefined || battery.percent === null ? -1 : battery.percent
  readonly property bool charging: battery.charging === true
  readonly property bool discharging: battery.discharging === true
  readonly property var rateMw: battery.rate_mw === undefined ? null : battery.rate_mw
  readonly property var remainingMwh: battery.remaining_mwh === undefined ? null : battery.remaining_mwh

  readonly property var chargingIcons: ["󰢜", "󰂆", "󰂇", "󰂈", "󰢝", "󰂉", "󰢞", "󰂊", "󰂋", "󰂅"]
  readonly property var defaultIcons: ["󰁺", "󰁻", "󰁼", "󰁽", "󰁾", "󰁿", "󰂀", "󰂁", "󰂂", "󰁹"]

  function iconIndex() {
    if (percent < 0) return 0
    return Math.max(0, Math.min(9, Math.floor(percent / 10)))
  }

  function icon() {
    if (degraded || percent < 0) return "󰂑"   // unknown / unavailable
    return (charging ? chargingIcons : defaultIcons)[iconIndex()]
  }

  function label() {
    if (!present && !degraded) return ""
    if (percent < 0) return icon()
    return showPercentage ? icon() + " " + percent + "%" : icon()
  }

  function watts() {
    if (rateMw === null || rateMw === undefined) return ""
    return (rateMw / 1000).toFixed(1) + " W"
  }

  function timeLeft() {
    if (!discharging || rateMw === null || !rateMw || remainingMwh === null) return ""
    var hours = remainingMwh / rateMw
    var h = Math.floor(hours)
    var m = Math.round((hours - h) * 60)
    if (m === 60) { h += 1; m = 0 }
    return h + "h " + (m < 10 ? "0" + m : m) + "m"
  }

  function detailText() {
    if (degraded) return "Surface battery unavailable: " + failure
    if (!present) return "Surface battery: no data"
    var parts = []
    parts.push("Battery " + percent + "%")
    if (charging) parts.push("charging")
    else if (discharging) parts.push("discharging")
    if (watts() !== "") parts.push(watts())
    if (timeLeft() !== "") parts.push(timeLeft() + " left")
    if (battery.full_mwh) parts.push((battery.full_mwh / 1000).toFixed(1) + " Wh full")
    if (battery.cycle_count !== undefined && battery.cycle_count !== null) parts.push(battery.cycle_count + " cycles")
    return parts.join(" · ")
  }

  function apply(raw) {
    try {
      root.battery = JSON.parse(raw || "{}")
    } catch (e) {
      root.battery = {}
    }
  }

  function refresh() {
    if (!proc.running) proc.running = true
  }

  function showDetails() {
    if (!root.bar) return
    var msg = detailText()
    if (battery.voltage_mv) msg += " · " + (battery.voltage_mv / 1000).toFixed(2) + " V"
    root.bar.run("notify-send -a surface-battery -i battery '" + msg + "'")
  }

  readonly property bool shown: present || degraded

  visible: shown
  implicitWidth: shown ? button.implicitWidth : 0
  implicitHeight: shown ? button.implicitHeight : 0

  IpcHandler {
    target: "surface-battery"

    function refresh(): void {
      root.refresh()
    }
  }

  Process {
    id: proc
    command: ["cat", root.statePath]
    stdout: StdioCollector {
      waitForEnd: true
      onStreamFinished: root.apply(text)
    }
  }

  Timer {
    interval: 5000
    running: true
    repeat: true
    onTriggered: root.refresh()
  }

  Component.onCompleted: root.refresh()

  BarIconButton {
    id: button
    anchors.fill: parent
    bar: root.bar
    text: root.label()
    tooltipText: root.detailText()
    active: root.charging

    // iconSlot alone fits only the glyph; double it when a percentage is shown
    // (same as omarchy.power) and add the user's padding on top.
    slotSize: Style.bar.iconSlot * (root.showPercentage && !root.vertical ? 2 : 1)
              + Style.spaceReal(root.horizontalPadding) * 2

    onPressed: root.showDetails()
  }
}
