// Fixture tests for the generated personal-harness.ts produced by the personalize-harness-pi skill.
//
// These tests extract the generated-extension TypeScript template from SKILL.md, substitute a
// fixture Harness Profile, write it into a throwaway temp project, dynamic-import the actual
// generated code, and drive it through a mocked ExtensionAPI event harness. This exercises the
// real generated handlers (not a reimplementation) for:
//   - safety blockers (protected path, dangerous bash, symlink escape, benign pass-through)
//   - deferred project checks (agentEnd advisory-only, beforeGit blocking, trigger gating, no-op)
//   - scenario checks (manual listing, never auto-run)
//   - architecture guidance (reference-only pointer, path-scoped injection)
//
// IMPORTANT: every filesystem mutation here stays inside an os.tmpdir() mkdtemp sandbox. Nothing
// touches $HOME, ~/.pi, or any real config. (Contrast the rpiv-core suite, which rm's real home
// paths — do not copy that pattern.)

import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const HERE = typeof __dirname === "string" ? __dirname : dirname(fileURLToPath(import.meta.url));
const SKILL_MD = join(HERE, "SKILL.md");

// ---- Fixture profile -------------------------------------------------------

function fixtureProfileLiteral(): string {
  return JSON.stringify(
    {
      sourceArtifact: "fixture",
      targetRepo: ".",
      outputPath: ".pi/extensions/personal-harness.ts",
      syntaxChecks: [],
      formatters: [],
      lintChecks: [],
      projectChecks: [
        {
          id: "ts-typecheck",
          command: "npx",
          args: ["tsc", "--noEmit"],
          cwd: "web",
          timeoutMs: 60000,
          triggerExtensions: [".ts", ".tsx"],
          triggerGlobs: ["web/**"],
          timing: "agentEnd",
          posture: "advisory",
          label: "tsc",
        },
        {
          id: "build-gate",
          command: "npm",
          args: ["run", "build"],
          cwd: "web",
          timeoutMs: 60000,
          triggerExtensions: [".ts", ".tsx"],
          triggerGlobs: ["web/**"],
          timing: "beforeGit",
          posture: "blocking",
          label: "build",
        },
      ],
      scenarioChecks: [
        {
          id: "e2e",
          command: "npx",
          args: ["playwright", "test"],
          cwd: "web",
          timeoutMs: 60000,
          triggerExtensions: [".ts", ".tsx"],
          triggerGlobs: ["web/**"],
          timing: "manual",
          posture: "advisory",
          reason: "expensive e2e — manual only",
        },
      ],
      safetyRules: [
        {
          id: "env-write",
          tools: ["write", "edit"],
          paths: [".env", ".env.*"],
          operation: "write .env",
          reason: "secret protection",
          posture: "blocking",
        },
        {
          id: "rmrf",
          tools: ["bash"],
          match: "(^|\\s|&&|;|\\|)\\s*rm\\s+-rf\\b",
          operation: "recursive delete",
          reason: "destructive",
          posture: "blocking",
        },
      ],
      guidanceFiles: [],
      architectureGuidance: [
        { relativePath: "docs/big-arch.md", label: "Architecture", appliesTo: "", mode: "reference" },
        { relativePath: "web/api.md", label: "API rules", appliesTo: "web", mode: "scoped" },
      ],
      promptAdvisories: ["confirm before editing config"],
      gitReminder: { enabled: true, posture: "advisory", text: "git reminder" },
      gitPreflight: { enabled: true, posture: "advisory", text: "git reminder", runProjectChecks: true },
      smokeTests: {
        loadSmoke: true,
        isolatedLoadSmoke: true,
        syntaxDryChecks: [],
        safetyDryChecks: ["env-write", "rmrf"],
        projectCheckDryChecks: ["ts-typecheck"],
        manualScenarioListing: true,
        guidanceDry: true,
      },
      skipped: [],
    },
    null,
    2,
  );
}

function extractTemplate(skillMd: string): string {
  const lines = skillMd.split("\n");
  const start = lines.findIndex((l) => l.trim() === "// @ts-nocheck");
  if (start < 0) throw new Error("template start (// @ts-nocheck) not found in SKILL.md");
  let end = -1;
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].trim() === "```") {
      end = i;
      break;
    }
  }
  if (end < 0) throw new Error("template closing fence not found in SKILL.md");
  const tmpl = lines.slice(start, end).join("\n");
  if (!tmpl.includes("<GENERATED_PROFILE_LITERAL>")) throw new Error("template placeholder missing");
  return tmpl.replace("<GENERATED_PROFILE_LITERAL>", fixtureProfileLiteral());
}

// ---- Mock ExtensionAPI -----------------------------------------------------

type Handler = (event: any, ctx: any) => any;

