#!/usr/bin/env node
// caveman — Claude Code SessionStart hook
//
// Writes the shared activation flag (~/.claude/.caveman-active) based on the
// resolved default mode. Symmetric with the OpenCode plugin's session.created
// handler so both tools share one state file. Silent: never prints to stdout
// — Claude Code injects stdout into context, and we don't want that here.

const os = require('os');
const path = require('path');
const fs = require('fs');
const { getDefaultMode, safeWriteFlag } = require(path.join(__dirname, 'caveman-config.cjs'));

const flagPath = path.join(os.homedir(), '.claude', '.caveman-active');

try {
  const mode = getDefaultMode();
  if (mode === 'off') {
    try { if (fs.existsSync(flagPath)) fs.unlinkSync(flagPath); } catch (_) {}
  } else {
    safeWriteFlag(flagPath, mode);
  }
} catch (_) {
  // silent — hook is best-effort
}

process.exit(0);
