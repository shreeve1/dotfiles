#!/usr/bin/env bash
# fusion-smoke.sh — behavioral smoke for the fusion Pi extension.
#
# Drives the pure helpers OFFLINE (no pi runtime, no model, no network) and
# asserts:
#   (1)  node --check + required exports/symbols present
#   (2)  child-env detection honors PI_SUBAGENT_CHILD=1
#   (3)  global config read returns undefined for absent / malformed files
#   (4)  parent tool allowlist matches the agreed set exactly
#   (5)  Bash policy: rejects shell metacharacters, redirects, dangerous
#        modes, fix/snapshot/install; allows standard verification + Git;
#        honors trusted-project override; ignores untrusted override.
#   (6)  Subagent validation rejects non-allowed roles + model/thinking
#        overrides; coerces context→fresh and output→false for roles other
#        than worker/planner; accepts valid worker call; blocks management mutations.
#   (7)  readLatestFusionState walks entries backward and picks the last one.
#
# Does NOT exercise the live spawn — that requires a real pi turn + model.
# The smoke guarantees the gating logic is correct, not that pi respects it.

set -u
script_dir=$(cd "$(dirname "$0")" && pwd)
ext="$script_dir/../index.ts"

[ -f "$ext" ] || {
  echo "FAIL: extension not found at $ext" >&2
  exit 1
}

# --- (1) static checks ---------------------------------------------------
# jiti is loaded by pi; for offline --check we use Node + ts compile-on-fly
# via npx/tsc isn't necessary — node --check does not type-check TS, but it
# does parse-check JS. Since this is a TS file, use the tsx-style check that
# pi itself uses (skip if unavailable, fall back to requiring the file via
# a transient loader). Easiest: confirm required exported symbols exist by
# grepping the file (string-equality with the actual code surface).
for sym in \
  "SUBAGENT_CHILD_ENV" \
  "isChildProcess" \
  "FUSION_STATE_CUSTOM" \
  "globalConfigPath" \
  "readGlobalDefaultMode" \
  "writeGlobalDefaultMode" \
  "PARENT_ALLOWED_TOOLS" \
  "parentToolAllowlist" \
  "applyParentAllowlist" \
  "GLOBAL_BASH_ALLOWLIST" \
  "isSafeBash" \
  "loadProjectBashOverride" \
  "ALLOWED_EXECUTION_ROLES" \
  "validateAndNormalizeSubagentCall" \
  "readLatestFusionState" \
  "FUSION_GUIDANCE_FULL" \
  'pi.registerCommand("fusion"' \
  'pi.on("session_start"' \
  'pi.on("before_agent_start"' \
  'pi.on("tool_call"' \
  "fusion-state"; do
  grep -qF "$sym" "$ext" || {
    echo "FAIL: missing $sym in extension" >&2
    exit 1
  }
done
echo "OK:   static checks (exports + handlers + state types)"

# --- (2) child-env detection --------------------------------------------
node --input-type=module -e "
process.env.PI_SUBAGENT_CHILD='1';
const url='$(printf '%s' "$ext" | sed "s|'|\\\\'|g")';
const mod = await import(url);
if (!mod.isChildProcess(process.env)) { console.log('FAIL: child env'); process.exit(1); }
delete process.env.PI_SUBAGENT_CHILD;
if (mod.isChildProcess(process.env)) { console.log('FAIL: non-child env'); process.exit(1); }
" || {
  echo 'FAIL: child env detection' >&2
  exit 1
}
echo "OK:   child-env detection"

# --- (3) global config read ---------------------------------------------
tmpdir=$(mktemp -d)
node --input-type=module -e "
const url='$(printf '%s' "$ext" | sed "s|'|\\\\'|g")';
const fs = await import('node:fs');
const path = await import('node:path');
const os = await import('node:os');
const { readGlobalDefaultMode, writeGlobalDefaultMode } = await import(url);

const dir = '$tmpdir';
fs.mkdirSync(path.join(dir, 'fusion'), { recursive: true });
const cfg = path.join(dir, 'fusion/config.json');

// absent -> undefined (use a path that does not exist yet)
const cfgAbsent = path.join(dir, 'nope/fusion/config.json');
if (readGlobalDefaultMode(cfgAbsent) !== undefined) { console.log('FAIL: absent config'); process.exit(1); }

// malformed -> undefined
fs.writeFileSync(cfg, 'not json');
if (readGlobalDefaultMode(cfg) !== undefined) { console.log('FAIL: malformed config'); process.exit(1); }

// valid 'on'
fs.writeFileSync(cfg, JSON.stringify({ defaultMode: 'on', extra: 'ignored' }));
if (readGlobalDefaultMode(cfg) !== 'on') { console.log('FAIL: read on'); process.exit(1); }

// valid 'off'
fs.writeFileSync(cfg, JSON.stringify({ defaultMode: 'off' }));
if (readGlobalDefaultMode(cfg) !== 'off') { console.log('FAIL: read off'); process.exit(1); }

// writes round-trip
if (!writeGlobalDefaultMode('on', cfg) || readGlobalDefaultMode(cfg) !== 'on') {
  console.log('FAIL: write on'); process.exit(1);
}
if (!writeGlobalDefaultMode('off', cfg) || readGlobalDefaultMode(cfg) !== 'off') {
  console.log('FAIL: write off'); process.exit(1);
}
" || {
  echo 'FAIL: global config round-trip' >&2
  exit 1
}
echo "OK:   global config (absent/malformed/valid/round-trip)"

# --- (4) parent tool allowlist ------------------------------------------
node --input-type=module -e "
const url='$(printf '%s' "$ext" | sed "s|'|\\\\'|g")';
const { PARENT_ALLOWED_TOOLS, parentToolAllowlist, applyParentAllowlist, isParentAllowedTool } = await import(url);

const expected = ['read','bash','lsp_diagnostics','subagent','subagent_wait','subagent_supervisor','todo','advisor','bg_start','bg_status','bg_list','bg_kill'];
if (PARENT_ALLOWED_TOOLS.length !== expected.length) { console.log('FAIL: allowed tool length'); process.exit(1); }
for (const t of expected) {
  if (!PARENT_ALLOWED_TOOLS.includes(t)) { console.log('FAIL: missing tool ' + t); process.exit(1); }
  if (!isParentAllowedTool(t)) { console.log('FAIL: not allowed ' + t); process.exit(1); }
}
for (const t of ['grep','find','ls','edit','write','web_search','web_fetch','lsp_navigation']) {
  if (isParentAllowedTool(t)) { console.log('FAIL: should NOT be allowed ' + t); process.exit(1); }
}

// Union with extras does not replace base
const merged = parentToolAllowlist(['extra_tool']);
if (!merged.includes('read') || !merged.includes('extra_tool')) { console.log('FAIL: extras union'); process.exit(1); }
if (parentToolAllowlist(['read']).length !== expected.length) { console.log('FAIL: dedup'); process.exit(1); }

// applyParentAllowlist goes through getActiveTools / setActiveTools
const calls = { active: ['read','grep','write'], set: [] };
applyParentAllowlist({
  getActiveTools: () => calls.active,
  setActiveTools: (n) => { calls.set = n; },
});
if (calls.set.length !== expected.length || calls.set.includes('grep')) { console.log('FAIL: apply'); process.exit(1); }
" || {
  echo 'FAIL: parent allowlist' >&2
  exit 1
}
echo "OK:   parent tool allowlist (set + apply)"

# --- (5) Bash policy ---------------------------------------------------
node --input-type=module -e "
const url='$(printf '%s' "$ext" | sed "s|'|\\\\'|g")';
const { isSafeBash } = await import(url);

