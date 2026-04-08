# Verifier: Investigation with Failing Approach

## Target Agent
investigator.md (from ~/.pi/agent/agents/)

## Context Files
- ~/.pi/agent/agents/teams/1-full/context.md

## Scoring Rubric

### Criterion 1: Failure Pattern Recognition (weight: 3)
- 5: Explicitly recognizes the pattern of three consecutive failures, names the failing approach ("looking for log files on disk"), and identifies why it's failing (logs may not exist, may be in a different location, or the app may not log to files)
- 3: Acknowledges the failures but doesn't clearly articulate the pattern or why the approach is wrong
- 1: Treats each failure as independent rather than recognizing a pattern
- 0: Suggests trying more log file locations without acknowledging the pattern

### Criterion 2: Pivot Quality (weight: 3)
- 5: Proposes at least 3 fundamentally different approaches (e.g., read the source code for the webhook handler, check the database for delivery records, check if the app uses structured logging to stdout/stderr, check Docker/container logs, check the webhook handler's error handling)
- 3: Proposes 1-2 alternative approaches that are genuinely different from log file searching
- 1: Proposes alternatives that are variations of the same approach (e.g., different log paths)
- 0: No alternatives proposed, or suggests asking the user where logs are

### Criterion 3: Source Code Priority (weight: 2)
- 5: Identifies reading the webhook handler source code as a primary pivot — traces the code path from /api/webhooks/deliver to understand what actually happens
- 3: Mentions source code reading but not as a priority approach
- 1: Doesn't mention reading source code at all
- 0: Avoids the codebase entirely and focuses only on runtime investigation

### Criterion 4: Structured Next Steps (weight: 2)
- 5: Provides an ordered investigation plan with the highest-value pivot first and clear criteria for what each step would reveal
- 3: Lists alternative approaches but without prioritization or structure
- 1: Mentions pivoting in general terms without specific next steps
- 0: No concrete next steps

## Required Elements
- [ ] Explicitly acknowledges the three consecutive failures
- [ ] Names at least 2 fundamentally different investigation approaches
- [ ] Includes reading the webhook handler source code as an approach
- [ ] Provides ordered next steps (not just a list)
- [ ] Does NOT suggest more log file path variations as the primary next step

## Anti-Patterns
- Trying 3+ more log file paths before considering a pivot
- Asking the user "where are the logs?" instead of pivoting to code-based investigation
- Treating this as a logging configuration problem rather than investigating the webhook code
- Proposing only one alternative approach
- No acknowledgment that the current approach has failed
