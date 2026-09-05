#!/usr/bin/env bash
# dsh-repro/install-dsh.sh
#
# Replay the captured dsh web profile on this host, render per-host values,
# and (when NOT --dry-run) install + enable the dsh-web.service systemd unit.
#
# Usage:
#   install-dsh.sh [--dry-run] <listen-ip>
#
#   --dry-run     Compose the rendered profile in DSH_HOME=$(mktemp -d) and
#                 assert `dsh --profile web --dump-config` exits 0. Never
#                 touches /home/james/.dsh, never installs globally, never
#                 runs systemctl, never restarts a live service.
#
#   <listen-ip>   The IP the dsh-full-remote reverse-proxy listens on.
#                 Renders into cordis.patch.yml as `listenHost:` and into the
#                 self-signed cert as SAN=IP:<listen-ip>.
#
# Real-mode flow (the operator runs):
#   1. Install @deepseek-ai/dsh globally (skipped if `dsh` already on PATH).
#   2. Create DSH_HOME=$HOME/.dsh/profiles/web/ from the captured manifest.
#   3. pnpm install --frozen-lockfile --ignore-scripts (live, no devDeps).
#   4. Render cordis.patch.yml from cordis.patch.yml.tmpl (__HOME__, __LISTEN_IP__).
#   5. Generate self-signed TLS cert with SAN=IP:<listen-ip> (10y).
#   6. Install dsh-web.service from systemd/dsh-web.service.tmpl.
#   7. Refuse to proceed if ~/.dsh/dsh-web.env or ~/.dsh/.credentials.yaml is
#      missing — secrets are NOT in git. Print a list of required keys.
#   8. systemctl --user enable --now dsh-web.service.
#   9. Print the reverse-proxy token from ~/.dsh/reverse-proxy.json.

set -u

# ─── args ────────────────────────────────────────────────
DRY_RUN=0
NO_SERVICE=0
LISTEN_IP=""
while [ "$#" -gt 0 ]; do
  case "$1" in
    --dry-run) DRY_RUN=1; shift ;;
    --no-service) NO_SERVICE=1; shift ;;
    --help|-h)
      sed -n '2,28p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    -*)
      echo "unknown flag: $1" >&2; exit 2 ;;
    *)
      if [ -z "$LISTEN_IP" ]; then LISTEN_IP="$1"; shift
      else echo "unexpected extra arg: $1" >&2; exit 2
      fi
      ;;
  esac
done

if [ -z "$LISTEN_IP" ]; then
  echo "usage: $0 [--dry-run] [--no-service] <listen-ip>" >&2
  echo "  --no-service  do everything except enable/start dsh-web.service" >&2
  exit 2
fi

# ─── paths ───────────────────────────────────────────────
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
PROFILES_DIR="$SCRIPT_DIR/profiles/web"
SERVICE_TMPL="$SCRIPT_DIR/systemd/dsh-web.service.tmpl"
PATCH_TMPL="$PROFILES_DIR/cordis.patch.yml.tmpl"

if [ ! -d "$PROFILES_DIR" ]; then
  echo "missing captured profile: $PROFILES_DIR" >&2
  exit 1
fi
if [ ! -f "$SERVICE_TMPL" ]; then
  echo "missing systemd template: $SERVICE_TMPL" >&2
  exit 1
fi
if [ ! -f "$PATCH_TMPL" ]; then
  echo "missing cordis patch template: $PATCH_TMPL" >&2
  exit 1
fi

# ─── dry-run sandbox ─────────────────────────────────────
# CRITICAL: when --dry-run is set, override DSH_HOME with a temp dir BEFORE any
# command below reads it. dsh derives ~/.dsh from $DSH_HOME (defaults to
# ~/.dsh) and `dsh --profile web --dump-config` will silently validate the
# LIVE profile if DSH_HOME is unset. This is the failure mode that severs
# live agent sessions via the chain documented in docs/deepseek-harness.md.
if [ "$DRY_RUN" -eq 1 ]; then
  export DSH_HOME=$(mktemp -d) || { echo "mktemp failed" >&2; exit 1; }
  echo "[dry-run] DSH_HOME=$DSH_HOME"
  # shellcheck disable=SC2064
  trap "rm -rf '$DSH_HOME'" EXIT
