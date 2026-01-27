# Completion Evidence: no-hardcoded-work-item-kinds

## Review Summary

**Verdict**: APPROVED
**Date**: 2026-01-27
**Reviewer**: reviewing-typescript

## Verification Results

| Tool   | Status | Details          |
| ------ | ------ | ---------------- |
| tsc    | PASS   | 0 errors         |
| eslint | PASS   | 0 violations     |
| vitest | PASS   | 23/23 tests pass |

## Graduated Tests

| Requirement                         | Test Location                                                  |
| ----------------------------------- | -------------------------------------------------------------- |
| FR1: Detect hardcoded kind literals | `tests/unit/eslint-rules/no-hardcoded-work-item-kinds.test.ts` |
| FR2: Allow test descriptions        | `tests/unit/eslint-rules/no-hardcoded-work-item-kinds.test.ts` |
| FR3: Allow type definitions         | `tests/unit/eslint-rules/no-hardcoded-work-item-kinds.test.ts` |

## Implementation Summary

Created ESLint rule `spx/no-hardcoded-work-item-kinds` that:

- Detects hardcoded "capability", "feature", "story" strings in test assertions
- Whitelists test descriptions (describe/it/test first arguments)
- Whitelists type definitions and non-test files
- Reports actionable error messages with constant name to use

## Files Created/Modified

- `eslint-rules/no-hardcoded-work-item-kinds.ts` - Rule implementation
- `eslint-rules/index.ts` - Export rule in plugin

## Verification Command

```bash
pnpm test tests/unit/eslint-rules/no-hardcoded-work-item-kinds.test.ts
```
