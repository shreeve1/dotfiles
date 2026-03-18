# Generated from ~/.zshrc as a Nushell-friendly starting point.
# Items omitted because they are zsh-specific: Oh My Zsh, zsh plugins,
# zsh completion scripts, and bindkey behavior that does not map directly.

# `env.nu` is loaded automatically by Nushell before `config.nu`.

alias l = ls -a
alias lx = eza --icons --group-directories-first
alias ll = eza -l --icons --no-user --group-directories-first --time-style long-iso
alias la = eza -la --icons --no-user --group-directories-first --time-style long-iso
alias cat = bat
alias bmad-install = npx bmad-method install
alias op = opencode
alias opweb = opencode web --hostname 0.0.0.0 --port 4096
alias y = yazi

alias nu-open = open
alias open = ^open

def --wrapped ghostty [...args] {
    ^/Applications/Ghostty.app/Contents/MacOS/ghostty ...$args
}

def --wrapped claude-provider [...args] {
    ^/Users/james/.claude/switch-provider.sh ...$args
}

alias claude-anthropic = claude-provider anthropic
alias claude-zai = claude-provider zai
alias claude-moonshot = claude-provider moonshot
alias claude-alibaba = claude-provider alibaba
alias claude-openrouter = claude-provider openrouter

def --wrapped browse [...args] {
    let caller = $env.PWD
    cd ~/.playwright-debug
    do {
        ^npx tsx browse.ts ...$args
    }
    cd $caller
}

def --wrapped browse-debug [...args] {
    let caller = $env.PWD
    cd ~/.playwright-debug
    do {
        ^npx tsx debug.ts ...$args
    }
    cd $caller
}

def --wrapped browse-debug-full [...args] {
    let caller = $env.PWD
    cd ~/.playwright-debug
    do {
        with-env { CALLER_CWD: $caller } {
            ^npx tsx ai-debug.ts ...$args
        }
    }
    cd $caller
}

def --wrapped browse-snapshot [...args] {
    let caller = $env.PWD
    cd ~/.playwright-debug
    do {
        with-env { CALLER_CWD: $caller } {
            ^npx tsx snapshot.ts ...$args
        }
    }
    cd $caller
}

# Notes:
# - `fzf --zsh`, OpenSpec completion hooks, Bun's zsh completion file, and
#   OpenClaw's zsh completion file do not translate directly to Nushell.
# - If those tools ship Nushell completions later, add them via autoload files.

oh-my-posh init nu --config /opt/homebrew/opt/oh-my-posh/themes/kali.omp.json
