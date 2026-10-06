# M365 admin helpers (sourced from .zshrc); needs pwsh + ExchangeOnlineManagement, Microsoft.Graph modules
# exo  <admin-upn>  pwsh session connected to Exchange Online (device code sign-in)
# mgc  <admin-upn>  pwsh session connected to Microsoft Graph (device code sign-in)
# m365 <admin-upn>  pwsh session connected to both

_m365_check() {
  command -v pwsh >/dev/null || { echo "pwsh not installed (Linux: yay -S powershell-bin, Mac: brew install powershell)"; return 1; }
  [[ -z "$1" ]] && { echo "usage: $2 <admin-upn>  e.g. $2 itadmin@contoso.com"; return 1; }
}

_m365_exo='Connect-ExchangeOnline -UserPrincipalName $env:M365_UPN -Device -ShowBanner:$false'
_m365_mgc='Connect-MgGraph -UseDeviceCode -NoWelcome -Scopes User.Read.All,Group.Read.All,Directory.Read.All; Get-MgContext | Select-Object Account,TenantId'

exo()  { _m365_check "$1" exo  || return; M365_UPN="$1" pwsh -NoLogo -NoExit -Command "$_m365_exo"; }
mgc()  { _m365_check "$1" mgc  || return; pwsh -NoLogo -NoExit -Command "$_m365_mgc"; }
m365() { _m365_check "$1" m365 || return; M365_UPN="$1" pwsh -NoLogo -NoExit -Command "$_m365_exo; $_m365_mgc"; }
