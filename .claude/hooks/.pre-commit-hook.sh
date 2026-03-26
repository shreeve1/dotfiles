#!/bin/bash
#
# Pre-commit hook for validating Claude Code settings.json
#
# Installation:
#   ln -sf ~/.claude/hooks/.pre-commit-hook.sh ~/.claude/.git/hooks/pre-commit
#
# This hook validates settings.json before allowing commits to prevent
# broken configurations from being committed.

set -e

SETTINGS_FILE="$HOME/.claude/settings.json"
VALIDATOR="$HOME/.claude/hooks/validate_hooks_config.py"

# Check if settings.json is in staged files
if git diff --cached --name-only | grep -q "settings.json"; then
    echo "🔍 Validating settings.json..."

    # Check if validator exists
    if [ ! -f "$VALIDATOR" ]; then
        echo "⚠️  Warning: Validator not found at $VALIDATOR"
        echo "Skipping validation..."
        exit 0
    fi

    # Run validation
    if uv run "$VALIDATOR" "$SETTINGS_FILE"; then
        echo "✓ Settings validation passed"
        exit 0
    else
        echo ""
        echo "❌ Settings validation failed!"
        echo ""
        echo "Your settings.json has validation errors that must be fixed before committing."
        echo ""
        echo "Options:"
        echo "  1. Fix the errors manually"
        echo "  2. Run 'uv run $VALIDATOR --fix' to auto-fix common issues"
        echo "  3. Use 'git commit --no-verify' to skip validation (not recommended)"
        echo ""
        exit 1
    fi
fi

# settings.json not modified, allow commit
exit 0
