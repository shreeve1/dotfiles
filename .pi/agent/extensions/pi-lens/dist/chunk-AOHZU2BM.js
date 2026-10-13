import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  isUnderDir,
  normalizeFilePath,
  pathsEqual
} from "./chunk-N2H3ZPZY.js";

// dist/clients/env-utils.js
function isTestMode() {
  if (process.env.PI_LENS_TEST_MODE === "1")
    return true;
  if (process.env.VITEST && process.env.PI_LENS_TEST_MODE !== "0")
    return true;
  return false;
}
function toPositiveFinite(value) {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) && num > 0 ? num : 0;
}
function lazyEnvNumber(envName, fallback) {
  let memo;
  return {
    get() {
      if (memo !== void 0)
        return memo;
      const envValue = toPositiveFinite(process.env[envName]);
      memo = envValue > 0 ? envValue : fallback;
      return memo;
    },
    _resetForTests() {
      memo = void 0;
    }
  };
}

// dist/clients/redact/secrets.js
var PEM_BEGIN = "-----BEGIN ";
var PEM_DELIMITER = "-----";
function codePointOf(char) {
  return char?.codePointAt(0) ?? -1;
}
function isAsciiAlphaNumeric(char) {
  const code = codePointOf(char);
  return code >= 48 && code <= 57 || code >= 65 && code <= 90 || code >= 97 && code <= 122;
}
function isUpperAlphaNumeric(char) {
  const code = codePointOf(char);
  return code >= 48 && code <= 57 || code >= 65 && code <= 90;
}
function isIdentifierChar(char) {
  return char === "_" || isAsciiAlphaNumeric(char);
}
function isTokenChar(char) {
  return char === "-" || isIdentifierChar(char);
}
var PREFIXED_SECRETS = [
  {
    prefix: "ghp_",
    minSuffixLength: 20,
    predicate: isAsciiAlphaNumeric,
    replacement: "[REDACTED:github-token]"
  },
  {
    prefix: "gho_",
    minSuffixLength: 20,
    predicate: isAsciiAlphaNumeric,
    replacement: "[REDACTED:github-token]"
  },
  {
    prefix: "ghu_",
    minSuffixLength: 20,
    predicate: isAsciiAlphaNumeric,
    replacement: "[REDACTED:github-token]"
  },
  {
    prefix: "ghs_",
    minSuffixLength: 20,
    predicate: isAsciiAlphaNumeric,
    replacement: "[REDACTED:github-token]"
  },
  {
    prefix: "ghr_",
    minSuffixLength: 20,
    predicate: isAsciiAlphaNumeric,
    replacement: "[REDACTED:github-token]"
  },
  {
    prefix: "github_pat_",
    minSuffixLength: 20,
    predicate: isTokenChar,
    replacement: "[REDACTED:github-token]"
  },
  {
    prefix: "AKIA",
    minSuffixLength: 16,
    predicate: isUpperAlphaNumeric,
    replacement: "[REDACTED:aws-access-key]"
  },
  {
    prefix: "ASIA",
    minSuffixLength: 16,
    predicate: isUpperAlphaNumeric,
    replacement: "[REDACTED:aws-access-key]"
  },
  {
    prefix: "sk_live_",
    minSuffixLength: 16,
    predicate: isAsciiAlphaNumeric,
    replacement: "[REDACTED:stripe-key]"
  },
  {
    prefix: "sk_test_",
    minSuffixLength: 16,
    predicate: isAsciiAlphaNumeric,
    replacement: "[REDACTED:stripe-key]"
  },
  {
    prefix: "rk_live_",
    minSuffixLength: 16,
    predicate: isAsciiAlphaNumeric,
    replacement: "[REDACTED:stripe-key]"
  },
  {
    prefix: "rk_test_",
    minSuffixLength: 16,
    predicate: isAsciiAlphaNumeric,
    replacement: "[REDACTED:stripe-key]"
  },
  {
    prefix: "glpat-",
    minSuffixLength: 20,
    predicate: isTokenChar,
    replacement: "[REDACTED:gitlab-token]"
  },
  {
    prefix: "AIza",
    minSuffixLength: 35,
    predicate: isTokenChar,
    replacement: "[REDACTED:google-api-key]"
  },
  {
    prefix: "GOCSPX-",
    minSuffixLength: 20,
    predicate: isTokenChar,
    replacement: "[REDACTED:google-oauth-secret]"
  },
  {
    prefix: "sk-proj-",
    minSuffixLength: 20,
    predicate: isTokenChar,
    replacement: "[REDACTED:openai-key]"
  },
  {
    prefix: "sk-svcacct-",
    minSuffixLength: 20,
    predicate: isTokenChar,
    replacement: "[REDACTED:openai-key]"
  }
];
var OPENAI_LEGACY_MIN_SUFFIX = 40;
function consumeWhile(options) {
  let end = options.start;
  while (end < options.text.length && options.predicate(options.text[end])) {
    end++;
  }
  return end;
}
function scanPrefixedSecret(position) {
  for (const secret of PREFIXED_SECRETS) {
    if (position.text[position.start] !== secret.prefix[0] || !position.text.startsWith(secret.prefix, position.start)) {
      continue;
    }
    const suffixStart = position.start + secret.prefix.length;
    const end = consumeWhile({
      text: position.text,
      start: suffixStart,
      predicate: secret.predicate
    });
    return end - suffixStart >= secret.minSuffixLength ? { end, replacement: secret.replacement } : { end: Math.max(end, suffixStart) };
  }
  return void 0;
}
function scanSlackToken(position) {
  const variant = position.text[position.start + 3];
  if (!position.text.startsWith("xox", position.start) || variant === void 0 || variant < "a" || variant > "z" || position.text[position.start + 4] !== "-") {
    return void 0;
  }
  const suffixStart = position.start + 5;
  const end = consumeWhile({
    text: position.text,
    start: suffixStart,
    predicate: isTokenChar
  });
  return end - suffixStart >= 10 ? { end, replacement: "[REDACTED:slack-token]" } : { end: Math.max(end, suffixStart) };
}
function scanSendGridKey(position) {
  if (!position.text.startsWith("SG.", position.start))
    return void 0;
  const retryAt = position.start + 1;
  const firstStart = position.start + 3;
  const firstEnd = firstStart + 22;
  for (let index = firstStart; index < firstEnd; index++) {
    if (!isTokenChar(position.text[index]))
      return { end: retryAt };
  }
  if (position.text[firstEnd] !== ".")
    return { end: retryAt };
  const secondStart = firstEnd + 1;
  const end = secondStart + 43;
  for (let index = secondStart; index < end; index++) {
    if (!isTokenChar(position.text[index]))
      return { end: retryAt };
  }
  return isTokenChar(position.text[end]) ? { end: retryAt } : { end, replacement: "[REDACTED:sendgrid-key]" };
}
function createJwtSegment(options) {
  const possibleCandidate = options.text.indexOf("eyJ", options.start);
  const candidate = possibleCandidate !== -1 && possibleCandidate < options.end && options.end - (possibleCandidate + 3) >= 5 ? possibleCandidate : -1;
  return {
    candidate,
    length: options.end - options.start,
    end: options.end
  };
}
function chooseSecretRange(options) {
  if (!options.candidate)
    return options.current;
  if (!options.current)
    return options.candidate;
  return options.candidate.start < options.current.start || options.candidate.start === options.current.start && options.candidate.end > options.current.end ? options.candidate : options.current;
}
function findNestedJwtRange(segments) {
  let result;
  const jweStart = segments.length - 5;
  if (jweStart >= 0 && segments[jweStart].candidate !== -1 && segments[jweStart + 2].length > 0 && segments[jweStart + 3].length > 0 && segments[jweStart + 4].length > 0) {
    result = {
      start: segments[jweStart].candidate,
      end: segments[jweStart + 4].end
    };
  }
  const jwtStart = segments.length - 3;
  const isJwt = jwtStart >= 0 && segments[jwtStart].candidate !== -1 && segments[jwtStart + 1].length > 0 && segments[jwtStart + 2].length > 0;
  return isJwt ? chooseSecretRange({
    current: result,
    candidate: {
      start: segments[jwtStart].candidate,
      end: segments[jwtStart + 2].end
    }
  }) : result;
}
function topLevelJwtEnd(options) {
  if (options.segmentCount >= 5 && options.segmentLengths[2] > 0 && options.segmentLengths[3] > 0 && options.segmentLengths[4] > 0) {
    return options.segmentEnds[4];
  }
  return options.segmentCount >= 3 && options.segmentLengths[1] > 0 && options.segmentLengths[2] > 0 ? options.segmentEnds[2] : void 0;
}
function scanJwt(position) {
  if (!position.text.startsWith("eyJ", position.start))
    return void 0;
  let segmentStart = position.start + 3;
  let cursor = consumeWhile({
    text: position.text,
    start: segmentStart,
    predicate: isTokenChar
  });
  if (cursor - segmentStart < 5)
    return { end: cursor };
  const segmentLengths = [cursor - segmentStart];
  const segmentEnds = [cursor];
  const recentSegments = [
    createJwtSegment({ text: position.text, start: segmentStart, end: cursor })
  ];
  let segmentCount = 1;
  let nestedRange;
  while (position.text[cursor] === ".") {
    segmentStart = cursor + 1;
    cursor = consumeWhile({
      text: position.text,
      start: segmentStart,
      predicate: isTokenChar
    });
    segmentCount++;
    recentSegments.push(createJwtSegment({
      text: position.text,
      start: segmentStart,
      end: cursor
    }));
    if (recentSegments.length > 5)
      recentSegments.shift();
    nestedRange = chooseSecretRange({
      current: nestedRange,
      candidate: findNestedJwtRange(recentSegments)
    });
    if (segmentLengths.length < 5) {
      segmentLengths.push(cursor - segmentStart);
      segmentEnds.push(cursor);
    }
  }
  const topLevelEnd = topLevelJwtEnd({
    segmentCount,
    segmentLengths,
    segmentEnds
  });
  if (topLevelEnd !== void 0) {
    return { end: topLevelEnd, replacement: "[REDACTED:jwt]" };
  }
  return nestedRange ? { ...nestedRange, replacement: "[REDACTED:jwt]" } : { end: cursor };
}
function scanOpenAiLegacyKey(position) {
  if (!position.text.startsWith("sk-", position.start))
    return void 0;
  const suffixStart = position.start + 3;
  let end = suffixStart;
  let hasDigit = false;
  while (end < position.text.length && isAsciiAlphaNumeric(position.text[end])) {
    const code = codePointOf(position.text[end]);
    if (code >= 48 && code <= 57)
      hasDigit = true;
    end++;
  }
  return end - suffixStart >= OPENAI_LEGACY_MIN_SUFFIX && hasDigit ? { end, replacement: "[REDACTED:openai-key]" } : { end: Math.max(end, suffixStart) };
}
function scanSecretAt(position) {
  const initial = position.text[position.start];
  if (initial === "S")
    return scanSendGridKey(position);
  if (initial === "x")
    return scanSlackToken(position);
  if (initial === "s") {
    return scanPrefixedSecret(position) ?? scanOpenAiLegacyKey(position);
  }
  if (initial === "A" || initial === "G" || initial === "g" || initial === "r") {
    return scanPrefixedSecret(position);
  }
  return void 0;
}
function redactScannedSecrets(options) {
  let cursor = 0;
  let copyFrom = 0;
  let result = "";
  const position = { text: options.text, start: 0 };
  while (cursor < options.text.length) {
    position.start = cursor;
    const scan = options.scanner(position);
    if (!scan) {
      cursor++;
      continue;
    }
    if (scan.replacement) {
      const replacementStart = scan.start ?? cursor;
      result += options.text.slice(copyFrom, replacementStart) + scan.replacement;
      copyFrom = scan.end;
    }
    cursor = Math.max(cursor + 1, scan.end);
  }
  return copyFrom === 0 ? options.text : result + options.text.slice(copyFrom);
}
function redactTokenSecrets(text) {
  return redactScannedSecrets({ text, scanner: scanSecretAt });
}
function redactJwtSecrets(text) {
  return redactScannedSecrets({ text, scanner: scanJwt });
}
function isPrivateKeyLabel(label) {
  if (label.length === 0 || label.length > 64 || !label.includes("PRIVATE KEY")) {
    return false;
  }
  for (const char of label) {
    const code = codePointOf(char);
    if (char !== " " && (code < 48 || code > 57) && (code < 65 || code > 90)) {
      return false;
    }
  }
  return true;
}
function findUnescapedQuote(position) {
  let escaped = false;
  for (let index = position.start; index < position.text.length; index++) {
    const char = position.text[index];
    if (char === "\\") {
      escaped = !escaped;
      continue;
    }
    if (char === '"' && !escaped)
      return index;
    escaped = false;
  }
  return position.text.length;
}
function redactPrivateKeyBlocks(text) {
  let cursor = 0;
  let result = "";
  while (cursor < text.length) {
    const begin = text.indexOf(PEM_BEGIN, cursor);
    if (begin === -1)
      return result + text.slice(cursor);
    const labelStart = begin + PEM_BEGIN.length;
    const labelEnd = text.indexOf(PEM_DELIMITER, labelStart);
    if (labelEnd === -1)
      return result + text.slice(cursor);
    const label = text.slice(labelStart, labelEnd);
    if (!isPrivateKeyLabel(label)) {
      const next = labelEnd + PEM_DELIMITER.length;
      result += text.slice(cursor, next);
      cursor = next;
      continue;
    }
    const contentStart = labelEnd + PEM_DELIMITER.length;
    const endMarker = `-----END ${label}-----`;
    const end = text.indexOf(endMarker, contentStart);
    result += text.slice(cursor, begin) + "[REDACTED:private-key]";
    if (end === -1) {
      cursor = findUnescapedQuote({ text, start: contentStart });
      continue;
    }
    cursor = end + endMarker.length;
  }
  return result;
}
function redactSecrets(text) {
  return redactJwtSecrets(redactTokenSecrets(redactPrivateKeyBlocks(text)));
}

