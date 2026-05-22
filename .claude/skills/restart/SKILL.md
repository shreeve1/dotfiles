---
name: restart
description: Kill all running instances of the project's development server and start it fresh. USE WHEN user says "restart the server", "kill and restart dev server", or the dev server is unresponsive and needs a clean restart.
---

# Restart Dev Server

Kill all running instances of the project's development server and start it fresh.

## Phase 1: Detect Server Type

Examine the current project to determine how the server is run. Check these in order:

1. `package.json` for `scripts.start`, `scripts.dev`, `scripts.serve`
2. `Makefile` for `run`, `serve`, `start`, or `dev` targets
3. `docker-compose.yml` / `docker-compose.yaml` for service definitions
4. `Procfile` for web process definition
5. `manage.py` (Django), `app.py`/`main.py` (Flask/FastAPI), `server.py`
6. `Cargo.toml` (Rust), `go.mod` (Go), `build.gradle` / `pom.xml` (Java)

If you cannot determine the server type, ask the user how they start their server.

## Phase 2: Kill Running Instances

Use appropriate strategies based on detected server type:

- **Node.js**: `lsof -ti :<port> | xargs kill -9` and/or `pkill -f "node.*<script>"`
- **Python**: `pkill -f "python.*<entry>"` or `pkill -f "uvicorn|gunicorn|flask"`
- **Docker**: `docker compose down`
- **Ruby/Rails**: `pkill -f "rails server|puma|unicorn"`
- **Go**: `pkill -f "<binary-name>"`
- **General**: If a port is known, use `lsof -ti :<port> | xargs kill -9`

Also check common ports (3000, 3001, 4000, 5000, 5173, 8000, 8080, 8888).

Report what processes were found and killed.

## Phase 3: Restart the Server

Start the server using the detected command:

- Prefer `dev` or `start` scripts over production commands
- Use the project's standard tooling (npm/yarn/pnpm, make, docker compose, etc.)
- Background the process so it doesn't block

Wait a few seconds, then verify the server started by checking the process is running and the port is listening.

## Report

```
Server Restart Complete

Project: <project directory name>
Server type: <detected type>
Command: <the start command used>
Port: <port if known>

Killed: <number of processes killed, or "none running">
Status: <running | failed to start>
```

If the server failed to start, show the error output and suggest fixes.
