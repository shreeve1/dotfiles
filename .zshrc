export PATH="$PATH:/snap/bin"

# Free ctrl+s/ctrl+q from TTY flow control so tools that use them as a prefix
# (herdr prefix=ctrl+s, tmux prefix=C-s) actually receive the keystroke.
# Skip in non-interactive contexts (scp, scripts, IDE shells) where stdin is
# not a TTY — stty would error out.
[[ -t 0 ]] && stty -ixon

# Platform detection
case "$(uname -s)" in
  Darwin) IS_MACOS=1; IS_LINUX=0 ;;
  Linux)  IS_MACOS=0; IS_LINUX=1 ;;
  *)      IS_MACOS=0; IS_LINUX=0 ;;
esac

# OPENSPEC:START
# OpenSpec shell completions configuration
fpath=("$HOME/.oh-my-zsh/custom/completions" $fpath)
autoload -Uz compinit
compinit
# OPENSPEC:END

# If you come from bash you might have to change your $PATH.
# export PATH=$HOME/bin:$HOME/.local/bin:/usr/local/bin:$PATH

# Path to your Oh My Zsh installation.
export ZSH="$HOME/.oh-my-zsh"

# Set name of the theme to load --- if set to "random", it will
# load a random theme each time Oh My Zsh is loaded, in which case,
# to know which specific one was loaded, run: echo $RANDOM_THEME
# See https://github.com/ohmyzsh/ohmyzsh/wiki/Themes
ZSH_THEME=""

# Set list of themes to pick from when loading at random
# Setting this variable when ZSH_THEME=random will cause zsh to load
# a theme from this variable instead of looking in $ZSH/themes/
# If set to an empty array, this variable will have no effect.
# ZSH_THEME_RANDOM_CANDIDATES=( "robbyrussell" "agnoster" )

# Uncomment the following line to use case-sensitive completion.
# CASE_SENSITIVE="true"

# Uncomment the following line to use hyphen-insensitive completion.
# Case-sensitive completion must be off. _ and - will be interchangeable.
# HYPHEN_INSENSITIVE="true"

# Uncomment one of the following lines to change the auto-update behavior
# zstyle ':omz:update' mode disabled  # disable automatic updates
# zstyle ':omz:update' mode auto      # update automatically without asking
# zstyle ':omz:update' mode reminder  # just remind me to update when it's time

# Uncomment the following line to change how often to auto-update (in days).
# zstyle ':omz:update' frequency 13

# Uncomment the following line if pasting URLs and other text is messed up.
# DISABLE_MAGIC_FUNCTIONS="true"

# Uncomment the following line to disable colors in ls.
# DISABLE_LS_COLORS="true"

# Uncomment the following line to disable auto-setting terminal title.
# DISABLE_AUTO_TITLE="true"

# Uncomment the following line to enable command auto-correction.
# ENABLE_CORRECTION="true"

# Uncomment the following line to display red dots whilst waiting for completion.
# You can also set it to another string to have that shown instead of the default red dots.
# e.g. COMPLETION_WAITING_DOTS="%F{yellow}waiting...%f"
# Caution: this setting can cause issues with multiline prompts in zsh < 5.7.1 (see #5765)
# COMPLETION_WAITING_DOTS="true"

# Uncomment the following line if you want to disable marking untracked files
# under VCS as dirty. This makes repository status check for large repositories
# much, much faster.
# DISABLE_UNTRACKED_FILES_DIRTY="true"

# Uncomment the following line if you want to change the command execution time
# stamp shown in the history command output.
# You can set one of the optional three formats:
# "mm/dd/yyyy"|"dd.mm.yyyy"|"yyyy-mm-dd"
# or set a custom format using the strftime function format specifications,
# see 'man strftime' for details.
# HIST_STAMPS="mm/dd/yyyy"

# Would you like to use another custom folder than $ZSH/custom?
# ZSH_CUSTOM=/path/to/new-custom-folder

# Which plugins would you like to load?
# Standard plugins can be found in $ZSH/plugins/
# Custom plugins may be added to $ZSH_CUSTOM/plugins/
# Example format: plugins=(rails git textmate ruby lighthouse)
# Add wisely, as too many plugins slow down shell startup.
if [[ $IS_MACOS -eq 1 ]]; then
  plugins=(git z brew macos vscode docker npm node python pip brew zsh-autosuggestions zsh-syntax-highlighting zsh-history-substring-search)
else
  plugins=(git z docker npm node python pip zsh-autosuggestions zsh-syntax-highlighting zsh-history-substring-search)
fi

source $ZSH/oh-my-zsh.sh

# fzf configuration (support old fzf without --zsh)
if fzf --zsh >/dev/null 2>&1; then
  source <(fzf --zsh)
