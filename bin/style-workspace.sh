#!/usr/bin/env bash
# Shared no-Git workspace boundaries for style-init and style-check.

style_workspace_root() {
  if [ -z "${1-}" ] || [[ "$1" == -* ]] || [ ! -d "$1" ]; then
    echo 'style: --no-git requires an existing workspace directory' >&2
    return 2
  fi
  ROOT=$(cd "$1" && pwd -P) || return 2
  local dir="$ROOT"
  # Filesystem markers still work when Git discovery is limited by environment
  # variables, missing binaries or a dubious-ownership refusal.
  while :; do
    if [ -e "$dir/.git" ] || [ -L "$dir/.git" ] || { [ -f "$dir/HEAD" ] && [ -d "$dir/objects" ] && [ -d "$dir/refs" ]; }; then
      echo 'style: --no-git cannot be used inside a Git repository' >&2
      return 2
    fi
    [ "$dir" != / ] || break
    dir=$(dirname "$dir")
  done
  if git -C "$ROOT" rev-parse --show-toplevel >/dev/null 2>&1; then
    echo 'style: --no-git cannot be used inside a Git repository' >&2
    return 2
  fi
}

style_workspace_ignored() {
  local path="$1" part p
  local -a parts
  IFS=/ read -r -a parts <<<"$path"
  # Only directory components: a regular file named "build" is not a cache.
  for part in "${parts[@]:0:${#parts[@]}-1}"; do
    case "$part" in
    .git | node_modules | .venv | venv | __pycache__ | .stversions | .cache | .ruff_cache | .pytest_cache | .mypy_cache | .superpowers | vendor | dist | build | tmp | artifacts | .sessions | .sync) return 0 ;;
    esac
  done
  case "/$path" in */.pi/fabric/*) return 0 ;; esac
  for p in ${WORKSPACE_IGNORES[@]+"${WORKSPACE_IGNORES[@]}"}; do
    # shellcheck disable=SC2053 # .styleignore entries are globs.
    [[ "$path" == $p ]] && return 0
  done
  return 1
}

style_workspace_files() {
  local path absolute lexical relative listing line dir
  WORKSPACE_FILES=()
  WORKSPACE_IGNORES=()
  if [ -f "$ROOT/.styleignore" ]; then
    while IFS= read -r line || [ -n "$line" ]; do
      line="${line%%#*}"
      line="${line%"${line##*[![:space:]]}"}"
      [ -n "$line" ] && WORKSPACE_IGNORES+=("$line")
    done <"$ROOT/.styleignore"
  fi
  if [ "$#" -eq 0 ]; then
    listing=$(mktemp) || return 2
    if ! find "$ROOT" -mindepth 1 -type d \( -name .git -o -name node_modules -o -name .venv -o -name venv -o -name __pycache__ -o -name .stversions -o -name .cache -o -name .ruff_cache -o -name .pytest_cache -o -name .mypy_cache -o -name .superpowers -o -name vendor -o -name dist -o -name build -o -name tmp -o -name artifacts -o -name .sessions -o -name .sync -o -path '*/.pi/fabric' -o -exec test -e '{}/.git' \; \) -prune -o -type f -print0 >"$listing"; then
      rm -f "$listing"
      return 2
    fi
    while IFS= read -r -d '' path; do
      relative="${path#"$ROOT/"}"
      style_workspace_ignored "$relative" || WORKSPACE_FILES+=("./$relative")
    done <"$listing"
    rm -f "$listing"
  else
    # Validate the entire request before returning any paths to a formatter.
    for path in "$@"; do
      [[ "$path" == /* ]] || path="$ROOT/$path"
      lexical=$(realpath -ms -- "$path") || return 2
      absolute=$(realpath -e -- "$path" 2>/dev/null) || {
        echo "style: file does not exist: $path" >&2
        return 2
      }
      if [[ "$absolute" != "$ROOT/"* ]] || [ "$absolute" != "$lexical" ] || [ ! -f "$absolute" ]; then
        echo "style: expected a regular non-symlink file inside $ROOT: $path" >&2
        return 2
      fi
      relative="${absolute#"$ROOT/"}"
      style_workspace_ignored "$relative" && continue
      dir=$(dirname "$absolute")
      while [ "$dir" != "$ROOT" ]; do
        if [ -e "$dir/.git" ]; then
          echo "style: file belongs to a nested Git repository: $path" >&2
          return 2
        fi
        dir=$(dirname "$dir")
      done
      WORKSPACE_FILES+=("./$relative")
    done
  fi
}
