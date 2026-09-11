#!/usr/bin/env bash
# Claude Code statusline — token usage + context bar + cwd
# Receives JSON on stdin from Claude Code

input=$(cat)

# Extract fields
used_pct=$(echo "$input" | jq -r '.context_window.used_percentage // empty')
remaining_pct=$(echo "$input" | jq -r '.context_window.remaining_percentage // empty')
ctx_size=$(echo "$input" | jq -r '.context_window.context_window_size // empty')
cwd=$(echo "$input" | jq -r '.workspace.current_dir // .cwd // empty')

# Shorten cwd: replace $HOME with ~, truncate to last 2 path segments if long
home="$HOME"
cwd="${cwd/#$home/\~}"
# Keep last 2 segments if more than 2 deep
seg_count=$(echo "$cwd" | tr -cd '/' | wc -c)
if [ "$seg_count" -gt 2 ]; then
  cwd="…/$(echo "$cwd" | rev | cut -d'/' -f1-2 | rev)"
fi

# If no usage data yet, show just cwd
if [ -z "$used_pct" ] || [ -z "$ctx_size" ]; then
  printf "%s" "$cwd"
  exit 0
fi

# Compute display values
used_int=$(printf "%.0f" "$used_pct")
remaining_int=$(printf "%.0f" "$remaining_pct")

# Derive used tokens from percentage — current_usage.input_tokens is only the
# latest turn's input, not the cumulative context size.
used_tokens=$(echo "($ctx_size * $used_pct + 50) / 100" | bc)

# Format token counts (K / M suffix)
fmt_tokens() {
  local n="$1"
  if [ "$n" -ge 1000000 ]; then
    printf "%.1fM" "$(echo "scale=1; $n / 1000000" | bc)"
  elif [ "$n" -ge 1000 ]; then
    printf "%.1fK" "$(echo "scale=1; $n / 1000" | bc)"
  else
    printf "%d" "$n"
  fi
}
used_fmt=$(fmt_tokens "$used_tokens")
ctx_fmt=$(fmt_tokens "$ctx_size")

# Build progress bar (10 chars wide using block chars) — round instead of floor
bar_width=10
filled=$(echo "($used_pct * $bar_width + 50) / 100" | bc)
[ "$filled" -gt "$bar_width" ] && filled=$bar_width
empty=$(( bar_width - filled ))
bar=""
for ((i=0; i<filled; i++)); do bar="${bar}█"; done
for ((i=0; i<empty; i++)); do  bar="${bar}░"; done

# Color: green < 70%, yellow 70-85%, red > 85%
if [ "$used_int" -ge 85 ]; then
  color="\033[0;31m"   # red
elif [ "$used_int" -ge 70 ]; then
  color="\033[0;33m"   # yellow
else
  color="\033[0;32m"   # green
fi
reset="\033[0m"

printf "${color}[${bar}]${reset} %s/%s (%d%% used, %d%% left)  %s" \
  "$used_fmt" "$ctx_fmt" "$used_int" "$remaining_int" "$cwd"
