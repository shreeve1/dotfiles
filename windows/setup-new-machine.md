# The Windows standard (how I like Windows)

What any Windows machine of mine should look like. Each phase ends with a
pass check — don't start the next until it passes. Written for the agent-host
role (Linux work in WSL2); a thin-client role runs phases 1 and 5-6 only.

## Phase 1 — Base

1. Windows 11 Pro, sign in, Windows Update.
2. Private mesh VPN: install, join with the setup key — the key is a secret,
   entered interactively, never committed.
   - Pass: the machine's mesh IP answers ping from two other fleet machines.
3. Remote access: one tool (RustDesk), unattended-access password set in the
   UI — secret, machine-local. Public rendezvous servers are fine; direct
   LAN/mesh access enabled.
   - Pass: a remote-control session from another machine works.
4. OpenSSH Server (optional, admin): Settings → Apps → Optional features.
   - Pass: `ssh` from a fleet machine works.

## Phase 2 — WSL2 + Ubuntu (agent-host role only)

1. Admin PowerShell: `wsl --install -d Ubuntu-24.04`. If only the engine
   landed, register the distro non-interactively from any shell:
   `wsl --install -d Ubuntu-24.04 --no-launch` (default user stays root; OOBE
   never runs — intended).
2. As root via `wsl -d Ubuntu-24.04 -u root`:
   - `/etc/wsl.conf`: `[boot]` `systemd=true`, `[user]` `default=<user>`
   - create the user (`useradd -m -s /bin/bash -G sudo <user>`); leave the
     password unset — root stays available via `wsl -u root`
   - `<home>/.ssh/authorized_keys` with the fleet public keys (700/600,
     correct owner)
   - From Windows, restart WSL so `wsl.conf` takes effect (systemd is not
     running until then, and `systemctl` fails):
     `wsl --shutdown`, then `wsl -d Ubuntu-24.04 -u root` again. Check with
     `ps -p 1 -o comm=`, which must print `systemd`.
   - `apt-get install openssh-server`; drop-in
     `/etc/ssh/sshd_config.d/10-port.conf` with `Port 2222` (the Windows host
     owns 22). Ubuntu 24.04 starts sshd from `ssh.socket`, which still
     listens on 22 until reloaded, so apply the port with
     `systemctl daemon-reload && systemctl restart ssh.socket ssh.service`
     and `systemctl enable ssh`. Check with `ss -ltn | grep 2222`.
3. **Idle-stop trap (WSL 3.x):** the distro stops ~60 s after the last
   session closes. systemd services do NOT hold it, and `vmIdleTimeout` is
   ignored (both `-1` and numeric). Fix: a Startup-folder script holding a
   permanent hidden session — `wsl-boot.vbs`:

   ```vbs
   CreateObject("WScript.Shell").Run "wsl.exe -d Ubuntu-24.04 -u <user> -e sleep infinity", 0, False
   ```

   - Pass: 75 s after your last WSL/ssh touch, `wsl --list --verbose` still
     shows Running and ssh on 2222 still answers.

## Phase 3 — Private reachability into WSL

`%USERPROFILE%\.wslconfig` with `[wsl2]` `networkingMode=mirrored`. The WSL
guest then answers on the host's own IPs **including the mesh VPN adapter** —
no portproxy or firewall rule is needed. NAT + `netsh portproxy` is the
documented fallback if a future WSL breaks mirrored mode.

`.wslconfig` is read only when the WSL VM starts. After writing it, run
`wsl --shutdown` and start the keepalive again (run `wsl-boot.vbs`, or sign
out and in) before the check below.

- Pass: `ssh -p 2222 <user>@<mesh-ip>` with key auth from two other machines.

## Phase 4 — herdr + pi inside WSL

1. Copy the fleet herdr binary to `~/.local/bin/herdr` (pin the fleet
   version) rather than installing fresh. Do not casually upgrade fleet
   herdr servers — an ordinary restart kills all running panes.
2. `~/.config/herdr/config.toml` from `home/herdr/config.toml` in this repo;
   `herdr config check` → ok.
3. `~/.config/systemd/user/herdr.service`, the unit wrk runs (note the
   `server` argument; without it the binary starts the interactive client):

   ```ini
   [Unit]
   Description=herdr server

   [Service]
   ExecStart=/home/<user>/.local/bin/herdr server
   Restart=on-failure

   [Install]
   WantedBy=default.target
   ```

   Then `systemctl --user enable --now herdr`, and
   `loginctl enable-linger <user>` (as root) so the user manager starts at
   boot.

