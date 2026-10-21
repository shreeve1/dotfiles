# PowerShell 7 profile: mirrors the WSL/Omarchy zsh setup (starship prompt,
# Catppuccin Mocha, eza/bat aliases, zoxide, fzf history). Previous oh-my-posh
# profile saved as Microsoft.PowerShell_profile.ps1.bak-20261021.

# Same prompt config as zsh: ~/.config/starship.toml is linked from dotfiles.
Invoke-Expression (&starship init powershell)

# History: up/down search by what you've typed (zsh-history-substring-search),
# grey inline prediction from history (zsh-autosuggestions).
Set-PSReadLineKeyHandler -Key UpArrow -Function HistorySearchBackward
Set-PSReadLineKeyHandler -Key DownArrow -Function HistorySearchForward
Set-PSReadLineOption -HistorySearchCursorMovesToEnd
# Predictions need a real console; skip quietly when output is redirected.
try {
    Set-PSReadLineOption -PredictionSource History -ErrorAction Stop
    Set-PSReadLineOption -PredictionViewStyle InlineView -ErrorAction Stop
} catch { }
Set-PSReadLineOption -Colors @{
    Command          = '#89b4fa'
    Parameter        = '#f5c2e7'
    String           = '#a6e3a1'
    Operator         = '#94e2d5'
    Variable         = '#cdd6f4'
    Number           = '#fab387'
    Comment          = '#6c7086'
    InlinePrediction = '#6c7086'
    Error            = '#f38ba8'
}

# fzf: Ctrl+R history search, Ctrl+T file picker (same keys as zsh). Catppuccin Mocha colours.
$env:FZF_DEFAULT_OPTS = '--color=bg+:#313244,bg:#1e1e2e,spinner:#f5e0dc,hl:#f38ba8,fg:#cdd6f4,header:#f38ba8,info:#cba6f7,pointer:#f5e0dc,marker:#b4befe,fg+:#cdd6f4,prompt:#cba6f7,hl+:#f38ba8,selected-bg:#45475a'
if (Get-Module -ListAvailable PSFzf) {
    Import-Module PSFzf
    Set-PsFzfOption -PSReadlineChordProvider 'Ctrl+t' -PSReadlineChordReverseHistory 'Ctrl+r'
}

# zoxide: z <dir>, zi for interactive pick.
Invoke-Expression (& { (zoxide init powershell | Out-String) })

# Same aliases as ~/.zshrc. Remove built-in ls/cat aliases first so ours win.
Remove-Item Alias:ls, Alias:cat -Force -ErrorAction SilentlyContinue
function ls { eza --icons --group-directories-first @args }
function ll { eza -l --icons --no-user --group-directories-first --time-style long-iso @args }
function la { eza -la --icons --no-user --group-directories-first --time-style long-iso @args }
function l  { eza -a --icons --group-directories-first @args }
function cat { bat @args }
$env:BAT_THEME = 'Catppuccin Mocha'

# yazi: y opens yazi and cds to the folder you quit in. Config comes from dotfiles.
$env:YAZI_FILE_ONE = 'C:\Program Files\Git\usr\bin\file.exe'
$env:YAZI_CONFIG_HOME = "$HOME\.config\yazi"
function y {
    $tmp = (New-TemporaryFile).FullName
    yazi @args --cwd-file="$tmp"
    $cwd = Get-Content -Path $tmp -Encoding UTF8
    if (-not [String]::IsNullOrEmpty($cwd) -and $cwd -ne $PWD.Path) { Set-Location -LiteralPath (Resolve-Path -LiteralPath $cwd).Path }
    Remove-Item -Path $tmp
}
function lg { lazygit @args }

# Chocolatey tab completion (kept from the old profile).
$ChocolateyProfile = "$env:ChocolateyInstall\helpers\chocolateyProfile.psm1"
if (Test-Path $ChocolateyProfile) { Import-Module $ChocolateyProfile }
