---
name: cc-interview
description: Interview you about your project plans, goals, and ideas using context from CLAUDE.md and the current codebase. Ask in-depth questions about technical implementation, concerns, tradeoffs, and requirements.
---

# Interview Skill

This skill conducts a thorough interview about your project plans, ideas, or goals. It uses context from your project's `CLAUDE.md` file (if available) and the current codebase to ask relevant, non-obvious questions.

## Activation

Activate this skill by saying:
- "interview me"
- "interview me about [topic]"
- "start an interview"

## How It Works

1. **Context Gathering**: I'll read your `CLAUDE.md` file (if it exists) to understand your project context, architecture, and constraints.

2. **In-Depth Questioning**: Using the AskUserQuestion tool, I'll ask you questions about:
   - Technical implementation approach
   - Architectural decisions and tradeoffs
   - Potential concerns or risks
   - Requirements and edge cases
   - User experience considerations
   - Performance and scalability
   - Security implications
   - Testing and validation strategies

3. **Non-Obvious Questions**: I focus on deeper questions that reveal important considerations you might not have thought about, rather than surface-level details.

4. **Continues Until Complete**: The interview continues until we've thoroughly explored the topic. You can stop at any point by saying "that's enough" or "we're done."

5. **Summary**: Once complete, I'll provide a comprehensive summary of our discussion highlighting key decisions, concerns, and action items.

## Examples

**Start a general interview:**
```
interview me
```

**Interview about a specific topic:**
```
interview me about adding authentication to the API
interview me about the new dashboard design
interview me about scaling the database
```

## What Makes a Good Interview Question

This skill avoids obvious questions like "what language will you use?" and instead asks probing questions like:
- "How will you handle connection failures when the API is under heavy load?"
- "What's your strategy for rolling back this change if it introduces a regression?"
- "How does this approach align with your existing architecture principles?"
- "What are the security implications of storing user sessions this way?"
- "How will you test the edge cases where users have incomplete data?"

## Tips for Best Results

- Have your `CLAUDE.md` file updated with current project context
- Be prepared to discuss tradeoffs and alternatives
- Think about potential failure modes and edge cases
- Consider performance, security, and maintainability implications
- Don't worry about having all the answers - the interview helps identify what you need to figure out

## Output

At the end of the interview, you'll receive:
- A summary of key discussion points
- Important decisions or considerations identified
- Potential risks or concerns raised
- Action items or follow-up tasks discovered