// dist/clients/process-singletons.js
var SINGLETON_HOST_KEY = /* @__PURE__ */ Symbol.for("pi-lens.process-singletons.v1");
var SINGLETON_SCHEMA = "pi-lens.process-singletons";
var PROCESS_SINGLETON_RESET_KIND = "process-singleton-reset";
var singletonHost = globalThis;
function container() {
  const existing = singletonHost[SINGLETON_HOST_KEY];
  if (existing instanceof Map)
    return existing;
  const fresh = /* @__PURE__ */ new Map();
  singletonHost[SINGLETON_HOST_KEY] = fresh;
  return fresh;
}
function isAdoptable(cell, version) {
  if (!cell || typeof cell !== "object")
    return false;
  const candidate = cell;
  return candidate.schema === SINGLETON_SCHEMA && candidate.version === version && candidate.value !== void 0;
}
var PROCESS_SINGLETON_RESET_LOG_FAMILY = "process-singleton-reset-log";
var RESET_LOG_FAMILY = PROCESS_SINGLETON_RESET_LOG_FAMILY;
var RESET_LOG_VERSION = 1;
var RESET_LOG_CAP = 16;
function resetLog() {
  return getProcessSingleton(RESET_LOG_FAMILY, RESET_LOG_VERSION, () => ({
    entries: []
  }));
}
function recordIncompatibleCell(family, wantedVersion, found) {
  if (family === RESET_LOG_FAMILY)
    return;
  const log = resetLog();
  if (log.entries.some((entry) => entry.family === family))
    return;
  if (log.entries.length >= RESET_LOG_CAP)
    return;
  log.entries.push({
    family,
    reason: `incompatible process singleton discarded (found schema=${String(found.schema)} version=${String(found.version)}, this build wants schema=${SINGLETON_SCHEMA} version=${wantedVersion})`
  });
}
function getProcessSingletonResets() {
  return resetLog().entries.map((entry) => ({ ...entry }));
}
function getProcessSingleton(family, version, create, onIncompatible) {
  const cells = container();
  const existing = cells.get(family);
  if (isAdoptable(existing, version))
    return existing.value;
  if (existing !== void 0) {
    recordIncompatibleCell(family, version, existing);
    onIncompatible?.(existing.value);
  }
  const value = create();
  cells.set(family, { schema: SINGLETON_SCHEMA, version, value });
  return value;
}
var EVALUATION_ORDINAL_FAMILY = "module-evaluation-ordinal";
var EVALUATION_ORDINAL_VERSION = 1;
function nextModuleEvaluationOrdinal() {
  const state2 = getProcessSingleton(EVALUATION_ORDINAL_FAMILY, EVALUATION_ORDINAL_VERSION, () => ({ evaluations: 0 }));
  state2.evaluations += 1;
  return state2.evaluations;
}

