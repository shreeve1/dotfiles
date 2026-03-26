# Issue Tracker Technical Reference

Implementation guidelines and technical details for the issue tracker skill.

## Implementation Algorithm

### Main Workflow

```
1. Parse user input for issue intent
2. Extract or identify issue title
3. Generate slug from title
4. Determine issuetracker directory
5. Search for existing issue
6. Present options based on findings
7. Execute selected action
8. Save and confirm
```

### Slug Generation Algorithm

```python
def generate_slug(title: str) -> str:
    """
    Convert issue title to URL-friendly filename slug.

    Examples:
    - "Auth Bug Problem" → "auth-bug-problem.md"
    - "API rate limiting (production)" → "api-rate-limiting-production.md"
    - "User's can't login!" → "users-cant-login.md"
    """
    # Step 1: Lowercase
    slug = title.lower()

    # Step 2: Replace spaces & punctuation with hyphens
    import re
    slug = re.sub(r'[\s_]+', '-', slug)
    slug = re.sub(r'[^\w\-]', '', slug)

    # Step 3: Remove consecutive hyphens
    slug = re.sub(r'-+', '-', slug)

    # Step 4: Strip leading/trailing hyphens
    slug = slug.strip('-')

    # Step 5: Limit to 60 characters
    slug = slug[:60]

    # Step 6: Ensure .md extension
    if not slug.endswith('.md'):
        slug += '.md'

    return slug
```

### Directory Detection Algorithm

```python
def get_issue_directory(cwd: str) -> str:
    """
    Find or create the issue tracker directory in the current project only.

    Search order:
    1. ./IssueTracker/ (capital I, project-specific)
    2. ./issuetracker/ (lowercase, backward compatibility)
    3. Create ./IssueTracker/ (if none found)

    Issues are ALWAYS stored in the current project directory only.
    Parent directories are never searched.
    """
    import os

    # Directory variants to check (in priority order)
    variants = ['IssueTracker', 'issuetracker']

    # Check current directory only
    for variant in variants:
        current = os.path.join(cwd, variant)
        if os.path.isdir(current):
            return current

    # Create in current directory (using IssueTracker)
    current = os.path.join(cwd, 'IssueTracker')
    os.makedirs(current, exist_ok=True)

    # Create .gitkeep for git tracking
    gitkeep = os.path.join(current, '.gitkeep')
    if not os.path.exists(gitkeep):
        with open(gitkeep, 'w') as f:
            f.write('')

    return current
```

### Issue Matching Algorithm

```python
def find_issue(search_term: str, issues_dir: str) -> Optional[str]:
    """
    Find existing issue by fuzzy matching title.

    Returns: Issue filepath or None if no match >70% confidence
    """
    import os
    from difflib import SequenceMatcher

    # Normalize search term
    search_norm = normalize_text(search_term)

    # Get all issue files
    issues = []
    for filename in os.listdir(issues_dir):
        if filename.endswith('.md'):
            filepath = os.path.join(issues_dir, filename)

            # Parse frontmatter
            with open(filepath, 'r') as f:
                content = f.read()
                frontmatter = parse_frontmatter(content)
                title = frontmatter.get('title', filename.replace('.md', ''))

            # Calculate match score
            title_norm = normalize_text(title)
            score = SequenceMatcher(None, search_norm, title_norm).ratio()

            issues.append((filepath, title, score))

    # Sort by score descending
    issues.sort(key=lambda x: x[2], reverse=True)

    # Return best match if confidence > 70%
    if issues and issues[0][2] > 0.7:
        return issues[0][0]

    return None

def normalize_text(text: str) -> str:
    """Normalize text for comparison."""
    import re
    text = text.lower()
    text = re.sub(r'[^\w\s]', '', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()
```

### Frontmatter Parsing

```python
def parse_frontmatter(content: str) -> dict:
    """
    Parse YAML frontmatter from markdown file.

    Expected format:
    ---
    key: value
    ---
    """
    import re

    # Extract frontmatter
    match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
    if not match:
        return {}

    frontmatter_str = match.group(1)

    try:
        import yaml
        return yaml.safe_load(frontmatter_str) or {}
    except yaml.YAMLError:
        return {}

def update_frontmatter(content: str, updates: dict) -> str:
    """Update frontmatter fields in markdown content."""
    import re

    # Parse existing frontmatter
    frontmatter = parse_frontmatter(content)
    frontmatter.update(updates)

    # Rebuild frontmatter string
    import yaml
    new_frontmatter = yaml.dump(frontmatter, default_flow_style=False)

    # Replace in content
    new_content = re.sub(
        r'^---\n.*?\n---',
        f'---\n{new_frontmatter}---',
        content,
        flags=re.DOTALL
    )

    return new_content
```