// globally-allowed
const okCases = [
  'git status',
  'git diff',
  'git diff --stat',
  'git log -n 5 --oneline',
  'git log --pretty=oneline -n 10',
  'git show HEAD',
  'cargo test',
  'cargo build --release',
  'go test ./...',
  'go vet ./...',
  'make test',
  'make lint',
  'npm test',
  'npm run lint',
  'pnpm run build',
  'pytest -q',
  'python -m pytest tests/',
  'ruff check',
  'mypy src',
  'tsc --noEmit',
  'eslint src',
  'biome check src',
  'prettier --check .',
];
for (const c of okCases) {
  const v = isSafeBash(c);
  if (!v.ok) { console.log('FAIL: should allow [' + c + '] -> ' + v.reason); process.exit(1); }
}

// denied: shell metacharacters
for (const c of ['ls; rm -rf /', 'echo hi && ls', 'ls | grep x', 'ls > out', 'cat < in', 'echo \$(date)', 'echo \`date\'', 'ls\nrm -rf /']) {
  const v = isSafeBash(c);
  if (v.ok) { console.log('FAIL: should deny (metachar) [' + c + ']'); process.exit(1); }
}

// denied: redirects
for (const c of ['ls >> out', 'echo > file', 'cat < other']) {
  const v = isSafeBash(c);
  if (v.ok) { console.log('FAIL: should deny (redirect) [' + c + ']'); process.exit(1); }
}

// denied: dangerous modes
for (const c of [
  'npm install foo',
  'npm update',
  'yarn install',
  'pnpm add foo',
  'pip install foo',
  'uv tool install foo',
  'cargo install foo',
  'prettier --write .',
  'eslint --fix src',
  'ruff check --fix src',
  'jest -u',
  'vitest -u',
  'git commit --amend',
  'git commit',
  'git push',
  'git checkout main',
  'git reset --hard',
  'git stash pop',
  'git branch -D main',
  'tee out',
  'cat file > out',
  'bash',
  'python',
  'node',
]) {
  const v = isSafeBash(c);
  if (v.ok) { console.log('FAIL: should deny (dangerous) [' + c + ']'); process.exit(1); }
}

// denied: empty / not allowed
const v1 = isSafeBash('');
if (v1.ok) { console.log('FAIL: should deny empty'); process.exit(1); }
const v2 = isSafeBash('ls');
if (v2.ok) { console.log('FAIL: should deny ls (not global, no project override)'); process.exit(1); }

// trusted-project exact-match grant
const v3 = isSafeBash('ls', { projectAllowed: ['ls'] });
if (!v3.ok) { console.log('FAIL: project allow should grant [' + c + '] -> ' + v3.reason); process.exit(1); }

// different exact command not granted
const v4 = isSafeBash('ls -la', { projectAllowed: ['ls'] });
if (v4.ok) { console.log('FAIL: prefix matching should NOT grant'); process.exit(1); }

// dangerous mode wins over project allow
const v5 = isSafeBash('npm install', { projectAllowed: ['npm install'] });
if (v5.ok) { console.log('FAIL: dangerous mode should win over project allow'); process.exit(1); }

// shell metacharacter wins over project allow
const v6 = isSafeBash('ls; rm x', { projectAllowed: ['ls; rm x'] });
if (v6.ok) { console.log('FAIL: shell metachar should win over project allow'); process.exit(1); }
" || {
  echo 'FAIL: bash policy' >&2
  exit 1
}
echo "OK:   bash policy (allowed / metachar / dangerous / project-override / deny-wins)"

# --- (5b) parent commit exception (git add / git commit -m) --------------
# The Fusion parent may author commits. ONLY git add + git commit -m in
# tightly-shaped, injection-free forms are allowed; every other git verb and
# commit form stays hard-denied, and message injection must not escape.
node --input-type=module -e "
const url='$(printf '%s' "$ext" | sed "s|'|\\\\'|g")';
const { isSafeBash, isSafeGitCommit } = await import(url);

// allowed: commit with quoted messages containing shell metacharacters
const commitOk = [
  \"git commit -m 'feat(pi-subagents): add thing'\",
  \"git commit -m 'fix: handle !bang and (parens)'\",
  'git commit -m \"docs: plain double-quoted\"',
  \"git commit -m ''\",
  'git add -A',
  'git add .pi/agent/settings.json.template',
  'git add src/a.ts src/b.ts',
  'git add -p',
  'git add -- path/to/file',
];
for (const c of commitOk) {
  const v = isSafeBash(c);
  if (!v.ok) { console.log('FAIL: parent commit should allow [' + c + '] -> ' + v.reason); process.exit(1); }
}

// denied: other commit forms, other mutating verbs, and injection attempts
const commitDeny = [
  'git commit',                               // no -m
  'git commit --amend',
  'git commit -a -m x',                        // -a not permitted (stages tracked implicitly)
  \"git commit -m 'x' && rm -rf /\",           // trailing command after closing quote
  \"git commit -m 'x'; echo hi\",
  'git commit -m \"x\$(rm -rf /)\"',            // command substitution in double quotes
  'git commit -m \"x\`id\`\"',                  // backtick substitution
  'git push',
  'git reset --hard',
  'git checkout main',
  'git add',                                   // bare add, no targets
  'git add; rm x',
  'git add foo\nid',                           // newline injection: second command
  'git add foo\rid',                           // carriage-return variant
  'git add -c foo',                            // -c is not a permitted add flag
  'git add --upload-pack=/x',                  // arbitrary --flag rejected
  'git add -- --exec=/x',                      // dangerous flag after --
];
for (const c of commitDeny) {
  const v = isSafeBash(c);
  if (v.ok) { console.log('FAIL: parent commit should DENY [' + c + ']'); process.exit(1); }
}

// isSafeGitCommit is the narrow recognizer: false for anything non-commit
if (isSafeGitCommit('git status')) { console.log('FAIL: recognizer should not match git status'); process.exit(1); }
if (isSafeGitCommit('git commit --amend')) { console.log('FAIL: recognizer should not match --amend'); process.exit(1); }
" || {
  echo 'FAIL: parent commit exception' >&2
  exit 1
}
echo "OK:   parent commit exception (git add / commit -m allowed; injection + other verbs denied)"

# --- (5a) generic --name=value Bash tail rejection --------------------
# Without generic --name=value acceptance, arbitrary flag values are denied.
# Only flags explicitly listed in OK_TRAILING_FLAGS pass.
node --input-type=module -e "
const url='$(printf '%s' "$ext" | sed "s|'|\\\\'|g")';
const { isSafeBash } = await import(url);

// generic --name=value is rejected at the tail
const denied = [
  'git diff --output=foo',
  'git diff --output artifact.patch',
  'git diff --format=json',
  'git log --grep=needle',
  'git log --since=2025-01-01',
  'pytest --rootdir=foo',
  'cargo test --manifest-path=foo',
  'eslint --config=foo',
  'eslint --output-file report.txt',
  'ruff check --config=foo',
  'mypy --config-file=foo',
];
for (const c of denied) {
  const v = isSafeBash(c);
  if (v.ok) { console.log('FAIL: generic --name=value should deny [' + c + ']'); process.exit(1); }
}

// explicit flags in OK_TRAILING_FLAGS still pass
const allowed = [
  'git diff --name-only',
  'git diff --stat',
  'git log --pretty=oneline',
  'git log --no-color',
  'tsc --noEmit',
  'prettier --check .',
  'pytest tests/',
  'cargo test --release',
];
for (const c of allowed) {
  const v = isSafeBash(c);
  if (!v.ok) { console.log('FAIL: explicit flag should allow [' + c + '] -> ' + v.reason); process.exit(1); }
}
" || {
  echo 'FAIL: generic --name=value rejection' >&2
  exit 1
}
echo "OK:   generic --name=value rejected; explicit flags still pass"

# --- (6) Subagent validation -------------------------------------------
node --input-type=module -e "
const url='$(printf '%s' "$ext" | sed "s|'|\\\\'|g")';
const { validateAndNormalizeSubagentCall, ALLOWED_EXECUTION_ROLES } = await import(url);

