// Pi extension that mirrors the Claude Code / Codex Stop hook
// (.agents/bin/verify-final) and adds a post-work cleanup gate and nudge.
//
// Grounding check (verify-final):
//   TUI: runs after the agent settles, in the background, and delivers a FALSE
//   finding as one corrective follow-up turn (pi.sendUserMessage) or a
//   non-triggering notice.
//   Headless (print/JSON/RPC): runs inside agent_before_settle and returns the
//   finding as a custom-message continuation, because a post-settle
//   sendUserMessage cannot run there — print mode awaits one session.prompt and
//   exits. The boundary continuation is awaited inside that same prompt call.
//
// Cleanup (post-work-cleanup):
//   Tracks the code files THIS session changed through edit/write (by real
//   path, so a symlinked ~/.config file maps to its repo copy). Another
//   session's edits in the same repo are never counted. Two prompts:
//   - Commit gate: a bash `git commit` while tracked files are uncleaned is
//     blocked once per user prompt with the file list. Re-running the commit
//     goes through, so the agent can skip cleanup when it does not apply.
//   - Settle nudge: when the run ends with tracked files still uncommitted,
//     the boundary asks for cleanup over those files. It never asks for a
//     commit; whether to commit stays with the task and the repo's rules.
//   Reading the skill's SKILL.md or invoking /skill:post-work-cleanup counts as
//   running it: tracked files are cleared and the cleanup's own edits that
//   prompt are not tracked. Docs, notes, data files and harness paths (.pi/)
//   are never tracked. Edits made through bash (sed -i, heredocs) are not seen.
//   Cheap and local: no model call.
//
// Both boundary handlers fire at most once per user prompt (guarded by
// userPromptSeq) so a continuation cannot re-trigger itself: the run loop
// re-enters agent_before_settle after every `continue: true`.
import type {
  AgentBeforeSettleEvent,
  AgentBeforeSettleEventResult,
  CustomMessageEntryDraft,
  ExtensionAPI,
  ExtensionContext,
} from "@earendil-works/pi-coding-agent"
import { execFile, spawn, type ChildProcessWithoutNullStreams } from "node:child_process"
import { existsSync, realpathSync } from "node:fs"
import { homedir } from "node:os"
import {
  basename,
  dirname,
  isAbsolute,
  join as pathJoin,
  relative as pathRelative,
  resolve as pathResolve,
} from "node:path"

