---
name: offload-deploy
description: Use when the user requests deploying a named Offload result or GitHub repo to a chosen server.
---

# Offload deploy

Read [the shared contract](../_shared/offload/contract.md). Deployment is a separate user request. An Offload task or prep request does not authorize it.

## Resolve the deployment

1. Identify the source. Accept a named Offload branch and reviewed Result, or an explicit GitHub repo URL and immutable revision. Ask for the target SSH host if omitted. For a GitHub repo, review its instructions before executing them. For an Offload, freeze and validate its Result as described in [offload-return](../offload-return/SKILL.md) without applying it to an unrelated checkout.
2. Run [the target inventory](../_shared/offload/inventory.md). Read the actual repo's deployment instructions and runtime manifests. Determine the service user, destination, process manager, ports, config paths, secret provisioning, build command, start command, health check and rollback procedure from this invocation. Resolve missing product choices with the user. Do not substitute a generic application framework.
3. Inspect the destination and listeners read-only. Identify any existing process or live service that would be overwritten, restarted, stopped or replaced. Show that impact and obtain explicit authorization before touching it. An existing dirty checkout is not a deployment directory to overwrite.

Finish this section when the revision and every runtime choice are concrete and the user has authorized the affected deployment. Record the chosen commands without secret values.

## Build and start

1. Prepare an isolated destination for the pinned revision. Use a new deployment directory or the repo's documented release mechanism. For Offload source transport, use only the verified Mirror and explicit `offload/*` refs. For GitHub source, fetch the specified repo directly. Do not push either side's main branch.
2. Install and build only the dependencies required by the repo, using its lockfiles and documented commands. Run the repo's pre-deployment checks. Provision credentials through the target's supported secret flow. Use ignored mode-0600 config files when appropriate. Never copy age private keys or put credentials in a branch.
3. Start the deployment with the chosen process manager. Bind only the approved addresses and ports. Configure persistence only if the user requested it. Preserve the previous release or configuration needed by the concrete rollback procedure.
4. Exercise the actual health check through the intended entry point. Check the process status and relevant logs without exposing secrets. A running PID alone is not a working deployment. If the health check fails, execute the authorized rollback procedure and report the failure instead of claiming success.

Finish when the pinned revision answers the intended health check and its process status matches the requested persistence model.

## Report

Name the host, deployed revision, destination, service identity, entry point, observed health result, exercised checks and exact rollback command. State whether it survives logout or reboot. Keep the Mirror, Offload refs and prior deployment until the user requests cleanup. Do not label an unverified deployment complete.
