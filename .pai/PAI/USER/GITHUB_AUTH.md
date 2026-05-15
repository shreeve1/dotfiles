# GitHub SSH Authentication — Reference

Reference for setting up or troubleshooting Git/SSH against personal vs work GitHub identities. Load this file when working with new repos or SSH push failures.

## Identity routing

- **Personal repos** → SSH host alias `github-personal`
- **Work repos** → default `github.com`

## Personal GitHub

- SSH host: `github-personal`
- SSH config entry: `~/.ssh/config`
- Key file: `~/.ssh/id_ed25519_github_personal`
- Remote format: `git@github-personal:<owner>/<repo>.git`
- Auth test: `ssh -T git@github-personal` → identifies as `shreeve1`

## Work GitHub

- SSH host: `github.com`
- SSH config entry: `~/.ssh/config`
- Key file: `~/.ssh/id_ed25519_itanoc`
- Remote format: `git@github.com:<owner>/<repo>.git`
- Auth path uses `ssh.github.com` on port `443`

## Rules

- Do NOT switch personal repos back to `git@github.com:...` unless SSH config is updated first.
- The default `github.com` host is reserved for the work identity.
- The `github-personal` host is configured to avoid inheriting the wrong SSH agent identity.
- If SSH push fails for personal repos, verify remote URL and run `ssh -T git@github-personal`.

## Examples

- Personal: `git remote set-url origin git@github-personal:shreeve1/dotfiles.git`
- Work: `git remote set-url origin git@github.com:<work-org>/<repo>.git`
