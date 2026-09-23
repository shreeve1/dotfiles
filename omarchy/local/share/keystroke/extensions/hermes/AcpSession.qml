import QtQuick
import Quickshell
import Quickshell.Io

Item {
  id: root
  property var settings: ({})
  property string home: Quickshell.env("HOME")
  property string sessionId: ""
  property string cwd: home
  property string title: "New conversation"
  property string draft: ""
  property string error: ""
  property string activity: ""
  property string phase: "idle"
  property bool ready: false
  property bool starting: false

  property bool expectedExit: false
  property bool failing: false
  property int sequence: 0
  property int messageSequence: 0
  property int promptRequestId: 0
  property string activePromptText: ""
  property string assistantMessageId: ""
  property var messages: []
  property var recent: []
  property var pending: ({})
  property var readyWaiters: []
  property var approval: null
  property var tools: ({})
  property string diagnostic: ""
  readonly property bool busy: phase === "preparing" || phase === "running" || phase === "stopping"
  signal changed()

  function commandArgv() {
    var binary = String(settings.binary || "hermes").trim() || "hermes"
    return [binary, "acp"]
  }

  function send(value) {
    if (proc.running) proc.write(JSON.stringify(value) + "\n")
  }

  function request(method, params, callback, timeout) {
    var id = ++sequence, copy = Object.assign({}, pending)
    copy[id] = { callback: callback, expires: timeout ? Date.now() + timeout : 0, method: method }
    pending = copy
    send({ jsonrpc: "2.0", id: id, method: method, params: params || {} })
    return id
  }

  function notify(method, params) {
    send({ jsonrpc: "2.0", method: method, params: params || {} })
  }

  function respond(id, result) {
    send({ jsonrpc: "2.0", id: id, result: result })
  }

  function respondError(id, code, message) {
    send({ jsonrpc: "2.0", id: id, error: { code: code, message: message } })
  }

  function fail(message) {
    if (failing) return
    failing = true
    error = String(message || "Hermes connection failed")
    activity = ""; phase = "idle"; ready = false; starting = false
    startup.stop(); cancelTimeout.stop()
    if (activePromptText && !draft) draft = activePromptText
    activePromptText = ""; promptRequestId = 0; approval = null
    var waiters = readyWaiters; readyWaiters = []
    var callbacks = pending; pending = ({})
    expectedExit = true
    if (proc.running) proc.running = false
    changed()
    for (var id in callbacks) if (callbacks[id].callback) callbacks[id].callback(null, { message: error })
    for (var i = 0; i < waiters.length; i++) waiters[i]({ message: error })
    failing = false
  }

  function ensure(callback) {
    if (ready) { callback(); return }
    readyWaiters = readyWaiters.concat([callback])
    if (starting || proc.running) return
    error = ""; diagnostic = ""; starting = true; expectedExit = false
    proc.command = commandArgv()
    proc.running = true
    startup.restart()
  }

  function warm() {
    ensure(function() { refreshRecent() })
  }

  function flushReady() {
    var waiters = readyWaiters; readyWaiters = []
    for (var i = 0; i < waiters.length; i++) waiters[i](null)
  }

  function resetConversation() {
    messages = []; tools = ({}); assistantMessageId = ""; approval = null
    promptRequestId = 0; activePromptText = ""; cancelTimeout.stop()
    error = ""; activity = ""; title = "New conversation"; draft = ""
  }

  function newConversation(text, folder) {
    if (busy) { error = "Stop the current Hermes turn before starting another conversation"; return false }
    resetConversation(); sessionId = ""; cwd = folder || home; draft = String(text || ""); visible = true
    phase = "preparing"
    ensure(function(startError) {
      if (startError) { root.phase = "idle"; root.changed(); return }
      request("session/new", { cwd: root.cwd, mcpServers: [] }, function(result, rpcError) {
        if (rpcError || !result || !result.sessionId) { root.fail(rpcError ? rpcError.message : "Hermes did not create a session"); return }
        root.sessionId = result.sessionId
        root.configureSession(function() {
          root.phase = "idle"; root.activity = "Ready"; root.changed()
          if (root.draft.trim()) root.submit()
          root.refreshRecent()
        })
      }, 90000)
    })
    return true
  }

  function openRecent(item, fallbackCwd) {
    if (busy) { error = "Stop the current Hermes turn before resuming another conversation"; return false }
    resetConversation(); sessionId = String(item.sessionId || ""); cwd = item.cwd || fallbackCwd || home
    title = item.title || "Hermes conversation"; visible = true; phase = "preparing"
    if (!sessionId) { error = "This saved Hermes session has no id"; phase = "idle"; return false }
    ensure(function(startError) {
      if (startError) { root.phase = "idle"; root.changed(); return }
      request("session/load", { cwd: root.cwd, sessionId: root.sessionId, mcpServers: [] }, function(result, rpcError) {
        if (rpcError) { root.fail(rpcError.message); return }
        if (!result) { root.fail("Hermes session was not found"); return }
        root.configureSession(function() { root.phase = "idle"; root.activity = "Resumed"; root.changed() })
      }, 90000)
    })
    return true
  }

  function configureSession(done) {
    var model = String(settings.model || "").trim()
    function setMode() {
      var mode = String(root.settings.mode || "default")
      request("session/set_mode", { sessionId: root.sessionId, modeId: mode }, function(result, rpcError) {
        if (rpcError) root.error = "Hermes approval mode: " + rpcError.message
        done()
      }, 30000)
    }
    if (!model) { setMode(); return }
    request("session/set_model", { sessionId: sessionId, modelId: model }, function(result, rpcError) {
      if (rpcError) root.error = "Hermes model: " + rpcError.message
      setMode()
    }, 30000)
  }

  function refreshRecent() {
    if (!ready) return
    request("session/list", {}, function(result, rpcError) {
      if (rpcError || !result) return
      root.recent = Array.isArray(result.sessions) ? result.sessions : []
      root.changed()
    }, 30000)
  }

  function submit() {
    var text = String(draft || "")
    if (!text.trim() || busy || !sessionId) return false
    if (!ready) { error = "Hermes disconnected; reopen this conversation to reconnect"; return false }
    draft = ""; error = ""; activity = "Hermes is working…"; phase = "running"
    activePromptText = text
    appendMessage("user-" + (++messageSequence), "user", text)
    assistantMessageId = "assistant-" + (++messageSequence)
    var requestId = request("session/prompt", { sessionId: sessionId, prompt: [{ type: "text", text: text }] }, function(result, rpcError) {
      if (root.promptRequestId !== requestId) return
      root.promptRequestId = 0; root.activePromptText = ""; cancelTimeout.stop()
      root.phase = "idle"; root.approval = null
      if (rpcError) { root.error = rpcError.message || "Hermes turn failed"; if (!root.draft) root.draft = text }
      else root.activity = result && result.stopReason === "cancelled" ? "Stopped" : "Done"
      root.assistantMessageId = ""; root.refreshRecent(); root.changed()
    }, 0)
    promptRequestId = requestId
    return true
  }

  function stop() {
    if (!busy || !sessionId) return
    phase = "stopping"; activity = "Stopping Hermes…"
    notify("session/cancel", { sessionId: sessionId })
    cancelTimeout.restart()
  }

  function dismiss() {
    visible = false
    if (approval) decide("")
    if (busy) stop()
  }

  function shutdown() {
    if (approval) decide("")
    if (busy) stop()
    cancelTimeout.stop(); expectedExit = true; ready = false; starting = false; proc.running = false
  }

  function decide(optionId) {
    if (!approval) return
    var current = approval; approval = null
    if (optionId) respond(current.id, { outcome: { outcome: "selected", optionId: optionId } })
    else respond(current.id, { outcome: { outcome: "cancelled" } })
    activity = "Hermes is working…"; changed()
  }

  function appendMessage(id, role, text) {
    var copy = messages.slice(), index = copy.findIndex(function(item) { return item.id === id })
    var row = { id: id, role: role, text: String(text || "") }
    if (index < 0) copy.push(row); else copy[index] = row
    messages = copy.slice(-200); changed()
  }

  function appendChunk(id, role, text) {
    if (!text) return
    var existing = messages.find(function(item) { return item.id === id })
    appendMessage(id, role, (existing ? existing.text : "") + text)
  }

  function contentText(content) {
    if (!Array.isArray(content)) return ""
    var out = []
    for (var i = 0; i < content.length; i++) {
      var item = content[i]
      if (item && item.type === "content" && item.content && item.content.text) out.push(item.content.text)
      else if (item && item.type === "diff") out.push((item.path || "file") + " (edited)")
    }
    return out.join("\n")
  }

  function handleUpdate(update) {
    var kind = String(update.sessionUpdate || "")
    if (kind === "agent_message_chunk") {
      var text = update.content && update.content.text ? update.content.text : ""
      var id = assistantMessageId || update.messageId || ("assistant-" + (++messageSequence))
      appendChunk(id, "assistant", text)
    } else if (kind === "user_message_chunk") {
      var userText = update.content && update.content.text ? update.content.text : ""
      appendMessage(update.messageId || ("user-" + (++messageSequence)), "user", userText)
    } else if (kind === "agent_thought_chunk") {
      if (busy) activity = "Hermes is thinking…"
    } else if (kind === "tool_call") {
      var toolId = String(update.toolCallId || (++messageSequence)), map = Object.assign({}, tools)
      map[toolId] = { title: update.title || update.kind || "Using a tool", status: update.status || "in_progress" }; tools = map
      appendMessage("tool-" + toolId, "activity", map[toolId].title)
      activity = map[toolId].title
    } else if (kind === "tool_call_update") {
      var current = tools[update.toolCallId] || ({ title: update.title || "Tool", status: "in_progress" })
      var next = { title: update.title || current.title, status: update.status || current.status }
      var copy = Object.assign({}, tools); copy[update.toolCallId] = next; tools = copy
      var detail = contentText(update.content)
      appendMessage("tool-" + update.toolCallId, "activity", next.title + (next.status === "failed" ? " · failed" : "") + (detail ? "\n" + detail : ""))
      if (next.status === "completed") activity = "Hermes is working…"
    } else if (kind === "session_info_update") {
      if (update.title) title = update.title
    } else if (kind === "usage_update") {
      if (update.used !== undefined && update.size) activity = "Context " + update.used + " / " + update.size + " tokens"
    }
  }

  function receive(line) {
    if (line.length > 8 * 1024 * 1024) { fail("Hermes ACP sent an oversized message"); return }
    var msg
    try { msg = JSON.parse(line) } catch (_) { fail("Hermes ACP sent invalid JSON"); return }
    if (msg.method === "session/update") {
      var updateParams = msg.params || {}
      if (sessionId && String(updateParams.sessionId || "") === sessionId) handleUpdate(updateParams.update || {})
      return
    }
    if (msg.method && msg.id !== undefined) {
      if (msg.method === "session/request_permission") {
        if (!sessionId || String((msg.params || {}).sessionId || "") !== sessionId) {
          respond(msg.id, { outcome: { outcome: "cancelled" } }); return
        }
        approval = { id: msg.id, params: msg.params || {} }; activity = "Waiting for approval"; changed(); return
      }
      respondError(msg.id, -32601, "Method not found: " + msg.method); return
    }
    if (msg.id !== undefined && pending[msg.id]) {
      var entry = pending[msg.id], copy = Object.assign({}, pending); delete copy[msg.id]; pending = copy
      entry.callback(msg.result, msg.error || null)
    }
  }

  function approvalTitle() {
    if (!approval) return ""
    var call = approval.params.toolCall || {}
    return call.title || "Hermes needs permission"
  }

  function approvalDetail() {
    if (!approval) return ""
    var call = approval.params.toolCall || {}, text = contentText(call.content)
    if (text) return text
    if (call.rawInput) {
      try { return JSON.stringify(call.rawInput, null, 2) } catch (_) { return String(call.rawInput) }
    }
    return "Review this request before continuing."
  }

  function answer() {
    var replies = messages.filter(function(item) { return item.role === "assistant" })
    return replies.length ? replies[replies.length - 1].text : ""
  }

  Process {
    id: proc
    stdinEnabled: true
    onStarted: root.request("initialize", {
      protocolVersion: 1,
      clientCapabilities: {},
      clientInfo: { name: "keystroke-hermes", title: "Keystroke Hermes", version: "1.0.0" }
    }, function(result, rpcError) {
      if (rpcError) { root.fail(rpcError.message); return }
      root.starting = false; root.ready = true; startup.stop(); root.flushReady()
    }, 90000)
    stdout: SplitParser { onRead: data => root.receive(data) }
    stderr: SplitParser { onRead: data => root.diagnostic = (root.diagnostic + "\n" + data).slice(-6000) }
    onExited: function(code) {
      if (root.expectedExit) return
      root.fail("Hermes ACP stopped" + (code ? " (exit " + code + ")" : "") + (root.diagnostic ? ": " + root.diagnostic.trim().split("\n").slice(-1)[0] : ""))
    }
  }

  Timer { id: startup; interval: 90000; onTriggered: root.fail("Hermes ACP startup timed out") }
  Timer { id: cancelTimeout; interval: 10000; onTriggered: root.fail("Hermes did not stop the turn; reopen the conversation to reconnect") }
  Timer { interval: 1000; repeat: true; running: proc.running && Object.keys(root.pending).length > 0; onTriggered: {
    var now = Date.now()
    for (var id in root.pending) {
      var entry = root.pending[id]
      if (entry.expires && entry.expires < now) { root.fail("Hermes ACP request timed out: " + entry.method); break }
    }
  } }
  Component.onDestruction: shutdown()
}