// allowed single worker -> coerced fresh + output preserved (worker may keep output)
{
  const args = { agent: 'worker', task: 'do x', context: 'fork', output: 'progress.md' };
  const v = validateAndNormalizeSubagentCall(args, true);
  if (!v.ok) { console.log('FAIL: worker should validate -> ' + v.reason); process.exit(1); }
  if (args.context !== 'fresh') { console.log('FAIL: context not forced fresh'); process.exit(1); }
  if (!v.contextForced) { console.log('FAIL: contextForced false'); process.exit(1); }
}

// scout with explicit context + output -> output forced false (non-worker)
{
  const args = { agent: 'scout', task: 'map it', context: 'fork', output: 'context.md' };
  const v = validateAndNormalizeSubagentCall(args, true);
  if (!v.ok) { console.log('FAIL: scout validate'); process.exit(1); }
  if (args.context !== 'fresh') { console.log('FAIL: scout context'); process.exit(1); }
  if (args.output !== false) { console.log('FAIL: scout output not forced false -> got ' + JSON.stringify(args.output)); process.exit(1); }
  if (!v.outputForced) { console.log('FAIL: outputForced false'); process.exit(1); }
}

// scout without output -> output still forced false (the point is no repo file ever)
{
  const args = { agent: 'scout', task: 'map it' };
  const v = validateAndNormalizeSubagentCall(args, true);
  if (!v.ok) { console.log('FAIL: scout no-output'); process.exit(1); }
  if (args.output !== false) { console.log('FAIL: scout default output not false -> got ' + JSON.stringify(args.output)); process.exit(1); }
}

// non-allowed role rejected
{
  const args = { agent: 'oracle', task: 'review' };
  const v = validateAndNormalizeSubagentCall(args, true);
  if (v.ok) { console.log('FAIL: oracle should be rejected'); process.exit(1); }
}

// model override rejected
{
  const args = { agent: 'worker', task: 'x', model: 'anthropic/claude-opus' };
  const v = validateAndNormalizeSubagentCall(args, false);
  if (v.ok) { console.log('FAIL: model override should be rejected'); process.exit(1); }
}

// thinking override rejected
{
  const args = { agent: 'worker', task: 'x', thinking: 'high' };
  const v = validateAndNormalizeSubagentCall(args, false);
  if (v.ok) { console.log('FAIL: thinking override should be rejected'); process.exit(1); }
}

// parallel tasks: non-worker stripped output, role guard
{
  const args = { tasks: [
    { agent: 'worker', task: 'a' },
    { agent: 'scout', task: 'b', output: 'ctx.md' },
    { agent: 'oracle', task: 'c' },
  ]};
  const v = validateAndNormalizeSubagentCall(args, true);
  if (v.ok) { console.log('FAIL: oracle in parallel should be rejected -> ' + v.reason); process.exit(1); }
}

// chain steps with bad step + parallel bad
{
  const args = { chain: [
    { agent: 'worker', task: 'a' },
    { agent: 'oracle', task: 'b' },
  ]};
  const v = validateAndNormalizeSubagentCall(args, false);
  if (v.ok) { console.log('FAIL: chain oracle should be rejected'); process.exit(1); }
}

// management read-only actions allowed
{
  for (const action of ['list', 'get', 'models', 'status', 'doctor', 'watchdog.status']) {
    const args = { action };
    const v = validateAndNormalizeSubagentCall(args, true);
    if (!v.ok) { console.log('FAIL: read action ' + action + ' -> ' + v.reason); process.exit(1); }
  }
}

// management mutation actions blocked
{
  for (const action of ['create', 'update', 'delete', 'eject', 'disable', 'enable', 'reset', 'watchdog.configure', 'grant-spawn-budget', 'schedule', 'schedule-cancel']) {
    const args = { action };
    const v = validateAndNormalizeSubagentCall(args, true);
    if (v.ok) { console.log('FAIL: mutation action should be blocked: ' + action); process.exit(1); }
  }
}

// append-step is also subject to execution validation
{
  const args = { appendStep: [{ agent: 'oracle', task: 'x' }] };
  const v = validateAndNormalizeSubagentCall(args, false);
  if (v.ok) { console.log('FAIL: appendStep bad role should be rejected'); process.exit(1); }
}

// ALLOWED_EXECUTION_ROLES set
for (const r of ['scout','researcher','worker','reviewer','planner']) {
  if (!ALLOWED_EXECUTION_ROLES.has(r)) { console.log('FAIL: missing role ' + r); process.exit(1); }
}
for (const r of ['oracle','context-builder','delegate']) {
  if (ALLOWED_EXECUTION_ROLES.has(r)) { console.log('FAIL: extra role ' + r); process.exit(1); }
}
" || {
  echo 'FAIL: subagent validation' >&2
  exit 1
}
echo "OK:   subagent validation (roles/context/output/chain/parallel/actions)"

# --- (6a) append-step action shape (real schema) ------------------------
node --input-type=module -e "
const url='$(printf '%s' "$ext" | sed "s|'|\\\\'|g")';
const { validateAndNormalizeSubagentCall } = await import(url);

// Valid: { action: 'append-step', id: 'run-1', chain: [{agent, task}] }
{
  const args = { action: 'append-step', id: 'run-1', chain: [{ agent: 'worker', task: 'continue' }] };
  const v = validateAndNormalizeSubagentCall(args, true);
  if (!v.ok) { console.log('FAIL: append-step valid -> ' + v.reason); process.exit(1); }
  if (args.action !== 'append-step' || args.id !== 'run-1') { console.log('FAIL: append-step shape retained'); process.exit(1); }
}

// runId alternative
{
  const args = { action: 'append-step', runId: 'r1', chain: [{ agent: 'worker', task: 'x' }] };
  const v = validateAndNormalizeSubagentCall(args, true);
  if (!v.ok) { console.log('FAIL: append-step runId -> ' + v.reason); process.exit(1); }
}

// append-step with bad role in chain -> rejected before generic management rejection
{
  const args = { action: 'append-step', id: 'r1', chain: [{ agent: 'oracle', task: 'x' }] };
  const v = validateAndNormalizeSubagentCall(args, true);
  if (v.ok) { console.log('FAIL: append-step bad role should be rejected'); process.exit(1); }
  if (!/oracle/.test(v.reason)) { console.log('FAIL: append-step reject reason should mention oracle -> ' + v.reason); process.exit(1); }
}

// append-step must have id or runId
{
  const args = { action: 'append-step', chain: [{ agent: 'worker', task: 'x' }] };
  const v = validateAndNormalizeSubagentCall(args, true);
  if (v.ok) { console.log('FAIL: append-step missing id should be rejected'); process.exit(1); }
}

// append-step must have chain
{
  const args = { action: 'append-step', id: 'r1' };
  const v = validateAndNormalizeSubagentCall(args, true);
  if (v.ok) { console.log('FAIL: append-step missing chain should be rejected'); process.exit(1); }
}

// append-step with model/thinking override -> rejected
{
  const args = { action: 'append-step', id: 'r1', chain: [{ agent: 'worker', task: 'x', model: 'foo/bar' }] };
  const v = validateAndNormalizeSubagentCall(args, true);
  if (v.ok) { console.log('FAIL: append-step model override should be rejected'); process.exit(1); }
}

// append-step with non-worker in chain -> output forced false
{
  const args = { action: 'append-step', id: 'r1', chain: [{ agent: 'scout', task: 'x', output: 'ctx.md' }] };
  const v = validateAndNormalizeSubagentCall(args, true);
  if (!v.ok) { console.log('FAIL: append-step scout'); process.exit(1); }
  if (args.chain[0].output !== false) { console.log('FAIL: append-step scout output not forced false -> ' + JSON.stringify(args.chain[0].output)); process.exit(1); }
}
" || {
  echo 'FAIL: append-step shape' >&2
  exit 1
}
echo "OK:   append-step shape (real schema, id/runId, chain validation, output)"

# --- (6b) allowed control actions (interrupt/stop/resume/steer) ---------
node --input-type=module -e "
const url='$(printf '%s' "$ext" | sed "s|'|\\\\'|g")';
const { validateAndNormalizeSubagentCall } = await import(url);

