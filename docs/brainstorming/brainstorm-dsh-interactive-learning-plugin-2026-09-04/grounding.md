# Grounding — read before generating ideas (2026-09-04)

## Sidebar extension surface (dsh-better-sidebar@0.17.1 installed; 0.18.0 latest)
Service `ctx.betterSidebar` (client half), inject via `dsh.client.inject`.
- `registerTab(TabDescriptor) => disposer` — id, title, icon, order, hidden,
  `single`/`dedupeKey`/`createTab`, `available()`, `urlTarget(url)`,
  `badge(ctx,scope,state)` (pill on the tab: count or string),
  lifecycle `onOpen`/`onActivate`/`onClose`, `settings` (declarative rows:
  switch/text/number/select, host prefs OR plugin-owned `pluginToggles`,
  or a full custom `render` panel), `component(TabComponentProps)`.
- `registerFileViewer(FileViewerDescriptor) => disposer` — `exts`, `priority`,
  `detect(path, head)` content sniff, `fetchStrategy`
  ('none'|'fsRead'|'mediaUrl'|'custom'|'binary-download'), `load()`, component.
- Also: `openTab(OpenTabSeed)` with `meta` = JSON-serializable custom state
  PERSISTED across reloads (v0.12.0+). Tabs are per-conversation-session scoped.

## The load-bearing question: how does learner input reach the teacher?
Three real paths already used inside the sidebar itself:
1. `appendToDraft(ctx, sessionId, text)` — client-side, appends to the composer
   draft (the @-reference path). Learner-visible, learner must hit send.
   Cheapest. Ceiling: no structured payload, no auto-submit.
2. Host tools + push registry (`AgentOpenRegistry` pattern in agent-opens.ts):
   agent calls a tool, host enqueues a request per sessionId, pushes to the
   attached client view (consume-on-send; queues when no view attached).
   This is the agent -> sidebar direction. Terminal tools (tools.ts) do the
   same with `registry.assertOwned` per-session isolation.
3. Sidechat (sidechat-core.ts) — spawns a CHILD session seeded with the parent
   log; answers stay in the side thread and are NEVER delivered to the parent.
   Wrong direction for us but shows the seed/boundary machinery.
=> The plugin needs the RETURN leg (sidebar -> teacher) built: dsh-plugin-build
   rule "model-visible <=> logged" means learner input must become a new
   SessionEventMap event, not a smuggled string.

## teach skill requirements that shape the design
- quiz-ui.md: quizzes MUST go through the harness question tool; NEVER A/B/C/D
  in chat. Shape: 1-3 questions, one right answer, 3 content choices + "I don't
  know", correct option must NOT be first/marked. Free-text/Other = talk-through
  slot, typed reasons are scoring signal. Header/strand tag <=12 chars.
  "No match -> say which tool is missing and stop."  <-- a sidebar quiz tab
  would have to be recognised as a valid harness tool, or the skill's table
  needs a row for it.
- process.md: Probe -> Plan -> Teach. Probe writes a strand map to
  `.teach/<subject>/maps/<topic>.md` labelling each strand
  known/edge/unknown/blocked. Plan = dependency DAG shown as MERMAID before
  teaching, written to `.teach/<subject>/sessions/<date>-<topic>.md`.
  Teach = ONE reasoning step per turn, quiz that step, advance only on lock-in.
  Persist what happened in the session file; resumable by another agent.
- philosophy.md: struggle stays IN the material; the system absorbs logistics
  (order, sources, verification, file logging, diagrams). Trust is engineered
  via verification. One interface, many sources.
- Related installed skills: probe, learn-visual, learn-verify, review (FSRS
  scheduling), coach (retention stats/telemetry/HTML dashboard), learn-profile
  (.teach|.alvar/LEARNER.md).

## Build-path constraints (dsh-plugin-build)
- Load dsh-plugin-guide for every factual rule; don't work from memory.
- Registration is an effect (ctx.effect/ctx.on/service register -> disposer).
- Config = Schemastery Schema<Config>, nothing tunable hardcoded.
- Tools = defineTool, return only declared output.schema JSON, pure-function
  UI presenters.
- Gates before install: plugin_check (strict) -> dsh-plugin-dev check --strict
  -> dsh-plugin-dev verify. Then `dsh plugin --profile web add <spec>`.
- Sidebar is a CLIENT plugin (platform: web) + host half; a plugin extending it
  needs `inject: ['betterSidebar']` on the client side.
