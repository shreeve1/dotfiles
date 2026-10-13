import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  logExtension
} from "./chunk-XTMJ7XDT.js";
import {
  DEPRECATED_CONFIG_SURFACES
} from "./chunk-JMYYOTQG.js";
import {
  logLatency
} from "./chunk-QQNQ7SJW.js";
import {
  PROCESS_SINGLETON_RESET_KIND,
  getProbeHomeRedirectEvent,
  getProcessSingletonResets,
  getSinkOptionConflicts,
  getSinkRotations,
  getSinkTruncateRefusals,
  getSinkWriteFailures,
  resetSinkRotations,
  resetSinkWriteFailures
} from "./chunk-AOHZU2BM.js";

// dist/clients/ledger-bounds.js
var LEDGER_FIELD_MAX = 200;
var DEGRADATION_ENTRIES_PER_KIND = 20;
function normalizeForLedger(value) {
  if (value === null || value === void 0)
    return "unknown";
  if (typeof value === "object" && !Object.hasOwn(value, "toString")) {
    const proto = Object.getPrototypeOf(value);
    if (proto === Object.prototype || proto === null || Array.isArray(value)) {
      try {
        return JSON.stringify(value) ?? "unknown";
      } catch {
        return "[unserializable object]";
      }
    }
  }
  return String(value);
}
function truncateForLedger(value) {
  const text = normalizeForLedger(value);
  return text.length > LEDGER_FIELD_MAX ? `${text.slice(0, LEDGER_FIELD_MAX)}\u2026` : text;
}

