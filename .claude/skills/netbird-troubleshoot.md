---
name: netbird-troubleshoot
description: Diagnose NetBird VPN connectivity issues, peer state, relay health, WireGuard handshakes, and self-hosted server problems.
---

# netbird-troubleshoot

**Trigger:** "netbird troubleshoot", "netbird not connecting", "netbird peer stuck", "netbird connection issues", "debug netbird", "/netbird-troubleshoot"

**Purpose:** Diagnose NetBird VPN connectivity issues using systematic checks of peer status, relay health, and WireGuard handshakes.

---

## Mental Model

NetBird architecture (self-hosted):
- **Management server** (aidev:8081) - coordinates peers, handles auth
- **Signal server** (built-in) - WebRTC signaling for P2P setup
- **TURN relay** (coturn:3479) - fallback when P2P fails
- **Peers** - clients with WireGuard tunnels (P2P preferred, relayed fallback)

Connection states:
- **Connected (P2P)** - direct WireGuard tunnel between peers (best)
- **Connected (Relayed)** - tunnel via TURN server (slower but works)
- **Connecting** - peer registered but no WireGuard handshake (broken)

Common failure modes:
1. **Stale peer state** - peer shows "Connected" but no recent handshake
2. **Key exchange failure** - both sides connected to relay, no mutual tunnel
3. **Relay unavailable** - P2P fails + no fallback relay path
4. **Firewall blocking** - STUN/TURN ports blocked (UDP 3478/3479)

---

## Diagnostic Flow

### Phase 1: Infrastructure Health Check

Check NetBird server status (from aidev):
```bash
cd ~/netbird && docker compose ps
cd ~/netbird && docker compose logs --tail=50 netbird-server
netbird status
```

Look for:
- All 3 containers running (dashboard, server, coturn)
- No auth/relay errors in server logs
- Management and Signal both "Connected"
- Relay count (should be 1/2 or 2/2 Available)

### Phase 2: Peer Status Matrix

Get detailed view from all peers involved:
```bash
# On each peer (aidev, problem peer, working peer)
netbird status --detail
```

Create a comparison table:

| Peer | Mgmt | Signal | Relays | Target Status | Last Handshake | Connection Type |
|------|------|--------|--------|---------------|----------------|-----------------|
| aidev | Connected | Connected | 1/2 | Connected | <2min | Relayed |
| peer-a | Connected | Connected | 1/2 | **Connecting** | never | - |
| peer-b | Connected | Connected | 1/2 | Connected | <1min | P2P |

**Red flags:**
- "Connecting" with no handshake = key exchange failed
- Last handshake >5min ago = stale connection
- 0/2 relays available = relay unreachable

### Phase 3: Peer-Specific Checks

For each problem peer, run:
```bash
netbird status --detail | grep -A15 <target-peer-name>
```

Check:
- **Last connection update**: If >1hr old, peer needs restart
- **ICE candidates**: Should show local/remote endpoints for P2P
- **Relay server address**: Must match server config (rels://netbird.testytech.net:443)
- **Last WireGuard handshake**: If never or >10min, tunnel is dead

### Phase 4: Resolution Steps

**Fix 1: Peer-Side Restart** (most common)
```bash
# On problem peer
sudo netbird down && sudo netbird up
```
Wait 30 seconds, check if handshake establishes.

**Fix 2: Management Server Restart** (if multiple peers affected)
```bash
# On aidev
cd ~/netbird && docker compose restart netbird-server
```
All peers re-register, fresh key exchange.

**Fix 3: Full Stack Restart** (nuclear option)
```bash
# On aidev
cd ~/netbird && docker compose restart
```
Clears all connection state, forces clean slate.

**Fix 4: Relay Health Check**
```bash
# Check coturn is accepting connections
cd ~/netbird && docker compose logs coturn | tail -20
```
Look for "peer connected from" messages.

### Phase 5: Verification

After fix, confirm:
```bash
netbird status --detail
```

Success criteria:
- Status: Connected (P2P or Relayed)
- Last handshake: <2min
- Transfer status: non-zero RX/TX bytes

Test actual connectivity:
```bash
# Ping peer's NetBird IP
ping <peer-netbird-ip>

# Check service reachability
curl http://<peer-netbird-ip>:<service-port>
```

---

## Common Scenarios

### Scenario 1: Mobile app shows "Connecting" indefinitely

**Root cause:** Peer registered but no WireGuard tunnel established.

**Fix:**
1. Check if peer shows up in `netbird status` on aidev
2. If yes, restart NetBird on both mobile and target peer
3. If no, mobile auth failed - check setup key or SSO

### Scenario 2: Both sides show "3/3 Connected" but can't reach each other

**Root cause:** Stale connection state - management thinks tunnel exists, WireGuard doesn't.

**Fix:**
1. Check `netbird status --detail` - look for "Last handshake" age
2. Restart peer with older "Last connection update" first
3. If both fresh, restart netbird-server

### Scenario 3: P2P works on LAN, fails when remote

**Root cause:** STUN/TURN not working for NAT traversal.

**Fix:**
1. Check UDM Pro port forwards (UDP 3478/3479 → aidev)
2. Verify external STUN/TURN reachable: `stun netbird.testytech.net 3478`
3. Check coturn logs for relay connections
4. Ensure both peers use same relay server (check config)

### Scenario 4: Works after restart but breaks after hours

**Root cause:** Connection timeout, no keepalive.

**Fix:**
1. Check NetBird keepalive settings (should be default 25s)
2. Look for network/firewall dropping idle UDP
3. Check if relay has aggressive timeout (coturn `max-allocate-lifetime`)

---

## Quick Reference

### NetBird Server (aidev)
- **Dashboard:** https://netbird.testytech.net
- **Management API:** https://netbird.testytech.net/api
- **Docker stack:** `~/netbird/docker-compose.yml`
- **Config:** `~/netbird/config.yaml`
- **Logs:** `docker compose logs -f netbird-server`

### Peer Installation
```bash
# Standard install
sudo netbird up --management-url https://netbird.testytech.net --disable-ssh-auth

# Make settings persistent
sudo netbird config set --disable-ssh-auth true
```

### Key Commands
```bash
# Status overview
netbird status

# Detailed peer view
netbird status --detail

# Force reconnect
sudo netbird down && sudo netbird up

# Logs
sudo journalctl -u netbird -f
```

### Network Info
| Component | Port | Protocol | Purpose |
|-----------|------|----------|---------|
| Dashboard | 8080 | HTTP | Web UI (behind NPM) |
| Management | 8081 | HTTPS/gRPC | API + Signal |
| STUN | 3478 | UDP | NAT discovery |
| TURN | 3479 | UDP/TCP | Relay fallback |

### Critical Files
- Server config: `/home/james/netbird/config.yaml`
- TURN config: `/home/james/netbird/turnserver.conf`
- Peer config: `/etc/netbird/config.json`

---

## Auto-Discovery

When invoked, check:
1. Current host - if aidev, can run server-side checks directly
2. If on peer, check if `netbird` CLI available
3. Read `services/netbird.md` for server details
4. Check if Docker stack running before running container commands

If user reports peer name, prioritize checks on that specific peer.

## Success Criteria

Skill complete when:
- [ ] Root cause identified (stale state, relay issue, firewall, etc.)
- [ ] Fix applied (restart peer, restart server, config change)
- [ ] Verification passed (handshake fresh, ping works, service reachable)
- [ ] User confirms connectivity restored

If issue persists after all fixes, escalate with full diagnostic output for manual review.