// dist/clients/probe-home-state.js
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
var RESOLUTION_SLOT = /* @__PURE__ */ Symbol.for("pi-lens.probe-home-state.resolution");
function getProbeHomeResolution() {
  return globalThis[RESOLUTION_SLOT];
}
function getProbeHomeRedirectEvent() {
  return getProbeHomeResolution()?.event;
}
function getGlobalPiLensLogDir() {
  const override = process.env.PI_LENS_HOME?.trim();
  if (override)
    return path.resolve(override);
  return resolveProbeHomeDir() ?? path.join(os.homedir(), ".pi-lens");
}
function isTestProcessTargetingRealHome(file) {
  if (!process.env.VITEST)
    return false;
  return isUnderRealDir(path.dirname(path.resolve(file)), path.join(os.homedir(), ".pi-lens"));
}
function resolveProbeHomeDir() {
  const slot = globalThis;
  const cached = slot[RESOLUTION_SLOT];
  if (cached)
    return cached.probeHome;
  const cwd = process.cwd();
  const probeHome = computeProbeHomeDir(cwd);
  slot[RESOLUTION_SLOT] = {
    probeHome,
    event: probeHome ? { probeHome } : void 0
  };
  return probeHome;
}
function computeProbeHomeDir(cwd) {
  if (process.env.PILENS_PROBE === "1") {
    return path.join(cwd, ".pi-lens-probe-home");
  }
  const worktreeRoot = findAgentWorktreeRoot(cwd);
  if (worktreeRoot)
    return path.join(worktreeRoot, ".pi-lens-probe-home");
  if (isUnderRealDir(cwd, os.tmpdir())) {
    return path.join(cwd, ".pi-lens-probe-home");
  }
  return void 0;
}
function findAgentWorktreeRoot(cwd) {
  const normalized = normalizeFilePath(path.resolve(cwd));
  const match = /(?:^|\/)\.claude\/worktrees\/[^/]+(?:\/|$)/.exec(normalized);
  if (!match)
    return void 0;
  return normalized.slice(0, match.index + match[0].length).replace(/\/$/, "");
}
function isUnderRealDir(child, parent) {
  return isUnderDir(toRealPath(child), toRealPath(parent));
}
function toRealPath(target) {
  try {
    return fs.realpathSync.native(target);
  } catch {
    return target;
  }
}

