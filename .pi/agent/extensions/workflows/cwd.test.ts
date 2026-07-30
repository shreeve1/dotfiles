import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { test } from "node:test";
import { ProjectTrustStore } from "@earendil-works/pi-coding-agent";
import {
  createChildResources,
  resolveStandaloneChildProjectTrust,
} from "../shared/child-session.ts";
import { resolveAgentCwdAndTrust } from "./index.ts";
import { sanitizeAgentOptions } from "./sandbox.ts";

async function withTempDir(run: (directory: string) => Promise<void>) {
  const directory = await mkdtemp(path.join(tmpdir(), "pi-workflows-cwd-"));
  try {
    await run(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

test("sanitizeAgentOptions preserves cwd and still drops unknown keys", () => {
  const sanitized = sanitizeAgentOptions({
    label: "review",
    phase: "scan",
    schema: { type: "object" },
    model: "minimax/foo",
    provider: "minimax",
    effort: "high",
    writable: true,
    cwd: "/tmp/worktree",
    unknown: "dropped",
    nested: { also: "dropped" },
    cwdDup: "/should/not/leak",
  });

  assert.deepEqual(sanitized, {
    label: "review",
    phase: "scan",
    schema: { type: "object" },
    model: "minimax/foo",
    provider: "minimax",
    effort: "high",
    writable: true,
    cwd: "/tmp/worktree",
  });
});

test("sanitizeAgentOptions tolerates non-object input", () => {
  assert.deepEqual(sanitizeAgentOptions(undefined), {});
  assert.deepEqual(sanitizeAgentOptions(null), {});
  assert.deepEqual(sanitizeAgentOptions("not an object"), {});
  assert.deepEqual(sanitizeAgentOptions([1, 2, 3]), {});
});

test("sanitizeAgentOptions omits cwd when undefined", () => {
  const sanitized = sanitizeAgentOptions({ label: "x" });
  assert.equal("cwd" in sanitized, false);
});

test("resolveStandaloneChildProjectTrust: same dir inherits parent trust", async () => {
  await withTempDir(async (directory) => {
    const parentCwd = path.join(directory, "parent");
    const agentDir = path.join(directory, "agent");
    await mkdir(parentCwd, { recursive: true });

    assert.equal(
      resolveStandaloneChildProjectTrust({
        parentCwd,
        childCwd: parentCwd,
        parentTrusted: true,
        agentDir,
      }),
      true,
    );
    assert.equal(
      resolveStandaloneChildProjectTrust({
        parentCwd,
        childCwd: parentCwd,
        parentTrusted: false,
        agentDir,
      }),
      false,
    );
  });
});

test("resolveStandaloneChildProjectTrust: unregistered alt dir fails closed", async () => {
  await withTempDir(async (directory) => {
    const parentCwd = path.join(directory, "parent");
    const childCwd = path.join(directory, "alternate");
    const agentDir = path.join(directory, "agent");
    await mkdir(parentCwd, { recursive: true });
    await mkdir(childCwd, { recursive: true });

    assert.equal(
      resolveStandaloneChildProjectTrust({
        parentCwd,
        childCwd,
        parentTrusted: true,
        agentDir,
      }),
      false,
    );
    assert.equal(
      resolveStandaloneChildProjectTrust({
        parentCwd,
        childCwd,
        parentTrusted: false,
        agentDir,
      }),
      false,
    );
  });
});

test("resolveAgentCwdAndTrust keeps cwd and trust coupled", async () => {
  await withTempDir(async (directory) => {
    const parentCwd = path.join(directory, "parent");
    const altCwd = path.join(directory, "alternate");
    const agentDir = path.join(directory, "agent");
    const fileCwd = path.join(directory, "file.txt");
    await mkdir(parentCwd, { recursive: true });
    await mkdir(altCwd, { recursive: true });
    await mkdir(agentDir, { recursive: true });
    await writeFile(fileCwd, "fixture");

    for (const parentTrusted of [true, false]) {
      for (const requested of [
        undefined,
        "",
        "   ",
        ".",
        `${parentCwd}${path.sep}`,
      ]) {
        assert.deepEqual(
          resolveAgentCwdAndTrust({
            requested,
            parentCwd,
            parentTrusted,
            agentDir,
          }),
          { cwd: parentCwd, trusted: parentTrusted },
        );
      }
    }

    assert.deepEqual(
      resolveAgentCwdAndTrust({
        requested: altCwd,
        parentCwd,
        parentTrusted: true,
        agentDir,
      }),
      { cwd: altCwd, trusted: false },
    );
    assert.throws(
      () =>
        resolveAgentCwdAndTrust({
          requested: path.join(directory, "missing"),
          parentCwd,
          parentTrusted: true,
          agentDir,
        }),
      /does not exist or is not a directory/,
    );
    assert.throws(
      () =>
        resolveAgentCwdAndTrust({
          requested: fileCwd,
          parentCwd,
          parentTrusted: true,
          agentDir,
        }),
      /cwd is not a directory/,
    );

    new ProjectTrustStore(agentDir).set(altCwd, true);
    assert.deepEqual(
      resolveAgentCwdAndTrust({
        requested: altCwd,
        parentCwd,
        parentTrusted: false,
        agentDir,
      }),
      { cwd: altCwd, trusted: true },
    );
  });
});

// Covers the index.ts invariant that resolveAgentResources receives re-derived
// trust, not parentTrusted; the paired loads show why the distinction matters.
test("alternate-cwd resources gate project extensions by re-derived trust", async () => {
  await withTempDir(async (directory) => {
    const parentCwd = path.join(directory, "parent");
    const altCwd = path.join(directory, "alternate");
    const agentDir = path.join(directory, "agent");
    await mkdir(parentCwd, { recursive: true });
    await mkdir(path.join(altCwd, ".pi", "extensions"), { recursive: true });
    await mkdir(agentDir, { recursive: true });

    const extensionSource = (name: string) => `
      export default function (pi) {
        pi.registerTool({
          name: ${JSON.stringify(name)}, label: ${JSON.stringify(name)},
          description: "fixture", parameters: { type: "object", properties: {} },
          async execute() { return { content: [{ type: "text", text: "ok" }] }; }
        });
      }
    `;
    await writeFile(
      path.join(altCwd, ".pi", "extensions", "alt.ts"),
      extensionSource("alt_project_fixture"),
    );

    const { trusted } = resolveAgentCwdAndTrust({
      requested: altCwd,
      parentCwd,
      parentTrusted: true,
      agentDir,
    });
    assert.equal(trusted, false);

    const gated = await createChildResources({
      cwd: altCwd,
      projectTrusted: trusted,
      agentDir,
    });
    const gatedTools = gated.loader
      .getExtensions()
      .extensions.flatMap((extension) => [...extension.tools.keys()]);
    assert.equal(gatedTools.includes("alt_project_fixture"), false);

    const leaked = await createChildResources({
      cwd: altCwd,
      projectTrusted: true,
      agentDir,
    });
    const leakedTools = leaked.loader
      .getExtensions()
      .extensions.flatMap((extension) => [...extension.tools.keys()]);
    assert.equal(leakedTools.includes("alt_project_fixture"), true);
  });
});
