# WSL2 as a work machine

How WSL2 Ubuntu on a Windows machine gets the same pi, shell and terminal as
the Linux machines, and how Windows tools share its project folders. Written
from the 2026-10-21 setup of `wrk`. It follows `setup-new-machine.md`
phases 2-4; do those first.

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

2. Packages: `sudo apt install -y zsh unzip make ripgrep fd-find jq btop
   ffmpegthumbnailer p7zip-full poppler-utils imagemagick chafa wslu xclip`.
   Ubuntu names fd `fdfind`, so add `ln -s /usr/bin/fdfind ~/.local/bin/fd`.

3. Linux Node, matching the Windows version, under `~/.local` with its own
   global npm folder:

   ```bash
   V=v24.22.0
   curl -fsSL https://nodejs.org/dist/$V/node-$V-linux-x64.tar.xz | tar -xJ -C ~/.local/opt
   for b in node npm npx; do ln -sfn ~/.local/opt/node-$V-linux-x64/bin/$b ~/.local/bin/$b; done
   npm config set prefix ~/.npm-global
   ```

   **Trap:** without this, WSL silently runs the Windows `npm` from
   `/mnt/c/Program Files/nodejs`, and installs land in `%APPDATA%\npm`.

- Pass: `command -v node npm` both point into `~/.local/bin`, and
  `npm config get prefix` is `~/.npm-global`.

## Phase B — Dotfiles and pi

1. Clone this repo to `~/dotfiles` (WSL's own copy, separate from the
   Windows one) and run `bash install.sh`. It backs up the stock `.bashrc` as
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

## Phase C — Shell and terminal tools (match Omarchy)

Omarchy's shell is zsh with oh-my-zsh and the dotfiles `.zshrc`. The
"remembers commands" behaviour is three oh-my-zsh plugins plus fzf:
zsh-autosuggestions (grey suggestions as you type),
zsh-history-substring-search (Up/Down search by what you've typed) and
zsh-syntax-highlighting, with fzf on Ctrl+R.

1. oh-my-zsh without touching the linked `.zshrc`:
   `RUNZSH=no CHSH=no KEEP_ZSHRC=yes sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"`,
   then clone the three `zsh-users/*` plugins into
   `~/.oh-my-zsh/custom/plugins/`.
2. `sudo chsh -s /usr/bin/zsh <user>`.
3. Terminal tools from their upstream Linux releases into `~/.local/bin`.
   Ubuntu 24.04's packages are too old (nvim 0.9 against a config needing
   0.10+) or missing: yazi (with `ya`), eza, bat, vivid, fzf, starship,
   zellij, lazygit, zoxide, gh, fastfetch, and nvim (keep its whole folder
   under `~/.local/opt`, not just the binary).
4. `~/.zshenv`, machine-local and not in the repo:

   ```bash
   export PATH="$HOME/.local/bin:$HOME/.npm-global/bin:$PATH"
   ```

   **Trap:** `.zshrc` sets up fzf before it adds `~/.local/bin` to PATH. On
   Omarchy fzf is in `/usr/bin`, so it works there; in WSL fzf is not found
   in time and Ctrl+R silently stays the plain built-in search.
5. btop: copy `~/.config/btop/btop.conf` and the active theme file from
   Omarchy (`~/.local/state/omarchy/current/theme/btop.theme` to
   `~/.config/btop/themes/current.theme`). It is a snapshot: it won't follow
   later Omarchy theme switches.
6. `nvim --headless "+Lazy! sync" +qa` once, so plugins install up front.
7. `~/.zshrc.secrets` from Omarchy (`chmod 600`). It's machine-local,
   never committed, and `.zshrc` loads it if present.

- Pass: in `zsh -i`, `bindkey -M viins '^R'` shows `fzf-history-widget`,
  and `alias ls` shows eza.

**Trap — herdr keeps the old shell.** `herdr.service` (a systemd user unit)
starts at boot and hands every new pane the `SHELL` it started with. After
`chsh`, panes stay bash until the service restarts:
`systemctl --user set-environment SHELL=/usr/bin/zsh && systemctl --user restart herdr`.
The restart closes every WSL herdr pane.

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
