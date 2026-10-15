// Pi extension that mirrors the Claude Code / Codex Stop hook
// (.agents/bin/verify-final) for interactive Pi sessions. After an
// agent run settles, the last assistant message is checked by the
// same script in the background; findings are either delivered back
// as one corrective follow-up turn or surfaced as a non-triggering
// notice. The check is skipped on turns started by the extension's
// own correction message (no loops) and on turns where a new user
// prompt arrived while the check was running (stale results).
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent"
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process"
import { homedir } from "node:os"
import { join as pathJoin } from "node:path"

const VERIFY_BIN = pathJoin(homedir(), ".agents", "bin", "verify-final")
const CHECK_TIMEOUT_MS = 180_000
const MIN_CHARS = 200
// Grill format markers: answering questions or selecting next options.
const GRILL_MARKER_RE = /[\u2753\u27a1\ufe0f]/u
// The verify-final script opens every FALSE and UNGROUNDED finding with the
// verdict name and a pipe — match those, not bare "FALSE" / "UNGROUNDED"
// substrings, so the notice path can never be triggered by prose.
const FINDING_RE = /(^|\n)\s*(?:FALSE|UNGROUNDED)\s*\|/

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

function shouldSkipText(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed) return true
  if (trimmed.length < MIN_CHARS && !GRILL_MARKER_RE.test(trimmed)) return true
  return false
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

export default function verifyFinalHook(pi: ExtensionAPI): void {
  let aborted = false

  pi.on("before_agent_start", () => {
    userPromptSeq += 1
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

  pi.on("agent_settled", (_event, ctx) => {
    if (aborted) return
    if (typeof ctx.isIdle === "function" && ctx.isIdle() !== true) return
    // Skip in print, RPC, and JSON modes: only interactive TUI has the UI
    // surface and follow-up prompt flow the hook copy is designed for.
    if (ctx.mode !== "tui") return
    // Skip the turn that our own correction follow-up started.
    if (userPromptSeq === lastFollowupSeq) return
    if (process.env.VERIFY_FINAL === "0") return
    const text = lastAssistantText
    lastAssistantText = ""
    if (shouldSkipText(text)) return
    const cwd = ctx.cwd && ctx.cwd.length > 0 ? ctx.cwd : process.cwd()
    const checkSeq = userPromptSeq
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
