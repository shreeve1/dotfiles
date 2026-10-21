# Windows PowerShell 5.1 profile: load the PowerShell 7 profile so both shells
# match (herdr and older tools still open powershell.exe). Needs PSReadLine 2.4+
# and PSFzf installed for 5.1 too; see windows/config-backup.md.
. (Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'PowerShell\Microsoft.PowerShell_profile.ps1')