// dist/clients/degradation-ledger.js
var ENTRIES_PER_KIND = DEGRADATION_ENTRIES_PER_KIND;
var MAX_DISTINCT_KINDS = 32;
var OVERFLOW_KIND = "other";
var groups = /* @__PURE__ */ new Map();
var onceKeys = /* @__PURE__ */ new Set();
var tallies = /* @__PURE__ */ new Map();
var ledgerGeneration = 0;
function getDegradationLedgerGeneration() {
  return ledgerGeneration;
}
function recordDegradation(record) {
  try {
    const kind = boundedKind(record.kind);
    const subject = subjectForLedger(record.subject);
    const reason = truncateForLedger(record.reason);
    let group = groups.get(kind);
    if (!group) {
      group = { count: 0, entries: [] };
      groups.set(kind, group);
    }
    const admitted = group.entries.length < ENTRIES_PER_KIND;
    group.count += 1;
    group.entries.push({ subject, reason });
    if (group.entries.length > ENTRIES_PER_KIND)
      group.entries.shift();
    return admitted;
  } catch (error) {
    debugLedgerFailure("record", error);
    return false;
  }
}
function recordDegradationOnce(record) {
  try {
    const kind = boundedKind(record.kind);
    const subject = subjectForLedger(record.subject);
    const key = `${kind}\0${subject}`;
    if (onceKeys.has(key))
      return false;
    onceKeys.add(key);
    if (recordDegradation({ kind, subject, reason: record.reason })) {
      logDurableDegradation(kind, subject, 1, record.metadata, record.code);
    }
    return true;
  } catch (error) {
    debugLedgerFailure("record-once", error);
    return false;
  }
}
function incrementDegradationCount(record) {
  try {
    const kind = boundedKind(record.kind);
    const subject = subjectForLedger(record.subject);
    const reason = truncateForLedger(record.reason);
    const key = `${kind}\0${subject}`;
    const count = (tallies.get(key) ?? 0) + 1;
    tallies.set(key, count);
    let group = groups.get(kind);
    if (!group) {
      group = { count: 0, entries: [] };
      groups.set(kind, group);
    }
    const existing = group.entries.findIndex((candidate) => candidate.subject === subject);
    const admitted = existing >= 0 || group.entries.length < ENTRIES_PER_KIND;
    group.count += 1;
    const entry = { subject, reason: `${reason} (count: ${count})` };
    if (existing >= 0)
      group.entries.splice(existing, 1);
    group.entries.push(entry);
    if (group.entries.length > ENTRIES_PER_KIND)
      group.entries.shift();
    if (admitted && isPowerOfTwo(count)) {
      logDurableDegradation(kind, subject, count, record.metadata, record.code);
    }
    return count === 1;
  } catch (error) {
    debugLedgerFailure("increment", error);
    return false;
  }
}
function logDurableDegradation(kind, subject, count, metadata, code) {
  const boundedMetadata = boundLedgerMetadata(metadata);
  logLatency({
    type: "phase",
    phase: "degradation_ledger",
    filePath: subject,
    durationMs: 0,
    metadata: {
      ...boundedMetadata,
      kind,
      subject,
      count,
      ledgerGeneration,
      // Reserved row field, written AFTER the bounded caller metadata so the
      // `MAX_METADATA_KEYS` cap cannot evict the stable code (#2418).
      ...code ? { code } : {}
    }
  });
}
var MAX_METADATA_KEYS = 8;
function boundLedgerMetadata(metadata) {
  if (!metadata)
    return {};
  const entries = Object.entries(metadata);
  const kept = entries.slice(0, MAX_METADATA_KEYS);
  const bounded = Object.fromEntries(kept.map(([key, value]) => [key, truncateForLedger(value)]));
  const dropped = entries.length - kept.length;
  if (dropped > 0)
    bounded.metadataDropped = dropped;
  return bounded;
}
function isPowerOfTwo(value) {
  return value > 0 && (value & value - 1) === 0;
}
function subjectForLedger(value) {
  const subject = truncateForLedger(value);
  return subject.trim() === "" ? "unknown" : subject;
}
function boundedKind(value) {
  const kind = truncateForLedger(value);
  if (groups.has(kind) || kind === OVERFLOW_KIND)
    return kind;
  return groups.size < MAX_DISTINCT_KINDS - 1 ? kind : OVERFLOW_KIND;
}
function getDegradationSummary() {
  const summary = [...groups.entries()].map(([kind, group]) => ({
    kind,
    count: group.count,
    droppedCount: group.count - group.entries.length,
    latestReasons: group.entries.map((entry) => ({ ...entry }))
  }));
  const sinkFailures = getSinkWriteFailures();
  if (sinkFailures.length > 0) {
    summary.push({
      kind: "log-sink-write-failure",
      count: sinkFailures.reduce((total, sink) => total + sink.droppedCount, 0),
      droppedCount: 0,
      latestReasons: sinkFailures.map((sink) => ({
        subject: truncateForLedger(sink.file),
        reason: truncateForLedger(`${sink.droppedCount} dropped write(s) after reopen-retry failed`)
      }))
    });
  }
  const sinkRotations = getSinkRotations();
  const rotated = sinkRotations.filter((sink) => sink.rotationCount > 0);
  if (rotated.length > 0) {
    summary.push({
      kind: "log-sink-rotated",
      count: rotated.reduce((total, sink) => total + sink.rotationCount, 0),
      droppedCount: 0,
      latestReasons: rotated.map((sink) => ({
        subject: truncateForLedger(sink.file),
        reason: truncateForLedger(`${sink.rotationCount} rotation(s) at the configured byte bound`)
      }))
    });
  }
  const rotateFailed = sinkRotations.filter((sink) => sink.failureCount > 0);
  if (rotateFailed.length > 0) {
    summary.push({
      kind: "log-sink-rotate-failed",
      count: rotateFailed.reduce((total, sink) => total + sink.failureCount, 0),
      droppedCount: 0,
      latestReasons: rotateFailed.map((sink) => ({
        subject: truncateForLedger(sink.file),
        reason: truncateForLedger(`${sink.failureCount} failed rotation attempt(s); this sink is growing past its byte bound`)
      }))
    });
  }
  const optionConflicts = getSinkOptionConflicts();
  if (optionConflicts.length > 0) {
    summary.push({
      kind: "log-sink-option-conflict",
      count: optionConflicts.length,
      droppedCount: 0,
      latestReasons: optionConflicts.map((sink) => ({
        subject: truncateForLedger(sink.file),
        reason: truncateForLedger("shared writer rotation options differed across module graphs; first writer retained ownership")
      }))
    });
  }
  const truncateRefusals = getSinkTruncateRefusals();
  if (truncateRefusals.length > 0) {
    summary.push({
      kind: "log-sink-truncate-refused",
      count: truncateRefusals.reduce((total, sink) => total + sink.refusedCount, 0),
      droppedCount: 0,
      latestReasons: truncateRefusals.map((sink) => ({
        subject: truncateForLedger(sink.file),
        reason: truncateForLedger(`${sink.refusedCount} truncate call(s) refused: a test process aimed them at the real ~/.pi-lens`)
      }))
    });
  }
  const singletonResets = getProcessSingletonResets();
  if (singletonResets.length > 0) {
    summary.push({
      kind: PROCESS_SINGLETON_RESET_KIND,
      count: singletonResets.length,
      droppedCount: 0,
      latestReasons: singletonResets.map((reset) => ({
        subject: truncateForLedger(reset.family),
        reason: truncateForLedger(reset.reason)
      }))
    });
  }
  const probeHomeRedirect = getProbeHomeRedirectEvent();
  if (probeHomeRedirect) {
    summary.push({
      kind: "global-dir-probe-redirect",
      count: 1,
      droppedCount: 0,
      latestReasons: [
        {
          subject: truncateForLedger(probeHomeRedirect.probeHome),
          reason: truncateForLedger("PI_LENS_HOME unset with cwd in an agent worktree/tmp probe context, or PILENS_PROBE=1 forced it; LOGS redirected away from the real home directory (tools, bin and instances.json are unaffected)")
        }
      ]
    });
  }
  return summary;
}
function isRenderableSummary(value) {
  if (!Array.isArray(value))
    return false;
  return value.every((group) => {
    if (group === null || typeof group !== "object")
      return false;
    const candidate = group;
    return typeof candidate.kind === "string" && typeof candidate.count === "number" && Array.isArray(candidate.latestReasons) && candidate.latestReasons.every((entry) => entry !== null && typeof entry === "object" && typeof entry.subject === "string" && typeof entry.reason === "string");
  });
}
var INFORMATIONAL_DEGRADATION_KINDS = /* @__PURE__ */ new Set([
  "log-sink-rotated",
  // #2504 review round 8 (S1): both fire on the ordinary re-edit cadence
  // (a carry-forward window closing, or a session boundary) and are
  // self-healing -- the next turn's analysis or deferral re-observes the
  // file -- so a `⚠` overstates them the same way a routine log rotation
  // would.
  "actionable-warnings-inband-superseded",
  "actionable-warnings-deferred-superseded",
  // #2523: a hook await abandoned because the session is tearing down. The
  // teardown signal firing is the design working, so it is a tally; the
  // BUDGET blow-out (`hook-await-exceeded`) is the line that has to stand
  // out, and a caller's own Escape records nothing at all.
  "hook-await-abandoned",
  // #2524: can fire on a query that ultimately settles `ok` (see the kind's
  // doc comment above) and is frequent/self-healing by design — a `⚠` would
  // cry wolf on the sampler's ordinary best-effort data loss.
  "resource-sampler-scanner-escalated",
  // #1129: an ephemeral data dir for a tmp checkout is decision B working.
  "data-dir-ephemeral",
  // #2874: a successful legacy-directory migration is an upgrade tally, not
  // a call to action. The hash-only subject avoids exposing the project path.
  "data_dir_migrated",
  // #3498: a queued registry removal that landed is the retry working; the
  // `instance-registry-deregister-queued` beside it is the line that stands out.
  "instance-registry-deregister-landed",
  // #3813: a part the cap cut was kept pending for the next turn, which is
  // the cap and its re-offer working together; the agent's message carries
  // the "N held" note, and the ledger needs only the tally.
  "turn-end-sections-held"
]);
function renderDegradationLines(summary = getDegradationSummary()) {
  if (!isRenderableSummary(summary))
    return [];
  if (summary.length === 0)
    return [];
  return [
    "Degradations:",
    ...summary.map((group) => {
      if (INFORMATIONAL_DEGRADATION_KINDS.has(group.kind)) {
        return `  ${group.kind}: ${group.count}`;
      }
      const latest = group.latestReasons.at(-1);
      return `  \u26A0 ${group.kind}: ${group.count}${latest ? ` \u2014 ${latest.subject}: ${latest.reason}` : ""}`;
    })
  ];
}
function debugLedgerFailure(operation, error) {
  try {
    logExtension({
      subsystem: "degradation-ledger",
      level: "debug",
      message: `${operation} failed: ${error instanceof Error ? error.message : String(error)}`
    });
  } catch {
  }
}
function resetDegradationLedger() {
  groups.clear();
  onceKeys.clear();
  tallies.clear();
  ledgerGeneration++;
  resetSinkWriteFailures();
  resetSinkRotations();
}

