---
name: dotfiles
description: Set up and link dotfiles between a live home directory and `~/dotfiles`. Use when the user wants to add a new config file or folder to their dotfiles repo, create or repair symlinks, bootstrap a config into `~/dotfiles`, or map files from inside `~/dotfiles` back to their target locations such as `~/.config/...`, `~/.zshrc`, or other home-directory paths.
---

# Dotfiles

Use this skill when a user wants help managing a dotfiles repository centered on `~/dotfiles`, especially when the task is to move a real config into the repo and symlink it back, or when the user is already inside `~/dotfiles` and wants to create the matching symlink at the live target path. Do not use it for generic file management that is unrelated to dotfiles syncing.

## When to Use This Skill

- The user says they want to "add this config to dotfiles", "track this in `~/dotfiles`", or "symlink this config"
- The user is working with shell rc files, app config folders, or files under `~/.config/`
- The user is currently in `~/dotfiles` and wants to wire a repo path to its destination
- The user wants to bootstrap a new file or directory in the dotfiles repo and install the symlink in one flow
- The user wants to repair a broken symlink or explain what target path should be linked

## Tools Required

- `read` - inspect existing files, directories, and current skill contents
- `glob` - locate candidate config files or repo paths
- `bash` - create directories, move files, and create symlinks with `mkdir`, `mv`, `cp`, and `ln -s`
- `question` - ask for the destination path only when it cannot be inferred safely

## Key Principles

- Preserve user data first. If a destination already exists as a real file or directory, move it into `~/dotfiles` or rename it to a simple backup such as `config-bak` before linking. If that backup name already exists, choose the next available variant like `config-bak-2`, `config-bak-3`, and so on.
- Prefer inference over interruption. Derive common target paths like `~/.config/<name>` or `~/.<name>` when the mapping is obvious.
- Keep repo layout predictable. Mirror the live filesystem shape inside `~/dotfiles` when practical, such as `~/dotfiles/.config/ghostty/config` for `~/.config/ghostty/config`.
- Show the exact source and target paths before or while performing the link so the user can understand the mapping.
- Avoid destructive replacement. Do not delete an existing non-symlink path unless the user explicitly asks.

## Workflow

### 1. Identify the starting point

Determine which of these cases applies:

1. A live file or folder exists outside `~/dotfiles` and should be brought under dotfiles management
2. The user is already in `~/dotfiles` and wants to create the symlink to the live location
3. A symlink exists but is broken or points to the wrong target

Inspect the relevant paths with `read` or `glob` first so you do not guess blindly.

### 2. Infer the repo path and target path

Use these defaults unless the repo already follows a different convention:

- `~/.config/<app>/...` <-> `~/dotfiles/.config/<app>/...`
- `~/.toolrc` <-> `~/dotfiles/.toolrc`
- `~/.local/share/<app>/...` <-> `~/dotfiles/.local/share/<app>/...` only when the user clearly wants that data tracked

If the user is inside `~/dotfiles`, treat the selected repo-relative path as the source of truth and derive the live path by prefixing `~`.

If multiple targets are plausible and existing files do not disambiguate, ask one focused question with the recommended default.

### 3. Create missing parent directories

Before moving or linking anything, ensure the parent directories exist:

- For repo paths, create parents under `~/dotfiles`
- For live targets, create parents under `~/.config`, `~/.local`, or the relevant home path

Use `bash` with quoted absolute paths.

### 4. Move or create the managed file

For a live config being adopted into dotfiles:

1. If the live path exists and is not a symlink, move it into the matching location under `~/dotfiles`
2. If the live path does not exist, create the new file or directory directly inside `~/dotfiles`
3. If a symlink already exists and points correctly, leave it alone and report that no change was needed

For a repo-managed file being linked outward:

1. Confirm the repo file or folder exists, or create the requested starter file/folder in `~/dotfiles`
2. If the live target already exists as a non-symlink, rename it to a nearby `-bak` backup before linking, such as `config-bak` or `ghostty-bak`. If that name is taken, increment it with `-2`, `-3`, and so on until the backup name is unused.

### 5. Create the symlink

Use `ln -s` for a new link. Use `ln -sfn` only when replacing an existing symlink that already points somewhere else and replacement is clearly intended.

Common pattern:

```bash
mkdir -p "$HOME/.config/ghostty" && ln -s "$HOME/dotfiles/.config/ghostty/config" "$HOME/.config/ghostty/config"
```

For directories, link the directory path itself rather than linking every child unless the repo convention in that area is file-by-file.

### 6. Verify and report

After linking:

- Verify the link exists and points to the expected source
- Tell the user which path is now the canonical editable file in `~/dotfiles`
- Mention any `-bak` backups you created

## Common Patterns

### Adopt an existing config into dotfiles

1. Inspect `~/.config/app` or the target file
2. Create `~/dotfiles/.config/app` if needed
3. Move the real file into `~/dotfiles`
4. Symlink the live path back to the repo copy

### Create a brand-new managed config

1. Create the file or folder under `~/dotfiles`
2. Create the live parent directories
3. Symlink the live path to the repo path

### Link from inside `~/dotfiles`

1. Treat the current repo path as the source
2. Derive the destination under `~`
3. Rename any conflicting live path to a `-bak` backup, using incremented names when needed
4. Create the symlink

## Guardrails

- Do not remove a real file or directory at the live target path without either moving it into `~/dotfiles` or backing it up first.
- Do not assume every file under `~/.local` belongs in dotfiles; many are machine-specific state.
- Do not rewrite the user's broader dotfiles structure if an existing convention is already visible.
- Do not use destructive commands such as `rm -rf` to clear conflicts unless the user explicitly asks.

## Best Practices

1. Prefer mirroring the home-directory structure inside `~/dotfiles`; it reduces confusion and makes symlink targets obvious.
2. If the task affects multiple files for one app, consider linking the whole app directory instead of many individual files.
3. Keep secrets and machine-local state out of dotfiles unless the user explicitly wants encrypted or templated handling.
4. Prefer a simple adjacent `-bak` rename such as `config-bak`, then fall back to `config-bak-2`, `config-bak-3`, and similar names if needed.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `ln: File exists` | Inspect the destination. If it is a real file, rename it to a nearby `-bak` path first, using `-2`, `-3`, and so on if the first backup name already exists. If it is a symlink, verify whether it should be replaced. |
| Link points to the wrong file | Recreate the symlink with the correct absolute source path and verify after creation. |
| App ignores the symlinked config | Confirm the app actually reads that path and that the repo layout matches the live layout expected by the app. |
| Unsure whether to link a file or directory | Follow the repo's existing convention; otherwise prefer linking the whole directory when that app stores a cohesive config tree. |

## Report

After completing the task, report:

- the repo-managed source path
- the live target path
- whether you moved, created, or backed up any files
- the exact symlink state after verification
