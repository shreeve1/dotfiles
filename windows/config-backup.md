# Windows config backup — what's safe in a public repo

Companion to `setup-new-machine.md`. Defines which Windows-side config is
captured into this repo, where it lives on a machine, and how to capture and
restore it. One rule governs everything: **if it is public on GitHub, it is
public forever.**

## Safe to commit (and where it lands)

| Config | Machine path | Repo destination | Notes |
| --- | --- | --- | --- |
| PowerToys settings | `%LOCALAPPDATA%\Microsoft\PowerToys\` | `windows/config/powertoys/` | excludes listed below |
| PowerShell 7 profile | `Documents\PowerShell\Microsoft.PowerShell_profile.ps1` | `windows/config/powershell/` | oh-my-posh kali + PSReadLine |
| Windows PowerShell 5.1 profile | `Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1` | `windows/config/powershell/` | choco block is a safe no-op |
| Windows Terminal settings | `%LOCALAPPDATA%\Packages\Microsoft.WindowsTerminal_8wekyb3d8bbwe\LocalState\settings.json` | `windows/config/terminal/` | patch fields, don't wholesale-copy (see restore) |
| CapsLock→Ctrl registry | `HKLM\SYSTEM\CurrentControlSet\Control\Keyboard Layout` → `Scancode Map` | `windows/config/registry/capslock-ctrl.reg` | REG_BINARY; admin; effective at sign-out |
| WSL networking | `%USERPROFILE%\.wslconfig` (mirrored) + WSL `/etc/wsl.conf` | `windows/config/wsl/` | the reachability mechanism |
| WSL keepalive | Startup folder `wsl-boot.vbs` | `windows/config/wsl/` | hidden `wsl -e sleep infinity` |
| codex custom provider | `%USERPROFILE%\.codex\config.toml` (the `[model_providers.*]` block + activation lines) | `windows/config/codex/provider.toml` | placeholder the base URL |
| SSH alias template | `~/.ssh/config` (Windows: `%USERPROFILE%\.ssh\config`) | `windows/config/ssh/config.template` | Host blocks with `StrictHostKeyChecking accept-new`; hosts/placeholders only |
| herdr client config | `~/.config/herdr/config.toml` (Linux) — already synced | `home/herdr/config.toml` | existing mechanism |
| herdr machine list | `%LOCALAPPDATA%\herdr\client\endpoints.json` / `~/.local/state/herdr/client/endpoints.json` | `herdr/endpoints.json` | ids/labels/aliases only, no credentials |

## NEVER commit

| Item | Why |
| --- | --- |
| SSH private keys, `authorized_keys` | credentials — machine-local only |
| RustDesk config (`%APPDATA%\RustDesk`, ServiceProfiles copy) | machine identity (`enc_id`, `key_pair`), trusted devices, password material |
| `AutoComplete.ahk` as-is | contains personal email + home address — commit a sanitized template at most |
| PowerRename / PowerToys Run MRU + query history | personal usage data, zero setup value |
| Any `*UpdateLogs*`, `RunnerLogs`, `LogsModuleInterface`, `Updates\` (installer cache, ~285 MB) | junk and size |
| API keys, tokens, mesh-VPN setup keys, `PI_*`/env secrets | credentials |
| Browser profiles, Wi-Fi profiles | secrets + personal data |

## Address policy

Docs and configs in this folder use placeholders (`<agent-host>`,
`100.x.y.z`) for private endpoints. Real mesh addresses and internal
hostnames are not credentials, but they reveal private topology — replace
them with placeholders unless you have deliberately decided otherwise (the
long-committed `herdr/endpoints.json` is the existing precedent to review,
not follow blindly).

## Capture (run on a configured machine, PowerShell)

PowerToys (excludes the never-commit items):

```powershell
robocopy "$env:LOCALAPPDATA\Microsoft\PowerToys" pt-config /E `
  /XD Updates RunnerLogs UpdateLogs LogsModuleInterface /XF *.log
# then delete PowerRename replace-mru.json, search-mru.json,
# power-rename-last-run-data.json and PowerToys Run QueryHistory.json manually
```

Everything else is single-file copies from the paths in the table, with the
never-commit edits applied (PII stripped, URLs placeholdered).

## Restore (new machine)

1. PowerToys: app installed, PowerToys **closed**, copy the config back.
2. CapsLock→Ctrl (admin PowerShell, effective at next sign-out/reboot):

```powershell
reg add "HKLM\SYSTEM\CurrentControlSet\Control\Keyboard Layout" /v "Scancode Map" /t REG_BINARY /d 0000000000000000020000001D003A0000000000 /f
```

   (Same value as `windows/config/registry/capslock-ctrl.reg` — import that
   file instead if you prefer.)
3. Terminal: **patch fields, don't wholesale-copy** — take the machine's own
   `settings.json` and set `defaultProfile` to the PowerShell GUID
   `{574e775e-4f2a-5b96-ac1e-a2962a402336}`, `initialCols` 120,
   `initialRows` 35. Wholesale copies drag stale dynamic profiles
   (per-machine generated) onto the new machine.
4. codex provider — if `~\.codex\config.toml` already exists, merge, don't
   replace: strip any existing top-level `model`/`model_provider`/
   `model_reasoning_effort` lines and any existing `[model_providers.<id>]`
   block for the same id, then put the three activation lines at the very top
   (TOML requires top-level keys before the first table header) and append
   the provider block at the end.
5. `.wslconfig` / `wsl.conf` / `wsl-boot.vbs`: follow `setup-new-machine.md`
   phases 2-3.
6. Verify: PowerToys loads the Keyboard Manager layer (1 key remap + 13
   shortcuts) and both FancyZones custom layouts.

## Version drift

Captured settings were 0.100-era PowerToys and load cleanly on 0.102. If a
future version rejects a setting it resets that module to defaults — the
valuable parts (Keyboard Manager remaps, FancyZones layouts) are plain files
that have carried cleanly so far. **Awake is reset by migrations**: after any
PowerToys upgrade, check `settings.json` → `enabled.Awake` is still `true`.