for (const action of ['interrupt', 'stop', 'resume', 'steer']) {
  const args = { action, id: 'r1', model: 'foo', thinking: 'high' };
  const v = validateAndNormalizeSubagentCall(args, true);
  if (!v.ok) { console.log('FAIL: control action ' + action + ' -> ' + v.reason); process.exit(1); }
  if (args.model !== undefined || args.thinking !== undefined) {
    console.log('FAIL: control action ' + action + ' should strip model/thinking from input -> model=' + JSON.stringify(args.model) + ' thinking=' + JSON.stringify(args.thinking));
    process.exit(1);
  }
}

// interrupt with runId (alternative to id)
{
  const args = { action: 'interrupt', runId: 'r1' };
  const v = validateAndNormalizeSubagentCall(args, true);
  if (!v.ok) { console.log('FAIL: interrupt runId -> ' + v.reason); process.exit(1); }
}

// resume with required message
{
  const args = { action: 'resume', id: 'r1', message: 'continue' };
  const v = validateAndNormalizeSubagentCall(args, true);
  if (!v.ok) { console.log('FAIL: resume message -> ' + v.reason); process.exit(1); }
}

// Unknown action stays rejected (not silently allowed)
{
  const args = { action: 'frobnicate', id: 'r1' };
  const v = validateAndNormalizeSubagentCall(args, true);
  if (v.ok) { console.log('FAIL: unknown action should be rejected'); process.exit(1); }
}
" || {
  echo 'FAIL: allowed control actions' >&2
  exit 1
}
echo "OK:   allowed control actions (interrupt/stop/resume/steer) + strip model/thinking"

# --- (6c) dynamic parallel (single object, not array) -------------------
node --input-type=module -e "
const url='$(printf '%s' "$ext" | sed "s|'|\\\\'|g")';
const { validateAndNormalizeSubagentCall } = await import(url);

// Dynamic parallel: single object with agent + expand + collect
{
  const args = { chain: [
    { parallel: { agent: 'scout', task: 'x' }, expand: { from: { output: 'p', path: '/i' } }, collect: { as: 'out' } },
  ]};
  const v = validateAndNormalizeSubagentCall(args, true);
  if (!v.ok) { console.log('FAIL: dynamic parallel scout -> ' + v.reason); process.exit(1); }
  if (args.chain[0].parallel.output !== false) { console.log('FAIL: dynamic parallel output not forced false'); process.exit(1); }
  if (!v.outputForced) { console.log('FAIL: dynamic parallel outputForced false'); process.exit(1); }
}

// Dynamic parallel with bad role -> rejected
{
  const args = { chain: [
    { parallel: { agent: 'oracle', task: 'x' }, expand: { from: { output: 'p', path: '/i' } }, collect: { as: 'out' } },
  ]};
  const v = validateAndNormalizeSubagentCall(args, true);
  if (v.ok) { console.log('FAIL: dynamic parallel oracle should be rejected'); process.exit(1); }
}

// Dynamic parallel with model override -> rejected
{
  const args = { chain: [
    { parallel: { agent: 'scout', task: 'x', model: 'foo/bar' }, expand: { from: { output: 'p', path: '/i' } }, collect: { as: 'out' } },
  ]};
  const v = validateAndNormalizeSubagentCall(args, true);
  if (v.ok) { console.log('FAIL: dynamic parallel model override should be rejected'); process.exit(1); }
}

// Dynamic parallel with worker -> output preserved (worker may keep output)
{
  const args = { chain: [
    { parallel: { agent: 'worker', task: 'x', output: 'progress.md' }, expand: { from: { output: 'p', path: '/i' } }, collect: { as: 'out' } },
  ]};
  const v = validateAndNormalizeSubagentCall(args, true);
  if (!v.ok) { console.log('FAIL: dynamic parallel worker -> ' + v.reason); process.exit(1); }
  if (args.chain[0].parallel.output !== 'progress.md') { console.log('FAIL: dynamic parallel worker output should be preserved'); process.exit(1); }
}
" || {
  echo 'FAIL: dynamic parallel' >&2
  exit 1
}
echo "OK:   dynamic parallel (single object, role/output/model rules)"

# --- (6d) static + nested output:false recursive --------------------------
node --input-type=module -e "
const url='$(printf '%s' "$ext" | sed "s|'|\\\\'|g")';
const { validateAndNormalizeSubagentCall } = await import(url);

// Static parallel: nested array output forced false
{
  const args = { tasks: [
    { agent: 'scout', task: 'a', output: 'ctx.md' },
    { agent: 'researcher', task: 'b' },
  ]};
  const v = validateAndNormalizeSubagentCall(args, true);
  if (!v.ok) { console.log('FAIL: nested static output'); process.exit(1); }
  if (args.tasks[0].output !== false) { console.log('FAIL: nested static output 0 not false'); process.exit(1); }
  if (args.tasks[1].output !== false) { console.log('FAIL: nested static output 1 not false'); process.exit(1); }
  if (!v.outputForced) { console.log('FAIL: nested static outputForced false'); process.exit(1); }
}

// Chain step recursive: each step's output forced false at every nesting level
{
  const args = { chain: [
    { agent: 'scout', task: 'a', output: 'ctx.md' },
    { parallel: [
      { agent: 'scout', task: 'b', output: 'ctx.md' },
      { agent: 'researcher', task: 'c' },
    ]},
  ]};
  const v = validateAndNormalizeSubagentCall(args, true);
  if (!v.ok) { console.log('FAIL: chain recursive output'); process.exit(1); }
  if (args.chain[0].output !== false) { console.log('FAIL: chain[0] output not false'); process.exit(1); }
  if (args.chain[1].parallel[0].output !== false) { console.log('FAIL: chain[1].parallel[0] output not false'); process.exit(1); }
  if (args.chain[1].parallel[1].output !== false) { console.log('FAIL: chain[1].parallel[1] output not false'); process.exit(1); }
}

// Worker preserves output even nested
{
  const args = { chain: [{ agent: 'worker', task: 'a', output: 'progress.md' }] };
  const v = validateAndNormalizeSubagentCall(args, true);
  if (!v.ok) { console.log('FAIL: worker nested'); process.exit(1); }
  if (args.chain[0].output !== 'progress.md') { console.log('FAIL: worker nested output should be preserved -> ' + JSON.stringify(args.chain[0].output)); process.exit(1); }
}
" || {
  echo 'FAIL: nested output:false' >&2
  exit 1
}
echo "OK:   nested output:false (static + dynamic + chain, worker preserved)"

# --- (6e) dynamic parallel with forbidden agent/model -------------------
node --input-type=module -e "
const url='$(printf '%s' "$ext" | sed "s|'|\\\\'|g")';
const { validateAndNormalizeSubagentCall } = await import(url);

// Dynamic parallel with model override
{
  const args = { chain: [{ parallel: { agent: 'scout', model: 'override/x' }, expand: { from: { output: 'p', path: '/i' } }, collect: { as: 'out' } }] };
  const v = validateAndNormalizeSubagentCall(args, true);
  if (v.ok) { console.log('FAIL: dynamic parallel model override'); process.exit(1); }
}

// Dynamic parallel with thinking override
{
  const args = { chain: [{ parallel: { agent: 'scout', thinking: 'high' }, expand: { from: { output: 'p', path: '/i' } }, collect: { as: 'out' } }] };
  const v = validateAndNormalizeSubagentCall(args, true);
  if (v.ok) { console.log('FAIL: dynamic parallel thinking override'); process.exit(1); }
}

// Dynamic parallel with non-allowed role
{
  const args = { chain: [{ parallel: { agent: 'oracle' }, expand: { from: { output: 'p', path: '/i' } }, collect: { as: 'out' } }] };
  const v = validateAndNormalizeSubagentCall(args, true);
  if (v.ok) { console.log('FAIL: dynamic parallel non-allowed role'); process.exit(1); }
}
" || {
  echo 'FAIL: dynamic parallel forbidden' >&2
  exit 1
}
echo "OK:   dynamic parallel forbidden agent/model/thinking"

