# Story Complete: Lefthook Configuration

## Summary

Implemented lefthook pre-commit hook configuration for running tests on modified files before commits.

## Changes Made

### Files Created

1. **`lefthook.yml`** - Lefthook configuration at project root
   - Pre-commit hook that runs vitest with `--related` flag on staged TypeScript/JavaScript files
   - Skips test execution if no relevant files are staged

2. **`src/precommit/build-args.ts`** - Pure function to build vitest CLI arguments
   - `buildVitestArgs(files: string[])` - Constructs vitest arguments based on file types
   - `isTestFile(filePath: string)` - Checks if a file is a test file
   - Constants: `VITEST_ARGS`, `FILE_PATTERNS` for DRY pattern compliance

### Files Modified

1. **`package.json`**
   - Changed `"prepare"` script from `"husky"` to `"lefthook install"`
   - Added `"lefthook": "^1.10.10"` to devDependencies

## Test Coverage

### Unit Tests (Level 1)

All tests pass (18 total):

- `isTestFile` - 6 tests verifying test file detection
- `buildVitestArgs` constants verification - 2 tests
- `buildVitestArgs` empty input - 1 test
- `buildVitestArgs` test files only - 2 tests
- `buildVitestArgs` source files only - 2 tests
- `buildVitestArgs` mixed files - 2 tests
- `buildVitestArgs` argument order - 3 tests

### Tests Location

- Progress tests: `specs/work/doing/capability-15_infrastructure/feature-65_precommit-test-enforcement/story-32_lefthook-config/tests/build-args.test.ts`
- Graduation target: `tests/unit/precommit/build-args.test.ts`

## Completion Criteria Checklist

- [x] All Level 1 unit tests pass
- [x] `lefthook.yml` exists with pre-commit configuration
- [x] `package.json` has `prepare` script for auto-install
- [x] `buildVitestArgs()` correctly constructs CLI arguments
- [x] Lefthook installs automatically on `pnpm install`

## ADR Compliance

Implementation follows [ADR-021: Lefthook Pre-Commit Test Enforcement](../../decisions/adr-21_lefthook-test-enforcement.md):

- Pre-commit hook runs affected tests before allowing commit
- Uses `vitest --related` for selective execution
- Hook exits non-zero if tests fail

## Notes

- The `husky` package is still in devDependencies but is no longer used. Consider removing in a future cleanup story.
- Feature-level integration tests (Level 2) will verify the complete hook workflow in story-43.
