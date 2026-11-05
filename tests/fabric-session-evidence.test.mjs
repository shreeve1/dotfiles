import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  captureWorkspace,
  changedPaths,
  classifyRisks,
  observedExit,
  SessionEvidence,
  validationCommand,
} from "../.pi/agent/extensions/lib/fabric-session-evidence.ts";

const GIT_BINARY = process.platform === "win32" ? "C:/Program Files/Git/cmd/git.exe" : "git";

function fixture(git = true) {
  const root = mkdtempSync(path.join(os.tmpdir(), "session-evidence-test-"));
  writeFileSync(path.join(root, "app.ts"), "export const value = 1;\n");
  if (git) {
    execFileSync(GIT_BINARY, ["init", "-q", root]);
    execFileSync(GIT_BINARY, ["-C", root, "add", "."]);
    execFileSync(GIT_BINARY, [
      "-C",
      root,
      "-c",
      "user.name=Test",
      "-c",
      "user.email=test@example.invalid",
      "commit",
      "-qm",
      "initial",
    ]);
  }
  return { root, cleanup: () => rmSync(root, { recursive: true, force: true }) };
}

async function check(ledger, id = "check", command = "npm test", exit = 0) {
  await ledger.start(id, "bash", { command });
  await ledger.finish(
    id,
    "bash",
    { command },
    { structuredContent: { exit_code: exit, output: "not retained" } },
    exit !== 0,
  );
}

test("single validation commands are distinguished from opaque or quoted mentions", () => {
  assert.equal(validationCommand("npm test").scope, "workspace");
  assert.equal(validationCommand("node --test tests/a.test.mjs").scope, "workspace");
  assert.equal(validationCommand("bash tests/run-all.sh").scope, "workspace");
  assert.equal(validationCommand("npm test; echo done").scope, "opaque");
  assert.equal(validationCommand("ssh server 'npm test'").scope, "opaque");
  assert.equal(validationCommand("echo 'npm test'"), undefined);
  assert.equal(validationCommand("printf pytest"), undefined);
  const secret = "sk-super-secret-value";
  assert.ok(!JSON.stringify(validationCommand(`TOKEN=${secret} npm test`)).includes(secret));
});

test("extension runtime logs do not invalidate a source check", async () => {
  const f = fixture();
  try {
    const ledger = new SessionEvidence(f.root);
    await ledger.start("check", "bash", { command: "npm test" });
    mkdirSync(path.join(f.root, ".pi-lens-probe-home"));
    writeFileSync(path.join(f.root, ".pi-lens-probe-home", "extension.log"), "runtime telemetry");
    await ledger.finish("check", "bash", {}, { exit_code: 0 }, false);
    assert.equal((await ledger.view()).checks[0].freshness, "current");
  } finally {
    f.cleanup();
  }
});

test("only structured process exit codes count; success prose is not proof", () => {
  assert.equal(observedExit({ structuredContent: { exit_code: 0 } }), 0);
  assert.equal(observedExit({ structuredContent: { exit_code: 17 } }), 17);
  assert.equal(observedExit({ content: [{ text: "all tests passed, exit 0" }] }), null);
  assert.equal(observedExit({ structuredContent: { exit_code: "0" } }), null);
  assert.equal(observedExit({ structuredContent: { exit_code: -1 } }), null);
});

test("tracked and untracked source changes invalidate a content snapshot", async () => {
  const f = fixture();
  try {
    writeFileSync(path.join(f.root, "new.ts"), "one");
    const before = await captureWorkspace(f.root);
    writeFileSync(path.join(f.root, "new.ts"), "two");
    const after = await captureWorkspace(f.root, [...before.files.keys()]);
    assert.equal(before.complete, true);
    assert.deepEqual(changedPaths(before, after), ["new.ts"]);
    writeFileSync(path.join(f.root, "app.ts"), "changed");
    const final = await captureWorkspace(f.root, [...before.files.keys()]);
    assert.ok(changedPaths(before, final).includes("app.ts"));
  } finally {
    f.cleanup();
  }
});

