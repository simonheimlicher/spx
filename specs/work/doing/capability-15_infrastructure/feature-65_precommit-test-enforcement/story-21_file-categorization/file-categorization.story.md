# Story: File Categorization

## Functional Requirements

### FR1: Categorize changed files by type

```gherkin
GIVEN a list of changed file paths
WHEN categorizing the files
THEN each file is classified as: test, source, or other
```

#### Files created/modified

1. `src/precommit/categorize.ts` [new]: Pure functions for file categorization

### FR2: Map source files to test files

```gherkin
GIVEN a source file path like "src/validation/runner.ts"
WHEN finding related test files
THEN return paths like "tests/unit/validation/runner.test.ts" and "tests/integration/validation/runner.integration.test.ts"
```

#### Files created/modified

1. `src/precommit/categorize.ts` [modify]: Add `findRelatedTestPaths()` function

### FR3: Filter to test-relevant files only

```gherkin
GIVEN a mixed list of changed files
WHEN filtering for test-relevant files
THEN return only test files and source files that have corresponding tests
AND exclude files like README.md, package.json, etc.
```

#### Files created/modified

1. `src/precommit/categorize.ts` [modify]: Add `filterTestRelevantFiles()` function

## Testing Strategy

> Stories require **Level 1** to prove core logic works.
> See [testing standards](/docs/testing/standards.md) for level definitions.

### Level Assignment

| Component                   | Level | Justification                              |
| --------------------------- | ----- | ------------------------------------------ |
| `categorizeFile()`          | 1     | Pure function, pattern matching on strings |
| `findRelatedTestPaths()`    | 1     | Pure function, string manipulation         |
| `filterTestRelevantFiles()` | 1     | Pure function, filtering logic             |

### When to Escalate

This story stays at Level 1 because:

- All functions are pure string manipulation
- No filesystem access needed (paths are just strings)
- No external tool execution

## Unit Tests (Level 1)

```typescript
// tests/unit/precommit/categorize.test.ts
import { categorizeFile, filterTestRelevantFiles, findRelatedTestPaths } from "@/precommit/categorize";
import { describe, expect, it } from "vitest";

describe("categorizeFile", () => {
  it("GIVEN test file path WHEN categorizing THEN returns 'test'", () => {
    expect(categorizeFile("tests/unit/foo.test.ts")).toBe("test");
    expect(categorizeFile("tests/integration/bar.integration.test.ts")).toBe("test");
    expect(categorizeFile("specs/work/doing/cap-1/tests/baz.test.ts")).toBe("test");
  });

  it("GIVEN source file path WHEN categorizing THEN returns 'source'", () => {
    expect(categorizeFile("src/validation/runner.ts")).toBe("source");
    expect(categorizeFile("src/cli/commands/build.ts")).toBe("source");
  });

  it("GIVEN other file path WHEN categorizing THEN returns 'other'", () => {
    expect(categorizeFile("README.md")).toBe("other");
    expect(categorizeFile("package.json")).toBe("other");
    expect(categorizeFile(".gitignore")).toBe("other");
  });
});

describe("findRelatedTestPaths", () => {
  it("GIVEN source path WHEN finding tests THEN returns potential test paths", () => {
    const paths = findRelatedTestPaths("src/validation/runner.ts");

    expect(paths).toContain("tests/unit/validation/runner.test.ts");
    expect(paths).toContain("tests/integration/validation/runner.integration.test.ts");
  });
});

describe("filterTestRelevantFiles", () => {
  it("GIVEN mixed files WHEN filtering THEN returns only test-relevant", () => {
    const files = [
      "src/foo.ts",
      "tests/unit/foo.test.ts",
      "README.md",
      "package.json",
    ];

    const relevant = filterTestRelevantFiles(files);

    expect(relevant).toContain("src/foo.ts");
    expect(relevant).toContain("tests/unit/foo.test.ts");
    expect(relevant).not.toContain("README.md");
    expect(relevant).not.toContain("package.json");
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

### QR2: Pure Functions

**Requirement:** All categorization functions must be pure (no side effects)
**Target:** No filesystem access, no external calls
**Validation:** Unit tests run without any mocking

## Completion Criteria

- [ ] All Level 1 unit tests pass
- [ ] `categorizeFile()` correctly identifies test/source/other
- [ ] `findRelatedTestPaths()` generates correct test path patterns
- [ ] `filterTestRelevantFiles()` removes non-test-relevant files
- [ ] All functions are pure and type-safe