else
  : "${DSH_HOME:=$HOME/.dsh}"
  export DSH_HOME
fi

HOME_DIR="$HOME"

# ─── 1. global dsh ───────────────────────────────────────
if command -v dsh >/dev/null 2>&1; then
  echo "[step 1] dsh already present: $(command -v dsh) ($(dsh --version 2>&1))"
elif [ "$DRY_RUN" -eq 1 ]; then
  echo "[step 1] dry-run: skipping global dsh install (already on PATH)"
else
  echo "[step 1] installing @deepseek-ai/dsh globally"
  npm install -g @deepseek-ai/dsh || { echo "npm install -g failed" >&2; exit 1; }
fi

# ─── 2. materialise profile ──────────────────────────────
mkdir -p "$DSH_HOME/profiles"
if [ -d "$DSH_HOME/profiles/web" ]; then
  echo "[step 2] profile already exists at $DSH_HOME/profiles/web (leaving it)"
else
  echo "[step 2] copying $PROFILES_DIR -> $DSH_HOME/profiles/web"
  cp -r "$PROFILES_DIR" "$DSH_HOME/profiles/web"
fi

# ─── 3. pnpm install ─────────────────────────────────────
echo "[step 3] pnpm install --frozen-lockfile --ignore-scripts"
(
  cd "$DSH_HOME/profiles/web" || exit 1
  pnpm install --frozen-lockfile --ignore-scripts
) || { echo "pnpm install failed" >&2; exit 1; }

# ─── 4. render cordis.patch.yml ──────────────────────────
echo "[step 4] rendering cordis.patch.yml (HOME=$HOME_DIR, LISTEN_IP=$LISTEN_IP)"
sed -e "s|__HOME__|$HOME_DIR|g" \
    -e "s|__LISTEN_IP__|$LISTEN_IP|g" \
    "$PATCH_TMPL" > "$DSH_HOME/profiles/web/cordis.patch.yml"

# ─── 5. dry-run asserts config composes and exits ────────
if [ "$DRY_RUN" -eq 1 ]; then
  echo "[step 5] dry-run: asserting dsh --profile web --dump-config exits 0"
  if ! (cd "$DSH_HOME/profiles/web" && DSH_HOME="$DSH_HOME" dsh --profile web --dump-config >/dev/null); then
    echo "FAILED: dsh --profile web --dump-config non-zero in dry-run" >&2
    exit 1
  fi
  echo "[ok] dry-run completed; temp profile cleaned up on EXIT"
  exit 0
fi

# ─── 6. self-signed TLS cert ─────────────────────────────
mkdir -p "$HOME_DIR/.dsh"
if [ ! -f "$HOME_DIR/.dsh/dsh-tls.crt" ] || [ ! -f "$HOME_DIR/.dsh/dsh-tls.key" ]; then
  echo "[step 6] generating self-signed TLS cert (SAN=IP:$LISTEN_IP, 10y)"
  TMP_CNF=$(mktemp)
  TMP_CRT=$(mktemp)
  TMP_KEY=$(mktemp)
  cat >"$TMP_CNF" <<EOF
[req]
distinguished_name = req_distinguished_name
x509_extensions    = v3_req
prompt             = no
[req_distinguished_name]
CN = dsh
[v3_req]
subjectAltName = IP:$LISTEN_IP
keyUsage       = digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
EOF
  openssl req -x509 -nodes -newkey rsa:2048 \
    -keyout "$TMP_KEY" -out "$TMP_CRT" -days 3650 \
    -config "$TMP_CNF" -extensions v3_req \
    >/dev/null 2>&1 || { echo "openssl failed" >&2; rm -f "$TMP_CNF" "$TMP_CRT" "$TMP_KEY"; exit 1; }
  mv "$TMP_CRT" "$HOME_DIR/.dsh/dsh-tls.crt"
  mv "$TMP_KEY" "$HOME_DIR/.dsh/dsh-tls.key"
  chmod 600 "$HOME_DIR/.dsh/dsh-tls.key"
  rm -f "$TMP_CNF"