test("committing tested bytes alone does not make the proof stale", async () => {
  const f = fixture();
  try {
    writeFileSync(path.join(f.root, "app.ts"), "tested bytes");
    const before = await captureWorkspace(f.root);
    execFileSync(GIT_BINARY, ["-C", f.root, "add", "app.ts"]);
    execFileSync(GIT_BINARY, [
      "-C",
      f.root,
      "-c",
      "user.name=Test",
      "-c",
      "user.email=test@example.invalid",
      "commit",
      "-qm",
      "tested",
    ]);
    const after = await captureWorkspace(f.root, [...before.files.keys()]);
    assert.deepEqual(changedPaths(before, after), []);
  } finally {
    f.cleanup();
  }
});

test("checks become stale after a relevant edit and unknown without an exit code", async () => {
  const f = fixture();
  try {
    const ledger = new SessionEvidence(f.root);
    await check(ledger);
    assert.equal((await ledger.view()).checks[0].freshness, "current");
    writeFileSync(path.join(f.root, "app.ts"), "after test");
    await ledger.finish("edit", "edit", { path: "app.ts" }, {}, false);
    assert.equal((await ledger.view()).checks[0].freshness, "changed");
    await ledger.start("unknown", "bash", { command: "npm test" });
    await ledger.finish("unknown", "bash", {}, { content: [{ text: "passed" }] }, false);
    const record = (await ledger.view()).checks.at(-1);
    assert.equal(record.exitCode, null);
  } finally {
    f.cleanup();
  }
});

test("the same nested call is not recorded twice", async () => {
  const f = fixture();
  try {
    const ledger = new SessionEvidence(f.root);
    await check(ledger);
    await ledger.finish("check", "bash", {}, { exit_code: 0 }, false);
    assert.equal((await ledger.view()).checks.length, 1);
  } finally {
    f.cleanup();
  }
});

test("secret arguments, output and sensitive file contents are not retained", async () => {
  const f = fixture();
  try {
    const secret = "sk-private-test-key";
    writeFileSync(path.join(f.root, ".env"), `API_KEY=${secret}`);
    const ledger = new SessionEvidence(f.root);
    await ledger.start("secret", "bash", { command: `TOKEN=${secret} npm test` });
    await ledger.finish(
      "secret",
      "bash",
      {},
      { structuredContent: { exit_code: 0, output: secret } },
      false,
    );
    await ledger.finish("write-secret", "write", { path: ".env" }, {}, false);
    const view = await ledger.view();
    assert.ok(!JSON.stringify(view).includes(secret));
    assert.ok(!view.changedFiles.includes(".env"));
    assert.ok(view.risks.includes("security"));
  } finally {
    f.cleanup();
  }
});

test("non-Git workspaces are explicitly partial, not whole-workspace green", async () => {
  const f = fixture(false);
  try {
    const ledger = new SessionEvidence(f.root);
    await check(ledger);
    const view = await ledger.view();
    assert.match(view.coverage, /Partial/);
    assert.equal(view.checks[0].freshness, "unknown");
  } finally {
    f.cleanup();
  }
});

test("a written spec is not approved; only external operator confirmation binds its bytes", async () => {
  const f = fixture();
  try {
    const file = "docs/superpowers/specs/2026-11-03-example-design.md";
    mkdirSync(path.dirname(path.join(f.root, file)), { recursive: true });
    writeFileSync(path.join(f.root, file), "# Approved design candidate\n");
    const ledger = new SessionEvidence(f.root);
    await ledger.initialize();
    ledger.operatorInput(`Use ${file}`, "interactive");
    assert.equal((await ledger.view()).spec.approval, "unconfirmed");
    ledger.assistantMessage(`Please approve the design at ${file}?`);
    ledger.operatorInput("approved", "extension");
    assert.equal((await ledger.view()).spec.approval, "unconfirmed");
    ledger.operatorInput("approved", "interactive");
    assert.equal((await ledger.view()).spec.approval, "confirmed");
    writeFileSync(path.join(f.root, file), "different requirements");
    assert.equal((await ledger.view()).spec.approval, "changed");
  } finally {
    f.cleanup();
  }
});

