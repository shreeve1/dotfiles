# WSL2 as a work machine

How WSL2 Ubuntu on a Windows machine gets the same pi, shell and terminal as
the fleet's Linux machines, and how Windows tools share its project folders.
Written from the 2026-10-21 setup of `wrk`, which is now the reference: copy
machine-local files from wrk's WSL home. It follows `setup-new-machine.md`
phases 2-4; do those first. Commands assume x86_64 or aarch64 Ubuntu 24.04.

## Phase A — Base tools and sudo

1. Passwordless sudo for your user, so agents and installers never stall on
   a prompt. Run as root (`wsl -d Ubuntu-24.04 -u root`), and check the file
   with `visudo` before installing it, so a typo cannot lock you out:

   ```bash
   printf '%s ALL=(ALL) NOPASSWD:ALL\n' "<user>" > /tmp/u.sudoers
   visudo -cf /tmp/u.sudoers && install -o root -g root -m 0440 /tmp/u.sudoers /etc/sudoers.d/<user>
   ```

   The trade-off: anything running as you in WSL gets root without asking,
   and WSL can write to your Windows files under `/mnt/c`. Undo with
   `wsl -d Ubuntu-24.04 -u root rm /etc/sudoers.d/<user>`.

2. As your user, create the folders everything below installs into and put
   them on PATH for this shell and every later one. A fresh home has no
   `~/.local`, and nothing else adds these to PATH until Phase C:

   ```bash
   mkdir -p ~/.local/bin ~/.local/opt ~/.npm-global/bin
   export PATH="$HOME/.local/bin:$HOME/.npm-global/bin:$PATH"
   echo 'export PATH="$HOME/.local/bin:$HOME/.npm-global/bin:$PATH"' >> ~/.profile
   ```

3. Packages: `sudo apt install -y git curl xz-utils zsh unzip make ripgrep
   fd-find jq btop ffmpegthumbnailer p7zip-full poppler-utils imagemagick
   chafa wslu xclip`. Ubuntu names fd `fdfind`, so add
   `ln -sfn /usr/bin/fdfind ~/.local/bin/fd`.

4. Linux Node, matching the Windows version, with its own global npm folder:

   ```bash
   V=v24.22.0
   case "$(uname -m)" in x86_64) NA=x64 ;; aarch64) NA=arm64 ;; esac
   curl -fsSL "https://nodejs.org/dist/$V/node-$V-linux-$NA.tar.xz" | tar -xJ -C ~/.local/opt
   for b in node npm npx; do ln -sfn ~/.local/opt/node-$V-linux-$NA/bin/$b ~/.local/bin/$b; done
   hash -r
   command -v npm   # must print /home/<user>/.local/bin/npm before the next line
   npm config set prefix ~/.npm-global
   ```

   **Trap:** if `~/.local/bin` is not first on PATH, WSL silently runs the
   Windows `npm` from `/mnt/c/Program Files/nodejs`, and installs land in
   `%APPDATA%\npm`.

- Pass: `command -v node npm` both point into `~/.local/bin`, and
  `npm config get prefix` is `~/.npm-global`.

## Phase B — Dotfiles and pi

1. Clone this repo to `~/dotfiles` (WSL's own copy, separate from the
   Windows one) and run `bash install.sh` **from a shell where
   `command -v herdr` prints the pinned binary** from `setup-new-machine.md`
   Phase 4. If herdr is not on PATH, `install.sh` downloads the latest upstream
   herdr over it. The installer backs up the stock `.bashrc` as
   `.bashrc-bak-<stamp>` and links `~/.pi/agent`, `~/.agents`, `.zshrc` and
   `~/.config/*`.
2. `npm install -g @earendil-works/pi-coding-agent@<fleet version>`, the same
   version as the other machines.
3. Copy `auth.json` and `models.json` from another machine into
   `~/.pi/agent/` (`chmod 600`). They are gitignored secrets.
