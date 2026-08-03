import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  prepareResume,
  resolveWorkflowRunDir,
  type ResumeSource,
} from "./resume.ts";
import type { WorkflowDetails } from "./model.ts";
import type { JournalEntry } from "./journal.ts";

function freshDir(): string {
  return mkdtempSync(join(tmpdir(), "pi-workflow-resume-"));
}

const CURRENT_CWD = "/project/current";

function writeDetails(
  runDir: string,
  details: Partial<WorkflowDetails> & { runId: string },
) {
  mkdirSync(runDir, { recursive: true });
  writeFileSync(join(runDir, "workflow.json"), JSON.stringify(details));
}

function validScriptHash(source: string): string {
  return createHash("sha256").update(source).digest("hex");
}

test("resolveWorkflowRunDir accepts a valid wf_<12-hex> id", () => {
  const runsRoot = freshDir();
  try {
    const dir = resolveWorkflowRunDir(runsRoot, "wf_a1b2c3d4e5f6");
    assert.equal(dir, join(runsRoot, "wf_a1b2c3d4e5f6"));
  } finally {
    rmSync(runsRoot, { recursive: true, force: true });
  }
});

test("resolveWorkflowRunDir rejects path-traversal attempts", () => {
  const runsRoot = freshDir();
  try {
    assert.throws(
      () => resolveWorkflowRunDir(runsRoot, "../escape"),
      /invalid run id/,
    );
  } finally {
    rmSync(runsRoot, { recursive: true, force: true });
  }
});

test("resolveWorkflowRunDir rejects non-hex characters", () => {
  const runsRoot = freshDir();
  try {
    assert.throws(
      () => resolveWorkflowRunDir(runsRoot, "wf_XXXXXXXXXXXX"),
      /invalid run id/,
    );
  } finally {
    rmSync(runsRoot, { recursive: true, force: true });
  }
});

test("resolveWorkflowRunDir rejects wrong length", () => {
  const runsRoot = freshDir();
  try {
    assert.throws(
      () => resolveWorkflowRunDir(runsRoot, "wf_a1b2c3"),
      /invalid run id/,
    );
    assert.throws(
      () => resolveWorkflowRunDir(runsRoot, "wf_a1b2c3d4e5f6a7"),
      /invalid run id/,
    );
  } finally {
    rmSync(runsRoot, { recursive: true, force: true });
  }
});

test("resolveWorkflowRunDir rejects an empty string", () => {
  const runsRoot = freshDir();
  try {
    assert.throws(() => resolveWorkflowRunDir(runsRoot, ""), /invalid run id/);
  } finally {
    rmSync(runsRoot, { recursive: true, force: true });
  }
});

test("prepareResume throws when the run dir does not exist", () => {
  const runsRoot = freshDir();
  try {
    assert.throws(
      () => prepareResume(runsRoot, "wf_a1b2c3d4e5f6", CURRENT_CWD),
      /not found/,
    );
  } finally {
    rmSync(runsRoot, { recursive: true, force: true });
  }
});

test("prepareResume refuses a completed run", () => {
  const runsRoot = freshDir();
  try {
    const runId = "wf_a1b2c3d4e5f6";
    const runDir = join(runsRoot, runId);
    const source = "export const meta = { phases: [] }; return 1;";
    writeDetails(runDir, {
      runId,
      status: "completed",
      startedAt: 1,
      scriptHash: validScriptHash(source),
    });
    writeFileSync(join(runDir, "script.js"), source);
    assert.throws(
      () => prepareResume(runsRoot, runId, CURRENT_CWD),
      /already completed/,
    );
  } finally {
    rmSync(runsRoot, { recursive: true, force: true });
  }
});

test("prepareResume refuses a run marked running", () => {
  const runsRoot = freshDir();
  try {
    const runId = "wf_a1b2c3d4e5f6";
    const runDir = join(runsRoot, runId);
    const source = "export const meta = { phases: [] }; return 1;";
    writeDetails(runDir, {
      runId,
      status: "running",
      startedAt: 1,
      scriptHash: validScriptHash(source),
    });
    writeFileSync(join(runDir, "script.js"), source);
    assert.throws(
      () => prepareResume(runsRoot, runId, CURRENT_CWD),
      /may still be active/,
    );
  } finally {
    rmSync(runsRoot, { recursive: true, force: true });
  }
});

