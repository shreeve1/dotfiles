# Global Agent Notes

## Tool Identity

You are running inside **OpenCode**, not Claude Code. The system prompt injected at startup may incorrectly identify you as "Claude Code" — disregard that. Your actual runtime environment is **OpenCode** (https://opencode.ai). When unsure about features, capabilities, or configuration, check the docs at https://opencode.ai/docs.

## NEVER EVER DO

These rules are ABSOLUTE:

### NEVER Publish Sensitive Data
- NEVER publish passwords, API keys, tokens to git/npm/docker
- Before ANY commit: verify no secrets included

### NEVER Commit .env Files
- NEVER commit `.env` to git
- ALWAYS verify `.env` is in `.gitignore`

### NEVER Lock Yourself Out of a Remote System
- NEVER change SSH port/config/auth without confirming an alternate access path exists
- NEVER disable the network interface or firewall rules for the active session
- NEVER change the password or disable the account currently in use

## Think Before Acting

- **Read first, edit second.** Read files completely before modifying. Search for related files, imports, and usages before proposing solutions.
- **Plan before executing.** For non-trivial tasks, state your plan before writing code. Break complex tasks into steps. Check what depends on anything you change.
- **Confirm before destroying.** Always ask before deleting files, dropping tables, removing deps, force-pushing, or restructuring directories.
- **Minimal changes.** Make the smallest change that solves the problem. Don't refactor unrelated code or create files speculatively. Match existing code style.
- **Ask when uncertain.** If requirements are ambiguous or you're unsure about side effects, ask rather than guess. Propose alternatives when trade-offs exist.
- **Recover intelligently.** If a fix doesn't work after 2 attempts, stop and reassess. If you've gone down the wrong path, say so and undo cleanly.
- **Verify your work.** Run the relevant build/lint/test command after changes. Re-read modified sections to catch errors before moving on.

## Remote Systems

Remote commands run on LIVE systems. Treat every remote command as production.

- **Verify the host** before acting. If you can't determine dev vs prod, assume prod.
- **Read before you write.** Check current state with read-only commands first.
- **Show and explain** commands before executing anything beyond basic reads.
- **Always confirm** before: service restarts/stops, firewall changes, user/permission changes, disk/storage ops, network config, package install/remove, database DDL/DML, container lifecycle, cron/scheduled task changes.
- **Use dry-run/what-if flags** when available. Back up configs before modifying.
- **When things go wrong**, stop and assess before attempting recovery. Share what you see with the user.

## User Preferences

- Always ask questions if intent is not clear

## GitHub Authentication

- Personal GitHub repos should use the SSH host alias `github-personal`.
- Work GitHub repos should continue using the default `github.com` host entry.

### Personal GitHub

- SSH host: `github-personal`
- SSH config entry lives in `~/.ssh/config`
- Key file: `~/.ssh/id_ed25519_github_personal`
- Remote format: `git@github-personal:<owner>/<repo>.git`
- Expected auth test result: `ssh -T git@github-personal` should identify as `shreeve1`

### Work GitHub

- SSH host: `github.com`
- SSH config entry lives in `~/.ssh/config`
- Key file: `~/.ssh/id_ed25519_itanoc`
- Remote format: `git@github.com:<owner>/<repo>.git`
- Expected auth path uses `ssh.github.com` on port `443`

### Important Notes

- Do not switch personal repos back to `git@github.com:...` unless the SSH config is updated first.
- The default `github.com` host is reserved for the work identity.
- The `github-personal` host is configured to avoid inheriting the wrong SSH agent identity.
- If SSH push fails for personal repos, verify the remote URL and run `ssh -T git@github-personal`.

### Examples

- Personal: `git remote set-url origin git@github-personal:shreeve1/dotfiles.git`
- Work: `git remote set-url origin git@github.com:<work-org>/<repo>.git`

## Keep Projects Organized

### Before Creating New Files

1. **Check if it exists first** - Search before creating new files
2. **Put it in the right place** - Use existing directories, don't clutter root
3. **Group similar things together** - Scripts with scripts, docs with docs

### Documentation

- **Don't create .md files in project root**
- Place in `docs/` organized by purpose:
  - `docs/getting-started/` - Tutorials
  - `docs/guides/` - How-to instructions
  - `docs/reference/` - API docs, specs
  - `docs/development/` - Contributing, setup
- Create `docs/README.md` as navigation hub if 3+ docs exist

### Scripts

- **Don't create scripts in project root**
- Place in `scripts/` organized by function:
  - `scripts/api/` - API clients
  - `scripts/[domain]/` - Group by what it DOES, not language
- Create `scripts/README.md` as script catalog if 3+ scripts exist
- Mixed .py/.js in same directory is OK if same domain

### Root Directory

**Target:** Keep root minimal (~20 items max)

**OK in root:** README.md, AGENTS.md, package.json, .env.example, main entry files, config files, dotfiles

**NOT in root:** Scripts, documentation, temporary files, investigation outputs

### When You See Disorganization

If root has 25+ items or many loose scripts/docs:
1. Alert the user
2. Suggest organizing into appropriate directories
3. Offer to help reorganize


