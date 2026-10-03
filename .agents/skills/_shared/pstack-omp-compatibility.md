# pstack on omp

Port of [backnotprop/pstack](https://github.com/backnotprop/pstack) @ `157aae39`, adapted for omp (oh-my-pi). Every skill is prefixed `pstack-` (upstream setup-pstack → `pstack-setup`). Reach a sibling with `skill://pstack-<name>` or `~/.agents/skills/pstack-<name>/SKILL.md`.

## Subagents

- Spawn with the `task` tool. It has no per-call model. The model comes from the agent you pick:

  | Agent | Model role | Use |
  |---|---|---|
  | `pstack-opus` | `@slow` | judgment, prose, hardest changes, synthesis |
  | `pstack-sol` | `@advisor` | second family for panels and reviews |
  | `pstack-glm` | `@task` | code delegates, explorers, swarm workers |
  | `poteto-agent` | `@task` | code-writing delegate inside a poteto-mode playbook step |
  | `pstack-comment-sicko` | `@slow` | read-only comment review for `pstack-no-comments` |

- A "configured ... model" means the matching line in `~/.agents/pstack-models.md`; each value is one of the agents above, or `inherit-parent` (use the default `task` agent).
- `task` spawns are already non-blocking and run in parallel when batched in one `tasks[]` call. There is no background flag.
- Read-only roles: say "read-only, do not edit files" in the brief.
- Cursor cloud agents do not exist. Run workers locally; give each its own output path, or set `isolated: true` when `task.isolation.mode` is not `none`.

## Other tools

- Structured questions: `ask` (`multi: true` for multi-select).
- Progress lists: `todo`.
- Browser/UI driving: the `browser` tool. CLI/TUI driving: `bash` with `pty: true`, or tmux.
- Skill authoring: write `~/.agents/skills/<name>/SKILL.md` per the Agent Skills format (agentskills.io); follow `~/.agents/skills/pstack-poteto-mode/playbooks/authoring-a-skill.md`.
- Slop cleanup: the `pstack-unslop` skill, then reread the diff.
- Long runs: `/loop` and `/goal` are user-typed omp commands; an agent cannot arm them. Ask the user to start one, or wait between checks with a timed `bash` call.

## Transcripts and skill folders

- Sessions: `~/.omp/agent/sessions/-<cwd relative to $HOME, "/" → "-">/*.jsonl` (`~/dotfiles` → `-dotfiles`). Outside `$HOME` the dir is `--<abs path, "/" → "-">--` (`/var/tmp/x` → `--var-tmp-x--`); if unsure, list `~/.omp/agent/sessions/` and match. Read only the active workspace's sessions.
- Skills: user `~/.agents/skills/`, project `.agents/skills/`.