// dist/clients/ndjson-logger.js
import * as fs2 from "node:fs";
import * as path2 from "node:path";
function resolve3(v) {
  return typeof v === "function" ? v() : v;
}
function runBestEffort(operation) {
  try {
    operation();
  } catch {
    return;
  }
}
var NDJSON_GLOBAL_STATE_SCHEMA = "pi-lens.ndjson-logger.state";
var NDJSON_LEGACY_GLOBAL_STATE_VERSION = 1;
var NDJSON_GLOBAL_STATE_VERSION = 2;
var NDJSON_GLOBAL_STATE_KEY = /* @__PURE__ */ Symbol.for("pi-lens.ndjson-logger.state");
var globalStateHost = globalThis;
var existingGlobalState = globalStateHost[NDJSON_GLOBAL_STATE_KEY];
function isSharedWriterState(value) {
  if (!value || typeof value !== "object")
    return false;
  const candidate = value;
  const knownSchema = candidate.schema === void 0 || candidate.schema === NDJSON_GLOBAL_STATE_SCHEMA;
  const knownVersion = candidate.version === void 0 || candidate.version === NDJSON_LEGACY_GLOBAL_STATE_VERSION || candidate.version === NDJSON_GLOBAL_STATE_VERSION;
  return knownSchema && knownVersion && candidate.writers instanceof Map && candidate.exitFlushers instanceof Set && candidate.registeredLogFiles instanceof Set && typeof candidate.exitHandlerRegistered === "boolean";
}
function isLegacyGlobalState(value) {
  if (!value || typeof value !== "object")
    return false;
  const candidate = value;
  return candidate.exitFlushers instanceof Set && candidate.registeredLogFiles instanceof Set && typeof candidate.exitHandlerRegistered === "boolean";
}
var ndjsonGlobalState;
var legacyGlobalState;
if (isSharedWriterState(existingGlobalState)) {
  const needsFlusherMigration = existingGlobalState.schema !== NDJSON_GLOBAL_STATE_SCHEMA || existingGlobalState.version !== NDJSON_GLOBAL_STATE_VERSION;
  if (needsFlusherMigration) {
    for (const state2 of existingGlobalState.writers.values()) {
      const staleExitFlusher = state2.exitFlusher;
      const currentExitFlusher = () => flushStateSync(state2);
      state2.exitFlusher = currentExitFlusher;
      existingGlobalState.exitFlushers.delete(staleExitFlusher);
      existingGlobalState.exitFlushers.add(currentExitFlusher);
    }
  }
  existingGlobalState.schema = NDJSON_GLOBAL_STATE_SCHEMA;
  existingGlobalState.version = NDJSON_GLOBAL_STATE_VERSION;
  ndjsonGlobalState = existingGlobalState;
} else if (existingGlobalState === void 0) {
  ndjsonGlobalState = globalStateHost[NDJSON_GLOBAL_STATE_KEY] = {
    schema: NDJSON_GLOBAL_STATE_SCHEMA,
    version: NDJSON_GLOBAL_STATE_VERSION,
    writers: /* @__PURE__ */ new Map(),
    exitFlushers: /* @__PURE__ */ new Set(),
    exitHandlerRegistered: false,
    registeredLogFiles: /* @__PURE__ */ new Set()
  };
} else if (isLegacyGlobalState(existingGlobalState)) {
  legacyGlobalState = existingGlobalState;
}
var exitFlushers = ndjsonGlobalState?.exitFlushers ?? legacyGlobalState?.exitFlushers ?? /* @__PURE__ */ new Set();
var registeredLogFiles = ndjsonGlobalState?.registeredLogFiles ?? legacyGlobalState?.registeredLogFiles ?? /* @__PURE__ */ new Set();
function getRegisteredLogFiles() {
  return registeredLogFiles;
}
function getSinkWriteFailures() {
  if (!ndjsonGlobalState)
    return [];
  const result = [];
  for (const state2 of ndjsonGlobalState.writers.values()) {
    if (state2.writeFailures > 0) {
      result.push({ file: state2.file, droppedCount: state2.writeFailures });
    }
  }
  return result;
}
function resetSinkWriteFailures() {
  if (!ndjsonGlobalState)
    return;
  for (const state2 of ndjsonGlobalState.writers.values())
    state2.writeFailures = 0;
}
function getSinkRotations() {
  if (!ndjsonGlobalState)
    return [];
  const result = [];
  for (const state2 of ndjsonGlobalState.writers.values()) {
    if (state2.rotationCount > 0 || state2.rotationFailures > 0) {
      result.push({
        file: state2.file,
        rotationCount: state2.rotationCount,
        failureCount: state2.rotationFailures
      });
    }
  }
  return result;
}
function resetSinkRotations() {
  if (!ndjsonGlobalState)
    return;
  for (const state2 of ndjsonGlobalState.writers.values()) {
    state2.rotationCount = 0;
    state2.rotationFailures = 0;
    state2.rotationRetryAfterMs = 0;
    state2.optionConflictRecorded = false;
    state2.truncateRefusals = 0;
  }
}
function getSinkTruncateRefusals() {
  if (!ndjsonGlobalState)
    return [];
  const result = [];
  for (const state2 of ndjsonGlobalState.writers.values()) {
    if (state2.truncateRefusals > 0) {
      result.push({ file: state2.file, refusedCount: state2.truncateRefusals });
    }
  }
  return result;
}
function getSinkOptionConflicts() {
  if (!ndjsonGlobalState)
    return [];
  return [...ndjsonGlobalState.writers.values()].filter((state2) => state2.optionConflictRecorded).map((state2) => ({ file: state2.file }));
}
function requireCurrentGlobalState() {
  if (ndjsonGlobalState)
    return ndjsonGlobalState;
  throw new Error("createNdjsonLogger: incompatible module graph state; a pre-7e4b9120 logger graph may still own private queues. Restart the process before loading the current logger graph");
}
function registerWriter(state2) {
  const globalState = requireCurrentGlobalState();
  if (!exitFlushers.has(state2.exitFlusher))
    exitFlushers.add(state2.exitFlusher);
  if (!globalState.exitHandlerRegistered) {
    globalState.exitHandlerRegistered = true;
    process.on("exit", () => {
      for (const flush of exitFlushers)
        runBestEffort(flush);
    });
  }
}
function normalizeLogPath(file) {
  return normalizeFilePath(path2.resolve(file));
}
function writeQueueItemSync(state2, item) {
  if (item.kind === "truncate") {
    fs2.writeFileSync(state2.file, "");
    noteTruncated(state2);
  } else {
    const plan = planBoundedWrite(state2, [item.line]);
    fs2.appendFileSync(state2.file, plan.joined);
    noteWriteSucceeded(state2, plan.bytes);
  }
}
function applyQueueItemSync(state2, item) {
  ensureDirSync(state2);
  try {
    writeQueueItemSync(state2, item);
    return;
  } catch {
  }
  state2.ensuredDir = false;
  ensureDirSync(state2);
  try {
    writeQueueItemSync(state2, item);
  } catch {
    state2.writeFailures += 1;
  }
}
function flushStateSync(state2) {
  const inFlight = state2.inFlightBatch;
  const inFlightAtHead = inFlight !== null && inFlight.every((item, index) => state2.queue[index] === item);
  const repairStart = inFlightAtHead ? inFlight?.[0]?.kind === "truncate" ? 0 : state2.queue.findIndex((item) => item.kind === "truncate") : -1;
  if (state2.syncRepairItems) {
    state2.syncRepairItems.push(...state2.queue);
  } else if (repairStart >= 0) {
    state2.syncRepairItems = state2.queue.slice(repairStart);
  }
  while (state2.queue.length > 0) {
    const item = state2.queue.shift();
    applyQueueItemSync(state2, item);
  }
}
function createWriterState(file, maxBytes, backupPath) {
  const globalState = requireCurrentGlobalState();
  const existing = globalState.writers.get(file);
  if (existing) {
    if (!exitFlushers.has(existing.exitFlusher))
      registerWriter(existing);
    if (typeof existing.writeFailures !== "number")
      existing.writeFailures = 0;
    if (typeof existing.writesSinceStatSync !== "number")
      existing.writesSinceStatSync = 0;
    if (typeof existing.lastStatSyncMs !== "number")
      existing.lastStatSyncMs = 0;
    if (typeof existing.rotationCount !== "number")
      existing.rotationCount = 0;
    if (typeof existing.rotationFailures !== "number")
      existing.rotationFailures = 0;
    if (typeof existing.rotationRetryAfterMs !== "number")
      existing.rotationRetryAfterMs = 0;
    if (typeof existing.optionConflictRecorded !== "boolean")
      existing.optionConflictRecorded = false;
    if (typeof existing.truncateRefusals !== "number")
      existing.truncateRefusals = 0;
    const optionsDiffer = existing.maxBytes !== maxBytes || existing.backupPath !== backupPath;
    if (optionsDiffer) {
      if (existing.maxBytes === void 0 && maxBytes !== void 0)
        existing.maxBytes = maxBytes;
      if (existing.backupPath === void 0 && backupPath !== void 0)
        existing.backupPath = backupPath;
      existing.optionConflictRecorded = true;
    }
    return existing;
  }
  const state2 = {};
  state2.file = file;
  state2.maxBytes = maxBytes;
  state2.backupPath = backupPath;
  state2.queue = [];
  state2.drainPromise = null;
  state2.inFlightBatch = null;
  state2.syncRepairItems = null;
  state2.ensuredDir = false;
  state2.exitFlusher = () => flushStateSync(state2);
  state2.writeFailures = 0;
  state2.knownSize = void 0;
  state2.writesSinceStatSync = 0;
  state2.lastStatSyncMs = 0;
  state2.rotationCount = 0;
  state2.rotationFailures = 0;
  state2.rotationRetryAfterMs = 0;
  state2.optionConflictRecorded = false;
  state2.truncateRefusals = 0;
  globalState.writers.set(file, state2);
  registerWriter(state2);
  return state2;
}
function ensureDirSync(state2) {
  if (state2.ensuredDir)
    return;
  runBestEffort(() => {
    fs2.mkdirSync(path2.dirname(state2.file), { recursive: true });
    state2.ensuredDir = true;
  });
}
async function ensureDirAsync(state2) {
  if (state2.ensuredDir)
    return;
  try {
    await fs2.promises.mkdir(path2.dirname(state2.file), { recursive: true });
    state2.ensuredDir = true;
  } catch {
  }
}
var ROTATION_STAT_RESYNC_WRITES = 25;
var ROTATION_STAT_RESYNC_MS = 2e3;
function syncKnownSizeIfDue(state2, now) {
  const due = state2.knownSize === void 0 || state2.writesSinceStatSync >= ROTATION_STAT_RESYNC_WRITES || now - state2.lastStatSyncMs >= ROTATION_STAT_RESYNC_MS;
  if (!due)
    return;
  state2.writesSinceStatSync = 0;
  state2.lastStatSyncMs = now;
  try {
    state2.knownSize = fs2.statSync(state2.file).size;
  } catch {
    state2.knownSize = 0;
  }
}
var ROTATION_FAILURE_BACKOFF_MS = 1e4;
function rotateNow(state2, incomingBytes, now) {
  if (state2.maxBytes === void 0)
    return false;
  if (now < state2.rotationRetryAfterMs)
    return false;
  let actualSize;
  try {
    actualSize = fs2.statSync(state2.file).size;
  } catch {
    state2.knownSize = 0;
    state2.writesSinceStatSync = 0;
    state2.lastStatSyncMs = now;
    return false;
  }
  state2.knownSize = actualSize;
  state2.writesSinceStatSync = 0;
  state2.lastStatSyncMs = now;
  if (actualSize === 0)
    return false;
  if (actualSize + incomingBytes < state2.maxBytes)
    return false;
  const backup = state2.backupPath ?? `${state2.file}.1`;
  try {
    runBestEffort(() => fs2.rmSync(backup, { force: true }));
    fs2.renameSync(state2.file, backup);
  } catch {
    state2.rotationFailures += 1;
    state2.rotationRetryAfterMs = now + ROTATION_FAILURE_BACKOFF_MS;
    return false;
  }
  state2.knownSize = 0;
  state2.rotationCount += 1;
  state2.rotationRetryAfterMs = 0;
  return true;
}
function takeAll(lines) {
  const joined = lines.join("");
  return { count: lines.length, joined, bytes: Buffer.byteLength(joined) };
}
function planBoundedWrite(state2, lines) {
  if (state2.maxBytes === void 0 || lines.length === 0)
    return takeAll(lines);
  const now = Date.now();
  syncKnownSizeIfDue(state2, now);
  state2.writesSinceStatSync += 1;
  const firstBytes = Buffer.byteLength(lines[0] ?? "");
  let known = state2.knownSize ?? 0;
  if (known > 0 && known + firstBytes >= state2.maxBytes) {
    rotateNow(state2, firstBytes, now);
    known = state2.knownSize ?? 0;
    if (known > 0 && known + firstBytes >= state2.maxBytes) {
      return takeAll(lines);
    }
  }
  let bytes = 0;
  let count = 0;
  for (const line of lines) {
    const lineBytes = Buffer.byteLength(line);
    if (count > 0 && known + bytes + lineBytes >= state2.maxBytes)
      break;
    bytes += lineBytes;
    count += 1;
  }
  if (count === lines.length)
    return takeAll(lines);
  return { count, joined: lines.slice(0, count).join(""), bytes };
}
function noteWriteSucceeded(state2, bytes) {
  if (state2.maxBytes === void 0)
    return;
  state2.knownSize = (state2.knownSize ?? 0) + bytes;
}
function noteTruncated(state2) {
  if (state2.maxBytes === void 0)
    return;
  state2.knownSize = 0;
  state2.writesSinceStatSync = 0;
  state2.lastStatSyncMs = Date.now();
}
async function writeQueueItemAsync(state2, item) {
  if (item.kind === "truncate") {
    await fs2.promises.writeFile(state2.file, "");
    noteTruncated(state2);
  } else {
    const plan = planBoundedWrite(state2, [item.line]);
    await fs2.promises.appendFile(state2.file, plan.joined);
    noteWriteSucceeded(state2, plan.bytes);
  }
}
async function applyQueueItemAsync(state2, item) {
  await ensureDirAsync(state2);
  try {
    await writeQueueItemAsync(state2, item);
    return;
  } catch {
  }
  state2.ensuredDir = false;
  await ensureDirAsync(state2);
  try {
    await writeQueueItemAsync(state2, item);
  } catch {
    state2.writeFailures += 1;
  }
}
async function drainLoop(state2) {
  while (state2.queue.length > 0) {
    const item = state2.queue[0];
    await ensureDirAsync(state2);
    const truncateIndex = item.kind === "line" ? state2.queue.findIndex((queued) => queued.kind === "truncate") : 0;
    const pendingEnd = truncateIndex === -1 ? state2.queue.length : truncateIndex;
    const offered = item.kind === "truncate" ? [item] : state2.queue.slice(0, pendingEnd);
    const plan = item.kind === "truncate" ? null : planBoundedWrite(state2, offered.map((queued) => queued.line));
    const pending = plan === null ? offered : offered.slice(0, plan.count);
    state2.inFlightBatch = pending;
    const writeBatch = async () => {
      if (plan === null) {
        await fs2.promises.writeFile(state2.file, "");
        noteTruncated(state2);
      } else {
        await fs2.promises.appendFile(state2.file, plan.joined);
        noteWriteSucceeded(state2, plan.bytes);
      }
    };
    try {
      await writeBatch();
    } catch {
      state2.ensuredDir = false;
      await ensureDirAsync(state2);
      try {
        await writeBatch();
      } catch {
        state2.writeFailures += pending.length;
      }
    }
    for (const written of pending) {
      if (state2.queue[0] !== written)
        break;
      state2.queue.shift();
    }
    if (state2.inFlightBatch === pending) {
      state2.inFlightBatch = null;
      const repairItems = state2.syncRepairItems;
      state2.syncRepairItems = null;
      if (repairItems) {
        for (const repairItem of repairItems) {
          await applyQueueItemAsync(state2, repairItem);
        }
      }
    }
  }
}
function drain(state2) {
  if (!state2.drainPromise) {
    state2.drainPromise = Promise.resolve().then(() => drainLoop(state2)).finally(() => {
      state2.drainPromise = null;
    });
  }
  return state2.drainPromise;
}
function createNdjsonLogger(options) {
  const states = /* @__PURE__ */ new Set();
  const canonicalPaths = /* @__PURE__ */ new Map();
  const staticFile = typeof options.filePath === "string" ? normalizeLogPath(options.filePath) : void 0;
  const staticBackupPath = typeof options.backupPath === "string" && options.maxBytes !== void 0 ? normalizeLogPath(options.backupPath) : void 0;
  function canonicalPath(file) {
    const raw = path2.resolve(file);
    const cached = canonicalPaths.get(raw);
    if (cached)
      return cached;
    const normalized = normalizeLogPath(raw);
    canonicalPaths.set(raw, normalized);
    return normalized;
  }
  function stateForCall() {
    const file = staticFile ?? canonicalPath(resolve3(options.filePath));
    const backupPath = options.maxBytes !== void 0 && options.backupPath ? staticBackupPath ?? canonicalPath(resolve3(options.backupPath)) : void 0;
    const state2 = createWriterState(file, options.maxBytes, backupPath);
    states.add(state2);
    return state2;
  }
  if (staticFile !== void 0) {
    const state2 = stateForCall();
    registeredLogFiles.add(state2.file);
  }
  function enqueue(item) {
    const state2 = stateForCall();
    state2.queue.push(item);
    void drain(state2);
  }
  return {
    log(obj) {
      const serialized = String(JSON.stringify(obj));
      enqueue({
        kind: "line",
        line: `${redactSecrets(serialized)}
`
      });
    },
    append(line) {
      enqueue({ kind: "line", line: `${redactSecrets(line)}
` });
    },
    truncate() {
      const state2 = stateForCall();
      if (isTestProcessTargetingRealHome(state2.file)) {
        if (state2.truncateRefusals === 0) {
          try {
            process.emitWarning(`pi-lens refused to truncate the real-home log ${state2.file} from a test process (pin PI_LENS_HOME for this file)`, { code: "PI_LENS_LOG_SINK_TRUNCATE_REFUSED" });
          } catch {
          }
        }
        state2.truncateRefusals += 1;
        return;
      }
      enqueue({ kind: "truncate" });
    },
    async flush() {
      await Promise.all([...states].map((state2) => drain(state2)));
    },
    flushSync() {
      for (const state2 of states)
        flushStateSync(state2);
    }
  };
}

