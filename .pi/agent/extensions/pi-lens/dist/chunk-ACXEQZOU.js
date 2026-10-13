import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  resolveToolCwd
} from "./chunk-Q7DUK4LX.js";
import {
  allAvailableGlobalBinDirs,
  installArgs,
  pmBinary,
  resolveNodePackageManager
} from "./chunk-AW7R2GWG.js";
import {
  probeToolAsync
} from "./chunk-RWWYJ623.js";
import {
  TRANSIENT_MAX_COOLDOWN_MS,
  classifyProbeFailure,
  createAvailabilityLatch,
  logAvailabilityDecision,
  startHostStallSampler
} from "./chunk-VRZP76YM.js";
import {
  acquireBoundedPidFileLock,
  acquireQuarantinePidFileLock,
  createGenerationMap,
  getGlobalPiLensDir,
  heartbeatIntervalMs,
  isLockContention,
  ownsTopGeneration,
  recordGenerationTakeover,
  recordLegacyLockHeld,
  releaseGeneration,
  resetSafeSpawnWindowsCommandCache,
  safeSpawnAsync,
  startGenerationHeartbeat,
  tryAcquireGeneration
} from "./chunk-C34ZXZ7O.js";
import {
  assertInstallAllowed,
  projectTrustDenialReason
} from "./chunk-ZANLILYD.js";
import {
  DEFAULT_MAX_OUTPUT_BYTES,
  createBoundedOutputSink,
  writeFileAtomic,
  writeFileAtomicAsync
} from "./chunk-2EECBNC5.js";
import {
  getDegradationLedgerGeneration,
  incrementDegradationCount,
  recordDegradationOnce
} from "./chunk-JAU72XNY.js";
import {
  logExtension
} from "./chunk-XTMJ7XDT.js";
import {
  createNdjsonLogger,
  getGlobalPiLensLogDir,
  getMaxLogSizeMB,
  isTestMode
} from "./chunk-AOHZU2BM.js";
import {
  BoundedLruCache
} from "./chunk-ABBOA7UD.js";
import {
  findLocalToolConfig,
  isFullyQualified
} from "./chunk-N2H3ZPZY.js";
import {
  __require
} from "./chunk-NXL4FFQQ.js";

// dist/clients/installer/index.js
import { spawn } from "node:child_process";
import { existsSync, readFileSync as readFileSync2, statSync, unlinkSync, writeFileSync } from "node:fs";
import fs2 from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import https from "node:https";
import { createRequire } from "node:module";
import os from "node:os";
import path3 from "node:path";
import { createGunzip } from "node:zlib";

// dist/clients/durable-store.js
import * as fs from "node:fs";
import fsp from "node:fs/promises";
function readLocked(path4) {
  try {
    return fs.readFileSync(path4, "utf8");
  } catch {
    return void 0;
  }
}
function commitDurableStore(options) {
  const release = options.onContention === "skip-log" ? acquireBoundedPidFileLock(`${options.path}.lock`, {
    waitMs: options.waitMs,
    retryMs: options.retryMs,
    timeoutMessage: options.timeoutMessage,
    onContention: "skip-log",
    logContention: options.logContention
  }) : acquireBoundedPidFileLock(`${options.path}.lock`, {
    waitMs: options.waitMs,
    retryMs: options.retryMs,
    timeoutMessage: options.timeoutMessage,
    onContention: "throw"
  });
  if (!release)
    return void 0;
  let committed;
  try {
    const current = options.deserialize(readLocked(options.path));
    committed = options.merge(current);
    writeFileAtomic(options.path, options.serialize(committed), {
      bestEffort: false
    });
    options.afterWriteLocked?.(committed);
  } finally {
    release();
  }
  return committed;
}
async function readLockedAsync(path4) {
  try {
    return await fsp.readFile(path4, "utf8");
  } catch (error) {
    if (error.code === "ENOENT")
      return void 0;
    throw error;
  }
}
async function commitDurableStoreAsync(options) {
  const release = options.onContention === "skip-log" ? await acquireQuarantinePidFileLock(`${options.path}.lock`, {
    waitMs: options.waitMs,
    retryMs: options.retryMs,
    staleMs: options.staleMs,
    timeoutMessage: options.timeoutMessage,
    onContention: "skip-log",
    logContention: options.logContention
  }) : await acquireQuarantinePidFileLock(`${options.path}.lock`, {
    waitMs: options.waitMs,
    retryMs: options.retryMs,
    staleMs: options.staleMs,
    timeoutMessage: options.timeoutMessage,
    onContention: "throw"
  });
  if (!release)
    return void 0;
  try {
    const current = options.deserialize(await readLockedAsync(options.path));
    const committed = options.merge(current);
    await writeFileAtomicAsync(options.path, options.serialize(committed), {
      bestEffort: false
    });
    await options.afterWriteLocked?.(committed);
    return committed;
  } finally {
    await release();
  }
}

// dist/clients/sessionstart-logger.js
import * as path from "node:path";
var SESSIONSTART_LOG_FILE = path.join(getGlobalPiLensLogDir(), "sessionstart.log");
var writer = createNdjsonLogger({
  filePath: SESSIONSTART_LOG_FILE,
  maxBytes: getMaxLogSizeMB() * 1024 * 1024,
  backupPath: `${SESSIONSTART_LOG_FILE}.1`
});
function logSessionStart(message) {
  if (isTestMode())
    return;
  writer.append(`[${(/* @__PURE__ */ new Date()).toISOString()}] ${message}`);
}

// dist/clients/zizmor-config.js
import * as path2 from "node:path";
var LOCAL_ZIZMOR_CONFIG_NAMES = [
  path2.join(".github", "zizmor.yml"),
  path2.join(".github", "zizmor.yaml"),
  "zizmor.yml",
  "zizmor.yaml"
];
function findLocalZizmorConfig(startDir) {
  return findLocalToolConfig(startDir, LOCAL_ZIZMOR_CONFIG_NAMES);
}
function isZizmorAuditTarget(filePath) {
  const normalized = filePath.replace(/\\/g, "/");
  const base = path2.basename(normalized).toLowerCase();
  if (/(^|\/)\.github\/workflows\/[^/]+\.ya?ml$/i.test(normalized))
    return true;
  if (base === "action.yml" || base === "action.yaml")
    return true;
  if (/(^|\/)\.github\/dependabot\.ya?ml$/i.test(normalized))
    return true;
  return false;
}
var ZIZMOR_TOKEN_MAX_COOLDOWN_MS = 12e4;
var ghTokenLatch = createAvailabilityLatch({
  maxCooldownMs: ZIZMOR_TOKEN_MAX_COOLDOWN_MS
});
var cachedToken;
var GH_TOKEN_PROBE_TIMEOUT_MS = 5e3;
function resetZizmorTokenAvailability() {
  ghTokenLatch.reset();
  cachedToken = void 0;
}
function classifyGhTokenFailure(res, hostStallMs) {
  const neverAnswered = res.status === null || (res.status ?? 0) < 0;
  if (!res.error && !neverAnswered) {
    return {
      outcome: "non-installable",
      cause: "probe-rejected",
      classifiedBy: "caller"
    };
  }
  if (res.spawnFailure?.kind === "tool-not-found") {
    return { outcome: "missing", cause: "not-found", classifiedBy: "caller" };
  }
  const classified = classifyProbeFailure(res, { hostStallMs });
  if (classified.outcome === "transient" || classified.outcome === "missing") {
    return { ...classified, classifiedBy: "probe" };
  }
  return {
    outcome: "transient",
    cause: classified.cause,
    classifiedBy: "caller"
  };
}
async function deriveGhCliToken(consumer) {
  const sampler = startHostStallSampler();
  const startedAt = Date.now();
  const res = await safeSpawnAsync("gh", ["auth", "token"], {
    timeout: GH_TOKEN_PROBE_TIMEOUT_MS,
    ignoreAmbientSignal: true
  });
  const hostStallMs = sampler.stop();
  const elapsedMs = Date.now() - startedAt;
  if (!res.error && res.status === 0) {
    const token = res.stdout.trim();
    if (token.length > 0) {
      ghTokenLatch.noteAvailable();
      logAvailabilityDecision({
        tool: consumer === "zizmor" ? "zizmor-gh-token" : "github-token",
        verdict: "available",
        outcome: "success",
        cause: "ok",
        elapsedMs,
        latched: true,
        hostStallMs,
        budgetMs: GH_TOKEN_PROBE_TIMEOUT_MS,
        classifiedBy: "probe"
      });
      return token;
    }
    return recordGhTokenUnavailable(consumer, {
      outcome: "non-installable",
      cause: "empty-result",
      classifiedBy: "caller"
    }, elapsedMs, hostStallMs);
  }
  return recordGhTokenUnavailable(consumer, classifyGhTokenFailure(res, hostStallMs), elapsedMs, hostStallMs);
}
function recordGhTokenUnavailable(consumer, { outcome, cause, classifiedBy }, elapsedMs, hostStallMs) {
  const retryAfterMs = ghTokenLatch.noteUnavailable(outcome, cause);
  if (consumer === "zizmor" && outcome === "transient") {
    recordZizmorOfflineDegradation(`gh auth token probe ${cause}; running offline until the next zizmor start (retry allowed in ${Math.round(retryAfterMs / 1e3)}s)`);
  }
  logAvailabilityDecision({
    tool: consumer === "zizmor" ? "zizmor-gh-token" : "github-token",
    verdict: "unavailable",
    outcome,
    cause,
    elapsedMs,
    latched: outcome !== "transient",
    hostStallMs,
    ...retryAfterMs > 0 && { retryAfterMs },
    budgetMs: GH_TOKEN_PROBE_TIMEOUT_MS,
    // Shared tail for both call paths; the caller carries whether ITS
    // own verdict was a `classifyProbeFailure` passthrough or one of
    // this module's own assertions (#2226 review F2).
    classifiedBy
  });
  return void 0;
}
function recordZizmorOfflineDegradation(reason) {
  incrementDegradationCount({
    kind: "mode-suppression",
    subject: "zizmor",
    reason
  });
}
async function resolveZizmorGitHubToken() {
  if (process.env.ZIZMOR_OFFLINE)
    return void 0;
  return resolveGitHubToken(["ZIZMOR_GITHUB_TOKEN", "GH_TOKEN", "GITHUB_TOKEN"], { consumer: "zizmor" });
}
async function resolveGitHubToken(envKeys = ["GITHUB_TOKEN", "GH_TOKEN"], options = {}) {
  const consumer = options.consumer ?? "github-api";
  const fromEnv = envKeys.map((key) => process.env[key]).find(Boolean);
  if (fromEnv)
    return fromEnv;
  const memo = ghTokenLatch.read();
  if (memo !== null) {
    if (consumer === "zizmor" && memo === false && ghTokenLatch.getOutcome() === "transient") {
      const cause = ghTokenLatch.getCause();
      if (cause === null) {
        throw new Error("zizmor gh-token latch: transient outcome with no cause (invariant violated)");
      }
      const retryAfterMs = Math.max(0, ghTokenLatch.getRetryAtMs() - Date.now());
      recordZizmorOfflineDegradation(`gh auth token still cooling down (${cause}); serving cached offline verdict, retry allowed in ${Math.round(retryAfterMs / 1e3)}s`);
      logAvailabilityDecision({
        tool: "zizmor-gh-token",
        verdict: "unavailable",
        outcome: "transient",
        cause,
        elapsedMs: 0,
        latched: false,
        hostStallMs: 0,
        ...retryAfterMs > 0 && { retryAfterMs },
        budgetMs: GH_TOKEN_PROBE_TIMEOUT_MS,
        // No probe ran here: the latch's own remembered cause is replayed
        // as-is, so the call site is the one asserting it (#2209).
        classifiedBy: "caller"
      });
    }
    return memo ? cachedToken : void 0;
  }
  cachedToken = await deriveGhCliToken(consumer);
  return cachedToken;
}

