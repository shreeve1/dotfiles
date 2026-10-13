import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  stripAnsi
} from "./chunk-FC4RP4I2.js";
import {
  augmentPythonEnvironment,
  detectPythonEnvironment,
  emitBounded
} from "./chunk-FCSOVF55.js";
import {
  resolveGitCheckout
} from "./chunk-PNQDPDRC.js";
import {
  PathKeyedMap
} from "./chunk-Z3CCVDUB.js";
import {
  resolveToolCwd
} from "./chunk-Q7DUK4LX.js";
import {
  findGlobalBinary,
  findLocalBinAt,
  localBinPath
} from "./chunk-AW7R2GWG.js";
import {
  getIsolatedNpxSpawnOptions
} from "./chunk-RWWYJ623.js";
import {
  resolveLanguageRootForFile
} from "./chunk-QOBUHWHX.js";
import {
  safeSpawn,
  safeSpawnAsync
} from "./chunk-C34ZXZ7O.js";
import {
  detectFileKind
} from "./chunk-PHDMFAKM.js";
import {
  detectFileRole
} from "./chunk-2BBLFX75.js";
import {
  findNearestDirWithAnyBasename
} from "./chunk-XVF2VVXP.js";
import {
  LEDGER_FIELD_MAX,
  recordDegradationOnce
} from "./chunk-JAU72XNY.js";
import {
  createSubsystemLogger
} from "./chunk-XTMJ7XDT.js";
import {
  BoundedFifoMap
} from "./chunk-ABBOA7UD.js";
import {
  findNearestMarkerRootDetailed,
  isRealGitMarker,
  isUnderDir,
  minimatch,
  normalizeEphemeralMapKey,
  normalizeMapKey,
  pathsEqual,
  toPosix
} from "./chunk-N2H3ZPZY.js";

// dist/clients/test-runner-client.js
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

// dist/clients/run-duration.js
function isMeasuredDuration(duration) {
  return typeof duration === "number" && Number.isFinite(duration) && duration >= 0;
}
function toMeasuredDurationMs(duration) {
  return isMeasuredDuration(duration) ? Math.round(duration) : void 0;
}
function formatRunDurationMs(duration) {
  return isMeasuredDuration(duration) ? `${Math.round(duration)}ms` : "unmeasured";
}