else
  [[ -f /usr/share/doc/fzf/examples/key-bindings.zsh ]] && source /usr/share/doc/fzf/examples/key-bindings.zsh
  [[ -f /usr/share/doc/fzf/examples/completion.zsh ]] && source /usr/share/doc/fzf/examples/completion.zsh
fi

# History configuration
HISTFILE=~/.zsh_history
HISTSIZE=10000
SAVEHIST=10000
setopt HIST_IGNORE_DUPS      # Don't record duplicate entries
setopt HIST_IGNORE_SPACE     # Don't record commands starting with space
setopt SHARE_HISTORY         # Share history across terminals

# History substring search key bindings
bindkey '^[[A' history-substring-search-up
bindkey '^[[B' history-substring-search-down
bindkey '^[OA' history-substring-search-up
bindkey '^[OB' history-substring-search-down

# User configuration

# export MANPATH="/usr/local/man:$MANPATH"

# You may need to manually set your language environment
# export LANG=en_US.UTF-8

# Preferred editor
export EDITOR='nvim'
export VISUAL='nvim'

# Compilation flags
# export ARCHFLAGS="-arch $(uname -m)"

# Set personal aliases, overriding those provided by Oh My Zsh libs,
# plugins, and themes. Aliases can be placed here, though Oh My Zsh
# users are encouraged to define aliases within a top-level file in
# the $ZSH_CUSTOM folder, with .zsh extension. Examples:
# - $ZSH_CUSTOM/aliases.zsh
# - $ZSH_CUSTOM/macos.zsh
# For a full list of active aliases, run `alias`.
#
# Example aliases
# alias zshconfig="mate ~/.zshrc"
# alias ohmyzsh="mate ~/.oh-my-zsh"

# Ensure user-local binaries are on PATH before initializing tools below
export PATH="$HOME/.local/bin:$HOME/.atuin/bin:$PATH"

# Fall back to a known TERM when the server lacks the client's terminfo entry.
# Prevents character-echo glitches on SSH from Ghostty to hosts without xterm-ghostty.
if ! infocmp "$TERM" >/dev/null 2>&1; then
  export TERM=xterm-256color
fi

# Starship prompt
eval "$(starship init zsh)"

# Atuin shell history
eval "$(atuin init zsh --disable-up-arrow)"

# LS_COLORS via vivid (Catppuccin Mocha)
export LS_COLORS="$(vivid generate catppuccin-mocha)"

# eza aliases for better ls command
alias ls='eza --icons --group-directories-first'
alias ll='eza -l --icons --no-user --group-directories-first --time-style long-iso'
alias la='eza -la --icons --no-user --group-directories-first --time-style long-iso'
alias cat='bat'

# ── Machine identity (portable: Linux primary, macOS fallback) ──
# THIS_IP: this box's primary egress IPv4 (Linux via default route, macOS via en0).
# YAZI_PULL_HOST: host for scp-pull commands emitted by yazi — prefer the exact
# IP the current SSH client reached (guaranteed routable back), else THIS_IP.
export THIS_IP="$(ip -4 route get 1.1.1.1 2>/dev/null | grep -oP 'src \K[0-9.]+' || ipconfig getifaddr en0 2>/dev/null || echo)"
export YAZI_PULL_HOST="${SSH_CONNECTION:+$(awk '{print $3}' <<<"$SSH_CONNECTION")}"
export YAZI_PULL_HOST="${YAZI_PULL_HOST:-$THIS_IP}"

# bun completions
[ -s "$HOME/.bun/_bun" ] && source "$HOME/.bun/_bun"

# bun
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

# npm global binaries
export PATH="$HOME/.npm-global/bin:$PATH"

# OpenCode network access
# alias opencode='opencode --hostname 0.0.0.0 --mdns'

# Claude Code provider switching
claude-provider() {
    ~/.claude/switch-provider.sh "$@"
}
alias claude-anthropic='claude-provider anthropic'
alias claude-zai='claude-provider zai'
alias claude-moonshot='claude-provider moonshot'
alias claude-alibaba='claude-provider alibaba'
alias claude-openrouter='claude-provider openrouter'
alias claude-minimax='claude-provider minimax'
alias claude-openai='claude-provider openai'
alias cc='claude'

# Android SDK
if [[ $IS_MACOS -eq 1 ]]; then
  export ANDROID_HOME=$HOME/Library/Android/sdk
else
  export ANDROID_HOME=$HOME/Android/Sdk
fi
[[ -d "$ANDROID_HOME" ]] && export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools

# Java (OpenJDK)
if [[ $IS_MACOS -eq 1 ]]; then
  export JAVA_HOME=/opt/homebrew/opt/openjdk
  export PATH="/opt/homebrew/opt/openjdk/bin:$PATH"
elif [[ -d /usr/lib/jvm/java-*/ ]]; then
  export JAVA_HOME=$(dirname $(dirname $(readlink -f $(which java) 2>/dev/null) 2>/dev/null) 2>/dev/null)
  [[ -n "$JAVA_HOME" ]] && export PATH="$JAVA_HOME/bin:$PATH"
