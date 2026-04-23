---
description: Generate a domain expert skill with mental model, auto-discovery, and self-improvement
argument-hint: <expert-name> <domain-description>
model: opus
---

# Meta-Expert Generator

Create a full **domain expert skill** modeled after the `linux_expert` pattern. Generates a complete skill directory with mental model, query/self-improve prompts, Python implementation, CLI wrapper, and documentation.

## Variables

EXPERT_NAME: $1 — kebab-case name for the expert (e.g., `network-expert`, `media-expert`)
DOMAIN_DESCRIPTION: $2 — Brief description of the domain this expert covers

## Instructions

### Phase 1: Interview

Ask the user 3-4 quick questions using `AskUserQuestion` to understand:

1. **Domain scope** — What specific area does this expert cover? What are the key concepts, components, or systems?
2. **Key entities** — What are the main things the expert needs to track? (hosts, services, APIs, databases, etc.)
3. **Agent delegation** — Does this domain involve remote hosts or agents that should receive delegated commands? If yes, what agents exist? If no, skip delegation pattern.
4. **Safety rules** — What operations are dangerous in this domain? What should the expert warn about or prevent?

Use the answers from these questions plus `DOMAIN_DESCRIPTION` to inform all subsequent generation.

### Phase 2: Auto-Discovery

Scan the project codebase to build the initial mental model:

1. **Read project CLAUDE.md** if it exists — understand the project structure and conventions
2. **Scan directory structure** — `ls` the project root, key directories
3. **Find relevant files** — Glob for config files, scripts, docs related to the domain
4. **Read key files** — Read 5-10 of the most relevant files to extract domain knowledge
5. **Identify patterns** — What naming conventions, organizational patterns, and workflows exist?

Compile findings into a structured knowledge base for the expertise.yaml.

### Phase 3: Generate Skill Directory

Create the following structure under `.claude/skills/{EXPERT_NAME}/`:

```
{EXPERT_NAME}/
├── SKILL.md              # Skill definition with auto-invocation triggers
├── README.md             # User documentation
├── CHANGELOG.md          # Version history
├── examples.md           # Usage examples
├── reference.md          # Technical API reference
├── requirements.txt      # Python dependencies (PyYAML>=6.0.1)
├── expertise/
│   ├── expertise.yaml    # Mental model populated from discovery
│   ├── query.prompt      # Question answering workflow
│   └── self-improve.prompt # Learning workflow
└── scripts/
    ├── __init__.py       # Package init
    ├── {expert_name}.py  # Main Python implementation
    └── run-expert.sh     # CLI wrapper
```

### Phase 4: Generate Each File

Follow these templates, adapting to the specific domain:

#### 4.1 — SKILL.md

```markdown
---
name: {EXPERT_NAME}
description: <one-line description of what this expert knows>
version: "1.0.0"
author: "Claude Code"
created: "<today's date>"
---

# {Expert Name} Skill

<Description of what this expert does and what domain it covers.>

## Quick Start

### Auto-Invocation

This skill is automatically invoked when you ask questions like:
<List 5-6 example questions relevant to this domain>

### Manual Invocation

/{EXPERT_NAME} <question>

## What It Does

1. **Answers domain questions** using its mental model
2. **Validates information** against the actual codebase
3. **Learns continuously** from operations and codebase changes
<if delegation: 4. **Delegates operations** to appropriate agents>
<if safety: 5. **Maintains safety** by enforcing safety patterns>

## Domain Overview

<Table or list of key domain components from discovery>

<if delegation:>
## Agent Delegation Pattern

AGENT_COMMAND: Ask {agent-name} to run: {command}
</if>

## Safety Patterns

<Domain-specific safety rules from interview>

## Learning and Self-Improvement

<Standard self-improvement section>

## Architecture

<Directory structure listing>

## Version

Version: 1.0.0
```

#### 4.2 — expertise/expertise.yaml

Populate from auto-discovery findings. Structure:

```yaml
domain: "<Domain Name>"
version: "1.0.0"
last_updated: "<today>"

# Core domain knowledge — structure varies by domain
<domain_entities>:
  <entity_type>:
    description: "<what this group represents>"
    items:
      - name: "<name>"
        <key>: "<value>"
        # ... domain-specific attributes

<if delegation:>
agent_delegation:
  principle: "<delegation rule>"
  pattern: "<how to delegate>"
  format: "AGENT_COMMAND: Ask {agent} to run: {command}"
  all_agents:
    - <agent-1>
    - <agent-2>
</if>

safety_patterns:
  <category>:
    - "<rule 1>"
    - "<rule 2>"

common_workflows:
  <workflow_name>:
    description: "<what this workflow does>"
    steps:
      - "<step 1>"
      - "<step 2>"

sources_of_truth:
  <source>: "<where to validate>"

learning_priorities:
  - "<what to learn about>"

meta:
  expertise_file_type: "mental_model"
  not_source_of_truth: "Always validate against actual code and infrastructure"
  update_mechanism: "self-improve prompt"
  query_mechanism: "query prompt"
```

#### 4.3 — expertise/query.prompt

Adapt the query prompt template:
- Define the expert's identity and domain
- List question types specific to this domain
- Define the query processing workflow (load model, interpret, validate, respond)
- Include discrepancy handling
- Include output quality standards
- If delegation applies, include delegation rules

#### 4.4 — expertise/self-improve.prompt

Adapt the self-improvement prompt template:
- Define what to scan for changes (domain-specific files, configs, scripts)
- Define validation steps against the codebase
- Define what to add/modify/remove in expertise.yaml
- Include output format for improvement summaries

#### 4.5 — scripts/{expert_name}.py

Generate a Python class following the `LinuxExpert` pattern:

```python
class {ExpertClassName}:
    def __init__(self, skill_dir=None)
    def load_expertise(self) -> Dict
    def save_expertise(self) -> None
    def get_{entities}(self) -> List       # Domain-specific getters
    def query(self, question, codebase_dir=None) -> Dict
    def _answer_{type}_question(self, question) -> Dict  # Per question type
    def self_improve(self, codebase_dir=None) -> Dict

def format_query_response(result) -> str
def format_self_improve_response(summary) -> str
def main()  # argparse CLI
```

- Adapt question type detection keywords to the domain
- Implement domain-specific answer methods
- Include `format_query_response` and `format_self_improve_response`
- CLI with: `query`, `self-improve`, `info`, `{entities}` commands

#### 4.6 — scripts/run-expert.sh

Generate a bash CLI wrapper:
- Color-coded output
- Help message with domain-specific examples
- Python version check
- Script existence validation
- All CLI commands delegating to the Python script

#### 4.7 — README.md, examples.md, reference.md, CHANGELOG.md

Generate each documentation file adapted to the domain:
- **README.md**: User guide with domain overview, quick start, common operations
- **examples.md**: 5-8 example queries with expected output format
- **reference.md**: Python API reference, CLI reference, expertise file schema
- **CHANGELOG.md**: Initial v1.0.0 entry

#### 4.8 — requirements.txt

```
PyYAML>=6.0.1
```

### Phase 5: Validate

After generating all files:

1. Verify all files were created in the correct locations
2. Verify expertise.yaml is valid YAML (read it back)
3. Verify the Python script has no syntax errors: `python3 -c "import ast; ast.parse(open('<path>').read())"`
4. Verify run-expert.sh is executable
5. List the complete directory tree

### Phase 6: Report

```
## {Expert Name} Expert Created

Skill: .claude/skills/{EXPERT_NAME}/
Domain: {domain description}
Version: 1.0.0

### Files Generated
- SKILL.md — Auto-invocation triggers and skill definition
- expertise/expertise.yaml — Mental model ({N} entities discovered)
- expertise/query.prompt — Question answering workflow
- expertise/self-improve.prompt — Learning workflow
- scripts/{expert_name}.py — Python implementation
- scripts/run-expert.sh — CLI wrapper
- README.md, examples.md, reference.md, CHANGELOG.md

### Mental Model Summary
- {N} {entity type}s discovered
- {N} safety rules defined
- {N} common workflows documented
<if delegation: - {N} agents configured for delegation>

### Usage
  /{EXPERT_NAME} <question>

### Next Steps
- Review expertise.yaml and add any missing knowledge
- Run /{EXPERT_NAME} self-improve to update from codebase
- Try: /{EXPERT_NAME} <example question>
```
