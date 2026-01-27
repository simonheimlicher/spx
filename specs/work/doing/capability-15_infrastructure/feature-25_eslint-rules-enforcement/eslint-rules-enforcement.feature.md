# Feature: ESLint Rules Enforcement

## Observable Outcome

Custom ESLint rules automatically detect hardcoded domain values (work item kinds, statuses) in test files, enforcing ADR-21's mandate to use constants instead of magic strings. Violations are caught during `pnpm run lint` before code reaches the repository.

## Context

The codebase has 387+ hardcoded string violations:

- 239 instances of `"story"`, `"feature"`, `"capability"` in tests
- 148 instances of `"OPEN"`, `"IN_PROGRESS"`, `"DONE"` in tests

These should use constants from `src/types.ts`:

- `WORK_ITEM_KINDS`: `["capability", "feature", "story"]`
- `WorkItemStatus` type (to be exported as constant array)

## Testing Strategy

> Features require **Level 1 + Level 2** to prove the feature works with real tools.
> See [testing standards](/docs/testing/standards.md) for level definitions.

### Level Assignment

| Component            | Level | Justification                                          |
| -------------------- | ----- | ------------------------------------------------------ |
| Rule detection logic | 1     | Pure AST traversal, can verify with ESLint RuleTester  |
| ESLint integration   | 2     | Needs real ESLint to verify rule loading and reporting |

### Escalation Rationale

- **1 → 2**: Unit tests prove AST detection logic, but Level 2 verifies ESLint properly loads and reports rule violations on real files

## Feature Integration Tests (Level 2)

These tests verify that **real ESLint loads and executes custom rules** as expected.

### FI1: Rule loading integration test

```typescript
// tests/integration/eslint-rules.integration.test.ts
import { ESLint } from "eslint";
import config from "../../eslint.config";

describe("Feature: ESLint Rules Enforcement", () => {
  it("GIVEN eslint config WHEN linting test file with hardcoded kinds THEN reports violations", async () => {
    // Given: Real ESLint instance with our config
    const eslint = new ESLint({ overrideConfig: config });

    // When: Lint a test file with hardcoded strings
    const results = await eslint.lintText(
      `expect(item.kind).toBe("story");`,
      { filePath: "test.test.ts" },
    );

    // Then: Rule violation reported
    expect(results[0].messages).toContainEqual(
      expect.objectContaining({
        ruleId: "spx/no-hardcoded-work-item-kinds",
      }),
    );
  });
});
```

### FI2: Rule whitelisting integration test

```typescript
describe("Feature: ESLint Rules Enforcement - Whitelisting", () => {
  it("GIVEN test description WHEN containing kind string THEN no violation", async () => {
    const eslint = new ESLint({ overrideConfig: config });
    const results = await eslint.lintText(
      `describe("story parsing", () => {});`,
      { filePath: "test.test.ts" },
    );
    expect(results[0].errorCount).toBe(0);
  });
});
```

## Capability Contribution

This feature enforces infrastructure-level code quality by preventing ADR-21 violations at lint time. It integrates with the existing `pnpm run validate` pipeline and the `spx` ESLint plugin namespace established in `eslint-rules/index.ts`.

## Completion Criteria

- [ ] All Level 1 tests pass (via story completion)
- [ ] All Level 2 integration tests pass
- [ ] Rules integrated into `eslint.config.ts`
- [ ] Running `pnpm run lint` catches hardcoded domain strings