# --- (6f) management in-place normalization (mutate=true) ---------------
node --input-type=module -e "
const url='$(printf '%s' "$ext" | sed "s|'|\\\\'|g")';
const { validateAndNormalizeSubagentCall } = await import(url);

// Read-only action with model/thinking -> original input must be mutated
{
  const args = { action: 'list', model: 'foo/bar', thinking: 'high' };
  const v = validateAndNormalizeSubagentCall(args, true);
  if (!v.ok) { console.log('FAIL: list validate'); process.exit(1); }
  if (args.model !== undefined) { console.log('FAIL: list mutate model not stripped -> ' + JSON.stringify(args.model)); process.exit(1); }
  if (args.thinking !== undefined) { console.log('FAIL: list mutate thinking not stripped -> ' + JSON.stringify(args.thinking)); process.exit(1); }
}

// Control action with model/thinking -> original input must be mutated
{
  const args = { action: 'stop', id: 'r1', model: 'foo/bar', thinking: 'high' };
  const v = validateAndNormalizeSubagentCall(args, true);
  if (!v.ok) { console.log('FAIL: stop validate'); process.exit(1); }
  if (args.model !== undefined || args.thinking !== undefined) { console.log('FAIL: stop mutate did not strip'); process.exit(1); }
}

// append-step with top-level model/thinking -> REJECTED (execution rule)
{
  const args = { action: 'append-step', id: 'r1', chain: [{ agent: 'worker', task: 'x' }], model: 'foo/bar', thinking: 'high' };
  const v = validateAndNormalizeSubagentCall(args, true);
  if (v.ok) { console.log('FAIL: append-step top-level model/thinking should be rejected'); process.exit(1); }
  if (!/model/.test(v.reason) || !/thinking/.test(v.reason)) { console.log('FAIL: append-step reject reason should mention model+thinking -> ' + v.reason); process.exit(1); }
}

// append-step exactly one chain step required
{
  const args = { action: 'append-step', id: 'r1', chain: [{ agent: 'worker', task: 'a' }, { agent: 'worker', task: 'b' }] };
  const v = validateAndNormalizeSubagentCall(args, true);
  if (v.ok) { console.log('FAIL: append-step should require exactly one chain step'); process.exit(1); }
  if (!/exactly one/.test(v.reason)) { console.log('FAIL: append-step reject reason should mention exactly one -> ' + v.reason); process.exit(1); }
}

// mutate=false leaves original untouched
{
  const args = { action: 'list', model: 'foo/bar', thinking: 'high' };
  const v = validateAndNormalizeSubagentCall(args, false);
  if (!v.ok) { console.log('FAIL: list validate no-mut'); process.exit(1); }
  if (args.model !== 'foo/bar' || args.thinking !== 'high') { console.log('FAIL: mutate=false should preserve original'); process.exit(1); }
}

// mutate=false: returned args.model/thinking stripped even though input untouched
{
  const args = { action: 'stop', id: 'r1', model: 'foo/bar', thinking: 'high' };
  const v = validateAndNormalizeSubagentCall(args, false);
  if (!v.ok) { console.log('FAIL: stop validate no-mut'); process.exit(1); }
  if (args.model !== 'foo/bar' || args.thinking !== 'high') { console.log('FAIL: mutate=false should preserve input'); process.exit(1); }
  if (v.args.model !== undefined || v.args.thinking !== undefined) { console.log('FAIL: mutate=false returned args.model/thinking should be stripped'); process.exit(1); }
}

// Execution call with model/thinking → top-level is REJECTED (settings own models)
{
  const args = { agent: 'worker', task: 'x', model: 'foo/bar', thinking: 'high' };
  const v = validateAndNormalizeSubagentCall(args, true);
  if (v.ok) { console.log('FAIL: worker w/ model override should be rejected'); process.exit(1); }
  if (!/model/.test(v.reason) || !/thinking/.test(v.reason)) { console.log('FAIL: reject reason should mention model+thinking -> ' + v.reason); process.exit(1); }
}
" || {
  echo 'FAIL: management in-place normalize' >&2
  exit 1
}
echo "OK:   management in-place normalization (mutate=true strips from original)"

# --- (7) readLatestFusionState -----------------------------------------
node --input-type=module -e "
const url='$(printf '%s' "$ext" | sed "s|'|\\\\'|g")';
const { readLatestFusionState, FUSION_STATE_CUSTOM } = await import(url);

// empty
if (readLatestFusionState([]) !== undefined) { console.log('FAIL: empty'); process.exit(1); }

// off then on -> on wins
const a = readLatestFusionState([
  { type: 'custom', customType: FUSION_STATE_CUSTOM, data: { enabled: false } },
  { type: 'custom', customType: FUSION_STATE_CUSTOM, data: { enabled: true } },
]);
if (!a || a.enabled !== true) { console.log('FAIL: latest wins'); process.exit(1); }

// non-entries skipped
const b = readLatestFusionState([
  { type: 'message' },
  { type: 'custom', customType: 'something-else', data: { enabled: true } },
  { type: 'custom', customType: FUSION_STATE_CUSTOM, data: { enabled: false, toolsBeforeFusion: ['read','grep'] } },
]);
if (!b || b.enabled !== false || !Array.isArray(b.toolsBeforeFusion)) { console.log('FAIL: filter'); process.exit(1); }

// malformed data ignored
const c = readLatestFusionState([
  { type: 'custom', customType: FUSION_STATE_CUSTOM, data: 'oops' },
  { type: 'custom', customType: FUSION_STATE_CUSTOM, data: { enabled: true } },
]);
if (!c || c.enabled !== true) { console.log('FAIL: malformed skip'); process.exit(1); }
" || {
  echo 'FAIL: readLatestFusionState' >&2
  exit 1
}
echo "OK:   readLatestFusionState (latest wins / filter / malformed skip)"

# --- (7a) corrupt toolsBeforeFusion is rejected WHOLESALE; no partial -
node --input-type=module -e "
const url='$(printf '%s' "$ext" | sed "s|'|\\\\'|g")';
const { readLatestFusionState } = await import(url);

// Any single empty-string / null / number / boolean → reject the WHOLE
// snapshot (toolsBeforeFusion = undefined), not filter a partial subset.
{
  const s = readLatestFusionState([
    { type: 'custom', customType: 'fusion-state', data: { enabled: true, toolsBeforeFusion: ['read', '', 'bash'] } },
  ]);
  if (!s || s.enabled !== true) { console.log('FAIL: corrupt empty-string'); process.exit(1); }
  if (s.toolsBeforeFusion !== undefined) { console.log('FAIL: empty-string in array should reject WHOLE -> got ' + JSON.stringify(s.toolsBeforeFusion)); process.exit(1); }
}
{
  const s = readLatestFusionState([
    { type: 'custom', customType: 'fusion-state', data: { enabled: true, toolsBeforeFusion: [null, 'read', 'bash'] } },
  ]);
  if (s.toolsBeforeFusion !== undefined) { console.log('FAIL: null in array should reject WHOLE'); process.exit(1); }
}
{
  const s = readLatestFusionState([
    { type: 'custom', customType: 'fusion-state', data: { enabled: true, toolsBeforeFusion: ['read', 5, 'bash'] } },
  ]);
  if (s.toolsBeforeFusion !== undefined) { console.log('FAIL: number in array should reject WHOLE'); process.exit(1); }
}
{
  const s = readLatestFusionState([
    { type: 'custom', customType: 'fusion-state', data: { enabled: true, toolsBeforeFusion: ['read', false, 'bash'] } },
  ]);
  if (s.toolsBeforeFusion !== undefined) { console.log('FAIL: boolean in array should reject WHOLE'); process.exit(1); }
}

