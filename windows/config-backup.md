# Windows config backup — what's safe in a public repo

Companion to `setup-new-machine.md`. Defines which Windows-side config is
captured into this repo, where it lives on a machine, and how to capture and
restore it. One rule governs everything: **if it is public on GitHub, it is
public forever.**

## Safe to commit (and where it lands)

| Config | Machine path | Repo destination | Notes |
| --- | --- | --- | --- |
| PowerToys settings | `%LOCALAPPDATA%\Microsoft\PowerToys\` | `windows/config/powertoys/` | only top `settings.json`, Keyboard Manager, FancyZones layouts, Awake (see Capture) |
| PowerShell 7 profile | `Documents\PowerShell\Microsoft.PowerShell_profile.ps1` | `windows/config/powershell/Microsoft.PowerShell_profile.ps1` | starship, PSReadLine, PSFzf, zoxide, eza/bat/yazi aliases; choco block is a safe no-op |
| Windows PowerShell 5.1 profile | `Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1` | `windows/config/powershell/WindowsPowerShell_profile.ps1` | one line: loads the PowerShell 7 profile |
| Windows Terminal settings | `%LOCALAPPDATA%\Packages\Microsoft.WindowsTerminal_8wekyb3d8bbwe\LocalState\settings.json` | `windows/config/terminal/settings.patch.json` | only the fields we set; merge it in, don't wholesale-copy (see restore) |
| herdr Windows shell | `%APPDATA%\herdr\config.windows.toml` + user env `HERDR_CONFIG_PATH` | not committed (generated) | built from `home/herdr/config.toml` by the snippet in `setup-new-machine.md` Phase 6; re-run it after changing the shared config |
| CapsLock→Ctrl registry | `HKLM\SYSTEM\CurrentControlSet\Control\Keyboard Layout` → `Scancode Map` | `windows/config/registry/capslock-ctrl.reg` | REG_BINARY; admin; effective at sign-out |
| WSL networking | `%USERPROFILE%\.wslconfig` (mirrored) + WSL `/etc/wsl.conf` | `windows/config/wsl/.wslconfig`, `windows/config/wsl/wsl.conf` | the reachability mechanism |
| WSL keepalive | Startup folder `wsl-boot.vbs` | `windows/config/wsl/wsl-boot.vbs` | hidden `wsl -e sleep infinity` |
| WSL herdr service | `~/.config/systemd/user/herdr.service` (in WSL) | `windows/config/wsl/herdr.service` | `ExecStart=… herdr server` |
| WSL btop look | `~/.config/btop/` (in WSL) | `windows/wsl/btop/` | Tokyo Night snapshot |
| codex custom provider | `%USERPROFILE%\.codex\config.toml` (the `[model_providers.*]` block + activation lines) | `windows/config/codex/provider.toml` | base URL placeholdered; no key in the block |
| SSH alias template | `~/.ssh/config` (Windows: `%USERPROFILE%\.ssh\config`) | **not captured yet** | aliases are written by hand per machine (`AGENTS.md` → SSH aliases); the `github-personal` block is in `wsl-dev-setup.md` Phase D |
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

PowerToys: only the modules with setup value. The rest hold history, MRU
lists, cached paths, or machine identity (Mouse Without Borders carries a
`SecurityKey`, `MachineID` and `DeviceID`). Within FancyZones, skip
`applied-layouts.json`, `editor-parameters.json`,
`last-used-virtual-desktop.json` and `app-zone-history.json`: they record
the monitor serial number and per-machine desktop GUIDs, and FancyZones
rebuilds them. Run from the repo root:

```powershell
$pt  = "$env:LOCALAPPDATA\Microsoft\PowerToys"
$dst = "windows\config\powertoys"
Remove-Item -Recurse -Force $dst -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force $dst | Out-Null
Copy-Item "$pt\settings.json" $dst
foreach ($m in 'Keyboard Manager', 'Awake') { robocopy "$pt\$m" "$dst\$m" /E /XF *.log /XD Logs /NFL /NDL /NJH /NJS /NP }
robocopy "$pt\FancyZones" "$dst\FancyZones" /E /XD Logs /NFL /NDL /NJH /NJS /NP /XF *.log app-zone-history.json applied-layouts.json editor-parameters.json last-used-virtual-desktop.json
```

Then grep the result for your name, `C:\\Users`, mesh IPs and serial
numbers before committing.

Everything else is single-file copies from the paths in the table, with the
never-commit edits applied (PII stripped, URLs placeholdered).

## Restore (new machine)

1. PowerToys: app installed, PowerToys **closed** (quit it from the tray), then
   copy `windows/config/powertoys\*` over `%LOCALAPPDATA%\Microsoft\PowerToys\`
   and start PowerToys again.
2. CapsLock→Ctrl (admin PowerShell, effective at next sign-out/reboot):

```powershell
reg add "HKLM\SYSTEM\CurrentControlSet\Control\Keyboard Layout" /v "Scancode Map" /t REG_BINARY /d 0000000000000000020000001D003A0000000000 /f
```

   Or import `windows/config/registry/capslock-ctrl.reg` (same value) with
   `reg import` from an admin shell.
3. Terminal: **patch fields, don't wholesale-copy** — wholesale copies drag
   stale dynamic profiles (per-machine generated) onto the new machine. The
   script below backs up the machine's own `settings.json`, sets the default
   profile and a 120×35 window, and merges in
   `windows/config/terminal/settings.patch.json` (Catppuccin Mocha, JetBrains
   Mono Nerd Font 11, padding, copy-on-select, Ctrl+H/J/K/L pane focus).
   `profiles.defaults` is merged key by key, so settings the machine already
   had stay. Set `$default` to the profile new tabs should open:
   `'PowerShell'`, or `'Ubuntu-24.04'` on an agent host. Run it from the repo
   root; it is safe to run twice:

   ```powershell
   $default = 'PowerShell'
   $wt = "$env:LOCALAPPDATA\Packages\Microsoft.WindowsTerminal_8wekyb3d8bbwe\LocalState\settings.json"
   Copy-Item $wt "$wt.bak"
   $s = Get-Content $wt -Raw | ConvertFrom-Json
   $p = Get-Content windows\config\terminal\settings.patch.json -Raw | ConvertFrom-Json
   $guid = ($s.profiles.list | Where-Object name -eq $default | Select-Object -First 1).guid
   if (-not $guid) { throw "no Terminal profile named $default" }
   $s | Add-Member -Force defaultProfile $guid
   $s | Add-Member -Force initialCols 120
   $s | Add-Member -Force initialRows 35
   $s | Add-Member -Force copyOnSelect $p.copyOnSelect
   if (-not $s.profiles.defaults) { $s.profiles | Add-Member -Force defaults ([pscustomobject]@{}) }
   foreach ($prop in $p.profiles.defaults.PSObject.Properties) { $s.profiles.defaults | Add-Member -Force $prop.Name $prop.Value }
   $s.schemes = @(@($s.schemes) | Where-Object { $_ -and $_.name -ne 'Catppuccin Mocha' }) + $p.schemes
   $s.actions = @(@($s.actions) | Where-Object { $_ -and $p.actions.id -notcontains $_.id }) + $p.actions
   $s.keybindings = @(@($s.keybindings) | Where-Object { $_ -and $p.keybindings.keys -notcontains $_.keys }) + $p.keybindings
   [IO.File]::WriteAllText($wt, ($s | ConvertTo-Json -Depth 20), [Text.UTF8Encoding]::new($false))
   ```

   PowerShell profiles: copy `windows/config/powershell/Microsoft.PowerShell_profile.ps1`
   to `Documents\PowerShell\` and `WindowsPowerShell_profile.ps1` to
   `Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1`.
4. codex provider — if `~\.codex\config.toml` already exists, merge, don't
   replace: strip any existing top-level `model`/`model_provider`/
   `model_reasoning_effort` lines and any existing `[model_providers.<id>]`
   block for the same id, then put the three activation lines at the very top
   (TOML requires top-level keys before the first table header) and append
   the provider block at the end. Both come from
   `windows/config/codex/provider.toml`; replace `<cliproxy-host>` with the
   proxy's address.
5. `.wslconfig` / `wsl.conf` / `wsl-boot.vbs`: follow `setup-new-machine.md`
   phases 2-3.
6. Verify: PowerToys loads the Keyboard Manager layer (13 shortcuts;
   CapsLock comes from the registry in step 2, not from Keyboard Manager) and
   both FancyZones custom layouts.

## Version drift

Captured settings were 0.100-era PowerToys and load cleanly on 0.102. If a
future version rejects a setting it resets that module to defaults — the
valuable parts (Keyboard Manager remaps, FancyZones layouts) are plain files
that have carried cleanly so far. **Awake is reset by migrations**: after any
PowerToys upgrade, check `settings.json` → `enabled.Awake` is still `true`.
