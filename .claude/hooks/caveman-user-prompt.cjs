#!/usr/bin/env node
// caveman — Claude Code UserPromptSubmit hook
//
// Reads the user's prompt from stdin (Claude Code event JSON). If the prompt
// activates or deactivates caveman mode (slash command or natural language),
// updates the shared flag (~/.claude/.caveman-active). When caveman is active,
// emits a one-line reinforcement as additionalContext so the model doesn't
// drift mid-session.

const os = require('os');
const path = require('path');
const fs = require('fs');
const { getDefaultMode, safeWriteFlag, readFlag, VALID_MODES } = require(path.join(__dirname, 'caveman-config.cjs'));

const flagPath = path.join(os.homedir(), '.claude', '.caveman-active');

// Modes handled by independent skills — not selectable via /caveman <arg>.
const INDEPENDENT_MODES = new Set(['commit', 'review', 'compress']);

function reinforcementLine(mode) {
  return 'CAVEMAN MODE ACTIVE (' + mode + '). ' +
    'Drop articles/filler/pleasantries/hedging. Fragments OK. ' +
    'Code/commits/security: write normal.';
}

function parseModeChange(promptRaw) {
  const prompt = (promptRaw || '').trim().toLowerCase();
  if (!prompt) return null;

  if (/\b(stop|disable|deactivate|turn off)\b.*\bcaveman\b/i.test(prompt) ||
      /\bcaveman\b.*\b(stop|disable|deactivate|turn off)\b/i.test(prompt) ||
      /\bnormal mode\b/i.test(prompt)) {
    return 'off';
  }

  if (/\b(activate|enable|turn on|start|talk like)\b.*\bcaveman\b/i.test(prompt) ||
      /\bcaveman\b.*\b(mode|activate|enable|turn on|start)\b/i.test(prompt)) {
    const mode = getDefaultMode();
    return mode === 'off' ? null : mode;
  }

  if (prompt.startsWith('/caveman')) {
    const parts = prompt.split(/\s+/);
    const cmd = parts[0];
    const arg = parts[1] || '';

    if (cmd === '/caveman-commit')   return 'commit';
    if (cmd === '/caveman-review')   return 'review';
    if (cmd === '/caveman-compress') return 'compress';

    if (cmd === '/caveman') {
      if (!arg)                                     return getDefaultMode();
      if (arg === 'off' || arg === 'stop' || arg === 'disable') return 'off';
      if (arg === 'wenyan-full')                    return 'wenyan';
      if (VALID_MODES.includes(arg) && !INDEPENDENT_MODES.has(arg)) return arg;
      return null;
    }
  }
  return null;
}

function applyModeChange(mode) {
  if (!mode) return;
  if (mode === 'off') {
    try { if (fs.existsSync(flagPath)) fs.unlinkSync(flagPath); } catch (_) {}
    return;
  }
  safeWriteFlag(flagPath, mode);
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { raw += chunk; });
process.stdin.on('end', () => {
  let promptText = '';
  try {
    const event = JSON.parse(raw || '{}');
    promptText = event.prompt || '';
  } catch (_) {}

  try {
    const change = parseModeChange(promptText);
    if (change) applyModeChange(change);

    const active = readFlag(flagPath);
    if (active && !INDEPENDENT_MODES.has(active)) {
      const out = {
        hookSpecificOutput: {
          hookEventName: 'UserPromptSubmit',
          additionalContext: reinforcementLine(active)
        }
      };
      process.stdout.write(JSON.stringify(out));
    }
  } catch (_) {
    // silent — hook is best-effort
  }
  process.exit(0);
});
