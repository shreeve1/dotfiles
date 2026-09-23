import QtQuick
import Quickshell

QtObject {
  id: root
  property var shell: null
  property var extension: null
  property string omarchyPath: Quickshell.env("OMARCHY_PATH")
  property var host: null
  property var currentSettings: ({})
  readonly property string key: extension && extension.id ? String(extension.id) : "hermes"
  readonly property var preferences: host && typeof host.providerSettings === "function" ? host.providerSettings(key) : ({})
  readonly property var session: sessionObject
  readonly property Component view: Component { ConversationView { session: root.session } }

  readonly property var provider: ({
    apiVersion: 1,
    name: "Hermes",
    icon: "󰚩",
    color: "#8bceb4",
    description: "Hermes Agent conversations with streaming tools and approvals",
    settings: [
      { key: "binary", type: "string", label: "Hermes command", "default": "hermes",
        description: "Command or absolute path used to start `hermes acp`" },
      { key: "workspace", type: "string", label: "Working folder", "default": "",
        description: "Absolute folder for new conversations; empty uses your home folder" },
      { key: "model", type: "string", label: "Model override", "default": "",
        description: "ACP model id such as openai-codex:gpt-5.6-sol; empty uses your Hermes default" },
      { key: "mode", type: "enum", label: "Edit approvals", "default": "default",
        options: ["default", "accept_edits", "dont_ask"],
        optionLabels: { "default": "Ask before edits", "accept_edits": "Accept workspace edits", "dont_ask": "Don't ask except sensitive paths" } }
    ],
    view: root.view,
    query: function(ctx) { return root.query(ctx) },
    activate: function(row, ctx) { return root.activate(row, ctx) },
    opened: function() {},
    dismiss: function() { session.dismiss() }
  })

  readonly property AcpSession sessionObject: AcpSession {
    id: sessionObject
    settings: root.preferences
    onChanged: if (root.host) root.host.requery({ catalog: false, provider: root.key })
  }

  function attach(ctx) {
    if (ctx && ctx.host) root.host = ctx.host
    if (ctx && ctx.settings) root.currentSettings = ctx.settings
    session.settings = root.currentSettings
  }

  function workspace() {
    var configured = String(root.currentSettings.workspace || "").trim()
    return configured || Quickshell.env("HOME")
  }

  function prompt(ctx) {
    if (ctx.command) return String(ctx.command.rest || "").trim()
    return String(ctx.rawQuery === undefined ? ctx.query || "" : ctx.rawQuery).replace(/^\?\s*/, "").trim()
  }

  function query(ctx) {
    root.attach(ctx)
    var scoped = ctx.scope === root.key
    if (ctx.scope && !scoped) return []
    var text = root.prompt(ctx), rows = []
    if (text) {
      rows.push({ id: "ask", title: "Ask Hermes here", subtitle: text, icon: "󰚩",
        section: "Continue with", tier: ctx.command ? "answer" : "fallback", score: 6,
        verb: "Ask", action: { type: "hermes-new", text: text } })
      return rows
    }
    if (!scoped) {
      rows.push({ id: "open", title: "Hermes", subtitle: "Conversations, tools and approvals inside Keystroke",
        icon: "󰚩", score: 24, verb: "Open", action: { type: "navigate", scope: root.key, title: "Hermes" } })
      return rows
    }
    if (!session.ready && !session.starting) session.warm()
    rows.push({ id: "new", title: "New Hermes conversation", subtitle: "Start in " + root.workspace(), icon: "󰚩",
      score: 100, verb: "Open", action: { type: "hermes-new", text: "" } })
    var recent = session.recent
    for (var i = 0; i < Math.min(recent.length, 40); i++) {
      var item = recent[i]
      rows.push({ id: "recent/" + item.sessionId, title: item.title || "Hermes conversation",
        subtitle: item.updatedAt || item.cwd || "Saved session", icon: "↶", section: "Recent conversations",
        score: 80 - i, verb: "Resume", action: { type: "hermes-resume", session: item } })
    }
    return rows
  }

  function activate(row, ctx) {
    root.attach(ctx)
    var effect = ctx.alternate && row.altAction ? row.altAction : row.action
    if (!effect) return effect
    if (effect.type === "hermes-new") {
      if (!session.newConversation(effect.text, root.workspace())) {
        if (root.host) root.host.errorMessage = session.error
        return { type: "noop" }
      }
      return { type: "provider-view", provider: root.key }
    }
    if (effect.type === "hermes-resume") {
      if (!session.openRecent(effect.session, root.workspace())) {
        if (root.host) root.host.errorMessage = session.error
        return { type: "noop" }
      }
      return { type: "provider-view", provider: root.key }
    }
    return effect
  }

  Component.onDestruction: session.shutdown()
}
