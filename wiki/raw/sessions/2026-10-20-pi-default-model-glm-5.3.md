# Session Capture: pi default model set to cliproxy/glm-5.3 across the fleet

- Date: 2026-10-20
- Purpose: Record the fleet-wide change of pi's default model to `cliproxy/glm-5.3` and the per-machine propagation rule it exposed.
- Scope: The default-model setting only. Other model pins (ralph `RALPH_MODEL`, verify-final `VERIFY_FINAL_MODEL`, herdr worker/reviewer defaults, `.pi/agent/fabric.json` role aliases) were left untouched.

## Durable Facts

- pi's default model is `defaultModel` in each machine's `.pi/agent/settings.json` (`defaultProvider` stays `cliproxy`); as of 2026-10-20 it is `glm-5.3` on omarchy, aidev and itan8n. — Evidence: `jq -e .defaultModel .pi/agent/settings.json` on each machine; live boot probe `pi --no-session -p 'Reply with exactly: GLM_OK'` returned `GLM_OK` on all three (on aidev the binary is `$HOME/.npm-global/bin/pi`, not on a non-interactive ssh PATH).
- `.pi/agent/settings.json` is gitignored (root `.gitignore:44`), so a default-model change does NOT travel by git: each machine's live file must be edited directly. Only the tracked `.pi/agent/settings.json.template` ships, and `install.sh` does not seed it automatically — a fresh machine copies it by hand. — Evidence: `git check-ignore -v .pi/agent/settings.json`, `install.sh` fresh-machine steps 1-3.
- `cliproxy/glm-5.3` is a real cliproxy model in pi's catalog (1M context, thinking yes, images no) and is already listed in `enabledModels`. — Evidence: `pi --list-models`; live `pi -p --model cliproxy/glm-5.3` returned `GLM_OK`.
- The template and the live file must agree: the template is the copy source for a new machine, and the live file is what pi actually reads. — Evidence: commit `e33d1f7f` (template only) plus direct per-machine edits.

## Decisions

- Set the default to `cliproxy/glm-5.3` on all three machines and updated the tracked template to match, so a new machine starts on the same default. — Evidence: user request 2026-10-20; commit `e33d1f7f`.
- Left every other model pin alone: the default model is pi's session default, not the ralph worker, the verify-final checker, the herdr worker/reviewer defaults, or the fabric role aliases. — Evidence: `.zshrc`, `.agents/bin/verify-final`, `docs/herdr.md`, `.pi/agent/fabric.json` (unchanged in this session).

## Evidence

- `.pi/agent/settings.json`, `.pi/agent/settings.json.template` — the default-model setting and its copy source.
- commit `e33d1f7f` — template change, pushed to origin/main and pulled on aidev and itan8n.
- `jq -e .defaultModel` on omarchy/aidev/itan8n — `"glm-5.3"` on all three.
- `pi --no-session -p 'Reply with exactly: GLM_OK'` on all three — default model resolves and answers.
- `.gitignore:44` — `.pi/agent/settings.json` is untracked by design.

## Exclusions

- No credentials, keys, or `auth.json`/`models.json` content captured.
- No transcript captured; only the commands and their results above.
- Per-machine working-tree noise present in other sessions' files was not touched.

## Open Questions And Follow-Ups

- `cliproxy/glm-5.3` reports `images=no`: any workflow that feeds images to the default model on the cliproxy path will fail and must pin an image-capable model (`cliproxy/glm-5.3-flash`, `cliproxy/minimax-m3.1-flash`) explicitly.
- Open decision for James: whether the ralph loop, the verify-final checker, and the herdr worker/reviewer defaults should also move to `cliproxy/glm-5.3`.
- A running pi session keeps its already-selected model until `/reload` or a new session; machines only pick up the new default for new sessions.
