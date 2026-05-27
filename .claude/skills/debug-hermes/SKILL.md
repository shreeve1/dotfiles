---
name: debug-hermes
description: Diagnose Hermes Agent behavior, gateway issues, Honcho integration, context loading, and Telegram connectivity.
---

# Debug Hermes Agent

Diagnostic skill for troubleshooting Hermes Agent behavior in future Claude sessions.

## When to Use

User says "debug hermes", "hermes isn't working", "check hermes", or similar. Also use proactively when user mentions Hermes behaving unexpectedly.

## Key Locations

### Installation
- **Source:** `/home/james/.hermes/hermes-agent/`
- **Binary:** `/home/james/.hermes/hermes-agent/hermes`
- **Config:** `/home/james/.hermes/config.yaml`
- **Env vars:** `/home/james/.hermes/.env`
- **State DB:** `/home/james/.hermes/state.db`

### Context Files
- **Global identity:** `/home/james/.hermes/SOUL.md` (terse operator persona)
- **Project context:** `/home/james/homelab/.hermes.md` (minimal pointer to wiki)
- **Skills:** `/home/james/.hermes/skills/`
- **Session storage:** `/home/james/.hermes/sessions/`
- **Logs:** `/home/james/.hermes/logs/`

### Honcho Stack
- **Location:** `/home/james/honcho/`
- **Compose file:** `/home/james/honcho/docker-compose.yml`
- **Env file:** `/home/james/honcho/.env`
- **API endpoint:** `http://localhost:8010` (port 8000 was taken by Plane)
- **Hermes config:** `/home/james/.hermes/honcho.json`

**Honcho services:**
- `database` — PostgreSQL with pgvector
- `redis` — Cache
- `api` — FastAPI server on port 8010
- `deriver` — Background worker for dialectic reasoning

## Common Issues

### 1. Gateway Not Running
**Symptom:** No response from Telegram bot
**Check:**
```bash
ps aux | grep hermes
```
**Start gateway:**
```bash
cd /home/james/homelab
/home/james/.hermes/hermes-agent/hermes
```

### 2. Honcho Not Running
**Symptom:** Memory/user modeling doesn't work
**Check:**
```bash
docker ps | grep honcho
```
**Health check:**
```bash
curl http://localhost:8010/
```
**Restart:**
```bash
cd /home/james/honcho
docker compose down
docker compose up -d
```

### 3. Wrong Context Loaded
**Symptom:** Hermes doesn't know about homelab
**Check:** Where was gateway started from?
```bash
ps aux | grep hermes | grep -o 'cwd=[^ ]*'
```
**Fix:** Kill gateway, restart from `/home/james/homelab/`

### 4. Telegram Not Connecting
**Symptom:** Bot doesn't respond
**Check logs:**
```bash
tail -f /home/james/.hermes/logs/gateway.log
```
**Check token:**
```bash
grep TELEGRAM_BOT_TOKEN /home/james/.hermes/.env
```

### 5. Honcho Database Connection Failed
**Symptom:** Error in Honcho API logs about database
**Check:**
```bash
docker compose -f /home/james/honcho/docker-compose.yml logs database
```
**Verify pgvector extension:**
```bash
docker compose -f /home/james/honcho/docker-compose.yml exec database psql -U postgres -c '\dx'
```

### 6. LLM API Key Issues
**Symptom:** Honcho deriver worker errors
**Check:**
```bash
docker compose -f /home/james/honcho/docker-compose.yml logs deriver
grep LLM_OPENAI_API_KEY /home/james/honcho/.env
```

## Investigation Workflow

1. **Check gateway status**
   ```bash
   ps aux | grep hermes
   tail -20 /home/james/.hermes/logs/gateway.log
   ```

2. **Check Honcho stack**
   ```bash
   cd /home/james/honcho
   docker compose ps
   docker compose logs --tail=50
   curl http://localhost:8010/
   ```

3. **Verify context loading**
   ```bash
   # Check which context file would be loaded from current dir
   ls -la /home/james/homelab/.hermes.md
   ls -la /home/james/homelab/AGENTS.md
   cat /home/james/.hermes/SOUL.md
   ```

4. **Check Telegram connection**
   ```bash
   grep -i telegram /home/james/.hermes/logs/gateway.log | tail -5
   ```

5. **Check session storage**
   ```bash
   ls -lh /home/james/.hermes/sessions/
   sqlite3 /home/james/.hermes/state.db '.tables'
   ```

## Key Configuration Details

### Honcho Integration
From `/home/james/.hermes/honcho.json`:
- **Base URL:** `http://localhost:8010`
- **Workspace:** `hermes`
- **Peer name:** `james`
- **Recall mode:** `hybrid`
- **Session strategy:** `per-directory`

### Gateway
- **Interface:** Telegram bot (polling mode)
- **Launch directory matters** — loads `.hermes.md` or `AGENTS.md` from cwd
- **SOUL.md is global** — always loaded, not project-specific

### Self-Hosted Honcho
- Runs on aidev (this host)
- Port 8010 (8000 was occupied by Plane)
- Requires OpenAI API key for embeddings (`text-embedding-3-small`)
- PostgreSQL with pgvector for vector storage
- FastAPI + background deriver worker

## Quick Fixes

### Restart everything
```bash
# Kill gateway
pkill -f hermes

# Restart Honcho
cd /home/james/honcho
docker compose restart

# Restart gateway from correct directory
cd /home/james/homelab
/home/james/.hermes/hermes-agent/hermes
```

### View live logs
```bash
# Gateway logs
tail -f /home/james/.hermes/logs/gateway.log

# Honcho API
docker compose -f /home/james/honcho/docker-compose.yml logs -f api

# Honcho deriver
docker compose -f /home/james/honcho/docker-compose.yml logs -f deriver
```

### Test Honcho health
```bash
curl http://localhost:8010/
curl http://localhost:8010/health  # if endpoint exists
docker compose -f /home/james/honcho/docker-compose.yml exec api ps aux
```

## Setup Summary (for reference)

This Hermes setup was configured with:
1. **Terse operator** identity in SOUL.md
2. **Self-hosted Honcho** at localhost:8010
3. **Project context** in `/home/james/homelab/.hermes.md` (minimal pointer to wiki)
4. **No pre-populated skills** — learning through use
5. **Telegram interface** as primary gateway
6. **OpenAI key** for Honcho embeddings

Gateway launched from `/home/james/homelab/` directory to auto-load homelab context.
