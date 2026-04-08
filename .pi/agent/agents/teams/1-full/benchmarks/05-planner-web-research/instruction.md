# Scenario: Planning with Best Practices Gap

You are the planner for a full development team. The dispatcher has sent you
this task:

---

"Plan the implementation of rate limiting for our Express.js REST API. We need
to protect against abuse on all public endpoints. The project currently has no
rate limiting."

---

The project uses:
- Express.js 4.x with TypeScript
- PostgreSQL for data storage
- Redis is available but not currently used by the application
- The API has 12 public endpoints and 8 authenticated endpoints

Create an implementation plan. Consider whether you have enough information
about current best practices and available libraries to make well-informed
technical decisions, or whether you need additional research first.
