// Drives .config/opencode/plugins/verify-final.ts with a fake OpenCode V2 plugin
// ctx against throwaway git repos. Portable (no bash, no symlinks) so it runs on
// native Windows too. Run: node tests/opencode-verify-final.test.mjs
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PLUGIN = pathToFileURL(join(ROOT, ".config", "opencode", "plugins", "verify-final.ts")).href;
const tmp = mkdtempSync(join(tmpdir(), "ovf-"));
process.on("exit", () => rmSync(tmp, { recursive: true, force: true }));
// A home with no post-work-cleanup skill, so the wording is machine-independent.
mkdirSync(join(tmp, "home"));
process.env.HOME = process.env.USERPROFILE = join(tmp, "home");

let pass = 0;
const failures = [];
const check = (name, cond, detail = "") => {
  if (cond) pass += 1;
  else failures.push(`${name}${detail ? `\n  ${detail}` : ""}`);
};

const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8" });
const makeRepo = (name) => {
  const dir = join(tmp, name);
  mkdirSync(dir, { recursive: true });
  git(dir, "init", "-q", "-b", "main");
  git(dir, "config", "user.email", "t@t");
  git(dir, "config", "user.name", "t");
  git(dir, "config", "core.autocrlf", "false");
  writeFileSync(join(dir, "app.py"), "x = 1\n");
  writeFileSync(join(dir, "notes.md"), "notes\n");
  git(dir, "add", "-A");
  git(dir, "commit", "-qm", "init");
  return dir;
};

/**
 * Fake V2 plugin ctx. parents: sessionID -> parentID for child sessions.
 * dup: deliver every event twice with the same id, as OpenCode does when it
 * loads the plugin once per location and both instances share module state.
 */
function makeCtx(dir, { parents = {}, dup = false } = {}) {
  const hooks = new Map();
  const synthetic = [];
  const hook = (domain) => async (name, cb) => {
    hooks.set(`${domain}.${name}`, cb);
    return { dispose: async () => {} };
  };
  // Event stream: emit() resolves once the plugin asks for the next event,
  // i.e. after it finished handling this one.
  const pending = [];
  let waiter = null;
  let lastDone = null;
  async function* stream(signal) {
    for (;;) {
      if (lastDone) {
        lastDone();
        lastDone = null;
      }
      if (signal?.aborted) return;
      if (pending.length === 0) await new Promise((r) => (waiter = r));
      const { ev, done } = pending.shift();
      lastDone = done;
      yield ev;
    }
  }
  const ctx = {
    location: { directory: dir },
    session: {
      hook: hook("session"),
      get: async ({ sessionID }) => {
        if (api.getDelay) await new Promise((r) => setTimeout(r, api.getDelay));
        return { id: sessionID, parentID: parents[sessionID], location: { directory: dir } };
      },
      synthetic: async (input) => {
        synthetic.push(input);
      },
    },
    tool: { hook: hook("tool") },
    permission: { hook: hook("permission") },
    event: { subscribe: (opts) => stream(opts?.signal) },
  };
  const call = async (key, input) => {
    const cb = hooks.get(key);
    if (cb) await cb(input);
    return input;
  };
  let n = 0;
  const api = {
    ctx,
    synthetic,
    /** ms each session lookup waits, to open race windows. */
    getDelay: 0,
    emit: (type, data) =>
      new Promise((done) => {
        const ev = { id: `ev${++n}`, type, data };
        if (dup) pending.push({ ev, done: () => {} });
        pending.push({ ev, done });
        const w = waiter;
        waiter = null;
        w?.();
      }),
    prompt: (sessionID, text = "do the work") =>
      call("session.prompt", {
        sessionID,
        messageID: `m${++n}`,
        prompt: { text },
        delivery: "queue",
      }),
    toolAfter: (sessionID, tool, input, status = "completed") =>
      call("tool.execute.after", {
        tool,
        sessionID,
        agent: "build",
        messageID: `m${++n}`,
        id: `c${++n}`,
        input,
        status,
        ...(status === "completed" ? { result: { output: "" } } : { error: { message: "boom" } }),
      }),
    edit: async (sessionID, file, content = `x = ${++n}\n`, tool = "edit") => {
      writeFileSync(join(dir, file), content);
      return api.toolAfter(sessionID, tool, { path: file });
    },
    evaluate: (sessionID, resources, action = "shell") =>
      call("permission.evaluate", {
        sessionID,
        agent: "build",
        action,
        resources,
        effect: "allow",
      }),
    answer: (sessionID, text, assistantMessageID = `a${++n}`) =>
      api.emit("session.text.ended", { sessionID, assistantMessageID, ordinal: 0, text }),
    end: (sessionID, how = "succeeded") =>
      api.emit(
        `session.execution.${how}`,
        how === "interrupted" ? { sessionID, reason: "user" } : { sessionID },
      ),
  };
  return api;
}

