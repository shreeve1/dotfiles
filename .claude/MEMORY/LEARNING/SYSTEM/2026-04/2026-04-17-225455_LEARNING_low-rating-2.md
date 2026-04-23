---
capture_type: LEARNING
timestamp: 2026-04-17 22:54:55 PST
rating: 2
source: explicit
auto_captured: true
tags: [low-rating, improvement-opportunity]
---

# Low Rating Captured: 2/10

**Date:** 2026-04-17
**Rating:** 2/10
**Detection Method:** Explicit Rating


---

## Context

════ PAI | NATIVE MODE ═══════════════════════
🗒️ TASK: Change APPROVED_DIRECTORY to home directory

Before I make that change — the plan explicitly called this out as a **Do NOT**:

> "Do NOT set to `~/1-testytech` or `~/` — this would expose secrets in `~/.claude/secrets/` and webhook auth tokens. The bot's `Write`/`Bash` tools can operate on anything within APPROVED_DIRECTORY."

Your home directory contains `~/.claude/secrets/telegram-env.sh` (bot token), `~/.claude/secrets/` (any other secrets), and all PAI config. With `APPROVED_DIRECTORY=/Users/james`, the bot's Bash and Write tools could read or modify those files during a conversation.

The risk is low since only your Telegram account is on the allowlist, but it's a real attack surface if your account is ever compromised or if Claude makes a mistake.

**A safer middle ground**: set it to `/Users/james/1-testytech` — gives you access to all your projects (homelab, claude-code-telegram, etc.) without exposing `~/.claude/`.

Want to:
1. Set to `/Users/james/1-testytech` (safer — covers all your projects)
2. Set to `/Users/james` (full home, your call — you're aware of the tradeoff)
3. Keep homelab only but add project switching via Project Threads

---

## Improvement Notes

This response was rated 2/10 by James Schriever. Use this as an improvement opportunity.

---
