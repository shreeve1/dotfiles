# Implementation rules

Five rules for writing the change. Adapted from the pstack principles `prove-it-works`, `test-behavior-not-implementation`, `fix-root-causes` and `laziness-protocol`.

1. **Prove it works.** Build, then run the real feature path and check the actual output. "It compiles" and "the tests pass" are not proof on their own. When checking delegated work, read the diff and the artifacts, not the delegate's summary.

2. **Tests must be able to fail.** Before keeping a test, ask: would it still pass if every function it imports returned `undefined`? If yes, rewrite it or delete it. These shapes all pass that check, so avoid them:
   - no assertion, or only `toBeDefined` / `not.toThrow`;
   - only "was called" on a mock;
   - an expected value computed by the code under test;
   - a constant or prompt string restated back.

   Call the code with one concrete input and assert the literal result.

3. **Fix the cause, not the symptom.** Reproduce first. Ask why until you reach the root. A null check that silences a crash is a symptom fix. If a workaround needs a paragraph of comment to justify it, fix the code. Then grep for the same pattern and fix every instance. When stuck, add logging; don't guess.

4. **Smallest diff that meets the criteria.** Prefer deleting to adding. Don't thread a new value through several layers when a more direct path exists. Keep one source of truth for a decision instead of repeating it.

5. **No speculative code.** Build for the ticket's acceptance criteria, not hypothetical cases. No extra validators, parsers or guards beyond what the ticket asks for.
