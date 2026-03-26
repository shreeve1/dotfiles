# Agent Expert Template Prompt

> Use this prompt to generate a complete Agent Expert skill for any domain.

## What is an Agent Expert?

An Agent Expert is a specialized Claude Code skill that provides:
- **Domain expertise** - Deep knowledge of a specific technical domain
- **Query workflow** - A systematic process for answering domain questions
- **Self-improvement workflow** - Ability to learn from codebases and update knowledge
- **Mental model** - Structured knowledge representation (expertise.yaml)
- **CLI tools** - Scripts for querying and self-improvement

## Domain Collection

Before generating the expert, gather the following information:

### Essential Information

1. **Expert name** - snake_case identifier (e.g., `python_expert`, `kubernetes_expert`)
2. **Display name** - Human-readable name (e.g., "Python Expert", "Kubernetes Expert")
3. **Domain** - The technical domain (e.g., "Python Programming", "Kubernetes Orchestration")
4. **Description** - One-line description of what the expert does
5. **Project directory** - Where to create the skill (default: current project's `.claude/skills/`)

### Domain Knowledge

6. **Domain entities/components** - What are the key entities in this domain?
   - Examples (Python): modules, packages, classes, functions, decorators, async
   - Examples (Kubernetes): pods, services, deployments, namespaces, configmaps
   - Examples (Linux): processes, files, permissions, networking, system calls

7. **Common operations** - What are common tasks/users ask about?
   - Examples: "how do I X", "troubleshoot Y", "configure Z"

8. **Sources of truth** - Where does one validate information in this domain?
   - Official documentation URLs
   - API references
   - Man pages
   - RFC/specification documents

9. **Auto-invocation triggers** - What questions should trigger this skill?
   - Specific phrases users might say
   - Keywords that indicate relevance
   - Example: "python import error", "kubernetes pod not starting", "linux permission denied"

10. **Safety patterns** - Are there domain-specific safety considerations?
    - Examples: destructive commands, data loss risks, security implications

11. **Operations pattern** - How should the expert execute operations?
    - Direct commands (e.g., Linux commands)
    - API calls (e.g., kubectl, AWS CLI)
    - Code analysis (e.g., parsing Python AST)
    - Multi-step procedures

---

## File Generation Instructions

Generate the following files, replacing all placeholders:

### Placeholders Reference

| Placeholder | Description | Example |
|-------------|-------------|---------|
| `{{EXPERT_NAME}}` | snake_case expert name | `python_expert` |
| `{{EXPERT_DISPLAY}}` | Display name | `Python Expert` |
| `{{DOMAIN}}` | Domain name | `Python Programming` |
| `{{DESCRIPTION}}` | One-line description | `Expert knowledge of Python programming...` |
| `{{VERSION}}` | Version (default: 1.0.0) | `1.0.0` |
| `{{AUTHOR}}` | Author name | `Your Name` |
| `{{PROJECT_DIR}}` | Where to create the skill | `.claude/skills/` |
| `{{ENTITY_1}}`, `{{ENTITY_2}}` | Domain entities | `modules`, `packages` |
| `{{TRIGGER_1}}`, `{{TRIGGER_2}}` | Auto-invocation triggers | `"python error"`, `"import error"` |

---

## Template Files

### 1. SKILL.md

```markdown
---
name: {{EXPERT_NAME}}
description: This skill should be used when the user asks about "{{DOMAIN}}", mentions {{TRIGGER_1}}, {{TRIGGER_2}}, {{TRIGGER_3}}, or needs help with {{ENTITY_1}}, {{ENTITY_2}}, {{ENTITY_3}}. Provides expert knowledge and systematic analysis for {{DOMAIN}}.
version: {{VERSION}}
author: {{AUTHOR}}
---

# {{EXPERT_DISPLAY}}

{{DESCRIPTION}}

## Quick Start

Ask questions about {{DOMAIN}}:

- "How do I {{OPERATION_1}}?"
- "Why is my {{ENTITY_1}} not working?"
- "Explain {{CONCEPT}} in {{DOMAIN}}"
- "Best practices for {{TASK}}"

## Auto-Invocation Examples

This skill activates when:
- User asks about {{TRIGGER_1}}
- User needs help with {{TRIGGER_2}}
- User is troubleshooting {{TRIGGER_3}}
- User asks about {{ENTITY_1}} or {{ENTITY_2}}

## Domain Overview

{{DOMAIN}} encompasses...

### Key Concepts

- **{{CONCEPT_1}}**: Description
- **{{CONCEPT_2}}**: Description
- **{{CONCEPT_3}}**: Description

### Domain Entities

The following entities are central to {{DOMAIN}}:

| Entity | Description |
|--------|-------------|
| {{ENTITY_1}} | {{ENTITY_1_DESC}} |
| {{ENTITY_2}} | {{ENTITY_2_DESC}} |
| {{ENTITY_3}} | {{ENTITY_3_DESC}} |

## Common Operations

### {{OPERATION_1}}

To {{OPERATION_1}}...

### {{OPERATION_2}}

To {{OPERATION_2}}...

### {{OPERATION_3}}

To {{OPERATION_3}}...

## Mental Model

This expert maintains a mental model in `expertise/expertise.yaml` containing:

- **Domain knowledge**: Core concepts and terminology
- **Component understanding**: How {{ENTITY_1}}, {{ENTITY_2}}, etc. work
- **Learning priorities**: What to investigate when scanning codebases
- **Sources of truth**: Where to validate information

## Query Workflow

When asked a question:

1. **Load** the mental model from `expertise/expertise.yaml`
2. **Interpret** the question in domain context
3. **Validate** assumptions against sources of truth
4. **Generate** a comprehensive answer
5. **Flag** areas needing further investigation

For codebase analysis, use the query prompt:
```bash
./scripts/run-expert.sh query "your question" --scope /path/to/code
```

## Self-Improvement Workflow

To learn from a codebase:

```bash
./scripts/run-expert.sh learn /path/to/code
```

This will:
1. Scan the codebase for {{DOMAIN}} patterns
2. Extract domain-relevant information
3. Update the mental model
4. Report findings

## Sources of Truth

Validate information against:
- {{SOURCE_1_URL}}
- {{SOURCE_2_URL}}
- {{SOURCE_3_DESCRIPTION}}

## Safety Considerations

{{SAFETY_PATTERNS}}

## Additional Resources

### Reference Files
- **`reference.md`** - Detailed {{DOMAIN}} reference
- **`examples.md`** - Common usage examples

### Scripts
- **`scripts/expert.py`** - Core expert implementation
- **`scripts/run-expert.sh`** - CLI wrapper
```

### 2. expertise/expertise.yaml

```yaml
domain: {{DOMAIN}}
description: {{DESCRIPTION}}
version: {{VERSION}}
last_updated: {{DATE}}

# Core domain knowledge
knowledge:
  concepts:
    - name: {{CONCEPT_1}}
      description: {{CONCEPT_1_DESC}}
      related: [{{CONCEPT_2}}, {{CONCEPT_3}}]
    - name: {{CONCEPT_2}}
      description: {{CONCEPT_2_DESC}}
      related: [{{CONCEPT_1}}]

  terminology:
    {{TERM_1}}: {{TERM_1_DEF}}
    {{TERM_2}}: {{TERM_2_DEF}}

# Domain entities and their relationships
entities:
  {{ENTITY_1}}:
    description: {{ENTITY_1_DESC}}
    properties:
      - {{PROPERTY_1}}
      - {{PROPERTY_2}}
    relationships:
      - interacts_with: {{ENTITY_2}}
      - managed_by: {{ENTITY_3}}

  {{ENTITY_2}}:
    description: {{ENTITY_2_DESC}}
    properties:
      - {{PROPERTY_3}}
      - {{PROPERTY_4}}

# Common operations and their patterns
operations:
  {{OPERATION_1}}:
    description: {{OPERATION_1_DESC}}
    commands:
      - "{{COMMAND_PATTERN_1}}"
      - "{{COMMAND_PATTERN_2}}"
    considerations:
      - {{CONSIDERATION_1}}

  {{OPERATION_2}}:
    description: {{OPERATION_2_DESC}}
    commands:
      - "{{COMMAND_PATTERN_3}}"

# What to look for when scanning codebases
learning_priorities:
  patterns:
    - name: {{PATTERN_1_NAME}}
      description: {{PATTERN_1_DESC}}
      file_patterns:
        - "{{FILE_PATTERN_1}}"
        - "{{FILE_PATTERN_2}}"
      code_patterns:
        - "{{REGEX_PATTERN_1}}"
        - "{{REGEX_PATTERN_2}}"

    - name: {{PATTERN_2_NAME}}
      description: {{PATTERN_2_DESC}}
      file_patterns:
        - "{{FILE_PATTERN_3}}"

  common_issues:
    - {{ISSUE_1}}
    - {{ISSUE_2}}
    - {{ISSUE_3}}

# Where to validate information
sources_of_truth:
  primary:
    - name: {{SOURCE_1_NAME}}
      url: {{SOURCE_1_URL}}
      description: {{SOURCE_1_DESC}}
    - name: {{SOURCE_2_NAME}}
      url: {{SOURCE_2_URL}}

  secondary:
    - name: {{SOURCE_3_NAME}}
      url: {{SOURCE_3_URL}}

# Metadata
meta:
  author: {{AUTHOR}}
  created: {{DATE}}
  expert_type: domain_expert
  capabilities:
    - query
    - codebase_analysis
    - self_improvement
```

### 3. expertise/query.prompt

```markdown
# Query Processing Instructions

You are the {{EXPERT_DISPLAY}}. Process queries about {{DOMAIN}} systematically.

## Query Workflow

### 1. Load Mental Model

Read the expertise file to understand current knowledge:
```python
import yaml
with open('expertise/expertise.yaml') as f:
    expertise = yaml.safe_load(f)
```

### 2. Interpret the Question

Analyze the question to determine:
- **Domain context**: Which part of {{DOMAIN}} does this concern?
- **Entity scope**: Does it involve {{ENTITY_1}}, {{ENTITY_2}}, or {{ENTITY_3}}?
- **Intent type**: Is this a how-to, troubleshooting, explanation, or comparison?
- **Complexity**: Simple fact vs. multi-step analysis

### 3. Validate Assumptions

Before answering:
- Check if the question contains assumptions
- Validate assumptions against sources of truth
- Note any uncertainties or edge cases

### 4. Generate Answer

Structure your response:
1. **Direct answer** - Start with the core answer
2. **Explanation** - Provide context and reasoning
3. **Examples** - Show concrete examples when helpful
4. **Related concepts** - Link to related {{DOMAIN}} concepts
5. **Sources** - Reference where this information comes from

### 5. Flag Knowledge Gaps

If you encounter areas needing more information:
- Note what additional context would help
- Suggest what to investigate next
- Consider triggering self-improvement workflow

## Domain-Specific Patterns

### When Asked About {{ENTITY_1}}

Consider:
- How {{ENTITY_1}} interacts with {{ENTITY_2}}
- Common {{ENTITY_1}} configurations
- Typical {{ENTITY_1}} issues

### When Asked About {{ENTITY_2}}

Consider:
- {{ENTITY_2}} lifecycle
- {{ENTITY_2}} dependencies
- Performance implications

## Output Format

Provide clear, actionable answers. Use code blocks for examples. Structure with headers for complex topics.

## When to Use Scripts

For complex analysis:
```bash
./scripts/run-expert.sh query "your question" --scope /path/to/code
```

This will scan the codebase for relevant patterns before answering.
```

### 4. expertise/self-improve.prompt

```markdown
# Self-Improvement Workflow Instructions

The {{EXPERT_DISPLAY}} can learn from codebases to improve its domain knowledge.

## When to Run Self-Improvement

Trigger this workflow when:
- First encountering a new {{DOMAIN}} codebase
- After significant codebase changes
- When answering questions reveals knowledge gaps
- Periodically to stay current with codebase evolution

## Self-Improvement Workflow

### 1. Read Mental Model

Load current knowledge from `expertise/expertise.yaml`.

### 2. Scan Codebase

Search for {{DOMAIN}} patterns:

```bash
# Find {{ENTITY_1}} definitions
find . -name "{{FILE_PATTERN_1}}" -o -name "{{FILE_PATTERN_2}}"

# Search for {{PATTERN_1_NAME}} patterns
grep -r "{{REGEX_PATTERN_1}}" --include="{{FILE_PATTERN_3}}" .

# Find {{OPERATION_1}} usage
grep -r "{{COMMAND_PATTERN_1}}" .
```

### 3. Extract Domain Information

Look for:
- **{{ENTITY_1}} definitions** - How are they structured?
- **{{ENTITY_2}} configurations** - What patterns exist?
- **{{OPERATION_1}} implementations** - How are operations performed?
- **Common patterns** - What conventions are used?
- **Domain-specific issues** - Any anti-patterns or problems?

### 4. Validate Findings

For each discovery:
- Is this {{DOMAIN}}-specific or generic?
- Is this a pattern or a one-off?
- Does this contradict existing knowledge?
- Should this be added to the mental model?

### 5. Update Mental Model

Update `expertise/expertise.yaml` with new findings:
- Add new entities to `entities` section
- Add new patterns to `learning_priorities.patterns`
- Document new sources of truth
- Update version and `last_updated` timestamp

### 6. Output Report

Generate a report including:
- **Scan summary** - Files scanned, patterns found
- **New discoveries** - What was learned
- **Knowledge updates** - What changed in the mental model
- **Recommendations** - What to investigate next

## Scan Patterns for {{DOMAIN}}

### {{ENTITY_1}} Detection

```python
# Example: Look for {{ENTITY_1}} signatures
pattern = r"{{REGEX_PATTERN_1}}"
files = glob.glob("**/{{FILE_PATTERN_1}}", recursive=True)
```

### {{ENTITY_2}} Detection

```python
# Example: Find {{ENTITY_2}} declarations
pattern = r"{{REGEX_PATTERN_2}}"
files = glob.glob("**/{{FILE_PATTERN_2}}", recursive=True)
```

### {{OPERATION_1}} Detection

```python
# Example: Find {{OPERATION_1}} calls
pattern = r"{{COMMAND_PATTERN_1}}"
```

## Validation Steps

Before updating the mental model:

1. **Verify relevance** - Is this truly {{DOMAIN}}-specific?
2. **Check consistency** - Does this align with existing knowledge?
3. **Confirm generality** - Is this a pattern or an exception?
4. **Source validation** - Can this be verified against sources of truth?

## Output Format

```markdown
# Self-Improvement Report

## Scan Summary
- Files scanned: N
- Patterns detected: N
- New entities discovered: N

## New Discoveries
### {{ENTITY_1}} Pattern
- Description: ...
- Found in: ...
- Implications: ...

### {{OPERATION_1}} Usage
- Description: ...
- Frequency: ...
- Notes: ...

## Mental Model Updates
- Added: {{ENTITY_1}} to entities
- Updated: {{PATTERN_1}} in learning_priorities
- Version: 1.0.0 → 1.0.1

## Recommendations
- Investigate {{ENTITY_3}} further
- Review {{SOURCE_1}} for validation
```
```

### 5. scripts/expert.py

```python
#!/usr/bin/env python3
"""
{{EXPERT_DISPLAY}} - Core Expert Implementation

This module provides the core functionality for the {{EXPERT_DISPLAY}} skill,
including query processing and self-improvement capabilities.
"""

import yaml
import os
import sys
import argparse
from pathlib import Path
from datetime import datetime
from typing import Any, Dict, List, Optional


class Expert:
    """Base class for domain experts."""

    def __init__(self, expertise_path: str = "expertise/expertise.yaml"):
        """Initialize the expert with a mental model."""
        self.expertise_path = expertise_path
        self.expertise: Dict[str, Any] = {}
        self.load_expertise()

    def load_expertise(self) -> None:
        """Load the mental model from YAML file."""
        try:
            with open(self.expertise_path, 'r') as f:
                self.expertise = yaml.safe_load(f)
            print(f"Loaded expertise v{self.expertise.get('version', 'unknown')}")
        except FileNotFoundError:
            print(f"Warning: Expertise file not found at {self.expertise_path}")
            self.expertise = {}

    def save_expertise(self) -> None:
        """Save the mental model to YAML file."""
        self.expertise['last_updated'] = datetime.now().isoformat()
        with open(self.expertise_path, 'w') as f:
            yaml.dump(self.expertise, f, default_flow_style=False, sort_keys=False)
        print(f"Saved expertise to {self.expertise_path}")

    def query(self, question: str, scope: Optional[str] = None) -> str:
        """
        Process a query about {{DOMAIN}}.

        Args:
            question: The question to answer
            scope: Optional codebase path to analyze

        Returns:
            Answer to the question
        """
        # Load query prompt
        query_prompt_path = "expertise/query.prompt"
        try:
            with open(query_prompt_path, 'r') as f:
                query_prompt = f.read()
        except FileNotFoundError:
            query_prompt = "Process the question using domain knowledge."

        # In actual use, this would use the query prompt and mental model
        # to generate a comprehensive answer
        return f"Processing query: {question}"

    def learn_from_codebase(self, codebase_path: str) -> Dict[str, Any]:
        """
        Scan a codebase and learn from it.

        Args:
            codebase_path: Path to the codebase to scan

        Returns:
            Report of findings and updates
        """
        report = {
            'scan_time': datetime.now().isoformat(),
            'codebase_path': codebase_path,
            'findings': [],
            'updates': []
        }

        # Load self-improvement prompt
        improve_prompt_path = "expertise/self-improve.prompt"
        try:
            with open(improve_prompt_path, 'r') as f:
                improve_prompt = f.read()
        except FileNotFoundError:
            improve_prompt = ""

        # Scan codebase for {{DOMAIN}} patterns
        codebase = Path(codebase_path)
        if not codebase.exists():
            report['error'] = f"Codebase path not found: {codebase_path}"
            return report

        # TODO: Implement actual scanning logic based on domain patterns
        # This would include:
        # 1. Searching for domain-specific file patterns
        # 2. Parsing domain-specific code patterns
        # 3. Extracting domain entities and relationships
        # 4. Updating the mental model with new findings

        report['findings'].append({
            'pattern': 'example',
            'count': 0,
            'description': 'Scanning not yet implemented'
        })

        return report

    def get_entities(self) -> List[str]:
        """Get list of known domain entities."""
        return list(self.expertise.get('entities', {}).keys())

    def get_concepts(self) -> List[str]:
        """Get list of known domain concepts."""
        concepts = self.expertise.get('knowledge', {}).get('concepts', [])
        return [c.get('name', '') for c in concepts]

    def get_operations(self) -> List[str]:
        """Get list of known domain operations."""
        return list(self.expertise.get('operations', {}).keys())


def main():
    """CLI entry point for the expert."""
    parser = argparse.ArgumentParser(
        description="{{EXPERT_DISPLAY}} - Domain expert for {{DOMAIN}}"
    )
    parser.add_argument(
        'command',
        choices=['query', 'learn', 'info'],
        help='Command to run'
    )
    parser.add_argument(
        'argument',
        nargs='?',
        help='Argument for the command'
    )
    parser.add_argument(
        '--scope',
        help='Codebase path for analysis'
    )
    parser.add_argument(
        '--expertise',
        default="expertise/expertise.yaml",
        help='Path to expertise file'
    )

    args = parser.parse_args()

    expert = Expert(expertise_path=args.expertise)

    if args.command == 'query':
        if not args.argument:
            print("Error: query requires a question argument")
            sys.exit(1)
        result = expert.query(args.argument, scope=args.scope)
        print(result)

    elif args.command == 'learn':
        if not args.argument:
            print("Error: learn requires a codebase path argument")
            sys.exit(1)
        report = expert.learn_from_codebase(args.argument)
        print(f"Scan completed: {report['scan_time']}")
        print(f"Findings: {len(report['findings'])}")
        for finding in report['findings']:
            print(f"  - {finding['description']}")

    elif args.command == 'info':
        print(f"{{EXPERT_DISPLAY}}")
        print(f"Domain: {expert.expertise.get('domain', 'Unknown')}")
        print(f"Version: {expert.expertise.get('version', 'Unknown')}")
        print(f"Last updated: {expert.expertise.get('last_updated', 'Never')}")
        print(f"\nEntities: {', '.join(expert.get_entities())}")
        print(f"Concepts: {', '.join(expert.get_concepts())}")
        print(f"Operations: {', '.join(expert.get_operations())}")


if __name__ == "__main__":
    main()
```

### 6. scripts/run-expert.sh

```bash
#!/bin/bash
# {{EXPERT_DISPLAY}} - CLI Wrapper
#
# Usage:
#   ./scripts/run-expert.sh query "your question"
#   ./scripts/run-expert.sh learn /path/to/code
#   ./scripts/run-expert.sh info

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXPERT_SCRIPT="$SCRIPT_DIR/expert.py"

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "Error: python3 is required but not found"
    exit 1
fi

# Run the expert script
python3 "$EXPERT_SCRIPT" "$@"
```

### 7. README.md

```markdown
# {{EXPERT_DISPLAY}}

{{DESCRIPTION}}

## Quick Start

This skill provides expert knowledge of {{DOMAIN}}. Ask questions directly:

- "How do I {{OPERATION_1}}?"
- "Why is my {{ENTITY_1}} not working?"
- "What are the best practices for {{TASK}}?"

## Features

- **Domain expertise** - Comprehensive knowledge of {{DOMAIN}}
- **Query workflow** - Systematic question answering
- **Self-improvement** - Learn from codebases
- **Mental model** - Structured knowledge representation

## CLI Tools

### Query

```bash
./scripts/run-expert.sh query "your question"
```

### Learn from Codebase

```bash
./scripts/run-expert.sh learn /path/to/code
```

### Info

```bash
./scripts/run-expert.sh info
```

## Mental Model

The expert maintains a mental model in `expertise/expertise.yaml` containing:

- Domain knowledge and concepts
- Entity relationships
- Common operations
- Learning priorities
- Sources of truth

## Auto-Invocation

This skill activates when you ask about:
- {{TRIGGER_1}}
- {{TRIGGER_2}}
- {{TRIGGER_3}}

## Version

{{VERSION}} - Created {{DATE}}
```

### 8. examples.md

```markdown
# {{EXPERT_DISPLAY}} Examples

Common {{DOMAIN}} tasks and examples.

## Example 1: {{EXAMPLE_1_TITLE}}

### Question
{{EXAMPLE_1_QUESTION}}

### Answer
{{EXAMPLE_1_ANSWER}}

### Code
```{{EXAMPLE_1_LANG}}
{{EXAMPLE_1_CODE}}
```

## Example 2: {{EXAMPLE_2_TITLE}}

### Question
{{EXAMPLE_2_QUESTION}}

### Answer
{{EXAMPLE_2_ANSWER}}

### Code
```{{EXAMPLE_2_LANG}}
{{EXAMPLE_2_CODE}}
```

## Example 3: {{EXAMPLE_3_TITLE}}

### Question
{{EXAMPLE_3_QUESTION}}

### Answer
{{EXAMPLE_3_ANSWER}}
```

### 9. reference.md

```markdown
# {{EXPERT_DISPLAY}} Reference

Complete reference for {{DOMAIN}}.

## Domain Concepts

### {{CONCEPT_1}}

{{CONCEPT_1_FULL_DESCRIPTION}}

**Key properties:**
- {{PROPERTY_1}}
- {{PROPERTY_2}}

**Related concepts:**
- {{CONCEPT_2}}
- {{CONCEPT_3}}

### {{CONCEPT_2}}

{{CONCEPT_2_FULL_DESCRIPTION}}

## Entity Reference

### {{ENTITY_1}}

{{ENTITY_1_FULL_REFERENCE}}

**Properties:**
| Property | Type | Description |
|----------|------|-------------|
| {{PROPERTY_1}} | {{TYPE_1}} | {{DESC_1}} |
| {{PROPERTY_2}} | {{TYPE_2}} | {{DESC_2}} |

**Common operations:**
- {{OPERATION_1}}
- {{OPERATION_2}}

### {{ENTITY_2}}

{{ENTITY_2_FULL_REFERENCE}}

## Operations Reference

### {{OPERATION_1}}

{{OPERATION_1_FULL_REFERENCE}}

**Syntax:**
```{{SYNTAX_LANG}}
{{OPERATION_1_SYNTAX}}
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| {{PARAM_1}} | {{TYPE_1}} | Yes | {{PARAM_1_DESC}} |
| {{PARAM_2}} | {{TYPE_2}} | No | {{PARAM_2_DESC}} |

**Examples:**
```{{EXAMPLE_LANG}}
{{OPERATION_1_EXAMPLE}}
```

## Troubleshooting

### Common Issue 1: {{ISSUE_1_TITLE}}

**Symptoms:**
- {{SYMPTOM_1}}
- {{SYMPTOM_2}}

**Solutions:**
1. {{SOLUTION_1}}
2. {{SOLUTION_2}}

### Common Issue 2: {{ISSUE_2_TITLE}}

**Symptoms:**
- {{SYMPTOM_3}}

**Solutions:**
1. {{SOLUTION_3}}

## Sources of Truth

- {{SOURCE_1_URL}}
- {{SOURCE_2_URL}}
- {{SOURCE_3_URL}}
```

### 10. CHANGELOG.md

```markdown
# Changelog

All notable changes to the {{EXPERT_DISPLAY}} skill will be documented in this file.

## [{{VERSION}}] - {{DATE}}

### Added
- Initial {{EXPERT_DISPLAY}} skill
- Core {{DOMAIN}} knowledge
- Query workflow
- Self-improvement workflow
- Mental model structure
- CLI tools

### Knowledge Coverage
- {{CONCEPT_1}}
- {{CONCEPT_2}}
- {{ENTITY_1}}
- {{ENTITY_2}}
- {{OPERATION_1}}
- {{OPERATION_2}}

---

Format: Based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
```

### 11. requirements.txt

```txt
# Requirements for {{EXPERT_DISPLAY}}

pyyaml>=6.0
```

### 12. scripts/__init__.py

```python
"""
{{EXPERT_DISPLAY}} Scripts Package

This package contains the core implementation for the {{EXPERT_DISPLAY}} skill.
"""

__version__ = "{{VERSION}}"
```

---

## Validation Checklist

After generating all files, verify:

- [ ] All `{{PLACEHOLDERS}}` have been replaced with actual values
- [ ] SKILL.md has valid YAML frontmatter
- [ ] expertise/expertise.yaml is valid YAML
- [ ] scripts/expert.py is syntactically correct
- [ ] scripts/run-expert.sh is executable (chmod +x)
- [ ] All referenced files exist
- [ ] Description in frontmatter uses third person
- [ ] Description includes specific trigger phrases
- [ ] Mental model structure is complete
- [ ] Domain entities are accurately described
- [ ] Sources of truth are valid URLs
- [ ] Safety considerations are documented

---

## Usage Examples

### To Generate a Python Expert

Replace placeholders with:
- `{{EXPERT_NAME}}` → `python_expert`
- `{{EXPERT_DISPLAY}}` → `Python Expert`
- `{{DOMAIN}}` → `Python Programming`
- `{{ENTITY_1}}` → `modules`
- `{{ENTITY_2}}` → `classes`
- `{{TRIGGER_1}}` → `"python error"`

### To Generate a Kubernetes Expert

Replace placeholders with:
- `{{EXPERT_NAME}}` → `kubernetes_expert`
- `{{EXPERT_DISPLAY}}` → `Kubernetes Expert`
- `{{DOMAIN}}` → `Kubernetes Orchestration`
- `{{ENTITY_1}}` → `pods`
- `{{ENTITY_2}}` → `services`
- `{{TRIGGER_1}}` → `"kubernetes error"`
