import QtQuick
import Quickshell
import Quickshell.Io

// User-session half of the Surface battery workaround.
//
// The poller (surface-battery-poller.service, running as root because
// /dev/surface/aggregator is root-only) writes a JSON snapshot of the battery.
// This service consumes it and drives the two things that must happen inside the
// session, and that the kernel's missing battery device otherwise breaks:
//
//   1. Power profile switching. Omarchy picks the AC/battery profile from
//      UPower.onBattery, which is permanently false on this machine, so without
//      this it sits on the AC profile while unplugged.
//   2. The low-battery warning. omarchy.battery reads UPower too, so it never
//      fires.
//
// Everything here is a no-op unless the poller reports a present battery.
Item {
  id: root

  // Injected by omarchy-shell (the first-party service loader).
  property var shell: null

  readonly property string statePath: "/run/surface-battery/state.json"

  // Warn when discharging at or below this. `setting()` is only available to bar
  // widgets, not services, so this is a constant — edit here to change it.
  readonly property int lowThreshold: 20
  // Re-arm the warning only once comfortably above the threshold, so a small
  // recovery doesn't retrigger it immediately.
  readonly property int rearmMargin: 5

  property var battery: ({})
  property string appliedSource: ""
  // In-memory on purpose: after a shell restart a still-low battery warns once
  // more. An extra warning is a far better failure mode than a missing one.
  property bool warned: false

  readonly property bool present: battery.present === true
  readonly property int percent: battery.percent === undefined || battery.percent === null ? -1 : battery.percent
  readonly property bool charging: battery.charging === true
  readonly property bool discharging: battery.discharging === true
  // Anything not discharging counts as mains: charging, or full and idle on AC.
  readonly property string source: discharging ? "battery" : "ac"

  function evaluate() {
    if (!present) return
    syncProfile()
    checkLowBattery()
  }

  function syncProfile() {
    if (source === appliedSource) return
    appliedSource = source
    // Deliberately no explicit profile: omarchy reads its saved per-source choice
    // (ac -> performance, battery -> balanced) and later UI changes still win.
    profileProcess.command = ["omarchy-powerprofiles-set", source]
    profileProcess.running = true
  }

  function checkLowBattery() {
    if (!discharging) {
      warned = false
      return
    }
    if (percent < 0) return
    if (percent > lowThreshold + rearmMargin) {
      warned = false
      return
    }
    if (percent <= lowThreshold && !warned) {
      warned = true
      warningProcess.command = ["omarchy-battery-low", String(percent)]
      warningProcess.running = true
    }
  }

  function reload() {
    if (!reader.running) reader.running = true
  }

  IpcHandler {
    target: "surface-battery-sync"

    function evaluate(): void {
      root.reload()
    }
  }

  Process {
    id: reader
    command: ["cat", root.statePath]
    stdout: StdioCollector {
      waitForEnd: true
      onStreamFinished: {
        try {
          root.battery = JSON.parse(text || "{}")
        } catch (e) {
          root.battery = {}
        }
        root.evaluate()
      }
    }
  }

  Process { id: profileProcess }
  Process { id: warningProcess }

  Timer {
    interval: 5000
    running: true
    repeat: true
    onTriggered: root.reload()
  }

  Component.onCompleted: root.reload()
}
