#!/bin/bash
# Claude provider switcher

MODE=${1:-local}

if [ "$MODE" == "local" ]; then
    cp ~/.claude/settings-ollama.json ~/.claude/settings.json
    echo "✅ Switched to LOCAL (Ollama + qwen2.5:32b)"
    echo "   Model: qwen2.5:32b (19GB)"
    echo "   Search: Tavily API"
    ollama ps 2>/dev/null | grep -q "qwen2.5" || echo "   ⚠️  Model not loaded. Run: ollama run qwen2.5:32b"
elif [ "$MODE" == "cloud" ]; then
    cp ~/.claude/settings-anthropic.json ~/.claude/settings.json
    echo "✅ Switched to CLOUD (Anthropic Claude)"
    echo "   Models: Claude Sonnet/Opus"
    echo "   Search: Built-in"
else
    echo "Usage: claude-switch [local|cloud]"
    echo ""
    echo "Current status:"
    grep -q "qwen2.5" ~/.claude/settings.json 2>/dev/null && echo "   Mode: LOCAL" || echo "   Mode: CLOUD"
fi
