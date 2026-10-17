# Herdr Projects fleet directory

Approved project locations across omarchy, aidev and itan8n. This is a lookup
for coordinators, not a checkout synchronizer or a Projects registration file.
Paths and Git roots were checked on 2026-10-17; recheck before use.

## Machines

| Machine | SSH destination | Home |
| --- | --- | --- |
| omarchy | `james@100.95.55.243` | `/home/james` |
| aidev | `james@100.95.230.15` | `/home/james` |
| itan8n (hostname `n8n`) | `itadmin@100.95.224.218` | `/home/itadmin` |

Use the destination machine's paths and user. For Herdr routing, resolve its
saved machine ID or displayed label rather than assuming the SSH destination,
alias and board label are interchangeable. See [Herdr setup](herdr.md).

## Projects

“Not found” means absent from the checked location, not permission to create it.
This is the approved nine-project catalog, not an exhaustive filesystem index.

| Catalog name | omarchy | aidev | itan8n |
| --- | --- | --- | --- |
| `dotfiles` | `/home/james/dotfiles` | `/home/james/dotfiles` | `/home/itadmin/dotfiles` |
| `itastack-workspace` | `/home/james/Documents/itastack` | `/home/james/Documents/itastack` | `/home/itadmin/Documents/itastack` |
| `homelab` | `/home/james/homelab` | `/home/james/homelab` | Not found |
| `3cx-web-chat` | `/home/james/3cx-web-chat` | `/home/james/3cx-web-chat` | Not found |
| `pi-durable` | `/home/james/pi-durable` | `/home/james/pi-durable` | Not found |
| `aws` | Not found | `/home/james/aws` | `/home/itadmin/aws` |
| `itastack-app` | Not found | Not found | `/home/itadmin/itastack` |
| `itainfra` | Not found | Not found | `/home/itadmin/itainfra` |
| `ckb` | Not found | Not found | `/home/itadmin/ckb` |

All listed locations were Git roots with an `AGENTS.md`. This check does not
establish equal commits, clean branches, dependencies, credentials or readiness
to run services. No machine is implicitly the authoritative copy.

### The two ITAStack projects

- `itastack-workspace` is the workspace under `Documents/itastack` on all three
  machines; its recorded remote is the workspace repository on aidev.
- `itastack-app` is the distinct application on itan8n, with origin
  `github.com/itanoc/itastack`.
- For a new request saying only “itastack”, ask which one unless an explicit
  path or existing task/project context already identifies it.

Catalog names are lookup labels, **not automatically Projects repo keys**.
Projects retains existing path registrations and otherwise derives a name from
the directory basename, adding a suffix for collisions. For example, the laptop
registration `itastack` points to `/home/james/Documents/itastack`; preserve that
registration and its task IDs. Resolve a catalog label to its verified absolute
destination path when creating a task. Do not pass an unregistered catalog alias
as though it were a Projects repo key, rename folders or rewrite `repos.json`.
An absent registry file on a fresh board is normal; this directory does not
pre-register projects or prohibit Projects from registering paths during use.

## Resolve a new request

1. Re-read this directory for each new task. An explicit human machine/path wins;
   otherwise honor the board-selected machine, or use the local execution
   machine when none is selected. If that selection is unclear, ask.
2. Resolve the project on that machine. If the project, checkout or machine is
   missing, ambiguous or unreachable, ask before choosing a different host or
   path. An unlisted project is unknown, not forbidden or assumed absent.
3. Verify the connected host/user and absolute checkout path/Git root before
   creating the task. Read that checkout's project instructions. Resolve remote
   paths on the destination, not on the coordinator's local filesystem.
4. State the destination and checkout. Preserve Enter/Tab start semantics and
   existing task/repo overrides. Existing tasks remain owned by their current
   machine; a directory entry does not migrate them.

The catalog grants no permission to clone, transfer dirty work, synchronize
branches, deploy, restart services or start agents. Ask for the relevant action
and retain its workflow's safety and approval gates.

## Offload skills alongside Projects

- When preparing a project copy or comparing/synchronizing copies is needed,
  read [offload-prep](../.agents/skills/offload-prep/SKILL.md) or
  [offload-sync](../.agents/skills/offload-sync/SKILL.md), including their shared
  contract and references. Apply their source/target verification, authority
  decisions, scans and approval gates. A catalog location is a candidate to
  verify, not an Offload receipt or proof of repository identity. Run these
  skills from the relevant primary project copy, not a coordinator's private
  directory or a linked worker worktree.
- Projects owns ordinary board-task workers, worktrees, review, merge and cleanup.
  Use [offload-task](../.agents/skills/offload-task/SKILL.md) as an alternative
  dispatch only when explicitly requested for session-context/dirty-work
  transfer. Do not launch a second Offload worker for an existing Projects task.
- Offload return, merge and cleanup require that workflow's records and gates;
  they are not lifecycle commands for ordinary Projects tasks.
- [offload-deploy](../.agents/skills/offload-deploy/SKILL.md) requires a separate
  explicit deployment request; finishing a task does not authorize deployment.

## Standing coordinator instruction

Append this block to the existing `coordinator.instructions` on each machine
using `herdr-projects set coordinator.instructions <complete value>`. Preserve
all existing instructions, including the fleet model policy. `~` below means
the coordinator's own user home, not its working directory.

```text
[herdr-projects fleet directory and offload policy v1]
Honor an explicit human machine/path; otherwise use the board-selected machine, or local execution machine if none is selected. Ask if the selection or checkout is absent, ambiguous or unavailable; never silently switch hosts.
Before resolving each new task's project or machine, read ~/dotfiles/docs/herdr-projects-directory.md afresh. If it is missing or unreadable, ask. Use its verified-destination-path procedure, not catalog labels as automatic Projects repo keys; preserve existing task IDs and registrations.
When preparation or synchronization is needed, consult offload-prep or offload-sync and retain their safety and approval gates. Let Projects own ordinary board-task execution, review, merge and cleanup. Use full Offload dispatch only when explicitly requested for session-context/dirty-work transfer, never as a second worker for a Projects task. Offload return/merge/cleanup require Offload records, not ordinary board tasks. Deployment always requires a separate explicit request.
[/herdr-projects fleet directory and offload policy v1]
```
