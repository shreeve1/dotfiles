// OpenCode V2 port of the pi extension .pi/agent/extensions/verify-final.ts
// (ADR 0015): a post-work cleanup gate and nudge, and a grounding check of the
// final answer through .agents/bin/verify-final.
//
// Cleanup (post-work-cleanup):
//   Tracks the code files each root session changed through edit/write/patch
//   (by real path, so a symlinked ~/.config file maps to its repo copy).
//   Another session's edits are never counted; subagent (child) sessions are
//   ignored entirely.
//   - Commit gate: a shell permission check whose command looks like a
//     `git commit` is denied once per user prompt while tracked files are
//     uncleaned. Simplified from pi: no shell parsing and no repo targeting
//     (surftop runs PowerShell), so the hold covers all tracked files and a
//     false hold costs one retry. Re-running the commit goes through.
//   - Settle nudge: when a run ends with tracked files still uncommitted, a
//     follow-up asks for cleanup over those files. It never asks for a commit.
//   A successful read of the skill's SKILL.md, or activating the
//   post-work-cleanup skill, counts as running it: tracked files are cleared
//   and the cleanup's own edits that prompt are not tracked.
//
// Grounding check (verify-final):
//   When a root session's run succeeds, its last answer is checked in the
//   background; a FALSE or UNGROUNDED finding goes back as a synthetic
//   follow-up. If the settle nudge fired instead, the answer after the cleanup
//   turn is the one checked. The check's own correction turn is never checked
//   again. At most one follow-up per run end and two per user prompt; a result
//   is dropped when a new turn started while it ran.
//
// The checker shells out to `pi`, so `pi` must be on PATH wherever this runs.
//
// Default export is a plain { id, setup } object with no runtime import of
// @opencode/plugin, and only erasable TypeScript, so node can run it in tests.
import { execFile, spawn, type ChildProcess } from "node:child_process"
import { existsSync, realpathSync } from "node:fs"
import { homedir } from "node:os"
import {
  basename,
  dirname,
  isAbsolute,
  join as pathJoin,
  relative as pathRelative,
  resolve as pathResolve,
  sep,
} from "node:path"

const CLEANUP_SKILL_NAME = "post-work-cleanup"
const CLEANUP_SKILL_FILE_RE = /(^|[\\/])post-work-cleanup[\\/]SKILL\.md\b/
// Repo-relative paths never tracked: harness and dependency output, not work.
const HARNESS_PATH_RE = /(^|[\\/])(?:\.pi|\.pi-lens[^\\/]*|\.opencode|node_modules)[\\/]/
const COMMIT_RE = /\bgit\b[\s\S]*\bcommit\b/
const PATCH_FILE_RE = /^\*\*\* (?:Add|Update) File: (.+)$/gm
const MAX_FILES_SHOWN = 10
const CODE_EXT_RE =
  /\.(?:py|pyi|ps1|psm1|psd1|sh|bash|zsh|ksh|ts|tsx|mts|cts|js|jsx|mjs|cjs|go|rb|rs|c|h|cc|cpp|hpp|cxx|hxx|java|kt|kts|cs|php|sql|lua|swift|scala|pl|pm|r|ex|exs|erl|hs|clj|dart|vue|svelte)$/i
const CLEANUP_DISABLE_HINT = "(Set POST_WORK_CLEANUP=0 to disable this reminder.)"
const NOT_A_COMMIT_REQUEST =
  "This is not a request to commit: commit only if the task or the repo's rules call for it."
const CHECK_TIMEOUT_MS = 180_000
const MIN_CHARS = 200
// Grill format markers: ❓, or ➡ followed by its emoji selector U+FE0F.
const GRILL_MARKER_RE = /\u2753|\u27a1\ufe0f/u
// Finding lines open with the verdict and a pipe; bare words in prose never match.
const FINDING_RE = /(^|\n)\s*(?:FALSE|UNGROUNDED)\s*\|/
const NO_FINDINGS = "verify-final: no findings"
const MAX_FOLLOWUPS_PER_PROMPT = 2

function fileList(files: string[]): string {
  if (files.length <= MAX_FILES_SHOWN) return files.join(", ")
  return `${files.slice(0, MAX_FILES_SHOWN).join(", ")} and ${files.length - MAX_FILES_SHOWN} more`
}

