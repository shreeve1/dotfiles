# nmap scan helpers (sourced from .zshrc)
# nls  <subnet>  live hosts: IP / hostname / MAC / vendor (rDNS)
# nlsn <subnet>  same + NetBIOS name fallback (slower, finds Windows names)
# nq   <target>  single target quick info (top 100 ports, services, OS guess)
# nme            scan your own current LAN subnet(s)

_nmap_fmt() {
  awk '
    function flush() {
      if (ip != "") printf "%-16s %-35s %-18s %s\n", ip, (host != "" ? host : "-"), (mac != "" ? mac : "-"), vendor
      ip = host = mac = vendor = ""
    }
    /^Nmap scan report for/ {
      flush()
      if ($NF ~ /^\(/) { ip = $NF; gsub(/[()]/, "", ip); host = $5 } else { ip = $5 }
    }
    /^MAC Address:/ { mac = $3; vendor = substr($0, index($0, "(") + 1); sub(/\)$/, "", vendor) }
    /NetBIOS name:/ && host == "" { n = $0; sub(/.*NetBIOS name: /, "", n); sub(/,.*/, "", n); host = n " (nb)" }
    END {
      flush()
    }
  ' | sort -t. -k1,1n -k2,2n -k3,3n -k4,4n
}

_nmap_hdr() { printf "%-16s %-35s %-18s %s\n" IP HOSTNAME MAC VENDOR; printf '%.0s-' {1..90}; echo; }

nls() {
  [[ -z "$1" ]] && { echo "usage: nls <subnet>  e.g. nls 10.20.20.0/24"; return 1; }
  _nmap_hdr
  sudo nmap -sn -R -T4 "$@" | _nmap_fmt
}

nlsn() {
  [[ -z "$1" ]] && { echo "usage: nlsn <subnet>"; return 1; }
  _nmap_hdr
  sudo nmap -R -T4 -sU -p137 --script nbstat "$@" 2>/dev/null | _nmap_fmt
}

nq() {
  [[ -z "$1" ]] && { echo "usage: nq <ip|host>"; return 1; }
  sudo nmap -R -T4 -F --open -sV --version-light -O --osscan-guess "$@" \
    | grep -vE '^(Starting|Service detection|OS detection performed|Read data|Not shown|Nmap done|Warning|No exact OS|OS:|TCP/IP fingerprint)|^$'
}

nme() {
  local nets
  nets=($(ip -o -4 addr show scope global 2>/dev/null | awk '$2 !~ /^(wt|tun|tailscale|docker|br-|veth)/ {print $4}'))
  [[ -z "$nets" ]] && { echo "no LAN subnet found"; return 1; }
  echo "scanning: $nets"; nls "${nets[@]}"
}
