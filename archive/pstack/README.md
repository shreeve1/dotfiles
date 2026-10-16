# Pstack experiment for DSH

This directory records the source, compatibility contract, and comparison procedure for the namespaced pstack skill port installed under `.agents/skills/pstack-*`.

It does not change `.agents/AGENTS.md` and does not replace any existing skill. Pstack affects a session only when you explicitly invoke one of its `pstack-*` skills.

## Start

Use `/pstack-setup` once if you want to record per-role model preferences. Then invoke `/pstack-poteto-mode` for a task.

## Compare with the current setup

Run the same bounded task twice in fresh sessions against the same clean revision:

1. Current setup. Do not invoke a pstack skill.
2. Pstack setup. Begin with `/pstack-poteto-mode` and the same request.

Record:

- Whether the task was completed correctly.
- Commands and checks run.
- Number of changed files and lines.
- Rework required after review.
- Wall-clock time and model usage when visible.
- Whether claims in the final answer were backed by evidence.

Do not run both variants in one session. Skill and conversation context would contaminate the comparison.

See `DSH-COMPATIBILITY.md` for the platform translation and `UPSTREAM.md` for provenance.

## Validate the port

Run:

```bash
python3 .agents/pstack/validate-port.py
```

The imported helper scripts can be tested without leaving dependencies in the skill directory:

```bash
tmp=$(mktemp -d)
cp -a .agents/skills/pstack-poteto-mode/scripts/. "$tmp"/
(cd "$tmp" && pnpm install --ignore-scripts && bun test && bun run typecheck)
rm -rf "$tmp"
```

Runtime smoke test in a fresh DSH Web session:

1. Select the dotfiles workspace.
2. Send `/pstack-how` followed by a question.
3. Confirm the trajectory shows `Context injection pstack-how`.
4. Send `/pstack-poteto-mode` with a bounded task.
5. Confirm the trajectory shows `Context injection pstack-poteto-mode`.