const VERIFY_BIN = pathJoin(homedir(), ".agents", "bin", "verify-final")
const CHECK_TIMEOUT_MS = 180_000
const MIN_CHARS = 200
// Grill format markers: answering questions or selecting next options.
const GRILL_MARKER_RE = /[\u2753\u27a1\ufe0f]/u
// The verify-final script opens every FALSE and UNGROUNDED finding with the
// verdict name and a pipe — match those, not bare "FALSE" / "UNGROUNDED"
// substrings, so the notice path can never be triggered by prose.
const FINDING_RE = /(^|\n)\s*(?:FALSE|UNGROUNDED)\s*\|/
// Hard cap on boundary-forced continuations per user prompt, in case a guard
// regresses and a handler re-fires.
const MAX_CONTINUATIONS_PER_PROMPT = 2
const CLEANUP_SKILL_NAME = "post-work-cleanup"
// The skill counts as run once its SKILL.md is read (model) or injected
// (/skill:post-work-cleanup, which expands to a <skill name=...> block).
const CLEANUP_SKILL_FILE_RE = /(^|[\\/])post-work-cleanup[\\/]SKILL\.md\b/
const CLEANUP_SKILL_BLOCK_RE = /<skill name="post-work-cleanup"/
// Repo-relative paths never tracked: harness and dependency output, not work.
// pi-lens also drops a .pi-lens-probe-home/ directory into the cwd.
const HARNESS_PATH_RE = /(^|\/)(?:\.pi|\.pi-lens[^/]*|node_modules)\//
// A bash command that runs `git commit`, including `git -C dir commit` and
// `git -c k=v commit`. Quoted text such as grep "git commit" does not match
// because the quote is not an accepted separator.
const GIT_COMMIT_RE = /(?:^|[\s;&|(])git((?:\s+-[Cc]\s+\S+|\s+--?[\w-]+(?:=\S+)?)*)\s+commit\b/
// Code surfaces only. Cleanup exists for code, so a session that changed only
// docs, notes, ledgers, JSON or YAML is left alone. Extensionless scripts
// (identified by shebang) are not matched.
const CODE_EXT_RE =
  /\.(?:py|pyi|ps1|psm1|psd1|sh|bash|zsh|ksh|ts|tsx|mts|cts|js|jsx|mjs|cjs|go|rb|rs|c|h|cc|cpp|hpp|cxx|hxx|java|kt|kts|cs|php|sql|lua|swift|scala|pl|pm|r|ex|exs|erl|hs|clj|dart|vue|svelte)$/i
const CLEANUP_DISABLE_HINT = "(Set POST_WORK_CLEANUP=0 to disable this reminder.)"
const NOT_A_COMMIT_REQUEST =
  "This is not a request to commit: commit only if the task or the repo's rules call for it."

function cleanupAction(skillAvailable: boolean): string {
  return skillAvailable
    ? "run the `post-work-cleanup` skill over them and apply its findings"
    : "review them for leftover debug output, dead code and unused imports, and run the " +
        "project's linter or formatter if one is configured"
}

/** Settle nudge: tracked files are still uncommitted at the end of the run. */
function settleDirective(files: string[], skillAvailable: boolean): string {
  return [
    `This session changed code files that are not committed yet: ${files.join(", ")}.`,
    `If the work on them is finished, ${cleanupAction(skillAvailable)} before they are committed;`,
    "if it is not finished, say so and skip this.",
    NOT_A_COMMIT_REQUEST,
    CLEANUP_DISABLE_HINT,
  ].join(" ")
}

/** Commit gate: the block reason the agent sees in place of the commit result. */
function gateReason(files: string[], skillAvailable: boolean): string {
  return [
    `Commit held once by the post-work-cleanup gate: this session changed ${files.join(", ")}`,
    `and the cleanup has not run. First ${cleanupAction(skillAvailable)}, then commit again.`,
    "Skip the cleanup only if the user said to; then re-run the same commit and it will not",
    "be held again for this prompt.",
    CLEANUP_DISABLE_HINT,
  ].join(" ")
}

interface RunResult {
  stdout: string
  stderr: string
  exitCode: number | null
  signal: NodeJS.Signals | null
  timedOut: boolean
  errored: boolean
}

let activeChild: ChildProcessWithoutNullStreams | null = null
let lastAssistantText = ""
let userPromptSeq = 0
let lastFollowupSeq = -1
// Boundary guards, keyed to the user prompt they fired for.
let groundingDoneSeq = -1
let cleanupDoneSeq = -1
let continuationsThisPrompt = 0
// Cleanup state. tracked: real path -> repo root, for code files this session
// changed through edit/write since the cleanup last ran.
const tracked = new Map<string, string>()
let cleanupRanSeq = -1
let gateHeldSeq = -1

function shouldSkipText(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed) return true
  if (trimmed.length < MIN_CHARS && !GRILL_MARKER_RE.test(trimmed)) return true
  return false
}

function resolveCwd(ctx: ExtensionContext | undefined): string {
  return ctx?.cwd && ctx.cwd.length > 0 ? ctx.cwd : process.cwd()
}

function git(cwd: string, args: string[]): Promise<string | null> {
  return new Promise((resolve) => {
    execFile("git", args, { cwd, timeout: 10_000, maxBuffer: 1 << 20 }, (err, stdout) => {
      resolve(err ? null : stdout.replace(/\r/g, ""))
    })
  })
}

/** Repo root containing dir (real path), or null outside a work tree. */
async function repoRootOf(dir: string): Promise<string | null> {
  const out = await git(dir, ["rev-parse", "--show-toplevel"])
  const root = out?.trim()
  if (!root) return null
  try {
    return realpathSync(root)
  } catch {
    return root
  }
}

/** Resolve a tool path the way pi does (~, leading @, cwd-relative), then follow symlinks. */
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

/** Track a code file changed by edit/write, if it lives in a git work tree. */
async function trackChangedFile(raw: string, cwd: string): Promise<void> {
  const real = realToolPath(raw, cwd)
  if (!CODE_EXT_RE.test(real)) return
  const root = await repoRootOf(dirname(real))
  if (!root) return
  if (HARNESS_PATH_RE.test(pathRelative(root, real))) return
  tracked.set(real, root)
}

