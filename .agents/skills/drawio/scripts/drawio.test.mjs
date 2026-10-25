import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createServer } from "./server.mjs";

const XML = '<mxfile><diagram id="d" name="Page-1"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel></diagram></mxfile>';

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "drawio-test-"));
}

async function serve(t, opts = {}) {
  const dir = opts.dir ?? tmpDir();
  const server = createServer({ dir, ...opts });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}`;
  return { dir, base };
}

const put = (base, file, body) =>
  fetch(`${base}/api/file?file=${encodeURIComponent(file)}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

test("health returns dir", async (t) => {
  const { dir, base } = await serve(t);
  const res = await fetch(`${base}/api/health`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true, dir: path.resolve(dir) });
});

test("put then get round-trips xml and mtime", async (t) => {
  const { base } = await serve(t);
  const saved = await put(base, "a.drawio", { xml: XML, baseMtime: null });
  assert.equal(saved.status, 200);
  const { mtime } = await saved.json();
  const got = await (await fetch(`${base}/api/file?file=a.drawio`)).json();
  assert.deepEqual(got, { xml: XML, mtime });
});

test("get missing file returns 404 with null mtime", async (t) => {
  const { base } = await serve(t);
  const res = await fetch(`${base}/api/file?file=nope.drawio`);
  assert.equal(res.status, 404);
  assert.deepEqual(await res.json(), { mtime: null });
});

test("put with stale baseMtime returns 409 and leaves disk unchanged", async (t) => {
  const { dir, base } = await serve(t);
  const first = await (await put(base, "a.drawio", { xml: XML, baseMtime: null })).json();
  fs.writeFileSync(path.join(dir, "a.drawio"), "agent edit");
  const future = new Date(first.mtime + 5000);
  fs.utimesSync(path.join(dir, "a.drawio"), future, future);
  const res = await put(base, "a.drawio", { xml: "browser edit", baseMtime: first.mtime });
  assert.equal(res.status, 409);
  assert.equal((await res.json()).mtime, first.mtime + 5000);
  assert.equal(fs.readFileSync(path.join(dir, "a.drawio"), "utf8"), "agent edit");
});

test("put new file with baseMtime null creates nested folders", async (t) => {
  const { dir, base } = await serve(t);
  const res = await put(base, "plans/sub/x.drawio", { xml: XML, baseMtime: null });
  assert.equal(res.status, 200);
  assert.equal(fs.readFileSync(path.join(dir, "plans/sub/x.drawio"), "utf8"), XML);
});

test("put with baseMtime null on existing file returns 409", async (t) => {
  const { dir, base } = await serve(t);
  fs.writeFileSync(path.join(dir, "a.drawio"), "existing");
  const res = await put(base, "a.drawio", { xml: XML, baseMtime: null });
  assert.equal(res.status, 409);
  assert.equal(fs.readFileSync(path.join(dir, "a.drawio"), "utf8"), "existing");
});

test("rejects traversal and non-drawio names", async (t) => {
  const { base } = await serve(t);
  for (const bad of ["../x.drawio", "/etc/x.drawio", "a/../../x.drawio", "a.txt", "", "C:\\x.drawio"]) {
    const g = await fetch(`${base}/api/file?file=${encodeURIComponent(bad)}`);
    assert.equal(g.status, 400, `GET ${bad}`);
    const p = await put(base, bad, { xml: XML, baseMtime: null });
    assert.equal(p.status, 400, `PUT ${bad}`);
  }
});

test("list is recursive, sorted, and skips dot-dirs and node_modules", async (t) => {
  const { dir, base } = await serve(t);
  for (const f of ["b.drawio", "plans/a.drawio", ".git/x.drawio", "node_modules/y.drawio", "notes.md"]) {
    fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true });
    fs.writeFileSync(path.join(dir, f), XML);
  }
  const { files } = await (await fetch(`${base}/api/list`)).json();
  assert.deepEqual(
    files.map((f) => f.file),
    ["b.drawio", "plans/a.drawio"],
  );
  assert.equal(typeof files[0].mtime, "number");
});

test("idle timeout calls onIdle", async (t) => {
  let idle = false;
  await serve(t, { idleMs: 200, onIdle: () => (idle = true) });
  await new Promise((r) => setTimeout(r, 400));
  assert.equal(idle, true);
});
