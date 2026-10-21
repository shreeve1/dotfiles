# The agents' browser on Windows

How a Windows machine gets the agent browser the omarchy laptop had: a
second Chrome with its own profile and remote control on port 9222, driven
through `agent-browser`. Several agents share the one browser: each opens
its own tab, and clicks and typing take turns through one lock. Written from
the 2026-10-21 setups of `wrk` (with WSL) and `surftop` (without). How
agents *use* it lives in the `browser-cdp` skill
(`.agents/skills/browser-cdp/SKILL.md`, section "On Windows"); this doc only
builds it.

There are two routes, and `install-win.ps1` picks one for you:

- **With WSL** (wrk): agent-browser lives in WSL, and native Windows pi
  borrows the WSL commands. WSL agents and Windows agents share one lock.
  Do `wsl-dev-setup.md` Phases A and B first, then every phase below.
- **Without WSL** (surftop): agent-browser is a Windows npm install and the
  scripts run natively in Git Bash. Skip Phase A; do Phase A2 instead, and
  skip Phase D.

## How it fits together

- **One Chrome, on Windows.** `windows/bin/chrome-cdp.ps1` starts
  `C:\Program Files\Google\Chrome\Application\chrome.exe` minimized, on
  the profile `%LOCALAPPDATA%\chrome-cdp`, with port 9222 open. Your
  everyday Chrome is untouched: Chrome refuses remote control on its default
  profile, which is why the agent one has its own.
- **One agent-browser, in WSL.** `agent-browser`, `ab`, `ab-input` and the
  input lock (`/run/user/1000/agent-browser-chrome-9222-input.lock`) all
  live in Ubuntu. WSL reaches the Windows Chrome at `127.0.0.1:9222`
  because mirrored networking shares the two sides' localhost.
- **Windows pi borrows the WSL commands.** `install-win.ps1` writes three
  small scripts, `~/bin/ab`, `~/bin/ab-input` and `~/bin/chrome-cdp`, that
  run the WSL command of the same name through
  `windows/bin/wsl-browser`. Both sides therefore hit the same lock, which
  is what lets them work at the same time.
- `chrome-cdp` is the same `bin/chrome-cdp` the laptop used; on Windows
  (from WSL or Git Bash) it hands off to the PowerShell launcher.
- **Without WSL** the last two points change: `ab`, `ab-input` and
  `chrome-cdp` are linked into `~/.local/bin` and run in Git Bash, and the
  lock is a directory (`%LOCALAPPDATA%\agent-browser-chrome-9222-input.lock.d`)
  holding its owner's Windows PID, because Git Bash has no `flock`.

## Phase A — WSL side

1. Check `%USERPROFILE%\.wslconfig` has `networkingMode=mirrored` (the
   committed copy in `config/wsl/` does). Without it WSL cannot see the
   Windows Chrome on `127.0.0.1`.
2. In WSL: `npm install -g agent-browser@0.39.1`. npm warns that it skipped
   the package's install script; 0.39.1 works without it.
3. Re-run `bash ~/dotfiles/install.sh`. It links `chrome-cdp`, `ab` and
   `ab-input` into `~/.local/bin`.

- Pass: `command -v agent-browser chrome-cdp ab ab-input` prints four paths
  under `~/.npm-global/bin` and `~/.local/bin`, and
  `agent-browser --version` prints `0.39.1`.

## Phase A2 — Without WSL: agent-browser on Windows

1. `npm install -g agent-browser@0.39.1` from PowerShell. On ARM64 (surftop)
   it installs the x64 binary, which runs under emulation.

- Pass: `agent-browser --version` prints `0.39.1`.

## Phase B — Windows side

1. Google Chrome installed for all users, so it is at
   `C:\Program Files\Google\Chrome\Application\chrome.exe`. The launcher
   uses that path only.
2. From the Windows checkout, run `.\install-win.ps1`. With WSL it prints
   `ok: ~\bin\ab -> WSL ab` (and the same for `ab-input` and
   `chrome-cdp`). Without WSL it links the three into `~/.local/bin` and
   adds that folder to your user PATH.

