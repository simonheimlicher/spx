# Story: Lefthook Configuration

## Functional Requirements

### FR1: Configure lefthook for pre-commit hook

```gherkin
GIVEN the project uses pnpm and vitest
WHEN lefthook.yml is created
THEN pre-commit hook runs vitest on related files via tsx
```

#### Files created/modified

1. `lefthook.yml` [new]: Lefthook configuration at project root (uses `npx tsx` to run TypeScript directly)

### FR2: Auto-install on pnpm install

```gherkin
GIVEN a fresh clone of the repository
WHEN running pnpm install
THEN lefthook hooks are automatically installed
```

#### Files created/modified

1. `package.json` [modify]: Add `prepare` script for lefthook install

### FR3: Build vitest arguments from staged files

```gherkin
GIVEN a list of staged file paths
WHEN building vitest arguments
THEN return arguments for running related tests only
```

#### Files created/modified

1. `src/precommit/build-args.ts` [new]: Pure function to build vitest CLI arguments

## Testing Strategy

> Stories require **Level 1** to prove core logic works.
> See [testing standards](/docs/testing/standards.md) for level definitions.

### Level Assignment

| Component           | Level | Justification                          |
| ------------------- | ----- | -------------------------------------- |
| `buildVitestArgs()` | 1     | Pure function constructing CLI args    |
| `lefthook.yml`      | N/A   | Configuration file, validated manually |

### When to Escalate

This story stays at Level 1 because:

- `buildVitestArgs()` is a pure function that builds argument arrays
- Configuration file validation happens at feature-level integration tests

## Unit Tests (Level 1)

```typescript
// tests/unit/precommit/build-args.test.ts
import { buildVitestArgs } from "@/precommit/build-args";
import { describe, expect, it } from "vitest";

describe("buildVitestArgs", () => {
  it("GIVEN test files WHEN building args THEN includes --run and file paths", () => {
    const files = ["tests/unit/foo.test.ts", "tests/unit/bar.test.ts"];

    const args = buildVitestArgs(files);

    expect(args).toContain("--run");
    expect(args).toContain("tests/unit/foo.test.ts");
    expect(args).toContain("tests/unit/bar.test.ts");
  });

  it("GIVEN source files WHEN building args THEN uses --related flag", () => {
    const files = ["src/validation/runner.ts"];

    const args = buildVitestArgs(files);

    expect(args).toContain("--related");
    expect(args).toContain("src/validation/runner.ts");
  });

  it("GIVEN empty files WHEN building args THEN returns empty array", () => {
    const args = buildVitestArgs([]);

    expect(args).toEqual([]);
  });

  it("GIVEN mixed files WHEN building args THEN combines appropriately", () => {
    const files = [
      "src/foo.ts",
      "tests/unit/bar.test.ts",
    ];

    const args = buildVitestArgs(files);

    expect(args).toContain("--run");
    expect(args).toContain("--related");
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

### QR2: Configuration Validity

**Requirement:** `lefthook.yml` must be valid YAML and work with lefthook
**Target:** `lefthook run pre-commit` executes without config errors
**Validation:** Feature-level integration tests

## Completion Criteria

- [ ] All Level 1 unit tests pass
- [ ] `lefthook.yml` exists with pre-commit configuration using `npx tsx`
- [ ] `package.json` has `prepare` script for auto-install
- [ ] `buildVitestArgs()` correctly constructs CLI arguments
- [ ] Lefthook installs automatically on `pnpm install`
