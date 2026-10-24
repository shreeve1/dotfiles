// Drives .config/opencode/plugins/verify-final.ts with a fake OpenCode V2 plugin
// ctx against throwaway git repos. Portable (no bash, no symlinks) so it runs on
// native Windows too. Run: node tests/opencode-verify-final.test.mjs
import { execFileSync } from "node:child_process"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const PLUGIN = pathToFileURL(join(ROOT, ".config", "opencode", "plugins", "verify-final.ts")).href
const tmp = mkdtempSync(join(tmpdir(), "ovf-"))
process.on("exit", () => rmSync(tmp, { recursive: true, force: true }))

let pass = 0
const failures = []
const check = (name, cond, detail = "") => {
  if (cond) pass += 1
  else failures.push(`${name}${detail ? `\n  ${detail}` : ""}`)
}

const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8" })
const makeRepo = (name) => {
  const dir = join(tmp, name)
  mkdirSync(dir, { recursive: true })
  git(dir, "init", "-q", "-b", "main")
  git(dir, "config", "user.email", "t@t")
  git(dir, "config", "user.name", "t")
  git(dir, "config", "core.autocrlf", "false")
  writeFileSync(join(dir, "app.py"), "x = 1\n")
  writeFileSync(join(dir, "notes.md"), "notes\n")
  git(dir, "add", "-A")
  git(dir, "commit", "-qm", "init")
  return dir
}

/** Fake V2 plugin ctx. parents: sessionID -> parentID for child sessions. */
function makeCtx(dir, { parents = {} } = {}) {
  const hooks = new Map()
  const synthetic = []
  const hook = (domain) => async (name, cb) => {
    hooks.set(`${domain}.${name}`, cb)
    return { dispose: async () => {} }
  }
  // Event stream: emit() resolves once the plugin asks for the next event,
  // i.e. after it finished handling this one.
  const pending = []
  let waiter = null
  let lastDone = null
  async function* stream(signal) {
    for (;;) {
      if (lastDone) {
        lastDone()
        lastDone = null
      }
      if (signal?.aborted) return
      if (pending.length === 0) await new Promise((r) => (waiter = r))
      const { ev, done } = pending.shift()
      lastDone = done
      yield ev
    }
  }
  const ctx = {
    location: { directory: dir },
    session: {
      hook: hook("session"),
      get: async ({ sessionID }) => ({ id: sessionID, parentID: parents[sessionID], location: { directory: dir } }),
      synthetic: async (input) => {
        synthetic.push(input)
      },
    },
    tool: { hook: hook("tool") },
    permission: { hook: hook("permission") },
    event: { subscribe: (opts) => stream(opts?.signal) },
  }
  const call = async (key, input) => {
    const cb = hooks.get(key)
    if (cb) await cb(input)
    return input
  }
  let n = 0
  const api = {
    ctx,
    synthetic,
    emit: (type, data) =>
      new Promise((done) => {
        pending.push({ ev: { id: `ev${++n}`, type, data }, done })
        const w = waiter
        waiter = null
        w?.()
      }),
    prompt: (sessionID, text = "do the work") =>
      call("session.prompt", { sessionID, messageID: `m${++n}`, prompt: { text }, delivery: "queue" }),
    toolAfter: (sessionID, tool, input, status = "completed") =>
      call("tool.execute.after", {
        tool,
        sessionID,
        agent: "build",
        messageID: `m${++n}`,
        id: `c${++n}`,
        input,
        status,
        ...(status === "completed" ? { result: { output: "" } } : { error: { message: "boom" } }),
      }),
    edit: async (sessionID, file, content = `x = ${++n}\n`, tool = "edit") => {
      writeFileSync(join(dir, file), content)
      return api.toolAfter(sessionID, tool, { path: file })
    },
    evaluate: (sessionID, resources, action = "shell") =>
      call("permission.evaluate", { sessionID, agent: "build", action, resources, effect: "allow" }),
  }
  return api
}

let instance = 0
async function run(name, dir, fn, opts) {
  instance += 1
  const { default: plugin } = await import(`${PLUGIN}?i=${instance}`)
  const t = makeCtx(dir, opts)
  const cleanup = await plugin.setup(t.ctx)
  try {
    await fn(t)
  } catch (err) {
    failures.push(`${name}: threw ${err?.stack ?? err}`)
  } finally {
    if (typeof cleanup === "function") await cleanup()
  }
}

const held = (r) => r.effect === "deny"

// ---- Task 1: tracking and the commit gate ----
process.env.VERIFY_FINAL = "0"

