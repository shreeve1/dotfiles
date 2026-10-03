---
name: pstack-benny-setup-benny
description: Configure Benny and prepare its triage and reproduce cron jobs. Use when installing Benny or changing its Slack, tracker, repository, routing, control, model, or budget settings.
disable-model-invocation: true
---

> **DSH port.** Read `../_shared/pstack-dsh-compatibility.md` before acting. This skill is isolated, user-invoked, and namespaced for side-by-side comparison.

# Set up Benny

Benny ships as a dormant automation pack inside pstack. The plugin manifest exposes only pstack's normal skill root; this file and the two operational files are not slash skills.

The human enters setup by pointing the agent at the pack's `FOR_AGENTS.md`. The bootstrap flow copies the whole pack into the target repository, then reads this file directly at `.pstack/automations/benny/skills/setup-benny/SKILL.md`.

Benny needs external configuration and two live DeepSeek Harness cron jobs.

Do not call `cron_create` until the user explicitly asks. Never put a secret value in pack files, prompts, or committed configuration.

## 1. Copy the pack

Do this before asking for Benny configuration and before showing any `cron_create` spec.

Ask which repository will run the cron jobs. The source pack is the directory containing `FOR_AGENTS.md`. The destination is `<target-repository>/.pstack/automations/benny/`.

Merge the entire source pack into the destination:

1. Create the destination when it is absent.
2. Copy every source file to the same relative path.
3. Preserve destination-only files. Never delete unrelated files during install or refresh.
4. Keep user-owned configuration, feature maps, and routing maps outside the destination. Never overwrite them. The user's config lives under `<target-repository>/.pstack/benny/`.
5. When an existing source-managed file differs, inspect the diff and merge without discarding local edits. If ownership is ambiguous, stop and ask before replacing it.
6. Verify that the destination contains `FOR_AGENTS.md`, this setup file, both operational files, their references, and the templates.

If this file is already being read from the target destination, treat the copy as complete and run the same verification before continuing.

## 2. Confirm shared pstack skills resolve

DSH does not need a per-repository plugin manifest. Shared pstack skills resolve through the dotfiles lane. Verify that these skills resolve in a fresh agent rooted at the target repository:

- `pstack-how`
- `pstack-why`
- `pstack-tdd`
- `pstack-unslop`
- `pstack-principle-separate-before-serializing-shared-state`
- `pstack-principle-minimize-reader-load`
- `pstack-principle-guard-the-context-window`
- `pstack-principle-sequence-verifiable-units`
- `pstack-principle-fix-root-causes`
- `pstack-principle-prove-it-works`

Do not count a skill loaded from the current session or a user-scoped plugin. The check must show that a fresh agent in the target repository receives pstack through the dotfiles lane. If any shared dependency does not resolve, stop and explain the failure.

The Benny operational files are read directly from `.pstack/automations/benny/`. Do not add that directory to a plugin manifest or expect its `SKILL.md` files to appear in the slash-skill list.

Tell the user that `.pstack/automations/benny/` and any referenced secret-free configuration must be committed before either cron job is created. Do not commit them unless the user asks.

Once this check passes, live cron prompts may read the committed operational files by their stable repository-relative paths. They must not embed a plugin cache path or copy the file contents.

## 3. Adapt the configuration

Open these copied examples:

- `../../templates/configuration.example.yaml`
- `../reproduce-and-fix-issues/references/feature-map.example.md`

Create user-owned copies under `.pstack/benny/` (outside `.pstack/automations/benny/`). These are configuration files, not pack files. Example locations:

- Project config, such as `.pstack/benny/configuration.yaml`
- Project feature map, such as `.pstack/benny/feature-map.md`
- Project routing map, such as `.pstack/benny/routing.md`

Fill one feature-map section for every user-facing feature the cron job may reproduce. Keep it at the user point of view. Do not freeze implementation details or current code paths in the map.

Do not edit the copied examples. Pack refreshes may update source-managed files after conflict review, but they must never touch the user-owned copies.

Prefer committed, secret-free files in the target repository when a fresh cron checkout must read them. Otherwise paraphrase the required values into the standalone prompt. Reference a repository file only after setup confirms that the file is committed in the repository where the cron job runs.