let instance = 0;
async function run(name, dir, fn, opts) {
  instance += 1;
  const { default: plugin } = await import(`${PLUGIN}?i=${instance}`);
  const t = makeCtx(dir, opts);
  const cleanup = await plugin.setup(t.ctx);
  try {
    await fn(t);
  } catch (err) {
    failures.push(`${name}: threw ${err?.stack ?? err}`);
  } finally {
    if (typeof cleanup === "function") await cleanup();
  }
}

const held = (r) => r.effect === "deny";

// ---- Task 1: tracking and the commit gate ----
process.env.VERIFY_FINAL = "0";

await run("tracks code files only", makeRepo("t1"), async (t) => {
  await t.prompt("A");
  await t.edit("A", "app.py");
  await t.edit("A", "notes.md", "more\n", "write");
  const r = await t.evaluate("A", ["git commit -m x"]);
  check("edit of a code file holds the commit", held(r), JSON.stringify(r));
  check("hold message names app.py", (r.message ?? "").includes("app.py"), r.message);
  check("hold message leaves out notes.md", !(r.message ?? "").includes("notes.md"), r.message);
});

await run("patch tool", makeRepo("t2"), async (t) => {
  await t.prompt("A");
  writeFileSync(join(t.ctx.location.directory, "app.py"), "x = 9\n");
  await t.toolAfter("A", "patch", {
    patchText: "*** Begin Patch\n*** Update File: app.py\n@@\n-x = 1\n+x = 9\n*** End Patch",
  });
  check("patch tool paths are tracked", held(await t.evaluate("A", ["git commit -m x"])));
});

await run("failed tool result", makeRepo("t3"), async (t) => {
  await t.prompt("A");
  writeFileSync(join(t.ctx.location.directory, "app.py"), "x = 9\n");
  await t.toolAfter("A", "edit", { path: "app.py" }, "error");
  check("failed tool results are not tracked", !held(await t.evaluate("A", ["git commit -m x"])));
});

await run("once per prompt", makeRepo("t4"), async (t) => {
  await t.prompt("A");
  await t.edit("A", "app.py");
  check("first commit is held", held(await t.evaluate("A", ["git commit -m x"])));
  check(
    "second commit in the same prompt goes through",
    !held(await t.evaluate("A", ["git commit -m x"])),
  );
  await t.prompt("A");
  await t.edit("A", "app.py");
  check("a new prompt holds again", held(await t.evaluate("A", ["git commit -m x"])));
});

await run("skill activation", makeRepo("t5"), async (t) => {
  await t.prompt("A");
  await t.edit("A", "app.py");
  await t.emit("session.skill.activated", {
    sessionID: "A",
    id: "post-work-cleanup",
    name: "post-work-cleanup",
    text: "",
  });
  check("skill activation clears tracking", !held(await t.evaluate("A", ["git commit -m x"])));
  await t.edit("A", "app.py");
  check(
    "the cleanup's own edits are not tracked",
    !held(await t.evaluate("A", ["git commit -m y"])),
  );
});

await run("skill file read", makeRepo("t6"), async (t) => {
  await t.prompt("A");
  await t.edit("A", "app.py");
  await t.toolAfter("A", "read", { path: "C:/Users/x/.agents/skills/post-work-cleanup/SKILL.md" });
  check(
    "reading the skill file clears tracking",
    !held(await t.evaluate("A", ["git commit -m x"])),
  );
  await t.edit("A", "app.py");
  check(
    "edits after reading the skill are not tracked",
    !held(await t.evaluate("A", ["git commit -m y"])),
  );
});

await run("non-commit shell", makeRepo("t7"), async (t) => {
  await t.prompt("A");
  await t.edit("A", "app.py");
  check("non-commit shell is untouched", !held(await t.evaluate("A", ["git status"])));
  check("non-shell actions are untouched", !held(await t.evaluate("A", ["git commit"], "edit")));
});

