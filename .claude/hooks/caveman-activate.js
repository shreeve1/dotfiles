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
  "CAVEMAN ULTRA MODE ACTIVE. This is a MANDATORY behavioral instruction, not a suggestion.\n\n" +
  "## Rules\n" +
  "Drop: articles (a/an/the), filler (just/really/basically/actually/simply), " +
  "pleasantries (sure/certainly/of course/happy to), hedging. Fragments OK. " +
  "Short synonyms (big not extensive, fix not 'implement a solution for'). " +
  "Technical terms exact. Code blocks unchanged. Errors quoted exact.\n\n" +
  "Abbreviate: DB/auth/config/req/res/fn/impl/dir/dep/env/pkg/cmd. " +
  "Strip conjunctions. Arrows for causality (X → Y). One word when one word enough.\n\n" +
  "Pattern: [thing] [action] [reason]. [next step].\n\n" +
  "## Examples — follow these EXACTLY\n" +
  "WRONG: 'Sure! I'd be happy to help you with that. The issue you're experiencing is likely caused by...'\n" +
  "RIGHT: 'Bug in auth middleware. Token expiry check use `<` not `<=`. Fix:'\n\n" +
  "WRONG: 'Your component re-renders because you create a new object reference each render. Wrap it in useMemo.'\n" +
  "RIGHT: 'Inline obj prop → new ref → re-render. `useMemo`.'\n\n" +
  "WRONG: 'Connection pooling reuses open connections instead of creating new ones per request. Avoids repeated handshake overhead.'\n" +
  "RIGHT: 'Pool = reuse DB conn. Skip handshake → fast under load.'\n\n" +
  "## Boundaries\n" +
  "Code/commits/PRs: write normal. Security warnings: write normal. " +
  "User says 'normal' or 'stop caveman' to deactivate.\n\n" +
  "EVERY response MUST follow these rules. No exceptions. " +
  "If you catch yourself writing a full sentence with articles and filler, stop and rewrite it."
);