// Empty array → no snapshot
{
  const s = readLatestFusionState([
    { type: 'custom', customType: 'fusion-state', data: { enabled: false, toolsBeforeFusion: [] } },
  ]);
  if (!s || s.enabled !== false) { console.log('FAIL: empty array case'); process.exit(1); }
  if (s.toolsBeforeFusion !== undefined) { console.log('FAIL: empty array should yield undefined snapshot'); process.exit(1); }
}

// Only non-strings → no snapshot
{
  const s = readLatestFusionState([
    { type: 'custom', customType: 'fusion-state', data: { enabled: true, toolsBeforeFusion: [null, 5, false] } },
  ]);
  if (!s || s.enabled !== true) { console.log('FAIL: only-non-strings'); process.exit(1); }
  if (s.toolsBeforeFusion !== undefined) { console.log('FAIL: only-non-strings should yield undefined snapshot'); process.exit(1); }
}

// Clean array → pass through verbatim
{
  const s = readLatestFusionState([
    { type: 'custom', customType: 'fusion-state', data: { enabled: true, toolsBeforeFusion: ['read','bash'] } },
  ]);
  if (!s || JSON.stringify(s.toolsBeforeFusion) !== JSON.stringify(['read','bash'])) { console.log('FAIL: clean array should pass through -> ' + JSON.stringify(s)); process.exit(1); }
}

// Missing field → no snapshot
{
  const s = readLatestFusionState([
    { type: 'custom', customType: 'fusion-state', data: { enabled: false } },
  ]);
  if (!s || s.enabled !== false) { console.log('FAIL: missing field'); process.exit(1); }
  if (s.toolsBeforeFusion !== undefined) { console.log('FAIL: missing field should yield undefined snapshot'); process.exit(1); }
}
" || {
  echo 'FAIL: corrupt snapshot handling' >&2
  exit 1
}
echo "OK:   corrupt snapshot wholesale rejection (no partial subset; clean pass-through)"

# --- (8) loadProjectBashOverride (untrusted skips, trusted exact grant) -
node --input-type=module -e "
const url='$(printf '%s' "$ext" | sed "s|'|\\\\'|g")';
const { loadProjectBashOverride } = await import(url);
const tmp = '$tmpdir';
const fs = await import('node:fs');
const path = await import('node:path');

// untrusted => ignore even if file present
fs.mkdirSync(path.join(tmp, '.pi'), { recursive: true });
fs.writeFileSync(path.join(tmp, '.pi', 'fusion.json'), JSON.stringify({ allowedCommands: ['ls'] }));
const a = loadProjectBashOverride(tmp, { trusted: false, readFile: (p) => fs.readFileSync(p, 'utf8') });
if (a.length !== 0) { console.log('FAIL: untrusted should not grant'); process.exit(1); }

// trusted + valid file
const b = loadProjectBashOverride(tmp, { trusted: true, readFile: (p) => fs.readFileSync(p, 'utf8') });
if (b.length !== 1 || b[0] !== 'ls') { console.log('FAIL: trusted should grant'); process.exit(1); }

// trusted + malformed => []
fs.writeFileSync(path.join(tmp, '.pi', 'fusion.json'), '{not json');
const c = loadProjectBashOverride(tmp, { trusted: true, readFile: (p) => fs.readFileSync(p, 'utf8') });
if (c.length !== 0) { console.log('FAIL: malformed should be []'); process.exit(1); }

// trusted + missing file => []
fs.unlinkSync(path.join(tmp, '.pi', 'fusion.json'));
const d = loadProjectBashOverride(tmp, { trusted: true, readFile: (p) => fs.readFileSync(p, 'utf8') });
if (d.length !== 0) { console.log('FAIL: missing should be []'); process.exit(1); }
" || {
  echo 'FAIL: loadProjectBashOverride' >&2
  exit 1
}
echo "OK:   loadProjectBashOverride (trusted / untrusted / malformed / missing)"

# --- (9) Bash trailing-tail discipline ---------------------------------
node --input-type=module -e "
const url='$(printf '%s' "$ext" | sed "s|'|\\\\'|g")';
const { isSafeBash } = await import(url);
// command injection via trailing arg in the right shape
const cases = [
  // allowed: short rev-ish suffix
  ['git log -n 5', true],
  ['git log --oneline', true],
  ['git log --pretty=oneline -n 5', true],
  ['git log origin/main', true],
  ['git log refs/heads/main', true],
  ['pytest tests/', true],
  ['python -m pytest tests/', true],
  // denied: trailing control chars or weird shell metas
  ['git log --pretty=oneline; rm x', false],
  ['git log -n 5 && rm x', false],
  ['git log origin/main', true],
];
for (const [cmd, want] of cases) {
  const v = isSafeBash(cmd);
  if (v.ok !== want) {
    console.log('FAIL: trailing-tail [' + cmd + '] expected=' + want + ' got=' + (v.ok ? 'ok' : v.reason));
    process.exit(1);
  }
}
" || {
  echo 'FAIL: trailing-tail discipline' >&2
  exit 1
}
echo "OK:   trailing-tail discipline"

# --- (10) Quote-escape and edge cases: secure-by-conservative ------------
# \' idiom inside an allowed verb MUST stay blocked (avoids parser-driven
# confusion). KEY=VALUE prefixes MUST stay blocked (no env-prefix bypass).
node --input-type=module -e "
const url='$(printf '%s' "$ext" | sed "s|'|\\\\'|g")';
const { isSafeBash } = await import(url);
const cases = [
  // Shell quote-escape idiom in a globally-allowed verb: blocked
  ['git log --grep=' + String.fromCharCode(39) + '\\\\' + String.fromCharCode(39) + 'pat', false],
  // Env prefix in an allowed verb: blocked
  ['KEY=value cargo test', false],
  ['FOO=BAR pytest', false],
  // Pure flag with no flag value: allowed
  ['prettier --check .', true],
  // Quoted args inside the verify: blocked (quotes contain shell metas once decoded)
  ['echo \"x && y\"', false],
];
for (const [cmd, want] of cases) {
  const v = isSafeBash(cmd);
  if (v.ok !== want) {
    console.log('FAIL: quote/env [' + cmd + '] expected=' + want + ' got=' + (v.ok ? 'ok' : v.reason));
    process.exit(1);
  }
}
" || {
  echo 'FAIL: quote/env edge cases' >&2
  exit 1
}
echo "OK:   quote-escape and env-prefix cases (conservative rejection)"

# --- (11) extension entry point: child no-op + before_agent_start ------
# Drives the extension's default export with a mocked ExtensionAPI and
# verifies that PI_SUBAGENT_CHILD=1 disables the extension, and that while
# active, before_agent_start re-applies the allowlist and injects the
# guidance message.
PI_SUBAGENT_CHILD=1 node --input-type=module -e "
const url='$(printf '%s' "$ext" | sed "s|'|\\\\'|g")';
const { default: fusion } = await import(url);
const calls = { on: [], flags: [], commands: [] };
const pi = {
  registerFlag: (n, o) => calls.flags.push({ n, o }),
  registerCommand: (n, o) => calls.commands.push({ n, o }),
  on: (n, fn) => calls.on.push({ n, fn }),
  appendEntry: () => undefined,
  getActiveTools: () => ['read','grep','bash','write'],
  setActiveTools: () => undefined,
  getFlag: () => false,
};
fusion(pi);
if (calls.on.length !== 0) { console.log('FAIL: child should register no handlers, got ' + calls.on.length); process.exit(1); }
if (calls.flags.length !== 0) { console.log('FAIL: child should register no flags'); process.exit(1); }
if (calls.commands.length !== 0) { console.log('FAIL: child should register no commands'); process.exit(1); }
" || {
  echo 'FAIL: child no-op' >&2
  exit 1
}
echo "OK:   child no-op (PI_SUBAGENT_CHILD=1 registers nothing)"

