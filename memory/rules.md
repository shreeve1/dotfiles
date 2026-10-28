# Rules

Read at session start. Load every Always row now. Before each task, load every row whose When fits.

- One lead per task. The Lead skill runs the workflow. Also load adds content and checks, never workflow steps.
- When two rows offer a lead, the more specific When wins; on a tie, the one matching what the owner literally asked.
- Rows point; they hold no guidance. Content lives in the files they name.
- New rule: add a row (personal-memory "Rules"). `gate.py audit` fails a row naming a missing skill or file, and a preference file no row reaches.

| When | Lead | Also load | Note |
|---|---|---|---|
| Always | | | |
| Shorthand name of a host, service, person or system | | `memory/glossary.md` | |
| A word that sounds like a defined term | | `CONTEXT.md` | |
| Writing a pi extension or script that reads pi sessions | | `memory/docs/pi-tool-call-blocks.md` | |
| WSL slowness, Vmmem CPU or a repo under /mnt/c | | `memory/docs/pi-footer-git-polling.md` | |
| Changing pi's default model or settings.json | | `memory/docs/pi-default-model-per-machine.md` | |
| Work touching the itastack workspace or its sync | | `memory/docs/itastack-workspace-sync.md` | |
| Editing or testing an OpenCode plugin | | `memory/docs/opencode-plugin-reload.md` | |
| Editing the personal-memory or memory-setup skill | | `memory/docs/starter-agent-skill-source.md` | |
| Dispatching a subagent or changing fabric child models | | `memory/docs/fabric-child-model-tiers.md` | |
| OpenCode/Codex servers or ssh between machines | | `memory/docs/remote-agent-servers.md` | |
| Starting, restarting or re-enabling a service on aidev or itan8n | | `memory/decisions/workstation/decision-retired-agent-services.md` | |
| Exposing a WSL server on wrk to NetBird, or Windows can't reach it | | `memory/docs/wrk-wsl-port-exposure.md` | |
| Suggesting a browser review, annotation or agent-inbox tool | | `memory/decisions/workstation/decision-no-plannotator.md` | |
| The owner starts defining a procedure ("let's define a procedure for …") | skill `personal-memory` | `memory/TEMPLATES.md`, `memory/workflows/index.md` | Steps: personal-memory reference.md "Procedures". |
| A task a saved procedure or workflow covers | | `memory/workflows/index.md` | Open the matching file and follow it. |
| Reviewing verify-final usage, its logs or its hit rate | | `memory/docs/verify-final-logs.md` | |
| Saving, pruning or checking memory | skill `personal-memory` | | |
