# Stack detection

Detect the test stack per area rather than assuming one. A repo often mixes
stacks (Python backend + JS frontend), so a single change set can need two
different runners. The goal: run tests the way the project already runs them.

## How to detect

1. **Read the project's own commands first.** These override every default
   below — match what the team actually uses:
   - `CLAUDE.md` / `README` — often state the canonical test command.
   - CI config: `.github/workflows/*.yml`, `.gitlab-ci.yml`, `Jenkinsfile`.
   - `Makefile` / `justfile` / `Taskfile.yml` — look for a `test` target.
   - `package.json` `"scripts"` — `test`, `test:e2e`, `test:unit`.
   - `pyproject.toml` `[tool.pytest.ini_options]`, `tox.ini`, `noxfile.py`.
2. **Fall back to manifest signals** (below) when no explicit command exists.
3. **Match the invocation style.** If the repo uses `uv run pytest`, use that —
   not bare `pytest`. If it uses `pnpm test:e2e`, use that — not `npx playwright`.

## Signals and commands by stack

### Python — pytest
- Signals: `pyproject.toml`, `pytest.ini`, `setup.cfg [tool:pytest]`, `conftest.py`, `tests/` with `test_*.py`.
- Runner: `pytest -q`. With uv: `uv run pytest -q`. With poetry: `poetry run pytest -q`.
- Single file/test: `pytest path::test_name -q`.
- Conventions: files `test_*.py`, functions `test_*`, fixtures in `conftest.py`,
  `tmp_path`/`monkeypatch` for isolation, `pytest.raises` for error paths,
  `@pytest.mark.parametrize` for table-driven cases. Concurrency repro:
  `ThreadPoolExecutor`.

### JavaScript/TypeScript — Vitest / Jest
- Signals: `vitest.config.*` / `jest.config.*`, `package.json` deps, `*.test.ts`, `*.spec.ts`.
- Runner: `pnpm test` / `npm test` / `yarn test` (or `pnpm vitest run`, `pnpm jest`).
- Conventions: `describe`/`it`/`expect`, `*.test.ts` next to source or under `__tests__/`.

### Browser E2E — Playwright
- Signals: `playwright.config.ts`, `@playwright/test` dep, `tests/*.spec.ts`.
- Runner: `pnpm test:e2e` or `pnpm exec playwright test` (single: `playwright test file.spec.ts`).
- Browsers must be installed once: `pnpm exec playwright install chromium`.
- `webServer` in the config starts the app(s) for CI — extend it, don't bypass it.
- Conventions: `page.goto`, `expect(locator)`, `getByRole`/`getByTestId`. Use
  `data-testid` hooks already present in the components.

### Browser E2E — Cypress
- Signals: `cypress.config.*`, `cypress/` dir. Runner: `pnpm cypress run`.

### Go
- Signals: `go.mod`, `*_test.go`. Runner: `go test ./...` (single: `go test ./pkg -run TestName`).
- Conventions: `func TestX(t *testing.T)`, table tests, `t.Run` subtests.

### Rust
- Signals: `Cargo.toml`, `#[test]`, `tests/`. Runner: `cargo test` (single: `cargo test name`).

### Ruby
- Signals: `Gemfile` with rspec, `spec/`, `*_spec.rb`. Runner: `bundle exec rspec`.

### Java/Kotlin
- Signals: `pom.xml` (Maven) / `build.gradle` (Gradle), `src/test/`.
- Runner: `mvn test` / `./gradlew test` (single: `-Dtest=ClassName` / `--tests ClassName`).

### .NET
- Signals: `*.csproj`/`*.sln`, xunit/nunit deps. Runner: `dotnet test`.

## Bootstrapping when no test stack exists

If detection finds no framework, set up the minimal idiomatic harness for the
ecosystem the *source* is written in. Use the project's existing package manager
(check for `uv.lock`/`poetry.lock`, `pnpm-lock.yaml`/`yarn.lock`/`package-lock.json`).
Keep it minimal — standard runner, conventional dir, a `test` command — and
report it as a bootstrap.

- **Python → pytest**: `uv add --dev pytest` (or `poetry add -G dev pytest` / `pip install pytest` + record in the project's dep file). Create `tests/` with `test_*.py`; add `conftest.py` only if shared fixtures are needed.
- **JS/TS unit → Vitest**: `pnpm add -D vitest`; add `"test": "vitest run"` to `package.json` scripts; create `*.test.ts` beside source. (Use Jest instead only if the repo's tooling already leans Jest.)
- **Browser E2E → Playwright**: `pnpm add -D @playwright/test` + `pnpm exec playwright install chromium`; create `playwright.config.ts` (with a `webServer` block that starts the app for CI) and `tests/*.spec.ts`; add `"test:e2e": "playwright test"`.
- **Go**: no install needed; create `*_test.go` beside source; runner is `go test ./...`.
- **Rust**: no install needed; add `#[cfg(test)]` modules or a `tests/` dir; runner is `cargo test`.

State the choice and why when it's non-obvious (unittest vs pytest, vitest vs
jest) rather than asking. After bootstrapping, the new command almost certainly
isn't in CI yet — flag that per the "make sure tests run again" step.

## Mixed repos

When the diff spans stacks, run each affected suite with its own runner and
report them separately. Example (a FastAPI + Next.js repo):

```
uv run pytest -q            # backend unit + integration
pnpm test:e2e               # frontend browser E2E (Playwright)
```

If a change touches both halves (e.g. a backend bug fixed because a frontend E2E
test exposed it), put the regression test at the layer where it's cheapest and
most deterministic — usually a unit/integration test, even if an E2E test is
what originally surfaced it.