// dist/clients/string-utils.js
function compareOrdinal(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// dist/clients/lens-flag-registry.js
function globalOptInFlag(name, description, configKey) {
  return {
    name,
    description,
    configKey,
    negated: false,
    default: false,
    scope: "global"
  };
}
var LENS_FLAGS = [
  {
    name: "no-lens",
    description: "Start pi-lens disabled for this session. Re-enable with /lens-toggle. Also via lens.enabled=false in ~/.pi-lens/config.json.",
    configKey: "lens.enabled",
    negated: true,
    default: false,
    scope: "global"
  },
  {
    name: "no-lsp",
    description: "Disable unified LSP diagnostics and use language-specific fallbacks (for example pyright). Also via lsp.enabled=false in ~/.pi-lens/config.json.",
    configKey: "lsp.enabled",
    negated: true,
    default: false,
    scope: "global"
  },
  {
    name: "no-autoformat",
    description: "Disable automatic formatting entirely (deferred format runs at agent_end by default). Also via format.enabled=false in config.",
    configKey: "format.enabled",
    negated: true,
    default: false,
    scope: "project"
  },
  {
    name: "immediate-format",
    description: 'Run automatic formatting immediately after each write/edit instead of deferring to agent_end. Also via format.mode="immediate" in config.',
    configKey: "format.mode",
    negated: false,
    default: false,
    scope: "global",
    readGlobal: (config) => {
      const format = config.format;
      if (!format || typeof format !== "object")
        return void 0;
      const mode = format.mode;
      if (mode !== "immediate" && mode !== "deferred")
        return void 0;
      return mode === "immediate";
    }
  },
  {
    name: "no-autofix",
    description: "Disable auto-fixing of lint issues (Biome, Ruff, ESLint). Also via autofix.enabled=false in config.",
    configKey: "autofix.enabled",
    negated: true,
    default: false,
    scope: "project"
  },
  {
    name: "no-tests",
    description: "Disable test runner on write. Also via tests.enabled=false in ~/.pi-lens/config.json.",
    configKey: "tests.enabled",
    negated: true,
    default: false,
    scope: "global"
  },
  {
    name: "no-delta",
    description: "Disable delta mode (show all diagnostics, not just new ones). Also via delta.enabled=false in ~/.pi-lens/config.json.",
    configKey: "delta.enabled",
    negated: true,
    default: false,
    scope: "global"
  },
  {
    name: "lens-guard",
    description: "Experimental: block git commit/push when unresolved pi-lens blockers exist. Also via guard.enabled=true in ~/.pi-lens/config.json.",
    configKey: "guard.enabled",
    negated: false,
    default: false,
    scope: "global"
  },
  {
    name: "lens-checkout-guard",
    description: "Experimental: decline git commands that rewrite the working tree when another live pi-lens session shares this dirty checkout. Also via guard.sharedCheckout=true in ~/.pi-lens/config.json.",
    configKey: "guard.sharedCheckout",
    negated: false,
    default: false,
    scope: "global"
  },
  {
    name: "no-opengrep",
    description: "Disable the Opengrep security scanner (a default-on auxiliary LSP; auto-installs, uses repo rules if present else the login-free 'auto' ruleset). Also via opengrep.enabled=false in ~/.pi-lens/config.json.",
    configKey: "opengrep.enabled",
    negated: true,
    default: false,
    scope: "global"
  },
  {
    name: "no-read-guard",
    description: "Disable read-before-edit behavior monitor. Also via readGuard.enabled=false in ~/.pi-lens/config.json.",
    configKey: "readGuard.enabled",
    negated: true,
    default: false,
    scope: "global"
  },
  {
    name: "no-lens-context",
    description: "Disable automatic context injection (session-start guidance, turn-end & test findings) while keeping tools, LSP, read-guard, and formatting active. Toggle with /lens-context-toggle. Also via contextInjection.enabled=false in config or PI_LENS_NO_CONTEXT_INJECTION=1.",
    configKey: "contextInjection.enabled",
    negated: true,
    default: false,
    scope: "global",
    env: "PI_LENS_NO_CONTEXT_INJECTION"
  },
  {
    name: "lens-turn-summary",
    description: "Opt-in: persist a per-turn transcript entry summarizing diagnostics found, autofixes applied, and autoformats applied this turn (#484). Collapsed one-line, expandable in place. Default off. Also via turnSummary.enabled=true in ~/.pi-lens/config.json.",
    configKey: "turnSummary.enabled",
    negated: false,
    default: false,
    scope: "global"
  },
  {
    name: "lens-actionable-warnings",
    description: "Write turn-delta fixable warning reports and inject a short advisory. Also via actionableWarnings.enabled=true in ~/.pi-lens/config.json.",
    configKey: "actionableWarnings.enabled",
    negated: false,
    default: false,
    scope: "global"
  },
  {
    name: "lens-actionable-warning-actions",
    description: "Enrich actionable-warning reports with LSP code-action titles (requires an active language server). Also via actionableWarnings.includeLspCodeActions=true in ~/.pi-lens/config.json.",
    configKey: "actionableWarnings.includeLspCodeActions",
    negated: false,
    default: false,
    scope: "global"
  },
  {
    name: "lens-actionable-warning-autofix",
    description: "Experimental: apply conservative LSP quickfixes for actionable warnings at agent_end. Also via actionableWarnings.autoFix.enabled=true in config.",
    configKey: "actionableWarnings.autoFix.enabled",
    negated: false,
    default: false,
    scope: "project"
  },
  {
    name: "lens-actionable-warning-all",
    description: "Report every actionable warning, not just those introduced this turn. Also via actionableWarnings.deltaOnly=false in ~/.pi-lens/config.json.",
    configKey: "actionableWarnings.deltaOnly",
    negated: true,
    default: false,
    scope: "global"
  },
  globalOptInFlag("lens-compact-tool-line", "Opt-in (#1327): collapse a pi-lens tool's call+result rows into ONE theme-aware line (status glyph + name + summary) instead of two. Preserves expand-to-view-full-output. Default off. Also via ui.compactToolLine=true in ~/.pi-lens/config.json.", "ui.compactToolLine"),
  globalOptInFlag("lens-compact-lsp-status", "Opt-in (#3099): collapse the footer LSP status to one state glyph per group (LSP \u2713 green, LSP \u2717 red, dim LSP \u2717 when nothing is warm) instead of listing the active server names. Default off. Also via ui.compactLspStatus=true in ~/.pi-lens/config.json.", "ui.compactLspStatus"),
  globalOptInFlag("lens-hide-lsp-status", "Opt-in (#3099): publish no pi-lens-lsp footer status at all, so a host that renders extension statuses stops showing the key. Outranks lens-compact-lsp-status when both are set. Default off. Also via ui.hideLspStatus=true in ~/.pi-lens/config.json.", "ui.hideLspStatus"),
  globalOptInFlag("lens-compact-widget", "Opt-in (#3959): render the pi-lens widget as ONE summary line (languages + error/warning totals) instead of also stacking file rows, the suppressed count and blocker details below it. Default off. Also via ui.compactWidget=true in ~/.pi-lens/config.json.", "ui.compactWidget"),
  {
    name: "no-lazy-tools",
    description: "Keep all pi-lens tools active to avoid tool-list cache changes. Also via tools.lazy=false in ~/.pi-lens/config.json.",
    configKey: "tools.lazy",
    negated: true,
    default: false,
    scope: "global"
  },
  {
    name: "lens-turn-end-madge",
    description: "Run the per-turn-end madge circular-dependency check on import-changed files. Off by default: the pass only writes debug output, and user-facing madge diagnostics come from the session-start scan cache + lens_diagnostics. Also via turnEnd.madge.enabled=true in ~/.pi-lens/config.json.",
    configKey: "turnEnd.madge.enabled",
    negated: false,
    default: false,
    scope: "global"
  },
  ...[
    "knip",
    "jscpd",
    "madge",
    "gitleaks",
    "govulncheck",
    "deadCode",
    "complexity"
  ].map((analyzer) => ({
    name: `no-${analyzer.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`,
    description: `Disable the ${analyzer} session-start analyzer. Also via ${analyzer}.enabled=false in config.`,
    configKey: `${analyzer}.enabled`,
    negated: true,
    default: false,
    scope: "project"
  }))
];
var byName = new Map(LENS_FLAGS.map((spec) => [spec.name, spec]));
function getLensFlagSpec(name) {
  return byName.get(name);
}
var PROJECT_SCOPED_LENS_FLAGS = LENS_FLAGS.filter((spec) => spec.scope === "project");
var GLOBAL_NON_FLAG_CONFIG_SECTIONS = [
  "ignore",
  "dispatch",
  "widget",
  "startup",
  "$schema"
];
var GLOBAL_ONLY_NON_FLAG_KEYS = [
  "actionableWarnings.autoFix.maxFixes"
];
var PROJECT_NON_FLAG_CONFIG_SECTIONS = [
  "ignore",
  "rules",
  "maxProjectFiles",
  "reviewGraph",
  "trivy",
  "helm",
  "startup",
  // `tools` is MIXED-SCOPE, and belongs here for the project-scoped half
  // (#3112). `tools.<name>.enabled` is not a registry flag at all: it is
  // hand-parsed by `readToolConfig` against `TOOL_REGISTRY` in BOTH loaders,
  // and `resolveLensToolEnabled` reads the project document's value ahead of
  // the global one — which is what `docs/settings.md` and
  // `docs/globalconfig.md` document. Deriving the project-accepted sections
  // from the flag registry alone therefore put the whole section in
  // `globalScopeOnlyKeys` (its only registry flag, `tools.lazy`, IS global)
  // and told every user of a documented per-tool override that it was being
  // ignored. The global-only half is not lost: `tools.lazy` is still reported
  // at project scope by the project loader's mixed-scope sub-key scan, which
  // derives WHICH sub-keys those are from this same registry.
  "tools"
];
var LSP_PROJECT_HONORED_KEYS = DEPRECATED_CONFIG_SURFACES.filter((row) => row.kind === "key").map((row) => row.surface);
var PROJECT_FOREIGN_CONFIG_NAMESPACES = [
  "lsp",
  // DERIVED, not restated: the four legacy root keys are exactly the
  // `kind: "key"` rows of the deprecation registry, and a hand-copied second
  // list of them would be a place for the accepted set and the removal
  // schedule to drift apart. `config-diagnostic-codes.ts` is a dependency-free
  // data leaf, so importing it keeps this module's own no-cycle property.
  ...LSP_PROJECT_HONORED_KEYS,
  "$schema"
];
var PROJECT_FOREIGN_NAMESPACE_HONORED_KEYS = /* @__PURE__ */ new Map([["lsp", LSP_PROJECT_HONORED_KEYS]]);
function flagConfigSectionKeys(flags) {
  return [...new Set(flags.map((spec) => spec.configKey.split(".")[0]))];
}
function asConfigObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : void 0;
}
function resolveFlagConfigPath(raw, configKey, warnInvalid) {
  const segments = configKey.split(".");
  let source = raw;
  for (let i = 0; i < segments.length - 1; i++) {
    const object = asConfigObject(source);
    if (!object)
      return void 0;
    const segment = segments[i];
    if (!(segment in object))
      return void 0;
    const next = asConfigObject(object[segment]);
    if (!next) {
      if (warnInvalid) {
        warnInvalid(`${segments.slice(0, i + 1).join(".")} must be an object`);
      }
      return void 0;
    }
    source = next;
  }
  const finalSource = asConfigObject(source);
  if (!finalSource)
    return void 0;
  return { source: finalSource, segments };
}
function hasFlagConfigPath(raw, configKey) {
  const resolved = resolveFlagConfigPath(raw, configKey);
  if (!resolved)
    return false;
  const leaf = resolved.segments.at(-1);
  return leaf !== void 0 && leaf in resolved.source;
}
function readFlagConfigValue(config, configKey) {
  const path = resolveFlagConfigPath(config, configKey);
  if (!path)
    return void 0;
  const leaf = path.segments[path.segments.length - 1];
  const value = path.source[leaf];
  return typeof value === "boolean" ? value : void 0;
}
function flagValueFromConfig(spec, configValue) {
  return spec.negated ? !configValue : configValue;
}
function assignFlagConfigSection(raw, out, configKey, warnInvalid) {
  const path = resolveFlagConfigPath(raw, configKey, warnInvalid);
  if (!path)
    return;
  let target = out;
  for (const segment of path.segments.slice(0, -1)) {
    target[segment] ??= {};
    target = target[segment];
  }
  const leaf = path.segments[path.segments.length - 1];
  if (leaf in path.source && typeof path.source[leaf] !== "boolean") {
    warnInvalid(`${configKey} must be a boolean`);
    target[leaf] = void 0;
    return;
  }
  target[leaf] = path.source[leaf];
}

