# Recipe Schema Reference

This is the authoritative schema specification for recipe.yaml files used by OpenCode skills. All recipe files must conform to this schema to ensure consistent behavior across the OpenCode ecosystem.

## Full Schema Specification

```yaml
version: "1.0.0"                    # Required. Semver string.
title: "<skill title>"               # Required. Human-readable name.
description: "<what the recipe defines>"  # Required. 1-2 sentences.

parameters:                          # Optional. List of input parameters.
  - key: <name>                      # Required. Kebab-case identifier.
    type: string | number | boolean | select | file  # Required.
    required: true | false           # Required.
    default: "<value>"               # Required if required: false.
    options: [...]                   # Required if type: select.
    description: "<what this input is>"  # Required.

workflow:                            # Required. Ordered list of execution steps.
  - step: <N>                        # Required. 1-indexed integer.
    name: "<step name>"              # Required. Short imperative label.
    description: "<what happens>"    # Required. 1-3 sentences.
    requires_input: [<param keys>]   # Optional. Parameter keys consumed.
    produces: [<output ids>]         # Optional. Output ids generated.
    decision_point: true | false     # Required. Must pause for user if true.

outputs:                             # Optional. List of expected outputs.
  - id: <name>                       # Required. Kebab-case identifier.
    description: "<what this output is>"  # Required.
    type: file | intermediate | artifact  # Required.
    pattern: "<glob pattern>"        # Required if type: file.
    required: true | false           # Required.

validation:                          # Optional. List of validation checks.
  - name: "<check name>"            # Required. Human-readable label.
    type: shell | content            # Required.
    command: "<shell command>"       # Required if type: shell.
    target: <output id>             # Required if type: content.
    contains: [<strings>]           # Required if type: content.
```

## Field-by-Field Reference

### Top-Level Fields

**version**
- Type: string (semver format)
- Required: yes
- Constraints: Must follow semantic versioning (e.g., "1.0.0", "2.1.3")

**title**
- Type: string
- Required: yes
- Constraints: Human-readable name, typically 3-6 words

**description**
- Type: string
- Required: yes
- Constraints: 1-2 sentences explaining what the recipe defines

### parameters[]

**parameters[].key**
- Type: string
- Required: yes
- Constraints: Must be kebab-case (lowercase letters, numbers, hyphens)

**parameters[].type**
- Type: enum
- Required: yes
- Values: "string", "number", "boolean", "select", "file"

**parameters[].required**
- Type: boolean
- Required: yes
- Values: true, false

**parameters[].default**
- Type: string | number | boolean
- Required: yes if required is false
- Constraints: Must match the parameter type

**parameters[].options**
- Type: array of strings
- Required: yes if type is "select"
- Constraints: At least 2 options required

**parameters[].description**
- Type: string
- Required: yes
- Constraints: Clear explanation of the parameter's purpose

### workflow[]

**workflow[].step**
- Type: integer
- Required: yes
- Constraints: Must be 1-indexed and sequential (1, 2, 3...)

**workflow[].name**
- Type: string
- Required: yes
- Constraints: Short imperative label (e.g., "Load template", "Generate code")

**workflow[].description**
- Type: string
- Required: yes
- Constraints: 1-3 sentences explaining what happens in this step

**workflow[].requires_input**
- Type: array of strings
- Required: no
- Constraints: Each item must match a parameter key

**workflow[].produces**
- Type: array of strings
- Required: no
- Constraints: Each item must match an output id

**workflow[].decision_point**
- Type: boolean
- Required: yes
- Description: If true, execution must pause for user review/decision

### outputs[]

**outputs[].id**
- Type: string
- Required: yes
- Constraints: Must be kebab-case, unique within the recipe

**outputs[].description**
- Type: string
- Required: yes
- Constraints: Clear explanation of what this output represents

**outputs[].type**
- Type: enum
- Required: yes
- Values: "file", "intermediate", "artifact"

**outputs[].pattern**
- Type: string (glob pattern)
- Required: yes if type is "file"
- Constraints: Valid glob pattern (e.g., "*.md", "src/**/*.ts")

**outputs[].required**
- Type: boolean
- Required: yes
- Description: Whether this output must be produced

### validation[]

**validation[].name**
- Type: string
- Required: yes
- Constraints: Human-readable check name

**validation[].type**
- Type: enum
- Required: yes
- Values: "shell", "content"

**validation[].command**
- Type: string
- Required: yes if type is "shell"
- Constraints: Shell command that returns 0 for success

**validation[].target**
- Type: string
- Required: yes if type is "content"
- Constraints: Must match an output id

**validation[].contains**
- Type: array of strings
- Required: yes if type is "content"
- Constraints: Strings that must appear in the target output

## YAML Formatting Guide

Follow these formatting rules for consistent recipe files:

