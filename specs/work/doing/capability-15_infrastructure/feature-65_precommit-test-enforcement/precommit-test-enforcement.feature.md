# Feature: Pre-Commit Test Enforcement

## Observable Outcome

Every commit is automatically validated by running affected tests before the commit completes:

- **Selective execution**: Only tests related to modified files run (not full suite)
- **Fast feedback**: Typical pre-commit test runs complete in <3 seconds
- **Blocking gate**: Commits with failing tests are rejected with clear error output
- **Zero configuration**: Works out of the box after `pnpm install` via lefthook

### Technical Quality

- Lefthook configured via `lefthook.yml` in project root
- Vitest `--related` flag used for selective test execution
- Exit codes properly propagated to block failing commits
- Parallel execution where possible for speed

## Testing Strategy

> Features require **Level 1 + Level 2** to prove the feature works with real tools.
> See [testing standards](/docs/testing/standards.md) for level definitions.

### Level Assignment

| Component                   | Level | Justification                                    |
| --------------------------- | ----- | ------------------------------------------------ |
| `categorizeChangedFiles()`  | 1     | Pure function categorizing file paths            |
| `findRelatedTests()`        | 1     | Pure function mapping source files to tests      |
| `buildVitestArgs()`         | 1     | Pure function constructing CLI arguments         |
| Lefthook + Vitest execution | 2     | Needs real lefthook binary and Vitest runner     |
| Pre-commit hook integration | 2     | Needs real git hooks to verify blocking behavior |

### Escalation Rationale

- **1 → 2**: Unit tests verify file categorization and argument building, but Level 2 verifies lefthook actually invokes Vitest correctly and that the hook blocks commits when tests fail.

## Feature Integration Tests (Level 2)

These tests verify that **lefthook and Vitest work together** as expected using the **actual project configuration**.

### Test Harness: `withGitTestEnv`

**Location**: `tests/helpers/with-git-test-env.ts`

The harness creates an isolated git repository that **symlinks actual project files** rather than creating fake configurations. This ensures tests fail when the real project configuration breaks.

**Required symlinks**:

| File               | Purpose                                 |
| ------------------ | --------------------------------------- |
| `node_modules`     | Provides vitest, lefthook, tsx binaries |
| `package.json`     | Module resolution and scripts           |
| `vitest.config.ts` | Actual vitest configuration             |
| `tsconfig.json`    | TypeScript path resolution              |
| `lefthook.yml`     | Actual pre-commit hook config           |
| `src/precommit/`   | Precommit orchestration scripts         |

**Note**: We symlink `src/precommit/` specifically (not all of `src/`) so tests can create their own `src/` files without leaking to the real project.

**Harness provides**:

- `exec(command, options?)` - Run shell commands with proper quoting
- `writeFile(path, content)` - Create files in temp directory
- Auto-setup: git init, user config, lefthook install
- Auto-cleanup: removes temp directory after test

### FI1: Pre-commit blocking behavior

```typescript
// tests/integration/precommit/hook-enforcement.integration.test.ts
import { describe, expect, it } from "vitest";
import { withGitTestEnv } from "../../helpers/with-git-test-env.js";

describe("Feature: Pre-Commit Test Enforcement", () => {
  describe("FI1: Pre-commit blocking behavior", () => {
    it("GIVEN staged changes with failing test WHEN committing THEN commit is blocked", async () => {
      await withGitTestEnv(async ({ exec, writeFile }) => {
        // Given: Source file and failing test
        await writeFile(
          "src/math.ts",
          `export function add(a: number, b: number): number {
  return a + b;
}
`,
        );
        await writeFile(
          "tests/math.test.ts",
          `import { expect, it } from "vitest";
import { add } from "../src/math.js";

it("intentionally fails to test pre-commit blocking", () => {
  expect(add(1, 1)).toBe(999); // Wrong expectation
});
`,
        );

        // Stage files
        await exec("git add .");

        // When: Attempt to commit
        const result = await exec("git commit -m 'test commit'", { reject: false });

        // Then: Commit is blocked (non-zero exit code)
        expect(result.exitCode).not.toBe(0);
      });
    });

    it("GIVEN staged changes with passing test WHEN committing THEN commit succeeds", async () => {
      await withGitTestEnv(async ({ exec, writeFile }) => {
        // Given: Source file and passing test
        await writeFile(
          "src/math.ts",
          `export function add(a: number, b: number): number {
  return a + b;
}
`,
        );
        await writeFile(
          "tests/math.test.ts",
          `import { expect, it } from "vitest";
import { add } from "../src/math.js";

it("correctly tests addition", () => {
  expect(add(1, 1)).toBe(2);
});
`,
        );

        // Stage files
        await exec("git add .");

        // When: Commit
        const result = await exec("git commit -m 'test commit'", { reject: false });

        // Then: Commit succeeds
        expect(result.exitCode).toBe(0);
      });
    });
  });
});
```

### FI2: Selective test execution

```typescript
describe("FI2: Selective test execution", () => {
  it("GIVEN only non-test files staged WHEN committing THEN commit succeeds without running tests", async () => {
    await withGitTestEnv(async ({ exec, writeFile }) => {
      // Given: Only a README file (no ts files that would trigger tests)
      await writeFile("README.md", "# Test Project\n\nThis is a test.\n");

      // Stage only README
      await exec("git add README.md");

      // When: Commit
      const result = await exec("git commit -m 'docs: add readme'", { reject: false });

      // Then: Commit succeeds (no tests triggered by non-ts file)
      expect(result.exitCode).toBe(0);
    });
  });
});
```

## Capability Contribution

This feature directly supports the **Infrastructure capability's** goal of ensuring code quality before commit:

- Complements [ADR-021: Isolated Test Fixtures](../feature-21_testable-validation/decisions/adr-021_isolated-test-fixtures.md) by ensuring tests run in isolation
- Extends validation infrastructure beyond `spx validation` to include test execution
- Provides fast feedback loop that reduces CI failures

## Completion Criteria

- [ ] All Level 1 tests pass (via story completion)
- [ ] All Level 2 integration tests pass
- [ ] `lefthook.yml` configured with pre-commit hook
- [ ] `pnpm install` automatically sets up lefthook
- [ ] Commits with failing tests are blocked
- [ ] Only affected tests run (verified by timing)
- [ ] Clear error messages when tests fail

## Stories

Stories will be added as implementation progresses. Expected decomposition:

- **Story-21**: File categorization utilities - Pure functions to categorize changed files
- **Story-32**: Lefthook configuration - Configure `lefthook.yml` with test command
- **Story-43**: Vitest related integration - Wire up `--related` flag for selective execution
