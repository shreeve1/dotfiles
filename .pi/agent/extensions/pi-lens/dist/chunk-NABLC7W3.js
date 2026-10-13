import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  findCoreGrammarDir,
  resolveWebTreeSitterPackageDir
} from "./chunk-Z54ZSOBZ.js";
import "./chunk-NXL4FFQQ.js";

// dist/clients/install-diagnostics.js
import { createRequire } from "node:module";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
var require2 = createRequire(import.meta.url);
var ISSUES_URL = "https://github.com/apmantza/pi-lens/issues";
var CRITICAL_DEPS = [
  "typescript",
  "minimatch",
  "typebox",
  "js-yaml",
  "vscode-jsonrpc",
  "web-tree-sitter",
  "@ast-grep/napi"
];
function safe(fn, fallback) {
  try {
    return fn();
  } catch {
    return fallback;
  }
}
function grammarsInstalled(deps) {
  return findCoreGrammarDir({
    packageRoot: deps.packageRoot(),
    webTreeSitterDir: resolveWebTreeSitterPackageDir(deps)
  }) !== void 0;
}
function installDiagnosticNotes(input) {
  const notes = [];
  if (input.depsUnresolved) {
    notes.push("One or more runtime dependencies did not resolve. This is the #285/#335 failure mode \u2014 a package-manager layout (pnpm symlink store / nested install) the runtime's resolver can't traverse, an outdated runtime, or a runtime compiled into a single binary (`bun build --compile`, the way pi ships), where a bare package specifier cannot resolve whatever the layout is (#3409).");
  }
  if (!input.astGrepCli || !input.grammars) {
    notes.push("ast-grep CLI and/or tree-sitter grammars are missing \u2014 pnpm/bun skip lifecycle scripts by default, so the postinstall that fetches them did not run.");
  }
  return notes;
}
function collectInstallDiagnostics() {
  const notes = [];
  const here = safe(() => path.dirname(fileURLToPath(import.meta.url)), "");
  const pkgDir = safe(() => path.resolve(here, ".."), here);
  let root = pkgDir;
  for (let i = 0; i < 6; i++) {
    if (safe(() => fs.existsSync(path.join(root, "package.json")), false))
      break;
    const up = path.dirname(root);
    if (up === root)
      break;
    root = up;
  }
  const piLensVersion = safe(() => {
    const pj = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
    return String(pj.version ?? "unknown");
  }, "unknown");
  const bunVersion = globalThis.Bun?.version;
  const runtime = bunVersion ? `bun ${bunVersion}` : `node ${process.versions.node}`;
  const platform = `${process.platform}-${process.arch}`;
  const pkgRealDir = safe(() => fs.realpathSync(root), root);
  const behindSymlink = pkgRealDir !== root;
  let packageManager = "unknown";
  if (pkgRealDir.includes(`${path.sep}.pnpm${path.sep}`) || behindSymlink) {
    packageManager = "pnpm-symlinked";
  } else if (safe(() => fs.existsSync(path.join(root, "node_modules", "typescript")), false)) {
    packageManager = "nested";
  } else {
    packageManager = "npm-hoisted";
  }
  const deps = CRITICAL_DEPS.map((name) => {
    try {
      return { name, resolved: true, resolvedPath: require2.resolve(name) };
    } catch (err) {
      return {
        name,
        resolved: false,
        error: `${err?.code ?? ""} ${err?.message ?? String(err)}`.trim()
      };
    }
  });
  const astGrepCli = safe(() => {
    const cliPkg = require2.resolve("@ast-grep/cli/package.json");
    const dir = path.dirname(cliPkg);
    return ["ast-grep", "ast-grep.exe", "sg", "sg.exe"].some((b) => fs.existsSync(path.join(dir, b)));
  }, false);
  const grammars = safe(() => grammarsInstalled({
    resolve: (specifier) => require2.resolve(specifier),
    // `root` is this probe's own walk to the package root, computed above.
    packageRoot: () => root,
    cwd: () => process.cwd()
  }), false);
  notes.push(...installDiagnosticNotes({
    depsUnresolved: deps.some((d) => !d.resolved),
    astGrepCli,
    grammars
  }));
  return {
    piLensVersion,
    runtime,
    platform,
    packageManager,
    pkgDir: root,
    pkgRealDir,
    behindSymlink,
    deps,
    astGrepCli,
    grammars,
    notes
  };
}
function formatInstallDiagnostics(diag = collectInstallDiagnostics(), cause) {
  const lines = [];
  lines.push("\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 pi-lens install diagnostics \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500");
  if (cause) {
    const msg = cause?.message ?? String(cause);
    lines.push(`LOAD ERROR: ${msg}`);
  }
  lines.push(`pi-lens:   ${diag.piLensVersion}`);
  lines.push(`runtime:   ${diag.runtime}`);
  lines.push(`platform:  ${diag.platform}`);
  lines.push(`install:   ${diag.packageManager}${diag.behindSymlink ? " (behind symlink)" : ""}`);
  lines.push(`pkg dir:   ${diag.pkgDir}`);
  if (diag.behindSymlink)
    lines.push(`real dir:  ${diag.pkgRealDir}`);
  lines.push("deps:");
  for (const d of diag.deps) {
    lines.push(`  ${d.resolved ? "ok  " : "FAIL"} ${d.name}${d.error ? ` \u2014 ${d.error}` : ""}`);
  }
  lines.push(`assets:    ast-grep-cli=${diag.astGrepCli ? "ok" : "MISSING"} grammars=${diag.grammars ? "ok" : "MISSING"}`);
  for (const n of diag.notes)
    lines.push(`note: ${n}`);
  lines.push(`Please paste this into a report at ${ISSUES_URL}`);
  lines.push("\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500");
  return lines.join("\n");
}
export {
  collectInstallDiagnostics,
  formatInstallDiagnostics,
  grammarsInstalled,
  installDiagnosticNotes
};
