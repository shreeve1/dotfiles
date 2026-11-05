import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);

// dist/clients/hook-budgets.js
var HOOK_WALL_BUDGET_MS = Object.freeze({
  /** Visible startup work; the user is watching a progress line. */
  session_start: 5e3,
  /** Pure bookkeeping — nothing here may await (#2523 contract). */
  turn_start: 0,
  /** Measured p50 3687 ms / p90 14246 ms today. The gap IS the issue. */
  turn_end: 3e3,
  /** Measured p90 10043 ms today, from one unbounded pipeline re-entry. */
  agent_end: 1e3,
  /** The designated place for settled-time sweeps; the widest non-edit budget. */
  agent_settled: 1e4,
  /** Read/Grep/Glob/Bash: must never await analyzer bootstrap (AC5). */
  tool_result_read_only: 500,
  /** The ONLY path the contract lets block the host, and only this long. */
  tool_result_edit: 1e4,
  /** Replacement teardown is synchronous so its successor ordering is preserved (#3881). */
  session_shutdown: 0,
  /** The maintainer amendment permits quit-only sink draining before process exit (#2523). */
  session_shutdown_quit: 500,
  /** Synchronous message contribution; the host is blocked on the answer. */
  context: 0,
  /** Fork bookkeeping; the session is being replaced under it. */
  session_before_fork: 0
});
var HOOK_BUDGET_KEYS = Object.keys(HOOK_WALL_BUDGET_MS);

export {
  HOOK_WALL_BUDGET_MS
};
