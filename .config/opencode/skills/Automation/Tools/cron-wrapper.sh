#!/usr/bin/env bash
# cron-wrapper.sh — Shared execution wrapper for PAI Automation cron jobs
# Provides: stable PATH, stagger, lockfiles, logging, timeout, failure alerting, execution journal

set -euo pipefail

# --- Export stable environment ---
export HOME="${HOME:-/home/james}"
export PATH="$HOME/.local/bin:$HOME/.bun/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin:/Applications/cmux.app/Contents/Resources/bin:${PATH:-}"

# PAI runtime root
PAI_DIR="${PAI_DIR:-$HOME/.pai}"
export PAI_DIR

# Resolve OpenCode binary dynamically for LLM runner scripts.
OPENCODE_BIN="$(command -v opencode 2>/dev/null || true)"
if [[ -z "$OPENCODE_BIN" && -x "/Applications/cmux.app/Contents/Resources/bin/opencode" ]]; then
  OPENCODE_BIN="/Applications/cmux.app/Contents/Resources/bin/opencode"
fi
OPENCODE_BIN="${OPENCODE_BIN:-opencode}"
export OPENCODE_BIN

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXEC_LOG="$PAI_DIR/logs/automation-execution.jsonl"

# gog file-based keyring password (Keychain inaccessible under cron launchd context)
if [[ -f "$PAI_DIR/secrets/gog-keyring-password" ]]; then
  export GOG_KEYRING_PASSWORD
  GOG_KEYRING_PASSWORD="$(cat "$PAI_DIR/secrets/gog-keyring-password")"
fi

# --- Defaults ---
STAGGER=0
LOCK_NAME=""
TIMEOUT_SECS=300
LOG_FILE=""
COMMAND=()

# --- Parse wrapper flags ---
while [[ $# -gt 0 ]]; do
  case "$1" in
    --stagger)
      STAGGER="$2"
      shift 2
      ;;
    --lock)
      LOCK_NAME="$2"
      shift 2
      ;;
    --timeout)
      TIMEOUT_SECS="$2"
      shift 2
      ;;
    --log)
      LOG_FILE="$2"
      shift 2
      ;;
    --)
      shift
      COMMAND=("$@")
      break
      ;;
    *)
      echo "Unknown wrapper option: $1" >&2
      exit 1
      ;;
  esac
done