await run("sessions isolated", makeRepo("t8"), async (t) => {
  await t.prompt("A");
  await t.prompt("B");
  await t.edit("A", "app.py");
  check(
    "another session's edits never hold this session's commit",
    !held(await t.evaluate("B", ["git commit -m x"])),
  );
});

await run(
  "child sessions",
  makeRepo("t9"),
  async (t) => {
    await t.prompt("C");
    await t.edit("C", "app.py");
    check("child sessions are ignored", !held(await t.evaluate("C", ["git commit -m x"])));
  },
  { parents: { C: "A" } },
);

await run("pruned", makeRepo("t10"), async (t) => {
  await t.prompt("A");
  await t.edit("A", "app.py");
  git(t.ctx.location.directory, "commit", "-qam", "outside");
  check(
    "files committed outside the gate are pruned",
    !held(await t.evaluate("A", ["git commit -m x"])),
  );
});

await run("disabled", makeRepo("t11"), async (t) => {
  process.env.POST_WORK_CLEANUP = "0";
  try {
    await t.prompt("A");
    await t.edit("A", "app.py");
    check(
      "POST_WORK_CLEANUP=0 disables the gate",
      !held(await t.evaluate("A", ["git commit -m x"])),
    );
  } finally {
    delete process.env.POST_WORK_CLEANUP;
  }
});

// ---- Task 2: end of turn ----
delete process.env.VERIFY_FINAL;
process.env.VERIFY_FINAL_BIN = join(ROOT, "tests", "fake-verify-final.mjs");
const FALSE_OUT = "FALSE | a.py:1 | claim -- fix\n";
const LONG = "The answer. " + "x".repeat(540);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitFor = async (cond, ms = 15000) => {
  const until = Date.now() + ms;
  while (!cond() && Date.now() < until) await sleep(25);
  return cond();
};
// Long enough for a node child to start, read stdin and log.
const QUIET_MS = 2500;
let logN = 0;
/** Point the fake at a fresh log; returns a reader of the stdin texts it got. */
function fake({ out = "", exit = 0, delay = 0 } = {}) {
  const log = join(tmp, `fake-${++logN}.log`);
  Object.assign(process.env, {
    FAKE_VF_OUT: out,
    FAKE_VF_EXIT: String(exit),
    FAKE_VF_DELAY_MS: String(delay),
    FAKE_VF_LOG: log,
  });
  return () =>
    existsSync(log)
      ? readFileSync(log, "utf8")
          .trim()
          .split("\n")
          .filter(Boolean)
          .map((l) => JSON.parse(l))
      : [];
}
// Pi's settleDirective for one file, in both wordings: the skill lookup walks up
// from the repo, and on Windows the temp dir sits under the real home folder.
const settleTexts = (file) =>
  [
    "run the `post-work-cleanup` skill over them and apply its findings",
    "review them for leftover debug output, dead code and unused imports, and run the " +
      "project's linter or formatter if one is configured",
  ].map(
    (action) =>
      `This session changed code files that are not committed yet: ${file}. If the work on them is finished, ` +
      `${action} before they are committed; if it is not finished, say so and skip this. ` +
      "This is not a request to commit: commit only if the task or the repo's rules call for it. " +
      "(Set POST_WORK_CLEANUP=0 to disable this reminder.)",
  );

await run("FALSE finding", makeRepo("u1"), async (t) => {
  const calls = fake({ out: FALSE_OUT });
  await t.prompt("A");
  await t.answer("A", "an earlier message", "a-old");
  await t.answer("A", LONG, "a-last");
  await t.answer("A", "tail", "a-last");
  await t.end("A");
  await waitFor(() => t.synthetic.length > 0);
  check(
    "FALSE finding becomes one follow-up",
    t.synthetic.length === 1,
    JSON.stringify(t.synthetic),
  );
  check(
    "follow-up text is the checker's stdout",
    t.synthetic[0]?.text === FALSE_OUT,
    t.synthetic[0]?.text,
  );
  check(
    "follow-up resumes the session",
    t.synthetic[0]?.resume === true && t.synthetic[0]?.sessionID === "A",
  );
  check(
    "checker gets the last message's texts joined",
    calls()[0] === `${LONG}\ntail`,
    JSON.stringify(calls()),
  );
  // The correction turn ends: never checked again.
  await t.answer("A", LONG + " corrected");
  await t.end("A");
  await sleep(QUIET_MS);
  check(
    "own follow-up turn is not checked again",
    calls().length === 1 && t.synthetic.length === 1,
  );
});