4. Seed settings and install the packages as in the repo `README.md` ("Pi on
   another system"): copy `settings.json.template`, `pi install` the three
   packages, then copy the template over `settings.json` again to restore
   the filtered pi-fabric entry.
5. `uv` (`curl -LsSf https://astral.sh/uv/install.sh | sh`), then re-run
   `install.sh`: with `uv` present it pins `ruff`, which the pre-push hook
   requires. Also `uv tool install graphifyy`.

- Pass: `install.sh` prints `ok: pi-fabric installed, Coral Bricks filtered`;
  `pi --list-models | grep -c coralbricks` is 0; from a project folder
  `pi -p "Reply with exactly: OK"` answers.

## Phase C — Shell and terminal tools

The fleet's shell is zsh with oh-my-zsh and the dotfiles `.zshrc`. The
"remembers commands" behaviour is three oh-my-zsh plugins plus fzf:
zsh-autosuggestions (grey suggestions as you type),
zsh-history-substring-search (Up/Down search by what you've typed) and
zsh-syntax-highlighting, with fzf on Ctrl+R.

1. oh-my-zsh without touching the linked `.zshrc`:
   `RUNZSH=no CHSH=no KEEP_ZSHRC=yes sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"`,
   then clone the three `zsh-users/*` plugins into
   `~/.oh-my-zsh/custom/plugins/`.
2. `sudo chsh -s /usr/bin/zsh <user>`.
3. Terminal tools: `bash ~/dotfiles/windows/wsl/install-terminal-tools.sh`.
   It installs the latest upstream Linux releases of yazi (with `ya`), eza,
   bat, vivid, fzf, starship, zellij, lazygit, zoxide, gh, fastfetch and nvim
   into `~/.local/bin`, for x86_64 or aarch64, and exits non-zero if any tool
   failed. Ubuntu 24.04's packages are too old (nvim 0.9 against a config
   needing 0.10+) or missing.
4. `~/.zshenv`, machine-local and not in the repo:

   ```bash
   export PATH="$HOME/.local/bin:$HOME/.npm-global/bin:$PATH"
   ```

   **Trap:** `.zshrc` sets up fzf before it adds `~/.local/bin` to PATH. Where
   fzf comes from a distro package in `/usr/bin` that is fine; here fzf is
   not found in time and Ctrl+R silently stays the plain built-in search.
5. btop: copy the committed snapshot (Tokyo Night theme, taken from wrk):

   ```bash
   mkdir -p ~/.config/btop/themes
   cp ~/dotfiles/windows/wsl/btop/btop.conf ~/.config/btop/
   cp ~/dotfiles/windows/wsl/btop/themes/current.theme ~/.config/btop/themes/
   ```

6. `nvim --headless "+Lazy! sync" +qa` once, so plugins install up front.
7. `~/.zshrc.secrets` (`chmod 600`): copy it from wrk's WSL home with
   `scp`. It's machine-local, never committed, and `.zshrc` loads it if
   present. Check what it points at exists on the new machine (on wrk it sets
   `DPI_ENV_FILE` to a pi-durable `.env`).

- Pass: `install-terminal-tools.sh` exits 0; in `zsh -i`,
  `bindkey -M viins '^R'` shows `fzf-history-widget` and `alias ls` shows
  eza.

**Trap — herdr keeps the old shell.** `herdr.service` (a systemd user unit)
starts at boot and hands every new pane the `SHELL` it started with. After
`chsh`, panes stay bash until the service restarts:
`systemctl --user set-environment SHELL=/usr/bin/zsh && systemctl --user restart herdr`.
The restart closes every WSL herdr pane.

**Trap — no blinking cursor in pi.** On WSL, herdr draws its own steady
cursor by default; the shared `home/herdr/config.toml` sets
`host_cursor = "native"` to use Windows Terminal's blinking one instead.
See `setup-new-machine.md` → Traps. After pulling a config change,
`herdr server reload-config` applies it without closing panes.

For the agents' browser, follow `agent-browser.md` once this phase passes.

## Phase D — GitHub push from WSL

Pulling this public repo needs no login; pushing does.

1. Copy the personal GitHub key into `~/.ssh` (`chmod 600`) and add the same
   `github-personal` host block as on Windows (`ssh.github.com`, port 443,
   `IdentitiesOnly yes`). Plain `github.com` is mapped to a work key on
   Windows and authenticates as the wrong account.
2. `git remote set-url origin git@github-personal:shreeve1/dotfiles.git`, and
   set git's global `user.name` and `user.email` on both Windows and WSL.
   Without them, commits land as `<user>@localhost`.

- Pass: `ssh -T git@github-personal` greets the personal account, and
  `git push --dry-run origin HEAD` passes the pre-push hook.

## Sharing a project folder with Windows

Keep the project on the Windows drive (for example
`C:\Users\<user>\Documents\<project>`) when Windows apps need it: Obsidian,
Syncthing. WSL sees it at `/mnt/c/...`; add a shortcut with
`ln -s /mnt/c/Users/<user>/Documents/<project> ~/<project>`.

- **Run `git config core.filemode false` in that repo.** Windows drives
  report every file as executable to WSL, so without it `git status` in WSL
  lists every file as a `100644 → 100755` mode change (2,426 of them on the
  first repo).
- Leave `core.autocrlf` unset on both sides; check with
  `git ls-files --eol` that both report the same line endings.
- WSL is slower on `/mnt/c` than on its own disk. It's fine for editing and
  agents; a big `git status` or a search over thousands of files is
  noticeably slower.
- Don't run git from both sides at once; they share one `.git` folder.
- WSL agents read their global config from the WSL home (`~/.pi`,
  `~/.agents`), not from `C:\Users\...`. Install them from dotfiles as
  above rather than linking the Windows folders: those carry Windows paths
  and Windows builds of extension packages.
