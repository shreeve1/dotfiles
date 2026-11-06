# Windows installer for this dotfiles repo.
# Run from PowerShell:  .\install-win.ps1

[CmdletBinding()]
param(
    [string]$DotfilesDir = $(if ($env:DOTFILES_DIR) { $env:DOTFILES_DIR } else { $PSScriptRoot }),
    # Install only the pinned style tools (.config/style/tools.env) and stop.
    [switch]$StyleToolsOnly
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

# Pinned style tools (.config/style/tools.env) into ~/.local/bin, like bin/style-tools-install
# on Linux: idempotent, a tool already at its pin is left alone. shfmt, shellcheck, ruff and biome
# are release binaries; markdownlint-cli2 goes into a private npm prefix with a shim in ~/.local/bin.
# shfmt has no ARM64 Windows build and shellcheck is x86_64 only, so both run emulated on ARM64.
function Install-StyleTools {
    $pins = @{}
    foreach ($line in Get-Content -LiteralPath (Convert-RepoPath ".config/style/tools.env")) {
        if ($line -match '^([A-Z0-9_]+)=(\S+)$') { $pins[$Matches[1]] = $Matches[2] }
    }
    $bin = Convert-HomePath ".local/bin"
    $prefix = Convert-HomePath ".local/share/style-tools"
    New-Item -ItemType Directory -Force -Path $bin | Out-Null

    $arm = [Runtime.InteropServices.RuntimeInformation]::OSArchitecture -eq [Runtime.InteropServices.Architecture]::Arm64
    $ruffAsset = if ($arm) { "aarch64" } else { "x86_64" }
    $biomeAsset = if ($arm) { "arm64" } else { "x64" }

    function Test-Pin {
        param([string]$Tool, [string]$Version)
        $exe = Join-Path $bin "$Tool.exe"
        if ($Tool -eq "markdownlint-cli2") { $exe = Join-Path $bin "$Tool.cmd" }
        if (-not (Test-Path -LiteralPath $exe)) { return $false }
        # markdownlint-cli2 has no --version; its --help banner carries it.
        $flag = if ($Tool -eq "markdownlint-cli2") { "--help" } else { "--version" }
        $saved = $ErrorActionPreference
        $ErrorActionPreference = "Continue"
        try { $out = (& $exe $flag 2>&1 | Out-String) } catch { $out = "" } finally { $ErrorActionPreference = $saved }
        return $out.Substring(0, [Math]::Min(400, $out.Length)).Contains($Version)
    }

    function Get-Download {
        param([string]$Url, [string]$Dest)
        $ProgressPreference = "SilentlyContinue"
        Invoke-WebRequest -UseBasicParsing -Uri $Url -OutFile $Dest
    }

    $tmp = Join-Path ([IO.Path]::GetTempPath()) "style-tools-$([Guid]::NewGuid().ToString('N'))"
    New-Item -ItemType Directory -Force -Path $tmp | Out-Null
    try {
        $v = $pins.SHFMT_VERSION
        if (Test-Pin shfmt $v) { Write-Host "ok: shfmt $v" } else {
            Get-Download "https://github.com/mvdan/sh/releases/download/v$v/shfmt_v${v}_windows_amd64.exe" (Join-Path $bin "shfmt.exe")
            Write-Host "ok: installed shfmt $v"
        }

        $v = $pins.SHELLCHECK_VERSION
        if (Test-Pin shellcheck $v) { Write-Host "ok: shellcheck $v" } else {
            Get-Download "https://github.com/koalaman/shellcheck/releases/download/v$v/shellcheck-v$v.zip" (Join-Path $tmp "sc.zip")
            Expand-Archive -LiteralPath (Join-Path $tmp "sc.zip") -DestinationPath (Join-Path $tmp "sc") -Force
            Copy-Item -LiteralPath (Join-Path $tmp "sc/shellcheck.exe") -Destination $bin -Force
            Write-Host "ok: installed shellcheck $v"
        }

        $v = $pins.RUFF_VERSION
        if (Test-Pin ruff $v) { Write-Host "ok: ruff $v" } else {
            Get-Download "https://github.com/astral-sh/ruff/releases/download/$v/ruff-$ruffAsset-pc-windows-msvc.zip" (Join-Path $tmp "ruff.zip")
            Expand-Archive -LiteralPath (Join-Path $tmp "ruff.zip") -DestinationPath (Join-Path $tmp "ruff") -Force
            Copy-Item -LiteralPath (Join-Path $tmp "ruff/ruff.exe") -Destination $bin -Force
            Write-Host "ok: installed ruff $v"
        }

        $v = $pins.BIOME_VERSION
        if (Test-Pin biome $v) { Write-Host "ok: biome $v" } else {
            Get-Download "https://github.com/biomejs/biome/releases/download/%40biomejs%2Fbiome%40$v/biome-win32-$biomeAsset.exe" (Join-Path $bin "biome.exe")
            Write-Host "ok: installed biome $v"
        }

        $v = $pins.MARKDOWNLINT_CLI2_VERSION
        if (Test-Pin markdownlint-cli2 $v) { Write-Host "ok: markdownlint-cli2 $v" } elseif (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
            Write-Warning "npm not found; cannot pin markdownlint-cli2 $v"
        } else {
            & npm.cmd install --silent --no-fund --no-audit --prefix $prefix "markdownlint-cli2@$v" | Out-Null
            if ($LASTEXITCODE -ne 0) { throw "npm install markdownlint-cli2@$v failed" }
            $entry = Join-Path $prefix "node_modules/markdownlint-cli2/markdownlint-cli2-bin.mjs"
            # .cmd for cmd and PowerShell, an extensionless sh script for Git Bash.
            [IO.File]::WriteAllText((Join-Path $bin "markdownlint-cli2.cmd"), "@node `"$entry`" %*`r`n")
            $entryUnix = $entry -replace '\\', '/'
            [IO.File]::WriteAllText((Join-Path $bin "markdownlint-cli2"), "#!/bin/sh`nexec node '$entryUnix' `"`$@`"`n")
            Write-Host "ok: installed markdownlint-cli2 $v"
        }
    } finally {
        Remove-Item -LiteralPath $tmp -Recurse -Force -ErrorAction SilentlyContinue
    }

    # pi-lens resolves formatters by PATH, so ~/.local/bin must come first.
    foreach ($tool in @("shfmt", "shellcheck", "ruff", "biome", "markdownlint-cli2")) {
        $first = Get-Command $tool -All -ErrorAction SilentlyContinue | Select-Object -First 1
        if (-not $first) {
            Write-Warning "$tool is not on PATH; put $(Get-DisplayPath $bin) on the user PATH"
        } elseif ((Split-Path -Parent $first.Source) -ine $bin) {
            Write-Warning "$tool resolves to $($first.Source), not $(Get-DisplayPath $bin); move ~/.local/bin earlier on PATH"
        }
    }
}

if ($StyleToolsOnly) {
    Install-StyleTools
    return
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
Link-Path "bin/osc52" ".local/bin/osc52"

# Agent browser (windows/agent-browser.md): chrome-cdp, ab and ab-input for Git Bash, pi's shell.
# With agent-browser installed in WSL (wrk), stubs in ~/bin (on the Windows PATH) run the WSL
# commands, so Windows and WSL agents share one install and one input lock; they are written rather
# than linked, so they need no Developer Mode. Without it (surftop), the scripts run natively.
$wslBrowser = $false
if (Get-Command wsl.exe -ErrorAction SilentlyContinue) {
    & wsl.exe -e bash -lc 'command -v agent-browser' *> $null
    $wslBrowser = $LASTEXITCODE -eq 0
}
if ($wslBrowser) {
    $shim = (Convert-RepoPath "windows/bin/wsl-browser") -replace '\\', '/'
    foreach ($name in @("ab", "ab-input", "chrome-cdp")) {
        $stub = Convert-HomePath "bin/$name"
        $null = New-Item -ItemType Directory -Force -Path (Split-Path -Parent $stub)
        [IO.File]::WriteAllText($stub, "#!/bin/sh`nexec '$shim' $name `"`$@`"`n")
        Write-Host "ok: $(Get-DisplayPath $stub) -> WSL $name"
    }
} else {
    foreach ($name in @("ab", "ab-input", "chrome-cdp")) {
        Link-Path "bin/$name" ".local/bin/$name"
    }
    $localBin = Convert-HomePath ".local/bin"
    $userPath = [Environment]::GetEnvironmentVariable("PATH", "User")
    if (-not (($userPath -split ';') -contains $localBin)) {
        [Environment]::SetEnvironmentVariable("PATH", "$userPath;$localBin", "User")
        Write-Host "path: added $localBin to user PATH (new shells)"
    }
    if (Get-Command agent-browser -ErrorAction SilentlyContinue) {
        Write-Host "ok: agent-browser available"
    } else {
        Write-Warning "agent-browser not found; install with: npm install -g agent-browser"
    }
}

# Opencode
Link-Path ".config/opencode" ".config/opencode"

# Pi Agent
Link-Path ".pi/agent" ".pi/agent"
Link-Path ".pi/README.md" ".pi/README.md"
Link-Path ".pi-lens/config.json" ".pi-lens/config.json"
# The pi verify-final extension runs ~/.agents/bin/verify-final (through python on Windows).
Link-Path ".agents/bin" ".agents/bin"

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
Link-Path ".codex/agents" ".codex/agents"

$codexSkills = Convert-RepoPath ".codex/skills"
if (Test-Path -LiteralPath $codexSkills) {
    Get-ChildItem -LiteralPath $codexSkills -Directory | Where-Object { -not $_.Name.StartsWith(".") } | ForEach-Object {
        Link-Path ".codex/skills/$($_.Name)" ".codex/skills/$($_.Name)"
    }
}

Install-StyleTools

Write-Host "done: Windows dotfiles links installed"
