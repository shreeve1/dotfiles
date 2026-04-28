---
name: "pai-security"
description: "PAI Codex port: Security assessment and intelligence - network reconnaissance, web app security testing, prompt injection testing, security news monitoring, and annual report analysis. USE WHEN recon, reconnaissance, port scan, subdoma..."
---

# Security

This is a Codex-native port of an upstream PAI skill. Codex instructions, local tools, and higher-priority AGENTS.md guidance take precedence.

Use local Codex skills, shell tools, subagents, and web access only when the current session permits them. Do not assume external providers are configured.

## Gated Dependencies

- Browser automation runtime
- Gemini CLI or API access
- SEC/EDGAR data access

## Ported Workflow

# Security

Unified skill for security assessment and intelligence workflows.

## Workflow Routing

| Request Pattern | Route To |
|---|---|
| Recon, reconnaissance, port scan, subdomain, DNS, WHOIS, ASN | `Recon/SKILL.md` |
| Web assessment, OWASP, pentest, ffuf, app security, threat modeling | `WebAssessment/SKILL.md` |
| Prompt injection, jailbreak, LLM security, guardrail bypass | `PromptInjection/SKILL.md` |
| Security news, sec updates, breaches, tldrsec, security research | `SECUpdates/SKILL.md` |
| Annual reports, security trends, threat landscape, vendor reports | `AnnualReports/SKILL.md` |
