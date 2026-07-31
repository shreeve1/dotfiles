/**
 * Resolve a workflow script source from either an inline `script` string or a
 * `scriptPath` that points at a `.js`/`.mjs` file inside `cwd`. Exactly one of
 * the two must be supplied. The file variant is byte-bounded and confined to
 * `cwd` so a model can request a committed workflow file without opening the
 * floodgates to arbitrary disk reads.
 */

import * as fs from "node:fs";
import * as path from "node:path";

export interface ResolvedScriptSource {
  source: string;
  /** Repo-relative POSIX path, set only when the script was loaded from a file. */
  scriptPath?: string;
}

const MAX_SCRIPT_BYTES = 256 * 1024;

function treatPathAsAbsent(value: string | undefined): boolean {
  return value === undefined || value.trim() === "";
}

export function resolveScriptSource(
  params: { script?: string; scriptPath?: string },
  cwd: string,
): ResolvedScriptSource {
  const hasScript = params.script !== undefined;
  const pathLooksPresent = !treatPathAsAbsent(params.scriptPath);
  if (hasScript && pathLooksPresent) {
    throw new Error(
      "workflow `script` and `scriptPath` are mutually exclusive — provide exactly one",
    );
  }
  if (!hasScript && !pathLooksPresent) {
    throw new Error(
      "workflow requires either `script` or `scriptPath` — provide exactly one",
    );
  }
  if (hasScript) {
    return { source: params.script ?? "" };
  }

  const requested = (params.scriptPath ?? "").trim();
  if (path.isAbsolute(requested)) {
    throw new Error(
      `workflow \`scriptPath\` must be relative to the project root, got absolute path: ${requested}`,
    );
  }
  const abs = path.resolve(cwd, requested);
  // Realpath both sides so symlinks inside cwd that point outside cwd are
  // caught, and so a legitimately named `..hidden.js` (which `rel` would
  // otherwise reject) is accepted. Realpath can fail for a missing file;
  // in that case fall back to the unresolved `abs` so the existing
  // ENOENT/no-such-file error is preserved instead of surfacing a
  // confusing realpath error.
  let realCwd: string;
  try {
    realCwd = fs.realpathSync(cwd);
  } catch {
    realCwd = path.resolve(cwd);
  }
  let realAbs: string;
  try {
    realAbs = fs.realpathSync(abs);
  } catch {
    realAbs = abs;
  }
  const rel = path.relative(realCwd, realAbs);
  if (rel === ".." || rel.startsWith(".." + path.sep) || path.isAbsolute(rel)) {
    throw new Error(
      `workflow \`scriptPath\` must point to a file inside the project root: ${requested}`,
    );
  }
  const ext = path.extname(abs);
  if (ext !== ".js" && ext !== ".mjs") {
    throw new Error(
      `workflow \`scriptPath\` must end in .js or .mjs, got ${ext || "(no extension)"}: ${requested}`,
    );
  }
  const stat = fs.statSync(abs);
  if (!stat.isFile()) {
    throw new Error(
      `workflow \`scriptPath\` does not point to a regular file: ${requested}`,
    );
  }
  if (stat.size > MAX_SCRIPT_BYTES) {
    throw new Error(
      `workflow \`scriptPath\` exceeds ${MAX_SCRIPT_BYTES} bytes (${stat.size}): ${requested}`,
    );
  }
  const source = fs.readFileSync(abs, "utf8");
  return {
    source,
    scriptPath: rel.split(path.sep).join("/"),
  };
}
