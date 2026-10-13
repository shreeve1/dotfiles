import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  canonicalDirectory,
  listNestedLinkedWorktreeRoots
} from "./chunk-PNQDPDRC.js";
import {
  EXCLUDED_DIRS,
  getExcludedDirGlobs
} from "./chunk-C34ZXZ7O.js";
import {
  escapeRegExp
} from "./chunk-JAU72XNY.js";

// dist/clients/scratch-tree-policy.js
import { relative } from "node:path";
function nestedWorktreeOffsets(cwd) {
  const base = canonicalDirectory(cwd);
  return listNestedLinkedWorktreeRoots(cwd).map((root) => relative(base, root));
}
function literalExcludedDirNames() {
  return EXCLUDED_DIRS.filter((name) => !name.includes("*") && !name.includes("?"));
}
function getScratchTreeGlobPatterns() {
  return getExcludedDirGlobs();
}
function getScratchTreeDirNames() {
  return literalExcludedDirNames();
}
function getScratchTreeFnmatchPatterns() {
  return literalExcludedDirNames().map((name) => `*/${name}/*`);
}
var SECRETS_LANE_SCRATCH_DIR_NAMES = [
  // pi-ecosystem / coding-agent data + cache directories.
  ".pi",
  // The same agent's rebranded config dir (#3112) — pi's config-dir name is
  // `pkg.piConfig?.configDir || ".pi"`, so `.omp/agent/sessions` is the very
  // history `.pi/agent/sessions` holds. Without it the secrets lane READS a
  // project-local session history and can report a key a user pasted into a
  // transcript as a blocking first-party leak.
  ".omp",
  ".pi-lens",
  ".claude",
  ".codex",
  ".agents",
  ".worktrees",
  ".rescue",
  ".gstack",
  ".superpowers",
  ".guardrails",
  ".playwright-cli",
  ".playwright-mcp",
  // git's own internal object storage — binary/compressed, not readable
  // source; a byte-regex scan of it produces garbage, not real findings.
  ".git",
  // Vendored/installed npm packages — third-party noise, not a first-party
  // leak surface (unlike `vendor`/`third_party`, which are vendored SOURCE
  // a project can carry an upstream leak in and stays in scope).
  "node_modules",
  // Generic build/package-manager CACHES — regenerated from source on every
  // build/install, never a place a human commits a credential on purpose.
  // Deliberately excludes build OUTPUT (`dist`/`build`/`out`/`target`/
  // `coverage`) — a bundler/compiler CAN bake a real secret into output.
  ".turbo",
  ".cache",
  ".parcel-cache",
  ".svelte-kit",
  ".nuxt",
  ".yarn",
  ".pnpm-store",
  ".gradle",
  ".next",
  ".ruff_cache",
  ".tox",
  ".pytest_cache",
  "venv",
  ".venv",
  "__pycache__"
];
function getSecretsLaneAllowlistPaths() {
  return SECRETS_LANE_SCRATCH_DIR_NAMES.map((name) => {
    const escaped = escapeRegExp(name);
    return `(?:^|[/\\\\])${escaped}(?:[/\\\\].*)?$`;
  });
}
function isUnderSecretsLaneScratchTree(relPath) {
  const names = new Set(SECRETS_LANE_SCRATCH_DIR_NAMES.map((n) => n.toLowerCase()));
  const segments = relPath.split(/[/\\]/).filter(Boolean);
  return segments.some((segment) => names.has(segment.toLowerCase()));
}

export {
  nestedWorktreeOffsets,
  getScratchTreeGlobPatterns,
  getScratchTreeDirNames,
  getScratchTreeFnmatchPatterns,
  getSecretsLaneAllowlistPaths,
  isUnderSecretsLaneScratchTree
};
