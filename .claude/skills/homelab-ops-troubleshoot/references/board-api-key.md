# Getting a Board API Key

The HomeLab Paperclip instance runs in `authenticated` mode. API calls need a board API key.

## Check for existing key

A key may already exist in the environment. Test with:

```bash
curl -s "http://localhost:3100/api/companies/4068464a-69cf-4078-89a2-8ebaa8a9e217/agents" \
  -H "Authorization: Bearer $BOARD_KEY" | head -5
```

If you get `"Board access required"`, you need a new key.

## Create a board API key via DB

Find the Postgres port:
```bash
ps aux | grep postgres | grep '\-D' | grep -oP '\-p \K\d+' 2>/dev/null || \
ps aux | grep postgres | grep -o '\-p [0-9]*' | awk '{print $2}' | head -1
```

Then create the key:
```bash
cd /Users/james/1-testytech/paperclip && \
NODE_PATH=$(find node_modules/.pnpm -name "pg" -maxdepth 4 -type d 2>/dev/null | head -1 | sed 's|/pg$||') \
node -e "
const crypto = require('crypto');
const pg = require('pg');
const token = 'pcp_board_' + crypto.randomBytes(24).toString('hex');
const keyHash = crypto.createHash('sha256').update(token).digest('hex');
const userId = 'hS7p6pv0mZpecoPlR9VliYnsMvCpe0HX';
const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
const client = new pg.Client({connectionString: 'postgres://paperclip:paperclip@localhost:PORT/paperclip'});
client.connect()
  .then(() => client.query(
    'INSERT INTO board_api_keys (user_id, name, key_hash, expires_at) VALUES (\$1, \$2, \$3, \$4) RETURNING id',
    [userId, 'troubleshoot-session', keyHash, expiresAt]
  ))
  .then(r => { console.log('Key ID: ' + r.rows[0].id); console.log('Token: ' + token); client.end(); })
  .catch(e => { console.error(e.message); client.end(); });
"
```

Replace `PORT` with the port from step 1.

## Use the key

```bash
export BOARD_KEY="pcp_board_..."
```

Then include in all API calls:
```bash
curl -s "http://localhost:3100/api/..." -H "Authorization: Bearer $BOARD_KEY"
```

The key expires after 30 days. Create a new one if expired.
