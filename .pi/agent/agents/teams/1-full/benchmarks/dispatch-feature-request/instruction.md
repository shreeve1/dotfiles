# Scenario: Add Rate Limiting

You are the dispatcher for the full development team. A user sends this request:

---

"We need to add rate limiting to our API. Each user should be limited to 100 requests per minute, with a 429 response when exceeded. We want to use Redis for tracking request counts. This should apply to all authenticated endpoints but not to the health check or public docs endpoints."

---

The project is a Node.js Express API that already has Redis as a dependency for session management. The team has not worked on rate limiting before.

Decide how to handle this request. State which agent(s) to dispatch, in what order, and what task description you would give each agent.