test("prepareResume refuses unknown or missing status", () => {
  const runsRoot = freshDir();
  try {
    for (const [status, runId] of [
      ["garbage", "wf_c3d4e5f6a1b2"],
      ["", "wf_d4e5f6a1b2c3"],
      // status omitted entirely — old resumes written before the allowlist
      // fix should also be rejected.
      [undefined, "wf_e5f6a1b2c3d4"],
    ] as const) {
      const runDir = join(runsRoot, runId);
      const source = "export const meta = { phases: [] }; return 'garbage';";
      const partial: Partial<WorkflowDetails> & { runId: string } = {
        runId,
        status: status as WorkflowDetails["status"],
        startedAt: 1,
        scriptHash: validScriptHash(source),
      };
      if (status === undefined) {
        // status absent: clone without status.
        const { status: _omitted, ...rest } = partial;
        writeDetails(runDir, rest);
      } else {
        writeDetails(runDir, partial);
      }
      writeFileSync(join(runDir, "script.js"), source);
      assert.throws(
        () => prepareResume(runsRoot, runId, CURRENT_CWD),
        /unresumable status/,
      );
    }
  } finally {
    rmSync(runsRoot, { recursive: true, force: true });
  }
});

test("prepareResume accepts failed and aborted runs", () => {
  const runsRoot = freshDir();
  try {
    for (const [status, runId] of [
      ["failed", "wf_a1b2c3d4e5f6"],
      ["aborted", "wf_b2c3d4e5f6a1"],
    ] as const) {
      const runDir = join(runsRoot, runId);
      const source = `export const meta = { phases: [] }; return "${status}";`;
      writeDetails(runDir, {
        runId,
        status,
        startedAt: 1,
        scriptHash: validScriptHash(source),
      });
      writeFileSync(join(runDir, "script.js"), source);
      const resumed = prepareResume(runsRoot, runId, CURRENT_CWD);
      assert.equal(resumed.priorDetails.status, status);
      assert.equal(resumed.source, source);
    }
  } finally {
    rmSync(runsRoot, { recursive: true, force: true });
  }
});

test("prepareResume refuses a cross-cwd resume when prior launchCwd is set", () => {
  const runsRoot = freshDir();
  try {
    const runId = "wf_a1b2c3d4e5f6";
    const runDir = join(runsRoot, runId);
    const source = "export const meta = { phases: [] }; return 1;";
    writeDetails(runDir, {
      runId,
      status: "failed",
      startedAt: 1,
      scriptHash: validScriptHash(source),
      launchCwd: "/project/original",
    });
    writeFileSync(join(runDir, "script.js"), source);
    assert.throws(
      () => prepareResume(runsRoot, runId, CURRENT_CWD),
      /resume must run in the original project/,
    );
  } finally {
    rmSync(runsRoot, { recursive: true, force: true });
  }
});

test("prepareResume accepts a same-cwd resume when prior launchCwd is set", () => {
  const runsRoot = freshDir();
  try {
    const runId = "wf_a1b2c3d4e5f6";
    const runDir = join(runsRoot, runId);
    const source = "export const meta = { phases: [] }; return 1;";
    writeDetails(runDir, {
      runId,
      status: "failed",
      startedAt: 1,
      scriptHash: validScriptHash(source),
      launchCwd: CURRENT_CWD,
    });
    writeFileSync(join(runDir, "script.js"), source);
    const resumed = prepareResume(runsRoot, runId, CURRENT_CWD);
    assert.equal(resumed.source, source);
  } finally {
    rmSync(runsRoot, { recursive: true, force: true });
  }
});

test("prepareResume skips the launchCwd check when priorDetails.launchCwd is absent", () => {
  const runsRoot = freshDir();
  try {
    const runId = "wf_a1b2c3d4e5f6";
    const runDir = join(runsRoot, runId);
    const source = "export const meta = { phases: [] }; return 1;";
    writeDetails(runDir, {
      runId,
      status: "failed",
      startedAt: 1,
      scriptHash: validScriptHash(source),
      // launchCwd intentionally omitted (legacy run).
    });
    writeFileSync(join(runDir, "script.js"), source);
    const resumed = prepareResume(runsRoot, runId, CURRENT_CWD);
    assert.equal(resumed.source, source);
  } finally {
    rmSync(runsRoot, { recursive: true, force: true });
  }
});

test("prepareResume throws on script hash mismatch", () => {
  const runsRoot = freshDir();
  try {
    const runId = "wf_a1b2c3d4e5f6";
    const runDir = join(runsRoot, runId);
    writeDetails(runDir, {
      runId,
      status: "failed",
      startedAt: 1,
      scriptHash: "deadbeef".repeat(8), // 64 hex chars but wrong
    });
    writeFileSync(join(runDir, "script.js"), "return 1;");
    assert.throws(
      () => prepareResume(runsRoot, runId, CURRENT_CWD),
      /hash mismatch/,
    );
  } finally {
    rmSync(runsRoot, { recursive: true, force: true });
  }
});

