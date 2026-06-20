# Token Estimation Heuristic

Reference for estimating the total tokens a build session would consume. Used by the Shard skill's AnalyzeAndShard workflow.

## Components

Estimate total tokens by summing these components:

### 1. Plan Ingestion

The build process reads the entire plan at the start.

```
plan_tokens = plan_file_size_in_bytes / 4
```

### 2. Referenced File Reads

The build process reads files listed in the `## Relevant Files` section to understand the codebase.

```
For each file in Relevant Files:
  if file exists on disk:
    file_tokens = file_size_in_bytes / 4
  else (file to be created):
    file_tokens = 2000  # estimate for new file context
referenced_file_tokens = sum of all file_tokens
```

Use the `shell` tool with `wc -c` or `stat` to get actual file sizes.

### 3. Per-task Execution Cost

Each task in `## Step by Step Tasks` consumes tokens for reasoning, file reads, code generation, and output.

Classify each task by counting its action items (bullet points under the task header, excluding metadata lines like task ID, Depends On, etc.):

| Classification | Action Items | Keywords (any match) | Token Cost |
|---------------|-------------|---------------------|------------|
| Simple | 1-2 | update, rename, add, remove, config, delete, move, copy | 8,000 |
| Medium | 3-4 | implement, create, integrate, refactor, extend, connect, hook | 20,000 |
| Complex | 5+ | architect, design, migrate, rewrite, system, overhaul, rebuild | 35,000 |

**Classification rules:**
1. First check action item count
2. If borderline (e.g., 2 items but complex keywords), upgrade one level
3. Validation/testing tasks are always **Simple** unless they involve writing new test suites (then **Medium**)

```
task_tokens = sum of each task's classified cost
```

### 4. Validation Commands

Each command in `## Validation Commands` requires execution and output processing.

```
validation_tokens = number_of_commands * 3000
```

### 5. Orchestration Overhead

Fixed cost for task management, team coordination, and agent reasoning between tasks.

```
orchestration_tokens = 10000
```

### 6. Context Accumulation Tax

As the conversation progresses, the context window fills with previous messages. Apply a 15% multiplier.

```
subtotal = plan_tokens + referenced_file_tokens + task_tokens + validation_tokens + orchestration_tokens
total_estimated_tokens = subtotal * 1.15
```

## Constants

| Constant | Value | Purpose |
|----------|-------|---------|
| `TOKEN_BUDGET` | 150,000 | Maximum tokens for a single build session |
| `SHARD_OVERHEAD` | 20,000 | Boilerplate tokens per shard file |
| Effective budget | 130,000 (85% of 150k) | Safety margin for bin packing |
| Context tax | 15% | Applied to subtotal for context accumulation |
| New file estimate | 2,000 tokens | Default for files that don't exist yet |
