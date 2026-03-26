# Interview Skill Examples

## Example 1: General Project Interview

**User:** "interview me"

**Claude:** *Reads CLAUDE.md to understand project context*

"I see you're working on an SSH Management System. Let me ask you some questions about your current plans:

1. You have 12 hosts managed through SSH agents. Have you considered what happens if multiple agents need to be updated simultaneously - is there a risk of cascading failures if something goes wrong during updates?

2. The documentation mentions that ssh-truenas is 'critical' and hosts all network data. What's your backup and disaster recovery strategy if that node fails completely?

3. Your K8s cluster has 4 nodes but the documentation only mentions k81, k82, k83 in most contexts. Is k85 being treated differently, and if so, why?

4. How do you handle SSH key rotation across all these hosts? Is there an automated process, or would you need to manually update 12 hosts?

5. What's your strategy for monitoring - do you have centralized logging, or do you need to check each host individually to diagnose issues?"

## Example 2: Specific Feature Interview

**User:** "interview me about adding automated backups to the system"

**Claude:** *Reads CLAUDE.md and explores codebase*

"Looking at your infrastructure, I see you have TrueNAS for storage and multiple Proxmox VMs. Let me ask about your backup plans:

1. TrueNAS is hosting critical data. Are you planning to use ZFS snapshots for backups, or will you replicate to another storage location? What's your RTO/RPO?

2. For the K8s cluster, are you planning to use Velero for backup/restore? How will you handle persistent volumes claimed by pods?

3. The documentation mentions 21 services across 7 namespaces. How will you prioritize which services get backed up first? Do all of them need backup, or just stateful services?

4. Where will you store the backups? On TrueNAS itself (defeating the purpose if it fails), or do you have off-site storage?

5. How will you test your backups? A backup you haven't tested is effectively no backup at all.

6. What's your restoration strategy if a whole node fails? Will you restore to a new node automatically, or is there manual intervention required?

7. Have you considered the bandwidth impact of backups on your network? Will they run during off-hours?"

## Example 3: Architecture Decision Interview

**User:** "interview me about adding a monitoring stack"

**Claude:** *Analyzes current setup*

"I see you have Rancher for cluster management. Let me discuss monitoring with you:

1. You're using Rancher - are you planning to leverage its built-in monitoring, or deploy a separate Prometheus/Grafana stack?

2. With 12 hosts to monitor, how will you handle metrics retention? Prometheus can get resource-heavy with that many targets.

3. What's your alerting strategy? Will you use Alertmanager, and if so, where will alerts go - email, Slack, PagerDuty?

4. Do you need long-term metrics retention (weeks/months) for trend analysis, or is realtime monitoring sufficient?

5. How will you monitor the monitoring system itself? What happens if Prometheus crashes?

6. Your Proxmox hosts - will you monitor those too? They'd need the Proxmox Exporter.

7. What about application-level metrics? Do your services expose metrics endpoints, or would this just be infrastructure monitoring?"

## Example 4: Security Interview

**User:** "interview me about security hardening"

**Claude:** *Reviews security documentation*

"I see you already have CrowdSec protecting your ingress routes. Let me dig deeper:

1. CrowdSec is great for WAF/IPS, but what about internal network segmentation? Can one compromised container reach others?

2. You have SSH access to 12 hosts. Are you using key-based authentication everywhere, or are there any password-based logins? When was the last time you rotated SSH keys?

3. The documentation shows Vaultwarden for password management. Are you using it for all your credentials, or do you still have some in plain text config files?

4. What's your strategy for CVE scanning? Do you regularly scan container images for vulnerabilities?

5. How do you handle secrets in K8s? Are you using external secrets management (like HashiCorp Vault or External Secrets Operator), or just K8s secrets (which are base64 encoded, not encrypted)?

6. Do you have audit logging enabled? Could you trace who did what if there was a security incident?

7. What about network policies between namespaces? Could the 'downloads' namespace (with VPN) talk to 'security' namespace if it shouldn't?"

## Key Patterns

Notice how the questions:
- Use specific context from the codebase
- Ask about non-obvious concerns
- Probe tradeoffs and edge cases
- Consider failure modes
- Look for security implications
- Think about operational aspects
- Avoid surface-level questions
