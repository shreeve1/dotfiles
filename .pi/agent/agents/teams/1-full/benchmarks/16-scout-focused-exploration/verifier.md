# Verifier: Targeted Codebase Exploration

## Target Agent
scout.md (from ~/.pi/agent/agents/)

## Context Files
- ~/.pi/agent/agents/teams/1-full/context.md

## Scoring Rubric

### Criterion 1: Scope Discipline (weight: 3)
- 5: Report focuses on the 3 specific questions (connection creation, config options, existing pool) and explores only the files directly relevant: connection.ts, database.ts, and possibly request-context.ts. Does NOT deep-dive into migrations, models, seeds, or service files beyond noting they exist.
- 3: Answers the 3 questions but also explores 2+ irrelevant areas (migration history, model schemas, seed data) adding bulk without value
- 1: Explores most or all listed files with equal depth regardless of relevance to the connection pooling question
- 0: Produces a general "codebase overview" that doesn't prioritize the 3 questions

### Criterion 2: Question Coverage (weight: 3)
- 5: All 3 questions answered with specific findings (file paths, line references, actual config values or patterns observed)
- 3: 2 of 3 questions answered with specifics, third answered vaguely
- 1: Only 1 question answered clearly
- 0: Questions not directly addressed — report is a file-by-file walkthrough instead

### Criterion 3: Report Conciseness (weight: 2)
- 5: Report delivers findings in ≤30 lines of substantive content (excluding headers/formatting). Every sentence adds information the planner needs.
- 3: Report is 30–60 lines with some padding but still useful
- 1: Report exceeds 60 lines with significant repetition or tangential findings
- 0: Report is a wall of text that the planner would need to re-read to extract the 3 answers

### Criterion 4: Downstream Actionability (weight: 2)
- 5: Report ends with a focused recommendation section that tells the planner exactly which files to modify and what constraints to respect — not a generic "explore more" suggestion
- 3: Some actionable recommendations but mixed with unnecessary suggestions (e.g., "also consider refactoring the model layer")
- 1: Recommendations are generic ("review the database setup")
- 0: No recommendations section

## Required Elements
- [ ] connection.ts and database.ts are identified as the primary relevant files
- [ ] All 3 dispatcher questions are directly addressed
- [ ] Migrations, models, seeds are NOT explored in depth (mentioned at most in passing)
- [ ] File:line references for key findings (connection creation point, config values)
- [ ] Report stays focused on connection pooling relevance, not general architecture

## Anti-Patterns
- Exploring all 9+ files with equal depth (boiling the ocean)
- Spending significant report space on migration history or model schemas
- Answering questions the dispatcher didn't ask (e.g., "I also noticed the test setup could be improved")
- Report longer than the actual codebase content it's summarizing
- Recommending exploration of areas unrelated to connection pooling