- Pass: `systemctl --user is-active herdr` = active, socket exists, survives
  the phase-2 idle test.

## Phase 5 — Thin-client role

1. herdr Windows installer (stable):
   `powershell -c "irm https://herdr.dev/install.ps1 | iex"` — user-scope,
   lands in `~\.herdr\packages\...`.
2. State locations on Windows: config `%APPDATA%\herdr\config.toml` (`herdr
   --help` prints the path it reads; `HERDR_CONFIG_PATH` overrides it),
   **machine list `%LOCALAPPDATA%\herdr\client\endpoints.json`**.
3. `herdr machine add` needs a TTY — over SSH it hangs forever. Seed
   `endpoints.json` directly (format: `{"version":1,"ssh":[{"id","label",
   "target","session","enabled"}]}`, `target` = an SSH alias from
   `~/.ssh/config`).
4. SSH: one keypair per machine, public keys installed on the targets;
   `~/.ssh/config` aliases with `StrictHostKeyChecking accept-new`.

- Pass: `herdr machine list` shows the entries; `ssh <alias> echo ok` works;
  the real acceptance test is interactive — open `herdr`, attach to the
  agent-host workspace, detach, reattach, agent still alive.

## Phase 6 — Preferences

See `config-backup.md` for what's safe to copy and from where:

- CapsLock→Ctrl at the registry level (exact value
  `0000000000000000020000001D003A0000000000`; full `reg add` in
  `config-backup.md` → Restore; effective at sign-out). With this in place, PowerToys'
  Keyboard-Manager CapsLock rule is redundant but harmless.
- AutoHotkey v2 (`winget install AutoHotkey.AutoHotkey -e --scope user`)
  plus the hotstring script and a Startup-folder shortcut. The script
  contains PII — copy machine-to-machine, never commit it as-is.
- PowerToys (`winget install Microsoft.PowerToys -e`; user scope works on
  ARM64): Keyboard Manager layer (CapsLock→LCtrl plus 13 Alt-shortcuts:
  Alt+I/J/K/L arrows, Alt+U/O Home/End, Alt+P/Y PgDn/PgUp, Alt+Q
  ctrl+shift+Tab, Alt+W ctrl+W, Alt+M Backspace, Alt+N Delete, Alt+E Tab),
  two FancyZones canvas layouts, **Awake enabled** (mode: keep system awake,
  display may sleep). On a battery laptop, reconsider Awake — it defeats
  sleep entirely.
- Shell look, matching WSL zsh (starship prompt, Catppuccin Mocha, same
  history keys and aliases):
  - Dotfiles on Windows first: the PowerShell profile reads
    `~\.config\starship.toml` and `~\.config\yazi`, which only
    `install-win.ps1` links. Clone this repo to `~\dotfiles` and run
    `install-win.ps1` as the repo `README.md` describes (symlinks need
    Developer Mode or an elevated shell). The Restore steps below also run
    from that checkout.
  - Git for Windows (`winget install Git.Git -e`): needed for the clone, and
    yazi uses its `file.exe` for file types.
  - PowerShell 7 (`winget install Microsoft.PowerShell -e --scope user`).
  - CLI tools, user scope: `winget install -e --scope user --id` each of
    `Starship.Starship`, `eza-community.eza`, `sharkdp.bat`,
    `junegunn.fzf`, `ajeetdsouza.zoxide`, `sxyazi.yazi`,
    `JesseDuffield.lazygit`. winget's exit code can lie, so check each one
    with `Get-Command`.
  - JetBrains Mono Nerd Font: the nerd-fonts `JetBrainsMono.zip`, installed
    per user (copy the TTFs into `%LOCALAPPDATA%\Microsoft\Windows\Fonts`
    and add HKCU `...\CurrentVersion\Fonts` entries; no admin needed).
  - Execution policy: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.
    Without it, Windows PowerShell 5.1 refuses to load any profile.
  - Modules: `PSFzf` for 7 and 5.1, plus PSReadLine 2.4+ for 5.1 (its
    bundled 2.0 can't show history predictions). Install both with
    `Install-Module -Scope CurrentUser` from inside each shell.
  - The two profiles from `windows/config/powershell/`, and the Windows
    Terminal patch, applied as described in `config-backup.md` → Restore.
  - Pass: `(Get-Item ~\.config\starship.toml).Target` points into
    `~\dotfiles`; a new Windows Terminal tab shows the starship prompt;
    typing the start of an old command shows a grey suggestion; Ctrl+R
    opens fzf.
- herdr on Windows, only if this machine runs herdr panes on Windows itself
  (wrk does; a thin client that only attaches to remote machines does not
  need it). herdr's `default_shell` must be the full path to `pwsh.exe` (see
  the traps below), and the shared `home/herdr/config.toml` must not carry it
  because the Linux machines have no `pwsh`. So keep a Windows-only copy:

  ```powershell
  $d = "$env:APPDATA\herdr"
  $pwsh = (Get-Command pwsh).Source   # Store install: ...\WindowsApps\pwsh.exe
  $t = [IO.File]::ReadAllText("$env:USERPROFILE\dotfiles\home\herdr\config.toml", [Text.Encoding]::UTF8)
  $t = $t -replace '(?m)^\[terminal\]\r?\n', "[terminal]`ndefault_shell = '$pwsh'`n"
  [IO.File]::WriteAllText("$d\config.windows.toml", $t, [Text.UTF8Encoding]::new($false))
  [Environment]::SetEnvironmentVariable('HERDR_CONFIG_PATH', "$d\config.windows.toml", 'User')
  herdr config check
  ```

  Re-run it after changing the shared config. Then restart the herdr server
  from a terminal that is not inside herdr (`herdr server stop`, then
  `herdr` in a new Windows Terminal tab).
  - Pass: `$PSVersionTable.PSVersion` in a new herdr pane is 7.x.
