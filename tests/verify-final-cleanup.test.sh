#!/usr/bin/env bash
# The post-work-cleanup half of .pi/agent/extensions/verify-final.ts, driven by
# a fake pi event bus against throwaway git repos. Checks it tracks only this
# session's edit/write calls (through symlinks), holds a `git commit` once, nudges
# at settle only while those files are uncommitted, and never asks for a commit.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EXT="$ROOT/.pi/agent/extensions/verify-final.ts"

command -v node >/dev/null || {
  echo "SKIP: node not installed"
  exit 0
}

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$TMP/home"
export EXT TMP

HOME="$TMP/home" VERIFY_FINAL=0 node --input-type=module - <<'EOF'
import { execFileSync } from "node:child_process"
import { mkdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { join } from "node:path"

const tmp = process.env.TMP
const { default: register } = await import(process.env.EXT)

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
  writeFileSync(join(dir, "app.py"), "x = 1\n")
  writeFileSync(join(dir, "notes.md"), "notes\n")
  git(dir, "add", "-A")
  git(dir, "commit", "-qm", "init")
  return dir
}

// One extension instance per scenario, so module-level state starts clean.
let instance = 0
async function session(cwd) {
  instance += 1
  const mod = await import(`${process.env.EXT}?i=${instance}`)
  const handlers = new Map()
  mod.default({ on: (name, fn) => handlers.set(name, [...(handlers.get(name) ?? []), fn]), sendUserMessage() {} })
  const ctx = { cwd, mode: "tui", isIdle: () => true, ui: { notify() {} } }
  const emit = async (name, event) => {
    let last
    for (const fn of handlers.get(name) ?? []) {
      const r = await fn(event, ctx)
      if (r) last = r
      if (r?.block) break
    }
    return last
  }
  let n = 0
  return {
    prompt: (text = "do the work") => emit("before_agent_start", { messageType: "user", prompt: text }),
    edit: async (path, content = "x = 2\n") => {
      writeFileSync(path.startsWith("/") ? path : join(cwd, path), content)
      return emit("tool_result", { toolName: "edit", toolCallId: `e${++n}`, input: { path }, isError: false, content: [] })
    },
    read: (path) => emit("tool_call", { toolName: "read", toolCallId: `r${++n}`, input: { path } }),
    bash: (command) => emit("tool_call", { toolName: "bash", toolCallId: `b${++n}`, input: { command } }),
    settle: () => emit("agent_before_settle", { outcome: "completed", entries: [] }),
  }
}
const nudgeText = (r) => r?.entries?.at(-1)?.content ?? ""

// 1. Edited, not committed: settle nudge names the file and does not ask for a commit.
{
  const repo = makeRepo("r1")
  const s = await session(repo)
  await s.prompt()
  await s.edit("app.py")
  const r = await s.settle()
  check("settle nudges after an uncommitted code edit", r?.continue === true)
  check("nudge names the edited file", nudgeText(r).includes("app.py"), nudgeText(r))
  check("nudge does not ask for a commit", !/then make the commit/i.test(nudgeText(r)) && /not a request to commit/i.test(nudgeText(r)))
  check("nudge fires once per prompt", (await s.settle()) === undefined)
}

// 2. Commit in the same turn: held once with the file list, then let through.
{
  const repo = makeRepo("r2")
  const s = await session(repo)
  await s.prompt()
  await s.edit("app.py")
  const first = await s.bash("git add -A && git commit -m wip")
  check("first commit is held", first?.block === true)
  check("hold reason names the file", (first?.reason ?? "").includes("app.py"), first?.reason)
  // Offering "the change is trivial" as an out let a real agent skip every time.
  check("hold reason offers no trivial-change out", !/trivial/i.test(first?.reason ?? ""), first?.reason)
  // HOME has no skill here, so the self-contained checklist must be used.
  check("fallback checklist without the skill", /linter or formatter/.test(first?.reason ?? "") && !/`post-work-cleanup` skill/.test(first?.reason ?? ""), first?.reason)
  check("second commit goes through", (await s.bash("git commit -m wip")) === undefined)
  check("declined gate suppresses the settle nudge", (await s.settle()) === undefined)
}

// 3. Another session's change in the same repo is not this session's work.
{
  const repo = makeRepo("r3")
  const s = await session(repo)
  await s.prompt()
  writeFileSync(join(repo, "app.py"), "x = 3\n")
  check("foreign change does not nudge", (await s.settle()) === undefined)
  check("foreign change does not hold a commit", (await s.bash("git commit -am x")) === undefined)
}

