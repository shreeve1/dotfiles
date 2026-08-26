# DSH Plugin Install Runbook — Headless, Self-Sufficient Stack

Target: a self-hosted DeepSeek Harness (dsh) **web** profile on a **headless Linux**
server. Goal: dsh stands alone (orchestration, files, browser, self-heal) and
**reuses Claude Code skills only** — hooks/agents handled by native DSH plugins.

Assumptions (adjust to your box):
- `dsh` CLI on PATH. If not, prefix every command with `npx @deepseek-ai/dsh`.
- Profile name is `web` (the Web GUI default). Swap `--profile web` if yours differs.
- Host API is on `http://127.0.0.1:3080` (default). Adjust in the verify steps.
- Your synced Claude Code skills live in `~/.claude/skills/` (per your dotfiles).

> Convention: after each **phase**, restart the web process and confirm before
> moving on. Never batch-install everything then restart once — you lose the
> ability to attribute a boot failure to a specific plugin.

---

## Phase 0 — Baseline + safety net FIRST

Install the self-heal layer **before** anything risky, so a later bad plugin
can't brick startup with no recovery path.

```bash
# Boot guard: quarantines crash-causing bundles at startup
dsh plugin --profile web add github:aokamoaki/dsh-startup-guard

# Hot reload + rollback: reload an upgraded plugin in-process, roll back on failure
dsh plugin --profile web add github:stuarthu/dsh-hot-reload

# Diagnostic panel: 19 offline checks (env / profile / session)
dsh plugin --profile web add github:moonquake2004/dsh-doctor

# Smart restart: resumes interrupted agent work across restarts; boot canary
dsh plugin --profile web add github:edusrez/dsh-smart-restart
```

Restart + verify:

```bash
# stop the running web process (Ctrl-C in its terminal, or your service stop)
dsh web            # or: npx @deepseek-ai/dsh web
```

- Settings → Plugins: all four show **active**.
- Open the **Doctor** panel; expect a green/clean baseline.
- Checkpoint reached: you now have a recovery net. Proceed.

---

## Phase 1 — Claude Code SKILLS only (live, `.claude/` stays canonical)

Two npm packages, installed directly. **No junction hub / no `file:///` hot-mount**
— that procedure is only for local-source development, which you are not doing.
`.claude/` remains the single source of truth; this loads at runtime, never writes back.

```bash
# Shared parser first (cc-skills depends on it)
dsh plugin --profile web add dsh-cc-loader

# Skills + slash-commands + rules loader (project + global ~/.claude)
dsh plugin --profile web add dsh-cc-skills
```

Config (only if you want to tune what loads). `dsh-cc-skills` reads these keys;
defaults already enable skills + global. To load skills but NOT CC rules, set
`enableRules: false`. Edit the `cc-skills` row in
`~/.dsh/profiles/web/cordis.patch.yml` (or the Settings UI if exposed):

```yaml
# cc-skills config keys (all optional)
enableSkills: true      # load .claude/skills/**       (default on)
enableGlobal: true      # include ~/.claude (your synced skills)  (default on)
enableRules: false      # set false if DSH plugins own your rules, not CC
# pluginRoots: [...]    # leave unset — that's the CC-plugin path you don't want
```

Restart + verify:

```bash
dsh web
```

- In a session, open the skill catalog: your `~/.claude/skills/*` skills appear
  as native DSH skills, invocable with `/<skill-name>`.
