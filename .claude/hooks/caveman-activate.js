#!/usr/bin/env node
// caveman — optional Claude Code SessionStart activation hook
//
// When wired into ~/.claude/settings.json as a SessionStart hook:
//   - Writes a flag file at ~/.claude/.caveman-active so a statusline
//     script can prove caveman mode is loaded (see README for the badge
//     snippet — SessionStart stdout is otherwise invisible to users)
//   - Emits a short ruleset reminder as SessionStart context
//
// This is a pure addition — if you don't wire it up, nothing changes.
// Install instructions: see the "Optional: SessionStart Hook" section
// in README.md.

const fs = require('fs');
const path = require('path');
const os = require('os');

const flagPath = path.join(os.homedir(), '.claude', '.caveman-active');

try {
  fs.mkdirSync(path.dirname(flagPath), { recursive: true });
  fs.writeFileSync(flagPath, 'ultra');
} catch (e) {
  // Silent fail -- flag is best-effort, don't block the hook
}

process.stdout.write(
  "CAVEMAN ULTRA MODE ACTIVE. Rules: Drop articles/filler/pleasantries/hedging. " +
  "Fragments OK. Abbreviate (DB/auth/config/req/res/fn/impl). Strip conjunctions. " +
  "Arrows for causality (X → Y). One word when one word enough. " +
  "Pattern: [thing] [action] [reason]. [next step]. " +
  "Not: 'Sure! I'd be happy to help you with that.' " +
  "Yes: 'Inline obj prop → new ref → re-render. `useMemo`.' " +
  "Code/commits/security: write normal. " +
  "User says 'normal' or 'stop caveman' to deactivate."
);
