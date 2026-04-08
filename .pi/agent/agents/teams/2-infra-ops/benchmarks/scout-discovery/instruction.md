# Scenario: New Client Environment Discovery

You are the infra-ops scout. The dispatcher has sent you to map a new client's environment. This is the first engagement — no baseline exists yet.

---

**Client:** Franklin Dental — 6-person dental practice
**Access:** SSH to the hypervisor (Proxmox) and all VMs. Credentials provided.
**Scope:** Single Proxmox node with all client infrastructure. You need to discover and document everything running.

## What you can see from the Proxmox node (pve-01, 10.10.1.50):

```
$ qm list
VMID  NAME          STATUS   MEM(MB)  BOOTDISK(GB)  PID
100   dc-01         running  4096     80             1234
101   app-01        running  8192     120            1235
102   db-01         running  16384    200            1236
103   backup-01     running  2048     500            1237

$ pct list
CTID  STATUS   LOCK  NAME
200   running        docker-host-01
201   running        monitoring-01
```

## What you find SSHing into each host:

**dc-01 (10.10.1.10)** — Windows Server 2019
- AD DS, DNS, DHCP (scope: 10.10.1.100-200, lease 4h)
- 12 domain users, 2 admin accounts
- Windows Server Backup to \\backup-01\shares\dc-backup, last successful: 3 days ago
- RDP enabled on 3389, NLA enabled
- Windows Firewall: domain profile ON, public profile OFF
- Defender definitions: 5 days old
- Uptime: 112 days

**app-01 (10.10.1.11)** — Ubuntu 22.04
- Running Dentrix Ascend connector (Java app on port 8443)
- nginx reverse proxy (ports 80, 443) with Let's Encrypt cert (expires in 72 days)
- OpenVPN client connecting to Dentrix cloud (tun0 interface, 172.16.0.2)
- UFW: 22, 80, 443, 8443 allowed; default deny
- Unattended-upgrades: enabled
- Uptime: 45 days
- Disk: 120GB, 89GB free

**db-01 (10.10.1.12)** — Ubuntu 20.04
- PostgreSQL 14 on port 5432, listening on 0.0.0.0 (all interfaces)
- Database: `dentrix_local` — 42GB, used for local reporting/analytics
- pg_dump cron: daily at 1 AM to /mnt/backup/pg_dumps/ (NFS mount from backup-01)
- Last pg_dump: successful, yesterday, 8.2GB compressed
- No connection restrictions in pg_hba.conf — any host can connect with password
- SSL: disabled
- Uptime: 200 days
- Disk: 200GB, 91GB free

**backup-01 (10.10.1.13)** — Ubuntu 22.04
- NFS exports: /shares/dc-backup, /shares/pg-dumps
- Proxmox Backup Server (PBS) running, datastores: vm-backups (last job: 14 hours ago)
- Disk: 500GB, 180GB free (64% used)
- No off-site replication configured
- No backup verification/restore testing ever documented

**docker-host-01 (10.10.1.20)** — Debian 12 LXC
- Docker CE running 4 containers:
  - `uptime-kuma` (port 3001) — monitoring 6 endpoints
  - `portainer` (port 9443) — Docker management UI
  - `pihole` (port 53, 80) — DNS filtering
  - `watchtower` — auto-updating all containers (no approval, no pinned versions)
- Docker socket exposed to Portainer (mounted /var/run/docker.sock)

**monitoring-01 (10.10.1.21)** — Debian 12 LXC
- Wazuh agent installed, reporting to an external Wazuh manager (client's MSP contract)
- Uptime Kuma instance (separate from the one on docker-host-01 — duplicate?)
- No other monitoring tools

---

Produce a complete discovery report. Map the environment, identify all services and dependencies, and flag every concern you find — categorized by severity.