// dist/clients/tool-config.js
var TOOL_REGISTRY = [
  {
    name: "ast_grep_search",
    piName: "ast_grep_search",
    mcpName: "pilens_ast_grep_search",
    situational: true,
    summary: "AST-aware structural code search across ~40 languages (ast-grep patterns).",
    disableable: true
  },
  {
    name: "ast_grep_replace",
    piName: "ast_grep_replace",
    mcpName: "pilens_ast_grep_replace",
    situational: true,
    summary: "AST-aware structural code rewrite/refactor (ast-grep patterns).",
    disableable: true
  },
  {
    name: "ast_grep_outline",
    piName: "ast_grep_outline",
    mcpName: void 0,
    situational: true,
    summary: "Syntax-only file/dir structure (symbols/imports/exports/members) via ast-grep outline \u2014 no index/LSP.",
    disableable: true
  },
  {
    name: "lsp_navigation",
    piName: "lsp_navigation",
    mcpName: "pilens_lsp_navigation",
    situational: true,
    summary: "IDE-style LSP navigation: definition, references, implementation, rename, call hierarchy.",
    disableable: true
  },
  {
    name: "lens_diagnostics",
    piName: "lens_diagnostics",
    mcpName: "pilens_diagnostics",
    disableable: true
  },
  {
    name: "lens_diagnostic_mark",
    piName: "lens_diagnostic_mark",
    mcpName: void 0,
    situational: true,
    summary: "Record a disposition for a diagnostic: false-positive / suppress (inline ignore comment) / defer (this session) / flagged (to fix).",
    disableable: true
  },
  {
    name: "symbol_search",
    piName: "symbol_search",
    mcpName: "pilens_symbol_search",
    disableable: true
  },
  {
    name: "module_report",
    piName: "module_report",
    mcpName: "pilens_module_report",
    disableable: true
  },
  {
    name: "project_report",
    piName: "project_report",
    mcpName: "pilens_project_report",
    disableable: true
  },
  {
    name: "read_symbol",
    piName: "read_symbol",
    mcpName: "pilens_read_symbol",
    disableable: true
  },
  {
    name: "read_enclosing",
    piName: "read_enclosing",
    mcpName: "pilens_read_enclosing",
    disableable: true
  },
  {
    name: "effective_config",
    piName: "effective_config",
    mcpName: "pilens_effective_config",
    disableable: true
  },
  {
    name: "pi_lens_activate_tools",
    piName: "pi_lens_activate_tools",
    mcpName: void 0,
    disableable: false
  },
  {
    name: "analyze",
    piName: void 0,
    mcpName: "pilens_analyze",
    disableable: true
  },
  {
    name: "health",
    piName: void 0,
    mcpName: "pilens_health",
    disableable: true
  },
  {
    name: "latency",
    piName: void 0,
    mcpName: "pilens_latency",
    disableable: true
  },
  {
    name: "project_scan",
    piName: void 0,
    mcpName: "pilens_project_scan",
    disableable: true
  },
  {
    name: "rebuild",
    piName: void 0,
    mcpName: "pilens_rebuild",
    disableable: true
  },
  {
    name: "session_start",
    piName: void 0,
    mcpName: "pilens_session_start",
    disableable: false
  },
  {
    name: "turn_end",
    piName: void 0,
    mcpName: "pilens_turn_end",
    disableable: false
  },
  {
    name: "session_end",
    piName: void 0,
    mcpName: "pilens_session_end",
    disableable: false
  }
];
var LENS_TOOL_NAMES = TOOL_REGISTRY.map((tool) => tool.name);
var PI_LENS_TOOL_NAMES = TOOL_REGISTRY.flatMap((tool) => tool.piName === void 0 ? [] : [tool.piName]);
function resolveLensToolName(name, host = "pi") {
  const entry = TOOL_REGISTRY.find((tool) => tool.name === name || tool.piName === name || tool.mcpName === name);
  if (!entry)
    return name;
  if (host === "mcp")
    return entry.mcpName;
  return entry.piName;
}
function translateGuidanceToolNames(content, host) {
  if (host === "pi")
    return content;
  let text = content;
  const byLength = [...TOOL_REGISTRY].sort((a, b) => (b.piName?.length ?? 0) - (a.piName?.length ?? 0));
  for (const entry of byLength) {
    if (typeof entry.piName !== "string" || typeof entry.mcpName !== "string") {
      continue;
    }
    text = text.replace(new RegExp(`\\b${escapeRegExp(entry.piName)}\\b`, "g"), entry.mcpName);
  }
  return text.replace("activate via pi_lens_activate_tools", "call directly");
}
function toolRegistryEntryForMcp(name) {
  return TOOL_REGISTRY.find((tool) => tool.mcpName === name);
}
function resolveLensToolEnabled(name, globalConfig, projectConfig, cliNoTools) {
  const entry = TOOL_REGISTRY.find((tool) => tool.name === name);
  if (entry?.disableable === false)
    return true;
  const cliNames = Array.isArray(cliNoTools) ? cliNoTools : typeof cliNoTools === "string" ? cliNoTools.split(",") : [];
  if (cliNames.some((entry2) => entry2.trim() === name))
    return false;
  const project = readFlagConfigValue(projectConfig, `tools.${name}.enabled`);
  if (project !== void 0)
    return project;
  const global = readFlagConfigValue(globalConfig, `tools.${name}.enabled`);
  return global ?? true;
}
function readToolConfig(raw, warnInvalid) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    return void 0;
  const section = raw.tools;
  if (!section || typeof section !== "object" || Array.isArray(section))
    return void 0;
  const result = {};
  for (const [name, value] of Object.entries(section)) {
    if (name === "lazy")
      continue;
    const entry = TOOL_REGISTRY.find((tool) => tool.name === name);
    if (!entry) {
      warnInvalid(`unknown key "tools.${name}.enabled" is not a recognized pi-lens tool`, "PILENS_CFG_0009");
      continue;
    }
    if (!entry.disableable) {
      warnInvalid(`key "tools.${name}.enabled" cannot be disabled because it is required for the ${entry.mcpName ? "MCP session" : "pi tool activation"} contract`, "PILENS_CFG_0009");
      continue;
    }
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      warnInvalid(`tools.${name} must be an object with enabled`);
      continue;
    }
    const enabled = value.enabled;
    if (enabled !== void 0 && typeof enabled !== "boolean") {
      warnInvalid(`tools.${name}.enabled must be a boolean`);
      continue;
    }
    result[name] = enabled === void 0 ? {} : { enabled };
  }
  return Object.keys(result).length > 0 ? result : void 0;
}

