# HomeLab Company Inventory

> Last updated: 2026-04-08
> Always verify against the live API — IDs don't change, but config does.

## Company

- **ID:** `4068464a-69cf-4078-89a2-8ebaa8a9e217`
- **Name:** HomeLab
- **Prefix:** HOM
- **API:** `http://localhost:3100`

## Agents

| Name | ID | Role | Model | Heartbeat | Reports To | Icon |
|------|-----|------|-------|-----------|------------|------|
| **CEO** | `3e075f88-b276-4e9f-8a61-6b2eaa962aa3` | ceo | zai/glm-5.1 | 6h | Board | crown |
| **OpsLead** | `7c040a50-5b26-4849-83f7-a110f07f6059` | pm | zai/glm-5.1 | 30m | CEO | target |
| **Observer** | `1bb2554c-9ec3-4360-9413-41bf6043587f` | researcher | zai/glm-5.1 | 2h | CEO | telescope |
| **Patrol** | `b316d4a2-add2-486f-b231-2d29b6495c73` | devops | zai/glm-4.7 | routines only | OpsLead | radar |
| **SecOps** | `5229c112-eeba-40d8-b31f-4f00b5bcafab` | engineer | zai/glm-5.1 | 1h | OpsLead | shield |
| **BuildOps** | `55a1abf0-91fe-4d60-942b-da45390c0bc5` | engineer | zai/glm-4.7 | 30m | OpsLead | wrench |
| **PatchOps** | `54135f3c-9778-4209-9498-7e2c50424acf` | engineer | zai/glm-5.1 | 30m | OpsLead | shield |
| **DockerOps** | `04e0b743-a8b5-4ebe-9011-8fae774b6dce` | devops | zai/glm-5.1 | 1h | OpsLead | package |
| **MediaOps** | `3f8b6a93-8d1d-42df-8a5b-729baf283a6b` | engineer | zai/glm-5.1 | 1h | OpsLead | sparkles |
| **NetOps** | `dc9d6a93-ba6a-416e-8a48-10dfe4912909` | engineer | zai/glm-5.1 | 1h | OpsLead | globe |
| **StorageOps** | `5ff815f6-0ef3-4d1e-b2e7-c78594f271a1` | engineer | zai/glm-5.1 | 1h | OpsLead | database |
| **Responder** | `2f002f1c-78c7-4a3b-a6bf-61bee61cc9d5` | general | glm-5.1 (hermes_local) | on-demand | OpsLead | zap |

## Projects

| Name | ID |
|------|-----|
| **Security Operations** | `8b7bdd7e-b862-4d88-adff-dbf8c029121c` |
| **Infrastructure** | `9a5bf8fd-4052-47e5-9f56-f46049b83f43` |
| **Media Stack** | `639d4fc5-a207-4fef-ba08-a9f146c0466d` |
| **Network & DNS** | `bb5173f0-079a-4e92-8067-b699f9bb2e4a` |
| **Storage & Backups** | `c2d7a01f-5f42-489a-9359-93a5542757fa` |

## Goals

| Goal | ID | Level | Owner | Parent |
|------|-----|-------|-------|--------|
| **Keep Infrastructure Healthy** | `c68ba234-f80e-4fba-a6bc-51a2b5ec3cc5` | company | CEO | — |
| **Minimize Vulnerability Exposure** | `4a5d67fc-1a29-431b-a520-f76892591b6e` | team | SecOps | Keep Infra Healthy |
| **Maintain Patch Currency** | `3b2374ff-a28a-44d2-aa8b-18a1cafdcb1c` | team | PatchOps | Keep Infra Healthy |
| **Ensure Backup Integrity** | `a0fc1de6-71ae-4fff-817c-82c57ae26c9d` | team | StorageOps | Keep Infra Healthy |
| **Maximize Service Uptime** | `64345812-e6c8-49fb-9610-ad4ab69d76c8` | team | CEO | Keep Infra Healthy |
| **Keep Media Stack Running** | `228a8052-a7ac-4292-b419-8344fe641ebb` | agent | MediaOps | Max Uptime |
| **Network Reliability** | `3948ccf9-c627-4b73-b86a-11dc69554d45` | agent | NetOps | Max Uptime |
| **Docker Image Currency** | `af35bf68-d26a-4620-a8ae-2d82dfb1cb15` | agent | DockerOps | Patch Currency |

