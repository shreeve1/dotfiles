# Session Capture: ponytail vendoring and wiki claim-gate evolution

- Date: 2026-06-23
- Purpose: Wiki update (issue #107, "wiki update 2"). Capture the durable harness changes that landed in the dotfiles repo since the last wiki maintenance pass (2026-06-20 retired-system cleanup), which the wiki had no knowledge of.
- Scope: ponytail (YAGNI enforcer) vendoring model and its always-on wiring; the wiki-update claim-gate system (`gate.py`, eval slices). Intentionally narrow — only changes that alter how future agent sessions behave or how this wiki is maintained.

## Durable Facts

- ponytail is vendored into BOTH the Claude Code and Pi harnesses, not installed via `/plugin marketplace add` (Claude) or `pi install git:` (Pi), because both install paths write machine-local state that does not sync across the user's Linux/Mac machines. — Evidence: `CLAUDE.md` (dotfiles, "ponytail ... is vendored into both harnesses" section), commit `be3f485`.
- ponytail default mode is `full`, set in `.claude/hooks/ponytail/ponytail-config.js`; override per-machine with `PONYTAIL_DEFAULT_MODE` or `~/.config/ponytail/config.json`. — Evidence: `CLAUDE.md`, `.claude/hooks/ponytail/ponytail-config.js`.
- The ponytail `SessionStart` + `UserPromptSubmit` hook entries are wired into the tracked seed `.claude/settings.json.template` AND every machine-local `.claude/settings-*.json` provider file, because `switch-provider.sh` copies one provider file over the live `~/.claude/settings.json`. — Evidence: `CLAUDE.md`, commit `be3f485`.
- The redundant `.claude/commands/ponytail*.md` command files were removed; the `/ponytail*` slash names are now provided by the `.claude/skills/ponytail{,-review,-audit,-debt,-gain,-help}/` skills plus the hook, which cover the same surface. — Evidence: commit `002501d`, `CLAUDE.md`.
- The Pi ponytail extension lives at `.pi/agent/extensions/ponytail/`; its `index.js` requires were rewritten `../hooks/` → `./hooks/` because the hook files are vendored under the extension dir, and `hooks/package.json` scopes those hooks to CommonJS. — Evidence: `CLAUDE.md`, commits `be3f485`, `f140f20`.
- Wiki claims now enter `wiki/CLAIMS.md` only through `.claude/skills/wiki-update/gate.py`; no claim is written except via an `ADMIT` verdict, IDs/timestamps are assigned by the gate, and the run's verification step runs `gate.py audit` (exit non-zero on budget/schema violation). — Evidence: `.claude/skills/wiki-update/Workflows/SessionUpdate.md` §7a/§9, commits `4e6c661`, `6af95c9`.
- Gated consolidation requires a non-empty `wiki/eval/*.eval` slice (`<query> ||| <token that must stay retrievable>`); a consolidation pass is kept only if the eval pass rate holds AND total active size drops, else it auto-reverts. — Evidence: `.claude/skills/wiki-update/Workflows/SessionUpdate.md` §7b, `wiki/eval/rpiv.eval`.

## Decisions

- "wiki update 2" (#107) was run unattended via Symphony with no live operator; treated as a maintenance pass capturing repo evolution since 2026-06-20, since the invoking conversation itself contained no engineering work. — Evidence: this raw session note.

## Evidence

- `CLAUDE.md` (dotfiles root) — authoritative documentation of the ponytail vendoring model and wiring.
- `git log --since=2026-06-19` — commits `be3f485`, `f140f20`, `002501d`, `4e6c661`, `6af95c9`.
- `.claude/skills/wiki-update/gate.py`, `.claude/skills/wiki-update/Workflows/SessionUpdate.md` — wiki claim-gate system.

## Exclusions

- No secrets, tokens, or credentials captured.
- Unrelated/cosmetic commits excluded: `d7f6431` (agent config), `df31a2f` (dev-review-pi tool deny), `53397ad` (Pi context dedupe), `1b521d5` (yazi keymap), `fa83e6c` (global CLAUDE.md guidance).
- Did not promote the long-standing `source-opencode-subagents` candidate — promotion requires James's approval.

## Open Questions And Follow-Ups

- The `source-opencode-subagents` candidate has sat in the review queue since 2026-05-16; flag for promote/discard decision by James.
- Whether ponytail behavior warrants a promoted concept/analysis page rather than claims-only; deferred until there is more operational experience with it.