Use stable repository-relative paths for committed pack and configuration files. Never reference the plugin source directory or a plugin cache path from a live cron job.

## 4. Fill the required choices

Ask for or confirm:

- Source Slack channel ID
- Optional operations or status channel ID
- Repository URL and default branch
- Triage identity or Slack user ID
- Issue tracker type, team, project, labels, and intake status
- Tracker adapter skill or MCP actions
- Optional routing map path
- Required control skill name
- Required user-facing feature-map path
- Status emoji strings
- Pull request URL format
- Polling and effort budgets
- Triage polling cadence and reproduce polling cadence (every N seconds, minimum 60)
- Provider, model, and reasoning-effort routes for triage, reproduce, code, and media review
- `cwd` (defaults to the target repository)

Use only provider/model routes confirmed available in DSH (`~/.dsh/pstack-models.md` when present, otherwise inherit the captain's current route). Never copy Cursor model slugs from upstream examples without confirming them.

The source channel, triage identity, repository, tracker adapter, control skill, and feature map must be explicit. Fail setup if any required value stays ambiguous.

Run pstack's `pstack-unslop` skill on the final job names, descriptions, and prompt text before showing the specs.

## 5. Check integration capabilities

The triage cron job needs:

- Read access to the configured source Slack channel and its threads
- Thread-reply access in that channel
- Attachment metadata and file download access when reports include media
- Search, read, create, and update access through the configured issue-tracker adapter

The reproduce cron job needs:

- Read access to the source thread
- Thread-reply access in the source channel
- Optional post and edit access in the configured operations channel
- Repository read and history access
- A pull request action that can open a draft pull request
- The configured control-adapter skill

Prefer configured Slack actions for reads and posts. The optional `BENNY_SLACK_BOT_TOKEN` may fill a narrow gap such as editing one operations status message or downloading an attachment. Store the value in a secret manager or environment, not in YAML.

Do not use undocumented integration endpoints.

## 6. Prepare the routing map

If the user wants reroutes or owner pings:

1. Copy `../triage-issue-reports/references/routing.example.md` outside `.pstack/automations/benny/` (for example to `.pstack/benny/routing.md`).
2. Replace every placeholder with public or organization-local values.
3. Keep owner pings off by default.
4. Allow a ping only for a configured feature owner or a confirmed likely regression author.

If no routing map is configured, triage may classify a report but must not guess a destination or owner.

## 7. Verify the control adapter

Read `../reproduce-and-fix-issues/references/control-adapter.md` and the user's completed feature map.

Confirm that the named skill can:

- Bring up the target app
- Navigate every mapped feature through the real UI
- Exercise mapped states through declared adapter actions
- Inspect state without forcing the result
- Capture screenshots
- Start and stop a recording
- Clean up its processes and temporary data

If any capability is missing, leave the reproduce cron job disabled. It must fail closed rather than claim a reproduction it did not perform.

## 8. Prepare the live cron jobs

Ask whether this is first-time creation or configuration of existing cron jobs.

Read `../../FOR_AGENTS.md` from the copied pack as the primary user-intent source for either path. Use it to understand the two triggers, tools, instructions, outcomes, and shared rules.

### First-time creation

Build one cron job at a time. For each:

1. Read the matching copied prompt template as secondary internal source material.
2. Turn `FOR_AGENTS.md`, the finished Benny configuration, and the template intent into a complete standalone prompt.
3. Tell the live prompt to read and follow its exact committed operational file under `.pstack/automations/benny/`.
4. Use the stable repository-relative path, not a plugin source or cache path. Do not copy the operational file contents into the live prompt.
5. Show the exact `cron_create` spec to the user. The job is a `kind: "agent"` task with `cwd` set to the target repository, the standalone prompt as `task.prompt`, the polling cadence in `schedule.everySeconds` (minimum 60), `policy.overlap: "skip"`, and any confirmed provider/model/effort overrides.
6. Wait for an explicit yes from the user.
7. Call `cron_create` once with the confirmed spec. Read the validation result and surface any `invalid_job` error to the user before retrying.
8. Verify the job appears in `cron_list` with `source: "manual"` and the expected next occurrence.
9. Finish both `cron_create` calls before testing thread safety.

Show this complete triage spec, filled from configuration:

- `name`: `pstack-benny-triage-<repo-name>`
- `description`: short one-liner saying it triages Slack issue reports for the named repo
- `schedule`: `{ "everySeconds": <triage cadence> }` (minimum 60)
- `task.kind`: `agent`
- `task.cwd`: `<target-repository>`
- `task.prompt`: standalone prompt built from `templates/triage-automation-prompt.md`, paraphrased to read and follow `.pstack/automations/benny/skills/triage-issue-reports/SKILL.md`, with the resolved configuration embedded and an explicit note that there are no new reports when none are pending
- `policy.overlap`: `skip`
- `policy.misfire`: `skip`

After the triage cron job is created, show this complete reproduce spec:

- `name`: `pstack-benny-reproduce-<repo-name>`
- `description`: short one-liner saying it reproduces and may draft-fix triaged bugs for the named repo
- `schedule`: `{ "everySeconds": <reproduce cadence> }` (minimum 60)
- `task.kind`: `agent`
- `task.cwd`: `<target-repository>`
- `task.prompt`: standalone prompt built from `templates/reproduce-automation-prompt.md`, paraphrased to read and follow `.pstack/automations/benny/skills/reproduce-and-fix-issues/SKILL.md`, with the resolved configuration embedded, the configured repository and default branch, the source channel, the triage identity, and the wait-for-marker contract
- `policy.overlap`: `skip`
- `policy.misfire`: `skip`

Do not call `cron_create` twice for the same job. Do not skip the user confirmation step.

### Existing cron jobs

`cron_create` is creation-only. Do not use it to search for, inspect, or update existing cron jobs. `cron_list` and `cron_runs` are read-only and may be used to confirm a job's current shape.

Finish configuration, routing, control-adapter, and feature-map validation. Then give the user this concise field checklist.

For the existing triage job, update:

- Name and description
- Direct instruction to read `.pstack/automations/benny/skills/triage-issue-reports/SKILL.md`
- Source Slack channel
- Polling cadence
- Issue-tracker integration
- Paraphrased triage instructions, thread-only rule, and Benny verdict markers

For the existing reproduce job, update:

- Name and description
- Direct instruction to read `.pstack/automations/benny/skills/reproduce-and-fix-issues/SKILL.md`
- Source Slack channel
- Repository and default branch
- Polling cadence
- Pull request action
- Tracker, control-adapter, and feature-map requirements
- Paraphrased marker wait, evidence, verification, and bounded-fix instructions

Ask the user to update each existing cron job directly. To change a job's prompt or schedule, the user must disable the old job (`cron_disable`), delete it (`cron_delete`), then create the replacement through this setup flow. Do not create duplicates by skipping that step.

### Creation boundary

Never call a direct automation backend service, write to a hidden automation endpoint, or build a deep link that bypasses the user confirmation step. For new cron jobs, the only finish path is `cron_create` after explicit user approval.

Do not enable either cron job until the thread-safety test passes after `cron_create`.

## 9. Test thread safety

Use a test channel or a harmless test report.

Before testing, confirm that the target repository's `.pstack/automations/benny/` and every referenced secret-free configuration file are committed on the branch used by the cron checkout. Confirm that both live prompts point at their exact committed operational files. If any check fails, stop. Tell the user that the cron job cannot be enabled yet.

Offer a smoke test by calling `cron_run_now` for one job and reading the outcome with `cron_runs`. Verify:

1. Triage stores the root `thread_ts` and posts exactly one verdict as a reply.
2. The verdict contains one configured marker.
3. Reproduce accepts the marker only from the configured triage identity.
4. Reproduce keeps the same immutable source coordinates.
5. No source-channel root message appears.
6. A delegated worker cannot use any Slack write action.
7. Missing coordinates, a deleted parent, or a failed preflight produces no post and no tracker issue.

Enable normal traffic only after all seven checks pass.