## Routines

| Routine | ID | Agent | Cron | Goal |
|---------|-----|-------|------|------|
| **Security Patrol** | `2215eb38-9e60-467a-bcd3-cb353841f5c3` | Patrol | `0 */2 * * *` | Min Vuln Exposure |
| **Infrastructure Patrol** | `0412ea7f-ad53-4db9-93fd-f3b40c08646b` | Patrol | `15 */2 * * *` | Max Uptime |
| **Media Patrol** | `52ea2c41-7da8-4da3-acf0-1c780faee885` | Patrol | `5 */4 * * *` | Media Stack Running |
| **Network Patrol** | `cedb8ef6-c1ca-44b9-b42b-975d476a825b` | Patrol | `20 */4 * * *` | Net Reliability |
| **Storage Patrol** | `a5d09a14-89f2-4a38-85aa-fe512ef09e51` | Patrol | `35 */4 * * *` | Backup Integrity |
| **Docker Patrol** | `4392347d-3b71-4339-a053-0c2c337cbf3c` | Patrol | `45 */12 * * *` | Docker Currency |
| **Zero-Day Supply Chain Monitor** | `45a49983-13dc-47d0-9d34-8c3bfaef8fac` | Patrol | `0 */6 * * *` | Min Vuln Exposure |
| **Media Cleanup** | `09e802ae-dd6c-4361-b63e-8d2249621c43` | Patrol | `0 */6 * * *` | Media Stack Running |
| **qBittorrent Health Check** | `bb732e93-fcd6-444d-86d6-fcfe3564b86b` | Patrol | `0 */6 * * *` | Media Stack Running |
| **Uptime Kuma Alert Response** | `fa3d6730-1342-49b9-96eb-93ab1c7e0e07` | Patrol | webhook | Max Uptime |
| **Daily Ops Digest** | `0ffd4024-ffce-4a22-8746-1ee4749db188` | Observer | `0 7 * * *` | Keep Infra Healthy |

All routines use timezone `America/Chicago`.

## Labels

| Name | ID | Color |
|------|-----|-------|
| patrol-finding | `b46e7793-7698-4c58-83a2-089ea5912186` | #6366f1 |
| security | `09ee3011-219d-4af2-9753-37aff265719e` | #ef4444 |
| infrastructure | `737d8400-2e4a-49c8-9d20-26395c74a69f` | #f59e0b |
| media | `10c417ec-3b88-4019-a6e5-5389b8a86bd1` | #8b5cf6 |
| network | `da9e68c5-0368-4226-aace-3a443e9828cc` | #3b82f6 |
| storage | `53b7f069-0fc0-4f76-a389-4171bbeadaac` | #10b981 |
| docker | `f1294a8a-07c4-41ca-b143-071ca35a140e` | #06b6d4 |
| approval-needed | `7b27a17b-89ef-4639-8aff-7de4ed1ebe48` | #f97316 |

## File Paths

| What | Path |
|------|------|
| Deployed agent instructions | `/Users/james/.paperclip/instances/default/companies/4068464a-69cf-4078-89a2-8ebaa8a9e217/agents/<agent-id>/instructions/` |
| Source agent instructions | `/Users/james/1-testytech/homelab/agent-instructions/<agent-name>/` |
| CEO extra files | `AGENTS.md`, `HEARTBEAT.md`, `SOUL.md`, `TOOLS.md` |
| Specialists | `AGENTS.md` only |
| Telegram script | `/Users/james/1-testytech/homelab/scripts/send-telegram.sh` |
| Homelab infrastructure index | `/Users/james/1-testytech/homelab/AGENTS.md` |
