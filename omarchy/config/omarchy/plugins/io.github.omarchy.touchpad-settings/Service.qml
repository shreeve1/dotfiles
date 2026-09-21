import QtQuick
import Quickshell.Io
import "Model.js" as Model
Item {
  id: root
  readonly property string controller: Model.controllerPath(Qt.resolvedUrl("controller/touchpadctl"))
  property var settings: ({})
  property var draft: ({})
  property bool available: false
  property bool busy: statusProcess.running || restoreProcess.running || applyProcess.running
  property string error: ""
  signal refreshed()
  function refresh() { if (!busy) statusProcess.running = true }
  function accept(exitCode, out, err) {
    if (exitCode !== 0) {
      available = false
      // The controller deliberately emits machine-readable failures on stdout
      // (and keeps stderr empty). Parse those before falling back to process
      // text so the panel never displays the raw JSON envelope.
      var failure = Model.parseResponse(out)
      error = failure.error !== "Controller returned invalid JSON"
        && failure.error !== "Controller returned an unsupported response"
        ? failure.error
        : Model.concise(err || out, "Touchpad controller unavailable")
      return
    }
    var parsed = Model.parseResponse(out)
    if (!parsed.ok) { available = false; error = parsed.error; return }
    settings = parsed.payload.settings
    draft = Object.assign({}, settings)
    available = true
    error = ""
    refreshed()
  }
  function setDraft(key, value) {
    var next = Object.assign({}, draft)
    next[key] = value
    draft = next
  }
  function submit() {
    if (busy || !available) return
    var plan = Model.applyCommand(controller, draft)
    if (!plan.ok) { error = plan.error; return }
    applyProcess.command = plan.command
    applyProcess.running = true
  }
  Process {
    id: statusProcess
    command: Model.statusCommand(root.controller)
    stdout: StdioCollector { id: statusOut; waitForEnd: true }
    stderr: StdioCollector { id: statusErr; waitForEnd: true }
    onExited: function(exitCode) { root.accept(exitCode, statusOut.text, statusErr.text) }
  }
  Process {
    id: restoreProcess
    command: Model.restoreCommand(root.controller)
    stdout: StdioCollector { id: restoreOut; waitForEnd: true }
    stderr: StdioCollector { id: restoreErr; waitForEnd: true }
    onExited: function(exitCode) { root.accept(exitCode, restoreOut.text, restoreErr.text) }
  }
  Process {
    id: applyProcess
    stdout: StdioCollector { id: applyOut; waitForEnd: true }
    stderr: StdioCollector { id: applyErr; waitForEnd: true }
    onExited: function(exitCode) { root.accept(exitCode, applyOut.text, applyErr.text) }
  }
  Component.onCompleted: restoreProcess.running = true
}