function cleanupAction(skillAvailable: boolean): string {
  return skillAvailable
    ? "run the `post-work-cleanup` skill over them and apply its findings"
    : "review them for leftover debug output, dead code and unused imports, and run the " +
        "project's linter or formatter if one is configured"
}

function settleDirective(files: string[], skillAvailable: boolean): string {
  return [
    `This session changed code files that are not committed yet: ${fileList(files)}.`,
    `If the work on them is finished, ${cleanupAction(skillAvailable)} before they are committed;`,
    "if it is not finished, say so and skip this.",
    NOT_A_COMMIT_REQUEST,
    CLEANUP_DISABLE_HINT,
  ].join(" ")
}

function shouldSkipText(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed) return true
  return trimmed.length < MIN_CHARS && !GRILL_MARKER_RE.test(trimmed)
}

function gateReason(files: string[], skillAvailable: boolean): string {
  return [
    `Commit held once by the post-work-cleanup gate: this session changed ${fileList(files)}`,
    `and the cleanup has not run. First ${cleanupAction(skillAvailable)}, then commit again.`,
    "Skip the cleanup only if the user said to; then re-run the same commit and it will not",
    "be held again for this prompt.",
    CLEANUP_DISABLE_HINT,
  ].join(" ")
}

interface SessionState {
  promptSeq: number
  /** real path -> repo root */
  tracked: Map<string, string>
  cleanupRanSeq: number
  gateHeldSeq: number
  nudgedSeq: number
  checkedSeq: number
  followups: number
  pendingFactCheck: boolean
  ownFollowupPending: boolean
  lastAnswer: { messageID: string; texts: string[] } | null
  child: ChildProcess | null
  dir: string | null
  isRoot: boolean | null
}

interface SessionInfo {
  parentID?: string
  location?: { directory?: string }
  directory?: string
}

// Minimal structural view of the V2 plugin context this plugin uses.
interface Ctx {
  location: { directory: string }
  session: {
    hook(name: string, cb: (e: any) => unknown): Promise<unknown>
    get(input: { sessionID: string }): Promise<SessionInfo>
    synthetic(input: Record<string, unknown>): Promise<unknown>
  }
  tool: { hook(name: string, cb: (e: any) => unknown): Promise<unknown> }
  permission: { hook(name: string, cb: (e: any) => unknown): Promise<unknown> }
  event: { subscribe(opts?: { signal?: AbortSignal }): AsyncIterable<any> }
}

const sessions = new Map<string, SessionState>()
// OpenCode can load this file more than once (one instance per location), and
// every instance shares this module state and receives every event. Handle each
// event id once.
const seenEvents = new Set<string>()
const MAX_SEEN_EVENTS = 1000

function firstSeen(id: unknown): boolean {
  if (typeof id !== "string") return true
  if (seenEvents.has(id)) return false
  seenEvents.add(id)
  if (seenEvents.size > MAX_SEEN_EVENTS) {
    for (const oldest of seenEvents) {
      seenEvents.delete(oldest)
      break
    }
  }
  return true
}

function state(sessionID: string): SessionState {
  let s = sessions.get(sessionID)
  if (!s) {
    s = {
      promptSeq: 0,
      tracked: new Map(),
      cleanupRanSeq: -1,
      gateHeldSeq: -1,
      nudgedSeq: -1,
      checkedSeq: -1,
      followups: 0,
      pendingFactCheck: false,
      ownFollowupPending: false,
      lastAnswer: null,
      child: null,
      dir: null,
      isRoot: null,
    }
    sessions.set(sessionID, s)
  }
  return s
}

/** Fill isRoot and dir from the session's info once. A failed lookup counts as a root in ctx's directory. */
async function loadInfo(ctx: Ctx, sessionID: string, s: SessionState): Promise<void> {
  let info: SessionInfo | null = null
  try {
    info = await ctx.session.get({ sessionID })
  } catch {
    // Unknown session: treat as root.
  }
  s.isRoot = !info?.parentID
  s.dir = info?.location?.directory ?? info?.directory ?? ctx.location.directory
}

async function isRoot(ctx: Ctx, sessionID: string): Promise<boolean> {
  const s = state(sessionID)
  if (s.isRoot === null) await loadInfo(ctx, sessionID, s)
  return s.isRoot ?? true
}

