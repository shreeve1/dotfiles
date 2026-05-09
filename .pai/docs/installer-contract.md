# Installer Contract

`pai-install` work is intentionally deferred. Adapter tracer issues may render and validate install plans, but they must not mutate live CLI configuration.

An install plan uses schema version `pai.install-plan.v1` and includes:

- `target_cli`: one of `claude`, `codex`, `opencode`, or `pi`.
- `files_to_change`: intended config files plus backup paths.
- `backup_paths`: required backups for every changed file.
- `symlink_actions`: runtime-local adapter pointers only.
- `adapter_enablement`: explicit adapter enablement with user approval.
- `rollback_notes`: human-readable recovery steps.
- `required_user_approval: true`.
- `live_config_mutation_allowed: false`.

## Rules

- Adapter tracer issues may only produce install plans and fixture expectations.
- Live application of install plans is deferred to the HITL safe installer issue.
- Plans must not expose auth files, private keys, `.env*`, or runtime stores such as `~/.pai/events.sqlite`, `~/.pai/memory`, `~/.pai/trails`, `~/.pai/transcripts`, or `~/.pai/auth`.
- Plans must not symlink tracked source files into runtime stores.
- Adapter enablement must always be explicit and approved by the user.

## Fixture Targets

The source-controlled fixtures cover Claude, Codex, OpenCode, and Pi. They validate plan shape and safety rules without touching live config.
