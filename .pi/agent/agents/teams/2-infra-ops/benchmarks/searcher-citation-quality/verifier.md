# Verifier: Searcher Citation Quality

## Target Agent
searcher.md (from agents/infra-ops/)

## Context Files
context.md (from teams/2-infra-ops/)

## Scoring Rubric

### Criterion 1: Relevant Certbot Documentation Found (weight: 3)
- 5: Finds certbot documentation directly relevant to the issue — snap refresh behavior, renewal configuration file format, how to regenerate missing renewal .conf files (certbot certonly --force-renewal or manual .conf recreation). References official certbot docs (certbot.eff.org or readthedocs)
- 3: Finds general certbot documentation but not specific to snap refresh issues or missing renewal configs
- 1: Only finds tangentially related documentation
- 0: No certbot documentation found or referenced

### Criterion 2: Citations Include URLs (weight: 3)
- 5: Every citation includes a specific URL. Vendor Context and Known Issues sections both have URLs for each entry. URLs are plausible and point to real documentation sources (certbot.eff.org, github.com/certbot, snapcraft.io, letsencrypt.org community)
- 3: Most citations have URLs but some are missing
- 1: Only 1-2 URLs provided across all citations
- 0: No URLs in citations

### Criterion 3: Known Issues Section Populated (weight: 2)
- 5: Known Issues section identifies specific issues — snap refresh breaking certbot config, configure hook failures in certbot snap, missing renewal directory after upgrade. Each issue has a source reference. Distinguishes between confirmed bugs and community-reported issues
- 3: Known Issues section exists but only has 1 entry or entries lack specificity
- 1: Known Issues mentioned in passing but no dedicated section
- 0: No known issues identified

### Criterion 4: CVE Transparency (weight: 1)
- 5: Explicitly states whether CVEs were found or not. If no CVEs affect certbot 2.5.0/2.6.0, clearly says "No CVEs Found" with a note on what was searched (NVD, CVE databases). Does not fabricate CVEs
- 3: Mentions CVE search but is ambiguous about results
- 1: Does not address CVEs at all despite being asked
- 0: Fabricates CVE numbers or claims CVEs exist without evidence

## Required Elements
- [ ] Vendor Context section with certbot documentation citations
- [ ] Known Issues section with snap refresh / configure hook failure information
- [ ] URLs provided for all citations
- [ ] CVE search results explicitly stated (found or not found)
- [ ] Structured output format (Vendor Context, Known Issues, Recommended Reading)
- [ ] Relevance ratings on citations (direct/partial)

## Anti-Patterns
- Fabricating CVE numbers (CVE-XXXX-XXXXX that don't exist)
- Providing URLs that are obviously hallucinated or malformed
- Mixing up certbot versions or attributing issues to wrong versions
- Not using the structured citation output format
- Running SSH commands or modifying files (searcher is web-research only)
- Omitting the "No CVEs Found" statement when no CVEs exist (silence implies they weren't checked)
