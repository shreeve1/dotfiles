#!/usr/bin/env bash
# telegram-send.sh — Telegram Bot API helper for PAI Automation
# Credentials sourced from ~/.claude/secrets/telegram-env.sh (canonical source)

set -euo pipefail

# Source credentials
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$HOME/.claude/secrets/telegram-env.sh"

# Defaults
CHAT_ID="${TELEGRAM_CHAT_ID:-}"
PARSE_MODE="Markdown"
SILENT=false
MESSAGE=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --chat-id)
      CHAT_ID="$2"
      shift 2
      ;;
    --parse-mode)
      PARSE_MODE="$2"
      shift 2
      ;;
    --silent)
      SILENT=true
      shift
      ;;
    -*)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
    *)
      MESSAGE="$1"
      shift
      ;;
  esac
done

# Validate required inputs
if [[ -z "$MESSAGE" ]]; then
  echo "Error: message text is required" >&2
  exit 1
fi

if [[ -z "${TELEGRAM_BOT_TOKEN:-}" ]]; then
  echo "Error: TELEGRAM_BOT_TOKEN not set (check ~/.claude/secrets/telegram-env.sh)" >&2
  exit 1
fi

if [[ -z "$CHAT_ID" ]]; then
  echo "Error: TELEGRAM_CHAT_ID not set (check ~/.claude/secrets/telegram-env.sh)" >&2
  exit 1
fi

# Build API URL
API_URL="https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage"

# Build JSON payload with proper escaping
if command -v jq >/dev/null 2>&1; then
  JSON_PAYLOAD=$(jq -n \
    --arg chat_id "$CHAT_ID" \
    --arg text "$MESSAGE" \
    --arg parse_mode "$PARSE_MODE" \
    '{chat_id: $chat_id, text: $text, parse_mode: $parse_mode}')
else
  JSON_PAYLOAD=$(python3 -c "
import json, sys
print(json.dumps({
    'chat_id': sys.argv[1],
    'text': sys.argv[2],
    'parse_mode': sys.argv[3]
}))" "$CHAT_ID" "$MESSAGE" "$PARSE_MODE")
fi

# Send message
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "$JSON_PAYLOAD")

# Extract HTTP status code (last line)
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

# Check for API error
if [[ "$HTTP_CODE" != "200" ]]; then
  if [[ "$SILENT" != "true" ]]; then
    echo "Telegram API error (HTTP $HTTP_CODE): $BODY" >&2
  fi
  exit 1
fi

# Check for ok:false in response
OK=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('ok',''))" 2>/dev/null || echo "")
if [[ "$OK" != "True" ]]; then
  if [[ "$SILENT" != "true" ]]; then
    echo "Telegram API returned error: $BODY" >&2
  fi
  exit 1
fi

if [[ "$SILENT" != "true" ]]; then
  echo "Message sent successfully"
fi