// dist/clients/test-runner-client.js
function isRunnerErrorResult(result) {
  return result.failed === 0 && !!result.error;
}
var SOURCE_TO_TEST_PATTERNS = [
  {
    ext: ".ts",
    testExts: [".test.ts", ".spec.ts"],
    dirs: ["__tests__", "tests", ".", "__tests__"]
  },
  {
    ext: ".tsx",
    testExts: [".test.tsx", ".spec.tsx"],
    dirs: ["__tests__", "tests", ".", "__tests__"]
  },
  {
    ext: ".js",
    testExts: [".test.js", ".spec.js"],
    dirs: ["__tests__", "tests", ".", "__tests__"]
  },
  {
    ext: ".jsx",
    testExts: [".test.jsx", ".spec.jsx"],
    dirs: ["__tests__", "tests", ".", "__tests__"]
  },
  {
    ext: ".py",
    testExts: ["test_*.py", "*_test.py"],
    dirs: ["tests", "test", ".", "."]
  },
  { ext: ".go", testExts: ["_test.go"], dirs: [".", ".", ".", "."] },
  // Go tests are co-located
  { ext: ".rs", testExts: [".rs"], dirs: ["tests", "tests", "src", "."] },
  // Rust: tests/ or #[test] in src
  // PHPUnit convention: tests/ mirrors src/ with ClassNameTest.php naming
  // (e.g. src/Foo/Bar.php -> tests/Foo/BarTest.php). Basename is already the
  // class name (PHP files are named after their class), so no case transform
  // is needed — the mirrored-directory search below handles the tests/ root.
  { ext: ".php", testExts: ["Test.php"], dirs: ["tests"] },
  // ExUnit convention: test/ mirrors lib/ with a _test.exs suffix on the same
  // basename (e.g. lib/accounts/user.ex -> test/accounts/user_test.exs).
  { ext: ".ex", testExts: ["_test.exs"], dirs: ["test"] }
];
function findHoistedNodeModulesPackage(cwd, packageName) {
  return findNearestDirWithAnyBasename(path.resolve(cwd), [
    `node_modules/${packageName}`
  ]);
}
var MAX_PYTEST_RECURSE_DEPTH = 3;
var TURN_END_EXCLUDED_TEST_GLOBS = [
  "**/integration/**",
  "**/e2e/**",
  "**/*.integration.*",
  "**/*.e2e.*"
];
function recordCheckoutIdentityGap(metadata) {
  recordDegradationOnce({
    kind: "test-checkout-identity-unavailable",
    subject: createHash("sha256").update(JSON.stringify(metadata)).digest("hex"),
    reason: "cannot establish automatic test checkout identity",
    metadata
  });
}
function foreignGitRoot(testFilePath, cwd) {
  let realCwd;
  let realTarget;
  try {
    realCwd = fs.realpathSync.native(path.resolve(cwd));
    realTarget = fs.realpathSync.native(path.resolve(cwd, toPosix(testFilePath)));
  } catch (error_) {
    const errorCode = filesystemErrorCode(error_);
    if (errorCode === "ENOENT" || errorCode === "ENOTDIR")
      return null;
    recordCheckoutIdentityGap({
      cwd,
      candidate: testFilePath,
      lookup: "filesystem",
      detail: "realpath",
      errorCode
    });
    return null;
  }
  const targetWalk = findNearestMarkerRootDetailed(path.dirname(realTarget), [".git"], {
    markerPredicate: (marker) => isRealGitMarker(marker, true)
  });
  if (targetWalk.kind !== "found") {
    if (targetWalk.kind === "unavailable") {
      recordCheckoutIdentityGap({
        cwd,
        candidate: testFilePath,
        lookup: "target-root",
        detail: "marker-error",
        markerPath: targetWalk.markerPath,
        errorCode: filesystemErrorCode(targetWalk.cause)
      });
    } else if (targetWalk.reason === "depth-limit") {
      recordCheckoutIdentityGap({
        cwd,
        candidate: testFilePath,
        lookup: "target-root",
        detail: targetWalk.reason
      });
    }
    return null;
  }
  const root = targetWalk.root;
  if (!isUnderDir(realCwd, root))
    return root;
  const dispatchWalk = findNearestMarkerRootDetailed(realCwd, [".git"], {
    markerPredicate: (marker) => isRealGitMarker(marker, true)
  });
  if (dispatchWalk.kind !== "found") {
    recordCheckoutIdentityGap({
      cwd,
      candidate: testFilePath,
      lookup: "dispatch-root",
      ...dispatchWalk.kind === "unavailable" ? {
        detail: "marker-error",
        markerPath: dispatchWalk.markerPath,
        errorCode: filesystemErrorCode(dispatchWalk.cause)
      } : { detail: dispatchWalk.reason }
    });
    return null;
  }
  return !pathsEqual(root, dispatchWalk.root) ? root : null;
}
function sharesCommonDir(cwd, checkoutRoot) {
  const dispatch = resolveGitCheckout(cwd);
  const excluded = resolveGitCheckout(checkoutRoot);
  return dispatch !== null && excluded !== null && pathsEqual(dispatch.commonDir, excluded.commonDir);
}
function isExcludedTestTarget(testFilePath, cwd) {
  const absolute = path.resolve(cwd, toPosix(testFilePath));
  let rel = toPosix(path.relative(cwd, absolute));
  if (rel === "" || rel === ".." || rel.startsWith("../") || path.isAbsolute(rel)) {
    const realTarget = canonicalFailedPath(absolute);
    const realCwd = canonicalFailedPath(cwd);
    if (pathsEqual(realTarget, realCwd) || !isUnderDir(realTarget, realCwd))
      return true;
    rel = toPosix(path.relative(realCwd, realTarget));
  }
  const checkoutRoot = foreignGitRoot(testFilePath, cwd);
  if (checkoutRoot) {
    recordDegradationOnce({
      kind: "test-target-foreign-checkout",
      subject: createHash("sha256").update(JSON.stringify([cwd, testFilePath, checkoutRoot])).digest("hex"),
      reason: "automatic test target belongs to another Git checkout",
      metadata: {
        cwd,
        candidate: testFilePath,
        checkoutRoot,
        sameCommonDir: sharesCommonDir(cwd, checkoutRoot)
      }
    });
    return true;
  }
  return TURN_END_EXCLUDED_TEST_GLOBS.some((glob) => minimatch(rel, glob, { dot: true, nocase: true }));
}
var RUNNERS = {
  vitest: {
    kinds: ["jsts"],
    configFiles: ["vitest.config.ts", "vitest.config.js", "vitest.config.mjs"],
    command: "npx",
    binName: "vitest",
    args: (testFile, _cwd) => [
      "vitest",
      "run",
      testFile,
      "--reporter=json",
      "--passWithNoTests"
    ],
    parseJson: true
  },
  jest: {
    kinds: ["jsts"],
    configFiles: [
      "jest.config.ts",
      "jest.config.js",
      "jest.config.json",
      ".jestrc.js"
    ],
    command: "npx",
    binName: "jest",
    args: (testFile, _cwd) => [
      "jest",
      testFile,
      "--json",
      "--passWithNoTests",
      "--forceExit"
    ],
    parseJson: true
  },
  pytest: {
    kinds: ["python"],
    configFiles: ["pytest.ini", "pyproject.toml", "setup.cfg", "tox.ini"],
    // #2879 review round 3, F7: `pyproject.toml` is CONTENT-conditional in
    // detection — the Priority-1 loop accepts it only when it carries
    // `[tool.pytest.ini_options]` — but the cwd seam walks basenames, so
    // handing `configFiles` over verbatim anchored the child on the very
    // file detection had refused. Omitting it here makes the spawn walk
    // stop only on evidence the detector itself would accept; a project
    // whose ONLY pytest config is a real `[tool.pytest.ini_options]`
    // section therefore falls back to the dispatch root, which is exactly
    // where master ran it. (The proper fix is to carry detection's
    // accepted evidence path into the spawn resolution instead of
    // re-deriving it from a basename table — filed as a follow-up.)
    spawnCwdMarkers: ["pytest.ini", "tox.ini", "setup.cfg"],
    command: "python",
    args: (testFile, _cwd) => ["-m", "pytest", testFile, "--tb=short", "-q"],
    parseJson: false
    // pytest JSON requires plugin, use text parsing
  },
  go: {
    kinds: ["go"],
    configFiles: ["go.mod"],
    command: "go",
    args: (testFile, cwd) => {
      const relPath = path.relative(cwd, testFile);
      const pkgDir = path.dirname(relPath);
      return ["test", `-run`, ".", `./${pkgDir === "." ? "." : pkgDir}`];
    },
    parseJson: false
    // Go test output is text-based
  },
  cargo: {
    kinds: ["rust"],
    configFiles: ["Cargo.toml"],
    command: "cargo",
    args: (_testFile, _cwd) => ["test", "--no-fail-fast"],
    parseJson: false
    // cargo test output is text-based
  },
  dotnet: {
    kinds: ["csharp", "fsharp"],
    configFiles: ["*.csproj", "*.sln"],
    command: "dotnet",
    args: (_testFile, _cwd) => ["test", "--no-build"],
    parseJson: false
  },
  gradle: {
    kinds: ["java", "kotlin"],
    // #2870: `settings.gradle.kts` alongside its Groovy sibling — a
    // Kotlin-DSL build whose root carries only the settings script was
    // invisible to detection, the same one-spelling gap the java root
    // markers had.
    configFiles: [
      "build.gradle",
      "build.gradle.kts",
      "settings.gradle",
      "settings.gradle.kts"
    ],
    // #3956: a cwd-relative launcher must carry a separator, or the Windows
    // resolver treats it as a PATH-only name and never looks in the child cwd
    // where the wrapper actually lives. Forward slash is the platform-neutral
    // spelling the resolver accepts on win32 (same #2870 lesson as ./gradlew).
    command: process.platform === "win32" ? "./gradlew.bat" : "./gradlew",
    // The child's cwd must be a directory the wrapper actually lives in.
    spawnCwdMarkers: ["gradlew", "gradlew.bat"],
    args: (_testFile, _cwd) => ["test", "--no-daemon"],
    parseJson: false
  },
  maven: {
    kinds: ["java", "kotlin"],
    configFiles: ["pom.xml"],
    command: "mvn",
    args: (_testFile, _cwd) => ["test", "-q"],
    parseJson: false
  },
  rspec: {
    kinds: ["ruby"],
    configFiles: [".rspec", "spec/spec_helper.rb"],
    command: "bundle",
    // The real binary is "bundle" (the command runs `bundle exec rspec
    // <file>`), NOT "rspec" — without this, binName defaulted to the
    // runner key "rspec" and local/global resolution looked for the wrong
    // binary name (#1098).
    binName: "bundle",
    args: (testFile, _cwd) => ["exec", "rspec", testFile],
    parseJson: false
  },
  minitest: {
    kinds: ["ruby"],
    configFiles: ["Gemfile"],
    command: "ruby",
    args: (testFile, _cwd) => ["-Itest", testFile],
    parseJson: false
  },
  phpunit: {
    kinds: ["php"],
    // phpunit.xml(.dist) is the strong signal; composer.json is checked for
    // a require-dev dependency on phpunit/phpunit (see the special case in
    // detectRunner's Priority-1 loop, mirroring the pytest/pyproject.toml
    // handling above).
    configFiles: ["phpunit.xml", "phpunit.xml.dist", "composer.json"],
    // #2879 review round 3, F7: same shape as pytest's `pyproject.toml`,
    // and this one is load-bearing — phpunit reads `phpunit.xml` from its
    // CWD only, so a child launched in a directory whose `composer.json`
    // carries no `phpunit/phpunit` dependency runs with no bootstrap and
    // no autoloader, and the resulting fatal error reaches the agent as a
    // test failure (measured end to end with a fake phpunit recording its
    // own cwd). `composer.json` is an anchor, never phpunit evidence.
    spawnCwdMarkers: ["phpunit.xml", "phpunit.xml.dist"],
    command: "phpunit",
    args: (testFile, _cwd) => [testFile],
    parseJson: false
    // PHPUnit's default CLI output is text-based
  },
  mix: {
    kinds: ["elixir"],
    configFiles: ["mix.exs"],
    command: "mix",
    args: (testFile, _cwd) => ["test", testFile],
    parseJson: false
    // mix test's default output is text-based
  }
};
function stripWrapperArgs(binName, args) {
  if (args[0] === binName)
    return args.slice(1);
  if (args[0] === "-m" && args[1] === binName)
    return args.slice(2);
  return args;
}
var MAX_FAILED_TARGETS_PER_RUNNER = 32;
var MAX_FAILED_TARGET_CHECKS_PER_SELECTION = 8;
var FAILED_TARGET_DETAIL_CAP_PER_TURN = 8;
function canonicalFailedPath(filePath) {
  const absolute = path.resolve(filePath);
  try {
    return normalizeMapKey(fs.realpathSync.native(absolute));
  } catch {
    return normalizeMapKey(absolute);
  }
}
function canonicalProjectRoot(cwd) {
  const absolute = path.resolve(cwd);
  try {
    return {
      key: normalizeEphemeralMapKey(fs.realpathSync.native(absolute)),
      resolved: true
    };
  } catch {
    return { key: normalizeEphemeralMapKey(absolute), resolved: false };
  }
}
var MAX_CANONICAL_ROOT_MEMO_ENTRIES = 512;
function filesystemErrorCode(error) {
  if (error !== null && typeof error === "object" && "code" in error && typeof error.code === "string") {
    return error.code;
  }
  return void 0;
}
var PYTEST_SUMMARY_OUTCOME = "(?:passed|failed|skipped|reruns?|errors?|warnings?|deselected|xfailed|xpassed)";
var PYTEST_SUMMARY_LINE = new RegExp(`^\\s*(?:=+\\s*)?\\d+\\s+${PYTEST_SUMMARY_OUTCOME}(?:\\s*,\\s*\\d+\\s+${PYTEST_SUMMARY_OUTCOME})*\\s+in\\s+[\\d.]+s(?:\\s*=+)?\\s*$`, "i");
function parsePytestSummary(output) {
  const normalizedOutput = stripAnsi(output);
  const summaryLine = normalizedOutput.split(/\r?\n/).reverse().find((line) => PYTEST_SUMMARY_LINE.test(line));
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  if (!summaryLine)
    return { passed, failed, skipped };
  const summaryBody = summaryLine.replace(/^=+\s*|\s*=+\s*$/g, "");
  for (const field of summaryBody.split(",")) {
    const [countText, outcome] = field.trim().split(/\s+/, 2);
    const count = Number.parseInt(countText, 10);
    if (!Number.isFinite(count))
      continue;
    switch (outcome) {
      case "passed":
        passed = count;
        break;
      case "failed":
        failed = count;
        break;
      case "skipped":
        skipped = count;
        break;
    }
  }
  const durationMatch = /in\s+([\d.]+)s/.exec(summaryLine);
  const duration = durationMatch ? Math.round(Number.parseFloat(durationMatch[1]) * 1e3) : void 0;
  return { passed, failed, skipped, duration };
}
var TestRunnerClient = class {
  log;
  // This is an instance-lifetime memo of RESOLVED spellings only, which leaves
  // two temporal edges. A symlink retargeted mid-session keeps its old
  // resolution until a new client instance — acceptable because round 2's
  // evidence re-validation already handles verdict-level staleness (positive
  // verdicts re-stat their config file). A spelling that did NOT resolve is
  // never memoized (#2077): the fallback key is a guess about a path that does
  // not exist yet, so memoizing it would pin an alias probed before its
  // symlink was created to a stale verdict for the instance's life. Re-probing
  // costs one failing realpath per call, and only for a cwd that does not
  // resolve — a state where `detectRunner` already walks node_modules on every
  // call. Keep the memo bounded so pathological spelling churn cannot grow it
  // without limit.
  canonicalRootMemo = new BoundedFifoMap(MAX_CANONICAL_ROOT_MEMO_ENTRIES);
  availableRunners = new PathKeyedMap(normalizeEphemeralMapKey);
  failedTestsByRunner = /* @__PURE__ */ new Map();
  failedTargetSequence = 0;
  statFailedTarget;
  // Best-effort vitest config `test.include`/`test.exclude` globs, scraped as
  // plain text (never executed) and cached per cwd so the config file is
  // only read/parsed once, not on every edit. `null` means "no config found
  // or it couldn't be parsed in the simple shape we look for" — callers
  // treat that as "no additional signal" and fall back to naming-convention
  // detection only.
  vitestTestGlobsCache = new PathKeyedMap(normalizeEphemeralMapKey);
  constructor(verbose = false, options = {}) {
    this.log = verbose ? createSubsystemLogger("test-runner") : () => {
    };
    this.statFailedTarget = options.statFailedTarget ?? ((filePath) => void fs.statSync(filePath));
  }
  getCanonicalProjectRoot(cwd) {
    const cached = this.canonicalRootMemo.get(cwd);
    if (cached !== void 0)
      return cached;
    const { key, resolved } = canonicalProjectRoot(cwd);
    if (!resolved)
      return key;
    this.canonicalRootMemo.set(cwd, key);
    return key;
  }
  /** #2442 test-only: exercise canonicalRootMemo's bounded eviction directly. */
  _getCanonicalProjectRootForTests(cwd) {
    return this.getCanonicalProjectRoot(cwd);
  }
  getRunnerAvailability(byRunner, runner) {
    const cached = byRunner?.get(runner);
    if (!cached)
      return void 0;
    if (cached.available && cached.evidencePath !== void 0 && !fs.existsSync(cached.evidencePath)) {
      byRunner?.delete(runner);
      return void 0;
    }
    return cached.available;
  }
  /**
   * #2252: only a POSITIVE verdict is memoized. A negative one has no
   * `evidencePath` to re-stat, so `getRunnerAvailability` had no way to tell
   * "still absent" from "a config file just appeared" and served the first
   * miss for the client's whole process lifetime — measured live: probe an
   * empty directory, add `vitest.config.ts`, and the SAME client kept
   * answering "no runner". Same precedent as #2242's alias-canonicalization
   * fix (`clients/test-runner-client.ts`'s `getCanonicalProjectRoot`): drop
   * the memo write on the failure branch rather than adding a TTL or a
   * re-arm signal. The cost is bounded and already paid today — a cache miss
   * re-runs the exact same `configFiles.some(fs.existsSync)` walk this
   * method's caller already does on every FIRST probe of a runner.
   */
  setRunnerAvailability(byRunner, runner, available, evidencePath) {
    if (!available)
      return;
    byRunner.set(runner, { available, evidencePath });
  }
  /**
   * Which runners may be handed `sourceFilePath`, and the directory their
   * config files are probed in (#2870).
   *
   * `eligible === null` means "no file was named" — the session-level
   * caller (`runtime-session.ts`'s summary) asks "what runner does this
   * project have" and has no file to scope to, so every runner stays a
   * candidate and the probe root is the dispatch root, exactly as before.
   *
   * A named file resolves TWO independent facts, and the order matters:
   *  - its KIND decides which runners may claim it at all (the gate), and
   *  - `resolveLanguageRootForFile` decides WHERE that kind's config files
   *    are looked for (the anchor) — the same per-kind, cached,
   *    workspace-clamped walk the dispatch runners already resolve their
   *    roots with, not a private walker.
   *
   * Returning `null` means no runner can own this file (a kind no entry
   * claims: markdown, yaml, an unknown extension), so no directory is
   * probed at all.
   */
  resolveDetectionScope(cwd, sourceFilePath) {
    if (sourceFilePath === void 0)
      return { root: cwd, eligible: null };
    const absoluteFile = path.resolve(sourceFilePath);
    if (!isUnderDir(absoluteFile, path.resolve(cwd))) {
      return { root: cwd, eligible: null };
    }
    const kind = detectFileKind(absoluteFile);
    if (!kind)
      return null;
    const eligible = new Set(Object.entries(RUNNERS).filter(([, config]) => config.kinds.includes(kind)).map(([name]) => name));
    if (eligible.size === 0)
      return null;
    return {
      root: resolveLanguageRootForFile(absoluteFile, cwd),
      eligible
    };
  }
  /**
   * Check if a test runner is available in the project
   * Detection order:
   * 1. Config files (vitest.config.ts, jest.config.js, etc.)
   * 2. package.json dependencies
   * 3. node_modules presence
   *
   * #2870: when `sourceFilePath` is given, the answer is scoped to that
   * file's kind and resolved language root — see `resolveDetectionScope`.
   */
  detectRunner(dispatchRoot, sourceFilePath) {
    const scope = this.resolveDetectionScope(dispatchRoot, sourceFilePath);
    if (!scope)
      return null;
    const { root, eligible } = scope;
    const anchored = this.probeRunnersAt(root, eligible);
    if (anchored)
      return anchored;
    const dispatch = path.resolve(dispatchRoot);
    if (path.resolve(root) !== dispatch) {
      const atDispatch = this.probeRunnersAt(dispatch, eligible);
      if (atDispatch)
        return atDispatch;
    }
    const isPythonSource = typeof sourceFilePath === "string" && sourceFilePath.endsWith(".py");
    if (!isPythonSource)
      return null;
    try {
      const whichCmd = process.platform === "win32" ? "where" : "which";
      const result = safeSpawn(whichCmd, ["pytest"], {
        timeout: 2e3
      });
      if (result.status === 0) {
        this.log("Detected pytest globally");
        return { runner: "pytest", config: RUNNERS.pytest };
      }
    } catch (err) {
      void err;
    }
    return null;
  }
  /**
   * Priorities 1-4 of the detection ladder, against ONE directory: config
   * files, `package.json` dependencies, a hoisted `node_modules`, and the
   * glob-capable whole-project runners. `eligible` is the kind gate
   * (#2870); `null` means no file was named and every runner is a
   * candidate. Returns `null` when this directory configures no eligible
   * runner, which is what lets `detectRunner` try the dispatch root next.
   */
  probeRunnersAt(cwd, eligible) {
    const rootKey = this.getCanonicalProjectRoot(cwd);
    let byRunner = this.availableRunners.get(rootKey);
    if (!byRunner) {
      byRunner = /* @__PURE__ */ new Map();
      this.availableRunners.set(rootKey, byRunner);
    }
    for (const [name, config] of Object.entries(RUNNERS)) {
      if (eligible && !eligible.has(name))
        continue;
      const cached = this.getRunnerAvailability(byRunner, name);
      if (cached !== void 0) {
        if (cached) {
          return { runner: name, config };
        }
        continue;
      }
      let configEvidencePath;
      const found = config.configFiles.some((cf) => {
        if (name === "pytest" && cf === "pyproject.toml") {
          const pyprojectPath = path.join(cwd, cf);
          if (!fs.existsSync(pyprojectPath))
            return false;
          try {
            const pyproject = fs.readFileSync(pyprojectPath, "utf-8");
            const matches2 = pyproject.includes("[tool.pytest.ini_options]");
            if (matches2)
              configEvidencePath = pyprojectPath;
            return matches2;
          } catch {
            return false;
          }
        }
        if (name === "phpunit" && cf === "composer.json") {
          const composerPath = path.join(cwd, cf);
          if (!fs.existsSync(composerPath))
            return false;
          try {
            const composer = JSON.parse(fs.readFileSync(composerPath, "utf-8"));
            const allDeps = {
              ...composer.require,
              ...composer["require-dev"]
            };
            const matches2 = Boolean(allDeps["phpunit/phpunit"]);
            if (matches2)
              configEvidencePath = composerPath;
            return matches2;
          } catch {
            return false;
          }
        }
        const candidate = path.join(cwd, cf);
        const matches = fs.existsSync(candidate);
        if (matches)
          configEvidencePath = candidate;
        return matches;
      });
      this.setRunnerAvailability(byRunner, name, found, configEvidencePath);
      if (found) {
        this.log(`Detected runner via config: ${name}`);
        return { runner: name, config };
      }
    }
    const packageJsonPath = path.join(cwd, "package.json");
    try {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      const allDeps = {
        ...pkg.dependencies,
        ...pkg.devDependencies
      };
      if (allDeps.vitest && (!eligible || eligible.has("vitest"))) {
        this.log("Detected vitest in package.json");
        this.setRunnerAvailability(byRunner, "vitest", true, packageJsonPath);
        return { runner: "vitest", config: RUNNERS.vitest };
      }
      if (allDeps.jest && (!eligible || eligible.has("jest"))) {
        this.log("Detected jest in package.json");
        this.setRunnerAvailability(byRunner, "jest", true, packageJsonPath);
        return { runner: "jest", config: RUNNERS.jest };
      }
      if ((allDeps.pytest || allDeps["pytest-cov"]) && (!eligible || eligible.has("pytest"))) {
        this.log("Detected pytest in package.json (unusual)");
        this.setRunnerAvailability(byRunner, "pytest", true, packageJsonPath);
        return { runner: "pytest", config: RUNNERS.pytest };
      }
    } catch (err) {
      void err;
    }
    for (const name of ["vitest", "jest"]) {
      if (eligible && !eligible.has(name))
        continue;
      const hoisted = findHoistedNodeModulesPackage(cwd, name);
      if (hoisted) {
        this.log(`Detected ${name} in node_modules (${hoisted})`);
        return { runner: name, config: RUNNERS[name] };
      }
    }
    for (const name of ["go", "cargo", "dotnet", "gradle", "maven"]) {
      if (eligible && !eligible.has(name))
        continue;
      const config = RUNNERS[name];
      const found = config.configFiles.some((cf) => {
        if (cf.includes("*")) {
          try {
            const files = fs.readdirSync(cwd);
            return files.some((f) => new RegExp(cf.replace(/\*/g, ".*")).test(f));
          } catch {
            return false;
          }
        }
        return fs.existsSync(path.join(cwd, cf));
      });
      if (found) {
        this.log(`Detected ${name} from config file`);
        return { runner: name, config };
      }
    }
    return null;
  }
  /**
   * Depth-bounded breadth-first search under `rootDir` for a pytest-style
   * test file matching `pattern` (exact, e.g. `test_foo.py`) or the
   * looser `test_*<basename>*.py` convention. Used as a last-resort
   * fallback when a Python test suite groups tests by kind
   * (`tests/unit/`, `tests/integration/`) instead of mirroring the
   * source directory layout, so the exact-mirror candidates in
   * `findTestFile` don't match. Bounded by `maxDepth` levels below
   * `rootDir` and skips hidden directories and `__pycache__` — never an
   * unbounded walk of the whole tests tree.
   */
  findPytestMatchRecursive(rootDir, pattern, basename2, maxDepth, acceptCandidate) {
    const queue = [
      { dir: rootDir, depth: 0 }
    ];
    while (queue.length > 0) {
      const next = queue.shift();
      if (!next)
        break;
      const { dir, depth } = next;
      let entries;
      try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
      } catch {
        continue;
      }
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isFile()) {
          if ((entry.name === pattern || entry.name.startsWith("test_") && entry.name.endsWith(".py") && entry.name.includes(basename2)) && acceptCandidate(fullPath)) {
            return fullPath;
          }
        } else if (entry.isDirectory() && depth < maxDepth) {
          if (entry.name === "__pycache__" || entry.name.startsWith("."))
            continue;
          queue.push({ dir: fullPath, depth: depth + 1 });
        }
      }
    }
    return null;
  }
  /**
   * Path of `dir` relative to `cwd`, using forward slashes, or null if `dir`
   * is not inside `cwd` (e.g. resolves to `..` or an absolute path).
   * Used to compute a mirrored test-tree subdirectory (e.g. `clients` for
   * `clients/knip-client.ts`, so `tests/clients/knip-client.test.ts` is
   * checked alongside the flat `tests/knip-client.test.ts` candidate).
   */
  relativeSourceDir(sourceFilePath, cwd) {
    const dir = path.dirname(sourceFilePath);
    const relDir = path.relative(cwd, path.resolve(cwd, dir));
    if (!relDir || relDir === "." || relDir.startsWith("..") || path.isAbsolute(relDir)) {
      return null;
    }
    return relDir;
  }
  /**
   * Best-effort, text-only scrape of a vitest config's `test.include` /
   * `test.exclude` arrays. This deliberately does NOT execute the config
   * file (that would mean loading arbitrary ESM/TS via Vite's config
   * loader — too heavy for a per-edit hot path). It just looks for a
   * simple `include: [ ... ]` / `exclude: [ ... ]` shape with string
   * literals inside and pulls those out with a regex.
   *
   * Returns `null` (never throws) when there's no vitest config file, it
   * can't be read, or the include/exclude shape isn't a plain array of
   * string literals (e.g. it's built from a function call, spread, or
   * template expression) — anything more dynamic than that is out of
   * scope for this heuristic.
   *
   * Cached per `cwd`, including a `null` result — #2252 F2: a project with
   * no vitest config, or one this heuristic can't scrape, is a COMMON shape
   * (every non-vitest project pays this on every edit otherwise; measured
   * ~1500x — 0.4µs cached vs. 598.7µs re-reading the candidate list every
   * call). The cache entry is revalidated on every read, the same shape
   * `getRunnerAvailability` uses for a positive verdict: bounded
   * `fs.existsSync` checks against the config file the result was derived
   * from (or, when none existed, against the candidate list itself), never
   * a full re-read/re-parse on a cache hit. So a config file appearing (or
   * a broken one being fixed) still converges — only the FULL parse is
   * paid once, not the existence check.
   */
  parseVitestTestGlobs(cwd) {
    const rootKey = this.getCanonicalProjectRoot(cwd);
    const candidates = [...RUNNERS.vitest.configFiles, "vitest.config.mts"];
    const cached = this.vitestTestGlobsCache.get(rootKey);
    if (cached !== void 0) {
      const stillValid = cached.evidencePath !== void 0 ? fs.existsSync(cached.evidencePath) : !candidates.some((cf) => fs.existsSync(path.join(cwd, cf)));
      if (stillValid)
        return cached.result;
      this.vitestTestGlobsCache.delete(rootKey);
    }
    let content = null;
    let foundPath;
    for (const cf of candidates) {
      const candidatePath = path.join(cwd, cf);
      try {
        content = fs.readFileSync(candidatePath, "utf-8");
        foundPath = candidatePath;
        break;
      } catch {
        continue;
      }
    }
    let result = null;
    if (content !== null) {
      const include = this.extractGlobArrayLiteral(content, "include");
      const exclude = this.extractGlobArrayLiteral(content, "exclude");
      if (include || exclude) {
        result = {};
        if (include)
          result.include = include;
        if (exclude)
          result.exclude = exclude;
      }
    }
    this.vitestTestGlobsCache.set(rootKey, { result, evidencePath: foundPath });
    return result;
  }
  /**
   * Extract `<key>: [ 'a', "b", `c` ]` as a plain string array from raw
   * config text. Returns undefined if the key isn't present, or if the
   * array body contains anything besides string literals and commas/
   * whitespace (a function call, spread, variable reference, etc.) —
   * that's a sign the value is dynamic and this best-effort scrape can't
   * safely interpret it.
   */
  extractGlobArrayLiteral(content, key) {
    const arrayMatch = content.match(new RegExp(`\\b${key}\\s*:\\s*\\[([^\\]]*)\\]`));
    if (!arrayMatch)
      return void 0;
    const body = arrayMatch[1];
    const literalPattern = /'([^'\\]*)'|"([^"\\]*)"|`([^`\\]*)`/g;
    const literals = [];
    let lastEnd = 0;
    let match;
    while ((match = literalPattern.exec(body)) !== null) {
      const between = body.slice(lastEnd, match.index).trim();
      if (between !== "" && !/^,$/.test(between))
        return void 0;
      literals.push(match[1] ?? match[2] ?? match[3] ?? "");
      lastEnd = literalPattern.lastIndex;
    }
    const trailing = body.slice(lastEnd).trim();
    if (trailing !== "" && trailing !== ",")
      return void 0;
    return literals.length > 0 ? literals : void 0;
  }
  /**
   * Whether `sourceFilePath` is itself a test file (as opposed to a source
   * file whose *related* test file needs to be discovered).
   *
   * Primary signal: `detectFileRole` (naming convention: `.test.`/`.spec.`
   * basenames, `_test.`/`_spec.` suffix infixes, `*Test(s).<ext>` CamelCase
   * suffixes, `test_`/`spec_` prefixes, `__tests__/`/`tests/`/`spec/`
   * directories — shared with the rest of the codebase, not a second
   * parallel detector).
   *
   * Secondary signal (vitest only): the project's own `test.include` /
   * `test.exclude` globs, best-effort scraped by `parseVitestTestGlobs`.
   * This can correct the naming-convention answer in both directions —
   * an `exclude` glob can rule out a path that looks like a test by name,
   * and an `include` glob can catch a project that puts tests somewhere
   * unconventional. When no config is found or it can't be parsed, this
   * is a no-op and behavior is unchanged.
   *
   * #628: a positive `include` override is only trusted when the glob is a
   * *narrow* test signal (see `isNarrowTestGlob`) — a bare "any file with
   * this extension" include (e.g. `src/**\/*.ts`) is common in real vitest
   * configs and matches ordinary source files, so treating any match as
   * "this is a test" produced vacuous `0p/0f` self-runs on plain source
   * files (background-review.ts, index.ts, …). The `exclude` direction is
   * left as a plain match: over-excluding only causes discovery to run on a
   * file that's actually a test (falls back to `findTestFile`, not a false
   * "self" positive), which is the safe failure mode.
   */
  isTestFile(sourceFilePath, cwd, runner) {
    let result = detectFileRole(sourceFilePath) === "test";
    if (runner === "vitest") {
      const globs = this.parseVitestTestGlobs(cwd);
      if (globs) {
        const rel = path.relative(cwd, path.resolve(cwd, sourceFilePath)).replace(/\\/g, "/");
        const matches = (globs_, filter) => !!globs_?.some((g) => (!filter || filter(g)) && minimatch(rel, g, { dot: true }));
        if (matches(globs.exclude)) {
          result = false;
        } else if (!result && matches(globs.include, (g) => this.isNarrowTestGlob(g))) {
          result = true;
        }
      }
    }
    return result;
  }
  /**
   * Whether an `include` glob is a specific enough signal to override a
   * plain "this is source, not a test" naming-convention verdict (#628).
   *
   * Trusted when either:
   *  - a literal (non-wildcard) path segment before the first wildcard
   *    names a conventional test location (`tests/`, `test/`, `spec/`,
   *    `specs/`, `__tests__/`) — the real case this override exists for:
   *    a project whose test files live in such a directory without a
   *    `.test.`/`.spec.` name (e.g. `tests/**\/*.ts`).
   *  - the static suffix after the last wildcard encodes more than the
   *    bare language extension (e.g. `.check.ts`, `.flow.ts`) — an explicit
   *    project-specific naming convention, not "any file with this
   *    extension" (e.g. `**\/*.check.ts`).
   *
   * Rejected for a bare extension glob with no test-ish directory (e.g.
   * `src/**\/*.ts`, `**\/*.ts`) — that shape matches every source file in
   * the tree and is exactly what produced vacuous self-runs in practice.
   */
  isNarrowTestGlob(glob) {
    const testDirPattern = /^(tests?|specs?|__tests__)$/i;
    for (const segment of glob.split("/")) {
      if (segment.includes("*") || segment.includes("?"))
        break;
      if (testDirPattern.test(segment))
        return true;
    }
    const lastWildcard = Math.max(glob.lastIndexOf("*"), glob.lastIndexOf("?"));
    const suffix = lastWildcard >= 0 ? glob.slice(lastWildcard + 1) : glob;
    const dotSegments = suffix.split(".").filter(Boolean);
    return dotSegments.length >= 2;
  }
  /**
   * Find test file for a given source file
   * Returns the test file path if it exists, null otherwise.
   * Automatic selection supplies eligibility before each first-match return;
   * ordinary discovery, existence checks, and suggestions remain unfiltered.
   */
  findTestFile(sourceFilePath, cwd, runnerOverride, acceptCandidate = () => true) {
    const ext = path.extname(sourceFilePath);
    const basename2 = path.basename(sourceFilePath, ext);
    const dir = path.dirname(sourceFilePath);
    const patterns = SOURCE_TO_TEST_PATTERNS.find((p) => p.ext === ext);
    if (!patterns)
      return null;
    const detected = runnerOverride ? { runner: runnerOverride, config: RUNNERS[runnerOverride] } : this.detectRunner(cwd, sourceFilePath);
    if (!detected)
      return null;
    const relDir = this.relativeSourceDir(sourceFilePath, cwd);
    for (let i = 0; i < patterns.testExts.length; i++) {
      const testExt = patterns.testExts[i];
      const testDir = patterns.dirs[i];
      if (testExt.includes("*")) {
        const pattern = testExt.replace(/\*/g, basename2);
        const searchDirs = testDir === "." ? [dir] : relDir ? [path.join(cwd, testDir, relDir), path.join(cwd, testDir)] : [path.join(cwd, testDir)];
        for (const searchDir of searchDirs) {
          let files;
          try {
            files = fs.readdirSync(searchDir);
          } catch (err) {
            void err;
            continue;
          }
          const match = files.find((f) => (f === pattern || f.startsWith("test_") && f.endsWith(".py") && f.includes(basename2)) && acceptCandidate(path.join(searchDir, f)));
          if (match) {
            const testPath = path.join(searchDir, match);
            this.log(`Found test file: ${testPath}`);
            return { testFile: testPath, runner: detected.runner };
          }
        }
        if (testDir !== ".") {
          const recursiveMatch = this.findPytestMatchRecursive(path.join(cwd, testDir), pattern, basename2, MAX_PYTEST_RECURSE_DEPTH, acceptCandidate);
          if (recursiveMatch) {
            this.log(`Found test file (recursive): ${recursiveMatch}`);
            return { testFile: recursiveMatch, runner: detected.runner };
          }
        }
      } else {
        const testFilename = basename2 + testExt;
        const searchPaths = [
          path.join(dir, testFilename),
          // same directory
          path.join(dir, "__tests__", testFilename),
          // __tests__ subdirectory
          ...relDir ? [
            path.join(cwd, "tests", relDir, testFilename),
            // mirrored tests/<subdir>/
            path.join(cwd, "__tests__", relDir, testFilename)
            // mirrored __tests__/<subdir>/
          ] : [],
          path.join(cwd, "tests", testFilename),
          // top-level tests/
          path.join(cwd, "__tests__", testFilename),
          // top-level __tests__/
          // PHP/Elixir-style source-root mirroring (e.g. src/Foo/Bar.php ->
          // tests/Foo/BarTest.php, lib/accounts/user.ex ->
          // test/accounts/user_test.exs): strips a conventional source-root
          // segment and mirrors under this pattern's OWN configured test
          // root (testDir), not the hardcoded "tests"/"__tests__" above —
          // ExUnit's root is "test" (singular), which those don't cover.
          ...this.sourceRootMirroredCandidates(dir, cwd, testDir, testFilename)
        ];
        for (const testPath of searchPaths) {
          if (fs.existsSync(testPath) && acceptCandidate(testPath)) {
            this.log(`Found test file: ${testPath}`);
            return { testFile: testPath, runner: detected.runner };
          }
        }
      }
    }
    const importMatch = this.findTestFileByImport(sourceFilePath, cwd, acceptCandidate);
    if (importMatch) {
      return { testFile: importMatch, runner: detected.runner };
    }
    return null;
  }
  /**
   * Select the most useful test target for this edit.
   *
   * Strategy:
   * 1) If there are known failing tests, rerun those first (fast feedback loop).
   * 2) Otherwise run related tests for the edited file.
   */
  getTestRunTarget(sourceFilePath, cwd, turnIndex) {
    const detected = this.detectRunner(cwd, sourceFilePath);
    if (!detected)
      return null;
    const failedSet = this.getFailedTargets(cwd, detected.runner);
    const selfIsTest = this.isTestFile(sourceFilePath, cwd, detected.runner);
    const related = selfIsTest ? null : this.findTestFile(sourceFilePath, cwd, detected.runner, (candidate) => {
      const checkoutRoot = foreignGitRoot(candidate, cwd);
      if (!checkoutRoot)
        return true;
      recordDegradationOnce({
        kind: "test-discovery-foreign-checkout",
        subject: createHash("sha256").update(JSON.stringify([cwd, candidate, checkoutRoot])).digest("hex"),
        reason: "automatic test candidate belongs to another Git checkout",
        metadata: { cwd, candidate, checkoutRoot, runner: detected.runner }
      });
      return false;
    });
    if (failedSet && failedSet.size > 0) {
      const failedFirst = this.retireIneligibleFailedTargets({
        cwd,
        runner: detected.runner,
        failedTargets: failedSet,
        relatedAbs: related ? path.resolve(related.testFile) : void 0,
        selfAbs: selfIsTest ? path.resolve(sourceFilePath) : void 0,
        turnIndex
      });
      if (failedFirst) {
        return {
          testFile: failedFirst,
          runner: detected.runner,
          config: detected.config,
          strategy: "failed-first"
        };
      }
    }
    if (selfIsTest) {
      return {
        testFile: path.resolve(sourceFilePath),
        runner: detected.runner,
        config: detected.config,
        strategy: "self"
      };
    }
    if (!related)
      return null;
    return {
      testFile: path.resolve(related.testFile),
      runner: detected.runner,
      config: detected.config,
      strategy: "related"
    };
  }
  async runTestFileAsync(testFile, cwd, runnerOrRequest, legacyConfig) {
    const absoluteTestFile = path.resolve(testFile);
    let request;
    if (typeof runnerOrRequest === "string") {
      if (!legacyConfig) {
        return this.emptyResult(absoluteTestFile, "", runnerOrRequest, "Runner configuration missing");
      }
      request = { runner: runnerOrRequest, config: legacyConfig };
    } else {
      request = runnerOrRequest;
    }
    const { runner, config, turnIndex, signal, displayRoot, requireOwnInstall } = request;
    if (!fs.existsSync(absoluteTestFile)) {
      return this.emptyResult(absoluteTestFile, "", runner, "Test file not found");
    }
    try {
      const spawnCwd = resolveToolCwd("runner", runner, absoluteTestFile, {
        cwd: path.resolve(cwd),
        rootMarkers: config.spawnCwdMarkers ?? config.configFiles
      }).cwd;
      const { command, args, env, ownInstall } = await this.resolveExec(runner, config, absoluteTestFile, cwd, spawnCwd, requireOwnInstall);
      if (requireOwnInstall && !ownInstall) {
        return {
          ...this.emptyResult(absoluteTestFile, "", runner),
          notRun: "no-runner-install"
        };
      }
      this.log(`Running (async): ${command} ${args.join(" ")} (cwd ${spawnCwd})`);
      const result = await safeSpawnAsync(command, args, {
        cwd: spawnCwd,
        timeout: 6e4,
        env,
        // ONE neutral-cwd seam for npx/bunx fallbacks (#4193, #4268
        // acceptance 3); a resolved runner binary keeps the project cwd.
        ...command === "npx" || command === "bunx" ? getIsolatedNpxSpawnOptions() : {},
        // #2522 R2 F1. `safeSpawnAsync` resolves `options.signal ?? ambient`,
        // so an absent batch signal keeps the pre-#2522 ambient behaviour.
        signal
      });
      const stdout = result.stdout || "";
      const stderr = result.stderr || "";
      if (result.error) {
        this.log(`Runner error: ${result.error.message}`);
        return this.emptyResult(absoluteTestFile, "", runner, `Runner error: ${result.error.message}`);
      }
      let parsed;
      switch (runner) {
        case "vitest":
          parsed = this.parseVitestOutput(stdout, stderr, absoluteTestFile, displayRoot ?? cwd, runner);
          break;
        case "jest":
          parsed = this.parseJestOutput(stdout, stderr, absoluteTestFile, displayRoot ?? cwd, runner);
          break;
        case "pytest":
          parsed = this.parsePytestOutput(stdout, stderr, result.status ?? 0, absoluteTestFile, cwd, runner, displayRoot ?? cwd, spawnCwd);
          break;
        case "phpunit":
          parsed = this.parsePhpunitOutput(stdout, stderr, result.status ?? 0, absoluteTestFile, runner, displayRoot ?? cwd, cwd, spawnCwd);
          break;
        case "mix":
          parsed = this.parseMixTestOutput(stdout, stderr, result.status ?? 0, absoluteTestFile, runner, displayRoot ?? cwd, cwd, spawnCwd);
          break;
        default:
          parsed = this.parseGenericRunnerOutput(stdout, stderr, result.status ?? 0, absoluteTestFile, runner, displayRoot ?? cwd, cwd, spawnCwd);
          break;
      }
      this.recordResult({
        cwd,
        runner,
        testFile: absoluteTestFile,
        result: parsed,
        turnIndex
      });
      return parsed;
    } catch (err) {
      this.log(`Run error: ${err.message}`);
      return this.emptyResult(absoluteTestFile, "", runner, err.message);
    }
  }
  getFailedTargets(cwd, runner, create = false) {
    let roots = this.failedTestsByRunner.get(runner);
    if (!roots && create) {
      roots = new PathKeyedMap(canonicalFailedPath);
      this.failedTestsByRunner.set(runner, roots);
    }
    if (!roots)
      return void 0;
    const root = canonicalFailedPath(cwd);
    let targets = roots.get(root);
    if (!targets && create) {
      targets = new PathKeyedMap(canonicalFailedPath);
      roots.set(root, targets);
    }
    return targets;
  }
  deleteFailedRoot(cwd, runner) {
    const roots = this.failedTestsByRunner.get(runner);
    if (!roots)
      return;
    roots.delete(canonicalFailedPath(cwd));
    if (roots.size === 0)
      this.failedTestsByRunner.delete(runner);
  }
  failedTargetCount(runner) {
    const roots = this.failedTestsByRunner.get(runner);
    if (!roots)
      return 0;
    let count = 0;
    for (const targets of roots.values())
      count += targets.size;
    return count;
  }
  evictOldestFailedTarget(runner) {
    const roots = this.failedTestsByRunner.get(runner);
    if (!roots)
      return void 0;
    let oldest;
    for (const [root, targets2] of roots) {
      for (const [identity, entry] of targets2) {
        if (!oldest || entry.sequence < oldest.entry.sequence) {
          oldest = { root, identity, entry };
        }
      }
    }
    if (!oldest)
      return void 0;
    const targets = roots.get(oldest.root);
    targets?.delete(oldest.identity);
    if (targets?.size === 0)
      roots.delete(oldest.root);
    if (roots.size === 0)
      this.failedTestsByRunner.delete(runner);
    return oldest.entry.displayPath;
  }
  classifyFailedTarget(candidate) {
    try {
      this.statFailedTarget(candidate);
      return { status: "present" };
    } catch (error) {
      const errorCode = filesystemErrorCode(error);
      if (errorCode === "ENOENT" || errorCode === "ENOTDIR") {
        return { status: "missing", errorCode };
      }
      return { status: "indeterminate", errorCode };
    }
  }
  recordFailedTargetState(record) {
    const { outcome, runner, candidate, errorCode, turnIndex } = record;
    const boundedTarget = candidate.length <= LEDGER_FIELD_MAX ? candidate : `\u2026${candidate.slice(1 - LEDGER_FIELD_MAX)}`;
    const targetIdentity = createHash("sha256").update(runner).update("\0").update(candidate).digest("hex");
    const identity = `${outcome}:${targetIdentity}`;
    const payload = {
      durationMs: 0,
      filePath: boundedTarget,
      metadata: {
        outcome,
        runner,
        errorCode: errorCode ?? "unknown"
      }
    };
    const options = {
      ledgerKind: "test-runner-failed-target-state",
      risingEdgePer: "identity",
      reason: `${outcome}: ${boundedTarget}`
    };
    emitBounded("test_runner_failed_target_state", identity, payload, turnIndex === void 0 ? options : {
      ...options,
      capPerTurn: {
        limit: FAILED_TARGET_DETAIL_CAP_PER_TURN,
        turnIndex
      }
    });
  }
  /**
   * Retire confirmed-missing or foreign-checkout failed-first entries, then
   * return one usable target. A bounded prefix is checked; remaining candidates
   * carry over to the next selection instead of adding unbounded synchronous
   * filesystem work to turn_end. Related/self targets keep priority.
   */
  retireIneligibleFailedTargets(selection) {
    const { cwd, runner, failedTargets, relatedAbs, selfAbs, turnIndex } = selection;
    let checked = 0;
    const inspected = /* @__PURE__ */ new Set();
    const inspect = (identity, entry) => {
      if (checked >= MAX_FAILED_TARGET_CHECKS_PER_SELECTION)
        return void 0;
      checked += 1;
      inspected.add(identity);
      const candidate = entry.displayPath;
      if (foreignGitRoot(candidate, cwd)) {
        failedTargets.delete(identity);
        this.recordFailedTargetState({
          outcome: "retired-nested-checkout",
          runner,
          candidate,
          turnIndex
        });
        return void 0;
      }
      const verdict = this.classifyFailedTarget(candidate);
      if (verdict.status === "missing") {
        failedTargets.delete(identity);
        this.recordFailedTargetState({
          outcome: "retired-missing",
          runner,
          candidate,
          errorCode: verdict.errorCode,
          turnIndex
        });
        return void 0;
      }
      if (verdict.status === "indeterminate") {
        this.recordFailedTargetState({
          outcome: "retained-indeterminate",
          runner,
          candidate,
          errorCode: verdict.errorCode,
          turnIndex
        });
      }
      return candidate;
    };
    for (const preferred of [relatedAbs, selfAbs]) {
      if (!preferred)
        continue;
      const identity = canonicalFailedPath(preferred);
      const entry = failedTargets.get(identity);
      if (!entry)
        continue;
      const selected = inspect(identity, entry);
      if (selected)
        return selected;
    }
    for (const [identity, entry] of failedTargets) {
      if (inspected.has(identity))
        continue;
      if (checked >= MAX_FAILED_TARGET_CHECKS_PER_SELECTION)
        break;
      const selected = inspect(identity, entry);
      if (selected)
        return selected;
    }
    if (failedTargets.size === 0)
      this.deleteFailedRoot(cwd, runner);
    return void 0;
  }
  /**
   * Check if a source file has corresponding tests (without running them)
   */
  hasTestFile(sourceFilePath, cwd) {
    return this.findTestFile(sourceFilePath, cwd) !== null;
  }
  /**
   * Suggest test files for a list of source files.
   * Returns deduplicated test file paths with their corresponding source file.
   */
  suggestTestFiles(sourceFiles, cwd) {
    const seen = /* @__PURE__ */ new Set();
    const results = [];
    for (const sourceFile of sourceFiles) {
      const found = this.findTestFile(sourceFile, cwd);
      if (!found)
        continue;
      const abs = path.resolve(found.testFile);
      if (seen.has(abs))
        continue;
      seen.add(abs);
      results.push({ testFile: abs, sourceFile, runner: found.runner });
    }
    return results;
  }
  // --- Shared JSON test output parser (Vitest + Jest share the same structure) ---
  parseJsonTestOutput(stdout, stderr, testFile, cwd, runner) {
    try {
      const json = JSON.parse(stdout);
      const failures = [];
      for (const suite of json.testResults || []) {
        if (suite.status === "failed" && suite.assertionResults) {
          for (const test of suite.assertionResults) {
            if (test.status === "failed") {
              failures.push({
                name: test.title,
                message: test.failureMessages?.[0] || suite.message || "Test failed",
                location: test.location ? `${path.relative(cwd, testFile)}:${test.location.line}` : void 0,
                stack: this.truncateStack(test.failureMessages?.join("\n"))
              });
            }
          }
        }
      }
      return {
        file: testFile,
        sourceFile: "",
        runner,
        passed: json.numPassedTests || 0,
        failed: json.numFailedTests || 0,
        // #1452: `numSkippedTests` is absent from both reporters' JSON, so
        // this read was always 0. `numPendingTests` is where a `test.skip`
        // actually lands; `numTodoTests` is counted with it because the
        // text parsers (pytest `N skipped`, mix `N excluded` + `N skipped`)
        // also fold every not-run test into one `skipped` figure.
        // `??` would accept a present 0, so a reporter that emits
        // `numSkippedTests: 0` beside a real `numPendingTests` would
        // reproduce the very defect this removes. Take the larger reading.
        skipped: Math.max(json.numSkippedTests ?? 0, (json.numPendingTests || 0) + (json.numTodoTests || 0)),
        failures,
        duration: this.jsonRunDurationMs(json.testResults)
      };
    } catch (err) {
      void err;
      const failed = stdout.includes("FAIL") || stderr.includes("FAIL");
      return this.emptyResult(testFile, "", runner, failed ? "Tests failed (could not parse output)" : void 0);
    }
  }
  /**
   * #1452: real run duration in ms from a vitest/jest `--json` payload.
   *
   * NOT `testResults[].perfStats`. That field exists on jest's INTERNAL
   * `TestResult`, but the JSON reporter's `formatTestResults` projects it to
   * per-suite `startTime`/`endTime` and drops it — measured absent from both
   * vitest 4.1.10 and jest 30.4.2 output, so reading it would have left this
   * at 0. The per-suite epoch pair is what both reporters actually emit.
   *
   * Wall-clock SPAN across suites (max end - min start), not a sum: suites in
   * one payload may have run in parallel workers, and summing would report
   * more elapsed time than the run took. With the single suite pi-lens
   * actually produces (one test file per invocation) the two agree.
   *
   * The span excludes the runner's own startup: the top-level `startTime` is
   * ~330ms earlier than the first suite's on this repo. What the per-suite
   * pair then measures is NOT the same quantity across runners. On vitest it
   * tracks test time closely (135ms span against 134ms of summed assertions),
   * but jest stamps a suite's `startTime` before transform and module load,
   * so the same fields give 5595ms against 128ms of assertions. Both are
   * honest suite wall clock; neither is comparable to the other, and only the
   * vitest figure is close to what pytest's `in 0.05s` or ExUnit's
   * `Finished in 0.05 seconds` report.
   *
   * Falls back to the summed per-assertion `duration` when a reporter omits
   * the suite pair. Never returns a negative or non-finite value — a garbled
   * payload must degrade to "unmeasured", not to a wrong number.
   *
   * #1479: that degradation is now literal. This used to return 0 for a
   * payload it could not read, which is the figure a sub-millisecond suite
   * also produces, so the caller could not tell them apart. It returns
   * `undefined` instead. A readable pair whose span is 0 still returns 0,
   * because that is a measurement.
   */
  jsonRunDurationMs(suites) {
    let minStart = Number.POSITIVE_INFINITY;
    let maxEnd = Number.NEGATIVE_INFINITY;
    let assertionTotal = 0;
    for (const suite of suites || []) {
      if (typeof suite.startTime === "number" && Number.isFinite(suite.startTime) && typeof suite.endTime === "number" && Number.isFinite(suite.endTime)) {
        minStart = Math.min(minStart, suite.startTime);
        maxEnd = Math.max(maxEnd, suite.endTime);
      }
      for (const assertion of suite.assertionResults || []) {
        if (typeof assertion.duration === "number" && Number.isFinite(assertion.duration) && assertion.duration > 0) {
          assertionTotal += assertion.duration;
        }
      }
    }
    const span = maxEnd - minStart;
    if (Number.isFinite(span) && span > 0)
      return Math.round(span);
    if (assertionTotal > 0)
      return Math.round(assertionTotal);
    if (Number.isFinite(span) && span === 0)
      return 0;
    return void 0;
  }
  // --- Vitest Parser ---
  parseVitestOutput(stdout, stderr, testFile, cwd, runner) {
    return this.parseJsonTestOutput(stdout, stderr, testFile, cwd, runner);
  }
  // --- Jest Parser ---
  parseJestOutput(stdout, stderr, testFile, cwd, runner) {
    return this.parseJsonTestOutput(stdout, stderr, testFile, cwd, runner);
  }
  // --- Pytest Parser (text-based, no JSON dependency) ---
  /**
   * #3871: a text runner prints a path relative to the directory it ran in
   * (`spawnCwd`, first in `bases`) or to the dispatch root. The first base
   * that holds the file wins; a path that resolves nowhere stays as printed,
   * and an absent capture is no location.
   */
  renderTextLocation(displayRoot, bases, file, line) {
    if (file === void 0 || line === void 0)
      return void 0;
    for (const base of bases) {
      const resolved = path.resolve(base, file);
      if (fs.existsSync(resolved)) {
        return `${toPosix(path.relative(displayRoot, resolved))}:${line}`;
      }
    }
    return `${file}:${line}`;
  }
  parsePytestOutput(stdout, stderr, exitCode, testFile, cwd, runner, displayRoot = cwd, spawnCwd = cwd) {
    const failures = [];
    const output = `${stdout}
${stderr}`;
    const { passed, failed, skipped, duration } = parsePytestSummary(output);
    const failureRegex = /FAILED\s+(\S+::\S+)\s*-\s*(.+?)(?:\n|$)/g;
    let match;
    while ((match = failureRegex.exec(output)) !== null) {
      const [file, ...testParts] = match[1].split("::");
      const location = this.renderTextLocation(displayRoot, [spawnCwd, cwd], file, testParts.join("::"));
      failures.push({
        name: match[1],
        message: match[2].trim().slice(0, 500),
        ...location === void 0 ? {} : { location }
      });
    }
    const tracebackRegex = /(?<!_)_{10,}[^\S\n]*\n\s*(\w+Error:\s*.+?)(?:\n|$)/gs;
    while ((match = tracebackRegex.exec(output)) !== null) {
      if (failures.length > 0 && !failures[failures.length - 1].stack) {
        failures[failures.length - 1].stack = match[1].trim().slice(0, 1e3);
      }
    }
    return {
      file: testFile,
      sourceFile: "",
      runner,
      passed,
      failed,
      skipped,
      failures,
      duration,
      error: exitCode === 4 ? "Pytest configuration error" : exitCode === 2 ? "Pytest interrupted" : void 0
    };
  }
  // --- PHPUnit Parser (text-based, default CLI output) ---
  parsePhpunitOutput(stdout, stderr, exitCode, testFile, runner, displayRoot = path.dirname(testFile), cwd = path.dirname(testFile), spawnCwd = cwd) {
    const output = `${stdout}
${stderr}`;
    let passed = 0;
    let failed = 0;
    let skipped = 0;
    const okMatch = output.match(/OK\s*\((\d+)\s+tests?,\s*\d+\s+assertions?\)/i);
    if (okMatch) {
      passed = Number.parseInt(okMatch[1], 10);
    } else {
      const testsMatch = output.match(/Tests:\s*(\d+)/i);
      const failuresMatch = output.match(/Failures:\s*(\d+)/i);
      const errorsMatch = output.match(/Errors:\s*(\d+)/i);
      const skippedMatch = output.match(/Skipped:\s*(\d+)/i);
      const total = testsMatch ? Number.parseInt(testsMatch[1], 10) : 0;
      const failures2 = failuresMatch ? Number.parseInt(failuresMatch[1], 10) : 0;
      const errors = errorsMatch ? Number.parseInt(errorsMatch[1], 10) : 0;
      skipped = skippedMatch ? Number.parseInt(skippedMatch[1], 10) : 0;
      failed = failures2 + errors;
      passed = Math.max(0, total - failed - skipped);
    }
    const failures = [];
    const failureRegex = /^\d+\)\s+(\S+)/gm;
    let match;
    while ((match = failureRegex.exec(output)) !== null) {
      const afterFailure = output.slice(match.index + match[0].length);
      const nextFailure = afterFailure.search(/(?:^|\n)[^\S\n]*\d+\)\s/);
      const failureBlock = nextFailure === -1 ? afterFailure : afterFailure.slice(0, nextFailure);
      const locationMatch = /(?:^|\n)[^\S\n]*([^\s:]+\.php):(\d+)/.exec(failureBlock);
      const location = this.renderTextLocation(displayRoot, [spawnCwd, cwd], locationMatch?.[1], locationMatch?.[2]);
      failures.push({
        name: match[1],
        message: match[1],
        ...location === void 0 ? {} : { location }
      });
    }
    let duration;
    const clockMatch = output.match(/^Time:\s*(?:(\d+):)?(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?/im);
    if (clockMatch) {
      const hours = clockMatch[1] ? Number.parseInt(clockMatch[1], 10) : 0;
      const minutes = Number.parseInt(clockMatch[2], 10);
      const seconds = Number.parseInt(clockMatch[3], 10);
      const millis = clockMatch[4] ? Number.parseInt(clockMatch[4].padEnd(3, "0"), 10) : 0;
      duration = ((hours * 60 + minutes) * 60 + seconds) * 1e3 + millis;
    } else {
      const legacyMatch = output.match(/^Time:\s*([\d.]+)\s*(seconds?|s|ms|milliseconds?|minutes?)\b/im);
      if (legacyMatch) {
        const value = Number.parseFloat(legacyMatch[1]);
        const unit = legacyMatch[2].toLowerCase();
        const scale = unit.startsWith("ms") || unit.startsWith("milli") ? 1 : unit.startsWith("min") ? 6e4 : 1e3;
        if (Number.isFinite(value) && value > 0) {
          duration = Math.round(value * scale);
        }
      }
    }
    return {
      file: testFile,
      sourceFile: "",
      runner,
      passed,
      failed,
      skipped,
      failures,
      duration,
      error: exitCode !== 0 && passed === 0 && failed === 0 ? "PHPUnit runner error" : void 0
    };
  }
  // --- mix test Parser (ExUnit, text-based, default CLI output) ---
  parseMixTestOutput(stdout, stderr, exitCode, testFile, runner, displayRoot = path.dirname(testFile), cwd = path.dirname(testFile), spawnCwd = cwd) {
    const output = `${stdout}
${stderr}`;
    let passed = 0;
    let failed = 0;
    let skipped = 0;
    let duration;
    const summaryMatch = output.match(/(\d+)\s+tests?,\s*(\d+)\s+failures?(?:,\s*(\d+)\s+excluded)?(?:,\s*(\d+)\s+skipped)?/i);
    if (summaryMatch) {
      const total = Number.parseInt(summaryMatch[1], 10);
      failed = Number.parseInt(summaryMatch[2], 10);
      const excluded = summaryMatch[3] ? Number.parseInt(summaryMatch[3], 10) : 0;
      const skippedCount = summaryMatch[4] ? Number.parseInt(summaryMatch[4], 10) : 0;
      skipped = excluded + skippedCount;
      passed = Math.max(0, total - failed - skipped);
    }
    const durationMatch = output.match(/Finished in\s+([\d.]+)\s+seconds?/i);
    if (durationMatch) {
      duration = Math.round(Number.parseFloat(durationMatch[1]) * 1e3);
    }
    const failures = [];
    const failureRegex = /^[^\S\n]*\d+\)\s+(.+?)\s*\(([^)]+)\)\s*$/gm;
    let match;
    while ((match = failureRegex.exec(output)) !== null) {
      const afterFailure = output.slice(match.index + match[0].length);
      const nextFailure = afterFailure.search(/(?:^|\n)[^\S\n]*\d+\)\s/);
      const failureBlock = nextFailure === -1 ? afterFailure : afterFailure.slice(0, nextFailure);
      const locationMatch = /(?:^|\n)[^\S\n]*([^\s:]+\.exs):(\d+)/.exec(failureBlock);
      failures.push({
        name: match[1].trim(),
        message: match[1].trim(),
        location: this.renderTextLocation(displayRoot, [spawnCwd, cwd], locationMatch?.[1], locationMatch?.[2]) ?? match[2].trim()
      });
    }
    return {
      file: testFile,
      sourceFile: "",
      runner,
      passed,
      failed,
      skipped,
      failures,
      duration,
      error: exitCode !== 0 && passed === 0 && failed === 0 ? "mix test runner error" : void 0
    };
  }
  // --- Generic text parser for non-JSON runners ---
  /**
   * #1480: elapsed time for the runners `parseGenericRunnerOutput` handles.
   *
   * Before this, only go's `ok  pkg  0.25s` was read and every other runner
   * reported a hardcoded 0. #1479 made the log tell "measured" from
   * "unmeasured", but this parser is the `default:` arm behind cargo, dotnet,
   * maven, gradle, rspec, minitest and every unrecognised runner, so all of
   * them still reported a number nobody measured. Each runner below prints
   * its elapsed time in the same summary block this parser already regexes
   * for pass/fail counts.
   *
   * Absent, not 0, is the answer when nothing is found — see
   * `TestResult.duration` and `run-duration.ts`. A probe that returned 0 here
   * would be claiming a measurement.
   *
   * One parser serves all runners, so the probe is selected BY RUNNER NAME.
   * Running every probe over every runner's output was the original shape of
   * this code, and it let gradle borrow a number: `BUILD SUCCESSFUL in 3s`
   * plus a preceding `... ok` line satisfied go's `ok <pkg> <n>s` probe, so
   * the whole-build wall clock got reported as test time — the exact wrong
   * number this function refuses to print. Gating on the runner makes that
   * structurally impossible rather than merely unlikely, and it matters most
   * for the `default:` arm of the switch, which is where an unrecognised or
   * custom runner's arbitrary output lands.
   *
   * Within a runner the patterns are still anchored where an anchor helps,
   * for the same reason #1452's PHPUnit `Time:` pattern is anchored: an
   * unanchored /m match takes the FIRST hit over stdout+stderr, and a failure
   * diff quoting "Finished in ..." would beat the real summary. Note what the
   * `^` in `^Finished in` does and does not buy. It rejects a decoy that is
   * INDENTED, which is what a quoted expectation or an assertion diff is; it
   * does NOT rank two column-0 matches, so an unindented decoy printed by the
   * suite itself would still win. It is a cheap filter for the common shape,
   * not a proof of uniqueness. And it is not an anchor to the counts line for
   * rspec or minitest: both print their elapsed time on a `Finished in ...`
   * line and their counts (`3 examples, 0 failures`, `1 runs, 1 assertions,
   * ...`) on a different line.
   *
   * KNOWN LIMIT — first summary only. cargo across multiple crates, `dotnet
   * test` across multiple assemblies, and `go test ./...` across multiple
   * packages each print one summary per unit, and these probes take the
   * first. A multi-unit run therefore UNDER-REPORTS its duration. That is
   * left as-is deliberately: the count parsers below have the same first-match
   * shape for those runners, so duration and counts describe the same scope.
   * Fixing one without the other would trade an under-report for an
   * inconsistency. Pinned by test so it stays a known limit, not an accident.
   *
   * Formats and how each was verified:
   *
   * - go — `ok  example.com/pkg  0.253s`. Pre-existing pattern, unchanged
   *   apart from the shared finite/non-negative guard.
   *
   * - cargo — `test result: ok. 3 passed; 0 failed; 1 ignored; 0 measured;
   *   0 filtered out; finished in 0.253s`. NOT VERIFIED AGAINST A LIVE CARGO
   *   RUN — this box has no MSVC linker, so `cargo test` cannot link. Format
   *   read out of the libtest printer shipped with the local rustc 1.94.1:
   *   `library/test/src/formatters/pretty.rs` builds `"; finished in
   *   {exec_time}"` and `library/test/src/time.rs` renders `TestSuiteExecTime`
   *   as `{:.2}s`. Older rustc omits the suffix entirely; that degrades to
   *   unmeasured.
   *
   * - dotnet/vstest — `Failed: 1, Passed: 2, Skipped: 0, Total: 3, Duration:
   *   1 m 30 s - t.dll (net8.0)`. NOT VERIFIED AGAINST A LIVE `dotnet test` —
   *   NuGet restore has no network here. Format read out of the
   *   vstest.console.dll shipped with the local .NET SDK 8.0.423, which holds
   *   the literal `{0} - Failed: {1}, Passed: {2}, Skipped: {3}, Total: {4},
   *   Duration: {5}` next to the unit literals `" h"`, `" m"`, `" s"`,
   *   `" ms"`, `"< 1 ms"`. The duration is a space-joined token list, so it
   *   is summed rather than read as one number.
   *
   * - maven/surefire — `Tests run: 4, Failures: 0, Errors: 0, Skipped: 0,
   *   Time elapsed: 0.05 s -- in com.example.AppTest`. NOT VERIFIED AGAINST A
   *   LIVE MAVEN — no mvn on this box. Summed across the per-class lines,
   *   because surefire prints `Time elapsed` per test class and its final
   *   `Results:` total carries no time. `[INFO] Total time: 3.4 s` is
   *   deliberately NOT used: that is whole-build wall clock including compile,
   *   which would report a wrong number rather than none. Surefire 2.x wrote
   *   `sec` where 3.x writes `s`; both are accepted.
   *
   *   EXPECT THIS TO BE ABSENT IN PRACTICE. pi-lens invokes `mvn test -q`
   *   (see RUNNERS.maven above), and surefire logs its per-class `Tests run:
   *   ..., Time elapsed: ...` lines at INFO, which `-q` suppresses. Only the
   *   ERROR-level lines of a FAILING class survive, so a green maven run
   *   typically reports unmeasured and a red one reports the failing classes'
   *   time alone. REASONED, NOT RUN — there is no mvn on this box to confirm
   *   it. Left in rather than dropped: it costs nothing, it is correct when
   *   the output does carry the lines (a repo that sets `-Dsurefire.useFile`
   *   or drops `-q` via `.mvn/maven.config`), and `unmeasured` is an honest
   *   report of the quiet case.
   *
   * - rspec — `Finished in 0.32394 seconds (files took 0.49427 seconds to
   *   load)`. VERIFIED against a live rspec-core 3.13.6 run on ruby 3.4.10.
   *   The minutes form (`Finished in 2 minutes 15.14 seconds`) comes from
   *   `RSpec::Core::Formatters::Helpers.format_duration` in the same
   *   installed gem; rspec never prints hours. Load time trails the run time
   *   on the same line and must not be read instead of it.
   *
   * - minitest — `Finished in 0.254594s, 7.8557 runs/s, 7.8557 assertions/s.`
   *   VERIFIED against a live minitest 5.25.4 run on ruby 3.4.10. The format
   *   string is `"Finished in %.6fs, ..."` in minitest.rb, always seconds.
   *
   * - gradle — deliberately left unmeasured, and now UNREACHABLE by any other
   *   runner's probe rather than merely unmatched by it. Gradle's console
   *   summary (`4 tests completed, 1 failed`) carries no elapsed time, and
   *   `BUILD SUCCESSFUL in 3s` is whole-build wall clock including compile
   *   and dependency resolution. Reporting that as test time would be a wrong
   *   number; #1479 makes the absence legible in the log instead.
   */
  parseGenericRunnerDuration(output, runner) {
    switch (runner) {
      case "go":
        return this.parseGoDuration(output);
      case "cargo":
        return this.parseCargoDuration(output);
      case "dotnet":
        return this.parseDotnetDuration(output);
      case "maven":
        return this.parseMavenDuration(output);
      case "rspec":
        return this.parseRspecDuration(output);
      case "minitest":
        return this.parseMinitestDuration(output);
      default:
        return void 0;
    }
  }
  /** go: `ok  	example.com/pkg	0.253s`. First package summary only. */
  parseGoDuration(output) {
    const goSummary = output.match(/ok\s+\S+\s+([\d.]+)s/m);
    if (!goSummary)
      return void 0;
    return toMeasuredDurationMs(Number.parseFloat(goSummary[1]) * 1e3);
  }
  /** cargo: `...; 0 filtered out; finished in 0.25s`. First crate only. */
  parseCargoDuration(output) {
    const cargoTime = output.match(/^test result:.*?;\s*finished in\s+([\d.]+)\s*s\b/im);
    if (!cargoTime)
      return void 0;
    return toMeasuredDurationMs(Number.parseFloat(cargoTime[1]) * 1e3);
  }
  /**
   * dotnet/vstest: `..., Total: 3, Duration: 1 m 30 s - t.dll (net8.0)`.
   *
   * Anchored to the counts line, and the tail stops at the ` - <dll>`
   * separator: without that stop an assembly name is scanned for unit tokens,
   * and a name like `Timeouts.30s.Tests.dll` adds 30 seconds of nothing.
   * First assembly only.
   */
  parseDotnetDuration(output) {
    const dotnetTime = output.match(/Failed:\s*\d+,\s*Passed:\s*\d+,\s*Skipped:\s*\d+,\s*Total:\s*\d+,\s*Duration:\s*([^\r\n-]+)/i);
    if (!dotnetTime)
      return void 0;
    if (/^\s*</.test(dotnetTime[1]))
      return 0;
    let total = 0;
    let tokens = 0;
    const units = {
      ms: 1,
      s: 1e3,
      m: 6e4,
      h: 36e5
    };
    for (const token of dotnetTime[1].matchAll(/([\d.]+)\s*(ms|h|m|s)\b/gi)) {
      total += Number.parseFloat(token[1]) * units[token[2].toLowerCase()];
      tokens++;
    }
    if (tokens === 0)
      return void 0;
    return toMeasuredDurationMs(total);
  }
  /**
   * maven/surefire: summed across per-class `Time elapsed` lines.
   *
   * The guard is "did any line match", NOT "is the sum positive". Surefire
   * prints `Time elapsed: 0.00 s` for a trivial test class, and that is a
   * measurement of zero, not a failure to measure.
   */
  parseMavenDuration(output) {
    let surefireTotal = 0;
    let matched = false;
    for (const line of output.matchAll(/^.*Tests run:\s*\d+,.*?Time elapsed:\s*([\d.]+)\s*(?:s|sec|secs|seconds)\b.*$/gim)) {
      const seconds = Number.parseFloat(line[1]);
      if (!Number.isFinite(seconds) || seconds < 0)
        continue;
      surefireTotal += seconds;
      matched = true;
    }
    if (!matched)
      return void 0;
    return toMeasuredDurationMs(surefireTotal * 1e3);
  }
  /** rspec: `Finished in 2 minutes 15.14 seconds (files took 0.5 ...)`. */
  parseRspecDuration(output) {
    const rspecTime = output.match(/^Finished in\s+(?:([\d.]+)\s+minutes?\s+)?([\d.]+)\s+seconds?/im);
    if (!rspecTime)
      return void 0;
    const minutes = rspecTime[1] ? Number.parseFloat(rspecTime[1]) : 0;
    return toMeasuredDurationMs(minutes * 6e4 + Number.parseFloat(rspecTime[2]) * 1e3);
  }
  /**
   * minitest: `Finished in 0.254594s, 7.8557 runs/s, ...`.
   *
   * The trailing `,` is load-bearing, not decoration: it is what separates
   * minitest's own line from a bare `Finished in 99s` the suite under test
   * printed at column 0, which the `^` alone does not rank.
   */
  parseMinitestDuration(output) {
    const minitestTime = output.match(/^Finished in\s+([\d.]+)s\s*,/im);
    if (!minitestTime)
      return void 0;
    return toMeasuredDurationMs(Number.parseFloat(minitestTime[1]) * 1e3);
  }
  parseGenericRunnerOutput(stdout, stderr, exitCode, testFile, runner, displayRoot = path.dirname(testFile), cwd = path.dirname(testFile), spawnCwd = cwd) {
    const output = `${stdout}
${stderr}`;
    const lower = output.toLowerCase();
    let passed = 0;
    let failed = 0;
    let skipped = 0;
    let matched = false;
    const duration = this.parseGenericRunnerDuration(output, runner);
    const cargoSummary = output.match(/test result:\s+\w+\.\s+(\d+)\s+passed;\s+(\d+)\s+failed;\s+(\d+)\s+ignored;/i);
    if (cargoSummary) {
      passed = Number.parseInt(cargoSummary[1], 10);
      failed = Number.parseInt(cargoSummary[2], 10);
      skipped = Number.parseInt(cargoSummary[3], 10);
      matched = true;
    }
    const dotnetSummary = output.match(/Failed:\s*(\d+),\s*Passed:\s*(\d+),\s*Skipped:\s*(\d+)/i);
    if (dotnetSummary) {
      failed = Number.parseInt(dotnetSummary[1], 10);
      passed = Number.parseInt(dotnetSummary[2], 10);
      skipped = Number.parseInt(dotnetSummary[3], 10);
      matched = true;
    }
    const mavenLines = [
      ...output.matchAll(/^.*?Tests run:\s*(\d+),\s*Failures:\s*(\d+),\s*Errors:\s*(\d+),\s*Skipped:\s*(\d+).*$/gim)
    ];
    const mavenAggregates = mavenLines.filter((line) => !/Time elapsed:/i.test(line[0]));
    const mavenScored = mavenAggregates.length > 0 ? mavenAggregates : mavenLines;
    if (mavenScored.length > 0) {
      let total = 0;
      let mavenFailed = 0;
      let mavenSkipped = 0;
      for (const line of mavenScored) {
        total += Number.parseInt(line[1], 10);
        mavenFailed += Number.parseInt(line[2], 10) + Number.parseInt(line[3], 10);
        mavenSkipped += Number.parseInt(line[4], 10);
      }
      failed = mavenFailed;
      skipped = mavenSkipped;
      passed = Math.max(0, total - failed - skipped);
      matched = true;
    }
    const rspecSummary = output.match(/(\d+)\s+examples?,\s+(\d+)\s+failures?/i);
    if (rspecSummary) {
      const total = Number.parseInt(rspecSummary[1], 10);
      failed = Number.parseInt(rspecSummary[2], 10);
      passed = Math.max(0, total - failed);
      matched = true;
    }
    const minitestSummary = output.match(/(\d+)\s+runs?,\s+\d+\s+assertions?,\s+(\d+)\s+failures?,\s+(\d+)\s+errors?/i);
    if (minitestSummary) {
      const total = Number.parseInt(minitestSummary[1], 10);
      const failures2 = Number.parseInt(minitestSummary[2], 10);
      const errors = Number.parseInt(minitestSummary[3], 10);
      failed = failures2 + errors;
      passed = Math.max(0, total - failed);
      matched = true;
    }
    const gradleSummary = output.match(/(\d+)\s+tests? completed,\s+(\d+)\s+failed/i);
    if (gradleSummary) {
      const total = Number.parseInt(gradleSummary[1], 10);
      failed = Number.parseInt(gradleSummary[2], 10);
      passed = Math.max(0, total - failed);
      matched = true;
    }
    const goFailNames = [...output.matchAll(/--- FAIL:[^\S\n]+([^\s(]+)/g)];
    const goFailNameSet = new Set(goFailNames.map((m) => m[1].trim()));
    const goTopLevelFailCount = goFailNames.filter((m) => {
      const name = m[1].trim();
      const slash = name.indexOf("/");
      return slash === -1 || !goFailNameSet.has(name.slice(0, slash));
    }).length;
    let goInfraVerdict = false;
    if (runner === "go") {
      goInfraVerdict = /^FAIL[^\S\n]+\S+[^\S\n]+\[setup failed\]/m.test(output);
      const goFailPackage = /^FAIL(?![^\n]*\[(?:build|setup) failed\])[^\S\n]+\S+/m.test(output);
      const goOkPackages = [
        ...output.matchAll(/^ok[^\S\n]+\S+[^\S\n]+[\d.]+s/gm)
      ];
      if (goFailNames.length > 0 || goFailPackage) {
        failed = Math.max(failed, goTopLevelFailCount || 1);
        matched = true;
      }
      if (goOkPackages.length > 0) {
        passed = Math.max(passed, goOkPackages.length);
        matched = true;
      }
    }
    const failures = [];
    for (const m of goFailNames.slice(0, 5)) {
      failures.push({ name: m[1].trim(), message: m[1].trim() });
    }
    const otherNames = [
      ...output.matchAll(/^[^\S\n]*FAILED[^\S\n]+(\S.*)$/gm),
      ...output.matchAll(/^[^\S\n]*Failure:[^\S\n]+(\S.*)$/gm)
    ];
    for (const m of otherNames) {
      if (failures.length >= 5)
        break;
      const name = m[1].trim();
      const locationMatch = /(?<!\S)([^\s:]+\.(?:go|rs|rb|java|kt|cs|fs|py|php|exs)):(\d+)/.exec(name);
      const location = this.renderTextLocation(displayRoot, [spawnCwd, cwd], locationMatch?.[1], locationMatch?.[2]);
      failures.push({
        name,
        message: name,
        ...location === void 0 ? {} : { location }
      });
    }
    const runnerError = exitCode !== 0 && !matched && goFailNames.length === 0 && (lower.includes("error") || goInfraVerdict) ? `Runner ${runner} exited with ${exitCode}` : void 0;
    if (runnerError) {
      failures.length = 0;
    }
    if (exitCode !== 0 && failed === 0 && !runnerError) {
      failed = 1;
    }
    if (passed === 0 && failed === 0 && skipped === 0 && exitCode === 0) {
      passed = 1;
    }
    if (failures.length === 0 && failed > 0) {
      const firstLine = output.split("\n").find((l) => /fail|error|exception/i.test(l))?.trim().slice(0, 300) || `Tests failed for runner ${runner}`;
      failures.push({ name: `${runner} failure`, message: firstLine });
    }
    this.log(runnerError ? `Generic runner ${runner}: never started (${runnerError})` : `Generic runner ${runner}: ran (matched=${matched}, passed=${passed}, failed=${failed}, failures=${failures.length})`);
    return {
      file: testFile,
      sourceFile: "",
      runner,
      passed,
      failed,
      skipped,
      failures,
      duration,
      error: runnerError
    };
  }
  // --- Formatting ---
  /**
   * Format test result for LLM consumption
   */
  formatResult(result) {
    if (isRunnerErrorResult(result)) {
      return result.passed > 0 ? `[Tests] \u26A0 Could not complete tests: ${result.error} (${result.passed} passed before)` : `[Tests] \u26A0 Could not run tests: ${result.error}`;
    }
    const total = result.passed + result.failed + result.skipped;
    if (total === 0) {
      return "";
    }
    const durationStr = isMeasuredDuration(result.duration) && result.duration > 0 ? ` (${(result.duration / 1e3).toFixed(2)}s)` : "";
    if (result.failed === 0) {
      return `[Tests] \u2713 ${result.passed}/${total} passed${durationStr} \u2014 ${result.runner}`;
    }
    let output = `[Tests] \u2717 ${result.failed}/${total} failed, ${result.passed} passed${durationStr} \u2014 ${result.runner}
`;
    for (const failure of result.failures.slice(0, 5)) {
      output += `  \u2717 ${failure.name}
`;
      const msg = failure.message.split("\n")[0].slice(0, 200);
      output += `    ${msg}
`;
      if (failure.location) {
        output += `    at ${failure.location}
`;
      }
    }
    if (result.failures.length > 5) {
      output += `  ... and ${result.failures.length - 5} more failure(s)
`;
    }
    output += `  \u2192 Fix failing tests before proceeding
`;
    return output.trimEnd();
  }
  // --- Helpers ---
  /**
   * Additional mirrored-directory candidate for source trees whose test
   * tree mirrors the source tree under a *different*, conventional
   * source-root segment rather than the source file's full relative
   * directory — e.g. PHPUnit's `src/Foo/Bar.php` -> `tests/Foo/BarTest.php`
   * (strips `src`) or ExUnit's `lib/accounts/user.ex` ->
   * `test/accounts/user_test.exs` (strips `lib`).
   *
   * Unlike the `relDir`-based candidates above (which mirror under the
   * hardcoded "tests"/"__tests__" roots), this uses `testDir` — the
   * pattern's own configured test root from `SOURCE_TO_TEST_PATTERNS`
   * (e.g. "tests" for PHP, "test" for Elixir) — since ExUnit's root is
   * singular and wouldn't otherwise be checked.
   *
   * Returns an empty array when the source directory doesn't start with a
   * known source-root segment (src/lib/app) followed by at least one more
   * path segment — i.e. this is a no-op for languages/layouts that don't
   * use this convention.
   */
  sourceRootMirroredCandidates(dir, cwd, testDir, testFilename) {
    const knownSourceRoots = /* @__PURE__ */ new Set(["src", "lib", "app"]);
    const relDir = path.relative(cwd, dir);
    const segments = relDir.split(path.sep).filter(Boolean);
    if (segments.length > 1 && knownSourceRoots.has(segments[0])) {
      return [path.join(cwd, testDir, ...segments.slice(1), testFilename)];
    }
    return [];
  }
  /**
   * Fallback discovery: scan known test directories for a file that imports
   * the source module. Catches cases where the test file name doesn't match
   * the source basename (e.g. cline.test.ts testing cline-auth.ts).
   *
   * Checks for the basename appearing in a quoted import/require path:
   *   from "../providers/cline/cline-auth"   → /cline-auth"  ✓
   *   from "./cline-auth.js"                 → /cline-auth.  ✓
   *   import("cline-auth")                   → "cline-auth"  ✓
   */
  findTestFileByImport(sourceFilePath, cwd, acceptCandidate) {
    const ext = path.extname(sourceFilePath);
    const basename2 = path.basename(sourceFilePath, ext);
    const testPattern = /\.(test|spec)\.(ts|tsx|js|jsx|mjs)$/;
    const searchDirs = [
      path.join(cwd, "tests"),
      path.join(cwd, "__tests__"),
      path.dirname(sourceFilePath)
    ];
    for (const dir of searchDirs) {
      let entries;
      try {
        entries = fs.readdirSync(dir);
      } catch {
        continue;
      }
      for (const entry of entries) {
        const testPath = path.join(dir, entry);
        if (!testPattern.test(entry) || !acceptCandidate(testPath))
          continue;
        let content;
        try {
          content = fs.readFileSync(testPath, "utf-8");
        } catch {
          continue;
        }
        if (content.includes(`/${basename2}"`) || content.includes(`/${basename2}'`) || content.includes(`/${basename2}.`) || content.includes(`"${basename2}"`) || content.includes(`'${basename2}'`)) {
          this.log(`Found test file via import scan: ${testPath}`);
          return testPath;
        }
      }
    }
    return null;
  }
  /**
   * Resolve the executable and args for a runner, preferring a local
   * node_modules/.bin binary over npx to avoid the ~150ms npx startup cost.
   *
   * When a resolved binary becomes the command itself, `stripWrapperArgs`
   * drops ONLY the leading arg(s) that named the wrapped binary — never a
   * real subcommand (#1098: `cargo test --no-fail-fast` unconditionally lost
   * `test` here because the old code assumed every runner's args() started
   * with an npx-style runner-name arg, which only holds for wrapper-style
   * runners like vitest/jest/pytest).
   */
  async resolveExec(runner, config, testFile, cwd, spawnCwd = cwd, requireOwnInstall = false) {
    const needsInstall = config.command === "npx" || runner === "pytest" || runner === "phpunit";
    if (runner === "pytest") {
      const pythonEnvironment = await detectPythonEnvironment(cwd, void 0, {
        allowAmbient: !requireOwnInstall
      });
      if (pythonEnvironment) {
        return {
          command: pythonEnvironment.pythonPath,
          args: config.args(testFile, spawnCwd),
          env: augmentPythonEnvironment(process.env, pythonEnvironment),
          ownInstall: true
        };
      }
    }
    if (runner === "phpunit") {
      const suffix2 = process.platform === "win32" ? ".bat" : "";
      const vendorBin = localBinPath(findLocalBinAt("phpunit", cwd, {
        windowsExt: suffix2,
        binDirs: [path.join("vendor", "bin")]
      }));
      if (vendorBin) {
        return {
          command: vendorBin,
          args: config.args(testFile, spawnCwd),
          ownInstall: true
        };
      }
      return {
        command: "phpunit",
        args: config.args(testFile, spawnCwd),
        ownInstall: false
      };
    }
    const binName = config.binName ?? runner;
    const suffix = process.platform === "win32" ? ".cmd" : "";
    const localBin = localBinPath(findLocalBinAt(binName, cwd, {
      windowsExt: suffix,
      binDirs: [path.join("node_modules", ".bin")]
    }));
    if (localBin) {
      return {
        command: localBin,
        args: stripWrapperArgs(binName, config.args(testFile, spawnCwd)),
        ownInstall: true
      };
    }
    const globalBin = await findGlobalBinary(binName);
    if (globalBin) {
      return {
        command: globalBin,
        args: stripWrapperArgs(binName, config.args(testFile, spawnCwd)),
        ownInstall: !needsInstall
      };
    }
    return {
      command: config.command,
      args: config.args(testFile, spawnCwd),
      ownInstall: !needsInstall
    };
  }
  emptyResult(testFile, sourceFile, runner, error) {
    return {
      file: testFile,
      sourceFile,
      runner,
      passed: 0,
      failed: 0,
      skipped: 0,
      failures: [],
      // #1479: no duration key at all. Nothing ran, so there is nothing
      // to report — this used to say 0, which reads as "ran, instantly".
      error
    };
  }
  truncateStack(stack) {
    if (!stack)
      return void 0;
    const lines = stack.split("\n").slice(0, 3);
    return lines.join("\n").slice(0, 500);
  }
  recordResult(record) {
    const { cwd, runner, testFile, result, turnIndex } = record;
    const targetPath = path.resolve(testFile);
    if (result.failed > 0 && foreignGitRoot(targetPath, cwd)) {
      this.recordFailedTargetState({
        outcome: "rejected-nested-checkout",
        runner,
        candidate: targetPath,
        turnIndex
      });
      return;
    }
    const target = canonicalFailedPath(targetPath);
    let failedTargets = this.getFailedTargets(cwd, runner, result.failed > 0);
    if (!failedTargets)
      return;
    if (result.failed > 0) {
      const alreadyRecorded = failedTargets.has(target);
      if (!alreadyRecorded && this.failedTargetCount(runner) >= MAX_FAILED_TARGETS_PER_RUNNER) {
        const evicted = this.evictOldestFailedTarget(runner);
        if (evicted) {
          this.recordFailedTargetState({
            outcome: "capacity-evicted",
            runner,
            candidate: evicted,
            turnIndex
          });
        }
        failedTargets = this.getFailedTargets(cwd, runner, true);
        if (!failedTargets)
          return;
      }
      failedTargets.set(target, {
        displayPath: targetPath,
        sequence: ++this.failedTargetSequence
      });
      return;
    }
    if (failedTargets.delete(target) && failedTargets.size === 0) {
      this.deleteFailedRoot(cwd, runner);
    }
  }
};

export {
  formatRunDurationMs,
  isRunnerErrorResult,
  SOURCE_TO_TEST_PATTERNS,
  TURN_END_EXCLUDED_TEST_GLOBS,
  isExcludedTestTarget,
  RUNNERS,
  stripWrapperArgs,
  MAX_CANONICAL_ROOT_MEMO_ENTRIES,
  TestRunnerClient
};