- Pass: in a new Git Bash (the shell Windows pi uses), `command -v ab`
  prints `/c/Users/<user>/bin/ab` (with WSL) or
  `/c/Users/<user>/.local/bin/ab` (without). If it prints nothing, that
  folder is not on the shell's PATH.

## Phase C — Start it and bring your logins

1. From either side, run `chrome-cdp`. It prints `ready on port 9222` and the
   Chrome sits minimized on the taskbar. A second run prints
   `already running on port 9222`.
2. Optional, to start from your everyday Chrome's logins: close **every**
   Chrome window (the agent one too), then run `chrome-cdp -Seed`. It copies
   your `Default` profile in and starts the agent Chrome. While any Chrome is
   open it refuses with `close every Chrome window first`.

   Expect some sites to ask you to sign in again: on the laptop, Microsoft
   and Amazon did, and Web Store extensions came across half-broken until
   reinstalled. Windows Chrome encrypts saved logins per profile, and on
   surftop none carried over (Google and GitHub came up signed out).
   Signing in once inside the agent Chrome is the fallback, and those
   logins stick. Re-running `-Seed`
   later wipes logins made only in the agent Chrome.

- Pass: `curl -s http://127.0.0.1:9222/json/version` answers from Git Bash
  (and from WSL, with WSL).

## Phase D — With WSL: prove both sides work at once

Run these at the same moment, one in WSL and one in Git Bash:

```bash
export AB_SESSION=test-wsl; ab-input --json open 'https://example.com/?side=wsl'; ab get url
export AB_SESSION=test-win; ab-input --json open 'https://example.com/?side=win'; ab get url
```

- Pass: each prints its own `?side=` URL. Close the two test tabs with
  `ab-input tab close <targetId>`, using the `targetId` each `open` printed.

## Traps

- **Line endings.** The Windows checkout has `core.autocrlf=true`, which
  gives shell scripts Windows line endings; bash then fails with
  `bash\r: No such file or directory`. `.gitattributes` pins the browser
  scripts to LF, so a fresh checkout is fine. WSL still runs everything from
  its own `~/dotfiles`, as `wsl-dev-setup.md` sets up.
- **Without WSL, call agent-browser only through `ab`/`ab-input`.** The
  first call starts a background daemon that inherits stdout and keeps a
  captured pipe open, so a direct `agent-browser` call in a pipe never
  returns. The scripts route its output through a temporary file instead.
- **The lock must not leak into the daemon.** The first `ab-input` call
  starts agent-browser's background daemon, which stays running. Before
  2026-10-21 `ab-input` ran `flock` without `-o`, the daemon inherited the
  lock, and every later `ab-input` waited 60 seconds and failed. If
  `ab-input` ever exits 254 with nothing else running, check that the `-o`
  is still there, then find the holder:
  `for p in /proc/[0-9]*; do ls -l $p/fd 2>/dev/null | grep -q input.lock && echo $p; done`.
- **Stubs, not symlinks.** Windows symlinks need admin or Developer Mode,
  so `install-win.ps1` writes the `~/bin` scripts as plain files. Re-run it
  if the checkout moves.
- **File paths from Windows pi are WSL paths.** A screenshot or download
  path given to `ab-input` from Git Bash is read by WSL: use
  `/mnt/c/Users/<user>/x.png`, not `C:\...`.
- **Only `ab` and `ab-input` take turns.** An agent that talks to port 9222
  directly, or uses its own browser tool, ignores the lock.
- **Anything on this machine can drive this browser.** Port 9222 gives full
  control of the agent profile to every local process, so keep banking and
  primary email out of it.

## Removing it

Stop the agent Chrome (close its window), delete `%LOCALAPPDATA%\chrome-cdp`
and `~/bin/{ab,ab-input,chrome-cdp}` (or `~/.local/bin/...` without WSL) on
Windows, and `npm uninstall -g agent-browser` wherever it was installed.
