#!/bin/bash
# Copy Claude Config
# Copies ~/.claude/ to ~/claude-config/ without cache/session data

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Directories
SOURCE_DIR="$HOME/.claude"
TARGET_DIR="$HOME/claude-config"

# Parse arguments
DRY_RUN=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Header
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          Copy Claude Config (no git required)               ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
    echo -e "${RED}✗ Source directory not found: $SOURCE_DIR${NC}"
    exit 1
fi

# Create target directory if it doesn't exist
if [ ! -d "$TARGET_DIR" ]; then
    echo -e "${YELLOW}Creating target directory: $TARGET_DIR${NC}"
    mkdir -p "$TARGET_DIR"
fi

# Define exclusions
EXCLUSIONS=(
    # Session and cache data
    "sessions/"
    "cache/"
    "tmp/"
    ".claude/"

    # Logs
    "logs/*.jsonl"
    "logs/*.log"

    # Python cache
    "__pycache__"
    "*.pyc"

    # Other generated files
    "*.swp"
    "*.swo"
    ".DS_Store"
)

# Build rsync exclude arguments
RSYNC_EXCLUDES=""
for excl in "${EXCLUSIONS[@]}"; do
    RSYNC_EXCLUDES="$RSYNC_EXCLUDES --exclude='$excl'"
done

echo -e "${BLUE}Copying config files...${NC}"
echo "  Source: $SOURCE_DIR"
echo "  Target: $TARGET_DIR"
echo ""

if [ "$VERBOSE" = true ]; then
    echo -e "${CYAN}Excluded:${NC}"
    for excl in "${EXCLUSIONS[@]}"; do
        echo "  - $excl"
    done
    echo ""
fi

if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}[DRY RUN] No files will be copied${NC}"
    echo ""
    rsync -a --delete $RSYNC_EXCLUDES --dry-run --itemize-changes "$SOURCE_DIR/" "$TARGET_DIR/" | head -20
    echo ""
    echo "Run without --dry-run to apply changes."
else
    # Perform the copy
    if [ "$VERBOSE" = true ]; then
        rsync -a --delete $RSYNC_EXCLUDES "$SOURCE_DIR/" "$TARGET_DIR/"
    else
        rsync -a --delete $RSYNC_EXCLUDES "$SOURCE_DIR/" "$TARGET_DIR/" --quiet
    fi

    # Count files copied
    FILE_COUNT=$(find "$TARGET_DIR" -type f | wc -l | tr -d ' ')
    DIR_COUNT=$(find "$TARGET_DIR" -type d | wc -l | tr -d ' ')

    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                    Copy Complete!                            ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Source:     $SOURCE_DIR"
    echo "Target:     $TARGET_DIR"
    echo "Files:      $FILE_COUNT"
    echo "Directories: $DIR_COUNT"
    echo ""
fi
