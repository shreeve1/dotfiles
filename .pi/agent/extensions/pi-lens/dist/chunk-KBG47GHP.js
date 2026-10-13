import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  freshnessFromMtime,
  resolveRunnerPath
} from "./chunk-L3BLXZG7.js";
import {
  translateGuidanceToolNames
} from "./chunk-JAU72XNY.js";
import {
  logLatency
} from "./chunk-QQNQ7SJW.js";
import {
  normalizeMapKey,
  toProjectRelativePath
} from "./chunk-N2H3ZPZY.js";

// dist/clients/advisory-provenance.js
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
var MAX_ADVISORY_AFFECTED_FILES = 256;
function advisoryPathKey(filePath, cwd) {
  return normalizeMapKey(path.resolve(cwd, filePath));
}
function advisoryFileHash(filePath) {
  try {
    return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
  } catch (error) {
    const code = error.code ?? "unknown";
    return code === "ENOENT" ? "missing" : `unreadable:${code}`;
  }
}
function snapshotOne(filePath, cwd, role) {
  const resolved = path.resolve(cwd, filePath);
  try {
    const stat = fs.statSync(resolved);
    return {
      path: resolved,
      role,
      mtimeMs: stat.mtimeMs,
      size: stat.size,
      sha256: advisoryFileHash(resolved)
    };
  } catch (error) {
    const code = error.code ?? "unknown";
    return {
      path: resolved,
      role,
      mtimeMs: -1,
      size: -1,
      sha256: code === "ENOENT" ? "missing" : `unreadable:${code}`
    };
  }
}
function snapshotAdvisoryProvenance(args) {
  const seen = /* @__PURE__ */ new Set();
  const files = [];
  for (const file of args.files) {
    const key = advisoryPathKey(file.path, args.cwd);
    if (seen.has(key))
      continue;
    seen.add(key);
    files.push(snapshotOne(file.path, args.cwd, file.role));
  }
  return {
    revision: {
      sessionId: args.runtime.telemetrySessionId,
      projectSeq: args.runtime.projectSeq,
      turnIndex: args.runtime.turnIndex,
      generation: args.generation,
      capturedAt: args.capturedAt ?? Date.now()
    },
    files,
    ...args.truncated ? { truncated: true } : {}
  };
}
function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}
function isCapturedHash(value) {
  return typeof value === "string" && (/^[a-f0-9]{64}$/.test(value) || value === "missing" || value.startsWith("unreadable:"));
}
function isWellFormed(value) {
  if (!value || typeof value !== "object")
    return false;
  const record = value;
  const revision = record.revision;
  return !!revision && typeof revision.sessionId === "string" && isFiniteNumber(revision.projectSeq) && isFiniteNumber(revision.turnIndex) && isFiniteNumber(revision.generation) && isFiniteNumber(revision.capturedAt) && Array.isArray(record.files) && record.files.length > 0 && record.files.every((file) => !!file && typeof file.path === "string" && (file.role === "source" || file.role === "test" || file.role === "affected") && isFiniteNumber(file.mtimeMs) && isFiniteNumber(file.size) && isCapturedHash(file.sha256));
}
function validateAdvisoryProvenance(record, cwd, runtime) {
  if (!isWellFormed(record.provenance)) {
    return {
      status: "unknown",
      reasons: ["malformed-or-legacy-provenance"],
      allFilesDeleted: false,
      changedPathCount: 0
    };
  }
  const provenance = record.provenance;
  const reasons = [];
  let unknown = provenance.truncated === true;
  if (unknown)
    reasons.push("truncated-provenance");
  if (runtime) {
    if (provenance.revision.sessionId !== runtime.telemetrySessionId)
      reasons.push("session-mismatch");
  }
  let deletedFiles = 0;
  const changedPaths = /* @__PURE__ */ new Set();
  for (const captured of provenance.files) {
    const resolved = path.resolve(cwd, captured.path);
    const reasonsBefore = reasons.length;
    let stat;
    try {
      stat = fs.statSync(resolved);
    } catch (error) {
      const code = error.code ?? "unknown";
      if (code === "ENOENT") {
        if (captured.sha256 !== "missing") {
          deletedFiles += 1;
          reasons.push(`missing:${advisoryPathKey(resolved, cwd)}`);
          changedPaths.add(advisoryPathKey(resolved, cwd));
        }
      } else {
        unknown = true;
        reasons.push(`unreadable:${advisoryPathKey(resolved, cwd)}:${code}`);
        changedPaths.add(advisoryPathKey(resolved, cwd));
      }
      continue;
    }
    if (captured.sha256.startsWith("unreadable:")) {
      unknown = true;
      reasons.push(`capture-unreadable:${advisoryPathKey(resolved, cwd)}`);
      changedPaths.add(advisoryPathKey(resolved, cwd));
      continue;
    }
    if (captured.sha256 === "missing") {
      reasons.push(`created:${advisoryPathKey(resolved, cwd)}`);
      changedPaths.add(advisoryPathKey(resolved, cwd));
      continue;
    }
    if (stat.mtimeMs !== captured.mtimeMs || stat.size !== captured.size) {
      reasons.push(`metadata-changed:${advisoryPathKey(resolved, cwd)}`);
    }
    const currentHash = advisoryFileHash(resolved);
    if (currentHash.startsWith("unreadable:")) {
      unknown = true;
      reasons.push(`${currentHash}:${advisoryPathKey(resolved, cwd)}`);
    } else if (currentHash !== captured.sha256) {
      reasons.push(`content-changed:${advisoryPathKey(resolved, cwd)}`);
    }
    if (reasons.length > reasonsBefore)
      changedPaths.add(advisoryPathKey(resolved, cwd));
  }
  const allFilesDeleted = deletedFiles === provenance.files.length;
  if (unknown)
    return {
      status: "unknown",
      reasons,
      allFilesDeleted,
      changedPathCount: changedPaths.size
    };
  return reasons.length > 0 ? {
    status: "superseded",
    reasons,
    allFilesDeleted,
    changedPathCount: changedPaths.size
  } : { status: "current", reasons: [], allFilesDeleted, changedPathCount: 0 };
}
var MAX_FINDING_PATH_STATS = MAX_ADVISORY_AFFECTED_FILES;
var MAX_LOGGED_DEAD_PATHS = 3;
function statFindingPath(resolvedPath) {
  try {
    return { state: "present", mtimeMs: fs.statSync(resolvedPath).mtimeMs };
  } catch (error) {
    const code = error.code ?? "unknown";
    return code === "ENOENT" || code === "ENOTDIR" ? { state: "missing" } : { state: "unknown" };
  }
}
function freshnessFromFacts(facts, scannedAtMs) {
  if (facts.state === "missing")
    return "missing";
  if (facts.state === "unknown")
    return "unknown";
  if (scannedAtMs === void 0)
    return "live";
  return freshnessFromMtime({
    mtimeMs: facts.mtimeMs,
    referenceMs: scannedAtMs
  }).verdict === "stale" ? "stale" : "live";
}
function parseScannedAtMs(scannedAt) {
  if (scannedAt === void 0 || scannedAt === null || scannedAt === "") {
    return void 0;
  }
  const ms = typeof scannedAt === "number" ? scannedAt : Date.parse(scannedAt);
  return Number.isFinite(ms) ? ms : void 0;
}
function createPathFactsMemo(args) {
  return {
    facts: /* @__PURE__ */ new Map(),
    probe: args.probePath ?? statFindingPath,
    limit: args.maxUniquePaths ?? MAX_FINDING_PATH_STATS,
    starved: /* @__PURE__ */ new Map()
  };
}
function partitionOneSource(args, memo) {
  const scannedAtMs = parseScannedAtMs(args.scannedAt);
  const onMissing = args.onMissing ?? "drop";
  const rawVerdicts = /* @__PURE__ */ new Map();
  const live = [];
  const stale = [];
  const dropped = [];
  const deadPaths = [];
  const stalePaths = [];
  const seenPaths = /* @__PURE__ */ new Set();
  let probed = 0;
  for (const finding of args.findings) {
    const cited = args.citedPath(finding);
    if (!cited) {
      live.push(finding);
      continue;
    }
    let verdict = rawVerdicts.get(cited);
    if (verdict === void 0) {
      const resolved = resolveRunnerPath(args.cwd, cited);
      let facts = memo.facts.get(resolved);
      if (facts === void 0) {
        if (probed >= memo.limit) {
          memo.starved.set(args.store, (memo.starved.get(args.store) ?? 0) + 1);
          facts = { state: "unknown" };
        } else {
          probed += 1;
          facts = memo.probe(resolved);
          memo.facts.set(resolved, facts);
        }
      }
      verdict = freshnessFromFacts(facts, scannedAtMs);
      if (verdict === "missing" && onMissing === "demote")
        verdict = "stale";
      if (!seenPaths.has(resolved)) {
        seenPaths.add(resolved);
        if (verdict === "missing")
          deadPaths.push(resolved);
        else if (verdict === "stale")
          stalePaths.push(resolved);
      }
      rawVerdicts.set(cited, verdict);
    }
    if (verdict === "missing")
      dropped.push(finding);
    else if (verdict === "stale")
      stale.push(finding);
    else
      live.push(finding);
  }
  return {
    live,
    stale,
    dropped,
    deadPaths,
    stalePaths,
    statCount: memo.facts.size,
    truncated: (memo.starved.get(args.store) ?? 0) > 0
  };
}
function gateFindingsByPathFreshness(args) {
  const memo = createPathFactsMemo(args);
  const names = Object.keys(args.sources).sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
  const gates = {};
  const dropped = {};
  const demoted = {};
  const merged = {
    live: [],
    stale: [],
    dropped: [],
    deadPaths: [],
    stalePaths: [],
    statCount: 0,
    truncated: false
  };
  const scannedAtByStore = {};
  for (const name of names) {
    const source = args.sources[name];
    const partition = partitionOneSource({ ...source, store: name, cwd: args.cwd }, memo);
    gates[name] = { live: partition.live, stale: partition.stale };
    if (partition.dropped.length > 0)
      dropped[name] = partition.dropped.length;
    if (partition.stale.length > 0)
      demoted[name] = partition.stale.length;
    if (source.scannedAt !== void 0) {
      scannedAtByStore[name] = String(source.scannedAt);
    }
    merged.live.push(...partition.live);
    merged.stale.push(...partition.stale);
    merged.dropped.push(...partition.dropped);
    for (const deadPath of partition.deadPaths) {
      if (!merged.deadPaths.includes(deadPath))
        merged.deadPaths.push(deadPath);
    }
    for (const stalePath of partition.stalePaths) {
      if (!merged.stalePaths.includes(stalePath)) {
        merged.stalePaths.push(stalePath);
      }
    }
  }
  merged.statCount = memo.facts.size;
  merged.truncated = memo.starved.size > 0;
  if (args.quiet !== true) {
    emitDeadPathDropRecord(args.cwd, merged, dropped);
    emitStaleLineDemoteRecord(args.cwd, scannedAtByStore, merged, demoted);
    emitStatBudgetRecord(args.cwd, memo);
  }
  return gates;
}
function emitDeadPathDropRecord(cwd, partition, byStore) {
  if (partition.dropped.length === 0)
    return;
  const stores = Object.keys(byStore);
  logLatency({
    type: "phase",
    phase: "finding_dead_path_drop",
    filePath: cwd,
    durationMs: 0,
    metadata: {
      store: stores.join("+"),
      byStore,
      droppedDeadPaths: partition.dropped.length,
      deadPathCount: partition.deadPaths.length,
      deliveredCount: partition.live.length,
      statCount: partition.statCount,
      samplePaths: partition.deadPaths.slice(0, MAX_LOGGED_DEAD_PATHS).map((deadPath) => toProjectRelativePath(deadPath, cwd)),
      ...partition.truncated ? { truncated: true } : {}
    }
  });
}
function emitStaleLineDemoteRecord(cwd, scannedAtByStore, partition, byStore) {
  if (partition.stale.length === 0)
    return;
  const stores = Object.keys(byStore);
  const single = stores.length === 1 ? scannedAtByStore[stores[0]] : void 0;
  logLatency({
    type: "phase",
    phase: "finding_stale_line_demote",
    filePath: cwd,
    durationMs: 0,
    metadata: {
      store: stores.join("+"),
      byStore,
      demotedStalePaths: partition.stale.length,
      stalePathCount: partition.stalePaths.length,
      deliveredCount: partition.live.length,
      statCount: partition.statCount,
      samplePaths: partition.stalePaths.slice(0, MAX_LOGGED_DEAD_PATHS).map((stalePath) => toProjectRelativePath(stalePath, cwd)),
      // One store: the flat `scannedAt` field, unchanged. Several: the
      // per-store map, because the whole point of the fold is that they
      // differ — one flattened timestamp here would be the same authority
      // collapse the gate refuses to make on the findings themselves.
      ...single === void 0 ? {} : { scannedAt: single },
      ...stores.length > 1 ? {
        scannedAtByStore: Object.fromEntries(stores.map((name) => [name, scannedAtByStore[name] ?? ""]))
      } : {},
      ...partition.truncated ? { truncated: true } : {}
    }
  });
}
function emitStatBudgetRecord(cwd, memo) {
  if (memo.starved.size === 0)
    return;
  const stores = [...memo.starved.keys()].sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
  logLatency({
    type: "phase",
    phase: "finding_path_stat_budget_exhausted",
    filePath: cwd,
    durationMs: 0,
    metadata: {
      store: stores.join("+"),
      byStore: Object.fromEntries(stores.map((name) => [name, memo.starved.get(name) ?? 0])),
      maxUniquePaths: memo.limit,
      statCount: memo.facts.size
    }
  });
}
function provenanceStamp(provenance) {
  if (!isWellFormed(provenance))
    return "session unknown / turn unknown / generation unknown";
  return `session ${provenance.revision.sessionId} / turn ${provenance.revision.turnIndex} / generation ${provenance.revision.generation}`;
}