function makeMockPi() {
  const handlers: Record<string, Handler> = {};
  const messages: Array<{ customType: string; content: string; display?: boolean }> = [];
  const exec = vi.fn(async (_cmd: string, _args: string[], _opts: any) => ({
    stdout: "",
    stderr: "",
    code: 0,
    killed: false,
  }));
  const pi: any = {
    on: (event: string, handler: Handler) => {
      handlers[event] = handler;
    },
    exec,
    sendMessage: (m: any) => messages.push(m),
    getFlag: () => false,
  };
  return { pi, handlers, messages, exec };
}

// ---- Sandbox project -------------------------------------------------------

let sandbox: string;
let projectRoot: string;

beforeAll(async () => {
  sandbox = mkdtempSync(join(tmpdir(), "harness-fixture-"));
  projectRoot = join(sandbox, "proj");
  mkdirSync(join(projectRoot, "web"), { recursive: true });
  mkdirSync(join(projectRoot, "docs"), { recursive: true });
  // Real touchable files (the write-result sensor requires the file to exist).
  writeFileSync(join(projectRoot, "web", "app.ts"), "export const x = 1;\n");
  writeFileSync(join(projectRoot, "readme.md"), "# unrelated\n");
  writeFileSync(join(projectRoot, "docs", "big-arch.md"), "HUGE_ARCH_DOC_BODY\n".repeat(50));
  writeFileSync(join(projectRoot, "web", "api.md"), "API_SCOPED_BODY\n");
  // Symlink that escapes the project root (points at the sandbox parent, outside proj).
  try {
    symlinkSync(sandbox, join(projectRoot, "escape"));
  } catch {
    /* symlink may be unavailable on some platforms; the escape test guards on this */
  }
});

afterAll(() => {
  rmSync(sandbox, { recursive: true, force: true });
});

// Import the actual generated extension once, written into the sandbox.
let registerExtension: (pi: any) => void;

beforeAll(async () => {
  const skillMd = await import("node:fs").then((fs) => fs.readFileSync(SKILL_MD, "utf-8"));
  const generated = extractTemplate(skillMd);
  const extPath = join(projectRoot, ".pi", "extensions", "personal-harness.ts");
  mkdirSync(dirname(extPath), { recursive: true });
  writeFileSync(extPath, generated);
  const mod = await import(/* @vite-ignore */ extPath);
  registerExtension = mod.default;
  expect(typeof registerExtension).toBe("function");
});

// Reset module-level touched/guidance state before each test by firing the lifecycle resets.
async function freshHarness() {
  const m = makeMockPi();
  registerExtension(m.pi);
  await m.handlers.session_start?.({}, { cwd: projectRoot });
  await m.handlers.agent_start?.({}, { cwd: projectRoot });
  return m;
}

const ctx = () => ({ cwd: projectRoot, hasUI: false, ui: undefined });

describe("generated harness — safety blockers (T.3)", () => {
  it("T.3.1 blocks write to a protected .env path", async () => {
    const { handlers } = await freshHarness();
    const res = await handlers.tool_call({ toolName: "write", input: { path: ".env" } }, ctx());
    expect(res?.block).toBe(true);
    expect(res.reason).toMatch(/env-write|write \.env/i);
  });

  it("T.3.2 blocks a dangerous bash command", async () => {
    const { handlers } = await freshHarness();
    const res = await handlers.tool_call({ toolName: "bash", input: { command: "rm -rf build" } }, ctx());
    expect(res?.block).toBe(true);
    expect(res.reason).toMatch(/rmrf|recursive/i);
  });

  it("T.3.3 lets benign writes and commands pass", async () => {
    const { handlers } = await freshHarness();
    const w = await handlers.tool_call({ toolName: "write", input: { path: "web/app.ts" } }, ctx());
    expect(w?.block).toBeUndefined();
    const b = await handlers.tool_call({ toolName: "bash", input: { command: "echo ok" } }, ctx());
    expect(b?.block).toBeUndefined();
  });

  it("T.3.4 blocks a write through a symlink that escapes the project root", async () => {
    const { handlers } = await freshHarness();
    const res = await handlers.tool_call({ toolName: "write", input: { path: "escape/pwned.txt" } }, ctx());
    // The symlink-escape guard fires for any write-capable safety rule when the resolved path
    // leaves the project root.
    expect(res?.block).toBe(true);
  });
});

