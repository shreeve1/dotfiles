---
title: dsh Permanent Browser Login
summary: Private permanent login bookmark on wsl; local dsh auth patch must be reapplied after upgrades.
type: doc
status: promoted
created: 2026-11-04
updated: 2026-11-04
topics: [workstation]
---

## Active memory

- James approved a permanent random browser login token on 2026-11-04 so one private bookmark works in new browsers and across restarts. Keep authentication enabled.
- wsl secret: `~/.dsh/superagent-login-token`; complete HTTPS bookmark: `~/.dsh/superagent-login-url`. Both are owner-only (`0600`), outside git. Read the URL file when James needs the bookmark; never copy either credential into memory or tracked files.
- dsh 0.2.1-rc.3 has no fixed-token setting. `lib/dsh-fixed-token.mjs` patches the installed `@deepseek-ai/dsh-client-connection/lib/index.js` token factory only. Normal cookie signing, timing-safe token comparisons, Host/Origin checks and the Caddy authentication gate remain unchanged. The patch rejects missing, invalid, symlinked or non-private token files at startup.
- Reapply after a dsh reinstall/upgrade: `node ~/dotfiles/lib/dsh-fixed-token.mjs ~/.npm-global/lib/node_modules/@deepseek-ai/dsh/node_modules/@deepseek-ai/dsh-client-connection/lib/index.js ~/.dsh/superagent-login-token`. It reuses the secret, is idempotent, and refuses unrecognized upstream code. Restart using `~/src/dsh-superagent/scripts/dsh-superagent restart`. Unmodified rollback copy: `~/.dsh/dsh-client-connection-before-fixed-token.js` (0.2.1-rc.3 only).
- This patches the shared dsh installation: currently one active listener. Do not start another listener assuming it has a different credential; separate it first if needed.
- Startup logs now contain a permanent credential, not an expiring process token. Keep them private. To rotate the bookmark, replace the token with a new 32-byte random base64url value, rewrite the URL file and restart. Rotation does not revoke existing browser cookies.
- Upstream browser cookies already survive restarts for 30 days by default, signed using the persistent credential store. A new browser still needs the bookmark.
- Verified: the same saved link authenticated over HTTPS before and after restart; missing, incorrect and duplicate tokens were rejected; authenticated page/API worked and the unauthenticated orchestrator route stayed blocked. Regression tests: `bash tests/dsh-fixed-token.test.sh`.

## Related

- [dsh test installation](memory/docs/workstation/dsh-superagent-test.md)
