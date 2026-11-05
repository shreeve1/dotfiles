# Agent compatibility for Pi

Install location: `.agents/skills/check-agent-compatibility/`, exposed through the existing `~/.agents/skills` symlink. Run `/reload` in an existing Pi session, then `/skill:check-agent-compatibility [repository-path]`. It is manual-only because each assessment uses four model runs and may execute repository checks.

## Source and local changes

Adapted from `https://github.com/cursor/plugins/tree/2776ddd2355d6d6c8747d3964600f28daf62f049/agent-compatibility` under the bundled MIT license. The four reviewer bodies are retained in `references/` with Cursor-only `model: fast` and `readonly: true` metadata removed and bullet-format wording adjusted for the local Markdown linter. The scanner command is pinned to npm `agent-compatibility@0.1.7` rather than `latest`.

The Pi wrapper replaces named Cursor agents with explicit Fabric children using the configured `cheap` model alias. It runs the scanner once, shares even failed scan results, serializes reviewers to avoid interfering probes, adds operator boundaries for setup changes, and withholds an overall score when evidence is incomplete. Bash can write files; these boundaries are instructions, not an operating-system sandbox.

Verified in wrk WSL with Bash; native Windows execution is not verified. Use WSL for this wrapper on Windows machines. No Cursor plugin registration, new Pi extension, or global npm installation is needed. The scanner is downloaded into npm's cache on first assessment. It is a heuristic signal, not proof of repository quality.

## Updating and checking

Fetch a chosen upstream revision and compare the four reviewer bodies; retain the license and review local boundaries before updating the scanner pin. Run `bash tests/check-agent-compatibility.test.sh` from the dotfiles checkout to check Pi discovery, supporting files, and provenance. A new adaptation also needs dry-run dispatch and incomplete-evidence probes before use.
