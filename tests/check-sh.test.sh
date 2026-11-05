#!/usr/bin/env bash
# check.sh classifies files correctly: zsh files are parsed by zsh, a shebang counts only on a
# file's first line (so a heredoc that embeds another script is not mistaken for it), the
# coverage guard names files that exist, and the one vendored JSONC file is parsed as JSONC.
# Each case runs a copy of check.sh against a throwaway git repo, plus one run against this repo
# with a scratch HOME.
set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

pass=0
failures=()
check() {
  if [ "$2" = "yes" ]; then pass=$((pass + 1)); else failures+=("$1"); fi
}
contains() { case "$1" in *"$2"*) echo yes ;; *) echo no ;; esac }
lacks() { case "$1" in *"$2"*) echo no ;; *) echo yes ;; esac }
commit() { (cd "$1" && git add -A && git -c user.email=t@t -c user.name=t commit -qm "$2"); }

# A minimal repo that satisfies every guard in check.sh.
mkfixture() {
  local d="$1"
  mkdir -p "$d/bin" "$d/tests" "$d/.pi/agent/extensions/pi-lens/config"
  cp "$ROOT/check.sh" "$d/check.sh"
  printf 'link_path "%s" "%s"\n' ".bashrc" ".bashrc" >"$d/install.sh"
  printf 'echo bashrc\n' >"$d/.bashrc"
  printf 'echo zshrc\n' >"$d/.zshrc"
  printf '#!/usr/bin/env bash\necho tool\n' >"$d/bin/style-check"
  printf '#!/usr/bin/env python3\nprint(1)\n' >"$d/bin/prune-dead-links"
  printf 'print(1)\n' >"$d/tests/prune-oracle.py"
  printf '{}\n' >"$d/a.json"
  chmod +x "$d/bin/"*
  (cd "$d" && git init -q && git add -A && git -c user.email=t@t -c user.name=t commit -qm init)
}
run_gate() { (cd "$1" && HOME="$TMP/home" DOTFILES_DIR="$1" bash check.sh 2>&1); }
mkdir -p "$TMP/home"

mkfixture "$TMP/base"
out="$(run_gate "$TMP/base")"
check "baseline fixture passes" "$(contains "$out" "ok")"
check "baseline fixture has no failures" "$(lacks "$out" "FAIL:")"

# zsh-only syntax in .zshrc is parsed by zsh, not bash
if command -v zsh >/dev/null; then
  F="$TMP/zsh"
  mkfixture "$F"
  printf 'for _f in ${HOME}/zsh/*.zsh(N); do source "$_f"; done\n' >"$F/.zshrc"
  commit "$F" zsh
  out="$(run_gate "$F")"
  check "zsh glob qualifier in .zshrc is not a bash syntax error" "$(lacks "$out" "syntax: .zshrc")"

  F="$TMP/zsh-bad"
  mkfixture "$F"
  printf 'if then fi (\n' >"$F/.zshrc"
  commit "$F" zshbad
  out="$(run_gate "$F")"
  check "a real .zshrc syntax error still fails" "$(contains "$out" "zsh syntax: .zshrc")"
fi

# a shell script that embeds a python shebang in a heredoc is not a python file
F="$TMP/heredoc"
mkfixture "$F"
cat >"$F/tests/embed.test.sh" <<'EOS'
#!/usr/bin/env bash
cat >"$1" <<'EOF'
#!/usr/bin/env python3
print({"a": 1})
EOF
EOS
printf '#!/usr/bin/env python3\nprint(\n' >"$F/bin/broken-py"
chmod +x "$F/bin/broken-py"
commit "$F" heredoc
out="$(run_gate "$F")"
check "heredoc python shebang in a shell script is not parsed as python" "$(lacks "$out" "python syntax: tests/embed.test.sh")"
check "a python file with a first-line shebang is still parsed" "$(contains "$out" "python syntax: bin/broken-py")"

# the coverage guard names only files that exist
guard_names="$(sed -n "/^done <<'MUST'/,/^MUST/p" "$ROOT/check.sh" | grep -v -e MUST -e '^done')"
missing=""
while read -r g; do [ -e "$ROOT/$g" ] || missing="$missing $g"; done <<<"$guard_names"
check "every file the coverage guards name exists${missing:+ (missing:$missing)}" "$([ -z "$missing" ] && echo yes || echo no)"

# JSONC: comments allowed in the one vendored file that ships them, nothing else
F="$TMP/jsonc"
mkfixture "$F"
A=".pi/agent/extensions/pi-lens/config/dependency-cruiser-eager-allowlist.json"
printf '[\n  "./a.js",\n  // a comment\n  "./b.js"\n]\n' >"$F/$A"
printf '{\n  // not allowed here\n  "a": 1\n}\n' >"$F/c.json"
commit "$F" jsonc
out="$(run_gate "$F")"
check "JSONC allowlist with comments passes" "$(lacks "$out" "invalid JSON: $A")"
check "comments in any other .json still fail" "$(contains "$out" "invalid JSON: c.json")"
printf '[\n  "./a.js",\n  // a comment\n  "./b.js",\n]\n' >"$F/$A"
commit "$F" jsonc2
out="$(run_gate "$F")"
check "JSONC allowlist is still validated after comments are stripped" "$(contains "$out" "invalid JSON: $A")"

# this repo, with a scratch HOME so the dangling-link scan reads nothing live
out="$(cd "$ROOT" && HOME="$TMP/home" bash check.sh 2>&1)"
rc=$?
check "check.sh passes on this repo" "$([ "$rc" -eq 0 ] && echo yes || echo no)"
[ "$rc" -eq 0 ] || printf '%s\n' "$out" >&2

for f in "${failures[@]+"${failures[@]}"}"; do echo "FAIL: $f" >&2; done
echo "check-sh: $pass passed, ${#failures[@]} failed"
[ "${#failures[@]}" -eq 0 ]
