# Reusable Expert Template Toolkit

A comprehensive toolkit for creating Agent Expert skills for any domain/project. Based on proven patterns, this toolkit provides three flexible approaches for generating domain experts.

## Overview

Agent Experts are specialized Claude Code skills that provide:
- **Domain expertise** - Deep knowledge of specific technical domains
- **Query workflow** - Systematic question answering processes
- **Self-improvement workflow** - Ability to learn from codebases
- **Mental model** - Structured YAML-based knowledge representation
- **CLI tools** - Python scripts for querying and self-improvement

## Three Approaches

This toolkit offers three ways to create an expert:

### 1. Template Prompt (TEMPLATE-PROMPT.md)

A single-file prompt that Claude can use to generate a complete expert skill.

**Use this when:**
- You want Claude to generate the expert for you
- You prefer an AI-assisted approach
- You want to understand all the pieces before customizing

**How to use:**
```bash
# Share the TEMPLATE-PROMPT.md file with Claude
cat TEMPLATE-PROMPT.md
```

Then provide your domain information and Claude will generate all files.

### 2. Skeleton Structure (skeleton/)

A copy-and-customize directory structure with template files.

**Use this when:**
- You want full manual control
- You prefer to customize each file individually
- You're creating an expert with unique requirements

**How to use:**
```bash
# Copy the skeleton to your project
cp -r skeleton/ ~/.claude/skills/my_expert/

# Customize each .template file
cd ~/.claude/skills/my_expert
# Edit files, replacing {{PLACEHOLDERS}} with actual values
```

### 3. Generator Script (create-expert.sh)

An interactive script that prompts for details and generates all files.

**Use this when:**
- You want a quick, guided setup
- You prefer interactive prompts
- You're creating your first expert

**How to use:**
```bash
./create-expert.sh
```

## Quick Start Examples

### Creating a Python Expert

**Using the generator script:**
```bash
cd ~/.claude/templates/expert-template
./create-expert.sh

# Prompts:
# Expert name [my_expert]: python_expert
# Display name [My Expert]: Python Expert
# Domain [My Domain]: Python Programming
# Description: Expert knowledge of Python programming language, libraries, and best practices
# Trigger phrases: python error, import error, decorator question
# Entities: modules, packages, classes, functions, decorators
# Concepts: OOP, inheritance, async, type hints
# Operations: debugging, testing, packaging
```

**Using the template prompt:**
1. Open `TEMPLATE-PROMPT.md`
2. Share with Claude with your Python-specific information
3. Claude generates all files

**Using the skeleton:**
1. Copy `skeleton/` to `.claude/skills/python_expert/`
2. Replace placeholders with Python-specific values
3. Customize the mental model in `expertise/expertise.yaml`

### Creating a Kubernetes Expert

```bash
./create-expert.sh

# Prompts:
# Expert name: kubernetes_expert
# Display name: Kubernetes Expert
# Domain: Kubernetes Orchestration
# Trigger phrases: kubectl error, pod not starting, service discovery
# Entities: pods, services, deployments, namespaces, configmaps
# Concepts: orchestration, scaling, rolling updates
# Operations: deployment, debugging, monitoring
```

## Directory Structure

```
expert-template/
├── TEMPLATE-PROMPT.md          # Approach 1: Single-file prompt
├── skeleton/                   # Approach 2: Copy-and-customize
│   ├── SKILL.md.template
│   ├── expertise/
│   │   ├── expertise.yaml.template
│   │   ├── query.prompt.template
│   │   └── self-improve.prompt.template
│   ├── scripts/
│   │   ├── __init__.py.template
│   │   ├── expert.py.template
│   │   └── run-expert.sh.template
│   ├── README.md.template
│   ├── examples.md.template
│   ├── reference.md.template
│   ├── CHANGELOG.md.template
│   └── requirements.txt.template
├── create-expert.sh            # Approach 3: Generator script
└── README.md                   # This file
```

## Generated Expert Structure

Each generated expert has this structure:

```
my_expert/
├── SKILL.md                    # Main skill definition
├── expertise/
│   ├── expertise.yaml          # Mental model (core knowledge)
│   ├── query.prompt            # Query processing instructions
│   └── self-improve.prompt     # Self-improvement instructions
├── scripts/
│   ├── __init__.py
│   ├── expert.py               # Core implementation
│   └── run-expert.sh           # CLI wrapper
├── README.md                   # Quick start guide
├── examples.md                 # Usage examples
├── reference.md                # Domain reference
├── CHANGELOG.md                # Version history
└── requirements.txt            # Python dependencies
```

## Template Placeholders

When customizing templates, replace these placeholders:

