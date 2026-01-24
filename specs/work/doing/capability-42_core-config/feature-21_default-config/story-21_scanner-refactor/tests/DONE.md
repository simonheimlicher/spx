# Completion Evidence: Scanner Refactor for Dependency Injection

## Review Summary

**Verdict**: APPROVED
**Date**: 2026-01-24
**Reviewer**: reviewing-typescript

## Verification Results

| Tool    | Status | Details                        |
| ------- | ------ | ------------------------------ |
| tsc     | PASS   | 0 errors                       |
| eslint  | PASS   | 0 violations                   |
| Semgrep | PASS   | 3 false positives (CLI walker) |
| vitest  | PASS   | 11/11 tests, 100% coverage     |

## Implementation

**Files Modified:**

- `src/scanner/scanner.ts` - Scanner accepts SpxConfig via constructor, all paths derived from config

**ADR Compliance:**

- ✅ Uses dependency injection pattern (ADR-001)
- ✅ No hardcoded path strings in scanner code

## Graduated Tests

| Requirement                               | Test Location                                           |
| ----------------------------------------- | ------------------------------------------------------- |
| Scanner constructor accepts config        | `tests/unit/scanner/scanner-di.test.ts::line 30-51`     |
| Scanner uses config.specs.root            | `tests/unit/scanner/scanner-di.test.ts::line 78-124`    |
| Scanner uses config.specs.work.dir        | `tests/unit/scanner/scanner-di.test.ts::line 126-172`   |
| Scanner uses config.specs.work.statusDirs | `tests/unit/scanner/scanner-di.test.ts::line 174-219`   |
| Scanner works with custom config          | `tests/unit/scanner/scanner-di.test.ts::line 221-277`   |
| Scanner path helpers use config           | `tests/unit/scanner/scanner-di.test.ts::line 279-318`   |
| No hardcoded paths in scanner             | `tests/unit/scanner/scanner-no-hardcoded-paths.test.ts` |

## Acceptance Criteria Met

- [x] Scanner constructor accepts `config: SpxConfig` parameter
- [x] All references to `"specs"` replaced with `config.specs.root`
- [x] All references to `"work"` replaced with `config.specs.work.dir`
- [x] All references to status dirs replaced with `config.specs.work.statusDirs.*`
- [x] Scanner uses path.join with config values for path construction
- [x] Level 1 tests verify scanner uses injected config correctly
- [x] Meta-test verifies no hardcoded paths remain in scanner source files

## Verification Command

```bash
npm test -- tests/unit/scanner/scanner-di.test.ts tests/unit/scanner/scanner-no-hardcoded-paths.test.ts
```

Expected output: 11/11 tests passing
