#!/usr/bin/env bash
# Install the terminal tools the dotfiles .zshrc and configs expect, from their
# upstream Linux releases, into ~/.local/bin (nvim keeps its folder under
# ~/.local/opt). Ubuntu 24.04's packages are too old or missing. Re-running
# replaces each tool with the latest release. Works on x86_64 and aarch64.
#
#   bash ~/dotfiles/windows/wsl/install-terminal-tools.sh
#
# Needs curl, jq and unzip (windows/wsl-dev-setup.md Phase A).
set -euo pipefail

BIN="$HOME/.local/bin"
OPT="$HOME/.local/opt"
mkdir -p "$BIN" "$OPT"

case "$(uname -m)" in
x86_64) A=x86_64 GO=amd64 FF=amd64 NV=x86_64 ;;
aarch64 | arm64) A=aarch64 GO=arm64 FF=aarch64 NV=arm64 ;;
*)
  echo "unsupported architecture: $(uname -m)" >&2
  exit 2
  ;;
esac

failed=0

# install_release REPO ASSET_REGEX BINARY... : download the newest release
# asset whose name matches ASSET_REGEX and install the named binaries.
install_release() {
  local repo="$1" pattern="$2"
  shift 2
  local url tmp bin found
  url=$(curl -fsSL "https://api.github.com/repos/$repo/releases/latest" |
    jq -r --arg re "$pattern" '.assets[] | select(.name | test($re)) | .browser_download_url' |
    head -n 1)
  if [ -z "$url" ]; then
    echo "FAIL $repo: no release asset matches $pattern" >&2
    failed=1
    return 0
  fi
  tmp=$(mktemp -d)
  curl -fsSL "$url" -o "$tmp/archive"
  mkdir "$tmp/x"
  case "$url" in
  *.zip) unzip -q "$tmp/archive" -d "$tmp/x" ;;
  *) tar -xf "$tmp/archive" -C "$tmp/x" ;;
  esac
  for bin in "$@"; do
    found=$(find "$tmp/x" -type f -name "$bin" | head -n 1)
    if [ -n "$found" ]; then
      install -m 755 "$found" "$BIN/$bin"
    else
      echo "FAIL $repo: $bin not in $(basename "$url")" >&2
      failed=1
    fi
  done
  echo "ok $repo <- $(basename "$url")"
  rm -rf "$tmp"
}

install_release sxyazi/yazi "^yazi-$A-unknown-linux-gnu\\.zip$" yazi ya
install_release eza-community/eza "^eza_$A-unknown-linux-gnu\\.tar\\.gz$" eza
install_release sharkdp/bat "^bat-v.*-$A-unknown-linux-gnu\\.tar\\.gz$" bat
install_release sharkdp/vivid "^vivid-v.*-$A-unknown-linux-gnu\\.tar\\.gz$" vivid
install_release junegunn/fzf "linux_$GO\\.tar\\.gz$" fzf
install_release starship/starship "^starship-$A-unknown-linux-musl\\.tar\\.gz$" starship
install_release zellij-org/zellij "^zellij-$A-unknown-linux-musl\\.tar\\.gz$" zellij
install_release jesseduffield/lazygit "linux_$([ "$A" = x86_64 ] && echo x86_64 || echo arm64)\\.tar\\.gz$" lazygit
install_release ajeetdsouza/zoxide "$A-unknown-linux-musl\\.tar\\.gz$" zoxide
install_release cli/cli "linux_$GO\\.tar\\.gz$" gh
install_release fastfetch-cli/fastfetch "^fastfetch-linux-$FF\\.tar\\.gz$" fastfetch

# nvim needs its runtime folder next to the binary.
rm -rf "$OPT/nvim-linux-$NV"
curl -fsSL "https://github.com/neovim/neovim/releases/latest/download/nvim-linux-$NV.tar.gz" |
  tar -xz -C "$OPT"
ln -sfn "$OPT/nvim-linux-$NV/bin/nvim" "$BIN/nvim"
echo "ok neovim/neovim <- nvim-linux-$NV.tar.gz"

# Ubuntu installs fd as fdfind.
if command -v fdfind >/dev/null 2>&1; then
  ln -sfn "$(command -v fdfind)" "$BIN/fd"
fi

exit "$failed"
