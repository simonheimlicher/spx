# Completion Evidence: no-hardcoded-statuses

## Review Summary

**Verdict**: APPROVED
**Date**: 2026-01-27
**Reviewer**: reviewing-typescript

## Verification Results

| Tool   | Status | Details          |
| ------ | ------ | ---------------- |
| tsc    | PASS   | 0 errors         |
| eslint | PASS   | 0 violations     |
| vitest | PASS   | 24/24 tests pass |

## Graduated Tests

| Requirement                           | Test Location                                           |
| ------------------------------------- | ------------------------------------------------------- |
| FR1: Export WORK_ITEM_STATUSES        | `tests/unit/eslint-rules/no-hardcoded-statuses.test.ts` |
| FR2: Detect hardcoded status literals | `tests/unit/eslint-rules/no-hardcoded-statuses.test.ts` |
| FR3: Allow test descriptions          | `tests/unit/eslint-rules/no-hardcoded-statuses.test.ts` |
| FR4: Allow type definitions           | `tests/unit/eslint-rules/no-hardcoded-statuses.test.ts` |

## Implementation Summary

Created ESLint rule `spx/no-hardcoded-statuses` that:

- Detects hardcoded "OPEN", "IN_PROGRESS", "DONE" strings in test assertions
- Uses exact match only ("DONE.md" does NOT trigger)
- Whitelists test descriptions (describe/it/test first arguments)
- Whitelists type definitions and non-test files
- Reports actionable error messages with constant name to use

Added `WORK_ITEM_STATUSES` constant to `src/types.ts`.

## Files Created/Modified

- `eslint-rules/no-hardcoded-statuses.ts` - Rule implementation
- `eslint-rules/index.ts` - Export rule in plugin
- `src/types.ts` - Added WORK_ITEM_STATUSES constant

## Verification Command

```bash
pnpm test tests/unit/eslint-rules/no-hardcoded-statuses.test.ts
```
