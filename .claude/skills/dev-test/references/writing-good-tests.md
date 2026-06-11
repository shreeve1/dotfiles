# Writing good tests

The value of `dev-test` is not "more tests" — it's *trustworthy* tests. A
generated suite that's noisy, brittle, or overfit is worse than no suite,
because it trains people to ignore red. These are the principles that keep
generated tests worth keeping, with the reasoning behind each so you can apply
judgment rather than rote rules.

## Test behavior, not implementation

Assert what a caller or user can observe: a return value, an HTTP response, text
on screen, a raised error, a row in the database. Don't assert private internals
— which helper was called, the shape of an intermediate variable, the order of
internal steps.

Why: behavior is the contract; implementation is how the contract is met today.
A refactor that preserves behavior should keep every test green. If a test
breaks during a behavior-preserving refactor, it was testing the wrong thing,
and the usual outcome is that someone deletes it in frustration — leaving the
real behavior untested.

**Bad** (implementation): `assert service._cache_connection is not None`
**Good** (behavior): `assert client.get("/api/bindings").status_code == 200`

## Cover the unhappy paths — that's where bugs live

The happy path is the one the author already tested by hand while building. The
bugs hide in: empty/null/malformed input, errors and exceptions, boundaries
(0, 1, max, off-by-one), concurrency and ordering, missing resources (404),
permission denied, timeouts. Spend your test budget here.

Worked example from a real session: a SQLite-backed API looked fine on every
single-request curl. The bug only appeared under *concurrent* requests, because
FastAPI ran the dependency and the endpoint on different threads. The happy path
hid it; an unhappy-path test (fire N requests in parallel, assert no 500)
exposed it and now guards it forever.

## No speculative tests

Don't test the framework, the language, third-party libraries, or trivial
pass-throughs (a getter that returns a field). Don't test scenarios that can't
occur given the types and call sites. Each test costs maintenance forever; a
test that can never fail for a real reason is pure cost.

This is "Simplicity First" applied to tests: fewer, sharper tests beat a wall of
filler. If you can't name the bug a test would catch, don't write it.

Coverage percentage is a *hint* for finding code with no tests — never a target.
You can execute every line while asserting nothing meaningful. Chasing 100%
produces exactly the speculative filler this section warns against.

## One regression test per genuine bug, and prove it

When a bug is found, write exactly one test that reproduces it, named so the
failure message explains the bug (`test_concurrent_reads_do_not_cross_threads`,
not `test_bindings_2`). 

Prove the test actually guards the bug: it should **fail against the buggy code**
and **pass against the fix**. When practical, demonstrate this (temporarily
revert the fix, watch the test go red, restore). A regression test that passes
even with the bug present is decoration, not protection.

## Match the project's conventions

Use the same framework, fixtures, naming scheme, directory layout, and assertion
style as the tests already in the repo. Read a neighboring test file first and
mirror it. A reviewer should not be able to tell which tests are newly generated
purely from style — consistency is what makes the suite feel maintained rather
than bolted-on.

If the project has shared fixtures/helpers (a `conftest.py`, a test client
factory, a Playwright fixture), use them instead of re-rolling setup. If you find
yourself writing the same setup in three tests, that's a signal to add a fixture
— following the project's existing pattern for doing so.

## Don't touch unrelated tests

Add new tests and extend the file they belong in; do not refactor, rename, or
"improve" tests outside the scope of the change. If you spot an existing test
that's wrong or misleading, **flag it** in the report — don't silently rewrite
it. Surgical changes keep the diff reviewable and keep blame honest.

## Decide mock vs real deliberately, and prefer the cheapest real thing

When the code under test touches a dependency, the question is what to substitute
and what to keep real. A rule of thumb that ages well:

- **Keep real anything you can run locally, fast, and hermetically.** An
  in-process SQLite file, a temp directory, a `TestClient` against your own app —
  these exercise the real integration and catch real bugs (the cross-thread
  SQLite bug only surfaced because the test hit a real connection, not a mock).
  Prefer a real temp DB over a mocked repository layer.
- **Fake/mock anything slow, flaky, external, costly, or non-deterministic.**
  Third-party HTTP APIs, payment providers, email/SMS, the system clock, random
  sources, the network. Inject a stub or use the framework's mocking so the test
  is fast and can't fail for reasons unrelated to your code.
- **Mock at the boundary, not in the middle.** Replace the outermost edge (the
  HTTP client, the clock) and let your own code run for real underneath. Mocking
  internal functions couples the test to implementation and is the fast path to
  brittle tests.

The trap to avoid: a test so thoroughly mocked that it only verifies the mocks
were called. If every collaborator is faked, the test asserts your wiring matches
your assumptions — not that the behavior is correct.

## Set up test data explicitly and locally

Integration and E2E tests need data to exist. Make each test responsible for the
state it depends on rather than assuming ambient data:

- Seed inside the test (or a fixture) into a fresh temp DB; tear down after. Don't
  depend on rows a previous test left behind.
- For E2E, the app under test must come up with known data — either the app seeds
  an empty store on boot (as a tracer-bullet backend might) or the test harness
  loads a fixture before the run. Assert against *that* known data, not whatever
  happens to be present.
- Never point a test at shared/staging/prod data. It's slow, it's flaky, and it's
  destructive when the test writes.

## Make each test independent and deterministic

A test should pass or fail on its own, regardless of order or what ran before.
Avoid shared mutable state, real wall-clock time, real network, and random
values without a fixed seed. Use temp dirs/databases (`tmp_path`), fakes for
external services, and injected clocks/seeds. Flaky tests erode trust in the
whole suite faster than missing tests do — a suite that's red 5% of the time for
no reason gets ignored entirely.

## Keep arrange-act-assert legible

One behavior per test. Arrange the inputs, perform the single action, assert the
observable outcome. When a test fails a year from now, its name and its three
sections should tell the reader what broke without spelunking. Table-driven /
parametrized tests are great for many input variations of *one* behavior — but
keep distinct behaviors in distinct tests.