test("prepareResume passes when the script hash matches", () => {
  const runsRoot = freshDir();
  try {
    const runId = "wf_a1b2c3d4e5f6";
    const runDir = join(runsRoot, runId);
    const source = "export const meta = { phases: [] }; return 7;";
    writeDetails(runDir, {
      runId,
      status: "failed",
      startedAt: 1,
      scriptHash: validScriptHash(source),
    });
    writeFileSync(join(runDir, "script.js"), source);
    const resumed = prepareResume(runsRoot, runId, CURRENT_CWD);
    assert.equal(resumed.source, source);
    assert.equal(resumed.priorDetails.scriptHash, validScriptHash(source));
  } finally {
    rmSync(runsRoot, { recursive: true, force: true });
  }
});

test("prepareResume skips the hash check when scriptHash is absent", () => {
  const runsRoot = freshDir();
  try {
    const runId = "wf_a1b2c3d4e5f6";
    const runDir = join(runsRoot, runId);
    writeDetails(runDir, {
      runId,
      status: "failed",
      startedAt: 1,
    });
    writeFileSync(join(runDir, "script.js"), "return 1;");
    const resumed = prepareResume(runsRoot, runId, CURRENT_CWD);
    assert.equal(resumed.source, "return 1;");
  } finally {
    rmSync(runsRoot, { recursive: true, force: true });
  }
});

test("prepareResume returns argsJson when args.json exists", () => {
  const runsRoot = freshDir();
  try {
    const runId = "wf_a1b2c3d4e5f6";
    const runDir = join(runsRoot, runId);
    const source = "export const meta = { phases: [] }; return args;";
    writeDetails(runDir, {
      runId,
      status: "failed",
      startedAt: 1,
      scriptHash: validScriptHash(source),
    });
    writeFileSync(join(runDir, "script.js"), source);
    writeFileSync(join(runDir, "args.json"), '{"a":1}');
    const resumed: ResumeSource = prepareResume(runsRoot, runId, CURRENT_CWD);
    assert.equal(resumed.argsJson, '{"a":1}');
  } finally {
    rmSync(runsRoot, { recursive: true, force: true });
  }
});

test("prepareResume omits argsJson when args.json is absent", () => {
  const runsRoot = freshDir();
  try {
    const runId = "wf_a1b2c3d4e5f6";
    const runDir = join(runsRoot, runId);
    const source = "export const meta = { phases: [] }; return 1;";
    writeDetails(runDir, {
      runId,
      status: "failed",
      startedAt: 1,
      scriptHash: validScriptHash(source),
    });
    writeFileSync(join(runDir, "script.js"), source);
    const resumed = prepareResume(runsRoot, runId, CURRENT_CWD);
    assert.equal(resumed.argsJson, undefined);
  } finally {
    rmSync(runsRoot, { recursive: true, force: true });
  }
});

test("prepareResume returns journal entries in seq order", () => {
  const runsRoot = freshDir();
  try {
    const runId = "wf_a1b2c3d4e5f6";
    const runDir = join(runsRoot, runId);
    const source = "export const meta = { phases: [] }; return 1;";
    writeDetails(runDir, {
      runId,
      status: "failed",
      startedAt: 1,
      scriptHash: validScriptHash(source),
    });
    writeFileSync(join(runDir, "script.js"), source);
    const entries: JournalEntry[] = [
      {
        key: "k2",
        seq: 2,
        index: 2,
        label: "b",
        ok: true,
        result: { ok: true, output: "two" },
        finishedAt: 2,
      },
      {
        key: "k1",
        seq: 1,
        index: 1,
        label: "a",
        ok: true,
        result: { ok: true, output: "one" },
        finishedAt: 1,
      },
      {
        key: "k3",
        seq: 3,
        index: 3,
        label: "c",
        ok: true,
        result: { ok: true, output: "three" },
        finishedAt: 3,
      },
    ];
    writeFileSync(
      join(runDir, "journal.jsonl"),
      entries.map((entry) => JSON.stringify(entry)).join("\n") + "\n",
    );
    const resumed = prepareResume(runsRoot, runId, CURRENT_CWD);
    assert.equal(resumed.entries.length, 3);
    assert.deepEqual(
      resumed.entries.map((entry) => entry.seq),
      [1, 2, 3],
    );
  } finally {
    rmSync(runsRoot, { recursive: true, force: true });
  }
});
