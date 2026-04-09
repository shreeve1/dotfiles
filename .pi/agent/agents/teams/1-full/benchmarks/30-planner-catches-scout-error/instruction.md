# Benchmark: Planner Catches Scout Error

## Scenario

You are the planner. The scout explored the user management system and provided this report:

```markdown
## Scout Report
**Explored:** User management system for adding email change flow

### Structure
src/
  services/
    UserService.ts          # Core user operations
  controllers/
    UserController.ts       # HTTP handlers
  models/
    User.ts                 # Prisma model

### Key Findings
- UserService.ts:23 — `createUser(email, password)` creates user with bcrypt hash
- UserService.ts:45 — `updateEmail(userId, newEmail)` updates email directly, NO validation
- UserController.ts:12 — POST /users calls createUser
- UserController.ts:30 — PUT /users/:id/email calls updateEmail
- EmailValidator.ts — **does not exist** (no email validation anywhere in codebase)
- User.ts:5 — Prisma model has `email String @unique` but no format constraint

### Handoff Notes
- **Modification targets:** UserService.ts (add validation to updateEmail), EmailValidator.ts (NEW — create from scratch)
- **Watch-out:** No email validation exists anywhere in the codebase — need to build validation from scratch before implementing the email change flow
- **Pattern:** Other validators don't exist either; this would be the first validation utility
```

**The user's request:** "Add a proper email change flow with validation and confirmation email."

**Codebase context available to you:** You have access to `read`, `bash`, `grep`, `find`,
and `ls` tools to explore the codebase. The scout explored `src/services/`, `src/controllers/`,
and `src/models/` but may not have checked all directories.

**Project structure (from `ls src/`):**
```
src/
  config/
  controllers/
  middleware/
  models/
  routes/
  services/
  utils/
  types/
```

**Task:** Create the implementation plan for the email change flow.
