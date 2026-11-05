#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node --input-type=module <<'NODE'
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadSkillsFromDir } from './.pi/agent/node_modules/@earendil-works/pi-coding-agent/dist/core/skills.js';

const dir = path.resolve('.agents/skills/check-agent-compatibility');
const loaded = loadSkillsFromDir({ dir, source: 'test' });
assert.equal(loaded.skills.length, 1, 'Pi must discover exactly one skill');
assert.deepEqual(loaded.diagnostics, []);
const skill = loaded.skills[0];
assert.equal(skill.name, 'check-agent-compatibility');
assert.equal(skill.disableModelInvocation, true, 'expensive assessment is manual-only');
const body = fs.readFileSync(skill.filePath, 'utf8');
assert.match(body, /model: "cheap"/);
assert.match(body, /agent-compatibility@0\.1\.7/);
assert.match(body, /agents\.spawn/);
assert.match(body, /agents\.wait/);
assert.match(body, /incomplete/i);
for (const name of ['compatibility-scan-review', 'startup-review', 'validation-review', 'docs-reliability-review']) {
  const relative = `references/${name}.md`;
  assert.ok(body.includes(relative), `skill must route to ${relative}`);
  assert.match(fs.readFileSync(path.join(dir, relative), 'utf8'), /## Workflow/);
}
assert.match(fs.readFileSync(path.join(dir, 'LICENSE'), 'utf8'), /Copyright \(c\) 2026 Cursor/);
assert.match(fs.readFileSync(path.join(dir, 'README.md'), 'utf8'), /2776ddd2355d6d6c8747d3964600f28daf62f049/);
console.log('Pi discovers the manual skill, all four reviewer references and provenance.');
NODE