### File Template

```python
ISSUE_TEMPLATE = """---
title: "{title}"
status: "open"
created: "{created_date}"
last_updated: "{created_date}"
tags: []
---

# Issue: {title}

## Original Problem
{problem}

## Work Performed

## Status
New issue, initial state

## Resolution
"""

def create_issue_file(title: str, problem: str, filepath: str):
    """Create a new issue file with default template."""
    from datetime import datetime

    created = datetime.now().strftime('%Y-%m-%d')
    content = ISSUE_TEMPLATE.format(
        title=title,
        created_date=created,
        problem=problem
    )

    with open(filepath, 'w') as f:
        f.write(content)
```

### Status Transition Validation

```python
VALID_TRANSITIONS = {
    'open': ['investigating', 'closed'],
    'investigating': ['resolved', 'open'],
    'resolved': ['closed', 'open'],
    'closed': ['open']  # Reopen requires special handling
}

def validate_transition(current_status: str, new_status: str) -> bool:
    """Check if status transition is valid."""
    valid_targets = VALID_TRANSITIONS.get(current_status, [])
    return new_status in valid_targets

def get_transition_warning(current: str, new: str) -> Optional[str]:
    """Get warning message for status transition."""
    if current == 'closed' and new == 'open':
        return "Reopening a closed issue. Consider creating a new instance if this is a recurrence."
    return None
```

### Work Entry Format

```python
def add_work_entry(content: str, work_description: str) -> str:
    """Add timestamped work entry to issue file."""
    from datetime import datetime

    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M')
    entry = f"\n### {timestamp}\n- {work_description}"

    # Find or create Work Performed section
    if '## Work Performed' in content:
        # Append after the section header
        content = content.replace(
            '## Work Performed',
            f'## Work Performed{entry}'
        )
    else:
        # Create section
        content += f"\n## Work Performed{entry}"

    # Update last_updated
    today = datetime.now().strftime('%Y-%m-%d')
    content = update_frontmatter(content, {'last_updated': today})

    return content
```

## Error Handling Patterns

### No Write Permission

```python
def check_write_permission(directory: str) -> bool:
    """Check if directory is writable."""
    import os
    return os.access(directory, os.W_OK)

def handle_permission_error(issuedir: str) -> str:
    """Suggest alternative when no write permission."""
    alternatives = [
        os.path.expanduser('~/issues'),
        '/tmp/issuetracker',
        os.path.expanduser('~/Desktop/issuetracker')
    ]

    # Find first writable alternative
    for alt in alternatives:
        try:
            os.makedirs(alt, exist_ok=True)
            if check_write_permission(alt):
                return alt
        except:
            continue

    return None
```

### Multiple Matches Handling

```python
def handle_multiple_matches(matches: list, search_term: str) -> str:
    """
    Present multiple matching issues to user for selection.

    matches: List of (filepath, title, status, score) tuples
    """
    print(f"Found multiple issues matching '{search_term}':\n")

    for i, (filepath, title, status, score) in enumerate(matches, 1):
        filename = os.path.basename(filepath)
        print(f"{i}. {filename}")
        print(f"   Title: {title}")
        print(f"   Status: {status}")
        print(f"   Match: {int(score * 100)}%")
        print()

    print("Which issue? (1-N, or 'new' to create)")
    # Wait for user selection
```

### Concurrent Modification Detection

```python
def check_concurrent_modification(filepath: str, cached_mtime: float) -> bool:
    """Detect if file was modified by another process."""
    import os
    current_mtime = os.path.getmtime(filepath)
    return current_mtime != cached_mtime

def handle_concurrent_modification(filepath: str):
    """Prompt user when concurrent modification detected."""
    print("Warning: Issue file was modified by another process.")
    print("Options:")
    print("1. Reload file (discard your changes)")
    print("2. Continue anyway (overwrite changes)")
    print("3. Cancel")
    # Wait for user choice
```

