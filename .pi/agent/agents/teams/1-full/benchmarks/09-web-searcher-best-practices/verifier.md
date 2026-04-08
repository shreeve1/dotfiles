# Verifier: Researching Best Practices for Technical Decision

## Target Agent
web-searcher.md (from ~/.pi/agent/agents/)

## Context Files
- ~/.pi/agent/agents/teams/1-full/context.md

## Scoring Rubric

### Criterion 1: Practical Relevance (weight: 3)
- 5: Findings are directly actionable for an Express.js file upload implementation — mentions specific libraries (e.g., multer, busboy, formidable), specific security practices (file type validation beyond extension, size limits, malware scanning), and specific storage trade-offs
- 3: Covers the topic broadly but findings are generic (e.g., "validate file types" without explaining how)
- 1: Returns tutorial-level content not suitable for production decisions
- 0: Off-topic or no useful findings

### Criterion 2: Source Quality and Currency (weight: 3)
- 5: Cites 3+ specific URLs, sources include official docs or well-regarded references, findings reflect current library versions and practices (not outdated advice)
- 3: Has sources but fewer than 3, or sources are outdated or low-quality
- 1: No sources cited, or only one source
- 0: Fabricated information with no sources

### Criterion 3: Security Coverage (weight: 2)
- 5: Covers at least 4 of: file type validation (MIME + magic bytes), size limits, path traversal prevention, malware scanning, filename sanitization, storage permissions
- 3: Covers 2-3 security considerations
- 1: Mentions "security" generically without specifics
- 0: No security coverage

### Criterion 4: Decision-Ready Format (weight: 2)
- 5: Report is structured so the planner can extract specific technical decisions — clear recommendations with trade-offs, not just a list of options
- 3: Informative but the planner would need to do additional research to decide
- 1: Raw information dump without synthesis or recommendations
- 0: No actionable structure

## Required Elements
- [ ] At least 2 specific library recommendations with brief comparison
- [ ] Security considerations beyond basic size limits
- [ ] Storage approach comparison (local vs. cloud with trade-offs)
- [ ] Source URLs cited
- [ ] Findings synthesized into a summary (not just raw search results)

## Anti-Patterns
- Recommending a single library without alternatives or trade-offs
- Ignoring security entirely in a file upload context
- Citing only Stack Overflow answers from 3+ years ago
- Producing a wall of text without structure or synthesis
- Fabricating library names or version numbers
