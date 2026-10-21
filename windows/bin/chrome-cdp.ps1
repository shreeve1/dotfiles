# Agent Chrome on Windows (wrk): a second Chrome on its own profile, CDP on 127.0.0.1:9222.
# Chrome M136+ refuses --remote-debugging-port on the default profile, hence the separate dir.
# Returns once the port answers (exit 0) or after CDP_WAIT seconds (exit 1).
# -Seed first mirrors the everyday Chrome profile in; every Chrome window must be closed.
# WSL's bin/chrome-cdp calls this; Windows pi reaches it through windows/bin/wsl-browser.
#Requires -Version 5.1
param([switch]$Seed)
Set-StrictMode -Version Latest

$Port = 9222
$Chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$Dir = Join-Path $env:LOCALAPPDATA 'chrome-cdp'
$Wait = if ($env:CDP_WAIT) { [int]$env:CDP_WAIT } else { 15 }

function Test-Cdp {
    try { $null = Invoke-RestMethod -TimeoutSec 1 "http://127.0.0.1:$Port/json/version"; $true } catch { $false }
}

if ($Seed) {
    if (Get-Process chrome -ErrorAction SilentlyContinue) {
        [Console]::Error.WriteLine('chrome-cdp: close every Chrome window first; the copy needs the profile unlocked')
        exit 1
    }
    $src = Join-Path $env:LOCALAPPDATA 'Google\Chrome\User Data'
    # /MIR replaces the agent profile's Default, so logins made only in the agent Chrome are lost.
    $null = robocopy (Join-Path $src 'Default') (Join-Path $Dir 'Default') /MIR /XD Cache 'Code Cache' GPUCache DawnGraphiteCache DawnWebGPUCache /XF LOCK 'Singleton*' /R:1 /W:1 /NFL /NDL /NJH /NJS
    if ($LASTEXITCODE -ge 8) {
        [Console]::Error.WriteLine("chrome-cdp: profile copy failed (robocopy exit $LASTEXITCODE)")
        exit 1
    }
    Copy-Item -LiteralPath (Join-Path $src 'Local State') -Destination (Join-Path $Dir 'Local State') -Force
    "seeded $Dir from $src"
}

if (Test-Cdp) {
    "already running on port $Port"
    exit 0
}

$null = New-Item -ItemType Directory -Force -Path $Dir
# Minimized so it never takes the desktop; the flags keep a minimized window working at full speed.
Start-Process -FilePath $Chrome -WindowStyle Minimized -ArgumentList @(
    "--user-data-dir=`"$Dir`"",
    "--remote-debugging-port=$Port",
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding'
)

# Checks once more after the deadline, so a Chrome that comes up during the last sleep still counts.
$deadline = (Get-Date).AddSeconds($Wait)
while (-not (Test-Cdp)) {
    if ((Get-Date) -ge $deadline) {
        [Console]::Error.WriteLine("chrome-cdp: port $Port not answering after ${Wait}s")
        exit 1
    }
    Start-Sleep -Milliseconds 500
}
"ready on port $Port"
