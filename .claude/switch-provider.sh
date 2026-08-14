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
openai)
  cp "$CLAUDE_DIR/settings-openai.json" "$SETTINGS_FILE"
  # DEPRECATED: LiteLLM proxy has been decommissioned (CLIProxyAPI :8317 is the
  # active fleet proxy). settings-openai.json has been moved to .disabled.
  # This branch is preserved for reversibility — restoring it requires also
  # re-enabling litellm-proxy.service + litellm-socat.service.
  echo "Switched to OpenAI provider — DEPRECATED (LiteLLM decommissioned; CLIProxyAPI :8317 is the active proxy). Source profile settings-openai.json is .disabled."
  ;;
*)
  echo "Usage: switch-provider.sh [anthropic|zai|moonshot|alibaba|openrouter|minimax|openai-deprecated]"
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
  elif [[ "$current_url" == *"localhost:13400"* ]]; then
    # Port was :4000 (LiteLLM) bridged to :13400 (socat) when the proxy was active.
    # LiteLLM is now decommissioned — this branch should not match in normal use.
    echo "Current provider: OpenAI — DEPRECATED (LiteLLM decommissioned; CLIProxyAPI :8317 is the active proxy)"
  else
    echo "Current provider: Unknown ($current_url)"
  fi
  exit 1
  ;;
esac