## Natural Language Parsing

### Intent Detection

```python
def detect_intent(user_input: str) -> dict:
    """
    Detect user's intent from natural language input.

    Returns: {
        'intent': 'create'|'update'|'view'|'list'|'close',
        'issue_title': str|None,
        'status': str|None,
        'work_description': str|None
    }
    """
    import re

    result = {'intent': None, 'issue_title': None, 'status': None, 'work_description': None}

    # Create intent
    if re.search(r'\b(track|create|new)\b', user_input, re.I):
        result['intent'] = 'create'
    # Update intent
    elif re.search(r'\b(update|add|append)\b', user_input, re.I):
        result['intent'] = 'update'
    # View intent
    elif re.search(r'\b(show|view|status|what(?:\'s| is))\b', user_input, re.I):
        result['intent'] = 'view'
    # List intent
    elif re.search(r'\b(all|list|my issues)\b', user_input, re.I):
        result['intent'] = 'list'
    # Close intent
    elif re.search(r'\b(close|resolve|fixed|done)\b', user_input, re.I):
        result['intent'] = 'close'

    # Extract issue title (simplified)
    # Look for phrases like "the X issue" or "X"
    title_match = re.search(r'(?:the )?([a-z][a-z0-9\s\-]{3,50})(?:\s+issue)?$', user_input, re.I)
    if title_match:
        result['issue_title'] = title_match.group(1).strip()

    # Extract status
    status_match = re.search(r'\b(open|investigating|resolved|closed)\b', user_input, re.I)
    if status_match:
        result['status'] = status_match.group(1).lower()

    return result
```

## Integration Points

### Git Integration

```python
def git_commit_issue(filepath: str, message: str):
    """Optional: Commit issue changes to git."""
    import subprocess

    try:
        # Check if in git repo
        subprocess.run(
            ['git', 'add', filepath],
            check=True,
            capture_output=True
        )
        subprocess.run(
            ['git', 'commit', '-m', f'Issue tracking: {message}'],
            check=True,
            capture_output=True
        )
    except subprocess.CalledProcessError:
        # Not in git repo or git not available
        pass
```

### Backup System

```python
def backup_issue(filepath: str):
    """Create backup before modifying issue file."""
    import shutil
    from datetime import datetime

    backup_dir = os.path.join(os.path.dirname(filepath), '.backups')
    os.makedirs(backup_dir, exist_ok=True)

    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = os.path.basename(filepath)
    backup_path = os.path.join(backup_dir, f"{filename}.{timestamp}.bak")

    shutil.copy2(filepath, backup_path)
    return backup_path

def cleanup_old_backups(backup_dir: str, keep_days: int = 30):
    """Remove backups older than keep_days."""
    import os
    import time
    from datetime import datetime, timedelta

    cutoff = time.time() - (keep_days * 86400)

    for filename in os.listdir(backup_dir):
        filepath = os.path.join(backup_dir, filename)
        if os.path.getmtime(filepath) < cutoff:
            os.remove(filepath)
```

## Testing Guidelines

### Test Cases

```python
test_cases = [
    # Create
    {
        'input': 'Track the auth bug',
        'expected_intent': 'create',
        'expected_title': 'auth bug'
    },
    # Update
    {
        'input': 'Update the DNS issue - added new records',
        'expected_intent': 'update',
        'expected_title': 'DNS issue'
    },
    # View
    {
        'input': 'Show the login problem',
        'expected_intent': 'view',
        'expected_title': 'login problem'
    },
    # List
    {
        'input': 'Show all my issues',
        'expected_intent': 'list',
        'expected_title': None
    },
    # Close
    {
        'input': 'Close the auth bug',
        'expected_intent': 'close',
        'expected_title': 'auth bug'
    }
]
```

## Performance Considerations

1. **Lazy loading:** Only read issue files when needed
2. **Caching:** Cache parsed frontmatter during session
3. **Indexing:** For large numbers of issues, consider simple index file
4. **Concurrency:** Use file locking for concurrent access

## Security Considerations

1. **Path validation:** Prevent directory traversal in file paths
2. **Input sanitization:** Sanitize issue titles and content
3. **Permission checks:** Verify write permissions before operations
4. **Backup strategy:** Always backup before modifications
