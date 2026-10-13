import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  isMutatingToolName
} from "./chunk-IBGIOBEE.js";
import {
  normalizeMapKey
} from "./chunk-N2H3ZPZY.js";

// dist/clients/agent-behavior-client.js
var READ_OPS = /* @__PURE__ */ new Set(["read", "bash", "grep", "glob", "find", "rg"]);
var BLIND_WRITE_WINDOW = 5;
var THRASH_THRESHOLD = 3;
var THRASH_TIMEOUT_MS = 3e4;
var AgentBehaviorClient = class _AgentBehaviorClient {
  toolHistory = [];
  consecutiveCount = 0;
  lastToolName = null;
  lastToolFilePath = null;
  lastToolTimestamp = 0;
  // Per-file tracking
  fileEditCount = /* @__PURE__ */ new Map();
  static FILE_EDIT_IDLE_MS = 30 * 6e4;
  /**
   * Record a tool call and return any warnings triggered.
   * Called from tool_result handler.
   */
  recordToolCall(toolName, filePath) {
    const warnings = [];
    const now = Date.now();
    const normalizedPath = filePath ? normalizeMapKey(filePath) : null;
    if (toolName === this.lastToolName && normalizedPath === this.lastToolFilePath && now - this.lastToolTimestamp < THRASH_TIMEOUT_MS) {
      this.consecutiveCount++;
    } else {
      this.consecutiveCount = 1;
    }
    this.lastToolName = toolName;
    this.lastToolFilePath = normalizedPath;
    this.lastToolTimestamp = now;
    if (this.consecutiveCount === THRASH_THRESHOLD) {
      const fileLabel = filePath ? ` on \`${filePath}\`` : "";
      warnings.push({
        type: "thrashing",
        message: `\u{1F534} THRASHING \u2014 ${THRASH_THRESHOLD} consecutive \`${toolName}\`${fileLabel} calls with no progress. Consider fixing the root cause instead of re-running.`,
        severity: "error",
        details: {
          toolName,
          filePath,
          callCount: this.consecutiveCount
        }
      });
    }
    if (isMutatingToolName(toolName)) {
      const recentWindow = this.toolHistory.slice(-BLIND_WRITE_WINDOW);
      const hasRecentRead = recentWindow.some((r) => READ_OPS.has(r.toolName) || isMutatingToolName(r.toolName) && r.filePath !== void 0 && normalizedPath !== null && normalizeMapKey(r.filePath) === normalizedPath);
      if (!hasRecentRead && recentWindow.length > 0) {
        const writesWithoutRead = recentWindow.filter((r) => isMutatingToolName(r.toolName)).length;
        if (writesWithoutRead >= 2) {
          warnings.push({
            type: "blind-write",
            message: `\u26A0 BLIND WRITE \u2014 editing \`${filePath ?? "file"}\` without reading in the last ${BLIND_WRITE_WINDOW} tool calls. Read the file first to avoid assumptions.`,
            severity: "warning",
            details: {
              filePath,
              windowSize: recentWindow.length
            }
          });
        }
      }
      if (filePath) {
        const key = normalizeMapKey(filePath);
        this.fileEditCount.set(key, {
          count: (this.fileEditCount.get(key)?.count ?? 0) + 1,
          lastUsedAt: now
        });
        for (const [pathKey, entry] of this.fileEditCount) {
          if (now - entry.lastUsedAt > _AgentBehaviorClient.FILE_EDIT_IDLE_MS) {
            this.fileEditCount.delete(pathKey);
          }
        }
      }
    }
    this.toolHistory.push({ toolName, filePath, timestamp: now });
    if (this.toolHistory.length > 50) {
      this.toolHistory = this.toolHistory.slice(-50);
    }
    return warnings;
  }
  /**
   * Format warnings for LLM consumption.
   */
  formatWarnings(warnings) {
    if (warnings.length === 0)
      return "";
    return warnings.map((w) => w.message).join("\n");
  }
  /**
   * Get edit count for a file in this session.
   */
  getEditCount(filePath) {
    return this.fileEditCount.get(normalizeMapKey(filePath))?.count ?? 0;
  }
  /**
   * Reset state (e.g., on session start).
   */
  reset() {
    this.toolHistory = [];
    this.consecutiveCount = 0;
    this.lastToolName = null;
    this.lastToolTimestamp = 0;
    this.fileEditCount.clear();
  }
};
var agentBehaviorClient = new AgentBehaviorClient();

export {
  AgentBehaviorClient,
  agentBehaviorClient
};
