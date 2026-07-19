---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
---

Implement the work described by the user in the spec or tickets.

Before you build, ground your reading of the spec/tickets in the actual code: the seams you'll test at, the modules you'll touch, what's already wired, which ticket claims a blocker is done. Run an **independent verify (see `../_shared/verify-claims.md`)** on those load-bearing claims in one batched call, and correct any that come back FALSE before writing code — building on a wrong assumption about the current codebase is the expensive mistake this catches early. (The `/code-review` at the end carries its own verify pass over the finished diff.)

Use /tdd where possible, at pre-agreed seams.

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

Once done, use /code-review to review the work.

Commit your work to the current branch.