# Validate command
if [[ ${#COMMAND[@]} -eq 0 ]]; then
  echo "Error: no command specified (use -- before the command)" >&2
  exit 1
fi

# --- Source Telegram credentials for alerting ---
source "$PAI_DIR/secrets/telegram-env.sh" 2>/dev/null || true

# --- Stagger: random sleep ---
if [[ "$STAGGER" -gt 0 ]]; then
  SLEEP_TIME=$((RANDOM % STAGGER))
  sleep "$SLEEP_TIME"
fi

# --- Lockfile ---
LOCK_DIR="$PAI_DIR/data/locks"
LOCK_PATH=""
if [[ -n "$LOCK_NAME" ]]; then
  mkdir -p "$LOCK_DIR"
  LOCK_PATH="$LOCK_DIR/$LOCK_NAME.lock"
  if ! (set -o noclobber; echo "$$" > "$LOCK_PATH") 2>/dev/null; then
    # Check if the process holding the lock is still alive
    LOCK_PID=$(cat "$LOCK_PATH" 2>/dev/null || echo "")
    if [[ -n "$LOCK_PID" ]] && kill -0 "$LOCK_PID" 2>/dev/null; then
      echo "Error: lock '$LOCK_NAME' held by PID $LOCK_PID" >&2
      exit 1
    fi
    # Stale lock — remove and retry
    rm -f "$LOCK_PATH"
    echo "$$" > "$LOCK_PATH"
  fi
fi

# --- Logging setup ---
LOG_DIR="$PAI_DIR/logs"
mkdir -p "$LOG_DIR"

# Derive job ID from lock name or command
JOB_ID="${LOCK_NAME:-$(basename "${COMMAND[0]}" 2>/dev/null || echo "unknown")}"

# Timestamp for log entry (pure bash — no python3 dependency)
START_MS=$(( $(date +%s) * 1000 ))

# --- Cleanup function ---
cleanup() {
  local EXIT_CODE=$?
  local END_MS
  END_MS=$(( $(date +%s) * 1000 ))
  local DURATION_MS=$((END_MS - START_MS))

  # Remove lockfile
  if [[ -n "$LOCK_PATH" && -f "$LOCK_PATH" ]]; then
    rm -f "$LOCK_PATH"
  fi

  # Determine status
  local STATUS="success"
  if [[ $EXIT_CODE -ne 0 ]]; then
    STATUS="failure"
  fi

  # Append to execution log
  local TIMESTAMP
  TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  local LOG_ENTRY
  LOG_ENTRY=$(printf '{"timestamp":"%s","jobId":"%s","status":"%s","durationMs":%d,"exitCode":%d}\n' \
    "$TIMESTAMP" "$JOB_ID" "$STATUS" "$DURATION_MS" "$EXIT_CODE")
  mkdir -p "$(dirname "$EXEC_LOG")"
  echo "$LOG_ENTRY" >> "$EXEC_LOG"

  # On failure: send Telegram alert
  if [[ $EXIT_CODE -ne 0 ]]; then
    local LAST_LINES=""
    if [[ -n "$ACTUAL_LOG" && -f "$ACTUAL_LOG" ]]; then
      LAST_LINES=$(tail -5 "$ACTUAL_LOG" 2>/dev/null || echo "unable to read log")
    fi
    local ALERT_MSG
    ALERT_MSG="*PAI Cron Alert*\nJob: ${JOB_ID}\nExit code: ${EXIT_CODE}\nDuration: ${DURATION_MS}ms\n\nLast log lines:\n\`\`\`\n${LAST_LINES}\n\`\`\`"
    "$SCRIPT_DIR/telegram-send.sh" --silent "$ALERT_MSG" 2>/dev/null || true
  fi

  exit $EXIT_CODE
}
trap cleanup EXIT

# --- Log rotation ---
MAX_EXEC_LOG_BYTES=10485760  # 10MB
MAX_JOB_LOG_BYTES=5242880    # 5MB

rotate_if_large() {
  local file="$1" max_bytes="$2"
  if [[ -f "$file" ]]; then
    local size
    size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo 0)
    if [[ "$size" -gt "$max_bytes" ]]; then
      # Keep 3 rotations
      rm -f "${file}.3.gz"
      [[ -f "${file}.2.gz" ]] && mv "${file}.2.gz" "${file}.3.gz"
      [[ -f "${file}.1.gz" ]] && mv "${file}.1.gz" "${file}.2.gz"
      gzip -c "$file" > "${file}.1.gz"
      : > "$file"
    fi
  fi
}

rotate_if_large "$EXEC_LOG" "$MAX_EXEC_LOG_BYTES"

# --- Resolve log path ---
if [[ -n "$LOG_FILE" ]]; then
  if [[ "$LOG_FILE" = /* ]]; then
    ACTUAL_LOG="$LOG_FILE"
  else
    ACTUAL_LOG="$PAI_DIR/logs/$LOG_FILE"
  fi
  mkdir -p "$(dirname "$ACTUAL_LOG")"
  rotate_if_large "$ACTUAL_LOG" "$MAX_JOB_LOG_BYTES"
fi

# --- Execute command with optional logging and timeout ---
if [[ -n "$LOG_FILE" ]]; then
  timeout "$TIMEOUT_SECS" "${COMMAND[@]}" 2>&1 | tee -a "$ACTUAL_LOG"
else
  timeout "$TIMEOUT_SECS" "${COMMAND[@]}"
fi
