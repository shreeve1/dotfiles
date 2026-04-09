# Verifier: Planner Catches Scout Error

## Target Agent
planner (from agents/planner.md)

## Context Files
- agents/teams/1-full/context.md

## What the planner doesn't know (for evaluator context only)

The scout missed `src/utils/validators.ts` which contains:
```typescript
import { z } from 'zod';
export const emailSchema = z.string().email();
export function validateEmail(email: string): boolean {
  return emailSchema.safeParse(email).success;
}
```
And `UserService.ts:23` actually imports and uses `validateEmail()` in `createUser`.
The scout's claim that "no email validation exists anywhere" is wrong — validation
exists in `utils/` and is already used in `createUser`. Only `updateEmail` lacks it.

The planner has tools to discover this — `grep`, `find`, `ls src/utils/`, etc.

## Scoring Rubric

### Criterion 1: Verification Instinct (weight: 3)
- 5: Before committing to "build validation from scratch," the planner independently checks for existing validation — e.g., searching for "validate", "email", "zod", or "schema" in the codebase, or listing `src/utils/`. Shows a habit of verifying upstream claims before basing a plan on them.
- 3: Includes a preliminary "check for existing utilities" task in the plan but doesn't actually search before planning. Treats verification as a step rather than a precondition.
- 1: Notes uncertainty ("the scout says no validation exists, but we should check") without acting on it.
- 0: Accepts the scout report uncritically. Plans to create EmailValidator.ts from scratch with no attempt to verify the claim.

### Criterion 2: Claim Skepticism (weight: 3)
- 5: Explicitly questions the scout's strongest claim — "no email validation anywhere in the codebase" and "this would be the first validation utility." Recognizes these are sweeping negative claims that the scout may not have verified exhaustively (scout only checked 3 directories). The `src/utils/` directory was not explored.
- 3: Implicitly treats the claim as uncertain (hedging language, conditional tasks) but doesn't call out specifically what's suspect.
- 1: Passes through the scout's claims without questioning.
- 0: Amplifies the scout's claims ("since there's no validation infrastructure, we need to build the entire validation layer").

### Criterion 3: Plan Robustness (weight: 2)
- 5: Plan is structured to work whether or not existing validation is found: early task to search for existing validators, conditional branching (reuse if found, create if not), and the main email change flow doesn't depend on the validation approach being decided upfront.
- 3: Plan has a verification step but the rest of the plan assumes the scout is correct (create from scratch).
- 1: Rigid plan that only works if the scout is correct.
- 0: No accommodation for the scout being wrong.

### Criterion 4: Codebase Exploration (weight: 2)
- 5: References the un-explored directories (`src/utils/`, `src/config/`, `src/middleware/`) as areas the scout didn't cover. Recognizes that the scout's coverage was limited to services/controllers/models and other directories might contain relevant code.
- 3: Explores some additional area but doesn't connect it to the scout's coverage gaps.
- 1: Stays within the scout's explored directories.
- 0: No additional exploration.

## Required Elements
- [ ] Attempts to verify the scout's "no validation exists" claim (search, grep, ls, or explicit verification task)
- [ ] Does NOT unconditionally plan to create validation from scratch
- [ ] Recognizes that the scout only explored 3 of 8 source directories
- [ ] Plan includes the email change flow (not just the validation question)
- [ ] References `updateEmail` at UserService.ts:45 as the known gap

## Anti-Patterns
- Accepts "no email validation anywhere" without any verification attempt
- Plans to create EmailValidator.ts from scratch as a certainty
- Amplifies the scout's claim ("we need to build the entire validation infrastructure")
- Ignores `src/utils/` entirely (the most likely place for validation utilities)
- No skepticism toward sweeping negative claims from upstream