// dist/clients/log-cleanup.js
import * as fs3 from "node:fs";
import * as path3 from "node:path";
var LOG_DIR = getGlobalPiLensLogDir();
var LOGS_SUBDIR = path3.join(LOG_DIR, "logs");
function getManagedLogFiles(dir = LOG_DIR) {
  const names = /* @__PURE__ */ new Set();
  for (const absPath of getRegisteredLogFiles()) {
    if (pathsEqual(path3.dirname(absPath), dir)) {
      names.add(path3.basename(absPath));
    }
  }
  try {
    if (fs3.existsSync(dir)) {
      for (const entry of fs3.readdirSync(dir)) {
        if (entry.endsWith(".log") && !ROTATED_BACKUP_RE.test(entry)) {
          names.add(entry);
        }
      }
    }
  } catch {
  }
  return [...names].sort((a, b) => a.localeCompare(b));
}
var ROTATED_BACKUP_RE = /(\.\d{4}-\d{2}-\d{2}T.*\.log|\.log\..+)$/;
function getMaxLogSizeMB() {
  return Math.max(1, Number.parseInt(process.env.PI_LENS_MAX_LOG_SIZE_MB ?? "10", 10) || 10);
}
function getConfig() {
  return {
    retentionDays: Math.max(1, Number.parseInt(process.env.PI_LENS_LOG_RETENTION_DAYS ?? "7", 10) || 7),
    maxSizeMB: getMaxLogSizeMB()
  };
}
function getFileAgeDays(filePath) {
  try {
    const stats = fs3.statSync(filePath);
    const ageMs = Date.now() - stats.mtime.getTime();
    return ageMs / (1e3 * 60 * 60 * 24);
  } catch {
    return 0;
  }
}
function getFileSizeMB(filePath) {
  try {
    const stats = fs3.statSync(filePath);
    return stats.size / (1024 * 1024);
  } catch {
    return 0;
  }
}
function cleanupOldLogs(directory, pattern, retentionDays) {
  const config = getConfig();
  const maxAge = retentionDays ?? config.retentionDays;
  const deleted = [];
  const errors = [];
  try {
    if (!fs3.existsSync(directory)) {
      return { deleted, errors };
    }
    const files = fs3.readdirSync(directory);
    for (const file of files) {
      if (!pattern.test(file))
        continue;
      const filePath = path3.join(directory, file);
      const ageDays = getFileAgeDays(filePath);
      if (ageDays > maxAge) {
        try {
          fs3.unlinkSync(filePath);
          deleted.push(file);
        } catch (err) {
          errors.push(`${file}: ${err}`);
        }
      }
    }
  } catch (err) {
    errors.push(`Directory read failed: ${err}`);
  }
  return { deleted, errors };
}
function rotateLogIfNeeded(logFile, maxSizeMB) {
  const config = getConfig();
  const maxSize = maxSizeMB ?? config.maxSizeMB;
  const sizeMB = getFileSizeMB(logFile);
  if (sizeMB < maxSize) {
    return { rotated: false };
  }
  try {
    const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
    const ext = path3.extname(logFile);
    const base = logFile.slice(0, -ext.length);
    const backupFile = `${base}.${timestamp}${ext}`;
    fs3.renameSync(logFile, backupFile);
    fs3.writeFileSync(logFile, "", "utf8");
    return { rotated: true, newFile: backupFile };
  } catch {
    return { rotated: false };
  }
}
function runLogCleanup(dbg) {
  const config = getConfig();
  const results = {
    cleaned: 0,
    rotated: 0,
    report: ""
  };
  const dailyLogs = cleanupOldLogs(LOGS_SUBDIR, /\.jsonl$/, config.retentionDays);
  results.cleaned += dailyLogs.deleted.length;
  const rotatedLogs = cleanupOldLogs(LOG_DIR, ROTATED_BACKUP_RE, config.retentionDays);
  results.cleaned += rotatedLogs.deleted.length;
  const mainLogs = getManagedLogFiles().map((name) => path3.join(LOG_DIR, name));
  for (const logFile of mainLogs) {
    const rotation = rotateLogIfNeeded(logFile, config.maxSizeMB);
    if (rotation.rotated) {
      results.rotated++;
      if (rotation.newFile) {
        const sizeMB = getFileSizeMB(rotation.newFile);
        dbg?.(`log_cleanup: rotated ${path3.basename(logFile)} (${sizeMB.toFixed(1)}MB) \u2192 ${path3.basename(rotation.newFile)}`);
      }
    }
  }
  const parts = [];
  if (dailyLogs.deleted.length > 0) {
    parts.push(`${dailyLogs.deleted.length} daily logs`);
  }
  if (rotatedLogs.deleted.length > 0) {
    parts.push(`${rotatedLogs.deleted.length} rotated logs`);
  }
  if (results.rotated > 0) {
    parts.push(`${results.rotated} active logs rotated`);
  }
  results.report = parts.length > 0 ? `log_cleanup: removed ${parts.join(", ")} (retention: ${config.retentionDays}d, maxSize: ${config.maxSizeMB}MB)` : `log_cleanup: no cleanup needed (retention: ${config.retentionDays}d, maxSize: ${config.maxSizeMB}MB)`;
  if (dailyLogs.errors.length > 0 || rotatedLogs.errors.length > 0) {
    dbg?.(`log_cleanup errors: ${[...dailyLogs.errors, ...rotatedLogs.errors].join("; ")}`);
  }
  return results;
}

