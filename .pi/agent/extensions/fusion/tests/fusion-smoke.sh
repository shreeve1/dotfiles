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
#        overrides; coerces context→fresh and output→false for non-workers;
#        accepts valid worker call; blocks management mutations.
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
	"fusion-state" \
	; do
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
" || { echo 'FAIL: child env detection' >&2; exit 1; }
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
" || { echo 'FAIL: global config round-trip' >&2; exit 1; }
echo "OK:   global config (absent/malformed/valid/round-trip)"

# --- (4) parent tool allowlist ------------------------------------------
node --input-type=module -e "
const url='$(printf '%s' "$ext" | sed "s|'|\\\\'|g")';
const { PARENT_ALLOWED_TOOLS, parentToolAllowlist, applyParentAllowlist, isParentAllowedTool } = await import(url);

const expected = ['read','bash','lsp_diagnostics','subagent','subagent_wait','subagent_supervisor','todo','advisor'];
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
if (parentToolAllowlist(['read']).length !== 8) { console.log('FAIL: dedup'); process.exit(1); }

// applyParentAllowlist goes through getActiveTools / setActiveTools
const calls = { active: ['read','grep','write'], set: [] };
applyParentAllowlist({
  getActiveTools: () => calls.active,
  setActiveTools: (n) => { calls.set = n; },
});
if (calls.set.length !== 8 || calls.set.includes('grep')) { console.log('FAIL: apply'); process.exit(1); }
" || { echo 'FAIL: parent allowlist' >&2; exit 1; }
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
  'git commit -m x',
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
" || { echo 'FAIL: bash policy' >&2; exit 1; }
echo "OK:   bash policy (allowed / metachar / dangerous / project-override / deny-wins)"

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
  for (const action of ['create', 'update', 'delete', 'eject', 'disable', 'enable', 'reset', 'watchdog.configure']) {
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
for (const r of ['scout','researcher','worker','reviewer']) {
  if (!ALLOWED_EXECUTION_ROLES.has(r)) { console.log('FAIL: missing role ' + r); process.exit(1); }
}
for (const r of ['planner','oracle','context-builder','delegate']) {
  if (ALLOWED_EXECUTION_ROLES.has(r)) { console.log('FAIL: extra role ' + r); process.exit(1); }
}
" || { echo 'FAIL: subagent validation' >&2; exit 1; }
echo "OK:   subagent validation (roles/context/output/chain/parallel/actions)"

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
" || { echo 'FAIL: readLatestFusionState' >&2; exit 1; }
echo "OK:   readLatestFusionState (latest wins / filter / malformed skip)"

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
" || { echo 'FAIL: loadProjectBashOverride' >&2; exit 1; }
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
" || { echo 'FAIL: trailing-tail discipline' >&2; exit 1; }
echo "OK:   trailing-tail discipline"

rm -rf "$tmpdir"
echo
echo 'All fusion smoke tests passed.'
