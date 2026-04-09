# Verifier: Red-Team False Positive Resistance

## Target Agent
red-team (from agents/red-team.md)

## Context Files
- agents/teams/1-full/context.md

## Scoring Rubric

### Criterion 1: Accurate Severity Assessment (weight: 3)
- 5: Correctly recognizes this code is relatively well-secured. The major attack vectors are mitigated: path traversal (random filename + `path.basename`), arbitrary file types (MIME whitelist), file size (5MB limit), auth required on upload, original filename sanitized for display only. Findings are appropriately Medium or Low — not Critical or High. The overall assessment reflects "reasonably secure with some improvements possible."
- 3: Identifies real issues but inflates severities (e.g., calls something Critical when the exploit is mitigated or theoretical).
- 1: Reports mostly phantom vulnerabilities at high severity.
- 0: Either "no issues found" or everything is Critical.

### Criterion 2: Genuine Findings (weight: 3)
- 5: Reports real (if moderate) issues. The genuine findings include at least 2 of: (a) `/files/:name` endpoint has NO authentication — any uploaded file is publicly accessible to anyone who knows/guesses the filename (Medium), (b) MIME type checking relies on client-supplied `Content-Type` header which is trivially spoofable — should also verify file magic bytes (Medium), (c) no rate limiting on the upload endpoint — authenticated users could fill disk (Low), (d) stored filename has no extension — `sendFile` can't set `Content-Type` correctly, may cause rendering issues (Low).
- 3: Identifies 1 real issue but misses the unauthenticated file access or MIME spoofing.
- 1: Reports only phantom vulnerabilities without finding the real issues.
- 0: No findings at all.

### Criterion 3: No False Positives on Mitigated Risks (weight: 2)
- 5: Does NOT report path traversal as Critical/High — `path.basename()` strips directory components and filenames are random hex (not user-controlled). Does NOT report "original filename used as stored filename" (it isn't — stored name is `crypto.randomBytes`). Does NOT report `crypto.randomBytes` as weak/predictable. Correctly recognizes these as mitigated.
- 3: Reports one mitigated risk as a finding but acknowledges the mitigation exists.
- 1: Reports multiple mitigated risks as real vulnerabilities without acknowledging defenses.
- 0: Reports path traversal or filename injection as Critical despite the mitigations.

### Criterion 4: Proportionate Recommendations (weight: 2)
- 5: Recommendations match actual risk. "Add authentication to file serving endpoint" and "validate file magic bytes, not just MIME header" are proportionate. "Rewrite the entire upload system" or "add a WAF" are disproportionate. Each recommendation includes the specific risk it addresses.
- 3: Recommendations are reasonable but some are disproportionate to the risk.
- 1: Over-recommends (suggesting major architectural changes for minor issues).
- 0: No actionable recommendations.

## Required Elements
- [ ] Identifies unauthenticated file serving (`/files/:name` has no `authMiddleware`) as a real finding
- [ ] Identifies MIME-only type checking (no magic byte validation) as a real finding
- [ ] Does NOT classify path traversal as Critical or High (mitigated by random filename + `path.basename`)
- [ ] Severity assessments are proportionate (no Medium/Low finding inflated to Critical)
- [ ] Overall assessment acknowledges the existing security measures, not just the gaps

## Anti-Patterns
- Reports path traversal as Critical despite `crypto.randomBytes` filename + `path.basename`
- Claims "original filename stored = injection risk" when it's sanitized and used for display only
- Reports `crypto.randomBytes(16)` as "weak random" or "predictable"
- Inflates every finding to Critical/High severity
- Reports no findings ("code is secure") — real issues exist, they're just not Critical
- Recommends major rewrites for minor issues
