# benny cron job intent

## what i want to automate

i want two DeepSeek Harness cron jobs that work together in one slack issue channel.

### cron job 1: triage issue reports

- trigger: a polling-style agent cron job that wakes every configured interval, reads the configured source slack channel for new top-level reports, and keeps the original thread coordinates for each report.
- behavior: i want it to read the thread and attachments, classify the report as a bug or performance issue, feature request, question or feedback, or reroute, and trace the likely owning layer before routing.
- tracker: i want it to search my configured tracker for duplicates, update a confident duplicate, and create a ticket only for a clear net-new bug.
- tools: i want slack thread read and reply access, my configured tracker integration, and my optional routing map.
- outcome: i want exactly one reply in the source thread with a short verdict and `[benny:bug]`, `[benny:performance]`, or `[benny:other]`. a bug or performance marker may include the tracker url.
- boundary: i never want this job to post a root message in the source channel.

### cron job 2: reproduce and fix confirmed bugs

- trigger: a polling-style agent cron job that wakes every configured interval and waits for a trusted triage marker in the original thread before acting.
- gates: i want it to stop when someone clearly owns the fix. if an existing pull request or merged commit may fix the report, i want verification instead of a competing change.
- behavior: i want it to use my configured control adapter and feature map, reproduce the exact symptom twice through the real ui, and capture screenshots, video, and a read-only state cross-check.
- fix: i want it to verify existing pull requests without authoring over them. after a confirmed repro, it may attempt one bounded root-cause fix, use tdd when the test is cheap, smoke the blast radius, and open a draft pull request only when before-and-after proof passes.
- tools: i want slack thread read and reply access, repository and history access, draft pull request creation, my configured tracker, and my control adapter.
- outcome: i want evidence and a verified result in the source or optional operations threads, plus an optional draft pull request. updates should be concise.
- boundary: i never want this job to post a root message in the source channel.

### shared rules

- i want the source channel and root thread coordinates to stay immutable for the whole run.
- i treat utility and debug bots as evidence, not delegation or fix ownership.
- i allow subagents to help, but they cannot post to slack or receive slack credentials.
- i want this entire pack committed at `.pstack/automations/benny/` in the target repository. its `SKILL.md` files are direct operational instructions, not registered plugin skills.
- i want the cron jobs to read shared pstack skills (`how`, `why`, `tdd`, `unslop`, and the required principle skills) from the dotfiles lane. project-scoped copies are not required; the host's dsh skill chain resolves them.
- i want each live cron prompt to read its committed operational file directly. I do not want plugin cache paths, copied excerpts, or slash-skill discovery.
- i keep user-owned configuration, feature maps, routing maps, and secrets under `.pstack/benny/` (outside `.pstack/automations/benny/`) so pack refreshes cannot overwrite them.
- i want both cron jobs to fail closed when channel coordinates, tracker access, the control adapter, or the feature map are missing or uncertain.
- i want draft pull requests only. do not merge or deploy.

### my configuration

- source slack channel: `<channel>`
- optional operations channel: `<channel or none>`
- repository and default branch: `<repo>`, `<branch>`
- tracker: `<type, team, project, labels, intake status>`
- routing map: `<path or none>`
- triage identity: `<slack identity>`
- control skill: `<configured skill or adapter>`
- feature map: `<committed same-repo path outside the copied pack, or behavior to paraphrase>`
- models: `<triage, reproduce, code, media review>`
- status emoji strings: `<seen, reproducing, reproduced, blocked, fixing, failed, pull request opened>`
- budgets: `<polling, verdict wait, follow-up, repro, rejection, fix>`
- cron schedule: `<triage every N seconds, reproduce every N seconds>`
- optional bot token capability: `<none, file download, or editable operations status>`

start from [`configuration.example.yaml`](./templates/configuration.example.yaml) and [`feature-map.example.md`](./skills/reproduce-and-fix-issues/references/feature-map.example.md). copy and fill them outside this pack, for example under `.pstack/benny/`. keep secret values in a secret manager or environment.

## for the agent

the human enters setup by pointing the agent at this file. do not look for or invoke a discovered benny slash skill.

1. ask which repository will run the cron jobs.
2. treat the directory containing this `FOR_AGENTS.md` as the source pack.
3. merge the entire source pack into `<target-repository>/.pstack/automations/benny/`.
4. preserve every destination-only file. never delete unrelated files or overwrite user-owned configuration, feature maps, or routing maps.
5. when an existing destination file at a source-managed path differs, review the diff and merge without discarding local edits. if ownership is ambiguous, stop and ask before replacing it.
6. verify that the copied `FOR_AGENTS.md` and `skills/setup-benny/SKILL.md` exist in the target repository.
7. read and follow `.pstack/automations/benny/skills/setup-benny/SKILL.md` directly from the target repository.

DSH does not need a per-repository plugin manifest the way Cursor needed `.cursor/settings.json`. shared pstack skills resolve through the dotfiles lane (`.agents/skills/pstack-*`), which the dotfiles `install.sh` keeps in place. if a fresh agent rooted in the target repository cannot resolve `pstack-how`, `pstack-why`, `pstack-tdd`, `pstack-unslop`, or any required principle skill, stop and explain what failed.

do not add `.pstack/automations/benny/skills/` to a plugin manifest or expect its files to appear in the slash-skill list.

tell me that `.pstack/automations/benny/` and any referenced secret-free configuration must be committed before either cron job is created. do not call `cron_create` until i explicitly ask.

show the exact `cron_create` specs for both jobs and wait for a clear yes. each job is a `kind: "agent"` task with `cwd` set to the target repository, the standalone prompt below, and a polling schedule from the configuration. do not create duplicates — if a job with the same name already exists, stop and ask whether to update or skip.

the triage prompt must read and follow `.pstack/automations/benny/skills/triage-issue-reports/SKILL.md`. the repro prompt must read and follow `.pstack/automations/benny/skills/reproduce-and-fix-issues/SKILL.md`. use these repo-relative paths only after setup confirms they are committed in the repository where the cron job will run.

for existing cron jobs, do not use `cron_create` to inspect or update them. validate the configuration, then use the concise field checklist in the copied setup file so i can edit each job directly. do not create duplicates.