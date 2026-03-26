#!/bin/bash
# create-expert.sh - Interactive Expert Skill Generator
#
# This script prompts for domain details and generates a complete
# Agent Expert skill from the template skeleton.

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Template directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKELETON_DIR="$SCRIPT_DIR/skeleton"

# Functions
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_step() {
    echo -e "${GREEN}→ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

prompt_value() {
    local prompt="$1"
    local default="$2"
    local result

    if [ -n "$default" ]; then
        read -p "$(echo -e ${GREEN}✓${NC} $prompt [$default]: " )" result
        echo "${result:-$default}"
    else
        read -p "$(echo -e ${GREEN}✓${NC} $prompt: " )" result
        echo "$result"
    fi
}

prompt_list() {
    local prompt="$1"
    local result
    local items=()

    echo "$(echo -e ${GREEN}✓${NC} $prompt (one per line, empty line to finish):)"

    while true; do
        read -p "  " item
        if [ -z "$item" ]; then
            break
        fi
        items+=("$item")
    done

    # Return as comma-separated string
    local IFS=","
    echo "${items[*]}"
}

# Main script
print_header "Agent Expert Generator"

echo ""
print_info "This script will create a new Agent Expert skill from templates."
print_info "You'll be prompted for domain-specific information."
echo ""

# Basic Information
print_step "Basic Information"
EXPERT_NAME=$(prompt_value "Expert name (snake_case)" "my_expert")
EXPERT_DISPLAY=$(prompt_value "Display name" "My Expert")
DOMAIN=$(prompt_value "Domain" "My Domain")
DESCRIPTION=$(prompt_value "Description" "Expert knowledge of $DOMAIN")
VERSION=$(prompt_value "Version" "1.0.0")
AUTHOR=$(prompt_value "Author" "$(whoami)")
DATE=$(date +%Y-%m-%d)

# Output Directory
echo ""
print_step "Output Directory"
PROJECT_DIR=$(prompt_value "Where to create the skill" ".claude/skills")

# Auto-invocation Triggers
echo ""
print_step "Auto-Invocation Triggers"
print_info "What questions should trigger this skill? (e.g., 'python error', 'import problem')"
TRIGGERS=$(prompt_list "Trigger phrases")

# Domain Entities
echo ""
print_step "Domain Entities"
print_info "What are the key entities in $DOMAIN? (e.g., 'modules', 'classes', 'functions')"
ENTITIES=$(prompt_list "Domain entities")

# Domain Concepts
echo ""
print_step "Domain Concepts"
print_info "What are the core concepts in $DOMAIN? (e.g., 'inheritance', 'polymorphism')"
CONCEPTS=$(prompt_list "Core concepts")

# Common Operations
echo ""
print_step "Common Operations"
print_info "What common operations should this expert handle? (e.g., 'debugging', 'testing')"
OPERATIONS=$(prompt_list "Common operations")

# Sources of Truth
echo ""
print_step "Sources of Truth"
print_info "Where can information be validated? (e.g., official docs, API references)"
SOURCE_1_NAME=$(prompt_value "Primary source name" "Official Documentation")
SOURCE_1_URL=$(prompt_value "Primary source URL" "")
SOURCE_2_NAME=$(prompt_value "Secondary source name" "")
SOURCE_2_URL=$(prompt_value "Secondary source URL" "")

# Safety Patterns
echo ""
print_step "Safety Considerations"
SAFETY_PATTERNS=$(prompt_value "Any safety considerations? (leave empty if none)" "")

# Output Path
OUTPUT_PATH="$PROJECT_DIR/$EXPERT_NAME"

# Confirm
echo ""
print_header "Summary"
echo ""
echo "Expert name:       $EXPERT_NAME"
echo "Display name:      $EXPERT_DISPLAY"
echo "Domain:            $DOMAIN"
echo "Output path:       $OUTPUT_PATH"
echo "Triggers:          $TRIGGERS"
echo "Entities:          $ENTITIES"
echo "Concepts:          $CONCEPTS"
echo "Operations:        $OPERATIONS"
echo ""

read -p "Create this expert? [Y/n] " confirm
if [[ "$confirm" =~ ^[Nn]$ ]]; then
    echo "Aborted."
    exit 0
fi

# Create directories
echo ""
print_step "Creating directories..."

