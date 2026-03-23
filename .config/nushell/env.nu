# Generated from ~/.zshrc as a Nushell-friendly starting point.
# Zsh-specific themes, plugins, completions, and keybindings were not copied.

let home = $env.HOME

$env.config.show_banner = false
$env.config.history = {
    file_format: sqlite
    max_size: 10_000
    sync_on_enter: true
    isolation: false
}

$env.BUN_INSTALL = ($home | path join ".bun")
$env.ANDROID_HOME = ($home | path join "Library" "Android" "sdk")
$env.JAVA_HOME = "/opt/homebrew/opt/openjdk"
$env.ENABLE_EXPERIMENTAL_MCP_CLI = "1"
$env.TMUX_TMPDIR = "/tmp"
$env.EDITOR = "nvim"
$env.VISUAL = "nvim"

$env.PATH = (
    $env.PATH
    | prepend [
        "/opt/homebrew/bin"
        "/opt/homebrew/sbin"
        "/Applications/Ghostty.app/Contents/MacOS"
        ($home | path join "bin")
        ($home | path join ".local" "bin")
        ($home | path join ".npm-global" "bin")
        ($home | path join ".bun" "bin")
        "/opt/homebrew/opt/openjdk/bin"
    ]
    | append [
        ($env.ANDROID_HOME | path join "platform-tools")
        ($env.ANDROID_HOME | path join "tools")
    ]
    | uniq
)

# Optional: keep this if you rely on global npm module resolution.
if (which npm | is-not-empty) {
    let npm_root = (^npm root -g | str trim)
    if $npm_root != "" {
        let existing_node_path = ($env.NODE_PATH? | default "")
        $env.NODE_PATH = if $existing_node_path == "" {
            $npm_root
        } else {
            $"($npm_root)(char esep)($existing_node_path)"
        }
    }
}

# Do not copy secrets blindly into another shell config.
# If you still want them here, set them manually with your preferred secret manager.
# $env.OPENCLAW_GATEWAY_TOKEN = "..."
# $env.OPENAI_API_KEY = "..."
# $env.JINA_API_KEY = "..."
# $env.SERPER_API_KEY = "..."

# Machine-local secrets (gitignored)
const secrets_path = ("~/.config/nushell/secrets.nu" | path expand)
if ($secrets_path | path exists) {
    source ~/.config/nushell/secrets.nu
}
