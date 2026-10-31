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
| Writing a pi extension or script that reads pi sessions | | `memory/docs/knowledge/pi-tool-call-blocks.md` | |
| herdr disconnects between Windows and WSL | | `memory/docs/workstation/herdr-wsl-direct-attach.md` | |
| WSL slowness, Vmmem CPU or a repo under /mnt/c | | `memory/docs/workstation/pi-footer-git-polling.md` | |
| Changing Pi Fabric mesh or peer notices | | `memory/docs/workstation/pi-fabric-mesh-preference.md` | |
| Changing pi's default model or settings.json | | `memory/docs/workstation/pi-default-model-per-machine.md` | |
| Changing pi's compaction reserve tokens or per-model compaction overrides | | `memory/docs/workstation/pi-compaction-model-overrides.md` | |
| Installing/updating Codex CLI or changing its CLIProxy provider | | `memory/docs/workstation/codex-cliproxy-fleet.md` | |
| Claude Code provider settings, model menu, or CLIProxy Haiku availability | | `memory/docs/workstation/claude-code-cliproxy-fleet.md` | |
| Adding a cliproxy model to pi, or a model missing from pi's list | | `memory/docs/workstation/pi-cliproxy-model-fleet.md` | |
| Work touching the itastack workspace or its sync | | `memory/docs/projects/itastack-workspace-sync.md` | |
| Editing or testing an OpenCode plugin | | `memory/docs/knowledge/opencode-plugin-reload.md` | |
| Editing the personal-memory or memory-setup skill | | `memory/docs/knowledge/starter-agent-skill-source.md` | |
| Dispatching a subagent or changing fabric child models | | `memory/docs/knowledge/fabric-child-model-tiers.md` | |
| OpenCode/Codex servers or ssh between machines | | `memory/docs/workstation/remote-agent-servers.md` | |
| Starting, restarting or re-enabling a service on aidev or itan8n | | `memory/decisions/workstation/decision-retired-agent-services.md` | |
| Exposing a WSL server on wrk to NetBird, or Windows can't reach it | | `memory/docs/workstation/wrk-wsl-port-exposure.md` | |
| Suggesting a browser review, annotation or agent-inbox tool | | `memory/decisions/workstation/decision-no-plannotator.md` | |
| The owner starts defining a procedure ("let's define a procedure for …") | skill `personal-memory` | `memory/TEMPLATES.md`, `memory/workflows/index.md` | Steps: personal-memory reference.md "Procedures". |
| A task a saved procedure or workflow covers | | `memory/workflows/index.md` | Open the matching file and follow it. |
| Reviewing verify-final usage, its logs or its hit rate | | `memory/docs/knowledge/verify-final-logs.md` | |
| Finding where an OpenRouter key lives or which app uses it | | `memory/docs/workstation/openrouter-key-inventory.md` |
| Standardizing LLM use through CLIProxy, or deciding which credential copies to delete | | `memory/docs/workstation/llm-credential-cleanup.md` | | |
| Scanning git history or a public repo for leaked credentials | | `memory/docs/projects/public-repo-secret-exposure.md` | |
| Saving, pruning or checking memory | skill `personal-memory` | | |
