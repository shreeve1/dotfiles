---
name: rpiv-monitor
description: Diagnose whether a running rralph pipeline (engine=pi or claude) is working or genuinely stalled, and report which step it is on. USE WHEN user says "is my rpiv run stuck", "check the rpiv pipeline", "monitor rralph", or thinks an unattended rralph looks frozen. Read-only — never types into the live pane.
---

# rpiv-monitor

Diagnose a running `rralph` pipeline read-only and report: which step, working vs. stalled, and (if stalled) the likely cause. The driver runs each step in a fresh engine TUI on a **private** tmux socket, so the user's own terminal only shows quiet driver stdout — "looks frozen" is usually just invisibility, not a stall.

**Hard rule: never `attach` or `send-keys` to the run's session.** Typing into the live pane corrupts the driver's paste/marker detection. Inspect only with `capture-pane`.

## Phase 1 — Re-derive run coordinates (every value is per-run)

Do not trust any socket/session/PID from a prior session or handoff. Derive fresh:

```bash
ps aux | grep -E '[r]ralph|[p]i --append|[c]laude --permission' | grep -v grep
```

Take the `rralph` driver PID. Then:

```bash
DRV=<driver-pid>
readlink /proc/$DRV/cwd          # repo + where logs land (.rpiv/run/ under here)
ps -o lstart= -p $DRV            # when the run started
```

**Sessions live on the DEFAULT tmux server** (no `-S` socket). List them:

```bash
tmux ls 2>/dev/null | grep -E '^rpiv(driver)?-'
```

You will see one long-lived driver session `rpivdriver-<TS>` plus, mid-step, one `rpiv-<step>-<epoch>` session. The **step name is in the session name** (`rpiv-research-...` → step = research). Pipeline order: research → design → plan → implement → validate → code-review → commit.

**Ignore the `rpivdriver-<TS>` session for step detection** — it is the orchestrator, not a step. It is deliberately named *without* the `rpiv-<step>-` shape, so the live step is always the `rpiv-<step>-<epoch>` session. Between steps (old step session killed, next not yet created) only `rpivdriver-<TS>` is present — that means "the driver is mid-transition", not step="driver".

> Legacy runs (created before rralph moved off the private socket) live on a per-run socket instead: `for s in /tmp/rpiv-tmux-*.sock; do echo "== $s =="; tmux -S "$s" ls 2>&1; done`. If you find one, prefix every `tmux` below with `-S "$s"`.

Record: `S` (the `rpiv-<step>-<epoch>` session), step, repo cwd, driver PID, start time.

## Phase 2 — Working vs. genuinely stalled

Capture the pane twice ~6s apart and compare:

```bash
a=$(tmux capture-pane -p -t "$S":0.0 | md5sum)
sleep 6
b=$(tmux capture-pane -p -t "$S":0.0 | md5sum)
[ "$a" = "$b" ] && echo UNCHANGED || echo CHANGING
```

Then read the footer for live signals:

```bash
tmux capture-pane -p -J -S - -t "$S":0.0 | tail -25
```

**Alive** = any of: pane CHANGING, spinner present (`⠋ Working...`), climbing response-token counter (`R###k`), climbing context meter (`##%/272k`). `$0.000 (sub)` in the footer is normal (subscription billing), not an error.

**Stalled** = spinner gone AND pane identical for minutes AND no token growth — often with a question/prompt sitting in the input box.

Also check timing against expectations before declaring a stall. The run
timestamp `TS` is the newest run dir; `.start` holds the kickoff time:

```bash
TS=$(ls -t <repo-cwd>/.rpiv/run/ | grep -E '^[0-9]{8}-[0-9]{6}$' | head -1)
stat -c '%y' <repo-cwd>/.rpiv/run/$TS/.start   # step-elapsed = now - this
```

Budget **~3–7 min/step** for pi on a small repo (rpiv-advisor adds deliberation rounds), more for large repos or `implement`. Driver timeouts are 2400s/step (7200s implement) — well above normal. Mid-step quiet is expected.

With the live-log change in `bin/rralph`, the step log is now written **during** the step (~every 5s), so this also works for a live tail:

```bash
watch -n5 "cat <repo-cwd>/.rpiv/run/<TS>/<step>.log | tail -20"
```

## Phase 3 — Report

State plainly: **step**, **working or stalled**, the evidence (changing/spinner/tokens), and time-in-step vs. budget. Give the coordinates table (socket, session, PID, repo, branch, engine/model) so the user can watch directly.

If genuinely stalled, name the likely cause and the next check:

1. **Waiting on a question** — a prompt/advisor blocked despite the autonomy system-prompt. Check the input box in the pane capture. Fix lives in the driver's appended system prompt or the offending skill.
2. **Readiness never reached** (only at step start) — log says `TUI not ready after Ns`. Raise `RPIV_READY_TIMEOUT`, or check engine auth/onboarding (login + directory trust).
3. **Auth/budget** — a provider/auth failure surfaces as an error in the pane.

Do not change `bin/rralph` from this skill. If a code change is warranted, hand off to `dev-review-pi` / `code-review` then `/commit`.

## Source of truth

- Driver: `~/dotfiles/bin/rralph` (header comments document engine model, pi readiness-settle, timeouts).
- Pipeline philosophy: memory `feedback_rpiv_pipeline.md` (no gates, auto-accept, fresh branch, commit always, no `-p` print mode).
