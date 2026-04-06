# Scenario: Document a Windows Server Baseline

You are the infra-ops documenter. Scout has completed initial discovery of a new client's primary server. Your job is to create the baseline documentation from scout's findings.

---

## Scout's Findings

**Host:** dc-01 (192.168.1.5)
**OS:** Windows Server 2022 Standard, Build 20348
**Roles:** Active Directory Domain Services, DNS Server, DHCP Server
**Uptime:** 47 days
**Domain:** acmecorp.local

**Services (running):**
- Active Directory Domain Services (NTDS)
- DNS Server
- DHCP Server (scope: 192.168.1.100-200, lease 8 hours)
- Windows Server Backup (scheduled daily at 2 AM to \\nas-01\backups\dc-01)
- Windows Defender (definitions updated 2 days ago)
- Remote Desktop Services (enabled, port 3389)

**Network:**
- IP: 192.168.1.5/24
- Gateway: 192.168.1.1 (firewall)
- DNS: 127.0.0.1 (self), 8.8.8.8 (fallback)
- NIC: Intel I210, 1Gbps, connected

**Storage:**
- C: 100GB SSD, 42GB free
- D: 500GB HDD (data), 380GB free

**Users:** 18 domain accounts, 3 admin accounts
**Group Policy:** 4 GPOs linked to domain root
**Last backup:** Successful, yesterday at 2:04 AM, 12GB

**Potential concerns noted by scout:**
- RDP exposed without NLA (Network Level Authentication)
- Windows Defender definitions 2 days old (should be daily)
- DHCP lease time is short (8 hours) for a 15-person office
- No secondary DNS server configured for domain

---

Create a complete baseline document for this host following your standard format.
