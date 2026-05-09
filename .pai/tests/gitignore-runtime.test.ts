import { describe, expect, test } from "bun:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(testDir, "..", "..");

function isIgnored(path: string): boolean {
  const result = Bun.spawnSync(["git", "check-ignore", path], { cwd: repoRoot });
  return result.exitCode === 0;
}

describe("runtime state ignore rules", () => {
  test("ignores runtime databases and SQLite sidecars", () => {
    expect(isIgnored(".pai/runtime/events.sqlite")).toBe(true);
    expect(isIgnored(".pai/runtime/events.sqlite-wal")).toBe(true);
    expect(isIgnored(".pai/runtime/state.db")).toBe(true);
  });

  test("ignores JSONL trails, transcripts, auth files, and local memories", () => {
    expect(isIgnored(".pai/runtime/trails/events.jsonl")).toBe(true);
    expect(isIgnored(".pai/runtime/transcripts/session.txt")).toBe(true);
    expect(isIgnored(".pai/runtime/auth.json")).toBe(true);
    expect(isIgnored(".pai/runtime/memory/profile.json")).toBe(true);
  });
});
