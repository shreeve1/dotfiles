# Triage cron job prompt

> Source material for the copied setup workflow. Paraphrase this intent into the `cron_create` `task.prompt` field after setup confirms that the copied pack is committed in the repository where the cron job will run. The job is `kind: "agent"` with `cwd` set to the target repository and a polling schedule from the configuration.

Read and follow `.pstack/automations/benny/skills/triage-issue-reports/SKILL.md` for this run.

Configuration source. Include this repository-relative path only when it is committed in the same target repository. Otherwise paraphrase the configured values. Never use a plugin source or cache path:

```text
{{BENNY_CONFIG_PATH}}
```

Trigger context for this run:

```json
{
	"source_channel_id": "{{SLACK_CHANNEL_ID}}",
	"message_ts": "{{SLACK_MESSAGE_TS}}",
	"thread_ts": "{{SLACK_THREAD_TS_OR_EMPTY}}"
}
```

The cron intent should describe this as a polling job that wakes on a schedule, scans the configured source Slack channel for new top-level reports, and processes each one with the coordinates as immutable.

Treat the source channel and root thread timestamp as immutable. If either is missing or does not match configuration, stop without posting or writing to the issue tracker.

The committed operational file owns classification, attachment review, cause tracing, routing, dedupe, tracker writes, and the final verdict. Post no progress messages. Never post a root message in the source channel.

The coordinator is the only Slack poster. Any delegated worker must be read-only, return findings only, and receive an explicit ban on every Slack write action.

End the single verdict with exactly one configured marker:

```text
[benny:bug]
[benny:performance]
[benny:other]
```

A bug or performance marker may add `tracker=<URL>`.
