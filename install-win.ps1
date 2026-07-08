# Windows installer for this dotfiles repo.
# Run from PowerShell:  .\install-win.ps1

[CmdletBinding()]
param(
    [string]$DotfilesDir = $(if ($env:DOTFILES_DIR) { $env:DOTFILES_DIR } else { $PSScriptRoot })
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$HomeDir = [Environment]::GetFolderPath("UserProfile")

function Convert-RepoPath {
    param([string]$RelativePath)
    Join-Path $DotfilesDir ($RelativePath -replace '/', [IO.Path]::DirectorySeparatorChar)
}

function Convert-HomePath {
    param([string]$RelativePath)
    Join-Path $HomeDir ($RelativePath -replace '/', [IO.Path]::DirectorySeparatorChar)
}

function Get-DisplayPath {
    param([string]$Path)
    if ($Path.StartsWith($HomeDir, [StringComparison]::OrdinalIgnoreCase)) {
        return "~$($Path.Substring($HomeDir.Length))"
    }
    return $Path
}

function Get-ExistingItem {
    param([string]$Path)
    Get-Item -LiteralPath $Path -Force -ErrorAction SilentlyContinue
}

function New-BackupPath {
    param([string]$Target)
    $stamp = (Get-Date).ToUniversalTime().ToString("yyyyMMddTHHmmssZ")
    $backup = "$Target-bak-$stamp"
    $n = 2
    while (Get-ExistingItem $backup) {
        $backup = "$Target-bak-$stamp-$n"
        $n += 1
    }
    return $backup
}

function Test-SameLinkTarget {
    param(
        [string]$Target,
        [string]$Source
    )

    $item = Get-ExistingItem $Target
    if (-not $item) {
        return $false
    }
    $sourceFull = (Get-Item -LiteralPath $Source -Force).FullName
    $linkType = $item.PSObject.Properties["LinkType"]
    $targetProperty = $item.PSObject.Properties["Target"]

    if ($linkType -and $targetProperty -and $targetProperty.Value) {
        $linkTarget = @($targetProperty.Value)[0]
        if (-not [IO.Path]::IsPathRooted($linkTarget)) {
            $linkTarget = Join-Path (Split-Path -Parent $Target) $linkTarget
        }
        if ((Test-Path -LiteralPath $linkTarget) -and ((Get-Item -LiteralPath $linkTarget -Force).FullName -ieq $sourceFull)) {
            return $true
        }
    }

    return $item.FullName -ieq $sourceFull
}

function Link-Path {
    param(
        [string]$SourceRelative,
        [string]$TargetRelative
    )

    $source = Convert-RepoPath $SourceRelative
    $target = Convert-HomePath $TargetRelative
    $parent = Split-Path -Parent $target

    if (-not (Test-Path -LiteralPath $source)) {
        Write-Host "skip: missing source $source"
        return
    }

    New-Item -ItemType Directory -Force -Path $parent | Out-Null

    $targetItem = Get-ExistingItem $target
    if ($targetItem) {
        if (Test-SameLinkTarget -Target $target -Source $source) {
            Write-Host "ok: $target already linked"
            return
        }

        $backup = New-BackupPath $target
        Move-Item -LiteralPath $target -Destination $backup
        Write-Host "backup: $target -> $backup"
    }

    try {
        New-Item -ItemType SymbolicLink -Path $target -Target $source | Out-Null
        Write-Host "linked: $target -> $source"
    } catch {
        Write-Warning "failed to link $target -> $source. Enable Windows Developer Mode or run PowerShell as Administrator."
        throw
    }
}

function Install-NpmDepsIfNeeded {
    param(
        [string]$Dir,
        [string[]]$NpmArgs = @()
    )

    if (-not (Test-Path -LiteralPath (Join-Path $Dir "package.json"))) {
        return
    }

    $label = Get-DisplayPath $Dir
    $nodeModules = Join-Path $Dir "node_modules"
    $packageJson = Join-Path $Dir "package.json"

    if ((Test-Path -LiteralPath $nodeModules) -and ($env:INSTALL_PI_NPM -ne "always")) {
        if ((Get-Item $packageJson).LastWriteTimeUtc -le (Get-Item $nodeModules).LastWriteTimeUtc) {
            Write-Host "ok: $label/node_modules present"
            return
        }
        Write-Host "refresh: $label package.json newer than node_modules"
    }

    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        Write-Warning "npm not found; run later: cd $label && npm install $($NpmArgs -join ' ')"
        return
    }

    $cmd = @("install") + $NpmArgs
    $usedCi = $false
    if (Test-Path -LiteralPath (Join-Path $Dir "package-lock.json")) {
        $cmd = @("ci") + $NpmArgs
        $usedCi = $true
    }

    Write-Host "install: $label dependencies (npm $($cmd -join ' '))"
    Push-Location $Dir
    try {
        & npm @cmd
        if ($LASTEXITCODE -eq 0) {
            Write-Host "ok: $label dependencies installed"
            return
        }

        if ($usedCi) {
            Write-Host "retry: $label - npm ci failed, removing stale lockfile and running npm install"
            Remove-Item -Force (Join-Path $Dir "package-lock.json") -ErrorAction SilentlyContinue
            $retryCmd = @("install") + $NpmArgs
            & npm @retryCmd
            if ($LASTEXITCODE -eq 0) {
                Write-Host "ok: $label dependencies installed (lockfile regenerated)"
                return
            }
        }

        Write-Warning "failed to install $label dependencies; run: cd $label && npm install $($NpmArgs -join ' ')"
    } finally {
        Pop-Location
    }
}