- codex custom provider block (placeholder URL in the committed copy).

## Phase 7 — Reboot validation

Reboot, sign in once, touch nothing. Then from another machine: ssh into WSL
on 2222, `systemctl --user is-active herdr` = active, and it stays that way
past 75 s. That's the one test proving the keepalive survives reality.

**Standing caveat:** everything starts at *sign-in* (Startup-folder bound).
After an unattended reboot — power cut, updates — the agent host is dark
until someone signs in once. If that matters, Windows auto-login is the
lever; it trades physical-access security for unattended reachability.

**Sleep rule:** a machine hosting agents must not sleep — Awake is what
enforces it (Phase 6). Work that must survive any desktop going down belongs
on the always-on server, not on a desktop.

## Traps learned the hard way

- **Anything spawned over SSH dies when the SSH session ends** (exit
  `0xC000013A`). Keepalives and app starts must come from sign-in context
  (Startup folder) or a logon scheduled task — never from a remote shell.
- Scheduled-task-launched **GUI** apps (tray apps like PowerToys) exit
  immediately in non-interactive contexts. Configure while stopped; they
  self-start at the next sign-in.
- `wsl.exe --install --no-launch` is the non-interactive registration path;
  plain `--install` without the follow-up reboot leaves "no installed
  distributions".
- PowerShell over SSH mangles quoted args (use `-EncodedCommand`);
  `Compress-Archive` fails silently over SSH (use `tar.exe`); scp to Windows
  needs **relative** destination paths.
- In PowerShell single-quoted strings, `\n` and `\\` are literal — generated
  files get corrupted. `Set-Content` with an array of lines is the safe
  pattern.
- winget under SSH needs its full path
  (`%LOCALAPPDATA%\Microsoft\WindowsApps\winget.exe`), and **exit code 0 can
  lie** — always verify the binary landed.
- **herdr's `default_shell` needs a full path to the program.** herdr starts
  panes with `CreateProcessW`, which doesn't search PATH, so `'pwsh'` fails
  with "cannot find the file specified". PowerShell 7 from the Store lives at
  `%LOCALAPPDATA%\Microsoft\WindowsApps\pwsh.exe`. Put the setting in a
  Windows-only copy of the herdr config (`config.windows.toml`, selected with
  the user env var `HERDR_CONFIG_PATH`), never in the shared
  `home/herdr/config.toml`: the Linux machines have no `pwsh`.
- An `herdr server stop` run from inside a herdr pane kills that pane, and
  any agent in it, before the server comes back. Restart herdr from a
  terminal that isn't running under it.
- Windows Terminal's `settings.json` may start with a UTF-8 BOM, which
  breaks plain JSON parsers. Edit it with PowerShell's `ConvertFrom-Json`.
- On ARM64 Windows: x86_64 binaries (herdr, Oh My Posh, AutoHotkey) run fine
  emulated; PowerToys installs user-scope natively; PowerShell 7 arm64 via
  the GitHub zip if winget balks. If emulated herdr ever misbehaves, the
  fallback is WSL ARM64 Ubuntu + the native aarch64 herdr inside.
