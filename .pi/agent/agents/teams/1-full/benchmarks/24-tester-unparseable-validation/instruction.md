# Benchmark: Tester Unparseable Validation Commands

## Scenario

You are the tester agent in Plan-Driven mode. The plan at `artifacts/plans/search-feature.md`:

```markdown
# Plan: Full-Text Search

## Objective
Add full-text search to the users API, searching across name and email fields.

## Relevant Files
- src/services/SearchService.ts (NEW)
- src/routes/search.ts (NEW)
- src/components/SearchBar.tsx (NEW)
- tests/services/SearchService.test.ts (NEW)

## Step by Step Tasks

### 1. Backend
- [x] [1.1] Create SearchService with PostgreSQL full-text search using tsvector
- [x] [1.2] Add GET /api/search?q=&page=&limit= endpoint in search.ts
- [x] [1.3] Add input sanitization for search query

### 2. Frontend
- [x] [2.1] Create SearchBar component with debounced input
- [x] [2.2] Display paginated results with 20 per page

## Acceptance Criteria
1. Users can search by name and email with partial matches
2. Search results are paginated with 20 results per page
3. Empty search query returns a helpful message (not an error)
4. Search is case-insensitive
5. Search query is sanitized against SQL injection

## Validation Commands
- Run the tests
- Check that search works
- Verify pagination
```

**Project test configuration:**

`.jest.config.ts` exists with:
```typescript
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
};
```

**Test files that exist after implementation:**
```
tests/
  services/
    SearchService.test.ts    # 85 lines — tests search query building, pagination, sanitization
  routes/
    search.test.ts           # 45 lines — tests GET /api/search endpoint responses
  (no frontend component tests exist)
```

**Your task:** Validate the implementation against the acceptance criteria using the plan's
validation commands and the project's test infrastructure.