// dist/clients/installer/index.js
var _installerRequire = createRequire(import.meta.url);
var TOOLS_DIR = path3.join(getGlobalPiLensDir(), "tools");
var INSTALL_LOCK_PATH = path3.join(TOOLS_DIR, ".install.lock");
var INSTALL_LOCK_GENERATIONS = `${INSTALL_LOCK_PATH}s`;
var activeInstallLocks = /* @__PURE__ */ new Set();
var installLockExitCleanupRegistered = false;
function getManagedToolsDir() {
  return TOOLS_DIR;
}
function isProcessAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === "EPERM";
  }
}
function installLockMaxAgeMs() {
  return (Number(process.env.PI_LENS_INSTALL_TIMEOUT_MS) || 12e4) + 6e4;
}
function legacyInstallLockIsStale(maxAgeMs) {
  try {
    const owner = JSON.parse(readFileSync2(INSTALL_LOCK_PATH, "utf8"));
    const expired = Number.isFinite(owner.createdAt) && Date.now() - owner.createdAt > maxAgeMs;
    return expired || Number.isInteger(owner.pid) && owner.pid > 0 && !isProcessAlive(owner.pid);
  } catch {
    try {
      return Date.now() - statSync(INSTALL_LOCK_PATH).mtimeMs > maxAgeMs;
    } catch {
      return false;
    }
  }
}
function createLegacyInstallLock(token) {
  try {
    writeFileSync(INSTALL_LOCK_PATH, token, { flag: "wx" });
    return true;
  } catch (cause) {
    if (isLockContention(cause))
      return false;
    throw cause;
  }
}
function takeLegacyInstallLock(maxAgeMs, token) {
  if (createLegacyInstallLock(token))
    return true;
  if (!legacyInstallLockIsStale(maxAgeMs))
    return false;
  try {
    unlinkSync(INSTALL_LOCK_PATH);
  } catch {
    return false;
  }
  return createLegacyInstallLock(token);
}
function installLockOwner() {
  try {
    const owner = JSON.parse(readFileSync2(INSTALL_LOCK_PATH, "utf8"));
    return `pid=${owner.pid} createdAt=${owner.createdAt}`;
  } catch {
    return "unknown owner";
  }
}
function tryAcquireInstallLock(maxAgeMs) {
  const hold = tryAcquireGeneration(INSTALL_LOCK_GENERATIONS, maxAgeMs);
  if (!hold)
    return "busy";
  if (hold.tookOverStale)
    recordGenerationTakeover(hold);
  const heartbeat = startGenerationHeartbeat(hold, heartbeatIntervalMs(maxAgeMs));
  const token = JSON.stringify({
    pid: process.pid,
    createdAt: Date.now(),
    nonce: randomUUID()
  });
  let took;
  try {
    took = takeLegacyInstallLock(maxAgeMs, token);
  } catch (cause) {
    heartbeat.stop();
    releaseGeneration(hold);
    throw cause;
  }
  if (took)
    return { generation: hold, token, heartbeat };
  heartbeat.stop();
  releaseGeneration(hold);
  return "legacy-held";
}
function releaseInstallLock(hold) {
  activeInstallLocks.delete(hold);
  hold.heartbeat.stop();
  try {
    if (readFileSync2(INSTALL_LOCK_PATH, "utf8") === hold.token)
      unlinkSync(INSTALL_LOCK_PATH);
  } catch {
  }
  releaseGeneration(hold.generation);
}
async function acquireInstallLock() {
  const timeoutMs = Number(process.env.PI_LENS_INSTALL_LOCK_TIMEOUT_MS) || 15e4;
  const deadline = Date.now() + timeoutMs;
  const maxAgeMs = installLockMaxAgeMs();
  let legacyHeldRecorded = false;
  while (Date.now() < deadline) {
    const hold = tryAcquireInstallLock(maxAgeMs);
    if (hold === "legacy-held" && !legacyHeldRecorded) {
      legacyHeldRecorded = true;
      recordLegacyLockHeld(INSTALL_LOCK_PATH);
    }
    if (typeof hold === "object") {
      activeInstallLocks.add(hold);
      if (!installLockExitCleanupRegistered) {
        installLockExitCleanupRegistered = true;
        process.once("exit", () => {
          for (const held of activeInstallLocks)
            releaseInstallLock(held);
        });
      }
      let released = false;
      return {
        release: async () => {
          if (released)
            return;
          released = true;
          releaseInstallLock(hold);
        },
        ownsLock: () => ownsTopGeneration(hold.generation)
      };
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return {
    reason: `timed out after ${timeoutMs}ms waiting for shared tools install lock (${installLockOwner()})`
  };
}
var GITHUB_BIN_DIR = path3.join(getGlobalPiLensDir(), "bin");
var DEBUG = process.env.PI_LENS_DEBUG === "1" || process.argv.includes("--debug");
function installerPlatform() {
  const override = process.env.PI_LENS_TEST_PLATFORM;
  if (override === "win32" || override === "linux") {
    return override;
  }
  return process.platform;
}
function debugLog(...args) {
  if (DEBUG) {
    logExtension({
      subsystem: "auto-install",
      level: "debug",
      message: args.map((arg) => typeof arg === "string" ? arg : JSON.stringify(arg)).join(" ")
    });
  }
}
function archAssetMatch(table) {
  return (platform, arch) => {
    if (arch !== "x64" && arch !== "arm64")
      return void 0;
    return table[platform]?.[arch];
  };
}
var OS_ARCH_ZIP_ASSETS = {
  linux: { x64: "linux_amd64.zip", arm64: "linux_arm64.zip" },
  darwin: { x64: "darwin_amd64.zip", arm64: "darwin_arm64.zip" },
  win32: { x64: "windows_amd64.zip", arm64: "windows_arm64.zip" }
};
function managedPackageFormatterTool(spec) {
  return {
    id: spec.id,
    name: spec.name,
    checkCommand: spec.id,
    checkArgs: ["--version"],
    installStrategy: spec.installStrategy,
    packageName: spec.packageName,
    binaryName: spec.id
  };
}
var MANAGED_PACKAGE_FORMATTERS = [
  { id: "black", name: "Black", installStrategy: "pip", packageName: "black" },
  {
    id: "cmake-format",
    name: "cmake-format",
    installStrategy: "pip",
    // The `yaml` EXTRA, never the bare distribution (#3312). cmakelang reads a
    // `.cmake-format.yaml` project config through `import yaml`, and upstream
    // puts PyYAML behind an extra: cmakelang 0.6.13's PyPI metadata declares
    // `pyyaml (>=5.3) ; extra == 'yaml'`. A bare install still answers
    // `cmake-format --version` with status 0 and then dies with
    // `ModuleNotFoundError: No module named 'yaml'` on the first YAML config —
    // the nightly's red cmake row. Every rung of the pip ladder passes this
    // string verbatim to pip/pipx, which both accept the `pkg[extra]` spec.
    packageName: "cmakelang[yaml]"
  },
  { id: "oxfmt", name: "oxfmt", installStrategy: "npm", packageName: "oxfmt" }
];
function managedGitHubFormatterTool(spec) {
  return {
    id: spec.id,
    name: spec.name,
    checkCommand: spec.id,
    checkArgs: ["--version"],
    installStrategy: "github",
    binaryName: spec.id,
    github: {
      repo: `${spec.owner}/${spec.repo}`,
      assetMatch: spec.assetPattern,
      ...spec.binaryInArchive && { binaryInArchive: spec.binaryInArchive },
      ...spec.kind === "phar" && { launcher: "php" },
      ...spec.kind === "jar" && { launcher: "java" }
    }
  };
}
var MANAGED_GITHUB_FORMATTERS = [
  {
    id: "typstyle",
    name: "typstyle",
    owner: "typstyle-rs",
    repo: "typstyle",
    assetPattern: archAssetMatch({
      linux: {
        x64: "typstyle-x86_64-unknown-linux-gnu",
        arm64: "typstyle-aarch64-unknown-linux-gnu"
      },
      darwin: {
        x64: "typstyle-x86_64-apple-darwin",
        arm64: "typstyle-aarch64-apple-darwin"
      },
      win32: {
        x64: "typstyle-x86_64-pc-windows-msvc.exe",
        arm64: "typstyle-aarch64-pc-windows-msvc.exe"
      }
    }),
    kind: "binary"
  },
  {
    id: "stylua",
    name: "StyLua",
    owner: "JohnnyMorganz",
    repo: "StyLua",
    assetPattern: archAssetMatch({
      linux: { x64: "linux-x86_64.zip", arm64: "linux-aarch64.zip" },
      darwin: { x64: "macos-x86_64.zip", arm64: "macos-aarch64.zip" },
      win32: { x64: "windows-x86_64.zip" }
    }),
    kind: "binary",
    binaryInArchive: "stylua"
  },
  {
    id: "php-cs-fixer",
    name: "PHP CS Fixer",
    owner: "PHP-CS-Fixer",
    repo: "PHP-CS-Fixer",
    assetPattern: (platform) => platform === "linux" || platform === "darwin" || platform === "win32" ? "php-cs-fixer.phar" : void 0,
    kind: "phar"
  },
  {
    id: "cljfmt",
    name: "cljfmt",
    owner: "weavejester",
    repo: "cljfmt",
    assetPattern: (platform, arch) => {
      if (platform === "linux")
        return arch === "arm64" ? "standalone.jar" : "linux-amd64-static.tar.gz";
      if (platform === "darwin")
        return "standalone.jar";
      if (platform === "win32")
        return "win-amd64.zip";
      return void 0;
    },
    kind: "jar",
    binaryInArchive: "cljfmt"
  }
];
var MANAGED_MAVEN_FORMATTERS = [
  {
    id: "google-java-format",
    name: "google-java-format",
    groupId: "com.google.googlejavaformat",
    artifactId: "google-java-format",
    version: "1.27.0",
    classifier: "all-deps"
  }
];
function managedMavenFormatterTool(spec) {
  return {
    id: spec.id,
    name: spec.name,
    checkCommand: spec.id,
    checkArgs: ["--version"],
    installStrategy: "maven",
    binaryName: spec.id,
    maven: {
      groupId: spec.groupId,
      artifactId: spec.artifactId,
      version: spec.version,
      classifier: spec.classifier
    }
  };
}
var TOOLS = [
  // Core LSP servers
  {
    id: "typescript-language-server",
    name: "TypeScript Language Server",
    checkCommand: "typescript-language-server",
    checkArgs: ["--version"],
    installStrategy: "npm",
    // Pinned below the package's own floor: 6.0.0 declares
    // engines.node >=22.22.2, above the pi host's own floor (pi-lens
    // must never require more than pi does — #2633) — an unpinned
    // install here resolves latest and prints EBADENGINE on any pi
    // host's supported Node. 5.3.0's own floor is engines.node >=20.
    packageName: "typescript-language-server@5.3.0",
    binaryName: "typescript-language-server"
  },
  {
    id: "typescript",
    name: "TypeScript",
    checkCommand: "tsc",
    checkArgs: ["--version"],
    installStrategy: "npm",
    // The managed compiler serves the classic typescript-language-server
    // fallback. TypeScript 7 removed lib/tsserver.js and is selected only from
    // project-local installs through the native `tsc --lsp --stdio` path.
    // Revisit when typescript-language-server supports TS 7 — refs #1436.
    packageName: "typescript@5.9.3",
    binaryName: "tsc"
  },
  {
    id: "pyright",
    name: "Pyright",
    checkCommand: "pyright",
    checkArgs: ["--version"],
    installStrategy: "npm",
    packageName: "pyright",
    binaryName: "pyright"
  },
  // Linting/formatting tools
  {
    id: "prettier",
    name: "Prettier",
    checkCommand: "prettier",
    checkArgs: ["--version"],
    installStrategy: "npm",
    packageName: "prettier",
    binaryName: "prettier"
  },
  ...MANAGED_PACKAGE_FORMATTERS.map(managedPackageFormatterTool),
  {
    id: "ruff",
    name: "Ruff",
    checkCommand: "ruff",
    checkArgs: ["--version"],
    installStrategy: "pip",
    packageName: "ruff",
    binaryName: "ruff"
  },
  {
    // Alternate Python LSP (fallback when pyright/the `python` server is
    // unavailable or disabled). Used as a managedToolId by PythonJediServer.
    id: "jedi-language-server",
    name: "Jedi Language Server",
    checkCommand: "jedi-language-server",
    checkArgs: ["--version"],
    installStrategy: "pip",
    packageName: "jedi-language-server",
    binaryName: "jedi-language-server"
  },
  {
    id: "biome",
    name: "Biome",
    checkCommand: "biome",
    checkArgs: ["--version"],
    installStrategy: "npm",
    packageName: "@biomejs/biome",
    binaryName: "biome",
    platformPackage: {
      base: "@biomejs/cli",
      suffixes: {
        "linux-x64": "linux-x64",
        "linux-arm64": "linux-arm64",
        "darwin-x64": "darwin-x64",
        "darwin-arm64": "darwin-arm64",
        "win32-x64": "win32-x64",
        "win32-arm64": "win32-arm64"
      },
      binaries: ["biome"]
    }
  },
  // Analysis tools (run at session start / turn end)
  {
    id: "madge",
    name: "Madge",
    checkCommand: "madge",
    checkArgs: ["--version"],
    installStrategy: "npm",
    packageName: "madge",
    binaryName: "madge"
  },
  {
    id: "jscpd",
    name: "jscpd",
    checkCommand: "jscpd",
    checkArgs: ["--version"],
    installStrategy: "npm",
    packageName: "jscpd@5.4.0",
    // v5.4.0 is the repository's exact devDependency; the v4 packaging defect that required the older v5.0.12 pin is gone, and parseReport() reads the unchanged clone-report fields.
    binaryName: "jscpd"
  },
  // Structural search and dead code detection
  {
    id: "ast-grep",
    name: "ast-grep CLI",
    checkCommand: "ast-grep",
    checkArgs: ["--version"],
    installStrategy: "npm",
    packageName: "@ast-grep/cli",
    binaryName: "ast-grep",
    platformPackage: {
      suffixes: {
        "linux-x64": "linux-x64-gnu",
        "linux-arm64": "linux-arm64-gnu",
        "darwin-x64": "darwin-x64",
        "darwin-arm64": "darwin-arm64",
        "win32-x64": "win32-x64-msvc",
        "win32-arm64": "win32-arm64-msvc",
        "win32-ia32": "win32-ia32-msvc"
      },
      binaries: ["ast-grep", "sg"]
    }
  },
  {
    id: "knip",
    name: "Knip",
    checkCommand: "knip",
    checkArgs: ["--version"],
    installStrategy: "npm",
    packageName: "knip",
    binaryName: "knip"
  },
  {
    id: "yamllint",
    name: "yamllint",
    checkCommand: "yamllint",
    checkArgs: ["--version"],
    installStrategy: "pip",
    packageName: "yamllint",
    binaryName: "yamllint"
  },
  {
    id: "sqlfluff",
    name: "sqlfluff",
    checkCommand: "sqlfluff",
    checkArgs: ["--version"],
    installStrategy: "pip",
    packageName: "sqlfluff",
    binaryName: "sqlfluff"
  },
  {
    id: "bash-language-server",
    name: "Bash Language Server",
    checkCommand: "bash-language-server",
    checkArgs: ["--version"],
    // The #2188 sweep measured a 9,667ms cold `--version` start with closed
    // stdin — close enough to the 10s installer default that modest host
    // contention pushes it over and emits a false verification degradation.
    // 20s gives the same kind of headroom Vue's 30s bound gives its own
    // slower cold start (#2176), without inventing a shared literal (#2194).
    verificationTimeoutMs: 2e4,
    installStrategy: "npm",
    packageName: "bash-language-server",
    binaryName: "bash-language-server"
  },
  {
    id: "fish-lsp",
    name: "Fish Language Server",
    checkCommand: "fish-lsp",
    checkArgs: ["--version"],
    installStrategy: "npm",
    packageName: "fish-lsp",
    binaryName: "fish-lsp"
  },
  {
    id: "cmake-language-server",
    name: "CMake Language Server",
    checkCommand: "cmake-language-server",
    checkArgs: ["--version"],
    installStrategy: "pip",
    packageName: "cmake-language-server",
    binaryName: "cmake-language-server",
    // Upstream 0.1.11 (the latest release) imports `LanguageServer` from
    // `pygls.server`, a symbol pygls 2 removed, while declaring only
    // `pygls>=1.1.1` — so an unconstrained install resolves pygls 2.1.1 and
    // produces a launcher that cannot start. Measured against PyPI for the
    // nightly's interpreter (#3311): `pip download --python-version 3.12
    // cmake-language-server` → `pygls-2.1.1`; with this constraint →
    // `pygls-1.3.1` + `lsprotocol-2023.0.1`, and `cmake-language-server
    // --version` then prints `cmake-language-server 0.1.11` and exits 0.
    pipConstraints: ["pygls<2"]
  },
  {
    id: "yaml-language-server",
    name: "YAML Language Server",
    checkCommand: "yaml-language-server",
    checkArgs: ["--version"],
    installStrategy: "npm",
    packageName: "yaml-language-server",
    binaryName: "yaml-language-server"
  },
  {
    id: "vscode-json-language-server",
    name: "VSCode JSON Language Server",
    checkCommand: "vscode-json-language-server",
    checkArgs: ["--version"],
    // The #2188 sweep measured an 11,047ms cold `--version` start with closed
    // stdin — over the 10s installer default, so a cold or contended host can
    // see a false verification degradation before the binary ever answers.
    // 20s mirrors the bash-language-server bound above (#2194).
    verificationTimeoutMs: 2e4,
    installStrategy: "npm",
    packageName: "vscode-langservers-extracted",
    binaryName: "vscode-json-language-server"
  },
  {
    id: "vscode-html-languageserver-bin",
    name: "VSCode HTML Language Server",
    checkCommand: "vscode-html-language-server",
    checkArgs: ["--version"],
    installStrategy: "npm",
    packageName: "vscode-langservers-extracted",
    binaryName: "vscode-html-language-server"
  },
  {
    id: "htmlhint",
    name: "HTMLHint",
    checkCommand: "htmlhint",
    checkArgs: ["--version"],
    installStrategy: "npm",
    packageName: "htmlhint",
    binaryName: "htmlhint"
  },
  {
    id: "hadolint",
    name: "Hadolint",
    checkCommand: "hadolint",
    checkArgs: ["--version"],
    installStrategy: "github",
    binaryName: "hadolint",
    github: {
      repo: "hadolint/hadolint",
      assetMatch: (platform, arch) => {
        if (platform === "linux")
          return arch === "arm64" ? "linux.aarch64" : "linux.x86_64";
        if (platform === "darwin")
          return arch === "arm64" ? "macos-arm64" : "macos-x86_64";
        if (platform === "win32")
          return "windows-x86_64.exe";
        return void 0;
      }
    }
  },
  {
    id: "helm",
    name: "Helm",
    checkCommand: "helm",
    // intended: version --short — unverified against real binary (shape 16), do not wire until probed
    checkArgs: ["--version"],
    installStrategy: "github",
    binaryName: "helm",
    github: {
      repo: "helm/helm",
      assetMatch: (platform, arch) => {
        const cpu = arch === "arm64" ? "arm64" : "amd64";
        if (platform === "linux")
          return `linux-${cpu}.tar.gz`;
        if (platform === "darwin")
          return `darwin-${cpu}.tar.gz`;
        if (platform === "win32")
          return `windows-${cpu}.zip`;
        return void 0;
      },
      // Release archives nest the executable under an OS/arch directory;
      // the installer searches recursively and adds the Windows suffix.
      binaryInArchive: "helm"
    }
  },
  {
    // Opengrep: a single standalone binary per platform on GitHub releases —
    // no login, no telemetry (the reason for switching off Semgrep, #111).
    id: "opengrep",
    name: "Opengrep",
    checkCommand: "opengrep",
    checkArgs: ["--version"],
    installStrategy: "github",
    binaryName: "opengrep",
    github: {
      repo: "opengrep/opengrep",
      assetMatch: (platform, arch) => {
        if (platform === "linux")
          return arch === "arm64" ? "opengrep_manylinux_aarch64" : "opengrep_manylinux_x86";
        if (platform === "darwin")
          return arch === "arm64" ? "opengrep_osx_arm64" : "opengrep_osx_x86";
        if (platform === "win32")
          return "opengrep_windows_x86.exe";
        return void 0;
      }
    }
  },
  {
    id: "vscode-css-languageserver",
    name: "VSCode CSS Language Server",
    checkCommand: "vscode-css-language-server",
    checkArgs: ["--version"],
    installStrategy: "npm",
    packageName: "vscode-langservers-extracted",
    binaryName: "vscode-css-language-server"
  },
  {
    id: "dockerfile-language-server-nodejs",
    name: "Dockerfile Language Server",
    checkCommand: "docker-langserver",
    checkArgs: ["--version"],
    installStrategy: "npm",
    packageName: "dockerfile-language-server-nodejs",
    binaryName: "docker-langserver"
  },
  {
    // #2722: intelephense has no CLI — its entry calls createConnection()
    // unconditionally — and Node prints the offending source line before the
    // error. The bundle is one ~4 MB minified line, so the transport-required
    // marker #208 rescues on lands at byte 4,154,741 of a 4,423,356-byte
    // stderr while Node truncates piped stderr at 1 MiB on exit. Measured on
    // intelephense@1.18.5, linux, Node v22.22.1:
    //   $ intelephense --version 2>&1 | wc -c              -> 1048576
    //   $ intelephense --version 2>&1 | grep -c "Connection input stream is not set" -> 0
    //   $ intelephense --version 2>err.txt; wc -c < err.txt -> 4423356
    // Same run over the alternatives, each with stdin closed the way
    // verifyToolBinary closes it (`input: ""`):
    //   --help, -v, --socket=0 -> identical dump (exit 1, 4423356 bytes,
    //     marker at 4154741, 1048576 through a pipe, marker absent)
    //   --stdio                -> exit 1 with ZERO bytes on either stream,
    //     so it carries no marker to rescue on either.
    // No checkArgs value produces a verdict. Verified spawn-free instead.
    id: "intelephense",
    name: "Intelephense",
    checkCommand: "intelephense",
    checkArgs: ["--version"],
    verification: "package-entry",
    installStrategy: "npm",
    packageName: "intelephense",
    binaryName: "intelephense"
  },
  {
    id: "@prisma/language-server",
    name: "Prisma Language Server",
    checkCommand: "prisma-language-server",
    checkArgs: ["--version"],
    // #2169: a real closed-stdin cold run measured 27,265ms, and a warm-cache
    // rerun still took 9,860ms — well past the 10s installer default. 40s
    // keeps the same margin-over-worst-observed ratio Vue's 30s bound uses
    // (#2176) rather than trimming it for a slower binary.
    verificationTimeoutMs: 4e4,
    installStrategy: "npm",
    packageName: "@prisma/language-server",
    binaryName: "prisma-language-server"
  },
  {
    id: "@vue/language-server",
    name: "Vue Language Server",
    checkCommand: "vue-language-server",
    checkArgs: ["--version"],
    // Vue's launcher loads the full language-service bundle before answering
    // --version. Its cold start exceeds the dispatch probe budget on some hosts
    // even though warm starts complete quickly (#2176).
    verificationTimeoutMs: 3e4,
    installStrategy: "npm",
    packageName: "@vue/language-server",
    binaryName: "vue-language-server"
  },
  {
    id: "svelte-language-server",
    name: "Svelte Language Server",
    checkCommand: "svelteserver",
    checkArgs: ["--version"],
    // #2169: a real closed-stdin cold run measured 12,410ms — over the 10s
    // installer default, matching the bash/JSON class of false verification
    // degradation from a cold-cache host (#2194). 20s mirrors that bound.
    verificationTimeoutMs: 2e4,
    installStrategy: "npm",
    packageName: "svelte-language-server",
    binaryName: "svelteserver"
  },
  {
    id: "markdownlint",
    name: "markdownlint-cli2",
    checkCommand: "markdownlint-cli2",
    // `--version` is interpreted as a file glob by markdownlint-cli2. Use
    // stdin with globs disabled so verification cannot scan the workspace.
    checkArgs: ["--no-globs", "-"],
    installStrategy: "npm",
    packageName: "markdownlint-cli2",
    binaryName: "markdownlint-cli2"
  },
  {
    id: "mypy",
    name: "mypy",
    checkCommand: "mypy",
    checkArgs: ["--version"],
    installStrategy: "pip",
    packageName: "mypy",
    binaryName: "mypy"
  },
  {
    id: "rubocop",
    name: "RuboCop",
    checkCommand: "rubocop",
    checkArgs: ["--version"],
    installStrategy: "gem",
    packageName: "rubocop",
    binaryName: "rubocop"
  },
  {
    id: "stylelint",
    name: "Stylelint",
    checkCommand: "stylelint",
    checkArgs: ["--version"],
    installStrategy: "npm",
    packageName: "stylelint",
    binaryName: "stylelint"
  },
  {
    id: "oxlint",
    name: "Oxlint",
    checkCommand: "oxlint",
    checkArgs: ["--version"],
    installStrategy: "npm",
    packageName: "oxlint",
    binaryName: "oxlint"
  },
  // GitHub release binaries
  {
    id: "shellcheck",
    name: "ShellCheck",
    checkCommand: "shellcheck",
    checkArgs: ["--version"],
    installStrategy: "github",
    binaryName: "shellcheck",
    github: {
      repo: "koalaman/shellcheck",
      assetMatch: (platform, arch) => {
        if (platform === "linux")
          return arch === "arm64" ? "linux.aarch64.tar.xz" : "linux.x86_64.tar.xz";
        if (platform === "darwin")
          return arch === "arm64" ? "darwin.aarch64.tar.xz" : "darwin.x86_64.tar.xz";
        if (platform === "win32")
          return "zip";
        return void 0;
      },
      binaryInArchive: "shellcheck"
    }
  },
  {
    id: "shfmt",
    name: "shfmt",
    checkCommand: "shfmt",
    checkArgs: ["--version"],
    installStrategy: "github",
    binaryName: "shfmt",
    github: {
      repo: "mvdan/sh",
      assetMatch: (platform, arch) => {
        if (platform === "linux")
          return arch === "arm64" ? "linux_arm64" : "linux_amd64";
        if (platform === "darwin")
          return arch === "arm64" ? "darwin_arm64" : "darwin_amd64";
        if (platform === "win32")
          return arch === "arm64" ? "windows_arm64.exe" : "windows_amd64.exe";
        return void 0;
      }
      // bare binary, no archive
    }
  },
  ...MANAGED_GITHUB_FORMATTERS.map(managedGitHubFormatterTool),
  ...MANAGED_MAVEN_FORMATTERS.map(managedMavenFormatterTool),
  {
    id: "rust-analyzer",
    name: "rust-analyzer",
    checkCommand: "rust-analyzer",
    checkArgs: ["--version"],
    installStrategy: "github",
    binaryName: "rust-analyzer",
    github: {
      repo: "rust-lang/rust-analyzer",
      assetMatch: (platform, arch) => {
        if (platform === "linux")
          return arch === "arm64" ? "aarch64-unknown-linux-gnu.gz" : "x86_64-unknown-linux-gnu.gz";
        if (platform === "darwin")
          return arch === "arm64" ? "aarch64-apple-darwin.gz" : "x86_64-apple-darwin.gz";
        if (platform === "win32")
          return "x86_64-pc-windows-msvc.zip";
        return void 0;
      }
      // Linux/macOS: bare .gz; Windows: .zip archive containing rust-analyzer.exe
    }
  },
  {
    // Alternate JS/TS LSP (fallback when the `typescript` server is unavailable
    // or disabled — e.g. Deno projects). Used as a managedToolId by DenoServer.
    // Every platform ships a .zip containing the `deno` binary (the github
    // strategy extracts it, as it does for rust-analyzer's Windows .zip).
    id: "deno",
    name: "Deno",
    checkCommand: "deno",
    checkArgs: ["--version"],
    installStrategy: "github",
    binaryName: "deno",
    github: {
      repo: "denoland/deno",
      assetMatch: (platform, arch) => {
        if (platform === "linux")
          return arch === "arm64" ? "deno-aarch64-unknown-linux-gnu.zip" : "deno-x86_64-unknown-linux-gnu.zip";
        if (platform === "darwin")
          return arch === "arm64" ? "deno-aarch64-apple-darwin.zip" : "deno-x86_64-apple-darwin.zip";
        if (platform === "win32")
          return "deno-x86_64-pc-windows-msvc.zip";
        return void 0;
      }
    }
  },
  {
    id: "golangci-lint",
    name: "golangci-lint",
    checkCommand: "golangci-lint",
    checkArgs: ["--version"],
    installStrategy: "github",
    binaryName: "golangci-lint",
    github: {
      repo: "golangci/golangci-lint",
      assetMatch: (platform, arch) => {
        if (platform === "linux")
          return arch === "arm64" ? "linux-arm64.tar.gz" : "linux-amd64.tar.gz";
        if (platform === "darwin")
          return arch === "arm64" ? "darwin-arm64.tar.gz" : "darwin-amd64.tar.gz";
        if (platform === "win32")
          return arch === "arm64" ? "windows-arm64.zip" : "windows-amd64.zip";
        return void 0;
      },
      binaryInArchive: "golangci-lint"
    }
  },
  {
    id: "ktlint",
    name: "ktlint",
    checkCommand: "ktlint",
    checkArgs: ["--version"],
    installStrategy: "github",
    binaryName: "ktlint",
    github: {
      // ktlint ships a self-executable `ktlint` (a JAR with a shell preamble)
      // for Linux/macOS, plus a `ktlint.bat` wrapper for Windows that runs
      // `java -jar %~dp0ktlint`. On Windows BOTH files are needed: the .bat AND
      // the `ktlint` jar it wraps (#218). No arm64-specific asset.
      repo: "pinterest/ktlint",
      assetMatch: (platform, _arch) => {
        if (platform === "linux")
          return "ktlint";
        if (platform === "darwin")
          return "ktlint";
        if (platform === "win32")
          return "ktlint.bat";
        return void 0;
      },
      extraAssets: (platform) => platform === "win32" ? ["ktlint"] : []
    }
  },
  {
    // ktfmt (Meta's opinionated Kotlin formatter) ships only as a Maven-Central
    // fat JAR — no native binary, no npm package — so it uses the maven strategy
    // (#129). Run via a `java -jar` launcher; requires a JRE.
    id: "ktfmt",
    name: "ktfmt",
    checkCommand: "ktfmt",
    checkArgs: ["--version"],
    installStrategy: "maven",
    binaryName: "ktfmt",
    maven: {
      groupId: "com.facebook",
      artifactId: "ktfmt",
      version: "0.63",
      classifier: "with-dependencies"
    }
  },
  {
    // SpotBugs (bytecode bug-pattern analyzer for Java/Kotlin/Scala/Groovy)
    // ships as a distribution archive — a lib/ of many JARs + bin/ launchers,
    // NOT a runnable fat JAR — so it uses the archive strategy, not maven
    // (refs #133). Requires a JRE (gated by the runner, not the install).
    id: "spotbugs",
    name: "SpotBugs",
    checkCommand: "spotbugs",
    // intended: -version — unverified against real binary (shape 16), do not wire until probed
    checkArgs: ["--version"],
    installStrategy: "archive",
    binaryName: "spotbugs",
    archive: {
      url: "https://github.com/spotbugs/spotbugs/releases/download/4.10.2/spotbugs-4.10.2.tgz",
      kind: "tgz",
      launcher: "bin/spotbugs",
      sha256: {
        "https://github.com/spotbugs/spotbugs/releases/download/4.10.2/spotbugs-4.10.2.tgz": "63d7687c35fba12cbc8e55ec2a889a2bbf1b9be299dea91f2b0d351dc285308a"
      }
    }
  },
  {
    // kotlin-language-server (fwcd, #3400) — a platform-agnostic launcher ZIP
    // (`server/{bin,lib}`, 87 MB) whose `bin/kotlin-language-server` script
    // starts a JVM on ANY argument and has no stable `--version`, so it is
    // verified at install by manifest, not by spawn: the pinned sha256, the
    // launcher on disk with an exec bit, and `java` on PATH or JAVA_HOME before
    // the download (`verification: "tree-manifest"`). The 2025 release publishes
    // no digest, so its pin is trust-on-first-use (the hash of the download). The initialize handshake is the nightly
    // tool-smoke `kotlin` row. fwcd 1.3.13 (2025-01-18) rather than JetBrains'
    // kotlin-lsp (v263.4702.0): its CDN ships the macOS standalone archives as
    // `.sit`, which this installer's tar/unzip/Expand-Archive paths cannot
    // extract, and its six per-platform archives would need six pins.
    id: "kotlin-language-server",
    name: "Kotlin Language Server",
    checkCommand: "kotlin-language-server",
    checkArgs: ["--version"],
    installStrategy: "archive",
    binaryName: "kotlin-language-server",
    verification: "tree-manifest",
    archive: {
      url: "https://github.com/fwcd/kotlin-language-server/releases/download/1.3.13/server.zip",
      kind: "zip",
      launcher: "bin/kotlin-language-server",
      runtime: "java",
      sha256: {
        "https://github.com/fwcd/kotlin-language-server/releases/download/1.3.13/server.zip": "4fe7d71d087b307c7869036171bd9d8c6a4284cd7c25b89098b0a24eb2d9b6d2"
      }
    }
  },
  {
    // PowerShell Editor Services (#278). NOT a single binary — a multi-folder
    // PowerShell MODULE BUNDLE launched via `pwsh Start-EditorServices.ps1
    // -Stdio` (see PowerShellServer.spawn). archive TREE BUNDLE: the release zip
    // extracts sibling module dirs (PowerShellEditorServices/, PSReadLine/,
    // PSScriptAnalyzer/) at the root with no wrapping dir, so stripComponents:0
    // + no launcher — the whole tree is kept and resolved to its extract dir.
    // checkCommand "pwsh" documents the runtime but is unused for resolution
    // (tree bundles resolve only via the extract dir + treeMarker).
    id: "powershell-editor-services",
    name: "PowerShell Editor Services",
    checkCommand: "pwsh",
    checkArgs: [
      "-NoProfile",
      "-Command",
      "$PSVersionTable.PSVersion.ToString()"
    ],
    installStrategy: "archive",
    binaryName: "powershell-editor-services",
    archive: {
      url: "https://github.com/PowerShell/PowerShellEditorServices/releases/download/v4.6.0/PowerShellEditorServices.zip",
      kind: "zip",
      stripComponents: 0,
      treeMarker: "PowerShellEditorServices/Start-EditorServices.ps1",
      sha256: {
        "https://github.com/PowerShell/PowerShellEditorServices/releases/download/v4.6.0/PowerShellEditorServices.zip": "0d91898f73d4faeb64291336f6386f0c890a933df012827571adf7008480a04a"
      }
    }
  },
  {
    // clangd (C/C++/Obj-C LSP, #241) — a self-contained native TREE BUNDLE: the
    // release zip wraps `clangd_<ver>/{bin,lib}` (bin/clangd[.exe] + the bundled
    // libclang headers under lib/), so stripComponents:1 drops the version dir and
    // the whole tree is kept (no launcher). Unlike PSES there is no external
    // runtime — CppServer launches `<bundle>/bin/clangd` directly. checkCommand
    // documents the binary but is unused for resolution (tree bundles resolve only
    // via the extract dir + treeMarker). Platform-matched url: clangd ships x64
    // prebuilts; arm runs the x64 build under Rosetta/emulation (darwin/win32),
    // while linux/arm64 has no official build → undefined (graceful unavailable).
    id: "clangd",
    name: "clangd",
    checkCommand: "clangd",
    checkArgs: ["--version"],
    installStrategy: "archive",
    binaryName: "clangd",
    archive: {
      url: (platform, arch) => {
        const version = "22.1.0";
        const base = `https://github.com/clangd/clangd/releases/download/${version}`;
        if (platform === "linux")
          return arch === "x64" ? `${base}/clangd-linux-${version}.zip` : void 0;
        if (platform === "darwin")
          return `${base}/clangd-mac-${version}.zip`;
        if (platform === "win32")
          return `${base}/clangd-windows-${version}.zip`;
        return void 0;
      },
      kind: "zip",
      stripComponents: 1,
      treeMarker: "bin",
      sha256: {
        "https://github.com/clangd/clangd/releases/download/22.1.0/clangd-linux-22.1.0.zip": "c54e57dbff3ccc9e8352367ddb7030ad3f624073ec58c7477424e7919f578572",
        "https://github.com/clangd/clangd/releases/download/22.1.0/clangd-mac-22.1.0.zip": "71eddc5303da9a5bc5e8b509488b5b2c5acf45f20e33b8394e71a12a56d67198",
        "https://github.com/clangd/clangd/releases/download/22.1.0/clangd-windows-22.1.0.zip": "e31e271fe11f6dcd7cf87ca74be4a12788ff8ce5a0b07762583e335c058e939a"
      }
    }
  },
  {
    // lua-language-server (#564, split from #241) — same self-contained native
    // TREE BUNDLE shape as clangd: bin/lua-language-server[.exe] + bundled
    // locale/meta files, no external runtime. UNLIKE clangd, the release
    // archive has NO wrapping version dir (verified by inspecting the actual
    // 3.18.2 linux-x64 .tar.gz and win32-x64 .zip contents: `bin/`, `LICENSE`,
    // `locale/`, … sit at archive root) — so stripComponents:0, not 1.
    // LuaServer launches `<bundle>/bin/lua-language-server` directly.
    // checkCommand documents the binary but is unused for resolution (tree
    // bundles resolve only via the extract dir + treeMarker). Platform-matched
    // url: LuaLS publishes darwin/linux x64+arm64 and win32 x64 (no win32/arm64
    // build as of 3.18.2 → undefined, graceful unavailable); asset naming
    // verified against the live GitHub release listing, not guessed.
    id: "lua-language-server",
    name: "lua-language-server",
    checkCommand: "lua-language-server",
    checkArgs: ["--version"],
    installStrategy: "archive",
    binaryName: "lua-language-server",
    archive: {
      url: (platform, arch) => {
        const version = "3.18.2";
        const base = `https://github.com/LuaLS/lua-language-server/releases/download/${version}`;
        if (platform === "linux")
          return arch === "arm64" ? `${base}/lua-language-server-${version}-linux-arm64.tar.gz` : `${base}/lua-language-server-${version}-linux-x64.tar.gz`;
        if (platform === "darwin")
          return arch === "arm64" ? `${base}/lua-language-server-${version}-darwin-arm64.tar.gz` : `${base}/lua-language-server-${version}-darwin-x64.tar.gz`;
        if (platform === "win32")
          return arch === "arm64" ? void 0 : `${base}/lua-language-server-${version}-win32-x64.zip`;
        return void 0;
      },
      kind: (platform) => platform === "win32" ? "zip" : "tgz",
      stripComponents: 0,
      treeMarker: "bin",
      sha256: {
        "https://github.com/LuaLS/lua-language-server/releases/download/3.18.2/lua-language-server-3.18.2-linux-arm64.tar.gz": "273af33f26f4a1143f27c96d9f9e1188aba619c71e0807042134f66b4bd27f24",
        "https://github.com/LuaLS/lua-language-server/releases/download/3.18.2/lua-language-server-3.18.2-linux-x64.tar.gz": "ca71415dd19f19e30aaa35a4915aefca9fdb5fec31b98331cc3d77f778d539c5",
        "https://github.com/LuaLS/lua-language-server/releases/download/3.18.2/lua-language-server-3.18.2-darwin-arm64.tar.gz": "cec99d70b1f612acec4a10a79a03664e3aa0c229d4d8a586cb3f928ec37d509e",
        "https://github.com/LuaLS/lua-language-server/releases/download/3.18.2/lua-language-server-3.18.2-darwin-x64.tar.gz": "e26cfefe423dd7326fc7c649539e4d4aaa4f35f34d2fefd8af2ed7090b72c556",
        "https://github.com/LuaLS/lua-language-server/releases/download/3.18.2/lua-language-server-3.18.2-win32-x64.zip": "a4439a8f5e8e9e6505c11f045a7bf45db602124a1e246371c1dbe34924f3cf71"
      }
    }
  },
  {
    id: "actionlint",
    name: "actionlint",
    checkCommand: "actionlint",
    checkArgs: ["--version"],
    installStrategy: "github",
    binaryName: "actionlint",
    github: {
      repo: "rhysd/actionlint",
      assetMatch: (platform, arch) => {
        if (platform === "linux")
          return arch === "arm64" ? "linux_arm64.tar.gz" : "linux_amd64.tar.gz";
        if (platform === "darwin")
          return arch === "arm64" ? "darwin_arm64.tar.gz" : "darwin_amd64.tar.gz";
        if (platform === "win32")
          return arch === "arm64" ? "windows_arm64.zip" : "windows_amd64.zip";
        return void 0;
      },
      binaryInArchive: "actionlint"
    }
  },
  {
    // zizmor: GitHub Actions workflow security scanner that speaks LSP (#272).
    // cargo-dist release archives, one per target triple, each holding a single
    // `zizmor` binary (extracted via the recursive binary find). Online audits
    // (known-vulnerable-actions, unpinned-uses, …) need a GitHub token — the LSP
    // spawn forwards one via resolveZizmorGitHubToken (clients/zizmor-config.ts).
    id: "zizmor",
    name: "zizmor",
    checkCommand: "zizmor",
    checkArgs: ["--version"],
    installStrategy: "github",
    binaryName: "zizmor",
    github: {
      repo: "zizmorcore/zizmor",
      assetMatch: (platform, arch) => {
        if (platform === "linux")
          return arch === "arm64" ? "aarch64-unknown-linux-gnu.tar.gz" : "x86_64-unknown-linux-gnu.tar.gz";
        if (platform === "darwin")
          return arch === "arm64" ? "aarch64-apple-darwin.tar.gz" : "x86_64-apple-darwin.tar.gz";
        if (platform === "win32")
          return "x86_64-pc-windows-msvc.zip";
        return void 0;
      },
      binaryInArchive: "zizmor"
    }
  },
  {
    // typos-lsp: source-code spell checker that speaks LSP (#283). cargo-dist
    // release archives, one per target triple, each holding a single `typos-lsp`
    // binary (extracted via the recursive binary find). NO token / network — the
    // dictionary is compiled in. The binary takes no `--version` (it ignores args
    // and serves the LSP on stdin/stdout); the PATH probe ignores checkArgs and
    // verifyToolBinary runs with stdin:ignore so the server gets EOF and exits.
    id: "typos-lsp",
    name: "typos-lsp",
    checkCommand: "typos-lsp",
    checkArgs: ["--version"],
    installStrategy: "github",
    binaryName: "typos-lsp",
    github: {
      repo: "tekumara/typos-lsp",
      assetMatch: (platform, arch) => {
        if (platform === "linux")
          return arch === "arm64" ? "aarch64-unknown-linux-gnu.tar.gz" : "x86_64-unknown-linux-gnu.tar.gz";
        if (platform === "darwin")
          return arch === "arm64" ? "aarch64-apple-darwin.tar.gz" : "x86_64-apple-darwin.tar.gz";
        if (platform === "win32")
          return arch === "arm64" ? "aarch64-pc-windows-msvc.zip" : "x86_64-pc-windows-msvc.zip";
        return void 0;
      },
      binaryInArchive: "typos-lsp"
    }
  },
  {
    id: "tflint",
    name: "tflint",
    checkCommand: "tflint",
    checkArgs: ["--version"],
    installStrategy: "github",
    binaryName: "tflint",
    github: {
      repo: "terraform-linters/tflint",
      assetMatch: archAssetMatch(OS_ARCH_ZIP_ASSETS),
      binaryInArchive: "tflint"
    }
  },
  {
    // Terragrunt ships a bare native binary per platform on GitHub releases.
    // Windows arm64 uses the x64 binary through Windows' built-in emulation —
    // there is no terragrunt_windows_arm64.exe upstream.
    id: "terragrunt",
    name: "terragrunt",
    checkCommand: "terragrunt",
    checkArgs: ["--version"],
    installStrategy: "github",
    binaryName: "terragrunt",
    github: {
      repo: "gruntwork-io/terragrunt",
      assetMatch: archAssetMatch({
        linux: {
          x64: "terragrunt_linux_amd64",
          arm64: "terragrunt_linux_arm64"
        },
        darwin: {
          x64: "terragrunt_darwin_amd64",
          arm64: "terragrunt_darwin_arm64"
        },
        win32: {
          x64: "terragrunt_windows_amd64.exe",
          arm64: "terragrunt_windows_amd64.exe"
        }
      })
      // bare binary — no binaryInArchive
    }
  },
  {
    id: "gitleaks",
    name: "gitleaks",
    checkCommand: "gitleaks",
    // intended: version — unverified against real binary (shape 16), do not wire until probed
    checkArgs: ["--version"],
    installStrategy: "github",
    binaryName: "gitleaks",
    github: {
      repo: "gitleaks/gitleaks",
      // gitleaks asset naming uses `x64` not `amd64` (unlike most Go-built
      // tools). Substring match is exact-enough — release assets are
      // named e.g. `gitleaks_8.18.4_linux_x64.tar.gz`.
      assetMatch: archAssetMatch({
        linux: { x64: "linux_x64.tar.gz", arm64: "linux_arm64.tar.gz" },
        darwin: { x64: "darwin_x64.tar.gz", arm64: "darwin_arm64.tar.gz" },
        win32: { x64: "windows_x64.zip", arm64: "windows_arm64.zip" }
      }),
      binaryInArchive: "gitleaks"
    }
  },
  {
    id: "trivy",
    name: "Trivy",
    checkCommand: "trivy",
    checkArgs: ["--version"],
    installStrategy: "github",
    binaryName: "trivy",
    github: {
      repo: "aquasecurity/trivy",
      // Trivy asset naming is `trivy_<ver>_<OS>-<bits>.{tar.gz,zip}` with a
      // capitalized OS and `64bit`/`ARM64` arch tokens — e.g.
      // `trivy_0.71.2_Linux-64bit.tar.gz`, `trivy_0.71.2_macOS-ARM64.tar.gz`.
      // No windows-arm64 asset exists (win32.arm64 omitted), so (like
      // swiftlint) trivy is absent from GITHUB_TOOLS and covered by the
      // weaker "at least one platform" guard.
      assetMatch: archAssetMatch({
        linux: { x64: "Linux-64bit.tar.gz", arm64: "Linux-ARM64.tar.gz" },
        darwin: { x64: "macOS-64bit.tar.gz", arm64: "macOS-ARM64.tar.gz" },
        win32: { x64: "windows-64bit.zip" }
      }),
      binaryInArchive: "trivy"
    }
  },
  {
    id: "swiftlint",
    name: "SwiftLint",
    checkCommand: "swiftlint",
    checkArgs: ["--version"],
    installStrategy: "github",
    binaryName: "swiftlint",
    github: {
      repo: "realm/SwiftLint",
      assetMatch: (platform, arch) => {
        if (platform === "darwin")
          return "portable_swiftlint.zip";
        if (platform === "linux")
          return arch === "arm64" ? "swiftlint_linux_arm64.zip" : "swiftlint_linux_amd64.zip";
        return void 0;
      },
      binaryInArchive: "swiftlint"
    }
  },
  {
    id: "taplo",
    name: "taplo",
    checkCommand: "taplo",
    checkArgs: ["--version"],
    installStrategy: "github",
    binaryName: "taplo",
    github: {
      repo: "tamasfe/taplo",
      assetMatch: (platform, arch) => {
        if (platform === "linux")
          return arch === "arm64" ? "taplo-linux-aarch64.gz" : "taplo-linux-x86_64.gz";
        if (platform === "darwin")
          return arch === "arm64" ? "taplo-darwin-aarch64.gz" : "taplo-darwin-x86_64.gz";
        if (platform === "win32")
          return "taplo-windows-x86_64.gz";
        return void 0;
      }
    }
  },
  {
    id: "vale",
    name: "Vale",
    checkCommand: "vale",
    checkArgs: ["--version"],
    installStrategy: "github",
    binaryName: "vale",
    github: {
      repo: "vale-cli/vale",
      assetMatch: (platform, arch) => {
        const version = "3.14.2";
        if (platform === "linux")
          return arch === "arm64" ? `vale_${version}_Linux_arm64.tar.gz` : `vale_${version}_Linux_64-bit.tar.gz`;
        if (platform === "darwin")
          return arch === "arm64" ? `vale_${version}_macOS_arm64.tar.gz` : `vale_${version}_macOS_64-bit.tar.gz`;
        if (platform === "win32")
          return `vale_${version}_Windows_64-bit.zip`;
        return void 0;
      },
      binaryInArchive: "vale"
    }
  },
  {
    id: "terraform-ls",
    name: "terraform-ls",
    checkCommand: "terraform-ls",
    // intended: version — unverified against real binary (shape 16), do not wire until probed
    checkArgs: ["--version"],
    installStrategy: "github",
    binaryName: "terraform-ls",
    github: {
      repo: "hashicorp/terraform-ls",
      hashiCorpReleaseProduct: "terraform-ls",
      assetMatch: archAssetMatch(OS_ARCH_ZIP_ASSETS),
      binaryInArchive: "terraform-ls"
    }
  },
  {
    id: "zls",
    name: "zls",
    checkCommand: "zls",
    checkArgs: ["--version"],
    installStrategy: "github",
    binaryName: "zls",
    github: {
      repo: "zigtools/zls",
      assetMatch: (platform, arch) => {
        if (platform === "linux")
          return arch === "arm64" ? "aarch64-linux.tar.xz" : "x86_64-linux.tar.xz";
        if (platform === "darwin")
          return arch === "arm64" ? "aarch64-macos.tar.xz" : "x86_64-macos.tar.xz";
        if (platform === "win32")
          return arch === "arm64" ? "aarch64-windows.zip" : "x86_64-windows.zip";
        return void 0;
      },
      binaryInArchive: "zls"
    }
  },
  {
    // clojure-lsp ships a self-contained native (GraalVM) binary per platform
    // on GitHub releases — no JVM needed. Used as managedToolId by ClojureServer.
    // The .zip carries the bare binary (located recursively on extract).
    id: "clojure-lsp",
    name: "clojure-lsp",
    checkCommand: "clojure-lsp",
    checkArgs: ["--version"],
    installStrategy: "github",
    binaryName: "clojure-lsp",
    github: {
      repo: "clojure-lsp/clojure-lsp",
      assetMatch: (platform, arch) => {
        if (platform === "linux")
          return arch === "arm64" ? "native-linux-aarch64.zip" : "native-linux-amd64.zip";
        if (platform === "darwin")
          return arch === "arm64" ? "native-macos-aarch64.zip" : "native-macos-amd64.zip";
        if (platform === "win32")
          return "native-windows-amd64.zip";
        return void 0;
      },
      binaryInArchive: "clojure-lsp"
    }
  },
  {
    // CUE ships a single native binary per platform on GitHub releases;
    // the LSP runs via `cue lsp serve`. Used as managedToolId by CueServer.
    id: "cue",
    name: "CUE",
    checkCommand: "cue",
    // Probed locally with CUE v0.17.1: `cue version` exits 0.
    checkArgs: ["version"],
    installStrategy: "github",
    binaryName: "cue",
    github: {
      repo: "cue-lang/cue",
      assetMatch: (platform, arch) => {
        if (platform === "linux")
          return arch === "arm64" ? "linux_arm64.tar.gz" : "linux_amd64.tar.gz";
        if (platform === "darwin")
          return arch === "arm64" ? "darwin_arm64.tar.gz" : "darwin_amd64.tar.gz";
        if (platform === "win32")
          return arch === "arm64" ? "windows_arm64.zip" : "windows_amd64.zip";
        return void 0;
      },
      binaryInArchive: "cue"
    }
  },
  {
    // gleam ships a single static binary per platform on GitHub releases; the
    // LSP runs via `gleam lsp`. Used as managedToolId by GleamServer. The linux
    // build is a FLAT musl tarball (a bare `gleam`), handled by the recursive
    // tar-binary lookup in installGitHubTool.
    id: "gleam",
    name: "Gleam",
    checkCommand: "gleam",
    checkArgs: ["--version"],
    installStrategy: "github",
    binaryName: "gleam",
    github: {
      repo: "gleam-lang/gleam",
      assetMatch: (platform, arch) => {
        if (platform === "linux")
          return arch === "arm64" ? "aarch64-unknown-linux-musl.tar.gz" : "x86_64-unknown-linux-musl.tar.gz";
        if (platform === "darwin")
          return arch === "arm64" ? "aarch64-apple-darwin.tar.gz" : "x86_64-apple-darwin.tar.gz";
        if (platform === "win32")
          return arch === "arm64" ? "aarch64-pc-windows-msvc.zip" : "x86_64-pc-windows-msvc.zip";
        return void 0;
      },
      binaryInArchive: "gleam"
    }
  },
  {
    // Tinymist publishes cargo-dist archives containing the `tinymist` binary
    // for the supported desktop targets. The LSP server uses `tinymist lsp`.
    id: "tinymist",
    name: "Tinymist",
    checkCommand: "tinymist",
    checkArgs: ["--version"],
    installStrategy: "github",
    binaryName: "tinymist",
    github: {
      repo: "Myriad-Dreamin/tinymist",
      assetMatch: archAssetMatch({
        linux: {
          x64: "tinymist-x86_64-unknown-linux-gnu.tar.gz",
          arm64: "tinymist-aarch64-unknown-linux-gnu.tar.gz"
        },
        darwin: {
          x64: "tinymist-x86_64-apple-darwin.tar.gz",
          arm64: "tinymist-aarch64-apple-darwin.tar.gz"
        },
        win32: {
          x64: "tinymist-x86_64-pc-windows-msvc.zip",
          arm64: "tinymist-aarch64-pc-windows-msvc.zip"
        }
      }),
      binaryInArchive: "tinymist"
    }
  },
  {
    // marksman ships a single BARE (uncompressed) binary per platform on GitHub
    // releases — no archive, so it lands via the bare-binary branch of
    // installGitHubTool (the `else` that writes the asset directly, like shfmt).
    // Used as managedToolId by MarksmanServer; LSP entrypoint is `marksman
    // server` (stdio). macOS ships a universal binary; Windows has only x64
    // (runs on arm64 via emulation) — so all six platform/arch combos resolve.
    id: "marksman",
    name: "Marksman",
    checkCommand: "marksman",
    checkArgs: ["--version"],
    installStrategy: "github",
    binaryName: "marksman",
    github: {
      repo: "artempyanykh/marksman",
      assetMatch: (platform, arch) => {
        if (platform === "linux")
          return arch === "arm64" ? "marksman-linux-arm64" : "marksman-linux-x64";
        if (platform === "darwin")
          return "marksman-macos";
        if (platform === "win32")
          return "marksman.exe";
        return void 0;
      }
      // bare binary — no binaryInArchive
    }
  },
  {
    // Expert ships a bare native binary per platform on GitHub releases. Its
    // `--stdio` flag is required to start the LSP transport. Windows arm64 uses
    // the x64 binary through Windows' built-in x64 emulation.
    id: "expert",
    name: "Expert",
    checkCommand: "expert",
    checkArgs: ["--version"],
    installStrategy: "github",
    binaryName: "expert",
    github: {
      repo: "expert-lsp/expert",
      assetMatch: (platform, arch) => {
        if (arch !== "x64" && arch !== "arm64")
          return void 0;
        if (platform === "linux")
          return arch === "arm64" ? "expert_linux_arm64" : "expert_linux_amd64";
        if (platform === "darwin")
          return arch === "arm64" ? "expert_darwin_arm64" : "expert_darwin_amd64";
        if (platform === "win32")
          return "expert_windows_amd64.exe";
        return void 0;
      }
      // bare binary — no binaryInArchive
    }
  }
];
function getToolVerificationTimeout(tool) {
  return tool.verificationTimeoutMs ?? 1e4;
}
var ensureInFlight = /* @__PURE__ */ new Map();
var installFailureReasons = /* @__PURE__ */ new Map();
function getInstallFailureReason(toolId) {
  return installFailureReasons.get(toolId);
}
var installAttempts = /* @__PURE__ */ new Map();
function noteInstallAttempt(toolId, outcome, reason) {
  installAttempts.set(toolId, { outcome, reason, at: Date.now() });
}
function noteInstallAttemptIfUnrecorded(toolId, outcome, reason) {
  if (installAttempts.has(toolId))
    return;
  noteInstallAttempt(toolId, outcome, reason);
}
function getInstallAttempt(toolId) {
  return installAttempts.get(toolId);
}
var lastEnsureResolutionSource = /* @__PURE__ */ new Map();
function getLastEnsureResolutionSource(toolId) {
  return lastEnsureResolutionSource.get(toolId);
}
var resolvedPathCache = new BoundedLruCache(256);
function resetResolvedPathCache() {
  resolvedPathCache.clear();
}
var PROBE_CACHE_PATH = path3.join(getGlobalPiLensDir(), "probe-cache.json");
var PROBE_CACHE_LOCK_STALE_MS = 18e4;
var PROBE_CACHE_TTL_MS = 24 * 60 * 60 * 1e3;
var PROBE_CACHE_TRANSIENT_COOLDOWN_MS = TRANSIENT_MAX_COOLDOWN_MS;
var PROBE_CACHE_FLUSH_LOCK_WAIT_MS = 250;
var PROBE_CACHE_FLUSH_RETRY_DELAY_MS = 300;
var PROBE_CACHE_FLUSH_RETRY_MAX_DELAY_MS = 3e4;
var _probeCache = null;
var _probeCacheDirty = false;
var _probeCacheFlushTimer = null;
var _probeCacheWriteInFlight = null;
var _probeCacheRetryAttempt = 0;
var _probeCacheChangeGeneration = 0;
var _probeCacheChanges = /* @__PURE__ */ new Map();
var _probeCacheChangeVersions = /* @__PURE__ */ new Map();
async function readProbeCache() {
  if (_probeCache !== null)
    return _probeCache;
  try {
    const raw = await fs2.readFile(PROBE_CACHE_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("probe-cache root is not an object");
    }
    _probeCache = parsed;
  } catch (err) {
    const code = err?.code;
    if (code !== "ENOENT") {
      logSessionStart(`auto-install probe-cache: read failed (${code ?? "invalid"}); treating cache as unavailable`);
    }
    _probeCache = {};
  }
  return _probeCache;
}
function markProbeCacheChange(toolId, entry) {
  _probeCacheChanges.set(toolId, entry);
  _probeCacheChangeVersions.set(toolId, ++_probeCacheChangeGeneration);
  _probeCacheDirty = true;
  scheduleProbeFlush();
}
function scheduleProbeFlush(delayMs = PROBE_CACHE_FLUSH_RETRY_DELAY_MS) {
  if (_probeCacheFlushTimer !== null)
    return;
  _probeCacheFlushTimer = setTimeout(() => {
    void flushProbeCache();
  }, delayMs);
  _probeCacheFlushTimer.unref?.();
}
function scheduleProbeFlushRetry() {
  const delay = Math.min(PROBE_CACHE_FLUSH_RETRY_MAX_DELAY_MS, PROBE_CACHE_FLUSH_RETRY_DELAY_MS * 2 ** Math.min(_probeCacheRetryAttempt, 6));
  _probeCacheRetryAttempt += 1;
  scheduleProbeFlush(delay);
}
function snapshotProbeCacheChanges() {
  return {
    changes: new Map(_probeCacheChanges),
    versions: new Map(_probeCacheChangeVersions)
  };
}
function deserializeProbeCache(contents) {
  if (contents === void 0)
    return {};
  try {
    const parsed = JSON.parse(contents);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("probe-cache root is not an object");
    }
    return parsed;
  } catch (err) {
    logSessionStart(`auto-install probe-cache: write-side read was corrupt (${err.message}); recovering as empty`);
    return {};
  }
}
function applyProbeCacheChanges(disk, changes) {
  for (const [toolId, entry] of changes) {
    if (entry === null)
      delete disk[toolId];
    else
      disk[toolId] = entry;
  }
}
function ageProbeCache(disk) {
  const now = Date.now();
  for (const [toolId, entry] of Object.entries(disk)) {
    const ttl = entry.transient ? PROBE_CACHE_TRANSIENT_COOLDOWN_MS : PROBE_CACHE_TTL_MS;
    if (!Number.isFinite(entry.cachedAt) || entry.cachedAt < now - ttl) {
      delete disk[toolId];
    }
  }
}
function publishProbeCacheWrite(disk, snapshotVersions) {
  const pendingAfterWrite = new Map(_probeCacheChanges);
  _probeCache = disk;
  for (const [toolId, entry] of pendingAfterWrite) {
    if (entry === null)
      delete _probeCache[toolId];
    else
      _probeCache[toolId] = entry;
  }
  for (const [toolId, version] of snapshotVersions) {
    if (_probeCacheChangeVersions.get(toolId) === version) {
      _probeCacheChanges.delete(toolId);
      _probeCacheChangeVersions.delete(toolId);
    }
  }
  _probeCacheDirty = _probeCacheChanges.size > 0;
  _probeCacheRetryAttempt = 0;
  return _probeCacheDirty ? "written-with-pending" : "written";
}
async function writeProbeCache() {
  try {
    const { changes, versions } = snapshotProbeCacheChanges();
    let result = "written";
    const committed = await commitDurableStoreAsync({
      path: PROBE_CACHE_PATH,
      deserialize: deserializeProbeCache,
      merge: (disk) => {
        ageProbeCache(disk);
        applyProbeCacheChanges(disk, changes);
        return disk;
      },
      serialize: (disk) => JSON.stringify(disk, null, 2),
      waitMs: PROBE_CACHE_FLUSH_LOCK_WAIT_MS,
      retryMs: 25,
      staleMs: PROBE_CACHE_LOCK_STALE_MS,
      timeoutMessage: "Timed out waiting for probe-cache lock",
      onContention: "skip-log",
      logContention: () => {
        logSessionStart("auto-install probe-cache: flush deferred because another process owns the lock");
      },
      afterWriteLocked: (disk) => {
        result = publishProbeCacheWrite(disk, versions);
      }
    });
    if (committed === void 0) {
      scheduleProbeFlushRetry();
      return "deferred";
    }
    return result;
  } catch (err) {
    logSessionStart(`auto-install probe-cache: flush failed (${err?.code ?? "write error"}); pending update retained`);
    scheduleProbeFlushRetry();
    return "failed";
  }
}
async function flushProbeCache() {
  if (_probeCacheFlushTimer !== null) {
    clearTimeout(_probeCacheFlushTimer);
    _probeCacheFlushTimer = null;
  }
  if (_probeCacheWriteInFlight) {
    await _probeCacheWriteInFlight;
    if (!_probeCacheDirty)
      return "written";
  }
  if (!_probeCacheDirty || _probeCache === null)
    return "idle";
  const write = writeProbeCache();
  _probeCacheWriteInFlight = write;
  try {
    return await write;
  } finally {
    if (_probeCacheWriteInFlight === write)
      _probeCacheWriteInFlight = null;
  }
}
function isAstGrepVersionOutput(output) {
  return /\bast[- ]grep\b/i.test(output);
}
async function verifyAstGrepProbePath(binPath) {
  const result = await probeToolAsync(binPath, ["--version"], {
    timeout: 5e3
  });
  return !result.error && result.status === 0 && isAstGrepVersionOutput(`${result.stdout}${result.stderr}`);
}
async function checkProbeCache(toolId) {
  const cache = await readProbeCache();
  const entry = cache[toolId];
  if (!entry)
    return void 0;
  const ttl = entry.transient ? PROBE_CACHE_TRANSIENT_COOLDOWN_MS : PROBE_CACHE_TTL_MS;
  if (Date.now() - entry.cachedAt > ttl) {
    logSessionStart(`auto-install probe-cache ${toolId}: miss (${entry.transient ? "transient cooldown" : "ttl"} expired)`);
    delete cache[toolId];
    markProbeCacheChange(toolId, null);
    return void 0;
  }
  try {
    await fs2.access(entry.path);
    const stat = await fs2.stat(entry.path);
    if (stat.mtimeMs !== entry.mtimeMs || entry.sizeBytes !== void 0 && stat.size !== entry.sizeBytes) {
      logSessionStart(`auto-install probe-cache ${toolId}: miss (mtime/size changed)`);
      delete cache[toolId];
      markProbeCacheChange(toolId, null);
      return void 0;
    }
    if (toolId === "ast-grep" && !await verifyAstGrepProbePath(entry.path)) {
      logSessionStart(`auto-install probe-cache ${toolId}: miss (not ast-grep: ${entry.path})`);
      delete cache[toolId];
      markProbeCacheChange(toolId, null);
      return void 0;
    }
    return entry.path;
  } catch {
    logSessionStart(`auto-install probe-cache ${toolId}: miss (gone: ${entry.path})`);
    delete cache[toolId];
    markProbeCacheChange(toolId, null);
    return void 0;
  }
}
async function updateProbeCache(toolId, resolvedPath, transient = false) {
  try {
    const stat = await fs2.stat(resolvedPath);
    const cache = await readProbeCache();
    const entry = {
      path: resolvedPath,
      mtimeMs: stat.mtimeMs,
      sizeBytes: stat.size,
      cachedAt: Date.now(),
      ...transient && { transient: true }
    };
    cache[toolId] = entry;
    markProbeCacheChange(toolId, entry);
  } catch {
  }
}
function resetProbeCacheStateForTesting() {
  _probeCache = null;
  _probeCacheDirty = false;
  _probeCacheChanges.clear();
  _probeCacheChangeVersions.clear();
  _probeCacheChangeGeneration = 0;
  _probeCacheRetryAttempt = 0;
  resetResolvedPathCache();
  ensureInFlight.clear();
  installFailureReasons.clear();
  installAttempts.clear();
  lastEnsureResolutionSource.clear();
  lastManagedInstallVersion.clear();
  lastResolveTransient.clear();
  resetPathWalkMemo();
  if (_probeCacheFlushTimer !== null) {
    clearTimeout(_probeCacheFlushTimer);
    _probeCacheFlushTimer = null;
  }
}
function _peekEnsureInFlightForTesting() {
  return ensureInFlight;
}
var pathWalkMemo = /* @__PURE__ */ new Map();
function hashSync(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}
function resetPathWalkMemo() {
  pathWalkMemo.clear();
}
async function isCommandAvailable(command, _args) {
  const isWindows = installerPlatform() === "win32";
  const pathEnv = process.env.PATH || process.env.Path || process.env.path || "";
  const dirs = pathEnv.split(path3.delimiter);
  const names = isWindows ? [command, `${command}.exe`, `${command}.cmd`, `${command}.bat`] : [command];
  for (const dir of dirs) {
    if (!dir)
      continue;
    for (const name of names) {
      const candidate = path3.join(dir, name);
      try {
        const stat = statSync(candidate);
        if (stat.isFile() && stat.size > 0) {
          return true;
        }
      } catch {
      }
    }
  }
  return false;
}
async function isSpawnableCommand(command) {
  if (/[\\/]/.test(command)) {
    try {
      const stat = statSync(command);
      return stat.isFile() && stat.size > 0;
    } catch {
      return false;
    }
  }
  const memoKey = `${command}:${hashSync(process.env.PATH || "")}`;
  if (pathWalkMemo.has(memoKey))
    return pathWalkMemo.get(memoKey) ?? false;
  const isSpawnable = await isCommandAvailable(command);
  pathWalkMemo.set(memoKey, isSpawnable);
  return isSpawnable;
}
function isLspTransportRequiredError(output) {
  return /Connection (?:input|output) stream is not set|Use arguments of createConnection/i.test(output);
}
var lspTransportRequiredMatcher = /Connection (?:input|output) stream is not set|Use arguments of createConnection/i;
function parsePinnedVersion(packageName) {
  const at = packageName.lastIndexOf("@");
  if (at <= 0)
    return void 0;
  return packageName.slice(at + 1) || void 0;
}
function extractVersionToken(output) {
  return output.match(/\d+\.\d+\.\d+(?:[-+][\w.]+)?/)?.[0];
}
var lastManagedInstallVersion = /* @__PURE__ */ new Map();
function packageEntryVerification(tool) {
  return tool.verification === "package-entry" ? tool.packageName : void 0;
}
async function verifyNpmPackageEntry(binPath, packageName) {
  const nodeModulesDir = path3.dirname(path3.dirname(binPath));
  const pinned = parsePinnedVersion(packageName);
  const bareName = pinned ? packageName.slice(0, -(pinned.length + 1)) : packageName;
  const packageDir = path3.join(nodeModulesDir, ...bareName.split("/"));
  const shimName = path3.basename(binPath).replace(/\.(cmd|exe|ps1|bat)$/i, "").toLowerCase();
  const fail = (reason) => {
    logSessionStart(`auto-install verify: failed for ${binPath} (check=package-entry, kind=${reason})`);
    return false;
  };
  try {
    const shim = statSync(binPath);
    if (!shim.isFile() || shim.size === 0)
      return fail("shim-not-a-file");
  } catch {
    return fail("shim-missing");
  }
  let manifest;
  try {
    manifest = JSON.parse(await fs2.readFile(path3.join(packageDir, "package.json"), "utf8"));
  } catch {
    return fail("package-json-unreadable");
  }
  if (typeof manifest.version !== "string" || !manifest.version) {
    return fail("package-json-no-version");
  }
  const bin = manifest.bin;
  const entry = typeof bin === "string" ? bin : bin && typeof bin === "object" ? Object.entries(bin).find(
    // Case-folded on purpose: on a case-insensitive filesystem the
    // shim on disk can differ in case from the manifest key npm
    // wrote it from, and `path.basename` reads the disk name.
    ([name]) => name.toLowerCase() === shimName
  )?.[1] : void 0;
  if (typeof entry !== "string" || !entry) {
    return fail("package-json-no-entry");
  }
  try {
    const stat = statSync(path3.join(packageDir, entry));
    if (!stat.isFile() || stat.size === 0)
      return fail("entry-not-a-file");
  } catch {
    return fail("entry-missing");
  }
  logSessionStart(`auto-install verify: succeeded for ${binPath} (check=package-entry, version=${manifest.version}, entry=${entry})`);
  return true;
}
async function verifyToolBinary(binPath, onVersionOutput, onTransient, timeoutMs = 1e4, verificationArgs = ["--version"], packageEntryOf, onInconclusive) {
  if (packageEntryOf !== void 0) {
    return verifyNpmPackageEntry(binPath, packageEntryOf);
  }
  const isWindows = installerPlatform() === "win32";
  const hasKnownWindowsExt = /\.(cmd|exe|ps1)$/i.test(binPath);
  let execPath = isWindows && !hasKnownWindowsExt ? `${binPath}.cmd` : binPath;
  if (isWindows && /\.ps1$/i.test(execPath)) {
    const cmdSibling = `${execPath.slice(0, -4)}.cmd`;
    if (__require("node:fs").existsSync(cmdSibling)) {
      execPath = cmdSibling;
    }
  }
  const useShell = isWindows && /\.(cmd|bat)$/i.test(execPath);
  void useShell;
  try {
    const result = await safeSpawnAsync(execPath, verificationArgs, {
      timeout: timeoutMs,
      input: "",
      // A broken or version-blind language server can emit a bundled
      // megabytes-long diagnostic on stderr. Keep verification bounded even
      // when the child reaches its normal timeout first.
      maxOutputBytes: 64 * 1024,
      matchWhileStreaming: lspTransportRequiredMatcher
    });
    const output = `${result.stdout}
${result.stderr}`;
    if (result.outputTruncated) {
      recordDegradationOnce({
        kind: "installer-verification-output-truncated",
        subject: binPath,
        reason: `verification output exceeded 65536 bytes (${verificationArgs.join(" ")})`
      });
    }
    if (result.status === 0 && !result.error) {
      debugLog(`Verified: ${binPath} (${verificationArgs.join(" ")}: ${result.stdout.trim()})`);
      onVersionOutput?.(result.stdout);
      return true;
    }
    if (result.streamingMatch || isLspTransportRequiredError(output)) {
      debugLog(`Verified (stdio LSP, transport-required): ${binPath}`);
      return true;
    }
    if (result.signal !== void 0 || result.spawnFailure)
      onTransient?.();
    if (result.outputTruncated && result.signal === void 0 && !result.spawnFailure) {
      onInconclusive?.();
      recordDegradationOnce({
        kind: "installer-verification-inconclusive",
        subject: binPath,
        reason: `transport-required marker unresolved in truncated output (${verificationArgs.join(" ")})`
      });
    }
    const kind = result.spawnFailure?.kind ?? (result.signal ? `killed-signal=${result.signal}` : result.error ? "spawn-error" : "exit-nonzero");
    logSessionStart(`auto-install verify: failed for ${binPath} (check=${verificationArgs.join(" ")}, kind=${kind}${result.status !== null ? `, exit=${result.status}` : ""})`);
    return false;
  } catch (err) {
    logSessionStart(`auto-install verify: spawn threw for ${binPath} (${err instanceof Error ? err.message : String(err)})`);
    onTransient?.();
    return false;
  }
}
async function getAllToolStatuses() {
  const statuses = [];
  for (const tool of TOOLS) {
    const status = {
      id: tool.id,
      name: tool.name,
      installed: false,
      source: "not-installed",
      strategy: tool.installStrategy
    };
    if (tool.installStrategy === "archive" && !tool.archive?.launcher) {
      const bundleDir = await getArchiveTreeBundlePath(tool);
      if (bundleDir) {
        status.installed = true;
        status.source = "archive-dist";
        status.path = bundleDir;
      }
      statuses.push(status);
      continue;
    }
    if (await isCommandAvailable(tool.checkCommand, tool.checkArgs)) {
      status.installed = true;
      status.source = "global-path";
      status.path = tool.checkCommand;
      if (tool.verification !== "tree-manifest") {
        const probe = await probeToolAsync(tool.checkCommand, ["--version"], {
          timeout: 5e3
        });
        status.version = `${probe.stdout}${probe.stderr}`.trim().split("\n")[0]?.slice(0, 30) || void 0;
      }
      statuses.push(status);
      continue;
    }
    if (tool.installStrategy === "npm") {
      const npmPath = await findNpmGlobalToolPath(tool.binaryName || tool.id, void 0, tool.checkArgs, getToolVerificationTimeout(tool));
      if (npmPath) {
        status.installed = true;
        status.source = "npm-global";
        status.path = npmPath;
        statuses.push(status);
        continue;
      }
    }
    if (tool.installStrategy === "pip") {
      const pipPath = await findPipUserToolPath(tool.binaryName || tool.id, void 0, tool.checkArgs, getToolVerificationTimeout(tool));
      if (pipPath) {
        status.installed = true;
        status.source = "pip-user";
        status.path = pipPath;
        statuses.push(status);
        continue;
      }
    }
    if (tool.installStrategy === "github" || tool.installStrategy === "maven" || tool.installStrategy === "archive") {
      const githubPath = await findGitHubToolPath(tool.binaryName || tool.id);
      if (githubPath) {
        status.installed = true;
        status.source = tool.installStrategy === "maven" ? "maven-jar" : tool.installStrategy === "archive" ? "archive-dist" : "github-release";
        status.path = githubPath;
        statuses.push(status);
        continue;
      }
    }
    const localBase = path3.join(TOOLS_DIR, "node_modules", ".bin", tool.binaryName || tool.id);
    const localPath = installerPlatform() === "win32" ? `${localBase}.cmd` : localBase;
    try {
      await fs2.access(localPath);
      if (await verifyToolBinary(localPath, void 0, void 0, getToolVerificationTimeout(tool), tool.checkArgs, packageEntryVerification(tool))) {
        status.installed = true;
        status.source = "pi-lens-auto";
        status.path = localPath;
        statuses.push(status);
        continue;
      }
    } catch {
    }
    if (tool.installStrategy === "npm") {
      status.source = "npx-fallback";
    }
    statuses.push(status);
  }
  return statuses;
}
async function isToolInstalled(toolId) {
  return await getToolPath(toolId) !== void 0;
}
async function getArchiveTreeBundlePath(tool) {
  if (tool.installStrategy !== "archive" || tool.archive?.launcher) {
    return void 0;
  }
  const extractDir = path3.join(TOOLS_DIR, tool.id);
  const marker = tool.archive?.treeMarker ? path3.join(extractDir, ...tool.archive.treeMarker.split("/")) : extractDir;
  try {
    await fs2.access(marker);
    return extractDir;
  } catch {
    return void 0;
  }
}
function resolvePlatformPackageBinary(tool) {
  const spec = tool.platformPackage;
  if (!spec || !tool.packageName)
    return void 0;
  const suffix = spec.suffixes[`${installerPlatform()}-${process.arch}`];
  if (!suffix)
    return void 0;
  const platformPkg = `${spec.base ?? tool.packageName}-${suffix}`;
  try {
    const mainPkgJson = _installerRequire.resolve(`${tool.packageName}/package.json`);
    const fromMain = createRequire(mainPkgJson);
    let pkgDir;
    try {
      pkgDir = path3.dirname(fromMain.resolve(`${platformPkg}/package.json`));
    } catch {
      pkgDir = path3.dirname(_installerRequire.resolve(`${platformPkg}/package.json`));
    }
    const isWin = installerPlatform() === "win32";
    for (const bin of spec.binaries) {
      for (const name of isWin ? [`${bin}.exe`, bin] : [bin]) {
        const candidate = path3.join(pkgDir, name);
        if (existsSync(candidate))
          return candidate;
      }
    }
  } catch {
  }
  return void 0;
}
var lastResolveTransient = /* @__PURE__ */ new Map();
var lastInstallResolutionId = /* @__PURE__ */ new Map();
function wasLastResolveTransient(toolId) {
  return lastResolveTransient.get(toolId) ?? false;
}
async function getToolPath(toolId) {
  let sawTransient = false;
  const markTransient = () => {
    sawTransient = true;
  };
  const result = await getToolPathResolved(toolId, markTransient);
  lastResolveTransient.set(toolId, sawTransient);
  return result;
}
async function getToolPathResolved(toolId, onTransient) {
  const tool = TOOLS.find((t) => t.id === toolId);
  if (!tool)
    return void 0;
  if (tool.installStrategy === "archive" && !tool.archive?.launcher) {
    return getArchiveTreeBundlePath(tool);
  }
  const pinnedVersion = tool.installStrategy === "npm" && tool.packageName ? parsePinnedVersion(tool.packageName) : void 0;
  if (pinnedVersion)
    lastManagedInstallVersion.delete(toolId);
  const recordVersion = pinnedVersion ? (output) => {
    const seen = extractVersionToken(output);
    if (seen)
      lastManagedInstallVersion.set(toolId, seen);
  } : void 0;
  const localBase = path3.join(TOOLS_DIR, "node_modules", ".bin", tool.binaryName || tool.id);
  if (installerPlatform() === "win32") {
    const cmdPath = `${localBase}.cmd`;
    try {
      await fs2.access(cmdPath);
      if (await verifyToolBinary(cmdPath, recordVersion, onTransient, getToolVerificationTimeout(tool), tool.checkArgs, packageEntryVerification(tool))) {
        return cmdPath;
      }
      logSessionStart(`auto-install verify: ${cmdPath} exists but is broken, will reinstall`);
    } catch {
    }
    const exePath = `${localBase}.exe`;
    try {
      await fs2.access(exePath);
      if (await verifyToolBinary(exePath, recordVersion, onTransient, getToolVerificationTimeout(tool), tool.checkArgs, packageEntryVerification(tool))) {
        return exePath;
      }
      logSessionStart(`auto-install verify: ${exePath} exists but is broken, will reinstall`);
    } catch {
    }
  }
  if (installerPlatform() !== "win32") {
    try {
      await fs2.access(localBase);
      if (await verifyToolBinary(localBase, recordVersion, onTransient, getToolVerificationTimeout(tool), tool.checkArgs, packageEntryVerification(tool))) {
        return localBase;
      }
      logSessionStart(`auto-install verify: ${localBase} exists but is broken, will reinstall`);
    } catch {
    }
  }
  if (tool.platformPackage) {
    const platformBin = resolvePlatformPackageBinary(tool);
    if (platformBin && await verifyToolBinary(platformBin, void 0, onTransient, getToolVerificationTimeout(tool), tool.checkArgs)) {
      logSessionStart(`auto-install ${toolId}: resolved platform-package binary at ${platformBin}`);
      return platformBin;
    }
    logSessionStart(`auto-install ${toolId}: platform-package binary not resolved (${process.platform}-${process.arch}, base=${tool.platformPackage.base ?? tool.packageName}) \u2014 falling back to PATH/managed install`);
  }
  if (tool.installStrategy === "github" || tool.installStrategy === "maven" || tool.installStrategy === "archive") {
    const githubPath = await findGitHubToolPath(tool.binaryName || tool.id);
    if (githubPath)
      return githubPath;
  }
  if (await isCommandAvailable(tool.checkCommand)) {
    if (packageEntryVerification(tool) !== void 0)
      return tool.checkCommand;
    if (tool.verification === "tree-manifest")
      return tool.checkCommand;
    let probeStalled = false;
    const verified = await verifyToolBinary(tool.checkCommand, void 0, () => {
      probeStalled = true;
      onTransient();
    }, getToolVerificationTimeout(tool), tool.checkArgs, void 0, () => {
      probeStalled = true;
    });
    if (verified || probeStalled)
      return tool.checkCommand;
    recordDegradationOnce({
      kind: "installer-path-candidate-unrunnable",
      subject: toolId,
      reason: `${tool.checkCommand} on PATH failed its own check (${tool.checkArgs.join(" ")}); ignoring PATH for this tool`
    });
    logSessionStart(`auto-install ${toolId}: PATH candidate ${tool.checkCommand} failed ${tool.checkArgs.join(" ")} \u2014 ignoring PATH, trying managed install`);
  }
  if (tool.installStrategy === "npm") {
    const npmPath = await findNpmGlobalToolPath(tool.binaryName || tool.id, onTransient, tool.checkArgs, getToolVerificationTimeout(tool));
    if (npmPath) {
      return npmPath;
    }
  }
  if (tool.installStrategy === "pip") {
    const pipPath = await findPipUserToolPath(tool.binaryName || tool.id, onTransient, tool.checkArgs, getToolVerificationTimeout(tool));
    if (pipPath) {
      return pipPath;
    }
  }
  return void 0;
}
async function findGitHubToolPath(binaryName) {
  const isWindows = process.platform === "win32";
  const candidates = isWindows ? [
    path3.join(GITHUB_BIN_DIR, `${binaryName}.exe`),
    path3.join(GITHUB_BIN_DIR, `${binaryName}.bat`),
    path3.join(GITHUB_BIN_DIR, `${binaryName}.cmd`),
    path3.join(GITHUB_BIN_DIR, binaryName)
  ] : [path3.join(GITHUB_BIN_DIR, binaryName)];
  for (const candidate of candidates) {
    try {
      await fs2.access(candidate);
      return candidate;
    } catch {
    }
  }
  return void 0;
}
async function findManagedToolBinary(toolId) {
  const tool = TOOLS.find((candidate) => candidate.id === toolId);
  if (!tool)
    return void 0;
  if (tool.installStrategy !== "github" && tool.installStrategy !== "maven" && tool.installStrategy !== "archive") {
    return void 0;
  }
  return findGitHubToolPath(tool.binaryName || tool.id);
}
function hasExecutableExtension(name) {
  return /\.(exe|bat|cmd|ps1)$/i.test(name);
}
function getGitHubInstalledBinaryName(binaryName, platform, assetName) {
  if (platform !== "win32")
    return binaryName;
  if (hasExecutableExtension(binaryName))
    return binaryName;
  if (assetName.endsWith(".bat"))
    return `${binaryName}.bat`;
  if (assetName.endsWith(".cmd"))
    return `${binaryName}.cmd`;
  return `${binaryName}.exe`;
}
function launcherForGitHubAsset(spec, assetName) {
  if (spec.launcher === "php" && assetName.endsWith(".phar"))
    return "php";
  if (spec.launcher === "java" && assetName.endsWith(".jar"))
    return "java";
  return void 0;
}
function getArchiveBinaryCandidates(binaryName, platform, assetName) {
  if (platform !== "win32")
    return [binaryName];
  if (hasExecutableExtension(binaryName))
    return [binaryName];
  const candidates = /* @__PURE__ */ new Set();
  if (assetName.endsWith(".bat"))
    candidates.add(`${binaryName}.bat`);
  if (assetName.endsWith(".cmd"))
    candidates.add(`${binaryName}.cmd`);
  candidates.add(`${binaryName}.exe`);
  candidates.add(binaryName);
  candidates.add(`${binaryName}.bat`);
  candidates.add(`${binaryName}.cmd`);
  return [...candidates];
}
async function findNpmGlobalToolPath(binaryName, onTransient, verificationArgs = ["--version"], verificationTimeoutMs = 1e4) {
  const isWindows = process.platform === "win32";
  const binDirs = await getNpmGlobalBinCandidates(onTransient);
  for (const dir of binDirs) {
    const candidates = isWindows ? [
      path3.join(dir, `${binaryName}.cmd`),
      path3.join(dir, `${binaryName}.exe`)
    ] : [path3.join(dir, binaryName)];
    for (const candidate of candidates) {
      try {
        await fs2.access(candidate);
        if (await verifyToolBinary(candidate, void 0, onTransient, verificationTimeoutMs, verificationArgs)) {
          return candidate;
        }
      } catch {
      }
    }
  }
  return void 0;
}
async function getNpmGlobalBinCandidates(onTransient) {
  const dirs = [];
  const seen = /* @__PURE__ */ new Set();
  const add = (value) => {
    if (!value)
      return;
    const normalized = path3.resolve(value.trim());
    if (!normalized)
      return;
    if (seen.has(normalized))
      return;
    seen.add(normalized);
    dirs.push(normalized);
  };
  if (process.platform === "win32") {
    add(path3.join(process.env.APPDATA || "", "npm"));
  } else {
    add(path3.join(os.homedir(), ".npm-global", "bin"));
  }
  for (const dir of await allAvailableGlobalBinDirs(onTransient)) {
    add(dir);
  }
  return dirs;
}
async function findPipUserToolPath(binaryName, onTransient, verificationArgs = ["--version"], verificationTimeoutMs = 1e4) {
  const isWindows = installerPlatform() === "win32";
  const userBaseCandidates = [
    path3.join(getGlobalPiLensDir(), "pip-tools"),
    path3.join(getGlobalPiLensDir(), "pip-user"),
    ...await getPythonUserBaseCandidates()
  ];
  for (const userBase of userBaseCandidates) {
    const scriptDirs = [pipScriptsDir(userBase, installerPlatform())];
    if (isWindows) {
      try {
        const children = await fs2.readdir(userBase, { withFileTypes: true });
        for (const entry of children) {
          if (!entry.isDirectory())
            continue;
          if (!/^python\d+$/i.test(entry.name))
            continue;
          scriptDirs.push(path3.join(userBase, entry.name, "Scripts"));
        }
      } catch {
      }
    }
    for (const dir of scriptDirs) {
      const candidates = isWindows ? [
        path3.join(dir, `${binaryName}.exe`),
        path3.join(dir, `${binaryName}.cmd`),
        path3.join(dir, binaryName)
      ] : [path3.join(dir, binaryName)];
      for (const candidate of candidates) {
        try {
          await fs2.access(candidate);
          if (await verifyToolBinary(candidate, void 0, onTransient, verificationTimeoutMs, verificationArgs)) {
            return candidate;
          }
        } catch {
        }
      }
    }
  }
  return void 0;
}
function userBaseProbeResult(command, code, stdout) {
  if (stdout.truncated) {
    recordDegradationOnce({
      kind: "spawn-output-cap-truncated",
      subject: `user-base-probe:${command}`,
      reason: `\`${command} -m site --user-base\` reached the ${DEFAULT_MAX_OUTPUT_BYTES}-byte default cap after ${stdout.observedBytes} bytes; the probed user base is unusable`,
      metadata: {
        capBytes: DEFAULT_MAX_OUTPUT_BYTES,
        capSource: "default",
        observedBytes: stdout.observedBytes,
        killed: false
      }
    });
    return "";
  }
  return code === 0 ? stdout.text.trim() : "";
}
async function getPythonUserBaseCandidates() {
  const candidates = [];
  const seen = /* @__PURE__ */ new Set();
  const add = (value) => {
    if (!value)
      return;
    const normalized = value.trim();
    if (!normalized)
      return;
    if (seen.has(normalized))
      return;
    seen.add(normalized);
    candidates.push(normalized);
  };
  if (process.platform === "win32") {
    add(path3.join(process.env.APPDATA || "", "Python"));
  }
  const probes = process.platform === "win32" ? [
    { command: "py", args: ["-m", "site", "--user-base"] },
    { command: "python", args: ["-m", "site", "--user-base"] }
  ] : [
    { command: "python3", args: ["-m", "site", "--user-base"] },
    { command: "python", args: ["-m", "site", "--user-base"] }
  ];
  for (const probe of probes) {
    const userBase = await new Promise((resolve) => {
      const isWin = process.platform === "win32";
      const spawnCmd = isWin ? [probe.command, ...probe.args].join(" ") : probe.command;
      let proc;
      try {
        proc = spawn(spawnCmd, isWin ? [] : probe.args, {
          stdio: ["ignore", "pipe", "pipe"],
          shell: isWin
        });
      } catch {
        resolve("");
        return;
      }
      const stdout = createBoundedOutputSink();
      proc.stdout?.on("data", (data) => stdout.append(data));
      proc.on("exit", (code) => resolve(userBaseProbeResult(probe.command, code, stdout)));
      proc.on("error", () => resolve(""));
    });
    add(userBase);
  }
  return candidates;
}
async function githubApiAuthHeaders() {
  const token = await resolveGitHubToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
var HttpStatusError = class extends Error {
  statusCode;
  constructor(statusCode, url) {
    super(url ? `HTTP ${statusCode} for ${url}` : `HTTP ${statusCode}`);
    this.name = "HttpStatusError";
    this.statusCode = statusCode;
  }
};
var GitHubHttpError = class extends HttpStatusError {
  anonymousRateLimitExhausted;
  constructor(statusCode, requestHeaders, responseHeaders) {
    super(statusCode);
    this.name = "GitHubHttpError";
    this.message = `GitHub API HTTP ${statusCode}`;
    this.anonymousRateLimitExhausted = statusCode === 403 && !Object.keys(requestHeaders).some((key) => key.toLowerCase() === "authorization") && readHeader(responseHeaders, "x-ratelimit-remaining") === "0";
  }
};
function readHeader(headers, name) {
  const entry = Object.entries(headers).find(([key]) => key.toLowerCase() === name.toLowerCase())?.[1];
  return Array.isArray(entry) ? entry[0]?.trim() : entry?.trim();
}
function isGitHubApiUrl(url) {
  try {
    return new URL(url).host.toLowerCase() === "api.github.com";
  } catch {
    return false;
  }
}
function sameHost(a, b) {
  try {
    return new URL(a).host === new URL(b).host;
  } catch {
    return false;
  }
}
function httpsGetWithMeta(url, maxRedirects = 5, headers = {}) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "pi-lens/1.0", ...headers } }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        if (maxRedirects === 0)
          return reject(new Error("Too many redirects"));
        const location = res.headers.location;
        const nextHeaders = sameHost(url, location) ? headers : (() => {
          const { Authorization: _drop, ...rest } = headers;
          return rest;
        })();
        return resolve(httpsGetWithMeta(location, maxRedirects - 1, nextHeaders));
      }
      const etag = typeof res.headers.etag === "string" ? res.headers.etag : void 0;
      if (res.statusCode === 304) {
        res.resume();
        return resolve({ statusCode: 304, body: Buffer.alloc(0), etag });
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(isGitHubApiUrl(url) ? new GitHubHttpError(res.statusCode ?? 0, headers, res.headers) : new HttpStatusError(res.statusCode ?? 0, url));
      }
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => resolve({ statusCode: 200, body: Buffer.concat(chunks), etag }));
      res.on("error", reject);
    }).on("error", reject);
  });
}
async function httpsGet(url, maxRedirects = 5, headers = {}) {
  const response = await httpsGetWithMeta(url, maxRedirects, headers);
  if (response.statusCode !== 200) {
    throw new Error(`HTTP ${response.statusCode} for ${url}`);
  }
  return response.body;
}
function runCommand(command, args, cwd) {
  return new Promise((resolve) => {
    let proc;
    try {
      proc = spawn(command, args, {
        cwd,
        stdio: "ignore",
        shell: process.platform === "win32"
      });
    } catch {
      resolve(false);
      return;
    }
    proc.on("exit", (code) => resolve(code === 0));
    proc.on("error", () => resolve(false));
  });
}
async function installGitHubTool(tool, prefetchedRelease) {
  const spec = tool.github;
  if (!spec)
    return void 0;
  const platform = process.platform;
  const arch = process.arch;
  const assetSubstring = spec.assetMatch(platform, arch);
  if (!assetSubstring) {
    logSessionStart(`github-install ${tool.id}: unsupported platform=${platform} arch=${arch}`);
    return void 0;
  }
  let releaseJson;
  if (prefetchedRelease) {
    releaseJson = prefetchedRelease;
    logSessionStart(`github-install ${tool.id}: using caller-supplied release metadata for ${spec.repo} (${prefetchedRelease.tag_name ?? "untagged"})`);
  } else {
    logSessionStart(`github-install ${tool.id}: fetching release metadata from ${spec.repo}`);
    try {
      const body = await httpsGet(`https://api.github.com/repos/${spec.repo}/releases/latest`, 5, await githubApiAuthHeaders());
      releaseJson = JSON.parse(body.toString("utf8"));
    } catch (err) {
      const reason = err instanceof GitHubHttpError && err.anonymousRateLimitExhausted ? "GitHub API rate limit exhausted; authenticate with `gh auth login` or set GITHUB_TOKEN/GH_TOKEN and retry" : `release fetch failed: ${err.message}`;
      if (err instanceof GitHubHttpError && err.anonymousRateLimitExhausted) {
        recordDegradationOnce({
          kind: "github-api-rate-limit",
          subject: tool.id,
          reason
        });
      }
      logSessionStart(`github-install ${tool.id}: ${reason}`);
      return void 0;
    }
  }
  if (releaseJson.tag_name) {
    lastInstallResolutionId.set(tool.id, releaseJson.tag_name);
  }
  if (!Array.isArray(releaseJson.assets)) {
    logSessionStart(`github-install ${tool.id}: release metadata has no assets array`);
    return void 0;
  }
  const asset = pickReleaseAsset(releaseJson.assets, assetSubstring) ?? deriveHashiCorpReleaseAsset(tool, releaseJson.tag_name, assetSubstring);
  if (!asset) {
    logSessionStart(`github-install ${tool.id}: no asset matched "${assetSubstring}"`);
    return void 0;
  }
  logSessionStart(`github-install ${tool.id}: downloading ${asset.name}`);
  debugLog(`[github] downloading ${asset.name} from ${asset.browser_download_url}`);
  const downloadStart = Date.now();
  let assetBuffer;
  try {
    assetBuffer = await httpsGet(asset.browser_download_url);
    logSessionStart(`github-install ${tool.id}: downloaded ${asset.name} (${assetBuffer.length} bytes, ${Date.now() - downloadStart}ms)`);
  } catch (err) {
    logSessionStart(`github-install ${tool.id}: download failed: ${err.message}`);
    return void 0;
  }
  await fs2.mkdir(GITHUB_BIN_DIR, { recursive: true });
  const binaryName = tool.binaryName ?? tool.id;
  const isWindows = platform === "win32";
  const finalBinaryName = getGitHubInstalledBinaryName(binaryName, platform, asset.name);
  let destPath = path3.join(GITHUB_BIN_DIR, finalBinaryName);
  const assetName = asset.name;
  const launcherRuntime = launcherForGitHubAsset(spec, assetName);
  if (launcherRuntime && !await isCommandAvailable(launcherRuntime, ["--version"])) {
    logSessionStart(`github-install ${tool.id}: ${launcherRuntime} not found \u2014 asset requires a runtime launcher`);
    return void 0;
  }
  try {
    if (launcherRuntime) {
      const assetPath = path3.join(GITHUB_BIN_DIR, `${tool.id}${assetName.endsWith(".phar") ? ".phar" : ".jar"}`);
      await writeFileAtomicAsync(assetPath, assetBuffer, {
        bestEffort: false,
        mode: 488
      });
      const launcherName = isWindows ? `${binaryName}.bat` : binaryName;
      destPath = path3.join(GITHUB_BIN_DIR, launcherName);
      const runtimeTarget = assetName.endsWith(".phar") ? `${tool.id}.phar` : `${tool.id}.jar`;
      const command = isWindows ? `@echo off\r
${launcherRuntime} "%~dp0${runtimeTarget}" %*\r
` : `#!/bin/sh
exec ${launcherRuntime} "$(dirname "$0")/${runtimeTarget}" "$@"
`;
      await writeFileAtomicAsync(destPath, command, {
        bestEffort: false,
        mode: isWindows ? void 0 : 488
      });
    } else if (assetName.endsWith(".gz") && !assetName.endsWith(".tar.gz")) {
      const decompressed = await new Promise((resolve, reject) => {
        const gunzip = createGunzip();
        const chunks = [];
        gunzip.on("data", (chunk) => chunks.push(chunk));
        gunzip.on("end", () => resolve(Buffer.concat(chunks)));
        gunzip.on("error", reject);
        gunzip.end(assetBuffer);
      });
      await writeFileAtomicAsync(destPath, decompressed, {
        bestEffort: false,
        mode: 488
      });
    } else if (assetName.endsWith(".tar.gz") || assetName.endsWith(".tar.xz")) {
      const tmpArchive = path3.join(GITHUB_BIN_DIR, `_tmp_${assetName}`);
      await fs2.writeFile(tmpArchive, assetBuffer);
      const tmpDir = path3.join(GITHUB_BIN_DIR, `_tmp_extract_${tool.id}`);
      await fs2.mkdir(tmpDir, { recursive: true });
      const extracted = await runCommand("tar", ["xf", tmpArchive, "-C", tmpDir], GITHUB_BIN_DIR);
      await fs2.rm(tmpArchive, { force: true });
      if (!extracted) {
        await fs2.rm(tmpDir, { recursive: true, force: true });
        logSessionStart(`github-install ${tool.id}: tar extraction failed for ${assetName}`);
        return void 0;
      }
      const tarBinaryName = spec.binaryInArchive ?? binaryName;
      const tarSrcBinary = await findFirstFileRecursive(tmpDir, getArchiveBinaryCandidates(tarBinaryName, platform, assetName));
      if (!tarSrcBinary) {
        await fs2.rm(tmpDir, { recursive: true, force: true });
        logSessionStart(`github-install ${tool.id}: binary candidates ${JSON.stringify(getArchiveBinaryCandidates(tarBinaryName, platform, assetName))} not found in tar ${assetName}`);
        return void 0;
      }
      await fs2.rename(tarSrcBinary, destPath);
      await fs2.rm(tmpDir, { recursive: true, force: true });
      if (!isWindows)
        await fs2.chmod(destPath, 488);
    } else if (assetName.endsWith(".zip")) {
      const tmpArchive = path3.join(GITHUB_BIN_DIR, `_tmp_${assetName}`);
      await fs2.writeFile(tmpArchive, assetBuffer);
      const tmpDir = path3.join(GITHUB_BIN_DIR, `_tmp_extract_${tool.id}`);
      await fs2.mkdir(tmpDir, { recursive: true });
      const extracted = isWindows ? await runCommand("powershell", [
        "-NoProfile",
        "-Command",
        `Expand-Archive -LiteralPath '${tmpArchive}' -DestinationPath '${tmpDir}' -Force`
      ], GITHUB_BIN_DIR) : await runCommand("unzip", ["-q", "-o", tmpArchive, "-d", tmpDir], GITHUB_BIN_DIR);
      await fs2.rm(tmpArchive, { force: true });
      if (!extracted) {
        await fs2.rm(tmpDir, { recursive: true, force: true });
        logSessionStart(`github-install ${tool.id}: zip extraction failed for ${assetName}`);
        return void 0;
      }
      const archiveBinaryName = spec.binaryInArchive ?? binaryName;
      const srcBinary = await findFirstFileRecursive(tmpDir, getArchiveBinaryCandidates(archiveBinaryName, platform, assetName));
      if (!srcBinary) {
        await fs2.rm(tmpDir, { recursive: true, force: true });
        logSessionStart(`github-install ${tool.id}: binary candidates ${JSON.stringify(getArchiveBinaryCandidates(archiveBinaryName, platform, assetName))} not found in zip ${assetName}`);
        return void 0;
      }
      await fs2.rename(srcBinary, destPath);
      await fs2.rm(tmpDir, { recursive: true, force: true });
      if (!isWindows)
        await fs2.chmod(destPath, 488);
    } else {
      await writeFileAtomicAsync(destPath, assetBuffer, {
        bestEffort: false,
        mode: 488
      });
    }
  } catch (err) {
    logSessionStart(`github-install ${tool.id}: install failed: ${err.message}`);
    return void 0;
  }
  for (const extraName of spec.extraAssets?.(platform, arch) ?? []) {
    const extraAsset = releaseJson.assets.find((a) => a.name === extraName);
    if (!extraAsset) {
      logSessionStart(`github-install ${tool.id}: required extra asset "${extraName}" not found`);
      return void 0;
    }
    try {
      const extraBuffer = await httpsGet(extraAsset.browser_download_url);
      await writeFileAtomicAsync(path3.join(GITHUB_BIN_DIR, extraName), extraBuffer, { bestEffort: false, mode: 488 });
      logSessionStart(`github-install ${tool.id}: installed extra asset ${extraName} (${extraBuffer.length} bytes)`);
    } catch (err) {
      logSessionStart(`github-install ${tool.id}: extra asset ${extraName} download failed: ${err.message}`);
      return void 0;
    }
  }
  debugLog(`[github] installed ${tool.name} \u2192 ${destPath}`);
  logSessionStart(`github-install ${tool.id}: installed \u2192 ${destPath}`);
  return destPath;
}
async function findFirstFileRecursive(dir, names) {
  const wanted = new Set(names.map((name) => name.toLowerCase()));
  const entries = await fs2.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path3.join(dir, entry.name);
    if (entry.isDirectory()) {
      const found = await findFirstFileRecursive(full, names);
      if (found)
        return found;
    } else if (wanted.has(entry.name.toLowerCase())) {
      return full;
    }
  }
  return void 0;
}
var NEEDS_POSTINSTALL = /* @__PURE__ */ new Set([
  "@biomejs/biome",
  "@ast-grep/cli",
  // postinstall copies platform binary (ast-grep.exe/sg.exe) into place
  "@ast-grep/napi",
  "esbuild",
  "intelephense"
  // postinstall fetches platform binary; --ignore-scripts breaks install
]);
function npmToolNeedsPostinstall(packageName) {
  return NEEDS_POSTINSTALL.has(packageName);
}
function getRefreshableManagedNpmTools() {
  const seenPackages = /* @__PURE__ */ new Set();
  return getRefreshableManagedTools().filter((candidate) => candidate.strategy === "npm").map((candidate) => ({
    toolId: candidate.toolId,
    // The npm branch of getRefreshableManagedTools only admits entries that
    // have both, so these are total.
    packageName: candidate.packageName,
    binaryName: candidate.binaryName
  })).filter((candidate) => {
    if (seenPackages.has(candidate.packageName))
      return false;
    seenPackages.add(candidate.packageName);
    return true;
  });
}
function mavenCoordinate(spec) {
  return [
    spec.repoBaseUrl ?? MAVEN_CENTRAL_BASE,
    spec.groupId,
    spec.artifactId,
    spec.version,
    spec.classifier ?? ""
  ].join(":");
}
function getRefreshableManagedTools() {
  const refreshable = [];
  for (const tool of TOOLS) {
    switch (tool.installStrategy) {
      case "npm": {
        if (!tool.packageName)
          continue;
        if (parsePinnedVersion(tool.packageName) !== void 0)
          continue;
        if (!tool.binaryName)
          continue;
        refreshable.push({
          toolId: tool.id,
          strategy: "npm",
          checkArgs: tool.checkArgs,
          packageName: tool.packageName,
          binaryName: tool.binaryName,
          verificationTimeoutMs: tool.verificationTimeoutMs,
          packageEntryOf: packageEntryVerification(tool)
        });
        break;
      }
      case "pip":
      case "gem": {
        if (!tool.packageName)
          continue;
        refreshable.push({
          toolId: tool.id,
          strategy: tool.installStrategy,
          checkArgs: tool.checkArgs,
          packageName: tool.packageName
        });
        break;
      }
      case "github": {
        if (!tool.github)
          continue;
        refreshable.push({
          toolId: tool.id,
          strategy: "github",
          checkArgs: tool.checkArgs
        });
        break;
      }
      case "maven": {
        if (!tool.maven)
          continue;
        refreshable.push({
          toolId: tool.id,
          strategy: "maven",
          checkArgs: tool.checkArgs,
          pinnedCoordinate: mavenCoordinate(tool.maven)
        });
        break;
      }
      case "archive": {
        if (!tool.archive)
          continue;
        const url = resolveArchiveUrl(tool.archive);
        if (!url)
          continue;
        refreshable.push({
          toolId: tool.id,
          strategy: "archive",
          checkArgs: tool.checkArgs,
          pinnedCoordinate: url
        });
        break;
      }
    }
  }
  return refreshable;
}
async function isManagedToolPresent(toolId) {
  const tool = TOOLS.find((t) => t.id === toolId);
  if (!tool)
    return false;
  switch (tool.installStrategy) {
    case "npm": {
      if (!tool.packageName)
        return false;
      try {
        await fs2.access(path3.join(TOOLS_DIR, "node_modules", tool.packageName, "package.json"));
        return true;
      } catch {
        return false;
      }
    }
    case "github":
    case "maven":
      return await findGitHubToolPath(tool.binaryName ?? tool.id) !== void 0;
    case "archive":
      return await findGitHubToolPath(tool.binaryName ?? tool.id) !== void 0 || await getArchiveTreeBundlePath(tool) !== void 0;
    case "pip":
    case "gem": {
      const cached = (await readProbeCache())[toolId];
      return cached?.path !== void 0 && existsSync(cached.path);
    }
    default:
      return false;
  }
}
async function probeManagedToolVersion(tool) {
  const cached = (await readProbeCache())[tool.id];
  if (!cached?.path || !existsSync(cached.path))
    return void 0;
  try {
    const result = await probeToolAsync(cached.path, tool.checkArgs, {
      timeout: getToolVerificationTimeout(tool),
      input: "",
      ignoreAmbientSignal: true,
      resourceLabel: `tool-refresh-version:${tool.id}`
    });
    if (result.status !== 0)
      return void 0;
    return extractVersionToken(`${result.stdout}
${result.stderr}`);
  } catch {
    return void 0;
  }
}
async function acquireManagedInstallGate(context) {
  if (process.env.PI_LENS_DISABLE_TOOL_INSTALL === "1") {
    return {
      ok: false,
      reason: "installation disabled by PI_LENS_DISABLE_TOOL_INSTALL=1"
    };
  }
  if (!assertInstallAllowed(context)) {
    return {
      ok: false,
      reason: `project trust: ${projectTrustDenialReason()}`
    };
  }
  const lock = await acquireInstallLock();
  if (!lock.release) {
    return { ok: false, reason: lock.reason ?? "install lock held" };
  }
  return { ok: true, release: lock.release };
}
async function refreshManagedTool(toolId, known = {}) {
  const tool = TOOLS.find((t) => t.id === toolId);
  if (!tool) {
    return { ok: false, unchanged: true, reason: "unknown tool id" };
  }
  if (tool.installStrategy !== "github" && tool.installStrategy !== "pip" && tool.installStrategy !== "gem" && tool.installStrategy !== "maven" && tool.installStrategy !== "archive") {
    return {
      ok: false,
      unchanged: true,
      reason: `strategy ${tool.installStrategy} is not refreshable here`
    };
  }
  const strategy = tool.installStrategy;
  const gate = await acquireManagedInstallGate(`managed tool refresh: ${toolId}`);
  if (!gate.ok) {
    return { ok: false, unchanged: true, declined: true, reason: gate.reason };
  }
  try {
    switch (strategy) {
      case "github":
        return await refreshGitHubManagedTool(tool, known);
      case "pip":
      case "gem":
        return await refreshPackageManagerManagedTool(tool);
      case "maven":
      case "archive":
        return await refreshPinnedManagedTool(tool, known);
      default:
        return {
          ok: false,
          unchanged: true,
          reason: `strategy ${strategy} is not refreshable here`
        };
    }
  } finally {
    await gate.release?.();
  }
}
async function refreshGitHubManagedTool(tool, known) {
  const spec = tool.github;
  if (!spec)
    return { ok: false, unchanged: true, reason: "no github spec" };
  let response;
  try {
    response = await httpsGetWithMeta(`https://api.github.com/repos/${spec.repo}/releases/latest`, 5, {
      ...await githubApiAuthHeaders(),
      ...known.etag ? { "If-None-Match": known.etag } : {}
    });
  } catch (err) {
    const reason = err instanceof GitHubHttpError && err.anonymousRateLimitExhausted ? "GitHub API rate limit exhausted; authenticate with `gh auth login` or set GITHUB_TOKEN/GH_TOKEN and retry" : `release query failed: ${err.message}`;
    if (err instanceof GitHubHttpError && err.anonymousRateLimitExhausted) {
      recordDegradationOnce({
        kind: "github-api-rate-limit",
        subject: tool.id,
        reason
      });
    }
    return {
      ok: false,
      unchanged: true,
      reason
    };
  }
  if (response.statusCode === 304) {
    return {
      ok: true,
      unchanged: true,
      resolutionId: known.resolutionId,
      etag: known.etag,
      version: known.version
    };
  }
  let release;
  try {
    const parsed = JSON.parse(response.body.toString("utf8"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("release metadata is not an object");
    }
    release = parsed;
  } catch (err) {
    return {
      ok: false,
      unchanged: true,
      reason: `release metadata unparseable: ${err.message}`
    };
  }
  const tag = release.tag_name;
  if (!tag) {
    return { ok: false, unchanged: true, reason: "release has no tag_name" };
  }
  if (known.resolutionId === tag) {
    return {
      ok: true,
      unchanged: true,
      resolutionId: tag,
      etag: response.etag ?? known.etag,
      version: known.version ?? tag
    };
  }
  const installed = await installGitHubTool(tool, release);
  if (!installed) {
    return {
      ok: false,
      unchanged: true,
      // Keep the ETag off the failure stamp: replaying it would make the next
      // attempt a 304 and skip the download this one never completed.
      resolutionId: known.resolutionId,
      version: known.version,
      reason: `install from release ${tag} failed`
    };
  }
  const verified = await verifyRefreshedArtifact(tool, installed);
  if (!verified) {
    return {
      ok: false,
      unchanged: false,
      resolutionId: known.resolutionId,
      version: known.version,
      reason: `release ${tag} installed but its binary does not run`
    };
  }
  return {
    ok: true,
    unchanged: false,
    resolutionId: tag,
    etag: response.etag,
    version: tag
  };
}
async function verifyRefreshedArtifact(tool, installedPath) {
  if (tool.installStrategy === "archive" && (!tool.archive?.launcher || tool.verification === "tree-manifest")) {
    await updateProbeCache(tool.id, installedPath);
    return true;
  }
  if (!await verifyToolBinary(installedPath, void 0, void 0, getToolVerificationTimeout(tool), tool.checkArgs)) {
    logSessionStart(`managed-tool-refresh ${tool.id}: refreshed artifact at ${installedPath} failed its verification check`);
    return false;
  }
  await updateProbeCache(tool.id, installedPath);
  return true;
}
async function refreshPackageManagerManagedTool(tool) {
  if (!tool.packageName) {
    return { ok: false, unchanged: true, reason: "no package name" };
  }
  const previous = await probeManagedToolVersion(tool);
  const installed = tool.installStrategy === "pip" ? (
    // `-U` is the whole fix: without it pip treats the installed copy as
    // satisfying the requirement and the day-one version never moves.
    await installPipTool(tool.id, tool.packageName, tool.binaryName ?? tool.id, {
      upgrade: true
    })
  ) : (
    // `gem install` always fetches the newest version that satisfies the
    // requirement, so the install command IS the upgrade command.
    await installGemTool(tool.id, tool.packageName)
  );
  if (!installed) {
    return {
      ok: false,
      unchanged: true,
      version: previous,
      reason: `${tool.installStrategy} upgrade failed`
    };
  }
  const current = await probeManagedToolVersion(tool);
  if (previous !== void 0 && current === void 0) {
    return {
      ok: false,
      unchanged: false,
      version: previous,
      reason: `${tool.installStrategy} upgrade left the binary unable to report a version`
    };
  }
  return {
    ok: true,
    // An unreadable version on both sides cannot prove a move, so it reads as
    // unchanged rather than inventing one.
    unchanged: previous === void 0 || current === void 0 || previous === current,
    version: current ?? previous
  };
}
async function refreshPinnedManagedTool(tool, known) {
  const coordinate = tool.installStrategy === "maven" ? tool.maven && mavenCoordinate(tool.maven) : tool.archive && resolveArchiveUrl(tool.archive);
  if (!coordinate) {
    return {
      ok: false,
      unchanged: true,
      reason: "no coordinate for this platform"
    };
  }
  if (known.resolutionId === coordinate) {
    return {
      ok: true,
      unchanged: true,
      resolutionId: coordinate,
      version: known.version
    };
  }
  const installed = tool.installStrategy === "maven" ? await installMavenTool(tool) : await installArchiveTool(tool);
  if (!installed) {
    return {
      ok: false,
      unchanged: true,
      resolutionId: known.resolutionId,
      version: known.version,
      reason: `reinstall from ${coordinate} failed`
    };
  }
  if (!await verifyRefreshedArtifact(tool, installed)) {
    return {
      ok: false,
      unchanged: false,
      resolutionId: known.resolutionId,
      version: known.version,
      reason: `reinstall from ${coordinate} produced an artifact that does not run`
    };
  }
  return {
    ok: true,
    // A first-ever stamp is an adoption, not a version move: the coordinate did
    // not change, pi-lens simply had no record of it. Reporting it as a move
    // would put a false "x → y" row in the log.
    unchanged: known.resolutionId === void 0,
    resolutionId: coordinate,
    version: coordinate
  };
}
function resolveManagedNpmBinPath(binaryName) {
  const binBase = path3.join(TOOLS_DIR, "node_modules", ".bin", binaryName);
  return installerPlatform() === "win32" ? `${binBase}.cmd` : binBase;
}
function invalidateManagedToolResolution(toolId) {
  resolvedPathCache.delete(toolId);
  if (_probeCache !== null)
    delete _probeCache[toolId];
  markProbeCacheChange(toolId, null);
}
var MAVEN_CENTRAL_BASE = "https://repo1.maven.org/maven2";
async function installMavenTool(tool) {
  const spec = tool.maven;
  if (!spec)
    return void 0;
  const binaryName = tool.binaryName ?? tool.id;
  const isWindows = process.platform === "win32";
  if (!await isCommandAvailable("java", ["-version"])) {
    logSessionStart(`maven-install ${tool.id}: java not found \u2014 a JAR tool can't run without a JRE`);
    return void 0;
  }
  let base = spec.repoBaseUrl ?? MAVEN_CENTRAL_BASE;
  while (base.endsWith("/"))
    base = base.slice(0, -1);
  const groupPath = spec.groupId.replace(/\./g, "/");
  const jarFile = `${spec.artifactId}-${spec.version}${spec.classifier ? `-${spec.classifier}` : ""}.jar`;
  const url = `${base}/${groupPath}/${spec.artifactId}/${spec.version}/${jarFile}`;
  lastInstallResolutionId.set(tool.id, mavenCoordinate(spec));
  logSessionStart(`maven-install ${tool.id}: downloading ${url}`);
  let jarBuffer;
  try {
    jarBuffer = await httpsGet(url);
  } catch (err) {
    logSessionStart(`maven-install ${tool.id}: download failed: ${err.message}`);
    return void 0;
  }
  try {
    await fs2.mkdir(GITHUB_BIN_DIR, { recursive: true });
    const jarPath = path3.join(GITHUB_BIN_DIR, `${tool.id}.jar`);
    await writeFileAtomicAsync(jarPath, jarBuffer, { bestEffort: false });
    const launcherName = isWindows ? `${binaryName}.bat` : binaryName;
    const launcherPath = path3.join(GITHUB_BIN_DIR, launcherName);
    if (isWindows) {
      await writeFileAtomicAsync(launcherPath, `@echo off\r
java -jar "%~dp0${tool.id}.jar" %*\r
`, { bestEffort: false });
    } else {
      await writeFileAtomicAsync(launcherPath, `#!/bin/sh
exec java -jar "$(dirname "$0")/${tool.id}.jar" "$@"
`, { bestEffort: false, mode: 488 });
    }
    logSessionStart(`maven-install ${tool.id}: installed \u2192 ${launcherPath} (${jarBuffer.length} bytes)`);
    debugLog(`[maven] installed ${tool.name} \u2192 ${launcherPath}`);
    return launcherPath;
  } catch (err) {
    logSessionStart(`maven-install ${tool.id}: install failed: ${err.message}`);
    return void 0;
  }
}
function resolveArchiveUrl(spec, platform = installerPlatform(), arch = process.arch) {
  return typeof spec.url === "function" ? spec.url(platform, arch) : spec.url;
}
function resolveArchiveKind(spec, platform = installerPlatform(), arch = process.arch) {
  return typeof spec.kind === "function" ? spec.kind(platform, arch) : spec.kind;
}
function recordArchiveExtractionDegradation(toolId, format, reason) {
  recordDegradationOnce({
    kind: "managed-tool-install",
    subject: `${toolId}:${format}`,
    reason: `archive extraction ${reason}`
  });
}
async function stripExtractedArchiveRoot(dir, components) {
  for (let i = 0; i < components; i++) {
    const entries = await fs2.readdir(dir, { withFileTypes: true });
    const [entry] = entries;
    if (entries.length !== 1 || !entry?.isDirectory())
      return false;
    const root = path3.join(dir, entry.name);
    for (const child of await fs2.readdir(root))
      await fs2.rename(path3.join(root, child), path3.join(dir, child));
    await fs2.rm(root, { recursive: true, force: true });
  }
  return true;
}
async function swapExtractedDir(toolId, tmpDir, finalDir) {
  const backupDir = `${finalDir}.rollback`;
  await fs2.rm(backupDir, { recursive: true, force: true });
  let hadPrevious = false;
  try {
    await fs2.rename(finalDir, backupDir);
    hadPrevious = true;
  } catch (err) {
    if (err.code !== "ENOENT")
      throw err;
  }
  try {
    await fs2.rename(tmpDir, finalDir);
  } catch (err) {
    if (hadPrevious) {
      try {
        await fs2.rename(backupDir, finalDir);
      } catch (rollbackErr) {
        recordDegradationOnce({
          kind: "managed-tool-refresh",
          subject: toolId,
          reason: `swap rollback failed after a failed install: working copy orphaned at ${backupDir} (${rollbackErr.message})`
        });
        logSessionStart(`archive-install ${toolId}: swap rollback failed \u2014 working copy orphaned at ${backupDir} (${rollbackErr.message})`);
      }
    }
    throw err;
  }
  if (hadPrevious) {
    await fs2.rm(backupDir, { recursive: true, force: true }).catch(() => {
    });
  }
}
var ARCHIVE_RUNTIME_HOMES = {
  java: { env: "JAVA_HOME", dir: "bin" }
};
function runtimeHomeVerdict(runtime) {
  const home = ARCHIVE_RUNTIME_HOMES[runtime];
  const root = home ? process.env[home.env] : void 0;
  if (!home || !root)
    return void 0;
  const windows = installerPlatform() === "win32";
  const names = windows ? [`${runtime}.exe`, runtime] : [runtime];
  return names.some((name) => {
    try {
      const stat = statSync(path3.join(root, home.dir, name));
      return stat.isFile() && stat.size > 0 && (windows || (stat.mode & 73) !== 0);
    } catch {
      return false;
    }
  });
}
async function installArchiveTool(tool) {
  const spec = tool.archive;
  if (!spec)
    return void 0;
  const binaryName = tool.binaryName ?? tool.id;
  const platform = installerPlatform();
  const isWindows = platform === "win32";
  const archiveKind = resolveArchiveKind(spec, platform, process.arch);
  const url = resolveArchiveUrl(spec, platform, process.arch);
  if (!url) {
    logSessionStart(`archive-install ${tool.id}: no archive for ${process.platform}/${process.arch} \u2014 unsupported, skipping`);
    return void 0;
  }
  lastInstallResolutionId.set(tool.id, url);
  logSessionStart(`archive-install ${tool.id}: downloading ${url}`);
  let archiveBuffer;
  try {
    archiveBuffer = await httpsGet(url);
  } catch (err) {
    logSessionStart(`archive-install ${tool.id}: download failed: ${err.message}`);
    return void 0;
  }
  const pinned = spec.sha256?.[url];
  const digest = createHash("sha256").update(archiveBuffer).digest("hex");
  if (digest !== pinned) {
    const reason = pinned === void 0 ? "sha256-unpinned" : "sha256-mismatch";
    recordDegradationOnce({
      kind: "managed-tool-install",
      subject: `${tool.id}:${archiveKind}:integrity`,
      reason: `archive integrity ${reason}`
    });
    installFailureReasons.set(tool.id, `archive integrity ${reason} (${archiveBuffer.length} bytes from ${url})`);
    logSessionStart(`archive-install ${tool.id}: refused ${reason} (got ${digest}, pinned ${pinned ?? "none"}) \u2014 keeping installed version`);
    return void 0;
  }
  const extractName = tool.id;
  const tmpExtractName = `${extractName}.refresh-tmp`;
  const archiveName = `${tool.id}.download.${archiveKind === "zip" ? "zip" : "tgz"}`;
  const extractDir = path3.join(TOOLS_DIR, extractName);
  const tmpExtractDir = path3.join(TOOLS_DIR, tmpExtractName);
  const tmpArchive = path3.join(TOOLS_DIR, archiveName);
  try {
    await fs2.mkdir(TOOLS_DIR, { recursive: true });
    await fs2.rm(tmpExtractDir, { recursive: true, force: true });
    await fs2.mkdir(tmpExtractDir, { recursive: true });
    await fs2.writeFile(tmpArchive, archiveBuffer);
    const stripComponents = spec.stripComponents ?? 1;
    const extractionArgs = archiveKind === "zip" && isWindows ? [
      "-NoProfile",
      "-Command",
      `Expand-Archive -LiteralPath '${archiveName}' -DestinationPath '${tmpExtractName}' -Force`
    ] : archiveKind === "zip" ? ["-q", "-o", archiveName, "-d", tmpExtractName] : [
      "-xzf",
      archiveName,
      "-C",
      tmpExtractName,
      ...stripComponents > 0 ? [`--strip-components=${stripComponents}`] : []
    ];
    const extractor = archiveKind === "zip" && isWindows ? `${process.env.SystemRoot ?? "C:\\Windows"}\\System32\\WindowsPowerShell\\v1.0\\powershell.exe` : archiveKind === "zip" ? "unzip" : isWindows ? `${process.env.SystemRoot ?? "C:\\Windows"}\\System32\\tar.exe` : "tar";
    const extractionResult = await safeSpawnAsync(extractor, extractionArgs, {
      cwd: TOOLS_DIR,
      timeout: 12e4,
      ignoreAmbientSignal: true,
      lifetimeCoupled: true
    });
    const extracted = {
      ok: extractionResult.status === 0,
      reason: extractionResult.spawnFailure?.kind === "tool-not-found" ? "extractor-unavailable" : extractionResult.spawnFailure ? "extractor-error" : "extractor-exit"
    };
    await fs2.rm(tmpArchive, { force: true });
    if (!extracted.ok) {
      recordArchiveExtractionDegradation(tool.id, archiveKind, extracted.reason);
      logSessionStart(`archive-install ${tool.id}: ${archiveKind} extraction failed (${extracted.reason}) \u2014 keeping installed version`);
      await fs2.rm(tmpExtractDir, { recursive: true, force: true }).catch(() => {
      });
      return void 0;
    }
    if (archiveKind === "zip" && !await stripExtractedArchiveRoot(tmpExtractDir, stripComponents)) {
      recordArchiveExtractionDegradation(tool.id, archiveKind, "layout-invalid");
      logSessionStart(`archive-install ${tool.id}: ${archiveKind} layout invalid \u2014 keeping installed version`);
      await fs2.rm(tmpExtractDir, { recursive: true, force: true }).catch(() => {
      });
      return void 0;
    }
    if (!spec.launcher) {
      const tmpMarker = spec.treeMarker ? path3.join(tmpExtractDir, ...spec.treeMarker.split("/")) : tmpExtractDir;
      try {
        await fs2.access(tmpMarker);
      } catch {
        recordArchiveExtractionDegradation(tool.id, archiveKind, "marker-missing");
        logSessionStart(`archive-install ${tool.id}: ${archiveKind} marker missing after extraction \u2014 keeping installed version`);
        await fs2.rm(tmpExtractDir, { recursive: true, force: true }).catch(() => {
        });
        return void 0;
      }
      await swapExtractedDir(tool.id, tmpExtractDir, extractDir);
      logSessionStart(`archive-install ${tool.id}: installed tree bundle \u2192 ${extractDir} (extracted ${archiveBuffer.length} bytes, sha256 verified ${digest})`);
      debugLog(`[archive] installed ${tool.name} bundle \u2192 ${extractDir}`);
      return extractDir;
    }
    const launcherParts = spec.launcher.split("/").map((p) => p);
    const tmpInnerLauncher = path3.join(tmpExtractDir, ...launcherParts);
    const tmpResolvedInner = isWindows ? `${tmpInnerLauncher}.bat` : tmpInnerLauncher;
    try {
      await fs2.access(tmpResolvedInner);
    } catch {
      recordArchiveExtractionDegradation(tool.id, archiveKind, "launcher-missing");
      logSessionStart(`archive-install ${tool.id}: ${archiveKind} launcher missing after extraction \u2014 keeping installed version`);
      await fs2.rm(tmpExtractDir, { recursive: true, force: true }).catch(() => {
      });
      return void 0;
    }
    if (!isWindows)
      await fs2.chmod(tmpResolvedInner, 488).catch(() => {
      });
    const launcherStat = await fs2.stat(tmpResolvedInner).catch(() => void 0);
    const launcherRunnable = launcherStat?.isFile() === true && launcherStat.size > 0 && (isWindows || (launcherStat.mode & 73) !== 0);
    if (!launcherRunnable) {
      recordArchiveExtractionDegradation(tool.id, archiveKind, "launcher-invalid");
      logSessionStart(`archive-install ${tool.id}: ${archiveKind} launcher is empty or not executable \u2014 keeping installed version`);
      await fs2.rm(tmpExtractDir, { recursive: true, force: true }).catch(() => {
      });
      return void 0;
    }
    await swapExtractedDir(tool.id, tmpExtractDir, extractDir);
    const innerLauncher = path3.join(extractDir, ...launcherParts);
    const resolvedInner = isWindows ? `${innerLauncher}.bat` : innerLauncher;
    await fs2.mkdir(GITHUB_BIN_DIR, { recursive: true });
    const launcherName = isWindows ? `${binaryName}.bat` : binaryName;
    const shimPath = path3.join(GITHUB_BIN_DIR, launcherName);
    if (isWindows) {
      await writeFileAtomicAsync(shimPath, `@echo off\r
call "${resolvedInner}" %*\r
`, { bestEffort: false });
    } else {
      await writeFileAtomicAsync(shimPath, `#!/bin/sh
exec "${resolvedInner}" "$@"
`, { bestEffort: false, mode: 488 });
    }
    logSessionStart(`archive-install ${tool.id}: installed \u2192 ${shimPath} (extracted ${archiveBuffer.length} bytes, sha256 verified ${digest})`);
    debugLog(`[archive] installed ${tool.name} \u2192 ${shimPath}`);
    return shimPath;
  } catch (err) {
    await fs2.rm(tmpArchive, { force: true }).catch(() => {
    });
    await fs2.rm(tmpExtractDir, { recursive: true, force: true }).catch(() => {
    });
    logSessionStart(`archive-install ${tool.id}: install failed: ${err.message} \u2014 keeping installed version`);
    return void 0;
  }
}
function recordPackageManagerInstallException(toolId, strategyLabel, packageName, err) {
  const message = boundInstallError(err.message);
  logSessionStart(`auto-install ${strategyLabel} ${packageName}: exception: ${message}`);
  installFailureReasons.set(toolId, message);
  return void 0;
}
var INSTALL_ERROR_LINE_LIMIT = 1e3;
var INSTALL_CANDIDATE_ERROR_LIMIT = 200;
function boundInstallError(value, limit = INSTALL_ERROR_LINE_LIMIT) {
  const line = value.replace(/[\r\n]+/g, " ").trim();
  return line.length > limit ? `${line.slice(0, limit - 3)}...` : line;
}
var InstallLockLostError = class extends Error {
};
async function installNpmTool(toolId, packageName, binaryName, verificationArgs = ["--version"], verificationTimeoutMs = 1e4, packageEntryOf, ownsLock) {
  const assertOwnsLock = (context) => {
    if (ownsLock && !ownsLock()) {
      recordDegradationOnce({
        kind: "install-lock-lost-mid-install",
        subject: toolId,
        reason: `install lock generation lost before ${context}; aborting rather than risk a second writer in TOOLS_DIR`
      });
      throw new InstallLockLostError(`install lock lost before ${context} for ${packageName} (#3515)`);
    }
  };
  try {
    await fs2.mkdir(TOOLS_DIR, { recursive: true });
    const packageJsonPath = path3.join(TOOLS_DIR, "package.json");
    try {
      await fs2.access(packageJsonPath);
    } catch {
      await writeFileAtomicAsync(packageJsonPath, JSON.stringify({ name: "pi-lens-tools", version: "1.0.0" }, null, 2), { bestEffort: false });
    }
    const isWindows = installerPlatform() === "win32";
    const pm = await resolveNodePackageManager(TOOLS_DIR);
    const testNpmScript = process.env.PI_LENS_TEST_MODE === "1" ? process.env.PI_LENS_TEST_NPM_SCRIPT : void 0;
    const pmCommand = testNpmScript ? process.execPath : pmBinary(pm);
    const needsScripts = NEEDS_POSTINSTALL.has(packageName);
    const baseInstallArgs = installArgs(pm, packageName, {
      ignoreScripts: !needsScripts
    });
    const INSTALL_TIMEOUT_MS = Number(process.env.PI_LENS_INSTALL_TIMEOUT_MS) || 12e4;
    const runInstallAttempt = async (args) => {
      const result = await safeSpawnAsync(pmCommand, args, {
        cwd: TOOLS_DIR,
        timeout: INSTALL_TIMEOUT_MS,
        ignoreAmbientSignal: true,
        lifetimeCoupled: true
      });
      return {
        ok: result.status === 0,
        stderr: result.error?.message ?? result.stderr
      };
    };
    assertOwnsLock(`spawning ${pmCommand} install`);
    let outcome = await runInstallAttempt([
      ...testNpmScript ? [testNpmScript] : [],
      ...baseInstallArgs
    ]);
    const erResolve = outcome.ok === false && /npm\s+error\s+ERESOLVE|\bERESOLVE\b|could not resolve/i.test(outcome.stderr);
    if (pm === "npm" && erResolve) {
      assertOwnsLock(`retrying ${pmCommand} install with --legacy-peer-deps`);
      const retryArgs = installArgs(pm, packageName, {
        ignoreScripts: !needsScripts,
        legacyPeerDeps: true
      });
      logSessionStart(`auto-install npm ${packageName}: retry with --legacy-peer-deps after ERESOLVE`);
      outcome = await runInstallAttempt([
        ...testNpmScript ? [testNpmScript] : [],
        ...retryArgs
      ]);
    }
    if (!outcome.ok) {
      throw new Error(`Failed to install ${packageName}: ${outcome.stderr}`);
    }
    const binBase = path3.join(TOOLS_DIR, "node_modules", ".bin", binaryName);
    const binPath = installerPlatform() === "win32" ? `${binBase}.cmd` : binBase;
    if (installerPlatform() !== "win32") {
      try {
        await fs2.chmod(binPath, 488);
      } catch {
      }
    }
    await new Promise((r) => setTimeout(r, 500));
    debugLog(`Verifying ${binaryName}...`);
    let isValid = false;
    let lastAttemptTransient = false;
    let lastAttemptInconclusive = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      lastAttemptTransient = false;
      lastAttemptInconclusive = false;
      isValid = await verifyToolBinary(binPath, void 0, () => {
        lastAttemptTransient = true;
      }, verificationTimeoutMs, verificationArgs, packageEntryOf, () => {
        lastAttemptInconclusive = true;
      });
      if (isValid)
        break;
      if (attempt < 3) {
        logSessionStart(`auto-install verify ${binaryName}: attempt ${attempt} failed, retrying in ${attempt}s`);
        await new Promise((r) => setTimeout(r, 1e3 * attempt));
      }
    }
    if (!isValid && lastAttemptInconclusive) {
      if (await verifyNpmPackageEntry(binPath, packageName)) {
        logSessionStart(`auto-install ${packageName}: verification inconclusive (output truncated before the transport-required marker) but the installed tree is intact; keeping installation for re-probe`);
        return void 0;
      }
      logSessionStart(`auto-install ${packageName}: verification inconclusive AND the installed tree is incomplete; cleaning up so the next install can repair it`);
    }
    if (!isValid && lastAttemptTransient) {
      logSessionStart(`auto-install ${packageName}: verification inconclusive (transient); keeping installation for re-probe`);
      return void 0;
    }
    if (!isValid) {
      logSessionStart(`auto-install ${packageName}: installed but verification failed, cleaning up`);
      try {
        const packagePath = path3.join(TOOLS_DIR, "node_modules", packageName);
        await fs2.rm(packagePath, { recursive: true, force: true });
        await fs2.rm(binBase, { force: true });
        if (isWindows) {
          await fs2.rm(`${binBase}.cmd`, { force: true });
          await fs2.rm(`${binBase}.ps1`, { force: true });
        }
      } catch {
      }
      return void 0;
    }
    return binPath;
  } catch (err) {
    return recordPackageManagerInstallException(toolId, "npm", packageName, err);
  }
}
function pipCommandCandidates() {
  return process.platform === "win32" ? ["pip", "py", "python"] : ["pip3", "pip", "python3", "python"];
}
function pipScriptsDir(base, platform = installerPlatform()) {
  return path3.join(base, platform === "win32" ? "Scripts" : "bin");
}
var pipPep668LoggedRefusals = createGenerationMap("installer-pep668-log");
async function pipConstraintEnvFor(toolId) {
  const constraints = TOOLS.find((t) => t.id === toolId)?.pipConstraints;
  if (!constraints || constraints.length === 0)
    return {};
  const directories = [
    path3.join(getGlobalPiLensDir(), "pip-constraints"),
    path3.join(os.tmpdir(), "pi-lens-pip-constraints")
  ];
  const directory = directories.find((candidate) => !/\s/.test(candidate));
  if (!directory) {
    recordDegradationOnce({
      kind: "pip-constraint-path-unusable",
      subject: toolId,
      reason: `no whitespace-free directory for the constraints file (tried ${directories.join(", ")}); installing unconstrained`
    });
    return {};
  }
  const file = path3.join(directory, `${toolId}.txt`);
  try {
    await fs2.mkdir(path3.dirname(file), { recursive: true });
    await writeFileAtomicAsync(file, `${constraints.join("\n")}
`, {
      bestEffort: false
    });
  } catch (err) {
    recordDegradationOnce({
      kind: "pip-constraint-file-unwritable",
      subject: toolId,
      reason: `${file}: ${err instanceof Error ? err.message : String(err)}`
    });
    return {};
  }
  logSessionStart(`auto-install pip ${toolId}: constraining resolution with ${constraints.join(", ")} (${file})`);
  return { PIP_CONSTRAINT: file, UV_CONSTRAINT: file };
}
async function installPipTool(toolId, packageName, binaryName, options = {}) {
  try {
    const isWindows = installerPlatform() === "win32";
    const verb = options.upgrade ? ["install", "-U"] : ["install"];
    const pipConstraintEnv = await pipConstraintEnvFor(toolId);
    const pipCandidates = pipCommandCandidates().map((command) => ({
      command,
      args: command === "pip" || command === "pip3" ? [...verb, packageName] : ["-m", "pip", ...verb, packageName]
    }));
    const pep668 = /externally-managed-environment/i;
    const refuse = (strategy, reason) => {
      if (!pep668.test(reason))
        return;
      const subject = `${toolId}:${strategy}`;
      recordDegradationOnce({
        kind: "pip-pep668-strategy-refused",
        subject,
        reason
      });
      const logKey = `${getDegradationLedgerGeneration()}:${subject}`;
      if (pipPep668LoggedRefusals.current(logKey) === 0) {
        pipPep668LoggedRefusals.bump(logKey);
        logSessionStart(`auto-install pip ${packageName}: ${strategy} refused by PEP 668 (${boundInstallError(reason)})`);
      }
    };
    const succeeded = (strategy, binaryPath) => {
      recordDegradationOnce({
        kind: "pip-install-strategy-succeeded",
        subject: `${toolId}:${strategy}`,
        reason: binaryPath
      });
      return binaryPath;
    };
    const run = (command, args, env) => {
      const spawnEnv = Object.keys(pipConstraintEnv).length > 0 ? { ...env ?? process.env, ...pipConstraintEnv } : env;
      return safeSpawnAsync(command, args, {
        timeout: 12e4,
        ignoreAmbientSignal: true,
        lifetimeCoupled: true,
        cwd: resolveToolCwd("runner", toolId, getGlobalPiLensDir(), {
          cwd: getGlobalPiLensDir(),
          suppressTelemetry: true
        }).cwd,
        ...spawnEnv ? { env: spawnEnv } : {}
      });
    };
    const addBinToPath = async (binDir) => {
      try {
        await fs2.access(binDir);
      } catch {
        return void 0;
      }
      const currentPath = process.env.PATH || process.env.Path || "";
      const separator = isWindows ? ";" : path3.delimiter;
      if (!currentPath.toLowerCase().split(separator).includes(binDir.toLowerCase())) {
        const updatedPath = `${binDir}${separator}${currentPath}`;
        process.env.PATH = updatedPath;
        if (isWindows)
          process.env.Path = updatedPath;
      }
      const names = isWindows ? [`${binaryName}.exe`, `${binaryName}.cmd`, binaryName] : [binaryName];
      for (const name of names) {
        const candidate = path3.join(binDir, name);
        try {
          await fs2.access(candidate);
          return candidate;
        } catch {
        }
      }
      return void 0;
    };
    if (await isCommandAvailable("pipx")) {
      const result = await run("pipx", options.upgrade ? ["upgrade", packageName] : ["install", "--force", packageName]);
      const error = (result.error?.message ?? result.stderr).trim();
      if (result.status === 0) {
        const location = await run("pipx", [
          "environment",
          "--value",
          "PIPX_BIN_DIR"
        ]);
        const binDir = location.status === 0 && location.stdout.trim() ? location.stdout.trim() : path3.join(os.homedir(), ".local", "bin");
        const binaryPath = await addBinToPath(binDir);
        if (binaryPath)
          return succeeded("pipx", binaryPath);
        throw new Error(`pipx installed ${packageName} but ${binaryName} is not resolvable`);
      }
      refuse("pipx", error);
    }
    const pythonCandidates = pipCandidates.filter(({ command }) => command === "python3" || command === "python" || command === "py");
    const pythonAvailability = await Promise.all(pythonCandidates.map(({ command }) => isCommandAvailable(command)));
    const availablePythonCandidates = pythonCandidates.filter((_, index) => pythonAvailability[index]);
    const venvRoot = path3.join(getGlobalPiLensDir(), "pip-tools");
    for (const candidate of availablePythonCandidates) {
      const venvBin = pipScriptsDir(venvRoot, installerPlatform());
      let venvPip = path3.join(venvBin, isWindows ? "pip.exe" : "pip");
      try {
        await fs2.access(venvPip);
      } catch {
        const created = await run(candidate.command, ["-m", "venv", venvRoot]);
        const error2 = (created.error?.message ?? created.stderr).trim();
        if (created.status !== 0) {
          refuse("venv", error2 || "python venv module unavailable");
          continue;
        }
      }
      try {
        await fs2.access(venvPip);
      } catch {
        venvPip = path3.join(venvBin, isWindows ? "pip.cmd" : "pip3");
        try {
          await fs2.access(venvPip);
        } catch {
          continue;
        }
      }
      const result = await run(venvPip, [...verb, packageName]);
      const error = (result.error?.message ?? result.stderr).trim();
      if (result.status === 0) {
        const binaryPath = await addBinToPath(venvBin);
        if (binaryPath)
          return succeeded("venv", binaryPath);
        throw new Error(`venv installed ${packageName} but ${binaryName} is not resolvable`);
      }
      refuse("venv", error);
    }
    const candidateErrors = [];
    let userRefused = false;
    for (const candidate of pipCandidates) {
      const args = candidate.command === "pip" || candidate.command === "pip3" ? [...verb, "--user", packageName] : ["-m", "pip", ...verb, "--user", packageName];
      const result = await run(candidate.command, args);
      const error = (result.error?.message ?? result.stderr).trim();
      if (result.status === 0) {
        const base = await new Promise((resolve) => {
          let probe;
          try {
            probe = spawn(candidate.command, ["-m", "site", "--user-base"], {
              stdio: ["ignore", "pipe", "pipe"],
              shell: isWindows
            });
          } catch {
            resolve("");
            return;
          }
          const stdout = createBoundedOutputSink();
          probe.stdout?.on("data", (data) => stdout.append(data));
          probe.on("exit", (code) => resolve(userBaseProbeResult(candidate.command, code, stdout)));
          probe.on("error", () => resolve(""));
        });
        const binaryPath = base ? await addBinToPath(pipScriptsDir(base, installerPlatform())) : void 0;
        return succeeded("user", binaryPath ?? packageName);
      }
      const candidateError = `${candidate.command} ${args.join(" ")}: ${boundInstallError(error, INSTALL_CANDIDATE_ERROR_LIMIT)}`;
      candidateErrors.push(candidateError);
      if (pep668.test(error)) {
        userRefused = true;
        refuse("user", error);
      }
    }
    if (!userRefused)
      throw new Error(`pip install failed: ${candidateErrors.join(" | ") || "unknown error"}`);
    const privateBase = path3.join(getGlobalPiLensDir(), "pip-user");
    const privateEnv = { ...process.env, PYTHONUSERBASE: privateBase };
    for (const candidate of pipCandidates) {
      const args = candidate.command === "pip" || candidate.command === "pip3" ? [...verb, "--user", "--break-system-packages", packageName] : [
        "-m",
        "pip",
        ...verb,
        "--user",
        "--break-system-packages",
        packageName
      ];
      const result = await run(candidate.command, args, privateEnv);
      const error = (result.error?.message ?? result.stderr).trim();
      if (result.status !== 0) {
        const candidateError = `${candidate.command} ${args.join(" ")}: ${boundInstallError(error, INSTALL_CANDIDATE_ERROR_LIMIT)}`;
        candidateErrors.push(candidateError);
        continue;
      }
      const binaryPath = await addBinToPath(pipScriptsDir(privateBase, installerPlatform()));
      if (binaryPath)
        return succeeded("private-prefix", binaryPath);
      throw new Error(`private-prefix pip installed ${packageName} but ${binaryName} is not resolvable`);
    }
    throw new Error(`pip install failed: ${candidateErrors.join(" | ") || "unknown error"}`);
  } catch (err) {
    return recordPackageManagerInstallException(toolId, "pip", packageName, err);
  }
}
async function installGemTool(toolId, packageName) {
  try {
    const gemResult = await safeSpawnAsync("gem", ["install", packageName, "--no-document"], {
      timeout: 12e4,
      ignoreAmbientSignal: true,
      lifetimeCoupled: true
    });
    const outcome = {
      ok: gemResult.status === 0,
      error: (gemResult.error?.message ?? gemResult.stderr).trim()
    };
    if (!outcome.ok) {
      throw new Error(`Failed to install ${packageName} via gem: ${outcome.error}`);
    }
    return packageName;
  } catch (err) {
    return recordPackageManagerInstallException(toolId, "gem", packageName, err);
  }
}
async function stampInstallResolution(toolId) {
  const tool = TOOLS.find((t) => t.id === toolId);
  if (tool?.installStrategy === "npm")
    return;
  try {
    const resolutionId = lastInstallResolutionId.get(toolId);
    const refresh = await import("./chunk-5UCAH366.js");
    await refresh.stampManagedToolInstall(toolId, resolutionId);
  } catch {
  }
}
async function finishInstallAttempt(toolId, ok, startedAt) {
  logSessionStart(`auto-install ${toolId}: ${ok ? "success" : "failed"} (${Date.now() - startedAt}ms)`);
  if (ok)
    await stampInstallResolution(toolId);
  noteInstallAttempt(toolId, ok ? "succeeded" : "failed", ok ? void 0 : installFailureReasons.get(toolId) ?? "install failed");
  if (ok) {
    resetSafeSpawnWindowsCommandCache();
    try {
      const { resetMadgeManagedPathMemo } = await import("./chunk-EC47DWFA.js");
      resetMadgeManagedPathMemo();
    } catch (err) {
      logSessionStart(`auto-install ${toolId}: madge memo reset failed: ${err.message}`);
    }
  }
  return ok;
}
async function installTool(toolId, ownsLock) {
  if (process.env.PI_LENS_DISABLE_TOOL_INSTALL === "1") {
    installFailureReasons.set(toolId, "installation disabled by PI_LENS_DISABLE_TOOL_INSTALL=1");
    noteInstallAttempt(toolId, "declined", "installation disabled by PI_LENS_DISABLE_TOOL_INSTALL=1");
    logSessionStart(`auto-install ${toolId}: refused \u2014 PI_LENS_DISABLE_TOOL_INSTALL=1`);
    return false;
  }
  const tool = TOOLS.find((t) => t.id === toolId);
  if (!tool) {
    noteInstallAttempt(toolId, "declined", "unknown tool id");
    logSessionStart(`auto-install ${toolId}: unknown tool id`);
    return false;
  }
  const startedAt = Date.now();
  logSessionStart(`auto-install ${tool.id}: start strategy=${tool.installStrategy} package=${tool.packageName ?? "n/a"}`);
  try {
    switch (tool.installStrategy) {
      case "npm": {
        if (!tool.packageName || !tool.binaryName)
          return false;
        const npmPath = await installNpmTool(tool.id, tool.packageName, tool.binaryName, tool.checkArgs, getToolVerificationTimeout(tool), packageEntryVerification(tool), ownsLock);
        if (npmPath !== void 0) {
          await import("./chunk-5UCAH366.js").then((m) => m.stampManagedToolInstalled(tool.id, tool.packageName)).catch(() => {
          });
        }
        return finishInstallAttempt(tool.id, npmPath !== void 0, startedAt);
      }
      case "pip": {
        if (!tool.packageName)
          return false;
        const pipPath = await installPipTool(tool.id, tool.packageName, tool.binaryName ?? tool.id);
        return finishInstallAttempt(tool.id, pipPath !== void 0, startedAt);
      }
      case "gem": {
        if (!tool.packageName)
          return false;
        const gemPath = await installGemTool(tool.id, tool.packageName);
        return finishInstallAttempt(tool.id, gemPath !== void 0, startedAt);
      }
      case "github": {
        if (!tool.github)
          return false;
        if (!tool.github.assetMatch(process.platform, process.arch)) {
          const reason = `unsupported platform=${process.platform} arch=${process.arch}`;
          noteInstallAttempt(tool.id, "unavailable", reason);
          logSessionStart(`auto-install ${tool.id}: ${reason}`);
          return false;
        }
        const ghPath = await installGitHubTool(tool);
        return finishInstallAttempt(tool.id, ghPath !== void 0, startedAt);
      }
      case "maven": {
        if (!tool.maven)
          return false;
        const mavenPath = await installMavenTool(tool);
        return finishInstallAttempt(tool.id, mavenPath !== void 0, startedAt);
      }
      case "archive": {
        if (!tool.archive)
          return false;
        if (!resolveArchiveUrl(tool.archive)) {
          const reason = `unsupported platform=${process.platform} arch=${process.arch}`;
          noteInstallAttempt(tool.id, "unavailable", reason);
          logSessionStart(`auto-install ${tool.id}: ${reason}`);
          return false;
        }
        const runtime = tool.archive.runtime;
        const viaHome = runtime ? runtimeHomeVerdict(runtime) : void 0;
        if (runtime && !(viaHome ?? await isCommandAvailable(runtime))) {
          const reason = viaHome === void 0 ? `runtime ${runtime} not found on PATH` : `runtime ${runtime} is not an executable file under ${ARCHIVE_RUNTIME_HOMES[runtime]?.env}`;
          noteInstallAttempt(tool.id, "unavailable", reason);
          logSessionStart(`auto-install ${tool.id}: ${reason}`);
          return false;
        }
        const archivePath = await installArchiveTool(tool);
        return finishInstallAttempt(tool.id, archivePath !== void 0, startedAt);
      }
      default:
        logSessionStart(`auto-install ${tool.id}: unsupported strategy`);
        return false;
    }
  } catch (err) {
    logSessionStart(`auto-install ${tool.id}: exception ${err.message} (${Date.now() - startedAt}ms)`);
    return false;
  }
}
async function ensureTool(toolId, opts) {
  if (opts?.allowInstall !== false && !assertInstallAllowed(`managed tool ensure: ${toolId}`)) {
    logSessionStart(`auto-install ensure ${toolId}: install gated \u2014 ${projectTrustDenialReason()}; discovery only`);
    const denialReason = projectTrustDenialReason();
    const discovered = await ensureToolResolved(toolId, {
      ...opts,
      allowInstall: false
    });
    noteInstallAttempt(toolId, "declined", `project trust: ${denialReason}`);
    return discovered;
  }
  return ensureToolResolved(toolId, opts);
}
async function ensureToolResolved(toolId, opts) {
  installFailureReasons.delete(toolId);
  installAttempts.delete(toolId);
  lastEnsureResolutionSource.delete(toolId);
  const cacheResolvedPath = (result) => {
    if (result) {
      resolvedPathCache.set(toolId, result);
      void updateProbeCache(toolId, result, wasLastResolveTransient(toolId));
    }
    return result;
  };
  if (opts?.forceReinstall) {
    const ensureStartMs2 = Date.now();
    logSessionStart(`auto-install ensure ${toolId}: force reinstall \u2014 clearing caches`);
    resolvedPathCache.delete(toolId);
    try {
      const probeCache = await readProbeCache();
      delete probeCache[toolId];
      markProbeCacheChange(toolId, null);
    } catch {
    }
    if (opts.allowInstall === false) {
      noteInstallAttempt(toolId, "declined", "install disabled by caller");
      logSessionStart(`auto-install ensure ${toolId}: force reinstall blocked \u2014 install disabled, discovery only (${Date.now() - ensureStartMs2}ms)`);
      return cacheResolvedPath(await getToolPath(toolId));
    }
    if (process.env.PI_LENS_DISABLE_TOOL_INSTALL === "1") {
      installFailureReasons.set(toolId, "installation disabled by PI_LENS_DISABLE_TOOL_INSTALL=1");
      noteInstallAttempt(toolId, "declined", "installation disabled by PI_LENS_DISABLE_TOOL_INSTALL=1");
      logSessionStart(`auto-install ensure ${toolId}: refused \u2014 PI_LENS_DISABLE_TOOL_INSTALL=1`);
      return void 0;
    }
    const lock = await acquireInstallLock();
    if (!lock.release) {
      noteInstallAttempt(toolId, "skipped", lock.reason ?? "install lock held");
      logSessionStart(`auto-install ensure ${toolId}: ${lock.reason}`);
      return void 0;
    }
    let installed;
    try {
      installed = await installTool(toolId, lock.ownsLock);
    } finally {
      await lock.release();
    }
    if (!installed) {
      noteInstallAttemptIfUnrecorded(toolId, "failed", "install failed");
      logSessionStart(`auto-install ensure ${toolId}: force reinstall failed (${Date.now() - ensureStartMs2}ms)`);
      return void 0;
    }
    const result = cacheResolvedPath(await getToolPath(toolId));
    if (result) {
      logSessionStart(`auto-install ensure ${toolId}: force reinstall success at ${result} (${Date.now() - ensureStartMs2}ms)`);
    }
    return result;
  }
  const cached = resolvedPathCache.get(toolId);
  if (cached) {
    if (!isFullyQualified(cached)) {
      lastEnsureResolutionSource.set(toolId, "session-cache");
      return cached;
    }
    try {
      await fs2.access(cached);
      lastEnsureResolutionSource.set(toolId, "session-cache");
      return cached;
    } catch {
    }
    resolvedPathCache.delete(toolId);
    const probeCache = await readProbeCache();
    delete probeCache[toolId];
    markProbeCacheChange(toolId, null);
    logSessionStart(`auto-install ensure ${toolId}: cached path disappeared; re-probing`);
  }
  const diskCached = await checkProbeCache(toolId);
  if (diskCached) {
    resolvedPathCache.set(toolId, diskCached);
    lastEnsureResolutionSource.set(toolId, "probe-cache");
    logSessionStart(`auto-install ensure ${toolId}: probe cache hit \u2192 ${diskCached}`);
    return diskCached;
  }
  const inFlightKey = opts?.allowInstall === false ? `${toolId}:discovery-only` : toolId;
  const inFlight = ensureInFlight.get(inFlightKey);
  if (inFlight) {
    logSessionStart(`auto-install ensure ${toolId}: waiting for in-flight ensure (${inFlightKey})`);
    return inFlight;
  }
  const ensureStartMs = Date.now();
  const ensurePromise = (async () => {
    logSessionStart(`auto-install ensure ${toolId}: start`);
    const existingPath = await getToolPath(toolId);
    if (existingPath) {
      const tool = TOOLS.find((t) => t.id === toolId);
      const pinnedVersion = tool?.installStrategy === "npm" && tool.packageName ? parsePinnedVersion(tool.packageName) : void 0;
      if (pinnedVersion) {
        const seenVersion = lastManagedInstallVersion.get(toolId);
        if (seenVersion && seenVersion !== pinnedVersion) {
          lastManagedInstallVersion.delete(toolId);
          logSessionStart(`auto-install ensure ${toolId}: version drift (installed ${seenVersion} != pinned ${pinnedVersion}) \u2014 forcing reinstall (${Date.now() - ensureStartMs}ms)`);
          return ensureTool(toolId, {
            forceReinstall: true,
            allowInstall: opts?.allowInstall
          });
        }
      }
      resolvedPathCache.set(toolId, existingPath);
      void updateProbeCache(toolId, existingPath, wasLastResolveTransient(toolId));
      lastEnsureResolutionSource.set(toolId, "path");
      logSessionStart(`auto-install ensure ${toolId}: already available at ${existingPath} (${Date.now() - ensureStartMs}ms)`);
      return existingPath;
    }
    if (opts?.allowInstall === false) {
      noteInstallAttempt(toolId, "declined", "install disabled by caller");
      logSessionStart(`auto-install ensure ${toolId}: install disabled \u2014 discovery only, not found (${Date.now() - ensureStartMs}ms)`);
      return void 0;
    }
    if (process.env.PI_LENS_DISABLE_TOOL_INSTALL === "1") {
      installFailureReasons.set(toolId, "installation disabled by PI_LENS_DISABLE_TOOL_INSTALL=1");
      noteInstallAttempt(toolId, "declined", "installation disabled by PI_LENS_DISABLE_TOOL_INSTALL=1");
      logSessionStart(`auto-install ensure ${toolId}: refused \u2014 PI_LENS_DISABLE_TOOL_INSTALL=1 (${Date.now() - ensureStartMs}ms)`);
      return void 0;
    }
    const lock = await acquireInstallLock();
    if (!lock.release) {
      installFailureReasons.set(toolId, lock.reason ?? "install lock failed");
      noteInstallAttempt(toolId, "skipped", lock.reason ?? "install lock held");
      logSessionStart(`auto-install ensure ${toolId}: ${lock.reason}`);
      return void 0;
    }
    let installed;
    try {
      const installedByPeer = await getToolPath(toolId);
      if (installedByPeer) {
        noteInstallAttempt(toolId, "succeeded", "installed by a concurrent process");
        resolvedPathCache.set(toolId, installedByPeer);
        void updateProbeCache(toolId, installedByPeer, wasLastResolveTransient(toolId));
        return installedByPeer;
      }
      installed = await installTool(toolId, lock.ownsLock);
    } finally {
      await lock.release();
    }
    if (!installed) {
      noteInstallAttemptIfUnrecorded(toolId, "failed", "install failed");
      logSessionStart(`auto-install ensure ${toolId}: unavailable (${Date.now() - ensureStartMs}ms)`);
      return void 0;
    }
    const result = await getToolPath(toolId);
    if (result) {
      resolvedPathCache.set(toolId, result);
      void updateProbeCache(toolId, result, wasLastResolveTransient(toolId));
      logSessionStart(`auto-install ensure ${toolId}: success at ${result} (${Date.now() - ensureStartMs}ms)`);
    } else {
      logSessionStart(`auto-install ensure ${toolId}: unavailable (${Date.now() - ensureStartMs}ms)`);
    }
    return result;
  })();
  ensureInFlight.set(inFlightKey, ensurePromise);
  try {
    return await ensurePromise;
  } finally {
    if (ensureInFlight.get(inFlightKey) === ensurePromise) {
      ensureInFlight.delete(inFlightKey);
    }
  }
}
async function getToolEnvironment() {
  const localBin = path3.join(TOOLS_DIR, "node_modules", ".bin");
  const currentPath = process.env.PATH || process.env.Path || process.env.path || "";
  const separator = process.platform === "win32" ? ";" : ":";
  const nodeDir = path3.dirname(process.execPath);
  const withNode = nodeDir ? `${nodeDir}${separator}${currentPath}` : currentPath;
  const augmentedPath = `${GITHUB_BIN_DIR}${separator}${localBin}${separator}${withNode}`;
  const env = {
    ...process.env,
    PATH: augmentedPath
  };
  if (process.platform === "win32") {
    env.Path = augmentedPath;
  }
  return env;
}
async function checkAllTools() {
  const results = [];
  for (const tool of TOOLS) {
    const path4 = await getToolPath(tool.id);
    results.push({
      id: tool.id,
      name: tool.name,
      installed: path4 !== void 0,
      path: path4
    });
  }
  return results;
}
function isKnownToolId(toolId) {
  return TOOLS.some((tool) => tool.id === toolId);
}
function getToolInstallStrategy(toolId) {
  return TOOLS.find((tool) => tool.id === toolId)?.installStrategy;
}
var GITHUB_TOOLS = [
  "cljfmt",
  "php-cs-fixer",
  "shellcheck",
  "shfmt",
  "rust-analyzer",
  "golangci-lint",
  "ktlint",
  "actionlint",
  "zizmor",
  "typos-lsp",
  "tflint",
  "terragrunt",
  "terraform-ls",
  "zls",
  "hadolint",
  "helm",
  "gitleaks",
  "taplo",
  "vale",
  "opengrep",
  "deno",
  "clojure-lsp",
  "cue",
  "gleam",
  "typstyle",
  "tinymist",
  "marksman",
  "expert"
];
function resolveGitHubAsset(toolId, platform, arch) {
  const tool = TOOLS.find((t) => t.id === toolId);
  return tool?.github?.assetMatch(platform, arch);
}
function resolveGitHubAssetLauncher(toolId, _platform, assetName) {
  const tool = TOOLS.find((t) => t.id === toolId);
  return tool?.github ? launcherForGitHubAsset(tool.github, assetName) : void 0;
}
function resolveGitHubInstalledBinaryName(toolId, platform, assetName) {
  const tool = TOOLS.find((t) => t.id === toolId);
  if (!tool)
    return void 0;
  return getGitHubInstalledBinaryName(tool.binaryName ?? tool.id, platform, assetName);
}
function resolveGitHubArchiveBinaryCandidates(toolId, platform, assetName) {
  const tool = TOOLS.find((t) => t.id === toolId);
  if (!tool)
    return void 0;
  const binaryName = tool.github?.binaryInArchive ?? tool.binaryName ?? tool.id;
  return getArchiveBinaryCandidates(binaryName, platform, assetName);
}
var ASSET_SIDECAR_SUFFIXES = [
  ".asc",
  ".sig",
  ".minisig",
  ".pem",
  ".cert",
  ".sbom",
  ".sha256",
  ".sha256sum",
  ".md5"
];
function isAssetSidecar(name) {
  const lower = name.toLowerCase();
  return ASSET_SIDECAR_SUFFIXES.some((suffix) => lower.endsWith(suffix));
}
function pickReleaseAsset(assets, assetSubstring) {
  return assets.find((a) => a.name === assetSubstring) ?? assets.find((a) => a.name.includes(assetSubstring) && !isAssetSidecar(a.name));
}
function deriveHashiCorpReleaseAsset(tool, tagName, assetSubstring) {
  const product = tool.github?.hashiCorpReleaseProduct;
  if (!product || !tagName)
    return void 0;
  const version = tagName.replace(/^v/, "").trim();
  if (!version)
    return void 0;
  const assetName = `${product}_${version}_${assetSubstring}`;
  return {
    name: assetName,
    browser_download_url: `https://releases.hashicorp.com/${product}/${version}/${assetName}`
  };
}
function resolveDerivedHashiCorpReleaseAsset(toolId, tagName, platform, arch) {
  const tool = TOOLS.find((t) => t.id === toolId);
  if (!tool)
    return void 0;
  const assetSubstring = tool.github?.assetMatch(platform, arch);
  if (!assetSubstring)
    return void 0;
  return deriveHashiCorpReleaseAsset(tool, tagName, assetSubstring);
}

