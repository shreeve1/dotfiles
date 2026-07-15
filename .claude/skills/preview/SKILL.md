---
name: preview
description: Serve the current working directory over HTTP so artifacts (HTML, PDF, images, anything a browser opens) can be viewed from a remote system on the LAN. Spin up on demand, tear down when done. Zero dependencies — uses python3 stdlib only. Use when the user wants to view/preview artifacts locally, serve a directory, see an HTML file or PDF from another machine, or says "preview this", "serve this", "let me view it", "open this in my browser", "host this", "tear down the server", "stop preview", or "done previewing".
---

# Preview

Serve **cwd** over plain HTTP so a remote machine on the LAN can view artifacts the session produced. Manual browser reload after edits — no auto-refresh, no dependencies.

## Start

Serve the current working directory with the python3 stdlib HTTP server:

    PORT=8000
    # If 8000 is busy, walk up until a free port is found (8001, 8002, ...).
    CWD="$(pwd)"
    IP="$(hostname -I | awk '{print $1}')"
    python3 -m http.server "$PORT" --directory "$CWD" >/tmp/agency-preview.log 2>&1 &
    echo $! >/tmp/agency-preview.pid

Then:

1. Confirm it's actually listening: `ss -tlnp | grep ":$PORT "`
2. Build the URL: `http://<IP>:<PORT>/`
3. If a specific file is in context (the artifact being previewed), point the user at that path — `http://<IP>:<PORT>/<file>` — and `ls`-verify it exists first.
4. Tell the user: open the URL, and **reload the browser manually after each edit**.

State the chosen port, the LAN URL, and the PID file path. Do not assume the IP — discover it fresh each time with `hostname -I`, since it can change across reboots.

### Already running?

Before starting, check `/tmp/agency-preview.pid`. If a live process holds that PID and is listening, **do not double-start** — re-print the existing URL and stop.

## Stop

Tear down when the user says they're done, or at the end of an iteration window:

    [ -f /tmp/agency-preview.pid ] && kill "$(cat /tmp/agency-preview.pid)" 2>/dev/null
    rm -f /tmp/agency-preview.pid

Confirm down: `ss -tlnp | grep ":8000 "` (or the chosen port) returns nothing.

## Rules

- **Zero dependencies.** `python3 -m http.server` only. Never install live-server, nginx, inotify-tools, or anything else to "improve" this.
- **Manual reload.** The user refreshes their browser after edits. Do not inject reload snippets, poll, or attempt auto-refresh.
- **Clean footprint.** PID + log live in `/tmp`, never in the repo. Always offer/perform teardown when the preview window is over.
- **LAN-reachable by default.** http.server binds 0.0.0.0 with no extra flag; the URL uses the LAN IP, not localhost.
- **One server at a time.** The single PID file enforces this. To serve a different directory, stop first, `cd`, then start.

## Scope ceiling

This serves files a browser can open — HTML, PDF, PNG/JPG, SVG, plain text. It is **not** a dev server: no SSR, no build step, no SPA history fallback, no auth, no HTTPS. For a hot-reloading web app dev server, that's a different tool — don't grow this skill into it.

<!-- ponytail: manual-refresh over auto-refresh is the deliberate ceiling. It costs zero deps and covers HTML+PDF+images uniformly. Auto-refresh only helps HTML and needs inotify-tools or live-server + a websocket/snippet bridge — revisit only if the user hits a long single-HTML grind and the manual reload genuinely bites. -->