// 4. Edit through a symlink outside the repo (the ~/.config case).
{
  const repo = makeRepo("r4")
  const cfg = join(tmp, "cfg")
  mkdirSync(cfg)
  symlinkSync(join(repo, "app.py"), join(cfg, "app.py"))
  const s = await session(tmp)
  await s.prompt()
  await s.edit(join(cfg, "app.py"))
  const held = await s.bash(`cd ${repo} && git commit -am fix`)
  check("symlinked edit is tracked to its repo", held?.block === true, JSON.stringify(held))
  check("hold names the real repo path", (held?.reason ?? "").includes("r4/app.py"), held?.reason)
}

// 5. Cleanup run (skill read) clears tracking; the cleanup's own edits are not tracked.
{
  const repo = makeRepo("r5")
  const s = await session(repo)
  await s.prompt()
  await s.edit("app.py")
  await s.read("/home/x/.agents/skills/post-work-cleanup/SKILL.md")
  await s.edit("app.py", "x = 4\n")
  check("commit after cleanup is not held", (await s.bash("git commit -am x")) === undefined)
  check("no settle nudge after cleanup", (await s.settle()) === undefined)
}

// 6. /skill:post-work-cleanup in the prompt counts as the cleanup.
{
  const repo = makeRepo("r6")
  const s = await session(repo)
  await s.prompt()
  await s.edit("app.py")
  await s.prompt('<skill name="post-work-cleanup" location="/x/SKILL.md">...</skill>')
  check("/skill invocation clears tracking", (await s.bash("git commit -am x")) === undefined)
}

// 7. Docs-only change, and a commit that already landed, leave it silent.
{
  const repo = makeRepo("r7")
  const s = await session(repo)
  await s.prompt()
  await s.edit("notes.md", "more\n")
  check("docs-only edit does not nudge", (await s.settle()) === undefined)
  await s.prompt()
  await s.edit("app.py")
  git(repo, "commit", "-qam", "landed")
  check("committed file is pruned at settle", (await s.settle()) === undefined)
}

// 8. A commit in a different repo is not held for this repo's files.
{
  const repo = makeRepo("r8")
  const other = makeRepo("r8-other")
  const s = await session(repo)
  await s.prompt()
  await s.edit("app.py")
  check("commit in another repo is not held", (await s.bash(`git -C ${other} commit -am x`)) === undefined)
  check("grep for the phrase is not a commit", (await s.bash(`grep -n "git commit" README.md`)) === undefined)
  const held = await s.bash(`git -c core.hooksPath=/dev/null commit -am x`)
  check("git -c k=v commit is recognised", held?.block === true)
}

// 9b. With the skill installed under HOME, the directive names the skill.
{
  const repo = makeRepo("r9b")
  const home = process.env.HOME
  mkdirSync(join(home, ".agents/skills/post-work-cleanup"), { recursive: true })
  writeFileSync(join(home, ".agents/skills/post-work-cleanup/SKILL.md"), "---\nname: post-work-cleanup\n---\n")
  const s = await session(repo)
  await s.prompt()
  await s.edit("app.py")
  const r = await s.settle()
  check("installed skill is named in the nudge", /`post-work-cleanup` skill/.test(nudgeText(r)), nudgeText(r))
  rmSync(join(home, ".agents"), { recursive: true })
}

// 9. A new prompt re-arms the gate while files stay uncleaned.
{
  const repo = makeRepo("r9")
  const s = await session(repo)
  await s.prompt()
  await s.edit("app.py")
  await s.bash("git commit -am x")
  await s.prompt()
  check("gate re-arms on the next prompt", (await s.bash("git commit -am x"))?.block === true)
}

// 10. Kill switch.
{
  const repo = makeRepo("r10")
  const s = await session(repo)
  await s.prompt()
  await s.edit("app.py")
  process.env.POST_WORK_CLEANUP = "0"
  check("POST_WORK_CLEANUP=0 disables the gate", (await s.bash("git commit -am x")) === undefined)
  check("POST_WORK_CLEANUP=0 disables the nudge", (await s.settle()) === undefined)
  delete process.env.POST_WORK_CLEANUP
}

for (const f of failures) console.error(`FAIL: ${f}`)
console.log(`verify-final-cleanup: ${pass} passed, ${failures.length} failed`)
process.exit(failures.length ? 1 : 0)
EOF
