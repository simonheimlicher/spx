# Completion Evidence: Tool Discovery Infrastructure

## Review Summary

**Verdict**: APPROVED
**Date**: 2026-01-23
**Reviewer**: reviewing-typescript

## Verification Results

| Tool    | Status | Details                    |
| ------- | ------ | -------------------------- |
| tsc     | PASS   | 0 errors                   |
| eslint  | PASS   | 0 violations               |
| Semgrep | PASS   | 0 findings                 |
| vitest  | PASS   | 15/15 tests, 100% coverage |

## Acceptance Criteria Met

- [x] `discoverTool()` function finds tools via `require.resolve()`
- [x] Falls back to project `node_modules/.bin/<tool>`
- [x] Falls back to system PATH
- [x] Returns source information (bundled/project/global)
- [x] Returns helpful error when tool not found
- [x] Graceful skip message format: `⏭ Skipping <step> (<tool> not available)`

## Implementation

| File                                      | Purpose                           |
| ----------------------------------------- | --------------------------------- |
| `src/validation/discovery/constants.ts`   | DRY constants for tool discovery  |
| `src/validation/discovery/tool-finder.ts` | Three-tier tool discovery with DI |
| `src/validation/discovery/index.ts`       | Module exports                    |
| `src/validation/index.ts`                 | Validation module root            |

## Graduated Tests

| Requirement       | Test Location                                                                                      |
| ----------------- | -------------------------------------------------------------------------------------------------- |
| Bundled discovery | `tests/unit/validation/tool-finder.test.ts::discoverTool::GIVEN bundled tool available`            |
| Project discovery | `tests/unit/validation/tool-finder.test.ts::discoverTool::GIVEN tool only in project node_modules` |
| Global discovery  | `tests/unit/validation/tool-finder.test.ts::discoverTool::GIVEN tool only in system PATH`          |
| Not found         | `tests/unit/validation/tool-finder.test.ts::discoverTool::GIVEN tool not found anywhere`           |
| Skip message      | `tests/unit/validation/tool-finder.test.ts::formatSkipMessage`                                     |
| Real tools        | `tests/integration/validation/tool-finder.integration.test.ts::discoverTool integration`           |

## Verification Command

```bash
npx vitest run tests/unit/validation/tool-finder.test.ts tests/integration/validation/tool-finder.integration.test.ts
```

## Notes

- Implementation follows ADR-001 dependency injection pattern
- No mocking used - only DI with controlled implementations
- Uses constants pattern for DRY
- 100% statement coverage on new code
