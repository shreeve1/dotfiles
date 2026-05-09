import { describe, expect, test } from "bun:test";
import { homedir } from "node:os";
import { join } from "node:path";
import { buildRuntimePaths, defaultRuntimeHome } from "../src/runtime-paths";

describe("runtime path resolution", () => {
  test("defaults to machine-local ~/.pai", () => {
    expect(defaultRuntimeHome()).toBe(join(homedir(), ".pai"));
  });

  test("builds all runtime paths under the runtime home", () => {
    const paths = buildRuntimePaths("/tmp/pai-runtime");

    expect(paths).toEqual({
      home: "/tmp/pai-runtime",
      eventsDb: "/tmp/pai-runtime/events.sqlite",
      trailsDir: "/tmp/pai-runtime/trails",
      transcriptsDir: "/tmp/pai-runtime/transcripts",
      memoryDir: "/tmp/pai-runtime/memory",
      authDir: "/tmp/pai-runtime/auth",
    });
  });
});