| Placeholder | Description | Example |
|-------------|-------------|---------|
| `{{EXPERT_NAME}}` | snake_case identifier | `python_expert` |
| `{{EXPERT_DISPLAY}}` | Display name | `Python Expert` |
| `{{DOMAIN}}` | Domain name | `Python Programming` |
| `{{DESCRIPTION}}` | One-line description | `Expert knowledge of Python...` |
| `{{VERSION}}` | Semantic version | `1.0.0` |
| `{{AUTHOR}}` | Author name | `Your Name` |
| `{{DATE}}` | Creation date | `2026-01-25` |
| `{{TRIGGER_1}}` | Auto-invocation phrase | `"python error"` |
| `{{ENTITY_1}}` | Domain entity | `modules` |
| `{{CONCEPT_1}}` | Domain concept | `inheritance` |
| `{{OPERATION_1}}` | Common operation | `debugging` |
| `{{SOURCE_1_URL}}` | Documentation URL | `https://docs.python.org` |

## Key Components

### Mental Model (expertise.yaml)

The mental model is the core of the expert, containing:

- **Domain knowledge**: Core concepts and terminology
- **Entities**: Domain entities and their relationships
- **Operations**: Common operations and command patterns
- **Learning priorities**: What to scan for in codebases
- **Sources of truth**: Where to validate information

Example structure:
```yaml
domain: Python Programming
knowledge:
  concepts:
    - name: OOP
      description: Object-oriented programming
  entities:
    class:
      description: User-defined type
      properties: [methods, attributes]
```

### Query Workflow

When a user asks a question:
1. Load the mental model
2. Interpret the question in domain context
3. Validate against sources of truth
4. Generate a comprehensive answer
5. Flag areas needing further investigation

### Self-Improvement Workflow

To learn from a codebase:
1. Scan for domain-specific patterns
2. Extract domain-relevant information
3. Update the mental model
4. Report findings and recommendations

## Customization Guide

### After Creating Your Expert

1. **Customize the Mental Model**
   - Edit `expertise/expertise.yaml`
   - Add domain-specific entities and relationships
   - Document common operations and patterns
   - Include sources of truth

2. **Refine Auto-Invocation Triggers**
   - Edit the description in `SKILL.md` frontmatter
   - Include specific phrases users might say
   - Test that triggers work as expected

3. **Add Examples**
   - Populate `examples.md` with concrete use cases
   - Include code examples where applicable
   - Cover common scenarios

4. **Complete the Reference**
   - Fill in `reference.md` with domain details
   - Document all entities, operations, and parameters
   - Include troubleshooting section

5. **Test the Expert**
   ```bash
   cd /path/to/expert
   ./scripts/run-expert.sh info
   ```

## Testing Your Expert

### Manual Testing

```bash
# Test info command
./scripts/run-expert.sh info

# Test query (requires implementation)
./scripts/run-expert.sh query "test question"

# Test learning (requires implementation)
./scripts/run-expert.sh learn /path/to/code
```

### Testing Auto-Invocation

Ask Claude questions that should trigger your expert:
- Use the trigger phrases you defined
- Ask about domain entities
- Request help with domain operations

Verify that:
- The skill activates on expected queries
- The mental model provides accurate context
- Answers are helpful and domain-specific

## Examples of Experts

### Python Expert
- **Entities**: modules, packages, classes, functions, decorators
- **Triggers**: "python error", "import problem", "decorator question"
- **Operations**: debugging, testing, packaging, profiling

### Kubernetes Expert
- **Entities**: pods, services, deployments, namespaces, configmaps
- **Triggers**: "kubectl error", "pod not starting", "service discovery"
- **Operations**: deployment, scaling, debugging, monitoring

### Linux Expert
- **Entities**: processes, files, permissions, networking, system calls
- **Triggers**: "linux permission", "process management", "shell script"
- **Operations**: process management, file operations, network configuration

## Troubleshooting

### Skill Not Triggering

- Check that the description in `SKILL.md` frontmatter uses third person
- Include specific trigger phrases in the description
- Verify the skill is in the correct location

### Permission Errors

```bash
# Make scripts executable
chmod +x scripts/expert.py
chmod +x scripts/run-expert.sh
```

### Placeholder Not Replaced

- Ensure all `{{PLACEHOLDERS}}` are replaced in template files
- Check for typos in placeholder names
- Verify template substitution completed successfully

## Advanced Usage

### Extending the Expert Class

Edit `scripts/expert.py` to add domain-specific methods:

```python
class Expert:
    def analyze_pattern(self, pattern: str) -> Dict:
        """Custom analysis for domain-specific patterns."""
        # Your implementation
        pass
```

### Custom Scan Patterns

Add patterns to `expertise/expertise.yaml`:

```yaml
learning_priorities:
  patterns:
    - name: My Custom Pattern
      file_patterns: ["*.myext"]
      code_patterns: ["my_pattern_regex"]
```

### Adding More Scripts

Add utility scripts to `scripts/`:
- Validation tools
- Testing helpers
- Domain-specific analyzers

## Contributing

To improve this toolkit:
1. Test with new domains
2. Report issues with templates
3. Suggest additional template patterns
4. Share your created experts as examples

## License

This toolkit is part of the Claude Code templates collection.

## Version

1.0.0 - Initial release with three approaches:
- Template Prompt for AI-assisted generation
- Skeleton Structure for manual customization
- Generator Script for interactive creation