/** Drop tracked files that are no longer dirty (committed, reverted, ignored). */
async function pruneTracked(): Promise<void> {
  const byRoot = new Map<string, string[]>()
  for (const [file, root] of tracked) {
    const list = byRoot.get(root) ?? []
    list.push(file)
    byRoot.set(root, list)
  }
  for (const [root, files] of byRoot) {
    const out = await git(root, ["status", "--porcelain", "--untracked-files=all", "--", ...files])
    // Unknown state (git failed): keep the entries rather than lose them.
    if (out === null) continue
    const dirty = new Set<string>()
    for (const line of out.split("\n")) {
      if (line.trim().length === 0) continue
      let rel = line.slice(3).trim()
      if (rel.includes(" -> ")) rel = rel.split(" -> ").pop() ?? rel
      dirty.add(pathResolve(root, rel.replace(/^"|"$/g, "")))
    }
    for (const file of files) if (!dirty.has(file)) tracked.delete(file)
  }
}

/** Short display path: cwd-relative inside cwd, ~-relative under home, else absolute. */
function displayPath(file: string, cwd: string): string {
  const rel = pathRelative(realToolPath(cwd, cwd), file)
  if (rel && !rel.startsWith("..") && !isAbsolute(rel)) return rel
  const home = homedir()
  return file.startsWith(home + "/") ? "~/" + file.slice(home.length + 1) : file
}

/**
 * Repo a `git commit` command targets: its -C dir, else the directory of the
 * last `cd` before it, else cwd. Null when that is not a work tree.
 */