Link-Path ".zshrc" ".zshrc"

# XDG-style config used by the Windows builds of these tools where supported.
Link-Path ".config/starship.toml" ".config/starship.toml"
Link-Path ".config/ghostty" ".config/ghostty"
Link-Path ".config/nvim" ".config/nvim"
Link-Path ".config/tmux" ".config/tmux"
Link-Path ".config/yazi" ".config/yazi"
Link-Path ".config/zellij" ".config/zellij"

# Helper scripts on PATH when ~/.local/bin is added by the user or shell profile.
Link-Path "bin/rralph" ".local/bin/rralph"
Link-Path "bin/osc52" ".local/bin/osc52"

# Opencode
Link-Path ".config/opencode" ".config/opencode"

# Pi Agent
Link-Path ".pi/agent" ".pi/agent"
Link-Path ".pi/README.md" ".pi/README.md"

if (Get-Command pi -ErrorAction SilentlyContinue) {
    Write-Host "ok: pi CLI available: $((pi --version 2>&1 | Select-Object -First 1))"
} elseif ($env:INSTALL_PI_CLI -eq "1" -and (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "install: pi CLI via npm -g"
    npm install -g @earendil-works/pi-coding-agent
    if ($LASTEXITCODE -eq 0) {
        Write-Host "ok: pi CLI installed"
    } else {
        Write-Warning "failed to install pi CLI; run: npm install -g @earendil-works/pi-coding-agent"
    }
} else {
    Write-Warning "pi CLI not found; install with: npm install -g @earendil-works/pi-coding-agent"
}

if (-not (Get-Command bun -ErrorAction SilentlyContinue)) {
    Write-Warning "bun not found; Pi tools and OpenCode helpers may require bun"
}

if (Get-Command nvim -ErrorAction SilentlyContinue) {
    Write-Host "ok: nvim available: $((nvim --version 2>&1 | Select-Object -First 1))"
} else {
    Write-Warning "nvim not found; install Neovim to use ~/.config/nvim"
}

foreach ($tool in @("rg", "fd", "node", "npm", "python")) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
        Write-Warning "$tool not found; some Neovim/Pi/OpenCode tooling may need it"
    }
}

if ($env:INSTALL_PI_NPM -ne "0") {
    Install-NpmDepsIfNeeded (Convert-HomePath ".pi/agent")
    Install-NpmDepsIfNeeded (Convert-HomePath ".pi/agent/extensions/rpiv-todo") @("--omit=dev")
    Install-NpmDepsIfNeeded (Convert-HomePath ".pi/agent/extensions/rpiv-pi") @("--omit=dev")

    $extensionRoots = @(
        Convert-HomePath ".pi/agent/extensions"
    )
    foreach ($root in $extensionRoots) {
        if (-not (Test-Path -LiteralPath $root)) { continue }
        $packageDirs = Get-ChildItem -LiteralPath $root -Directory -ErrorAction SilentlyContinue
        $packageDirs += Get-ChildItem -LiteralPath $root -Directory -ErrorAction SilentlyContinue |
            Where-Object { $_.Name.StartsWith("@") } |
            ForEach-Object { Get-ChildItem -LiteralPath $_.FullName -Directory -ErrorAction SilentlyContinue }

        foreach ($dir in $packageDirs) {
            if (-not (Test-Path -LiteralPath (Join-Path $dir.FullName "package.json"))) { continue }
            if ($dir.FullName -ieq (Convert-HomePath ".pi/agent/extensions/rpiv-pi")) { continue }
            if ($dir.FullName -ieq (Convert-HomePath ".pi/agent/extensions/rpiv-todo")) { continue }
            Install-NpmDepsIfNeeded $dir.FullName @("--omit=dev", "--omit=peer")
        }
    }
} else {
    Write-Host "skip: Pi npm dependencies (INSTALL_PI_NPM=0)"
}

# Claude Code
if ($env:INSTALL_CLAUDE_CODE -ne "0") {
    Link-Path ".claude/CLAUDE.md" ".claude/CLAUDE.md"
    Link-Path ".claude/settings.json.template" ".claude/settings.json.template"
    Link-Path ".claude/switch-provider.sh" ".claude/switch-provider.sh"
    Link-Path ".claude/statusline-command.sh" ".claude/statusline-command.sh"
    Link-Path ".claude/commands" ".claude/commands"
    Link-Path ".claude/agents" ".claude/agents"
    Link-Path ".claude/skills" ".claude/skills"
    Link-Path ".claude/hooks" ".claude/hooks"
} else {
    Write-Host "skip: ~/.claude/* links (INSTALL_CLAUDE_CODE=0)"
}

# Codex
Link-Path ".codex/config.toml" ".codex/config.toml"
Link-Path ".codex/AGENTS.md" ".codex/AGENTS.md"
Link-Path ".codex/hooks.json" ".codex/hooks.json"
Link-Path ".codex/rules" ".codex/rules"

$codexSkills = Convert-RepoPath ".codex/skills"
if (Test-Path -LiteralPath $codexSkills) {
    Get-ChildItem -LiteralPath $codexSkills -Directory | Where-Object { -not $_.Name.StartsWith(".") } | ForEach-Object {
        Link-Path ".codex/skills/$($_.Name)" ".codex/skills/$($_.Name)"
    }
}

Write-Host "done: Windows dotfiles links installed"