async function sessionDir(ctx: Ctx, sessionID: string): Promise<string> {
  const s = state(sessionID)
  if (s.dir === null) await loadInfo(ctx, sessionID, s)
  return s.dir ?? ctx.location.directory
}

function git(cwd: string, args: string[]): Promise<string | null> {
  return new Promise((resolve) => {
    execFile("git", args, { cwd, timeout: 10_000, maxBuffer: 1 << 20 }, (err, stdout) => {
      resolve(err ? null : stdout.replace(/\r/g, ""))
    })
  })
}

async function repoRootOf(dir: string): Promise<string | null> {
  const root = (await git(dir, ["rev-parse", "--show-toplevel"]))?.trim()
  if (!root) return null
  try {
    return realpathSync(root)
  } catch {
    return root
  }
}

function realToolPath(raw: string, cwd: string): string {
  let p = raw.startsWith("@") ? raw.slice(1) : raw
  if (p === "~") p = homedir()
  else if (p.startsWith("~/")) p = pathJoin(homedir(), p.slice(2))
  const abs = isAbsolute(p) ? pathResolve(p) : pathResolve(cwd, p)
  try {
    return realpathSync(abs)
  } catch {
    try {
      return pathJoin(realpathSync(dirname(abs)), basename(abs))
    } catch {
      return abs
    }
  }
}

async function trackChangedFile(s: SessionState, raw: string, cwd: string): Promise<void> {
  const real = realToolPath(raw, cwd)
  if (!CODE_EXT_RE.test(real)) return
  const root = await repoRootOf(dirname(real))
  if (!root) return
  if (HARNESS_PATH_RE.test(pathRelative(root, real))) return
  s.tracked.set(real, root)
}

/** Drop tracked files that are no longer dirty (committed, reverted, ignored). */
async function pruneTracked(s: SessionState): Promise<void> {
  const byRoot = new Map<string, string[]>()
  for (const [file, root] of s.tracked) {
    const list = byRoot.get(root) ?? []
    list.push(file)
    byRoot.set(root, list)
  }
  for (const [root, files] of byRoot) {
    const out = await git(root, [
      "--literal-pathspecs",
      "status",
      "--porcelain=v1",
      "-z",
      "--untracked-files=all",
      "--",
      ...files,
    ])
    if (out === null) continue
    const dirty = new Set<string>()
    const fields = out.split("\0")
    for (let i = 0; i < fields.length; i += 1) {
      const entry = fields[i]
      if (entry.length < 4) continue
      dirty.add(pathResolve(root, entry.slice(3)))
      if (entry[0] === "R" || entry[0] === "C") i += 1
    }
    for (const file of files) if (!dirty.has(file)) s.tracked.delete(file)
  }
}

function displayPath(file: string, cwd: string): string {
  const rel = pathRelative(realToolPath(cwd, cwd), file)
  if (rel && !rel.startsWith("..") && !isAbsolute(rel)) return rel
  const home = homedir()
  return file.startsWith(`${home}${sep}`) ? `~/${file.slice(home.length + 1)}` : file
}

function markCleanupRan(s: SessionState): void {
  s.cleanupRanSeq = s.promptSeq
  s.tracked.clear()
}