describe("generated harness — deferred project checks (T.4)", () => {
  it("T.4.1 runs an agentEnd project check only after a matching file is touched", async () => {
    // No touch -> agent_end runs nothing.
    const noTouch = await freshHarness();
    await noTouch.handlers.agent_end({}, ctx());
    expect(noTouch.exec).not.toHaveBeenCalled();

    // Touch a .ts file via tool_result, then agent_end -> tsc runs.
    const touched = await freshHarness();
    await touched.handlers.tool_result(
      { toolCallId: "c1", toolName: "write", input: { path: join(projectRoot, "web", "app.ts") }, content: [], isError: false },
      ctx(),
    );
    await touched.handlers.agent_end({}, ctx());
    const calledTsc = touched.exec.mock.calls.some((c: any[]) => c[0] === "npx" && c[1]?.includes("tsc"));
    expect(calledTsc).toBe(true);
  });

  it("T.4.1b does NOT run the agentEnd check when only an unrelated file is touched", async () => {
    const m = await freshHarness();
    await m.handlers.tool_result(
      { toolCallId: "c2", toolName: "write", input: { path: join(projectRoot, "readme.md") }, content: [], isError: false },
      ctx(),
    );
    await m.handlers.agent_end({}, ctx());
    const calledTsc = m.exec.mock.calls.some((c: any[]) => c[1]?.includes("tsc"));
    expect(calledTsc).toBe(false);
  });

  it("T.4.2 agentEnd failures are advisory messages, never a block/throw", async () => {
    const m = await freshHarness();
    m.exec.mockResolvedValue({ stdout: "", stderr: "type error", code: 1, killed: false });
    await m.handlers.tool_result(
      { toolCallId: "c3", toolName: "write", input: { path: join(projectRoot, "web", "app.ts") }, content: [], isError: false },
      ctx(),
    );
    // agent_end returns void (cannot block); failure surfaces as a sent message only.
    const ret = await m.handlers.agent_end({}, ctx());
    expect(ret).toBeUndefined();
    expect(m.messages.some((msg) => msg.customType === "personal-harness/project-check")).toBe(true);
  });

  it("T.4.3 + T.4.5 a blocking beforeGit project check runs before the git reminder and blocks the commit", async () => {
    const m = await freshHarness();
    m.exec.mockResolvedValue({ stdout: "", stderr: "build failed", code: 1, killed: false });
    await m.handlers.tool_result(
      { toolCallId: "c4", toolName: "write", input: { path: join(projectRoot, "web", "app.ts") }, content: [], isError: false },
      ctx(),
    );
    const res = await m.handlers.tool_call({ toolName: "bash", input: { command: "git commit -m wip" } }, ctx());
    expect(res?.block).toBe(true);
    expect(res.reason).toMatch(/build-gate|pre-git check/i);
    const calledBuild = m.exec.mock.calls.some((c: any[]) => c[0] === "npm" && c[1]?.includes("build"));
    expect(calledBuild).toBe(true);
  });

  it("T.4.4 advisory afterWrite/agentEnd failures do not mark the write result as failed", async () => {
    const m = await freshHarness();
    m.exec.mockResolvedValue({ stdout: "", stderr: "x", code: 1, killed: false });
    const res = await m.handlers.tool_result(
      { toolCallId: "c5", toolName: "write", input: { path: join(projectRoot, "web", "app.ts") }, content: [], isError: false },
      ctx(),
    );
    // No afterWrite project checks in the fixture, no syntax/lint -> result stays unmodified/clean.
    expect(res?.isError).toBeUndefined();
  });
});

describe("generated harness — scenario + guidance (T.5)", () => {
  it("T.5.3 lists a manual scenario at agent_end without executing it", async () => {
    const m = await freshHarness();
    await m.handlers.tool_result(
      { toolCallId: "c6", toolName: "write", input: { path: join(projectRoot, "web", "app.ts") }, content: [], isError: false },
      ctx(),
    );
    await m.handlers.agent_end({}, ctx());
    expect(m.messages.some((msg) => msg.customType === "personal-harness/scenario")).toBe(true);
    const ranPlaywright = m.exec.mock.calls.some((c: any[]) => c[1]?.includes("playwright"));
    expect(ranPlaywright).toBe(false);
  });

  it("T.5.1 reference-only architecture guidance injects a pointer, not the doc body", async () => {
    const { messages } = await freshHarness();
    const guidance = messages.filter((m) => m.customType === "personal-harness/guidance");
    const refMsg = guidance.find((m) => m.content.includes("docs/big-arch.md"));
    expect(refMsg).toBeTruthy();
    expect(refMsg!.content).not.toContain("HUGE_ARCH_DOC_BODY");
  });

  it("T.5.2 path-scoped guidance injects only when a matching path is touched", async () => {
    // Scoped guidance injects full content on match; wrapGuidance emits the label + body.
    const isScoped = (m: { customType: string; content: string }) =>
      m.customType === "personal-harness/guidance" && m.content.includes("API rules");

    // Touch an unrelated path -> scoped web/api.md not injected.
    const a = await freshHarness();
    await a.handlers.tool_call({ toolName: "read", input: { path: "readme.md" } }, ctx());
    expect(a.messages.some(isScoped)).toBe(false);

    // Touch a web/ path -> scoped guidance injects (full content, including the body).
    const b = await freshHarness();
    await b.handlers.tool_call({ toolName: "read", input: { path: "web/app.ts" } }, ctx());
    const scopedMsg = b.messages.find(isScoped);
    expect(scopedMsg).toBeTruthy();
    expect(scopedMsg!.content).toContain("API_SCOPED_BODY");
  });
});