// dist/clients/turn-context.js
import { AsyncLocalStorage } from "node:async_hooks";
var FAMILY = "turn-context";
var VERSION = 2;
function state() {
  return getProcessSingleton(FAMILY, VERSION, () => ({
    sessions: /* @__PURE__ */ new Map(),
    activeSession: new AsyncLocalStorage()
  }));
}
function sessionState(sessionId) {
  const current = state();
  let session = current.sessions.get(sessionId);
  if (!session) {
    session = { turnId: `${sessionId}:0`, turnIndex: 0 };
    current.sessions.set(sessionId, session);
  }
  return session;
}
function setTurnContextSession(sessionId) {
  const stableSessionId = sessionId?.trim();
  if (stableSessionId !== void 0 && stableSessionId !== "")
    sessionState(stableSessionId);
}
function beginTurnContext(sessionId) {
  const session = sessionState(sessionId);
  session.turnIndex += 1;
  session.turnId = `${sessionId}:${session.turnIndex}`;
  return session.turnId;
}
function getTurnId() {
  const current = state();
  const sessionId = current.activeSession.getStore();
  if (sessionId === void 0)
    return "turn:0";
  return sessionState(sessionId).turnId;
}

export {
  isTestMode,
  toPositiveFinite,
  lazyEnvNumber,
  getProbeHomeRedirectEvent,
  getGlobalPiLensLogDir,
  redactSecrets,
  getSinkWriteFailures,
  resetSinkWriteFailures,
  getSinkRotations,
  resetSinkRotations,
  getSinkTruncateRefusals,
  getSinkOptionConflicts,
  createNdjsonLogger,
  getMaxLogSizeMB,
  runLogCleanup,
  PROCESS_SINGLETON_RESET_KIND,
  getProcessSingletonResets,
  getProcessSingleton,
  nextModuleEvaluationOrdinal,
  setTurnContextSession,
  beginTurnContext,
  getTurnId
};