// dist/clients/runtime-context.js
var AUTOMATION_FRAMING = "[pi-lens automated check \u2014 not a user request] ";
var MAX_LOGGED_REASONS = 8;
function boundedReasons(reasons) {
  if (reasons.length <= MAX_LOGGED_REASONS)
    return reasons;
  return [
    ...reasons.slice(0, MAX_LOGGED_REASONS),
    `+${reasons.length - MAX_LOGGED_REASONS} more`
  ];
}
function logProvenanceDecision(validation, provenance, advisoryKind, cwd) {
  logLatency({
    type: "phase",
    phase: "advisory_provenance_decision",
    filePath: cwd,
    durationMs: 0,
    metadata: {
      decision: validation.status === "current" ? "current" : "historical",
      reasons: boundedReasons(validation.reasons),
      changedPathCount: validation.changedPathCount,
      provenanceStamp: provenanceStamp(provenance),
      advisoryKind
    }
  });
}
function historicalPrefix(provenance) {
  return `Historical finding; workspace changed since capture; re-run to confirm. (${provenanceStamp(provenance)})`;
}
function historicalTestContent(content, provenance) {
  return content.startsWith("[from a prior turn") ? content : `${historicalPrefix(provenance)}

${content}`;
}
function turnEndMessage(content, current, provenance) {
  return {
    role: "user",
    content: current ? `${AUTOMATION_FRAMING}Address \u{1F534} blockers before continuing; \u2139\uFE0F advisories are informational only.

${content}` : `${AUTOMATION_FRAMING}${historicalPrefix(provenance)}

${content}`
  };
}
function peekTurnEndFindings(cacheManager, cwd, runtime, logDelivery = false) {
  const findings = cacheManager.readCache("turn-end-findings", cwd);
  if (!findings?.data?.content || findings.data.consumed === true)
    return;
  const validation = validateAdvisoryProvenance(findings.data, cwd, runtime);
  if (logDelivery)
    logProvenanceDecision(validation, findings.data.provenance, "turn-end", cwd);
  if (validation.allFilesDeleted)
    return;
  return {
    messages: [
      turnEndMessage(findings.data.content, validation.status === "current", findings.data.provenance)
    ]
  };
}
function consumeTurnEndFindings(cacheManager, cwd, runtime) {
  const findings = cacheManager.readCache("turn-end-findings", cwd);
  if (!findings?.data?.content || findings.data.consumed === true)
    return;
  const validation = validateAdvisoryProvenance(findings.data, cwd, runtime);
  logProvenanceDecision(validation, findings.data.provenance, "turn-end", cwd);
  if (findings.data.hasBlockers === true && typeof findings.data.sessionId === "string") {
    cacheManager.writeCache("turn-end-findings", { ...findings.data, consumed: true }, cwd);
  } else {
    cacheManager.clearCache("turn-end-findings", cwd);
  }
  if (validation.allFilesDeleted)
    return;
  return {
    messages: [
      turnEndMessage(findings.data.content, validation.status === "current", findings.data.provenance)
    ]
  };
}
function peekTestFindings(cacheManager, cwd, runtime, logDelivery = false) {
  const findings = cacheManager.readCache("test-runner-findings", cwd);
  if (!findings?.data?.content)
    return;
  const validation = validateAdvisoryProvenance(findings.data, cwd, runtime);
  if (logDelivery)
    logProvenanceDecision(validation, findings.data.provenance, "test-findings", cwd);
  if (validation.allFilesDeleted)
    return;
  const current = validation.status === "current";
  return {
    messages: [
      {
        role: "user",
        content: current ? `${AUTOMATION_FRAMING}${testFindingsCurrentPrefix(findings.data.runnerErrorOnly)}

${findings.data.content}` : `${AUTOMATION_FRAMING}${historicalTestContent(findings.data.content, findings.data.provenance)}`
      }
    ]
  };
}
function testFindingsCurrentPrefix(runnerErrorOnly) {
  return runnerErrorOnly ? "Test runner could not complete last turn (advisory \u2014 not a failure introduced this turn):" : "Test failures detected last turn \u2014 fix before continuing:";
}
function retireTestFindings(cacheManager, cwd) {
  const prior = cacheManager.readCache("test-runner-findings", cwd)?.data;
  cacheManager.writeCache("test-runner-findings", {
    content: "",
    testRunGeneration: prior?.testRunGeneration,
    deferredTargets: prior?.deferredTargets,
    retiredTargets: prior?.retiredTargets
  }, cwd);
}
function consumeTestFindings(cacheManager, cwd, runtime) {
  const record = cacheManager.readCache("test-runner-findings", cwd);
  if (!record?.data?.content)
    return;
  const findings = peekTestFindings(cacheManager, cwd, runtime, true);
  if (!findings)
    return;
  retireTestFindings(cacheManager, cwd);
  return findings;
}
function acknowledgeTurnEndFindings(cacheManager, cwd) {
  const findings = cacheManager.readCache("turn-end-findings", cwd);
  if (!findings?.data?.content || findings.data.consumed === true)
    return;
  if (findings.data.hasBlockers === true && typeof findings.data.sessionId === "string") {
    cacheManager.writeCache("turn-end-findings", { ...findings.data, consumed: true }, cwd);
  } else {
    cacheManager.clearCache("turn-end-findings", cwd);
  }
}
function acknowledgeTestFindings(cacheManager, cwd) {
  const findings = cacheManager.readCache("test-runner-findings", cwd);
  if (!findings?.data?.content)
    return;
  retireTestFindings(cacheManager, cwd);
}
function consumeSessionStartGuidance(cacheManager, cwd, host = "pi") {
  const guidance = cacheManager.readCache("session-start-guidance", cwd);
  if (!guidance?.data?.content)
    return;
  cacheManager.writeCache("session-start-guidance", { content: "" }, cwd);
  return {
    messages: [
      {
        role: "user",
        // #2535: the stored guidance names pi tools; MCP agents receive
        // the registry-translated rendering. The stored record keeps
        // its shape — resolution happens here, at delivery.
        content: `[pi-lens automated context \u2014 not a user request]

${translateGuidanceToolNames(guidance.data.content, host)}`
      }
    ]
  };
}

export {
  MAX_ADVISORY_AFFECTED_FILES,
  advisoryPathKey,
  snapshotAdvisoryProvenance,
  validateAdvisoryProvenance,
  parseScannedAtMs,
  gateFindingsByPathFreshness,
  AUTOMATION_FRAMING,
  peekTurnEndFindings,
  consumeTurnEndFindings,
  peekTestFindings,
  consumeTestFindings,
  acknowledgeTurnEndFindings,
  acknowledgeTestFindings,
  consumeSessionStartGuidance
};