async function commitRepo(command: string, cwd: string): Promise<string | null> {
  const match = GIT_COMMIT_RE.exec(command)
  if (!match) return null
  let dir = cwd
  const before = command.slice(0, match.index)
  const cds = [...before.matchAll(/(?:^|[;&|(]\s*)cd\s+("[^"]+"|'[^']+'|[^\s;&|)]+)/g)]
  const lastCd = cds.at(-1)?.[1]
  if (lastCd) dir = realToolPath(lastCd.replace(/^["']|["']$/g, ""), dir)
  const dashC = /-C\s+("[^"]+"|'[^']+'|\S+)/.exec(match[1] ?? "")?.[1]
  if (dashC) dir = realToolPath(dashC.replace(/^["']|["']$/g, ""), dir)
  return repoRootOf(dir)
}

function markCleanupRan(): void {
  cleanupRanSeq = userPromptSeq
  tracked.clear()
}

/** True when pi can load the cleanup skill from cwd or a user skill root. */
function cleanupSkillAvailable(cwd: string): boolean {
  const tail = ["skills", CLEANUP_SKILL_NAME, "SKILL.md"]
  const candidates = [
    pathJoin(homedir(), ".agents", ...tail),
    pathJoin(homedir(), ".pi", "agent", ...tail),
  ]
  let dir = pathResolve(cwd)
  for (;;) {
    candidates.push(pathJoin(dir, ".agents", ...tail))
    candidates.push(pathJoin(dir, ".pi", ...tail))
    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return candidates.some((candidate) => existsSync(candidate))
}

function runCheck(cwd: string, text: string): Promise<RunResult> {
  return new Promise((resolve) => {
    let stdout = ""
    let stderr = ""
    let timedOut = false
    let errored = false
    let child: ChildProcessWithoutNullStreams
    try {
      child = spawn(VERIFY_BIN, ["--check", "-"], {
        cwd,
        stdio: ["pipe", "pipe", "pipe"],
      })
    } catch {
      resolve({ stdout: "", stderr: "spawn failed", exitCode: null, signal: null, timedOut: false, errored: true })
      return
    }
    activeChild = child
    child.stdout.setEncoding("utf8")
    child.stderr.setEncoding("utf8")
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk
    })
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk
    })
    const timer = setTimeout(() => {
      timedOut = true
      try {
        child.kill()
      } catch {
        // Already exited; close/error still resolves the promise.
      }
    }, CHECK_TIMEOUT_MS)
    if (typeof timer.unref === "function") timer.unref()
    child.on("close", (exitCode, signal) => {
      clearTimeout(timer)
      if (activeChild === child) activeChild = null
      resolve({ stdout, stderr, exitCode, signal, timedOut, errored })
    })
    child.on("error", () => {
      errored = true
      clearTimeout(timer)
      if (activeChild === child) activeChild = null
      resolve({ stdout, stderr, exitCode: null, signal: null, timedOut, errored })
    })
    child.stdin.setDefaultEncoding("utf8")
    child.stdin.end(text)
  })
}

function extractText(message: unknown): string {
  if (!message || typeof message !== "object") return ""
  const obj = message as Record<string, unknown>
  const content = obj.content
  if (typeof content === "string") return content
  if (!Array.isArray(content)) return ""
  return content
    .map((chunk: unknown) => {
      if (typeof chunk === "string") return chunk
      if (chunk && typeof chunk === "object" && typeof (chunk as { text?: unknown }).text === "string") {
        return (chunk as { text: string }).text
      }
      return ""
    })
    .filter((s) => s.length > 0)
    .join(" ")
}

function noticeText(result: RunResult): string {
  const head = result.stdout.trim().split("\n", 1)[0] ?? ""
  if (head) return head.length > 240 ? head.slice(0, 239) + "\u2026" : head
  const errHead = result.stderr.trim().split("\n", 1)[0] ?? ""
  if (errHead) return "verify-final: " + (errHead.length > 220 ? errHead.slice(0, 219) + "\u2026" : errHead)
  return result.timedOut
    ? "verify-final: check timed out"
    : result.errored
    ? "verify-final: check could not run"
    : "verify-final: see findings"
}

function customMessage(customType: string, content: string): CustomMessageEntryDraft {
  return { type: "custom_message", customType, content, display: true }
}

/** One continuation is allowed per boundary; compose rather than clobber. */
function withContinuation(event: AgentBeforeSettleEvent, entry: CustomMessageEntryDraft): AgentBeforeSettleEventResult {
  return { entries: [...event.entries, entry], continue: true }
}

export default function verifyFinalHook(pi: ExtensionAPI): void {
  let aborted = false

  pi.on("before_agent_start", async (event) => {
    // Only a user prompt begins a logical turn. A custom-triggered run
    // (pi.sendMessage with triggerTurn) belongs to the turn already in flight,
    // so counting it would reset the once-per-prompt guards and could make the
    // TUI follow-up prediction skip the wrong run.
    if (event.messageType !== "user") return
    userPromptSeq += 1
    groundingDoneSeq = -1
    cleanupDoneSeq = -1
    continuationsThisPrompt = 0
    if (CLEANUP_SKILL_BLOCK_RE.test(event.prompt)) markCleanupRan()
  })

  pi.on("session_start", () => {
    tracked.clear()
  })

  // A read of the cleanup skill means it is running now; a commit may be held.
  pi.on("tool_call", async (event, ctx) => {
    if (aborted) return
    if (process.env.POST_WORK_CLEANUP === "0") return
    const input = (event.input ?? {}) as Record<string, unknown>
    if (event.toolName === "read") {
      if (typeof input.path === "string" && CLEANUP_SKILL_FILE_RE.test(input.path)) markCleanupRan()
      return
    }
    if (event.toolName !== "bash" || typeof input.command !== "string") return
    // Commit gate.
    const command = input.command
    if (!GIT_COMMIT_RE.test(command)) return
    if (tracked.size === 0) return
    if (cleanupRanSeq === userPromptSeq || gateHeldSeq === userPromptSeq) return
    await pruneTracked()
    const cwd = resolveCwd(ctx)
    const root = await commitRepo(command, cwd)
    const files = [...tracked].flatMap(([f, fileRoot]) => (root === null || fileRoot === root ? [f] : []))
    if (files.length === 0) return
    gateHeldSeq = userPromptSeq
    const shown = files.map((f) => displayPath(f, cwd))
    return { block: true, reason: gateReason(shown, cleanupSkillAvailable(cwd)) }
  })

  // Track code files this session changed. The cleanup's own edits are not.
  pi.on("tool_result", async (event, ctx) => {
    if (aborted) return
    if (event.isError) return
    if (event.toolName !== "edit" && event.toolName !== "write") return
    if (cleanupRanSeq === userPromptSeq) return
    const path = (event.input as { path?: unknown }).path
    if (typeof path !== "string") return
    await trackChangedFile(path, resolveCwd(ctx))
  })

  pi.on("agent_end", (event) => {
    if (aborted) return
    const messages = Array.isArray((event as { messages?: unknown[] }).messages)
      ? (event as { messages: unknown[] }).messages
      : []
    let text = ""
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const message = messages[i]
      text = extractText(message)
      const role = message && typeof message === "object" ? (message as { role?: unknown }).role : undefined
      if (text && role === "assistant") break
      text = ""
    }
    lastAssistantText = text
  })

  // Settle nudge: this session's tracked code files are still uncommitted.
  pi.on("agent_before_settle", async (event, ctx): Promise<AgentBeforeSettleEventResult | void> => {
    if (aborted) return
    // Never extend a failed or interrupted run.
    if (event.outcome !== "completed") return
    if (process.env.POST_WORK_CLEANUP === "0") return
    if (cleanupDoneSeq === userPromptSeq) return
    // Already running this prompt, or the gate already asked and was declined.
    if (cleanupRanSeq === userPromptSeq || gateHeldSeq === userPromptSeq) return
    if (continuationsThisPrompt >= MAX_CONTINUATIONS_PER_PROMPT) return
    if (tracked.size === 0) return
    await pruneTracked()
    if (tracked.size === 0) return
    const cwd = resolveCwd(ctx)
    cleanupDoneSeq = userPromptSeq
    continuationsThisPrompt += 1
    const shown = [...tracked.keys()].map((f) => displayPath(f, cwd))
    return withContinuation(event, customMessage(CLEANUP_SKILL_NAME, settleDirective(shown, cleanupSkillAvailable(cwd))))
  })

  // Grounding check for headless modes, where a post-settle follow-up cannot run.
  pi.on("agent_before_settle", async (event, ctx): Promise<AgentBeforeSettleEventResult | void> => {
    if (aborted) return
    if (event.outcome !== "completed") return
    if (ctx.mode === "tui") return
    if (process.env.VERIFY_FINAL === "0") return
    if (groundingDoneSeq === userPromptSeq) return
    if (userPromptSeq === lastFollowupSeq) return
    if (continuationsThisPrompt >= MAX_CONTINUATIONS_PER_PROMPT) return
    const text = lastAssistantText
    if (shouldSkipText(text)) return
    groundingDoneSeq = userPromptSeq
    const result = await runCheck(resolveCwd(ctx), text)
    if (aborted) return
    const out = result.stdout
    if (!out.trim()) return
    if (out.includes("verify-final: no findings")) return
    if (!FINDING_RE.test(out)) return
    continuationsThisPrompt += 1
    return withContinuation(event, customMessage("verify-final", out))
  })

  pi.on("agent_settled", (event, ctx) => {
    if (aborted) return
    // An interrupted run must not start a corrective follow-up.
    if (event.aborted) return
    if (typeof ctx.isIdle === "function" && ctx.isIdle() !== true) return
    // Headless modes are handled at the boundary above; this path is the
    // interactive one, where a background check plus a follow-up turn is right.
    if (ctx.mode !== "tui") return
    // Skip the turn that our own correction follow-up started.
    if (userPromptSeq === lastFollowupSeq) return
    if (groundingDoneSeq === userPromptSeq) return
    if (process.env.VERIFY_FINAL === "0") return
    const text = lastAssistantText
    lastAssistantText = ""
    if (shouldSkipText(text)) return
    const cwd = resolveCwd(ctx)
    const checkSeq = userPromptSeq
    groundingDoneSeq = userPromptSeq
    void runCheck(cwd, text)
      .then((result) => {
        if (aborted) return
        // A new user prompt arrived while the check ran — discard stale result.
        if (checkSeq !== userPromptSeq) return
        if (userPromptSeq === lastFollowupSeq) return
        const out = result.stdout
        const trimmed = out.trim()
        if (!trimmed) return
        if (out.includes("verify-final: no findings")) return
        if (FINDING_RE.test(out)) {
          lastFollowupSeq = userPromptSeq + 1
          pi.sendUserMessage(out)
          return
        }
        // UNSURE lines, "check could not run", or any other diagnostic.
        try {
          ctx.ui.notify(noticeText(result), "warning")
        } catch {
          // UI gone (session ended mid-check); the notice is best-effort.
        }
      })
      .catch(() => {})
  })

  pi.on("session_shutdown", () => {
    aborted = true
    const child = activeChild
    if (child) {
      activeChild = null
      try {
        child.kill()
      } catch {
        // Already exited; nothing left to stop at shutdown.
      }
    }
  })
}
