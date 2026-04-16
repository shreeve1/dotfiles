#!/bin/bash
CLAUDE_DIR="$HOME/.claude"
SETTINGS_FILE="$CLAUDE_DIR/settings.json"

case "$1" in
  anthropic)
    cp "$CLAUDE_DIR/settings-anthropic.json" "$SETTINGS_FILE"
    echo "Switched to Anthropic provider"
    ;;
  zai)
    cp "$CLAUDE_DIR/settings-zai.json" "$SETTINGS_FILE"
    echo "Switched to z.ai provider"
    ;;
  moonshot)
    cp "$CLAUDE_DIR/settings-moonshot.json" "$SETTINGS_FILE"
    echo "Switched to Moonshot provider"
    ;;
  alibaba)
    cp "$CLAUDE_DIR/settings-alibaba.json" "$SETTINGS_FILE"
    echo "Switched to Alibaba provider"
    ;;
  openrouter)
    cp "$CLAUDE_DIR/settings-openrouter.json" "$SETTINGS_FILE"
    echo "Switched to OpenRouter provider"
    ;;
  minimax)
    cp "$CLAUDE_DIR/settings-minimax.json" "$SETTINGS_FILE"
    echo "Switched to MiniMax provider"
    ;;
  *)
    echo "Usage: switch-provider.sh [anthropic|zai|moonshot|alibaba|openrouter|minimax]"
    current_url=$(jq -r '.env.ANTHROPIC_BASE_URL // "unknown"' "$SETTINGS_FILE" 2>/dev/null)
    if [[ "$current_url" == *"anthropic.com" ]]; then
      echo "Current provider: Anthropic"
    elif [[ "$current_url" == *"z.ai" ]]; then
      echo "Current provider: z.ai"
    elif [[ "$current_url" == *"moonshot.ai" ]]; then
      echo "Current provider: Moonshot"
    elif [[ "$current_url" == *"dashscope" ]]; then
      echo "Current provider: Alibaba"
    elif [[ "$current_url" == *"openrouter" ]]; then
      echo "Current provider: OpenRouter"
    elif [[ "$current_url" == *"minimax" ]]; then
      echo "Current provider: MiniMax"
    else
      echo "Current provider: Unknown ($current_url)"
    fi
    exit 1
    ;;
esac
