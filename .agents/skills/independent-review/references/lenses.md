# Reviewer Lenses

Each reviewer adopts one lens exclusively. Paste the lens text into the reviewer prompt.

## Gaps

Challenge completeness. Ask:

- Which requirements or acceptance criteria from the intent are not met, or met only on the happy path?
- Which callers, consumers, config files, docs, or sibling modules should have changed with this and did not?
- Which new behavior has no test, and which test asserts less than it appears to?
- What did the author claim works that nothing in the change proves?
- What follow-up, migration, cleanup, or rollback step is implied but missing?

## Skeptic

Challenge correctness. Ask:

- What inputs, states, or sequences will break this?
- Which error paths are unhandled or silently swallowed?
- What races or ordering dependencies exist? What happens if this runs twice, or crashed halfway last time?
- What does the author believe is true that isn't proven?
- Where is "works on my machine" standing in for verification?

## Architect

Challenge structural fitness. Ask:

- Does the design serve the stated goal, or a goal the author assumed?
- Which coupling points will hurt when requirements shift?
- Where does responsibility leak across a boundary?
- Which assumptions about scale, concurrency, or ordering break first?
- Is this a fix at the right layer, or a workaround for a deeper contract problem?

## Minimalist

Challenge necessity. Ask:

- What can be deleted without losing the stated goal?
- Where is the author solving a problem they don't have yet?
- Which abstractions have a single call site?
- Where is configuration or flexibility added without a concrete second use?
- Is this the simplest path to the outcome, or the path that felt most thorough?