fi
export ENABLE_EXPERIMENTAL_MCP_CLI=1
export PATH="$HOME/bin:$PATH"

# Playwright visual browser debugging (output saves to your current project directory)
alias browse='cd ~/.playwright-debug && npx tsx browse.ts'
alias browse-debug='cd ~/.playwright-debug && npx tsx debug.ts'
browse-debug-full() { CALLER_CWD="$PWD" sh -c 'cd ~/.playwright-debug && CALLER_CWD="'"$PWD"'" npx tsx ai-debug.ts "$@"' _ "$@"; }
browse-snapshot() { CALLER_CWD="$PWD" sh -c 'cd ~/.playwright-debug && CALLER_CWD="'"$PWD"'" npx tsx snapshot.ts "$@"' _ "$@"; }

# Fix tmux socket path so SSH sessions can find local tmux sessions
export TMUX_TMPDIR=/tmp

alias bmad-install="npx bmad-method install"
alias l='ls -a'
alias lx='eza --icons --group-directories-first'
alias op='opencode'
alias opweb='opencode web --hostname 0.0.0.0 --port 4096'
alias y='yazi'

# Open nvim with nvim-tree focused on a path (default: cwd)
nt() { nvim "${1:-.}" +NvimTreeFocus; }

# Copy text to LOCAL clipboard via OSC 52 (works through SSH).
# Requires a terminal that supports OSC 52 (Ghostty, iTerm2, WezTerm, Kitty,
# Alacritty, recent tmux with `set -g set-clipboard on`).
# Usage:
#   echo foo | clip
#   clip "some text"
clip() {
  local data
  if [ $# -gt 0 ]; then
    data="$*"
  else
    data="$(cat)"
  fi
  printf '\033]52;c;%s\a' "$(printf '%s' "$data" | base64 | tr -d '\n')"
}

# Copy a file's path (relative to $2, default cwd) to the local clipboard.
# Usage:
#   relpath some/file.txt        # relative to cwd
#   relpath /etc/hosts ~         # relative to ~
relpath() {
  if [ $# -lt 1 ]; then
    printf 'usage: relpath <file> [base]\n' >&2
    return 1
  fi
  python3 -c 'import os, sys; print(os.path.relpath(sys.argv[1], sys.argv[2]), end="")' "$1" "${2:-.}" | clip
}

# Copy the absolute path of a file to the local clipboard.
abspath() {
  if [ $# -lt 1 ]; then
    printf 'usage: abspath <file>\n' >&2
    return 1
  fi
  python3 -c 'import os, sys; print(os.path.abspath(sys.argv[1]), end="")' "$1" | clip
}

# Ghostty CLI wrapper
if [[ $IS_MACOS -eq 1 ]]; then
  ghostty() {
      /Applications/Ghostty.app/Contents/MacOS/ghostty "$@"
  }
fi

export NODE_PATH="$(npm root -g):$NODE_PATH"

# Pi Coding Agent aliases
EXT=~/.pi/agent/extensions
alias pi-team='pi -e $EXT/agent-team.ts'                                          # agent-team orchestrator (dispatcher mode)
alias pi-sub='pi -e $EXT/subagent-widget.ts'                                      # /sub <task> spawns background subagents
alias pi-focus='pi -e $EXT/footer.ts'                                             # minimal footer only
alias pi-team-focus='pi -e $EXT/agent-team.ts -e $EXT/footer.ts'                  # agent-team + minimal footer

alias tm='tmux'
alias tma='tmux attach -t'
alias tml='tmux ls'
alias tms='tmux new -s'
alias tmk='tmux kill-session -t'

# Ralph loop - background tmux session running /ralph until all issues done
alias tralph='~/.claude/skills/ralph/ralph-loop.sh'

alias op='opencode'

# Machine-local secrets (not tracked in dotfiles)
[[ -f "$HOME/.zshrc.secrets" ]] && source "$HOME/.zshrc.secrets"
if [[ $IS_MACOS -eq 1 ]]; then
  export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:$PATH"
  export PATH="/opt/homebrew/bin:$PATH"
fi

# Vi mode - must be last so starship/atuin don't overwrite bindings
bindkey -v
export KEYTIMEOUT=20
bindkey -M viins 'jk' vi-cmd-mode

[[ -f "$HOME/.atuin/bin/env" ]] && source "$HOME/.atuin/bin/env"
[[ -f "$HOME/.local/bin/env" ]] && source "$HOME/.local/bin/env"
export PAPERCLIP2_DSN='postgres://postgres:changeme@localhost:5433/windmill?sslmode=disable'

# opencode
export PATH="$HOME/.opencode/bin:$PATH"


# OpenWork endpoint env
[ -f "/Users/james/.config/openwork/aidev.env" ] && . "/Users/james/.config/openwork/aidev.env"
