# ADR 021: Isolated Test Fixtures for Validation Testing

## Status

Accepted

## Context

Integration tests for validation commands need to verify behavior against projects with known errors (type errors, lint errors, circular dependencies). A test was discovered that created test files directly in the live repository (`scripts/test-type-error.ts`) rather than using isolated fixtures.

**Problems with testing on the live repository:**

1. **Test pollution** - Artifacts left behind break other tests and validation
2. **Non-hermetic tests** - Results depend on project state, not controlled conditions
3. **Race conditions** - Parallel test runs can conflict
4. **Cleanup failures** - If assertions fail before cleanup, artifacts persist indefinitely

**Existing infrastructure:**

The project has established test harness patterns (ADR-003, ADR-004):

- `withTestEnv()` - Context manager for isolated temp directories with automatic cleanup
- `tests/fixtures/projects/` - Static fixture projects for specific scenarios
- `generateFixtureTree()` / `materializeFixture()` - Dynamic fixture generation

## Decision

**All validation integration tests MUST use isolated test environments. Tests MUST NEVER create, modify, or delete files in the live repository.**

### Implementation Approaches

**1. Static fixtures (preferred for stable scenarios):**

Use `tests/fixtures/projects/` for scenarios that don't change:

```typescript
const FIXTURE_PATH = join(__dirname, "../../fixtures/projects/with-type-errors");

it("GIVEN project with type errors WHEN validating THEN fails", async () => {
  const result = await execa("pnpm", ["run", "typecheck"], {
    cwd: FIXTURE_PATH,
    reject: false,
  });
  expect(result.exitCode).not.toBe(0);
});
```

**2. Dynamic fixtures with `withTestEnv()` (for generated scenarios):**

Use `withTestEnv()` when tests need unique or parameterized fixtures:

```typescript
import { withTestEnv } from "@tests/helpers/with-test-env";

it("GIVEN dynamically created type error WHEN validating THEN catches it", async () => {
  await withTestEnv(async ({ path }) => {
    // Create minimal TypeScript project
    await writeFile(
      join(path, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: { strict: true },
      }),
    );
    await writeFile(join(path, "src/error.ts"), "const x: number = 'string';");

    const result = await execa("pnpm", ["exec", "tsc", "--noEmit"], {
      cwd: path,
      reject: false,
    });

    expect(result.exitCode).not.toBe(0);
  });
});
```

### Fixture Project Structure

Static fixture projects in `tests/fixtures/projects/` must be self-contained:

```
tests/fixtures/projects/with-type-errors/
├── tsconfig.json          # Isolated config (not extending project root)
├── package.json           # Optional - only if needed
└── src/
    └── has-type-error.ts  # Known error for testing
```

**Critical:** Fixture `tsconfig.json` must NOT extend the root project's config. Each fixture is an independent TypeScript project.

## Consequences

### Positive

- **Hermetic tests** - Results depend only on fixture content, not project state
- **Parallel safety** - Each test gets its own isolated environment
- **Automatic cleanup** - `withTestEnv()` handles cleanup even on assertion failure
- **Clear separation** - Test artifacts never pollute the real codebase

### Negative

- **Slight overhead** - Creating temp directories adds ~5ms per test
- **Fixture maintenance** - Static fixtures must be maintained alongside production code

### Trade-offs Accepted

- Static fixtures duplicate some TypeScript config; this is intentional isolation
- Dynamic fixtures require more setup code; use static fixtures when possible

## Testing Strategy

### Level Assignments

| Component                   | Level           | Justification                                                 |
| --------------------------- | --------------- | ------------------------------------------------------------- |
| Static fixture validity     | 1 (Unit)        | Verify fixture files exist and have expected content          |
| `withTestEnv()` cleanup     | 1 (Unit)        | Test context manager behavior with controlled implementations |
| Validation against fixtures | 2 (Integration) | Need real tsc/eslint binaries to verify detection             |

### Escalation Rationale

- **1 → 2**: Level 1 can verify fixture structure exists, but cannot verify that TypeScript actually rejects the intentional errors. Level 2 runs real compilers against fixtures.

## Compliance

### How to Recognize Compliance

You're following this decision if:

- Tests use `tests/fixtures/projects/` OR `withTestEnv()` for all validation testing
- No test file paths point to `src/`, `scripts/`, or other live directories
- Fixture `tsconfig.json` files don't extend root config

### MUST

- Integration tests MUST use isolated environments (static fixtures or `withTestEnv()`)
- Dynamic fixtures MUST use `withTestEnv()` for automatic cleanup
- Static fixtures MUST have self-contained `tsconfig.json` (no `extends`)

### NEVER

- NEVER create files in the live repository from tests
- NEVER modify `src/`, `scripts/`, `specs/` from integration tests
- NEVER rely on cleanup code running after assertions (use `finally` blocks or `withTestEnv()`)

## References

- ADR-003: E2E Fixture Generation Strategy
- ADR-004: Test Environment Context Manager
- `tests/helpers/with-test-env.ts` - Context manager implementation
- `tests/fixtures/projects/` - Existing static fixtures
