# Execution Plan: Testable Validation (Feature-21)

## Overview

This plan uses the `typescript:coding-typescript` and `typescript:reviewing-typescript` skills to refactor the validation script according to ADR-001. The workflow follows TDD principles with strict zero-tolerance review.

## Prerequisites

- ADR-001 reviewed and approved ✅
- Stories created (21, 32, 43) ✅
- Project validation passing ✅

## Execution Workflow

Each story follows this cycle:

```
┌─────────────────────────────────────────────────────┐
│ 1. coding-typescript (implements story)             │
│    ├─ Reads story acceptance criteria               │
│    ├─ Implements code changes                       │
│    ├─ Writes progress tests in specs/.../tests/     │
│    └─ Auto-invokes reviewer when done               │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│ 2. reviewing-typescript (zero-tolerance review)     │
│    ├─ Runs npm run typecheck                        │
│    ├─ Runs npm run lint                             │
│    ├─ Runs all tests (must pass 100%)               │
│    ├─ Checks coverage requirements                  │
│    ├─ Manual code review checklist                  │
│    └─ Decision: APPROVED / REJECTED / CONDITIONAL   │
└──────────────────┬──────────────────────────────────┘
                   │
                   ├─ APPROVED ──────────────────────┐
                   │                                  │
                   │                                  ▼
                   │                ┌─────────────────────────────────┐
                   │                │ - Graduates tests to tests/     │
                   │                │ - Creates DONE.md               │
                   │                │ - Commits changes               │
                   │                └─────────────────────────────────┘
                   │
                   └─ REJECTED ──> Coder fixes and resubmits
```

## Story Execution Order

### Story 21: Configure TypeScript Checking ⬅️ **START HERE**

**Invoke:**

```bash
/typescript:coding-typescript story-21_configure-typechecking
```

**What the coder will do:**

1. Add `"scripts/**/*"` to tsconfig.json include array
2. Run typecheck, identify and fix type errors
3. Remove `any` types from logging functions
4. Write progress tests verifying type checking works

**What the reviewer will check:**

- npm run typecheck exits 0
- No `any` types without justification
- validate.ts type-checks correctly

**Expected outcome:** APPROVED → tests graduate → DONE.md created → commit

**Blocker conditions:** If tsconfig change breaks existing code, reviewer REJECTS

---

### Story 32: Extract Pure Functions

**Invoke:**

```bash
/typescript:coding-typescript story-32_extract-pure-functions
```

**What the coder will do:**

1. Define ProcessRunner and ValidationContext interfaces
2. Extract buildEslintArgs(), buildTypeScriptArgs(), etc. as pure functions
3. Refactor validation steps to accept injectable dependencies
4. Eliminate global mutable state
5. Export internal functions with @internal JSDoc
6. Write progress tests for pure functions

**What the reviewer will check:**

- No module-level mutable variables remain
- All validation functions accept dependency injection
- Functions are properly exported
- Tests cover pure function logic
- No mocking used (DI only)

**Expected outcome:** APPROVED → tests graduate → DONE.md created → commit

**Blocker conditions:** If refactor breaks validation behavior, reviewer REJECTS

---

### Story 43: Write Comprehensive Test Suite

**Invoke:**

```bash
/typescript:coding-typescript story-43_write-test-suite
```

**What the coder will do:**

1. Create test fixtures (with-type-errors, with-lint-errors, etc.)
2. Write Level 1 unit tests for all pure functions
3. Write Level 2 integration tests using real tools + fixtures
4. Iterate until coverage ≥80%

**What the reviewer will check:**

- npm run test:coverage shows ≥80% for scripts/run/validate.ts
- All tests pass (0 failures)
- No mocking used (grep confirms no vi.mock/jest.mock)
- Tests use dependency injection with controlled implementations
- Fixtures are minimal and focused

**Expected outcome:** APPROVED → tests graduate → DONE.md created → commit

**Blocker conditions:**

- Coverage <80% → REJECTED
- Any test failures → REJECTED
- Mocking detected → REJECTED

---

## After All Stories Complete

Feature-21 will be DONE when:

- [ ] All 3 stories have DONE.md
- [ ] All tests graduated to tests/unit/ and tests/integration/
- [ ] Coverage ≥80% for scripts/run/validate.ts
- [ ] All commits pushed to remote

Then create `specs/.../feature-21/tests/DONE.md` summarizing the feature completion.

## Notes

- **Autonomous loop**: coding-typescript automatically invokes reviewer, handles remediation
- **Zero tolerance**: Reviewer REJECTS on any test failure, type error, or <80% coverage
- **No mocking**: Reviewer enforces dependency injection only, no vi.mock/jest.mock
- **Single file constraint**: All work stays in scripts/run/validate.ts (bootstrap requirement)

## Start Execution

To begin, run:

```bash
/typescript:coding-typescript story-21_configure-typechecking
```

The coder will read the story, implement changes, write tests, and automatically invoke the reviewer.
