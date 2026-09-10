---
name: dsh-session
description: Show the current dsh session's identity (session id, transcript path, workspace, dsh home, web URL) from the DSH_* environment variables.
disable-model-invocation: true
license: MIT
---

# dsh Session

Read the session's identity from the `DSH_*` environment variables and print it in chat.

Run:

```bash
env | grep -i '^DSH_' | sort
```

Then output a Markdown table with these rows, derived from the variables:

- **Session ID** — `DSH_SESSION_ID`
- **Transcript** — `DSH_SESSION_JSONL`
- **Workspace** — the project slug decoded from the `DSH_SESSION_JSONL` path (e.g. `--home-james-dotfiles--` → `/home/james/dotfiles`)
- **DSH home** — `DSH_HOME`
- **Web UI** — `DSH_WEB_URL`

Omit any row whose variable is unset. Nothing else — no commentary.
