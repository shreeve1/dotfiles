---
status: accepted
---
# One style contract: repo config files decide, every caller runs the same tools

Four things format or lint the same files: pi-lens on every agent edit, the `post-work-cleanup` skill, `tests/run-all.sh` through the global pre-push hook, and whatever a human runs. Each chose its own tools and flags, so they disagreed. The push hook ran the system `shfmt` (3.8.0 on aidev and itan8n, 3.13.1 on omarchy) while pi-lens ran a different copy, so a file passed on one machine and failed on another. The skill ran `biome` without `--use-editorconfig` (tabs, against pi-lens's spaces), `prettier` on Markdown and JSON that nothing else formats, and markdownlint's line-length rule. pi-lens printed STOP on untouched lines for a `json.loads`-without-try/except rule that fires on idiomatic test code.

The contract: **a tool runs only from the repo's own config file, and every caller runs the same pinned binary from that config.** This matches pi-lens's own gate, which formats a surface only when the repo declares it (`.editorconfig` for shell, `ruff.toml` for Python, a `biome.json` plus a lockfile for TS/JS). So the repo files, not any one tool, are the source of truth.

- **Shared layer (dotfiles, all three machines):** `.config/style/tools.env` pins shfmt, shellcheck, ruff, biome and markdownlint-cli2; `bin/style-tools-install` (run by `install.sh`) puts them in `~/.local/bin`, which is ahead of `/usr/bin` on every PATH, because pi-lens's formatter resolves by PATH. `bin/style-check` is the one command callers run. Rules that apply everywhere go in the global `~/.pi-lens/config.json`.
- **Per-repo layer (opt-in):** `.config/style/template/` holds the standard files. `bin/style-init` copies only the missing ones into a repo listed in `.config/style/owned-repos` (GitHub owners `shreeve1` and `itanoc`, plus a few by path), then makes one baseline reformat commit per language, recorded in `.git-blame-ignore-revs`. It refuses a dirty tree or a branch behind its upstream. `post-work-cleanup` offers it the first time it runs in an owned repo that lacks the files.
- **Lint is bug-finding only:** ruff `E,F,I,B` at `py312` (aidev and itan8n run 3.12), biome's correctness and suspicious groups, pi-lens's own markdownlint rules (no line-length limit). The push hook gates on formatting only; lint findings are reported, not blocking.

## Considered options

- **A single config in `$HOME`.** pi-lens stops looking for `.editorconfig` and biome evidence at the repo boundary, so it would not switch formatting on; ruff does walk up to `$HOME`, so a `~/ruff.toml` would reformat other people's projects (hermes-agent-link, honcho, langfuse) under rules they did not choose.
- **pi-lens's bundled defaults as the truth, copied into the skill and hook.** Breaks silently whenever a pi-lens release changes them, and pi-lens is vendored, so the copy would drift on every re-sync.
- **The skill's table as the truth, with pi-lens features disabled to match.** Fights the tool that runs on every edit, and needs overrides kept up in a vendored extension.
- **Format on touch, no baseline.** A one-line edit arrives with a whole-file reformat, and the push check could only ever cover files changed on the branch.

## Consequences

- Bumping a tool is a one-line edit to `tools.env` followed by `install.sh` on aidev, omarchy and itan8n. `style-check --doctor` and the push hook report a machine whose tools are not at the pins.
- A non-interactive login does not always put `~/.local/bin` first: `ssh omarchy cmd` gets `/usr/bin` first, ahead of pacman's biome and markdownlint-cli2 at other versions, and `ssh aidev cmd` leaves `~/.local/bin` out. `style-check` therefore puts `~/.local/bin` first on its own PATH, so the hook, cron and remote callers run the pins. pi-lens still uses the agent session's PATH; run `style-check --doctor` from inside an agent session to check that one.
- pi-lens keeps a second, managed copy of some tools under `~/.pi-lens/bin` for its checkers, and updates those itself. They can differ from the pins; formatting stays aligned because pi-lens's formatter takes the PATH copy.
- A repo with uncommitted work or unpushed commits on another machine cannot adopt until that work lands: a baseline reformat would conflict with it on nearly every line.
- Vendored code is excluded per repo (`.styleignore`, and the matching `ruff.toml` `extend-exclude` / `biome.json` `files.includes`, which pi-lens also honours) instead of being reformatted.
- A baseline reformat changes the blob IDs of the files it touches. An Offload allowlist names exact `object` + `path` + `rule`, so every reviewed false positive in a reformatted file needs re-approving before the next history scan passes (pi-durable: 27 entries). Check that the file's pre-reformat blob was allowlisted and that its string literals are unchanged, then add the new blob.
- biome 2.5 is not always idempotent: a long call chain can need a second pass to settle. `style-check --fix` repeats biome until a check is clean, so a baseline does not come back as pi-lens churn on the next edit.
