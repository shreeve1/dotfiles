# pai-run Session Wrapper

`pai-run <cli>` is the shared harness entrypoint for launching supported agent CLIs with a canonical PAI session identity.

By default, `pai-run` prints a dry-run launch plan and does not invoke live external CLIs. Use `--exec` only when intentionally launching the native CLI.

## Supported Targets

- `claude` launches `claude` with native arguments unchanged.
- `codex` launches `codex` with native arguments unchanged.
- `opencode` launches `opencode` with native arguments unchanged.
- `pi` launches `pi` with native arguments unchanged.

## Session Environment

Every launch plan adds session environment variables without replacing native invocation semantics:

- `PAI_SESSION_ID`
- `PAI_RUNTIME_HOME`
- `PAI_HARNESS`
- `PAI_TARGET_CLI`
- `PAI_PROJECT_ID` when a project ID is available

## Lifecycle Events

The wrapper can record redacted canonical lifecycle events through the shared event store:

- `session.start`
- `session.launch`
- `session.degraded_capability`
- `session.stop`

Capability mismatches are emitted as explicit degraded capability events instead of silent success.

## Opt-in Soft Aliases

Aliases are documentation-only and are not installed automatically:

```sh
alias pcc='pai-run claude'
alias pcodex='pai-run codex'
alias popencode='pai-run opencode'
alias ppi='pai-run pi'
```
