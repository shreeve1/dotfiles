// Pi extension that mirrors the Claude Code / Codex Stop hook
// (.agents/bin/verify-final) and adds a post-work cleanup nudge.
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
// Cleanup nudge (post-work-cleanup):
//   In every mode, when the turn changed a CODE file, the boundary appends a
//   directive to clean up before committing: the workspace skill when it is
//   loadable here, otherwise a self-contained checklist. Docs, notes, ledgers,
//   data files and harness paths (.pi/) never trigger it, so a turn that only
//   writes a note is left alone. Cheap and local: no model call.
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
import { existsSync } from "node:fs"
import { homedir } from "node:os"
import { dirname, join as pathJoin, resolve as pathResolve } from "node:path"

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
// Porcelain paths the nudge ignores: harness and dependency output, not work.
// pi-lens also drops a .pi-lens-probe-home/ directory into the cwd.
const HARNESS_PATH_RE = /(^|\/)(?:\.pi|\.pi-lens[^/]*|node_modules)\//
// Code surfaces only. The nudge exists for code cleanup, so a turn that changed
// only docs, notes, ledgers, JSON or YAML is left alone. Extensionless scripts
// (identified by shebang) are not matched and so do not trigger it.
const CODE_EXT_RE =
  /\.(?:py|pyi|ps1|psm1|psd1|sh|bash|zsh|ksh|ts|tsx|mts|cts|js|jsx|mjs|cjs|go|rb|rs|c|h|cc|cpp|hpp|cxx|hxx|java|kt|kts|cs|php|sql|lua|swift|scala|pl|pm|r|ex|exs|erl|hs|clj|dart|vue|svelte)$/i
const CLEANUP_SKILL_DIRECTIVE = [
  "Workspace files changed during this turn and are not yet committed.",
  "Before committing, run the `post-work-cleanup` skill over this session's diff,",
  "apply its findings, then make the commit.",
  "(Set POST_WORK_CLEANUP=0 to disable this reminder.)",
].join(" ")
// Used when the workspace skill is not loadable from this repository.
const CLEANUP_FALLBACK_DIRECTIVE = [
  "Workspace files changed during this turn and are not yet committed.",
  "Before committing, review this session's diff for stray files, leftover debug",
  "output, dead code and unused imports, run the project's linter or formatter if",
  "one is configured, then make the commit.",
  "(Set POST_WORK_CLEANUP=0 to disable this reminder.)",
].join(" ")

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
// Working-tree snapshot captured when the prompt started, compared at the
// boundary to decide whether this turn changed anything.
let treeAtPrompt = ""

function shouldSkipText(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed) return true
  if (trimmed.length < MIN_CHARS && !GRILL_MARKER_RE.test(trimmed)) return true
  return false
}

function resolveCwd(ctx: ExtensionContext | undefined): string {
  return ctx?.cwd && ctx.cwd.length > 0 ? ctx.cwd : process.cwd()
}

/**
 * `git status --porcelain` for the repo at cwd, or "" when there is none.
 * Harness and dependency paths are dropped so tooling files cannot make the
 * tree look changed.
 */
function gitStatus(cwd: string): Promise<string> {
  return new Promise((resolve) => {
    execFile(
      "git",
      ["status", "--porcelain", "--untracked-files=all"],
      { cwd, timeout: 10_000, maxBuffer: 1 << 20 },
      (err, stdout) => {
        if (err) {
          resolve("")
          return
        }
        const kept = stdout
          .replace(/\r/g, "")
          .split("\n")
          .filter((line) => line.trim().length > 0 && !HARNESS_PATH_RE.test(line.slice(3)))
        resolve(kept.join("\n"))
      },
    )
  })
}

/** Porcelain lines present now that were not present at prompt start. */
function newPorcelainLines(now: string, before: string): string[] {
  const previous = new Set(before.split("\n").filter((line) => line.trim().length > 0))
  return now.split("\n").filter((line) => line.trim().length > 0 && !previous.has(line))
}

/** True when a porcelain line names a changed path on a code surface. */
function isCodeLine(line: string): boolean {
  // Strip the XY status prefix, then the quoting git adds for odd paths.
  let path = line.slice(3).trim().replace(/^"|"$/g, "")
  if (path.includes(" -> ")) path = path.split(" -> ").pop() ?? path
  return CODE_EXT_RE.test(path.replace(/^"|"$/g, ""))
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
      } catch {}
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

  pi.on("before_agent_start", async (event, ctx) => {
    // Only a user prompt begins a logical turn. A custom-triggered run
    // (pi.sendMessage with triggerTurn) belongs to the turn already in flight,
    // so counting it would reset the once-per-prompt guards and could make the
    // TUI follow-up prediction skip the wrong run.
    if (event.messageType !== "user") return
    userPromptSeq += 1
    groundingDoneSeq = -1
    cleanupDoneSeq = -1
    continuationsThisPrompt = 0
    treeAtPrompt = await gitStatus(resolveCwd(ctx))
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

  // Cleanup nudge: any working-tree change during the turn, in every mode.
  pi.on("agent_before_settle", async (event, ctx): Promise<AgentBeforeSettleEventResult | void> => {
    if (aborted) return
    // Never extend a failed or interrupted run.
    if (event.outcome !== "completed") return
    if (process.env.POST_WORK_CLEANUP === "0") return
    if (cleanupDoneSeq === userPromptSeq) return
    if (continuationsThisPrompt >= MAX_CONTINUATIONS_PER_PROMPT) return
    const cwd = resolveCwd(ctx)
    const now = await gitStatus(cwd)
    // Only a newly changed code file triggers this, never a pre-existing dirty
    // one, and never a docs/notes/ledger-only turn.
    if (!newPorcelainLines(now, treeAtPrompt).some(isCodeLine)) return
    cleanupDoneSeq = userPromptSeq
    continuationsThisPrompt += 1
    const directive = cleanupSkillAvailable(cwd) ? CLEANUP_SKILL_DIRECTIVE : CLEANUP_FALLBACK_DIRECTIVE
    return withContinuation(event, customMessage(CLEANUP_SKILL_NAME, directive))
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
        } catch {}
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
      } catch {}
    }
  })
}
