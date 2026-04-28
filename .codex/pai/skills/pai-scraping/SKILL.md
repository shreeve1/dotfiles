---
name: "pai-scraping"
description: "PAI Codex port: Web scraping via progressive escalation (Bright Data proxy) and social media platform actors (Apify). USE WHEN scraping, Bright Data, proxy, crawl, scrape URL, Twitter scraping, Instagram scraping, LinkedIn scraping, Ti..."
---

# Scraping

This is a Codex-native port of an upstream PAI skill. Codex instructions, local tools, and higher-priority AGENTS.md guidance take precedence.

Use local Codex skills, shell tools, subagents, and web access only when the current session permits them. Do not assume external providers are configured.

## Gated Dependencies

- Apify account, token, and MCP or CLI access
- Bright Data account and MCP access
- External media processing tools

## Ported Workflow

# Scraping

Unified skill for web scraping workflows.

## Workflow Routing

| Request Pattern | Route To |
|---|---|
| Bright Data, scrape URL, proxy, crawl, progressive scraping, Chrome headers | `BrightData/SKILL.md` |
| Twitter, Instagram, LinkedIn, TikTok, YouTube, Facebook, Google Maps, Amazon scraping, Apify | `Apify/SKILL.md` |
