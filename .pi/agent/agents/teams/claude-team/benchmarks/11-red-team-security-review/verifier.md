# Verifier: Security Review of File Upload Endpoint

## Target Agent
red-team.md (from ~/.pi/agent/agents/)

## Context Files
- ~/.pi/agent/agents/teams/1-full/context.md

## Scoring Rubric

### Criterion 1: Vulnerability Detection (weight: 3)
- 5: Identifies at least 5 of: (a) path traversal in GET endpoint (req.params.filename with ../ not sanitized), (b) no file type validation (accepts any file type — could upload .exe, .php), (c) MIME type from client is untrusted (file.mimetype can be spoofed), (d) GET endpoint has no auth (anyone can access uploads), (e) stored original filename without sanitization (XSS risk if displayed), (f) no malware scanning, (g) upload directory may be web-accessible, (h) different UUID generated for DB insert vs. response URL
- 3: Identifies 3-4 vulnerabilities
- 1: Identifies only 1-2 obvious issues
- 0: Finds no vulnerabilities or only code style issues

### Criterion 2: Severity Assessment (weight: 2)
- 5: Path traversal and missing auth on GET rated as Critical/High; file type validation as High; MIME spoofing and XSS as Medium; missing malware scanning as Low/Medium. Severity ratings align with actual exploitability.
- 3: Has severity ratings but some are miscalibrated (e.g., path traversal rated Low)
- 1: Issues listed without severity
- 0: No severity assessment

### Criterion 3: Remediation Specificity (weight: 3)
- 5: Each vulnerability has a specific code-level fix — e.g., "sanitize filename: `path.basename(req.params.filename)` to prevent traversal", "add `requireAuth` middleware to GET route", "validate file extension against allowlist"
- 3: Has remediations but some are vague ("add validation")
- 1: Says "fix the security issues" without specifics
- 0: No remediations

### Criterion 4: UUID Bug Detection (weight: 1)
- 5: Notices that a new UUID is generated for the response URL instead of using the one from the renamed file — the URL will 404 because it doesn't match the actual filename
- 3: Notices something is off with the UUID/URL but doesn't fully explain the bug
- 1: Doesn't notice the UUID mismatch
- 0: N/A

## Required Elements
- [ ] Path traversal in GET endpoint identified
- [ ] Missing authentication on GET endpoint identified
- [ ] File type validation gap identified
- [ ] At least 3 specific code-level remediation suggestions
- [ ] Severity ratings for each finding
- [ ] Findings organized by severity (Critical first)

## Anti-Patterns
- "The code looks secure" or finding zero issues
- Focusing only on the POST endpoint and ignoring the GET endpoint
- Generic advice ("follow OWASP guidelines") without specific findings
- Not noticing the missing auth on the download route
- Reporting issues without remediation suggestions
