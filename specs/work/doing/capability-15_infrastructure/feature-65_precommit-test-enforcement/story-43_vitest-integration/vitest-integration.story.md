# Story: Vitest Integration

## Functional Requirements

### FR1: Pre-commit script orchestrates test execution

```gherkin
GIVEN staged files that include test-relevant changes
WHEN the pre-commit hook runs
THEN vitest is invoked with the correct arguments
AND exit code reflects test success/failure
```

#### Files created/modified

1. `src/precommit/run.ts` [new]: Orchestration script for pre-commit hook (invoked via tsx)

### FR2: Skip tests when no relevant files changed

```gherkin
GIVEN staged files that are all non-test-relevant (e.g., README.md)
WHEN the pre-commit hook runs
THEN no tests are executed
AND commit proceeds immediately
```

#### Files created/modified

1. `src/precommit/run.ts` [modify]: Add early exit for no relevant files

### FR3: Provide clear output on test failure

```gherkin
GIVEN staged files with a failing test
WHEN the pre-commit hook runs
THEN error output clearly shows which test failed
AND exit code is non-zero
```

#### Files created/modified

1. `src/precommit/run.ts` [modify]: Pass through vitest output

## Testing Strategy

> Stories require **Level 1** to prove core logic works.
> See [testing standards](/docs/testing/standards.md) for level definitions.

### Level Assignment

| Component                   | Level | Justification                                  |
| --------------------------- | ----- | ---------------------------------------------- |
| `shouldRunTests()`          | 1     | Pure function, checks if any relevant files    |
| `runPrecommitTests()` logic | 1     | Orchestration logic with injectable subprocess |

### When to Escalate

This story stays at Level 1 because:

- Subprocess execution is abstracted behind an injectable interface
- Actual vitest execution is tested at feature integration level

## Unit Tests (Level 1)

```typescript
// tests/unit/precommit/run.test.ts
import { runPrecommitTests, shouldRunTests } from "@/precommit/run";
import { describe, expect, it, vi } from "vitest";

describe("shouldRunTests", () => {
  it("GIVEN test files in list WHEN checking THEN returns true", () => {
    const files = ["tests/unit/foo.test.ts"];
    expect(shouldRunTests(files)).toBe(true);
  });

  it("GIVEN source files in list WHEN checking THEN returns true", () => {
    const files = ["src/validation/runner.ts"];
    expect(shouldRunTests(files)).toBe(true);
  });

  it("GIVEN only non-relevant files WHEN checking THEN returns false", () => {
    const files = ["README.md", "package.json"];
    expect(shouldRunTests(files)).toBe(false);
  });

  it("GIVEN empty list WHEN checking THEN returns false", () => {
    expect(shouldRunTests([])).toBe(false);
  });
});

describe("runPrecommitTests", () => {
  it("GIVEN no relevant files WHEN running THEN skips with success", async () => {
    const deps = {
      getStagedFiles: vi.fn().mockResolvedValue(["README.md"]),
      runVitest: vi.fn(),
    };

    const result = await runPrecommitTests(deps);

    expect(result.skipped).toBe(true);
    expect(result.exitCode).toBe(0);
    expect(deps.runVitest).not.toHaveBeenCalled();
  });

  it("GIVEN relevant files WHEN tests pass THEN returns success", async () => {
    const deps = {
      getStagedFiles: vi.fn().mockResolvedValue(["src/foo.ts"]),
      runVitest: vi.fn().mockResolvedValue({ exitCode: 0, output: "All tests passed" }),
    };

    const result = await runPrecommitTests(deps);

    expect(result.skipped).toBe(false);
    expect(result.exitCode).toBe(0);
    expect(deps.runVitest).toHaveBeenCalled();
  });

  it("GIVEN relevant files WHEN tests fail THEN returns failure", async () => {
    const deps = {
      getStagedFiles: vi.fn().mockResolvedValue(["tests/unit/foo.test.ts"]),
      runVitest: vi.fn().mockResolvedValue({ exitCode: 1, output: "1 test failed" }),
    };

    const result = await runPrecommitTests(deps);

    expect(result.skipped).toBe(false);
    expect(result.exitCode).toBe(1);
  });
});
```

## Architectural Requirements

### Relevant ADRs

1. [Lefthook Test Enforcement](../../decisions/adr-21_lefthook-test-enforcement.md) - Pre-commit hook design

## Quality Requirements

### QR1: Type Safety

**Requirement:** All functions must have TypeScript type annotations
**Target:** 100% type coverage
**Validation:** `pnpm run typecheck` passes with no errors

### QR2: Dependency Injection

**Requirement:** Subprocess execution must be injectable
**Target:** Unit tests use injected mocks for subprocess calls
**Validation:** No `vi.mock()` at module level

### QR3: Clear Error Messages

**Requirement:** Test failures must show clear output
**Target:** Vitest output passed through to user
**Validation:** Manual verification during feature integration

## Completion Criteria

- [ ] All Level 1 unit tests pass
- [ ] `shouldRunTests()` correctly determines if tests needed
- [ ] `runPrecommitTests()` orchestrates the full workflow
- [ ] Lefthook invokes `tsx src/precommit/run.ts` directly (no JS shim)
- [ ] Subprocess execution uses dependency injection
- [ ] Exit codes correctly propagate