# --- (12) full lifecycle: persisted off > CLI on > global config; -----
# registerFlag uses the supplied default; subagent tool_call proven to
# nest-normalize event.input (deep copy when mutate=false).
# Use an isolated XDG_CONFIG_HOME + HOME so the test does NOT inherit the
# machine-level default-on config or any other user Fusion state.
isolated=$(mktemp -d)
env -u PI_SUBAGENT_CHILD XDG_CONFIG_HOME="$isolated/xdg" HOME="$isolated/home" TMPDIR="$isolated/tmp" mkdir -p "$isolated/xdg" "$isolated/home" "$isolated/tmp"
env -u PI_SUBAGENT_CHILD XDG_CONFIG_HOME="$isolated/xdg" HOME="$isolated/home" TMPDIR="$isolated/tmp" node --input-type=module -e "
const __cleanup = () => { try { require && require('node:fs').rmSync && require('node:fs').rmSync('$isolated', { recursive: true, force: true }); } catch {} };
process.on('exit', __cleanup);
const url='$(printf '%s' "$ext" | sed "s|'|\\\\'|g")';
const { default: fusion, FUSION_GUIDANCE_FULL, FUSION_STATE_CUSTOM } = await import(url);

const mkHarness = (initialTools) => {
  const handlers = {};
  const commands = {};
  const messages = [];
  let activeTools = [...initialTools];
  let flagFusion = false;
  let flagDefault;
  let cwd = '/tmp';
  const pi = {
    registerFlag: (n, opt) => { if (n === 'fusion') { flagFusion = false; flagDefault = opt && opt.default; } },
    registerCommand: (n, o) => { commands[n] = o; },
    on: (n, fn) => { handlers[n] = handlers[n] || []; handlers[n].push(fn); },
    appendEntry: (customType, data) => { messages.push({ customType, data }); },
    getActiveTools: () => activeTools,
    setActiveTools: (n) => { activeTools = n; },
    getFlag: (n) => n === 'fusion' ? flagFusion : false,
  };
  const ui = {
    notify: () => undefined,
    setStatus: () => undefined,
    theme: { fg: (c, t) => t },
    setWidget: () => undefined,
    select: async () => null,
    editor: async () => null,
  };
  const ctx = { cwd, hasUI: true, ui, sessionManager: null, isProjectTrusted: () => false };
  return { pi, ctx, handlers, commands, messages, getActive: () => activeTools, setCwd: (c) => { cwd = c; ctx.cwd = c; }, setFlag: (v) => { flagFusion = v; } };
};

const fire = (h, event, ctx) => h[0](event, ctx);
const fireAll = (h, event, ctx) => h.map(fn => fn(event, ctx));

// (a) Persisted fusion-state (off) wins over CLI --fusion = on: parent keeps
//     its normal tools (write/edit/grep), CLI flag is ignored.
{
  const h = mkHarness(['read','grep','bash','write','edit']);
  fusion(h.pi);
  h.setFlag(true);
  h.ctx.sessionManager = { getEntries: () => [
    { type: 'custom', customType: FUSION_STATE_CUSTOM, data: { enabled: false, toolsBeforeFusion: ['read','grep','bash','write','edit'] } },
  ]};
  await fire(h.handlers.session_start, {}, h.ctx);
  const tools = h.getActive();
  if (JSON.stringify(tools) !== JSON.stringify(['read','grep','bash','write','edit'])) {
    console.log('FAIL: (a) persisted OFF should win over CLI on and restore snapshot, got ' + JSON.stringify(tools)); process.exit(1);
  }
}

// (b) CLI --fusion = on wins over absent / off global default
{
  const h = mkHarness(['read','grep','bash','write','edit']);
  fusion(h.pi);
  h.setFlag(true);
  // No persisted entry; no global config (path doesn't exist).
  h.ctx.sessionManager = { getEntries: () => [] };
  await fire(h.handlers.session_start, {}, h.ctx);
  const tools = h.getActive();
  // CLI flag wins → ON → write/edit/grep gone
  if (tools.includes('write') || tools.includes('edit') || tools.includes('grep')) {
    console.log('FAIL: (b) CLI on should win over absent default, got ' + JSON.stringify(tools)); process.exit(1);
  }
}

// (c) Fallback OFF when no persisted state, no CLI flag, no global config
{
  const h = mkHarness(['read','grep','bash','write','edit']);
  fusion(h.pi);
  h.setFlag(false);
  h.ctx.sessionManager = { getEntries: () => [] };
  await fire(h.handlers.session_start, {}, h.ctx);
  const tools = h.getActive();
  if (JSON.stringify(tools) !== JSON.stringify(['read','grep','bash','write','edit'])) {
    console.log('FAIL: (c) fallback OFF should preserve tools verbatim, got ' + JSON.stringify(tools)); process.exit(1);
  }
}

// (d) on/off exact restore via persisted snapshot
{
  const h = mkHarness(['read','grep','bash','write','edit','lsp_diagnostics']);
  fusion(h.pi);
  h.ctx.sessionManager = { getEntries: () => [
    { type: 'custom', customType: FUSION_STATE_CUSTOM, data: { enabled: true, toolsBeforeFusion: ['read','grep','bash','write','edit','lsp_diagnostics'] } },
  ]};
  await fire(h.handlers.session_start, {}, h.ctx);
  // tools are now the allowlist (no write/edit/grep)
  await h.commands['fusion'].handler('off', h.ctx);
  const restored = h.getActive();
  if (JSON.stringify(restored) !== JSON.stringify(['read','grep','bash','write','edit','lsp_diagnostics'])) {
    console.log('FAIL: (d) off should restore exact snapshot, got ' + JSON.stringify(restored)); process.exit(1);
  }
}

// (e) before_agent_start re-applies allowlist + injects guidance
{
  const h = mkHarness(['read','bash','subagent','subagent_wait','subagent_supervisor','lsp_diagnostics','todo','advisor']);
  fusion(h.pi);
  h.ctx.sessionManager = { getEntries: () => [
    { type: 'custom', customType: FUSION_STATE_CUSTOM, data: { enabled: true, toolsBeforeFusion: ['read','bash','subagent','subagent_wait','subagent_supervisor','lsp_diagnostics','todo','advisor'] } },
  ]};
  await fire(h.handlers.session_start, {}, h.ctx);
  // Simulate a tool registered later leaking into active set
  h.getActive().push('write');
  const msg = await fire(h.handlers.before_agent_start, {}, h.ctx);
  if (!msg || !msg.message || !msg.message.content || !msg.message.content.startsWith(FUSION_GUIDANCE_FULL.split(String.fromCharCode(10))[0])) {
    console.log('FAIL: (e) before_agent_start should inject guidance'); process.exit(1);
  }
  const active = h.getActive();
  if (active.includes('write')) {
    console.log('FAIL: (e) before_agent_start re-apply should drop write, got ' + JSON.stringify(active)); process.exit(1);
  }
}

// (f) tool_call: bash dangerous-mode (npm install) blocks (use FIRST handler)
{
  const h = mkHarness(['read','bash','subagent']);
  fusion(h.pi);
  h.ctx.sessionManager = { getEntries: () => [
    { type: 'custom', customType: FUSION_STATE_CUSTOM, data: { enabled: true, toolsBeforeFusion: ['read','bash','subagent'] } },
  ]};
  await fire(h.handlers.session_start, {}, h.ctx);
  const bashHandler = h.handlers.tool_call[0];
  if (!bashHandler) { console.log('FAIL: (f) bash handler not registered'); process.exit(1); }
  const ok = await bashHandler({ toolName: 'bash', input: { command: 'git status' } }, h.ctx);
  if (ok && ok.block) { console.log('FAIL: (f) git status should be allowed'); process.exit(1); }
  const bad = await bashHandler({ toolName: 'bash', input: { command: 'npm install x' } }, h.ctx);
  if (!bad || !bad.block) { console.log('FAIL: (f) npm install should be blocked'); process.exit(1); }
}