else
  echo "[step 6] TLS cert already present, leaving it"
fi

# ─── 7. secrets gate ─────────────────────────────────────
MISSING=()
[ -f "$HOME_DIR/.dsh/dsh-web.env" ]     || MISSING+=("$HOME_DIR/.dsh/dsh-web.env (EnvironmentFile: CLIPROXY_API_KEY, DEEPSEEK_API_KEY)")
[ -f "$HOME_DIR/.dsh/.credentials.yaml" ] || MISSING+=("$HOME_DIR/.dsh/.credentials.yaml (provider API keys; wins over dsh-web.env)")
if [ "${#MISSING[@]}" -gt 0 ]; then
  echo "[step 7] STOP: required secrets are missing (NOT in git):" >&2
  for m in "${MISSING[@]}"; do echo "  - $m" >&2; done
  echo "Create them manually, then re-run $0 $LISTEN_IP" >&2
  exit 1
fi
chmod 600 "$HOME_DIR/.dsh/dsh-web.env" 2>/dev/null || true

# ─── 8. install + enable systemd unit ────────────────────
echo "[step 8] rendering + installing dsh-web.service"
SERVICE_DIR="$HOME_DIR/.config/systemd/user"
mkdir -p "$SERVICE_DIR"
# Resolve real interpreter + dsh binary at render time (paths differ per machine:
# npm -g installs under ~/.npm-global on some boxes, ~/.local on others).
DSH_BIN=$(command -v dsh) || { echo "dsh not on PATH; cannot render unit" >&2; exit 1; }
DSH_BIN=$(readlink -f "$DSH_BIN")
NODE_BIN=$(command -v node) || { echo "node not on PATH; cannot render unit" >&2; exit 1; }
NODE_BIN=$(readlink -f "$NODE_BIN")
echo "[step 8] ExecStart=$NODE_BIN $DSH_BIN web ..."
sed -e "s|__HOME__|$HOME_DIR|g" \
    -e "s|__NODE_BIN__|$NODE_BIN|g" \
    -e "s|__DSH_BIN__|$DSH_BIN|g" \
    "$SERVICE_TMPL" > "$SERVICE_DIR/dsh-web.service"
chmod 644 "$SERVICE_DIR/dsh-web.service"

if [ "$NO_SERVICE" -eq 1 ]; then
  echo "[step 8] --no-service: unit written but NOT enabled/started."
  echo "  Start it yourself when ready:"
  echo "    export XDG_RUNTIME_DIR=/run/user/\$(id -u)"
  echo "    systemctl --user daemon-reload && systemctl --user enable --now dsh-web.service"
  echo "[ok] install complete except service start (--no-service)."
  exit 0
fi

export XDG_RUNTIME_DIR="/run/user/$(id -u)"
systemctl --user daemon-reload
systemctl --user enable dsh-web.service
systemctl --user restart dsh-web.service

# ─── 9. print the reverse-proxy token ────────────────────
echo "[step 9] reverse-proxy status:"
sleep 3
curl -s -H 'x-dsh-reverse-proxy-control: 1' "http://127.0.0.1:3080/dsh-reverse-proxy/status" || true
echo
if [ -f "$HOME_DIR/.dsh/reverse-proxy.json" ]; then
  TOK=$(python3 -c "import json,sys;print(json.load(open(sys.argv[1]))['accessToken'])" "$HOME_DIR/.dsh/reverse-proxy.json" 2>/dev/null || echo "<unavailable>")
  echo "Reverse-proxy token: $TOK"
else
  echo "(reverse-proxy.json not yet written — first-boot will mint one; re-run status from a loopback UI)"
fi
echo "Install complete. dsh-web reachable at https://$LISTEN_IP:3080"