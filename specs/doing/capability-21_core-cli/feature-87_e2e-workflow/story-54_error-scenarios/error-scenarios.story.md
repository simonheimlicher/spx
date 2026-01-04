# Story: Error Scenarios

## Functional Requirements

### FR1: Verify error handling end-to-end

```gherkin
GIVEN various error scenarios
WHEN running spx CLI
THEN handle errors gracefully with helpful messages
```

Error scenarios:
- Missing specs/ directory
- Permission denied on specs/
- Invalid work item patterns
- Corrupted DONE.md files

#### Files created/modified

1. `test/e2e/errors.e2e.test.ts` [new]: Implement error scenario tests
2. `test/fixtures/repos/error-cases/` [new]: Create error scenario fixtures

### FR2: Verify exit codes

```gherkin
GIVEN error conditions
WHEN running spx
THEN exit with appropriate non-zero exit code
```

#### Files created/modified

1. `test/e2e/errors.e2e.test.ts` [modify]: Verify exit codes

## Testing Strategy

### Level Assignment

| Component         | Level | Justification                   |
| ----------------- | ----- | ------------------------------- |
| Error handling    | 3     | E2E with complete error flow    |
| Exit codes        | 3     | Real process exit verification  |
| Error messages    | 3     | Real stderr output              |

### When to Escalate

This story uses Level 3 because:

- Must verify complete error handling workflow
- Tests real process exit codes
- Verifies user-facing error messages

## E2E Tests (Level 3)

```typescript
// test/e2e/errors.e2e.test.ts
import { describe, it, expect } from "vitest";
import { execa } from "execa";

describe("E2E: Error Scenarios", () => {
  it("GIVEN directory without specs/ WHEN running status THEN shows clear error", async () => {
    const { exitCode, stderr } = await execa("node", ["bin/spx.js", "status"], {
      cwd: "test/fixtures/repos/no-specs",
      reject: false,
    });

    expect(exitCode).toBe(1);
    expect(stderr).toMatch(/specs.*not found|No specs directory/i);
  });

  it("GIVEN directory with permission error WHEN running status THEN shows error with path", async () => {
    const { exitCode, stderr } = await execa("node", ["bin/spx.js", "status"], {
      cwd: "test/fixtures/repos/restricted",
      reject: false,
    });

    expect(exitCode).toBe(1);
    expect(stderr).toMatch(/permission|EACCES/i);
    expect(stderr).toContain("specs/");
  });

  it("GIVEN invalid command WHEN running spx THEN shows help", async () => {
    const { exitCode, stderr } = await execa("node", ["bin/spx.js", "invalidcommand"], {
      reject: false,
    });

    expect(exitCode).toBe(1);
    expect(stderr).toMatch(/Unknown command|Usage:/i);
  });

  it("GIVEN --help flag WHEN running spx THEN shows help and exits 0", async () => {
    const { exitCode, stdout } = await execa("node", ["bin/spx.js", "--help"]);

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Usage:");
    expect(stdout).toContain("status");
  });

  it("GIVEN invalid format option WHEN running status THEN shows error", async () => {
    const { exitCode, stderr } = await execa("node", ["bin/spx.js", "status", "--format", "invalid"], {
      cwd: "test/fixtures/repos/simple",
      reject: false,
    });

    expect(exitCode).toBe(1);
    expect(stderr).toMatch(/Invalid format|must be one of/i);
  });

  it("GIVEN empty specs directory WHEN running status THEN shows no work items message", async () => {
    const { exitCode, stdout } = await execa("node", ["bin/spx.js", "status"], {
      cwd: "test/fixtures/repos/empty-specs",
    });

    expect(exitCode).toBe(0);
    expect(stdout).toMatch(/No work items found|empty/i);
  });
});
```

## Architectural Requirements

### Relevant ADRs

1. `context/4-testing-standards.md` - E2E error testing

## Quality Requirements

### QR1: Helpful Error Messages

**Requirement:** Errors explain what went wrong and how to fix it
**Target:** Include path, reason, and suggestion
**Validation:** E2E tests verify error message quality

### QR2: Correct Exit Codes

**Requirement:** Non-zero exit for errors, zero for success
**Target:** Follows Unix conventions (0 = success, 1 = error)
**Validation:** E2E tests verify exit codes

### QR3: No Stack Traces in Production

**Requirement:** User-facing errors don't show stack traces
**Target:** Clean error messages, stack traces only in debug mode
**Validation:** E2E tests verify clean error output

## Completion Criteria

- [ ] All Level 3 E2E tests pass
- [ ] All error scenarios handled gracefully
- [ ] Exit codes correct
- [ ] Error messages helpful and clear
- [ ] No uncaught exceptions

## Documentation

1. Error handling behavior documented
2. Exit codes listed in CLI help
3. Common error scenarios with solutions

## Notes

This story completes Feature 87 and marks **Capability-21 as DONE** when all E2E tests pass.