- Slash-command completion is **prefix match** (searching a middle fragment
  won't find it — expected).
- Confirmed: skills reused, no agents/hooks/permissions/MCP bridged from CC.

> Gotcha (from the loader docs): a `SKILL.md` frontmatter `description` must use a
> `|` block scalar. A bare scalar containing `colon+space` (e.g. `Marker: x`)
> fails YAML parse and the skill is **silently skipped**. If a skill doesn't show
> up, check its frontmatter first.

---

## Phase 2 — Native hooks (DSH, not CC-bridged)

```bash
dsh plugin --profile web add github:truelove-dreamer/dsh-plugin-hooks
```

Claude-Code-style lifecycle hooks: configured shell commands run before/after
model tool calls with a JSON payload on stdin; a **non-zero pre-tool exit blocks
the call**. Configure hook rules in its settings.

Restart + verify: trigger a tool call, confirm a `hook/invoked` + `hook/result`
appears in the session log.

> **Conflict to watch (#1):** a pre-tool hook that blocks certain commands can
> block the Phase-4 workbench `git_*` tools. Scope hook rules narrowly to what you
> actually want gated.

---

## Phase 3 — Orchestration / subagents / tasks (your native agent layer)

```bash
# Persistent named teammates, shared task list, mailbox, team-room tab
dsh plugin --profile web add github:huxint/dsh-team

# Durable, interruptible background children on the official subagent seam
dsh plugin --profile web add github:PerryLink/dsh-background-agents

# OPTIONAL — per-call model/provider/persona/tool overrides for delegation
# dsh plugin --profile web add github:lynx-gt/dsh-subagent-tools
```

Restart + verify:

```bash
dsh web
```

- Team-room tab appears; create a teammate and a shared task.
- Start a background agent; confirm it shows in the Web UI sidebar and can be
  messaged / interrupted.

> **Conflict to watch (#2):** `cc-skills` rule injection is **top-level-session
> only**. Teammates spawned by `dsh-team` may not receive CC rule context. If you
> rely on CC rules shaping subagent behavior, verify — and remember you set
> `enableRules` deliberately in Phase 1.

---

## Phase 4 — File browsing / editing / git (replaces orca's file surface)

```bash
dsh plugin --profile web add github:loadingvx/deepseek-harness-workbench-plugin
```

3-pane chat / Monaco editor / files+git, multi-tab editing, **workspace terminal**
(useful on a headless box), full SCM (stage/commit/push/pull/branch/graph), and
model-facing `git_*` tools.

Restart + verify: open the workbench, browse the file tree, make an edit, run a
`git status` via the panel. Confirm the terminal opens.

> Re-check Conflict #1 here: if a hook blocks `git`, the workbench SCM will fail
> silently. Test a commit end-to-end.

---

## Phase 5 — Browser automation (headless-native)

```bash
dsh plugin --profile web add github:guo6x/dsh-pilot
```

Zero-dependency CDP against headless Edge/Chrome, **text-first page snapshots**
(built for text-only models), draggable cockpit panel — **no Playwright, no
display server, no API key**. Correct choice for this headless box; the
visible-window plugins (`wqty123/dsh-browser`, `Tencent/BrowserSkill`) were
rejected because they need a display + human watcher.

Restart + verify: ask the agent to open a URL and snapshot it; confirm you get a
text element listing back. Check the cockpit panel renders.

---

## Final verification (whole stack)

```bash
# Authoritative host loader tree — every row should be enabled + active
curl -s http://127.0.0.1:3080/api/pluginInventory/list \
  -H 'Content-Type: application/json' \
  -d '{"type":"client-request","rpcId":"probe-1","method":"pluginInventory/list","payload":{"args":{}}}'
```

Then run the **Doctor** panel once more for a clean bill of health, and do one
end-to-end smoke test that exercises multiple layers at once, e.g.:

> "Spin up a teammate to open example.com in the browser, save the page text to
>  a file in the workspace, then git-commit it."

That single task touches: `dsh-team` (teammate) → `dsh-pilot` (browser) →
workbench (file write + `git_*`) → `dsh-plugin-hooks` (pre-tool gate) — plus any
CC skill it decides to invoke. If it completes, the stack composes.

---

## Deferred (revisit when you commit to dsh long-term)

Agent-per-host federation — a real agent running on each remote machine, task
handoff, cross-machine `@mentions`:

- `baixianger/dsh-weave` (Iroh/QUIC transport, needs self-hosted relay)
- `baixianger/dsh-chat` (Web room UI) + `baixianger/dsh-bridge` (local delivery)

Early stage (`design-preview` / MVP). Not needed for single-box operation.

---

## Rollback / recovery cheatsheet

- Remove one plugin: `dsh plugin --profile web remove <plugin-id>`
- A plugin bricks startup: **dsh-startup-guard** (Phase 0) should quarantine it;
  otherwise remove its row from `~/.dsh/profiles/web/cordis.patch.yml` and restart.
- Reload after an in-place upgrade without full restart: **dsh-hot-reload**.
- Diagnose a bad boot: **dsh-doctor** offline panel.
- Interrupted work after a restart: **dsh-smart-restart** resumes it.