for (const [label, opts] of [
  ["no findings", { out: "verify-final: no findings\n" }],
  ["UNSURE only", { out: "UNSURE | x | y\n" }],
  ["checker failure", { out: "", exit: 1 }],
]) {
  await run(label, makeRepo(`u2-${logN}`), async (t) => {
    const calls = fake(opts);
    await t.prompt("A");
    await t.answer("A", LONG);
    await t.end("A");
    await waitFor(() => calls().length > 0);
    await sleep(300);
    check(`${label}: checker ran`, calls().length === 1);
    check(`${label}: sends nothing`, t.synthetic.length === 0, JSON.stringify(t.synthetic));
  });
}

await run("short answers", makeRepo("u3"), async (t) => {
  const calls = fake({ out: "verify-final: no findings\n" });
  await t.prompt("A");
  await t.answer("A", "y".repeat(50));
  await t.end("A");
  await sleep(QUIET_MS);
  check("short answers are skipped", calls().length === 0);
  await t.prompt("A");
  await t.answer("A", "y".repeat(50) + " \u2753");
  await t.end("A");
  check("a short answer with a grill marker is checked", await waitFor(() => calls().length === 1));
});

await run("stale result", makeRepo("u4"), async (t) => {
  const calls = fake({ out: FALSE_OUT, delay: 300 });
  await t.prompt("A");
  await t.answer("A", LONG);
  await t.end("A");
  await t.prompt("A", "next question");
  await sleep(QUIET_MS);
  // The new prompt stops the checker (or drops its result if it already finished).
  check(
    "stale result is dropped",
    calls().length <= 1 && t.synthetic.length === 0,
    JSON.stringify(t.synthetic),
  );
});

await run("failed or interrupted", makeRepo("u5"), async (t) => {
  const calls = fake({ out: FALSE_OUT });
  await t.prompt("A");
  await t.edit("A", "app.py");
  await t.answer("A", LONG);
  await t.end("A", "failed");
  await t.answer("A", LONG);
  await t.end("A", "interrupted");
  await sleep(QUIET_MS);
  check("failed or interrupted runs are ignored", calls().length === 0 && t.synthetic.length === 0);
});

await run("settle nudge then post-cleanup check", makeRepo("u6"), async (t) => {
  const calls = fake({ out: FALSE_OUT });
  await t.prompt("A");
  await t.edit("A", "app.py");
  await t.answer("A", LONG);
  await t.end("A");
  check("settle nudge when tracked files are uncommitted", t.synthetic.length === 1);
  check(
    "nudge is Pi's settle wording",
    settleTexts("app.py").includes(t.synthetic[0]?.text),
    t.synthetic[0]?.text,
  );
  await sleep(QUIET_MS);
  check("the nudged answer is not fact-checked", calls().length === 0);
  await t.answer("A", LONG + " after cleanup");
  await t.end("A");
  await waitFor(() => t.synthetic.length > 1);
  check(
    "answer after the cleanup turn is fact-checked",
    calls()[0] === LONG + " after cleanup",
    JSON.stringify(calls()),
  );
  check(
    "its FALSE finding is the second follow-up",
    t.synthetic.length === 2 && t.synthetic[1]?.text === FALSE_OUT,
  );
  await t.answer("A", LONG + " third");
  await t.end("A");
  await sleep(QUIET_MS);
  check("a third turn end gets nothing", t.synthetic.length === 2 && calls().length === 1);
});

await run("no nudge after gate", makeRepo("u7"), async (t) => {
  const calls = fake({ out: "verify-final: no findings\n" });
  await t.prompt("A");
  await t.edit("A", "app.py");
  check("gate fires", held(await t.evaluate("A", ["git commit -m x"])));
  await t.answer("A", LONG);
  await t.end("A");
  await waitFor(() => calls().length > 0);
  check("no nudge when the gate already fired", t.synthetic.length === 0);
  check("the answer is fact-checked instead", calls().length === 1);
});