test("reviewing a file is not approval, while a direct approval command is explicit", async () => {
  const f = fixture();
  try {
    const file = "docs/superpowers/specs/2026-11-03-example-design.md";
    mkdirSync(path.dirname(path.join(f.root, file)), { recursive: true });
    writeFileSync(path.join(f.root, file), "design");
    const ledger = new SessionEvidence(f.root);
    await ledger.initialize();
    ledger.assistantMessage(`Have you reviewed ${file}?`);
    ledger.operatorInput("go ahead", "interactive");
    assert.notEqual((await ledger.view()).spec?.approval, "confirmed");
    assert.equal(ledger.selectSpec(file, true), true);
    assert.equal((await ledger.view()).spec.approval, "confirmed");
    assert.equal(ledger.selectSpec("../outside.md", true), false);
  } finally {
    f.cleanup();
  }
});

test("specialists are risk-triggered and retrigger when the source changes again", async () => {
  const f = fixture();
  try {
    assert.deepEqual(classifyRisks(["README.md"]), []);
    assert.deepEqual(classifyRisks(["package.json", "src/auth.ts", "install-win.ps1"]), [
      "api",
      "platform",
      "security",
    ]);
    const ledger = new SessionEvidence(f.root);
    await ledger.initialize();
    writeFileSync(path.join(f.root, "package.json"), "{}");
    await ledger.finish("write", "write", { path: "package.json" }, {}, false);
    const first = await ledger.view(),
      key = ledger.specialistKey(first);
    assert.ok(key);
    ledger.markSpecialist(key);
    assert.equal(ledger.specialistKey(await ledger.view()), undefined);
    writeFileSync(path.join(f.root, "package.json"), '{"changed":true}');
    await ledger.finish("edit", "edit", { path: "package.json" }, {}, false);
    assert.ok(ledger.specialistKey(await ledger.view()));
  } finally {
    f.cleanup();
  }
});

test("restored checks stay unknown while real operator approval remains hash-bound", async () => {
  const f = fixture();
  try {
    const file = "docs/superpowers/specs/2026-11-03-resume-design.md";
    mkdirSync(path.dirname(path.join(f.root, file)), { recursive: true });
    writeFileSync(path.join(f.root, file), "spec");
    const original = new SessionEvidence(f.root);
    await original.initialize();
    original.selectSpec(file, true);
    await check(original);
    const restored = new SessionEvidence(f.root);
    await restored.initialize();
    restored.restore(await original.view());
    const view = await restored.view();
    assert.equal(view.checks[0].freshness, "unknown");
    assert.equal(view.spec.approval, "confirmed");
    assert.equal(view.checkCount, 1);
    writeFileSync(path.join(f.root, file), "changed");
    assert.equal((await restored.view()).spec.approval, "changed");
    assert.doesNotThrow(() =>
      restored.restore({
        version: 1,
        checks: [null, {}, { runner: "<secret>" }],
        changedFiles: ["../../outside"],
        spec: { path: "../outside" },
      }),
    );
  } finally {
    f.cleanup();
  }
});

test("questions and assistant claims never approve a spec; precise operator confirmation does", async () => {
  const f = fixture();
  try {
    const file = "docs/superpowers/specs/2026-11-03-approval-design.md";
    mkdirSync(path.dirname(path.join(f.root, file)), { recursive: true });
    writeFileSync(path.join(f.root, file), "spec");
    const ledger = new SessionEvidence(f.root);
    await ledger.initialize();
    ledger.operatorInput(`Is ${file} approved?`, "interactive");
    assert.equal((await ledger.view()).spec.approval, "unconfirmed");
    ledger.assistantMessage(`Please review ${file}, can I proceed?`);
    ledger.operatorInput("approved", "interactive");
    assert.equal((await ledger.view()).spec.approval, "unconfirmed");
    ledger.assistantMessage(`Do you approve ${file}?`);
    ledger.operatorInput("yes", "interactive");
    assert.equal((await ledger.view()).spec.approval, "confirmed");
  } finally {
    f.cleanup();
  }
});