# Check if output directory already exists
if [ -d "$OUTPUT_PATH" ]; then
    read -p "Directory $OUTPUT_PATH already exists. Overwrite? [y/N] " overwrite
    if [[ ! "$overwrite" =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 0
    fi
    rm -rf "$OUTPUT_PATH"
fi

mkdir -p "$OUTPUT_PATH/expertise"
mkdir -p "$OUTPUT_PATH/scripts"
mkdir -p "$OUTPUT_PATH/references"
mkdir -p "$OUTPUT_PATH/examples"

# Template substitution function
substitute_template() {
    local input="$1"
    local output="$2"

    # Read template, substitute, write output
    sed -e "s|{{EXPERT_NAME}}|$EXPERT_NAME|g" \
        -e "s|{{EXPERT_DISPLAY}}|$EXPERT_DISPLAY|g" \
        -e "s|{{DOMAIN}}|$DOMAIN|g" \
        -e "s|{{DESCRIPTION}}|$DESCRIPTION|g" \
        -e "s|{{VERSION}}|$VERSION|g" \
        -e "s|{{AUTHOR}}|$AUTHOR|g" \
        -e "s|{{DATE}}|$DATE|g" \
        -e "s|{{PROJECT_DIR}}|$PROJECT_DIR|g" \
        -e "s|{{TRIGGER_1}}|$TRIGGERS|g" \
        -e "s|{{ENTITY_1}}|$ENTITIES|g" \
        -e "s|{{CONCEPT_1}}|$CONCEPTS|g" \
        -e "s|{{OPERATION_1}}|$OPERATIONS|g" \
        -e "s|{{SOURCE_1_NAME}}|$SOURCE_1_NAME|g" \
        -e "s|{{SOURCE_1_URL}}|$SOURCE_1_URL|g" \
        -e "s|{{SOURCE_2_NAME}}|$SOURCE_2_NAME|g" \
        -e "s|{{SOURCE_2_URL}}|$SOURCE_2_URL|g" \
        -e "s|{{SAFETY_PATTERNS}}|$SAFETY_PATTERNS|g" \
        "$input" > "$output"
}

# Generate files from templates
print_step "Generating files..."

# Remove .template suffix from output filenames
for template in "$SKELETON_DIR"/*.template "$SKELETON_DIR"/**/*.template "$SKELETON_DIR"/**/**/*.template 2>/dev/null; do
    if [ -f "$template" ]; then
        # Get relative path from skeleton directory
        rel_path="${template#$SKELETON_DIR/}"
        # Remove .template suffix
        output_name="${rel_path%.template}"
        output_file="$OUTPUT_PATH/$output_name"

        # Create output directory if needed
        mkdir -p "$(dirname "$output_file")"

        # Substitute and write
        substitute_template "$template" "$output_file"
        echo "  Created: $output_name"
    fi
done

# Set executable permissions for scripts
chmod +x "$OUTPUT_PATH/scripts/expert.py"
chmod +x "$OUTPUT_PATH/scripts/run-expert.sh"

# Create expertise files with proper structure
print_step "Setting up expertise files..."

# Create the expertise.yaml file (already generated above, just noting)
echo "  Expertise structure created"

# Copy the template prompts to expertise directory for reference
if [ -f "$SKELETON_DIR/expertise/query.prompt.template" ]; then
    substitute_template "$SKELETON_DIR/expertise/query.prompt.template" "$OUTPUT_PATH/expertise/query.prompt"
    echo "  Created: expertise/query.prompt"
fi

if [ -f "$SKELETON_DIR/expertise/self-improve.prompt.template" ]; then
    substitute_template "$SKELETON_DIR/expertise/self-improve.prompt.template" "$OUTPUT_PATH/expertise/self-improve.prompt"
    echo "  Created: expertise/self-improve.prompt"
fi

# Summary
echo ""
print_header "Expert Created!"
echo ""
echo -e "${GREEN}Created expert at:${NC} $OUTPUT_PATH"
echo ""
echo "Files created:"
echo "  SKILL.md              - Main skill definition"
echo "  expertise/"
echo "    expertise.yaml      - Mental model"
echo "    query.prompt        - Query processing instructions"
echo "    self-improve.prompt - Self-improvement instructions"
echo "  scripts/"
echo "    expert.py           - Core implementation"
echo "    run-expert.sh       - CLI wrapper"
echo "  README.md             - Quick start guide"
echo "  examples.md           - Usage examples"
echo "  reference.md          - Domain reference"
echo "  CHANGELOG.md          - Version history"
echo ""
echo "Next steps:"
echo "  1. Review and customize expertise/expertise.yaml with domain knowledge"
echo "  2. Edit SKILL.md to refine auto-invocation triggers"
echo "  3. Add concrete examples to examples.md"
echo "  4. Test the skill: ./scripts/run-expert.sh info"
echo ""
echo "Test queries:"
echo "  - Ask Claude about: $DOMAIN"
echo "  - Use trigger phrases: $TRIGGERS"
echo ""