export {
  LEDGER_FIELD_MAX,
  DEGRADATION_ENTRIES_PER_KIND,
  truncateForLedger,
  getDegradationLedgerGeneration,
  recordDegradation,
  recordDegradationOnce,
  incrementDegradationCount,
  getDegradationSummary,
  renderDegradationLines,
  resetDegradationLedger,
  compareOrdinal,
  escapeRegExp,
  LENS_FLAGS,
  getLensFlagSpec,
  PROJECT_SCOPED_LENS_FLAGS,
  GLOBAL_NON_FLAG_CONFIG_SECTIONS,
  GLOBAL_ONLY_NON_FLAG_KEYS,
  PROJECT_NON_FLAG_CONFIG_SECTIONS,
  PROJECT_FOREIGN_CONFIG_NAMESPACES,
  PROJECT_FOREIGN_NAMESPACE_HONORED_KEYS,
  flagConfigSectionKeys,
  hasFlagConfigPath,
  readFlagConfigValue,
  flagValueFromConfig,
  assignFlagConfigSection,
  TOOL_REGISTRY,
  LENS_TOOL_NAMES,
  resolveLensToolName,
  translateGuidanceToolNames,
  toolRegistryEntryForMcp,
  resolveLensToolEnabled,
  readToolConfig
};