function cleanupSkillAvailable(cwd: string): boolean {
  const tail = ["skills", CLEANUP_SKILL_NAME, "SKILL.md"]
  const candidates = [
    pathJoin(homedir(), ".agents", ...tail),
    pathJoin(homedir(), ".config", "opencode", ...tail),
  ]
  let dir = pathResolve(cwd)
  for (;;) {
    candidates.push(pathJoin(dir, ".agents", ...tail))
    candidates.push(pathJoin(dir, ".opencode", ...tail))
    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return candidates.some((candidate) => existsSync(candidate))
}

function killChild(s: SessionState): void {
  const child = s.child
  s.child = null
  try {
    child?.kill()
  } catch {
    // Already exited.
  }
}

const cleanupDisabled = (): boolean => process.env.POST_WORK_CLEANUP === "0"

function log(what: string, err: unknown): void {
  console.error(`[verify-final] ${what}:`, err)
}

interface CheckResult {
  stdout: string
  stderr: string
  code: number | null
  timedOut: boolean
}

/** Run the checker with text on stdin. Never rejects. */
function runCheck(cwd: string, text: string, s: SessionState): Promise<CheckResult> {
  const bin = process.env.VERIFY_FINAL_BIN || pathJoin(homedir(), ".agents", "bin", "verify-final")
  // Windows cannot run a script from its shebang; the .mjs test double runs under node.
  const [exe, args] = bin.endsWith(".mjs")
    ? [process.execPath, [bin]]
    : process.platform === "win32"
      ? ["python", [bin]]
      : [bin, []]
  return new Promise((resolve) => {
    let stdout = ""
    let stderr = ""
    let timedOut = false
    let settled = false
    const finish = (code: number | null): void => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      if (s.child === child) s.child = null
      resolve({ stdout, stderr, code, timedOut })
    }
    let child: ChildProcess
    try {
      child = spawn(exe, [...args, "--check", "-"], { cwd, stdio: ["pipe", "pipe", "pipe"], windowsHide: true })
    } catch (err) {
      resolve({ stdout: "", stderr: String(err), code: null, timedOut: false })
      return
    }
    s.child = child
    const timer = setTimeout(() => {
      timedOut = true
      child.kill()
    }, CHECK_TIMEOUT_MS)
    child.stdout?.setEncoding("utf8")
    child.stderr?.setEncoding("utf8")
    child.stdout?.on("data", (c: string) => (stdout += c))
    child.stderr?.on("data", (c: string) => (stderr += c))
    child.on("error", (err) => {
      stderr += String(err)
      finish(null)
    })
    child.on("close", (code) => finish(code))
    child.stdin?.on("error", () => {})
    child.stdin?.end(text, "utf8")
  })
}

async function followUp(ctx: Ctx, sessionID: string, s: SessionState, text: string): Promise<void> {
  s.followups += 1
  s.ownFollowupPending = true
  await ctx.session.synthetic({ sessionID, text, resume: true })
}

async function onTurnEnd(ctx: Ctx, sessionID: string): Promise<void> {
  const s = state(sessionID)
  const answer = s.lastAnswer
  s.lastAnswer = null
  if (!(await isRoot(ctx, sessionID))) return
  if (s.ownFollowupPending) {
    s.ownFollowupPending = false
    // Our fact-check correction turn: never checked or nudged again.
    if (!s.pendingFactCheck) return
    // The cleanup turn: fall through to the fact-check only.
  } else if (
    !cleanupDisabled() &&
    s.followups < MAX_FOLLOWUPS_PER_PROMPT &&
    s.nudgedSeq !== s.promptSeq &&
    s.cleanupRanSeq !== s.promptSeq &&
    s.gateHeldSeq !== s.promptSeq &&
    s.tracked.size > 0
  ) {
    await pruneTracked(s)
    if (s.tracked.size > 0) {
      const cwd = await sessionDir(ctx, sessionID)
      const shown = [...s.tracked.keys()].map((f) => displayPath(f, cwd))
      s.nudgedSeq = s.promptSeq
      s.pendingFactCheck = true
      await followUp(ctx, sessionID, s, settleDirective(shown, cleanupSkillAvailable(cwd)))
      return
    }
  }

  s.pendingFactCheck = false
  if (process.env.VERIFY_FINAL === "0") return
  if (s.checkedSeq === s.promptSeq || s.followups >= MAX_FOLLOWUPS_PER_PROMPT) return
  const text = answer?.texts.join("\n") ?? ""
  if (shouldSkipText(text)) return
  s.checkedSeq = s.promptSeq
  const seq = s.promptSeq
  const cwd = await sessionDir(ctx, sessionID)
  void (async () => {
    try {
      const result = await runCheck(cwd, text, s)
      // A new turn (user or ours) started while the check ran: stale.
      if (seq !== s.promptSeq || s.ownFollowupPending || !sessions.has(sessionID)) return
      if (result.stdout.includes(NO_FINDINGS)) return
      if (FINDING_RE.test(result.stdout)) {
        await followUp(ctx, sessionID, s, result.stdout)
        return
      }
      const head = (result.stdout.trim() || result.stderr.trim()).split("\n", 1)[0]
      log("check", result.timedOut ? "timed out" : head || `exit ${result.code}`)
    } catch (err) {
      log("check follow-up", err)
    }
  })()
}

