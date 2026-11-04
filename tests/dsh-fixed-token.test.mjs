import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  chmodSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const installer = new URL("../lib/dsh-fixed-token.mjs", import.meta.url);
// The installed dsh 0.2.1-rc.3 token factory, isolated from its runtime dependencies.
const upstream = `function processLaunchToken(owner) {
	const existing = PROCESS_LAUNCH_TOKENS.get(owner);
	if (existing !== void 0) return existing;
	const created = encodeBase64Url(randomBytes(SECRET_BYTES));
	PROCESS_LAUNCH_TOKENS.set(owner, created);
	return created;
}`;
const fixture = `import { randomBytes } from "node:crypto";\nconst SECRET_BYTES = 32;\nconst PROCESS_LAUNCH_TOKENS = new WeakMap();\nfunction encodeBase64Url(value) { return value.toString("base64url"); }\n${upstream}\nconsole.log(processLaunchToken({}));\n`;

function setup(t) {
  const dir = mkdtempSync(join(tmpdir(), "dsh-fixed-token-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const target = join(dir, "index.mjs");
  const token = join(dir, "token");
  writeFileSync(target, fixture);
  return { target, token };
}
function install(target, token) {
  return execFileSync(process.execPath, [installer.pathname, target, token], {
    encoding: "utf8",
    stdio: "pipe",
  });
}
function launch(target) {
  return execFileSync(process.execPath, [target], { encoding: "utf8", stdio: "pipe" }).trim();
}

test("one private token is reused across processes and repeated installation", (t) => {
  const { target, token } = setup(t);
  install(target, token);
  const first = launch(target);
  assert.match(first, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(statSync(token).mode & 0o077, 0);
  assert.equal(launch(target), first);
  install(target, token);
  assert.equal(launch(target), first);
  assert.equal(readFileSync(token, "utf8").trim(), first);
});

test("unsafe permissions fail closed at startup", (t) => {
  const { target, token } = setup(t);
  install(target, token);
  chmodSync(token, 0o644);
  assert.throws(() => launch(target), /private regular file/);
});

test("invalid or missing token fails closed rather than changing credentials", (t) => {
  const { target, token } = setup(t);
  install(target, token);
  writeFileSync(token, "short\n");
  assert.throws(() => launch(target), /invalid token/);
  rmSync(token);
  assert.throws(() => launch(target), /ENOENT/);
});

test("symlink token files are rejected at startup and installation", (t) => {
  const { target, token } = setup(t);
  install(target, token);
  const other = `${token}.other`;
  writeFileSync(other, readFileSync(token), { mode: 0o600 });
  rmSync(token);
  symlinkSync(other, token);
  assert.throws(() => launch(target), /private regular file/);
  assert.throws(() => install(target, token), /private regular file/);
});

test("unrecognized upstream code is not overwritten", (t) => {
  const { target, token } = setup(t);
  writeFileSync(target, "changed upstream\n");
  assert.throws(() => install(target, token), /unsupported dsh authentication source/);
  assert.equal(readFileSync(target, "utf8"), "changed upstream\n");
});