await run("no nudge after cleanup", makeRepo("u8"), async (t) => {
  fake({ out: "verify-final: no findings\n" });
  await t.prompt("A");
  await t.edit("A", "app.py");
  await t.emit("session.skill.activated", {
    sessionID: "A",
    id: "post-work-cleanup",
    name: "post-work-cleanup",
    text: "",
  });
  await t.answer("A", LONG);
  await t.end("A");
  await sleep(300);
  check("no nudge when cleanup ran this prompt", t.synthetic.length === 0);
});

await run("VERIFY_FINAL=0", makeRepo("u9"), async (t) => {
  const calls = fake({ out: FALSE_OUT });
  process.env.VERIFY_FINAL = "0";
  try {
    await t.prompt("A");
    await t.edit("A", "app.py");
    await t.answer("A", LONG);
    await t.end("A");
    check("VERIFY_FINAL=0 keeps the nudge", t.synthetic.length === 1);
    await t.answer("A", LONG);
    await t.end("A");
    await sleep(QUIET_MS);
    check("VERIFY_FINAL=0 skips the check", calls().length === 0 && t.synthetic.length === 1);
  } finally {
    delete process.env.VERIFY_FINAL;
  }
});

await run(
  "child session end",
  makeRepo("u10"),
  async (t) => {
    const calls = fake({ out: FALSE_OUT });
    await t.prompt("C");
    await t.answer("C", LONG);
    await t.end("C");
    await sleep(QUIET_MS);
    check("child sessions are never checked", calls().length === 0 && t.synthetic.length === 0);
  },
  { parents: { C: "A" } },
);

await run(
  "duplicate event delivery",
  makeRepo("u11"),
  async (t) => {
    const calls = fake({ out: FALSE_OUT });
    await t.prompt("A");
    await t.edit("A", "app.py");
    await t.answer("A", LONG);
    await t.end("A");
    await sleep(300);
    check(
      "a duplicated turn end nudges once",
      t.synthetic.length === 1,
      JSON.stringify(t.synthetic),
    );
    await t.answer("A", LONG);
    await t.end("A");
    await waitFor(() => t.synthetic.length > 1);
    await sleep(300);
    check(
      "a duplicated answer reaches the checker once",
      calls().length === 1 && calls()[0] === LONG,
      JSON.stringify(calls()),
    );
    check(
      "a duplicated turn end sends one finding",
      t.synthetic.length === 2,
      JSON.stringify(t.synthetic),
    );
  },
  { dup: true },
);

await run("prompt during turn-end lookup", makeRepo("u12"), async (t) => {
  const calls = fake({ out: FALSE_OUT });
  t.getDelay = 300;
  await t.prompt("A");
  await t.answer("A", LONG);
  const ended = t.end("A");
  await sleep(50);
  await t.prompt("A", "next question");
  await ended;
  await sleep(QUIET_MS);
  check(
    "an answer from before a new prompt is never checked",
    calls().length === 0 && t.synthetic.length === 0,
    JSON.stringify(t.synthetic),
  );
});

await run("new prompt stops a running check", makeRepo("u13"), async (t) => {
  const calls = fake({ out: FALSE_OUT, delay: 1500 });
  await t.prompt("A");
  await t.answer("A", LONG);
  await t.end("A");
  await sleep(500);
  await t.prompt("A", "next question");
  await sleep(QUIET_MS);
  check("a new prompt kills the running checker", calls().length === 0, JSON.stringify(calls()));
});

await run("cleanup during edit tracking", makeRepo("u14"), async (t) => {
  await t.prompt("A");
  const edited = t.edit("A", "app.py");
  await t.emit("session.skill.activated", {
    sessionID: "A",
    id: "post-work-cleanup",
    name: "post-work-cleanup",
    text: "",
  });
  await edited;
  await t.prompt("A");
  check(
    "an edit finishing after the cleanup is not tracked",
    !held(await t.evaluate("A", ["git commit -m x"])),
  );
});

await run("failed checker with findings", makeRepo("u15"), async (t) => {
  const calls = fake({ out: FALSE_OUT, exit: 1 });
  await t.prompt("A");
  await t.answer("A", LONG);
  await t.end("A");
  await waitFor(() => calls().length > 0);
  await sleep(300);
  check(
    "a failed checker's output is not sent",
    calls().length === 1 && t.synthetic.length === 0,
    JSON.stringify(t.synthetic),
  );
});

console.log(`opencode-verify-final: ${pass} passed, ${failures.length} failed`);
for (const f of failures) console.log(`FAIL: ${f}`);
process.exit(failures.length ? 1 : 0);