export {
  commitDurableStore,
  commitDurableStoreAsync,
  findLocalZizmorConfig,
  isZizmorAuditTarget,
  resetZizmorTokenAvailability,
  resolveZizmorGitHubToken,
  logSessionStart,
  getManagedToolsDir,
  TOOLS,
  getToolVerificationTimeout,
  getInstallFailureReason,
  getInstallAttempt,
  getLastEnsureResolutionSource,
  resetResolvedPathCache,
  flushProbeCache,
  checkProbeCache,
  updateProbeCache,
  resetProbeCacheStateForTesting,
  _peekEnsureInFlightForTesting,
  resetPathWalkMemo,
  isCommandAvailable,
  isSpawnableCommand,
  isLspTransportRequiredError,
  parsePinnedVersion,
  packageEntryVerification,
  verifyNpmPackageEntry,
  verifyToolBinary,
  getAllToolStatuses,
  isToolInstalled,
  resolvePlatformPackageBinary,
  wasLastResolveTransient,
  getToolPath,
  findManagedToolBinary,
  userBaseProbeResult,
  npmToolNeedsPostinstall,
  getRefreshableManagedNpmTools,
  getRefreshableManagedTools,
  isManagedToolPresent,
  acquireManagedInstallGate,
  refreshManagedTool,
  resolveManagedNpmBinPath,
  invalidateManagedToolResolution,
  resolveArchiveUrl,
  resolveArchiveKind,
  swapExtractedDir,
  pipCommandCandidates,
  pipScriptsDir,
  installTool,
  ensureTool,
  getToolEnvironment,
  checkAllTools,
  isKnownToolId,
  getToolInstallStrategy,
  GITHUB_TOOLS,
  resolveGitHubAsset,
  resolveGitHubAssetLauncher,
  resolveGitHubInstalledBinaryName,
  resolveGitHubArchiveBinaryCandidates,
  pickReleaseAsset,
  resolveDerivedHashiCorpReleaseAsset
};
