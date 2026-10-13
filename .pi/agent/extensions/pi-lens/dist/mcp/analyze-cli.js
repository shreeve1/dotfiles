#!/usr/bin/env node
import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  AUTOMATION_FRAMING
} from "../chunk-KBG47GHP.js";
import {
  recordTurnEndOutcome,
  requestWarmAnalyze,
  requestWarmTurnEnd
} from "../chunk-L3BLXZG7.js";
import {
  setProjectTrustState
} from "../chunk-ZANLILYD.js";
import "../chunk-2EECBNC5.js";
import "../chunk-JAU72XNY.js";
import {
  flushExtensionLog,
  logExtension
} from "../chunk-XTMJ7XDT.js";
import "../chunk-JMYYOTQG.js";
import "../chunk-QQNQ7SJW.js";
import {
  redactSecrets
} from "../chunk-AOHZU2BM.js";
import "../chunk-LJDODBBZ.js";
import "../chunk-N2H3ZPZY.js";
import "../chunk-NXL4FFQQ.js";

// dist/mcp/analyze-cli.js
import * as path from "node:path";
console.log = (...args) => console.error(...args);
function argVal(name) {
  const prefix = `--${name}=`;
  const found = process.argv.find((value) => value.startsWith(prefix));
  return found ? found.slice(prefix.length) : void 0;
}
async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin)
    chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}