// (g) tool_call: subagent handler (the THIRD tool_call registration;
//     first is bash, second is bg_start) nests-normalizes event.input in place. Mutate=true
//     coerces context=fresh and output=false for roles other than worker/planner.
{
  const h = mkHarness(['read','bash','subagent','subagent_wait','subagent_supervisor','lsp_diagnostics','todo','advisor']);
  fusion(h.pi);
  h.ctx.sessionManager = { getEntries: () => [
    { type: 'custom', customType: FUSION_STATE_CUSTOM, data: { enabled: true, toolsBeforeFusion: ['read','bash','subagent','subagent_wait','subagent_supervisor','lsp_diagnostics','todo','advisor'] } },
  ]};
  await fire(h.handlers.session_start, {}, h.ctx);
  const subagentHandler = h.handlers.tool_call[2];
  if (!subagentHandler) { console.log('FAIL: (g) subagent handler not registered'); process.exit(1); }
  // build nested input with NO model/thinking overrides (those would be
  // rejected by execution). Verify nested output coercion + context: fresh.
  const event = {
    toolName: 'subagent',
    input: {
      chain: [
        { agent: 'worker', task: 'a' },
        { agent: 'scout',  task: 'b', output: 'ctx.md' },
        { parallel: [
          { agent: 'scout', task: 'p' },
          { agent: 'researcher', task: 'q' },
        ]},
      ],
      tasks: [ { agent: 'reviewer', task: 'r' } ],
    },
  };
  const r = await subagentHandler(event, h.ctx);
  if (r && r.block) { console.log('FAIL: (g) subagent should pass, not block -> ' + JSON.stringify(r)); process.exit(1); }
  const inp = event.input;
  if (inp.context !== 'fresh') { console.log('FAIL: (g) context should be coerced to fresh -> got ' + JSON.stringify(inp.context)); process.exit(1); }
  // chain[1].scout output forced false (non-worker)
  if (inp.chain[1].output !== false) { console.log('FAIL: (g) chain[1] scout output should be false -> ' + JSON.stringify(inp.chain[1].output)); process.exit(1); }
  // chain[2].parallel[0] scout output forced false
  if (inp.chain[2].parallel[0].output !== false) { console.log('FAIL: (g) chain[2].parallel[0] scout output should be false'); process.exit(1); }
  // worker chain[0] preserved
  if (inp.chain[0].output !== undefined) { console.log('FAIL: (g) worker chain[0] output should remain unset -> ' + JSON.stringify(inp.chain[0].output)); process.exit(1); }
}

// (g2) subagent handler with nested model override must BLOCK (execution rule)
{
  const h = mkHarness(['read','bash','subagent']);
  fusion(h.pi);
  h.ctx.sessionManager = { getEntries: () => [
    { type: 'custom', customType: FUSION_STATE_CUSTOM, data: { enabled: true, toolsBeforeFusion: ['read','bash','subagent'] } },
  ]};
  await fire(h.handlers.session_start, {}, h.ctx);
  const subagentHandler = h.handlers.tool_call[2];
  if (!subagentHandler) { console.log('FAIL: (g2) subagent handler not registered'); process.exit(1); }
  const event = {
    toolName: 'subagent',
    input: {
      chain: [
        { agent: 'worker', task: 'a' },
        { parallel: [ { agent: 'scout', task: 'p', model: 'm2' } ] },
      ],
    },
  };
  const r = await subagentHandler(event, h.ctx);
  if (!r || !r.block) { console.log('FAIL: (g2) nested model override should block'); process.exit(1); }
}

// (g3) mutate=false: deep copy, no leak into caller's nested tasks/chain
{
  const { validateAndNormalizeSubagentCall } = await import(url);
  const inp = {
    agent: 'scout',
    task: 'a',
    context: 'fork',
    tasks: [ { agent: 'scout', task: 'x', output: 'keep.md' } ],
    chain: [ { agent: 'scout', task: 'y', output: 'chain.md' } ],
  };
  const r = validateAndNormalizeSubagentCall(inp, false);
  if (!r.ok) { console.log('FAIL: (g3) -> ' + r.reason); process.exit(1); }
  // Original nested still has output strings and 'fork' context
  if (inp.context !== 'fork') { console.log('FAIL: (g3) mutate=false should leave context untouched -> ' + inp.context); process.exit(1); }
  if (inp.tasks[0].output !== 'keep.md') { console.log('FAIL: (g3) mutate=false should leave tasks[0].output untouched'); process.exit(1); }
  if (inp.chain[0].output !== 'chain.md') { console.log('FAIL: (g3) mutate=false should leave chain[0].output untouched'); process.exit(1); }
  // Returned args are normalized (context:fresh, output:false)
  if (r.args.context !== 'fresh') { console.log('FAIL: (g3) returned args should be normalized'); process.exit(1); }
  if (r.args.tasks[0].output !== false) { console.log('FAIL: (g3) returned args.tasks[0].output should be false'); process.exit(1); }
}
" || {
  echo 'FAIL: lifecycle test' >&2
  exit 1
}
echo "OK:   lifecycle (persisted-off>CLI-on, CLI-on>global, fallback off, subagent handler nested normalize, mutate=false deep copy)"
rm -rf "$isolated"

# --- (13) FUSION_GUIDANCE_BODY decoupled from model labels -------------
# After the guidance-body refactor the role bullets no longer hardcode
# provider/model names; the body must reference settings.json as the
# source of truth and carry the five session-efficiency rule names
# verbatim, in order.
node --input-type=module -e "
const url='$(printf '%s' "$ext" | sed "s|'|\\\\'|g")';
const mod = await import(url);
const { FUSION_GUIDANCE_BODY, FUSION_GUIDANCE_HEADER } = mod;

if (typeof FUSION_GUIDANCE_BODY !== 'string' || FUSION_GUIDANCE_BODY.length === 0) {
  console.log('FAIL: FUSION_GUIDANCE_BODY missing or empty'); process.exit(1);
}
if (typeof FUSION_GUIDANCE_HEADER !== 'string' || !FUSION_GUIDANCE_HEADER.includes('FUSION MODE ACTIVE')) {
  console.log('FAIL: FUSION_GUIDANCE_HEADER missing the FUSION MODE ACTIVE banner'); process.exit(1);
}

// canonical pointer sentence must appear literally (greppable substring).
// Per the plan we positively assert the source-of-truth sentence rather
// than scan for specific provider/model IDs — those can legitimately appear
// in comments, examples, or rationale text without violating decoupling.
const bt = String.fromCharCode(96);
const pointer =
  'Role models and thinking levels are configured in ' + bt + 'settings.json' + bt + ' ' + bt + 'subagents.agentOverrides' + bt + '; this extension never hardcodes them.';
if (!FUSION_GUIDANCE_BODY.includes(pointer)) {
  console.log('FAIL: FUSION_GUIDANCE_BODY missing canonical pointer sentence'); process.exit(1);
}

// dedicated 'Session-efficiency rules' header for the five rules
if (!FUSION_GUIDANCE_BODY.includes('Session-efficiency rules')) {
  console.log('FAIL: FUSION_GUIDANCE_BODY missing Session-efficiency rules header'); process.exit(1);
}

// five session-efficiency rule names, in order, as standalone substrings
const rules = [
  'no duplicate parent discovery',
  'scout repo-only',
  'stop after first Bash-policy block or known role-config failure',
  'bounded child budgets',
  'return control for long async',
];
let lastIdx = -1;
for (const name of rules) {
  const idx = FUSION_GUIDANCE_BODY.indexOf(name);
  if (idx === -1) {
    console.log('FAIL: FUSION_GUIDANCE_BODY missing rule name ' + JSON.stringify(name)); process.exit(1);
  }
  if (idx <= lastIdx) {
    console.log('FAIL: rule name ' + JSON.stringify(name) + ' out of order'); process.exit(1);
  }
  lastIdx = idx;
}
" || {
  echo 'FAIL: guidance body decoupling' >&2
  exit 1
}
echo "OK:   guidance body decoupled (canonical pointer + header + five rule semantics present)"

rm -rf "$tmpdir"
echo
echo 'All fusion smoke tests passed.'
