import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { test } from "node:test";
import { resolveScriptSource } from "./script-source.ts";

function withTempDir(run: (directory: string) => void) {
  const directory = mkdtempSync(path.join(tmpdir(), "pi-workflows-script-"));
  try {
    run(directory);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test("inline script is returned verbatim without a scriptPath", () => {
  withTempDir((directory) => {
    const source = "export const meta = { phases: [] }; return { ok: true };";
    const resolved = resolveScriptSource({ script: source }, directory);
    assert.equal(resolved.source, source);
    assert.equal("scriptPath" in resolved, false);
  });
});

test("empty-string script counts as PROVIDED (inline wins)", () => {
  withTempDir((directory) => {
    const resolved = resolveScriptSource({ script: "" }, directory);
    assert.equal(resolved.source, "");
    assert.equal("scriptPath" in resolved, false);
  });
});

test("whitespace-only scriptPath is treated as absent", () => {
  withTempDir((directory) => {
    writeFileSync(path.join(directory, "workflow.js"), "return 1;");
    assert.throws(
      () => resolveScriptSource({ scriptPath: "   " }, directory),
      /requires either `script` or `scriptPath`/,
    );
  });
});

test("providing both script and scriptPath is rejected", () => {
  withTempDir((directory) => {
    assert.throws(
      () =>
        resolveScriptSource(
          { script: "return 1;", scriptPath: "workflow.js" },
          directory,
        ),
      /mutually exclusive/,
    );
  });
});

test("providing neither script nor scriptPath is rejected", () => {
  withTempDir((directory) => {
    assert.throws(
      () => resolveScriptSource({}, directory),
      /requires either `script` or `scriptPath`/,
    );
  });
});

test("scriptPath accepts an in-cwd file whose name starts with `..`", () => {
  withTempDir((directory) => {
    // A file literally named `..hidden.js` inside cwd must be allowed even
    // though its basename starts with `..` — only `..` as a path segment
    // means "parent directory". The old `rel.startsWith("..")` predicate
    // wrongly rejected this.
    writeFileSync(path.join(directory, "..hidden.js"), "return 42;");
    const resolved = resolveScriptSource(
      { scriptPath: "..hidden.js" },
      directory,
    );
    assert.equal(resolved.source, "return 42;");
    assert.equal(resolved.scriptPath, "..hidden.js");
  });
});

test("scriptPath rejects a symlink inside cwd that escapes to outside cwd", () => {
  withTempDir((directory) => {
    // Create an outside file and a symlink in cwd pointing at it. Without
    // realpath, `statSync`/`readFileSync` follow the link and the old
    // containment check would accept the target. Realpath unwinds the
    // escape and the new check rejects it.
    const outsideDir = mkdtempSync(
      path.join(tmpdir(), "pi-workflows-script-outside-"),
    );
    try {
      const outsideFile = path.join(outsideDir, "secret.js");
      writeFileSync(outsideFile, "return 'leaked';");
      const link = path.join(directory, "escape.js");
      symlinkSync(outsideFile, link);
      assert.throws(
        () => resolveScriptSource({ scriptPath: "escape.js" }, directory),
        /must point to a file inside the project root/,
      );
    } finally {
      rmSync(outsideDir, { recursive: true, force: true });
    }
  });
});

test("scriptPath reads a .js file and returns a POSIX-relative path", () => {
  withTempDir((directory) => {
    const subdir = path.join(directory, "pi", "workflows");
    mkdirSync(subdir, { recursive: true });
    const file = path.join(subdir, "review.mjs");
    writeFileSync(file, "export const meta = { phases: [] }; return {};");

    const resolved = resolveScriptSource(
      { scriptPath: "pi/workflows/review.mjs" },
      directory,
    );
    assert.equal(resolved.source, readFileSync(file, "utf8"));
    assert.equal(resolved.scriptPath, "pi/workflows/review.mjs");
  });
});

test("scriptPath rejects escape attempts above cwd", () => {
  withTempDir((directory) => {
    assert.throws(
      () => resolveScriptSource({ scriptPath: "../escape.js" }, directory),
      /must point to a file inside the project root/,
    );
  });
});

test("scriptPath rejects absolute paths", () => {
  withTempDir((directory) => {
    assert.throws(
      () =>
        resolveScriptSource(
          { scriptPath: path.join(directory, "abs.js") },
          directory,
        ),
      /must be relative to the project root/,
    );
  });
});

test("scriptPath rejects wrong extension", () => {
  withTempDir((directory) => {
    writeFileSync(path.join(directory, "workflow.ts"), "return 1;");
    assert.throws(
      () => resolveScriptSource({ scriptPath: "workflow.ts" }, directory),
      /\.js or \.mjs/,
    );
  });
});

test("scriptPath rejects a missing file", () => {
  withTempDir((directory) => {
    assert.throws(
      () => resolveScriptSource({ scriptPath: "missing.js" }, directory),
      /ENOENT|no such file/i,
    );
  });
});

test("scriptPath rejects a directory instead of a file", () => {
  withTempDir((directory) => {
    mkdirSync(path.join(directory, "subdir.js"), { recursive: true });
    assert.throws(
      () => resolveScriptSource({ scriptPath: "subdir.js" }, directory),
      /regular file/,
    );
  });
});

test("scriptPath rejects a file larger than 256 KiB", () => {
  withTempDir((directory) => {
    const big = "a".repeat(256 * 1024 + 1);
    writeFileSync(path.join(directory, "big.js"), big);
    assert.throws(
      () => resolveScriptSource({ scriptPath: "big.js" }, directory),
      /exceeds 262144 bytes/,
    );
  });
});