function formatReport(result, cwd) {
  const rel = path.relative(cwd, result.filePath) || result.filePath;
  const lines = [
    // #2420: advisories (hint/info-tier style opinions) reported under their
    // own label — no longer folded into the warning count on this surface.
    `\u{1F50E} pi-lens: ${rel} \u2014 ${result.counts.blockers} blocking, ${result.counts.warnings} warning(s), ${result.counts.advisories} advisory(ies)`
  ];
  for (const d of result.diagnostics.slice(0, 30)) {
    const marker = d.semantic === "blocking" ? "\u{1F534}" : "\u26A0";
    const label = d.rule ?? d.tool;
    lines.push(`  ${marker} L${d.line ?? "?"} ${label}: ${d.message}`);
  }
  if (result.diagnostics.length > 30) {
    lines.push(`  \u2026 ${result.diagnostics.length - 30} more`);
  }
  if (result.lsp && (result.lsp.status === "skipped" || result.lsp.status === "deferred")) {
    lines.push("  (LSP diagnostics were skipped or deferred \u2014 run pilens_analyze on the warm MCP server for type errors)");
  }
  return lines.join("\n");
}
var STDIN_READ_TIMEOUT_MS = 2e3;
async function readHookPayload() {
  if (process.stdin.isTTY)
    return void 0;
  const raw = await Promise.race([
    readStdin(),
    new Promise((resolve) => {
      const timer = setTimeout(() => resolve(void 0), STDIN_READ_TIMEOUT_MS);
      timer.unref();
    })
  ]);
  if (raw === void 0) {
    process.stdin.pause();
    process.stdin.unref?.();
    return void 0;
  }
  try {
    return JSON.parse(raw) ?? void 0;
  } catch {
    return void 0;
  }
}
var TURN_END_MAX_LINES = 40;
var TURN_END_MAX_CHARS = 2e3;
var ANSI_AND_CONTROL = new RegExp([
  "\\u001B\\][\\s\\S]*?(?:\\u0007|\\u001B\\\\)",
  // OSC … BEL/ST
  "\\u001B\\[[0-?]*[ -/]*[@-~]",
  // CSI — SGR colours et al
  "\\u001B[@-Z\\\\-_]",
  // two-byte escapes
  "[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F]"
  // C0 minus newline/tab, plus DEL
].join("|"), "g");
function stripControlSequences(text) {
  return text.replace(ANSI_AND_CONTROL, "");
}
function capCodeUnits(text, cap) {
  if (text.length <= cap)
    return text;
  const last = text.charCodeAt(cap - 1);
  const splitsPair = last >= 55296 && last <= 56319;
  return text.slice(0, splitsPair ? cap - 1 : cap);
}
function formatTurnEnd(response) {
  const sections = [response.turnEnd, response.tests].filter((section) => Boolean(section)).map((section) => stripControlSequences(section.split(AUTOMATION_FRAMING).join("")));
  if (sections.length === 0)
    return void 0;
  let out = `\u{1F50E} pi-lens turn-end
${sections.join("\n\n")}`;
  const lines = out.split("\n");
  if (lines.length > TURN_END_MAX_LINES) {
    out = `${lines.slice(0, TURN_END_MAX_LINES).join("\n")}
  \u2026 (truncated)`;
  }
  if (out.length > TURN_END_MAX_CHARS) {
    out = `${capCodeUnits(out, TURN_END_MAX_CHARS)}
  \u2026 (truncated)`;
  }
  return out;
}
var TURN_END_SKIP_REASONS = {
  "ipc-error": "no warm pi-lens MCP server answered for this workspace, or its build is stale \u2014 start the MCP server, or run `npm run build` if you have edited pi-lens sources",
  // #3255: split out of `ipc-error` because its remedy is different and no
  // rebuild reaches it. A server that was already running when pi-lens was
  // upgraded still owns the endpoint name the previous build derived.
  "no-listener": "nothing is listening on this workspace's warm endpoint \u2014 start the MCP server; if pi-lens was upgraded while a server was running, that server still owns the endpoint name of the previous build, so restart it",
  timeout: "the warm pi-lens MCP server did not finish the pass within the hook budget \u2014 the turn-end findings are kept and will be delivered on a later Stop",
  "schema-mismatch": "the warm pi-lens MCP server speaks a different turn-end schema than this hook binary \u2014 rebuild and restart the server so both halves match",
  "stale-answer": "the warm pi-lens MCP server replied about a superseded state \u2014 the findings are kept for a later Stop"
};
async function runTurnEndMode(cwd, payload) {
  if (payload?.hook_event_name === "SubagentStop") {
    process.stderr.write("pi-lens turn-end skipped: SubagentStop (the main agent's Stop runs the pass)\n");
    process.exitCode = 0;
    return;
  }
  const outcome = await requestWarmTurnEnd(cwd);
  if (!outcome.available) {
    const detail = TURN_END_SKIP_REASONS[outcome.reason];
    const message = `\u{1F50E} pi-lens turn-end skipped (${outcome.reason}): ${detail}`;
    process.stderr.write(`${message} (cwd: ${cwd})
`);
    await writeStdout(message);
    recordTurnEndOutcome(cwd, { ran: false, reason: outcome.reason });
    process.exitCode = 0;
    return;
  }
  recordTurnEndOutcome(cwd, { ran: true });
  const report = formatTurnEnd(outcome.response);
  if (report)
    await writeStdout(report);
  process.exitCode = 0;
}
function writeStdout(text) {
  return new Promise((done) => {
    process.stdout.write(`${text}
`, () => done());
  });
}
function writeReport(report, hookMode) {
  return writeStdout(hookMode ? JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PostToolUse",
      additionalContext: report
    }
  }) : report);
}
async function main() {
  setProjectTrustState("trusted");
  logExtension({
    subsystem: "project-trust",
    level: "debug",
    message: "analyze-cli: workspace trust belongs to the calling client; pi trust not consulted"
  });
  const hookMode = process.argv.includes("--hook");
  const withLsp = process.argv.includes("--lsp");
  const fileArg = argVal("file");
  const turnEndFlag = process.argv.includes("--turn-end");
  let cwd = argVal("cwd") ?? process.cwd();
  let hookInvocation = hookMode;
  let operation = "analyze";
  try {
    const payload = fileArg === void 0 && !turnEndFlag ? await readHookPayload() : void 0;
    cwd = argVal("cwd") ?? payload?.cwd ?? cwd;
    const event = payload?.hook_event_name;
    const payloadFile = payload?.tool_input?.file_path ?? payload?.tool_input?.path;
    hookInvocation ||= Boolean(payloadFile);
    if (turnEndFlag || event === "Stop" || event === "SubagentStop") {
      hookInvocation = true;
      operation = "turn-end";
      await runTurnEndMode(cwd, payload);
      return;
    }
    const file = fileArg ?? payloadFile;
    if (!file)
      process.exit(0);
    let result = await requestWarmAnalyze(cwd, file);
    if (!result) {
      const { analyzeFile } = await import("../chunk-3YN6V5TV.js");
      result = await analyzeFile(file, cwd, {
        flags: withLsp ? {} : { "no-lsp": true },
        record: false,
        registerTurnState: true
      });
    }
    const { flushProbeCache } = await import("../probes/installer.js");
    await flushProbeCache();
    if (result.counts.diagnostics === 0)
      process.exit(0);
    await writeReport(formatReport(result, cwd), hookMode);
    process.exit(0);
  } catch (err) {
    const detail = redactSecrets(stripControlSequences(err instanceof Error ? err.message : String(err))).replace(/\s+/g, " ");
    const reason = detail.length > 1e3 ? `${capCodeUnits(detail, 1e3)}\u2026 (truncated)` : detail;
    const message = `pi-lens-analyze failed: ${reason}`;
    recordTurnEndOutcome(cwd, { failed: true, operation, reason });
    logExtension({
      subsystem: "analyze-cli",
      message: "analyze-cli-failed",
      metadata: { cwd, operation, reason }
    });
    process.stderr.write(`${message}
`);
    await writeReport(message, hookMode && operation === "analyze");
    await flushExtensionLog();
    process.exit(hookInvocation ? 0 : 2);
  }
}
void main();