- Use 2-space indentation (never tabs)
- Quote all string values with double quotes
- Use `true`/`false` for booleans (not yes/no, True/False)
- List items use `- ` prefix with consistent indentation
- Multiline descriptions: use the same line, not block scalars
- Keep lines under 120 characters
- Empty optional sections: omit the key entirely (don't use `[]` or `null`)
- File patterns use forward slashes even on Windows

## Example A: Simple Lint-Fixer Skill

```yaml
version: "1.0.0"
title: "Lint Fixer"
description: "Automatically fixes linting errors in a specified file."

parameters:
  - key: file-path                  # kebab-case identifier
    type: file                      # expects a file path
    required: true                  # user must provide this
    description: "Path to the file that needs linting fixes"

workflow:
  - step: 1                         # steps are 1-indexed
    name: "Check lint errors"
    description: "Runs the linter to identify all fixable issues in the target file."
    requires_input: ["file-path"]   # consumes the file-path parameter
    decision_point: false           # runs automatically

  - step: 2
    name: "Apply automatic fixes"
    description: "Runs the linter with --fix flag to automatically correct issues."
    requires_input: ["file-path"]
    produces: ["fixed-file"]        # creates the fixed-file output
    decision_point: false

  - step: 3
    name: "Generate report"
    description: "Creates a summary of what was fixed and any remaining issues."
    produces: ["fix-report"]        # creates the fix-report output
    decision_point: true            # user reviews before completion

outputs:
  - id: fixed-file                  # matches produces[] reference
    description: "The file with linting errors corrected"
    type: file
    pattern: "*.{js,ts,jsx,tsx}"    # matches common JS/TS files
    required: true                  # must be produced

  - id: fix-report
    description: "Summary of fixes applied and remaining issues"
    type: artifact                  # not a specific file pattern
    required: true

validation:
  - name: "Verify no errors remain"
    type: shell                     # runs a command
    command: "npm run lint -- --max-warnings 0"  # must exit 0
```

## Example B: Complex Create-Skill

```yaml
version: "1.0.0"
title: "Create OpenCode Skill"
description: "Generates a complete OpenCode skill with documentation, tests, and recipe."

parameters:
  - key: skill-name                 # main identifier
    type: string
    required: true
    description: "Name of the skill in kebab-case (e.g., 'api-client')"

  - key: description
    type: string
    required: true
    description: "One-line description of what the skill does"

  - key: test-prompt                # for generating test cases
    type: string
    required: false
    default: "Test the basic functionality"
    description: "Example prompt to test skill activation"

  - key: workspace-path             # where to create the skill
    type: string
    required: false
    default: "~/.config/opencode/skills"
    description: "Directory where the skill folder will be created"

  - key: complexity               # affects template selection
    type: select
    required: true
    options: ["simple", "moderate", "complex"]
    description: "Skill complexity level determining structure"

workflow:
  - step: 1
    name: "Validate inputs"
    description: "Checks skill name uniqueness and workspace permissions."
    requires_input: ["skill-name", "workspace-path"]
    decision_point: false

  - step: 2
    name: "Select template"
    description: "Chooses appropriate skill template based on complexity."
    requires_input: ["complexity"]
    produces: ["template-selection"]  # intermediate output
    decision_point: false

  - step: 3
    name: "Generate SKILL.md"
    description: "Creates the main skill documentation with instructions and examples."
    requires_input: ["skill-name", "description"]
    produces: ["skill-doc"]
    decision_point: true              # user reviews generated doc

  - step: 4
    name: "Create recipe.yaml"
    description: "Generates the recipe definition for skill automation."
    requires_input: ["skill-name", "complexity"]
    produces: ["recipe-file"]
    decision_point: false

  - step: 5
    name: "Generate test cases"
    description: "Creates evals.json with test prompts for skill activation."
    requires_input: ["test-prompt", "skill-name"]
    produces: ["test-suite"]
    decision_point: true              # user approves tests

  - step: 6
    name: "Set up workspace"
    description: "Creates skill directory structure with all generated files."
    requires_input: ["workspace-path"]
    produces: ["skill-directory"]
    decision_point: false

outputs:
  - id: skill-doc
    description: "The main SKILL.md documentation file"
    type: file
    pattern: "SKILL.md"
    required: true

  - id: recipe-file
    description: "The recipe.yaml automation definition"
    type: file
    pattern: "recipe.yaml"
    required: true

  - id: test-suite
    description: "Test cases for skill validation"
    type: file
    pattern: "evals.json"
    required: true

  - id: skill-directory
    description: "Complete skill folder with all artifacts"
    type: artifact                    # represents a directory
    required: true

  - id: template-selection
    description: "Selected template configuration"
    type: intermediate                # used internally, not persisted
    required: false

validation:
  - name: "SKILL.md has required sections"
    type: content
    target: skill-doc
    contains: ["## Purpose", "## When to Use", "## Core Workflow"]

  - name: "Recipe is valid YAML"
    type: shell
    command: "python3 -c \"import yaml; yaml.safe_load(open('recipe.yaml'))\""

  - name: "Evals has valid structure"
    type: shell
    command: "jq '.tests | length > 0' evals.json"

  - name: "Skill directory exists"
    type: shell
    command: "test -d ${workspace-path}/${skill-name}"
```

## Constraints and Limits

- Recipe files should stay under 200 lines for maintainability
- Version must follow semantic versioning specification
- Step numbers must be sequential starting at 1 (no gaps)
- Output ids must be unique within the recipe
- Parameter keys must be unique within the recipe
- All ids and keys must use kebab-case (lowercase-with-hyphens)
- Decision points should be used sparingly (typically 1-3 per recipe)
- Validation checks should complete quickly (under 5 seconds each)