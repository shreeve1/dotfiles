#!/usr/bin/env node
// caveman — UserPromptSubmit hook to track which caveman mode is active
// Inspects user input for /caveman commands and writes mode to flag file

const fs = require('fs');
const path = require('path');
const os = require('os');

const flagPath = path.join(os.homedir(), '.claude', '.caveman-active');

let input = '';
process.stdin.on('data', chunk => { input += chunk; });
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const prompt = (data.prompt || '').trim().toLowerCase();

    // Match /caveman commands
    if (prompt.startsWith('/caveman')) {
      const parts = prompt.split(/\s+/);
      const cmd = parts[0]; // /caveman, /caveman-commit, /caveman-review, etc.
      const arg = parts[1] || '';

      let mode = null;

      if (cmd === '/caveman-commit') {
        mode = 'commit';
      } else if (cmd === '/caveman-review') {
        mode = 'review';
      } else if (cmd === '/caveman-compress' || cmd === '/caveman:caveman-compress') {
        mode = 'compress';
      } else if (cmd === '/caveman' || cmd === '/caveman:caveman') {
        if (arg === 'lite') mode = 'lite';
        else if (arg === 'ultra') mode = 'ultra';
        else if (arg === 'wenyan-lite') mode = 'wenyan-lite';
        else if (arg === 'wenyan' || arg === 'wenyan-full') mode = 'wenyan';
        else if (arg === 'wenyan-ultra') mode = 'wenyan-ultra';
        else mode = 'full';
      }

      if (mode) {
        fs.mkdirSync(path.dirname(flagPath), { recursive: true });
        fs.writeFileSync(flagPath, mode);
      }
    }

    // Detect deactivation
    if (/\b(stop caveman|normal mode)\b/i.test(prompt)) {
      try { fs.unlinkSync(flagPath); } catch (e) {}
    }

    // Reinforce caveman mode on every message if flag file exists
    try {
      const currentMode = fs.readFileSync(flagPath, 'utf8').trim();
      if (currentMode === 'ultra') {
        process.stdout.write(
          "CAVEMAN ULTRA MODE ON. Drop articles/filler/pleasantries. " +
          "Abbreviate (DB/auth/config/req/res/fn/impl). Arrows for causality. " +
          "Fragments OK. One word when one word enough. " +
          "WRONG: 'Sure! I'd be happy to help you with that.' " +
          "RIGHT: 'Bug in auth middleware. Fix:'"
        );
      } else if (currentMode) {
        process.stdout.write("CAVEMAN " + currentMode.toUpperCase() + " MODE ON.");
      }
    } catch (e) {
      // No flag file = caveman not active, no output
    }
  } catch (e) {
    // Silent fail
  }
});