async function setup(ctx: Ctx) {
  const abort = new AbortController()

  await ctx.session.hook("prompt", (e) => {
    const s = state(e.sessionID)
    s.promptSeq += 1
    s.followups = 0
    s.pendingFactCheck = false
    s.ownFollowupPending = false
  })

  await ctx.tool.hook("execute.after", async (e) => {
    try {
      if (e.status !== "completed" || cleanupDisabled()) return
      if (!(await isRoot(ctx, e.sessionID))) return
      const s = state(e.sessionID)
      const input = (e.input ?? {}) as Record<string, unknown>
      const path = typeof input.path === "string" ? input.path : input.filePath
      if (e.tool === "read") {
        if (typeof path === "string" && CLEANUP_SKILL_FILE_RE.test(path)) markCleanupRan(s)
        return
      }
      if (s.cleanupRanSeq === s.promptSeq) return
      const paths: string[] = []
      if ((e.tool === "edit" || e.tool === "write") && typeof path === "string") paths.push(path)
      if (e.tool === "patch" && typeof input.patchText === "string")
        for (const m of input.patchText.matchAll(PATCH_FILE_RE)) paths.push(m[1].trim())
      if (paths.length === 0) return
      const cwd = await sessionDir(ctx, e.sessionID)
      for (const p of paths) await trackChangedFile(s, p, cwd)
    } catch (err) {
      log("execute.after", err)
    }
  })

  await ctx.permission.hook("evaluate", async (e) => {
    try {
      if (e.action !== "shell" || cleanupDisabled()) return
      const s = state(e.sessionID)
      const seq = s.promptSeq
      const done = (): boolean =>
        seq !== s.promptSeq || s.cleanupRanSeq === seq || s.gateHeldSeq === seq
      if (s.tracked.size === 0 || done()) return
      if (!(e.resources ?? []).some((r: string) => COMMIT_RE.test(r))) return
      if (!(await isRoot(ctx, e.sessionID))) return
      await pruneTracked(s)
      // Parallel commit checks: only the first to get here holds.
      if (s.tracked.size === 0 || done()) return
      s.gateHeldSeq = seq
      const cwd = await sessionDir(ctx, e.sessionID)
      const shown = [...s.tracked.keys()].map((f) => displayPath(f, cwd))
      e.effect = "deny"
      e.message = gateReason(shown, cleanupSkillAvailable(cwd))
    } catch (err) {
      log("permission.evaluate", err)
    }
  })

  const onEvent = async (ev: any): Promise<void> => {
    if (!firstSeen(ev?.id)) return
    const sessionID = ev?.data?.sessionID
    if (typeof sessionID !== "string") return
    switch (ev.type) {
      case "session.text.ended": {
        const s = state(sessionID)
        const id = String(ev.data.assistantMessageID ?? "")
        if (s.lastAnswer?.messageID !== id) s.lastAnswer = { messageID: id, texts: [] }
        if (typeof ev.data.text === "string") s.lastAnswer.texts.push(ev.data.text)
        return
      }
      case "session.execution.succeeded":
        await onTurnEnd(ctx, sessionID)
        return
      case "session.execution.failed":
      case "session.execution.interrupted": {
        const s = state(sessionID)
        s.ownFollowupPending = false
        s.pendingFactCheck = false
        s.lastAnswer = null
        return
      }
      case "session.skill.activated":
        if (ev.data.name === CLEANUP_SKILL_NAME || ev.data.id === CLEANUP_SKILL_NAME)
          markCleanupRan(state(sessionID))
        return
      case "session.deleted": {
        const s = sessions.get(sessionID)
        if (s) killChild(s)
        sessions.delete(sessionID)
        return
      }
    }
  }

  void (async () => {
    try {
      for await (const ev of ctx.event.subscribe({ signal: abort.signal })) {
        if (abort.signal.aborted) break
        try {
          await onEvent(ev)
        } catch (err) {
          log(`event ${ev?.type}`, err)
        }
      }
    } catch (err) {
      if (!abort.signal.aborted) log("event stream", err)
    }
  })()

  return () => {
    abort.abort()
    for (const s of sessions.values()) killChild(s)
  }
}

export default { id: "verify-final", setup }
