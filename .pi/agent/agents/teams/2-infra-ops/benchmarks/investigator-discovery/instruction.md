# Scenario: New Client Environment Discovery

You are the infra-investigator. A new MSP client has been onboarded and you need to map their environment. Here is what the dispatcher has told you:

---

**Client:** Greenfield Manufacturing — 25-person manufacturing company
**Known infrastructure (from sales handoff notes):**
- Hypervisor: Proxmox VE at 192.168.1.1 (single node)
- Windows VM: Active Directory Domain Controller, presumed at 192.168.1.10 (Windows Server 2019)
- Linux VM: Web server running their product catalog site, presumed at 192.168.1.20 (Ubuntu 20.04, Apache)
- Linux VM: Docker host running internal tools, presumed at 192.168.1.30 (Debian 12)
- NAS: TrueNAS at 192.168.1.50 — file shares, backups, CCTV footage storage
- Network: single flat /24 subnet, Ubiquiti EdgeRouter at 192.168.1.1 (wait — same IP as Proxmox? need to verify)
- No documentation exists. Previous IT was a solo contractor who left.

**Your task:** Map this environment completely. Identify all hosts, services, dependencies, and flag any concerns. Use structured evidence output format. This is observe-only — no changes, no restarts, no file modifications.

**Access:** You have SSH access to all Linux hosts and PowerShell remoting to Windows. Root/admin credentials are available.

---

Plan and describe your investigation approach. For each host, specify the exact commands you would run. Identify dependencies between hosts. Flag any security, operational, or architectural concerns. Use your evidence-structured output format.