test("only the installed Superpowers skill path is observed as that plugin", async () => {
  const f = fixture();
  try {
    const installed = path.join(f.root, "installed", "superpowers"),
      real = path.join(installed, "skills", "test-driven-development", "SKILL.md");
    mkdirSync(path.dirname(real), { recursive: true });
    writeFileSync(real, "skill");
    const fake = path.join(f.root, "fake", "superpowers", "skills", "brainstorming", "SKILL.md");
    mkdirSync(path.dirname(fake), { recursive: true });
    writeFileSync(fake, "generated text");
    const ledger = new SessionEvidence(f.root, installed);
    await ledger.finish("real", "read", { path: real }, {}, false);
    await ledger.finish("fake", "read", { path: fake }, {}, false);
    assert.deepEqual((await ledger.view()).observedSkills, ["test-driven-development"]);
  } finally {
    f.cleanup();
  }
});

test("temporary incomplete coverage cannot clear a check that changed during execution", async () => {
  const f = fixture();
  try {
    const ledger = new SessionEvidence(f.root);
    await ledger.start("run", "bash", { command: "npm test" });
    writeFileSync(path.join(f.root, "app.ts"), "changed during check");
    await ledger.finish("run", "bash", {}, { exit_code: 0 }, false);
    assert.equal((await ledger.view()).checks[0].freshness, "changed");
    writeFileSync(path.join(f.root, ".env"), "private");
    await ledger.view();
    rmSync(path.join(f.root, ".env"));
    assert.equal((await ledger.view()).checks[0].freshness, "changed");
  } finally {
    f.cleanup();
  }
});

test("conditional approval is not confirmation, and a reference does not revoke approval", async () => {
  const f = fixture();
  try {
    const file = "docs/superpowers/specs/design.md";
    mkdirSync(path.dirname(path.join(f.root, file)), { recursive: true });
    writeFileSync(path.join(f.root, file), "spec");
    const ledger = new SessionEvidence(f.root);
    await ledger.initialize();
    ledger.operatorInput(
      `Approve ${file} only after I review the outstanding security changes.`,
      "interactive",
    );
    assert.equal((await ledger.view()).spec.approval, "unconfirmed");
    ledger.operatorInput(`I approve ${file}.`, "interactive");
    assert.equal((await ledger.view()).spec.approval, "confirmed");
    ledger.operatorInput(`Check ${file} for compliance.`, "interactive");
    assert.equal((await ledger.view()).spec.approval, "confirmed");
    ledger.assistantMessage(`Do you approve ${file}?`);
    assert.equal((await ledger.view()).spec.approval, "confirmed");
    writeFileSync(path.join(f.root, file), "new requirements");
    ledger.operatorInput(`Check ${file} again.`, "interactive");
    assert.equal((await ledger.view()).spec.approval, "changed");
  } finally {
    f.cleanup();
  }
});

test("Bash-originated sensitive changes trigger security review without retaining names or values", async () => {
  const f = fixture();
  try {
    const ledger = new SessionEvidence(f.root);
    await ledger.initialize();
    writeFileSync(path.join(f.root, ".env"), "SECRET=not-for-recording");
    await ledger.finish(
      "shell",
      "bash",
      { command: "opaque shell mutation" },
      { exit_code: 0 },
      false,
    );
    const view = await ledger.view();
    assert.ok(view.risks.includes("security"));
    assert.ok(view.omittedSensitivePaths > 0);
    assert.ok(!JSON.stringify(view).includes("not-for-recording"));
    assert.ok(!view.changedFiles.includes(".env"));
    assert.ok(ledger.specialistKey(view));
  } finally {
    f.cleanup();
  }
});
