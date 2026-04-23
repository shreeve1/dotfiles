---
capture_type: LEARNING
timestamp: 2026-04-19 09:48:41 PST
rating: 4
source: implicit
auto_captured: true
tags: [sentiment-detected, implicit-rating, improvement-opportunity]
---

# Implicit Low Rating Captured: 4/10

**Date:** 2026-04-19
**Rating:** 4/10
**Detection Method:** Sentiment Analysis
**Feedback:** Questioning unexpected version number in prompt

---

## Context

James Schriever asked Loop to create a Kali-style prompt structure. After Loop implemented changes and declared 'No errors,' James Schriever's actual prompt now shows 'james@Mac-~-v3.14.3' with the version number visible. His question 'do you know what the version number is now in my prompt?' suggests this version display is unexpected and unwanted. The Kali-style specification mentioned was `┌──(user@host)-[/path]-[git]` without version numbers. Loop appears to have introduced an unintended element (the v3.14.3 version display) in the prompt configuration, causing James Schriever to question why it's appearing. While not strongly expressed, this represents mild dissatisfaction with Loop introducing an unrequested change to the prompt structure. The root cause is Loop adding or preserving a version number module in Starship when it wasn't part of the requested Kali-style format. Loop should have stuck strictly to the specified Kali format: user@host, path, and git branch only, without version numbers.

---

## Improvement Notes

This response was rated 4/10 by James Schriever. Use this as an improvement opportunity.

---
