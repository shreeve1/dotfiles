# OPENSPEC:START
# OpenSpec shell completions configuration
fpath=("/Users/james/.oh-my-zsh/custom/completions" $fpath)
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
ZSH_THEME="robbyrussell"

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
plugins=(git z brew macos vscode docker npm node python pip brew zsh-autosuggestions zsh-syntax-highlighting zsh-history-substring-search)

source $ZSH/oh-my-zsh.sh

# fzf configuration
source <(fzf --zsh)

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
bindkey -M vicmd 'k' history-substring-search-up
bindkey -M vicmd 'j' history-substring-search-down

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

# Oh My Posh configuration

# Oh My Posh configuration
eval "$(oh-my-posh init zsh --config $(brew --prefix oh-my-posh)/themes/kali.omp.json)"

# eza aliases for better ls command
alias ls='eza --icons --group-directories-first'
alias ll='eza -l --icons --no-user --group-directories-first --time-style long-iso'
alias la='eza -la --icons --no-user --group-directories-first --time-style long-iso'
alias cat='bat'

# bun completions
[ -s "/Users/james/.bun/_bun" ] && source "/Users/james/.bun/_bun"

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
alias cc='claude'

# Android SDK
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools

# Java (OpenJDK)
export JAVA_HOME=/opt/homebrew/opt/openjdk
export PATH="/opt/homebrew/opt/openjdk/bin:$PATH"
export ENABLE_EXPERIMENTAL_MCP_CLI=1
export PATH="$HOME/.local/bin:$PATH"
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

# Ghostty CLI wrapper
ghostty() {
    /Applications/Ghostty.app/Contents/MacOS/ghostty "$@"
}

export NODE_PATH="$(npm root -g):$NODE_PATH"

# Pi Coding Agent aliases
EXT=~/.pi/agent/extensions
alias pi-team='pi -e $EXT/agent-team.ts'                                          # agent-team orchestrator (dispatcher mode)
alias pi-sub='pi -e $EXT/subagent-widget.ts'                                      # /sub <task> spawns background subagents
alias pi-focus='pi -e $EXT/footer.ts'                                             # minimal footer only
alias pi-team-focus='pi -e $EXT/agent-team.ts -e $EXT/footer.ts'                  # agent-team + minimal footer

# Hermes aliases
alias hh=hermes
alias hhb='hermes sessions browse'

# Machine-local secrets (not tracked in dotfiles)
[[ -f "$HOME/.zshrc.secrets" ]] && source "$HOME/.zshrc.secrets"