await run("tracks code files only", makeRepo("t1"), async (t) => {
  await t.prompt("A")
  await t.edit("A", "app.py")
  await t.edit("A", "notes.md", "more\n", "write")
  const r = await t.evaluate("A", ["git commit -m x"])
  check("edit of a code file holds the commit", held(r), JSON.stringify(r))
  check("hold message names app.py", (r.message ?? "").includes("app.py"), r.message)
  check("hold message leaves out notes.md", !(r.message ?? "").includes("notes.md"), r.message)
})

await run("patch tool", makeRepo("t2"), async (t) => {
  await t.prompt("A")
  writeFileSync(join(t.ctx.location.directory, "app.py"), "x = 9\n")
  await t.toolAfter("A", "patch", { patchText: "*** Begin Patch\n*** Update File: app.py\n@@\n-x = 1\n+x = 9\n*** End Patch" })
  check("patch tool paths are tracked", held(await t.evaluate("A", ["git commit -m x"])))
})

await run("failed tool result", makeRepo("t3"), async (t) => {
  await t.prompt("A")
  writeFileSync(join(t.ctx.location.directory, "app.py"), "x = 9\n")
  await t.toolAfter("A", "edit", { path: "app.py" }, "error")
  check("failed tool results are not tracked", !held(await t.evaluate("A", ["git commit -m x"])))
})

await run("once per prompt", makeRepo("t4"), async (t) => {
  await t.prompt("A")
  await t.edit("A", "app.py")
  check("first commit is held", held(await t.evaluate("A", ["git commit -m x"])))
  check("second commit in the same prompt goes through", !held(await t.evaluate("A", ["git commit -m x"])))
  await t.prompt("A")
  await t.edit("A", "app.py")
  check("a new prompt holds again", held(await t.evaluate("A", ["git commit -m x"])))
})

await run("skill activation", makeRepo("t5"), async (t) => {
  await t.prompt("A")
  await t.edit("A", "app.py")
  await t.emit("session.skill.activated", { sessionID: "A", id: "post-work-cleanup", name: "post-work-cleanup", text: "" })
  check("skill activation clears tracking", !held(await t.evaluate("A", ["git commit -m x"])))
  await t.edit("A", "app.py")
  check("the cleanup's own edits are not tracked", !held(await t.evaluate("A", ["git commit -m y"])))
})

await run("skill file read", makeRepo("t6"), async (t) => {
  await t.prompt("A")
  await t.edit("A", "app.py")
  await t.toolAfter("A", "read", { path: "C:/Users/x/.agents/skills/post-work-cleanup/SKILL.md" })
  check("reading the skill file clears tracking", !held(await t.evaluate("A", ["git commit -m x"])))
  await t.edit("A", "app.py")
  check("edits after reading the skill are not tracked", !held(await t.evaluate("A", ["git commit -m y"])))
})

await run("non-commit shell", makeRepo("t7"), async (t) => {
  await t.prompt("A")
  await t.edit("A", "app.py")
  check("non-commit shell is untouched", !held(await t.evaluate("A", ["git status"])))
  check("non-shell actions are untouched", !held(await t.evaluate("A", ["git commit"], "edit")))
})

await run("sessions isolated", makeRepo("t8"), async (t) => {
  await t.prompt("A")
  await t.prompt("B")
  await t.edit("A", "app.py")
  check("another session's edits never hold this session's commit", !held(await t.evaluate("B", ["git commit -m x"])))
})

await run("child sessions", makeRepo("t9"), async (t) => {
  await t.prompt("C")
  await t.edit("C", "app.py")
  check("child sessions are ignored", !held(await t.evaluate("C", ["git commit -m x"])))
}, { parents: { C: "A" } })

await run("pruned", makeRepo("t10"), async (t) => {
  await t.prompt("A")
  await t.edit("A", "app.py")
  git(t.ctx.location.directory, "commit", "-qam", "outside")
  check("files committed outside the gate are pruned", !held(await t.evaluate("A", ["git commit -m x"])))
})

await run("disabled", makeRepo("t11"), async (t) => {
  process.env.POST_WORK_CLEANUP = "0"
  try {
    await t.prompt("A")
    await t.edit("A", "app.py")
    check("POST_WORK_CLEANUP=0 disables the gate", !held(await t.evaluate("A", ["git commit -m x"])))
  } finally {
    delete process.env.POST_WORK_CLEANUP
  }
})

console.log(`opencode-verify-final: ${pass} passed, ${failures.length} failed`)
for (const f of failures) console.log(`FAIL: ${f}`)
process.exit(failures.length ? 1 : 0)
