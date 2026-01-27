# Story: No Hardcoded Statuses

## Functional Requirements

### FR1: Export WORK_ITEM_STATUSES constant

```gherkin
GIVEN the types.ts file defines WorkItemStatus type
WHEN importing from types.ts
THEN WORK_ITEM_STATUSES constant is available with all status values
```

#### Files created/modified

1. `src/types.ts` [modify]: Add WORK_ITEM_STATUSES constant array

### FR2: Detect hardcoded status literals in test assertions

```gherkin
GIVEN a test file containing expect(item.status).toBe("DONE")
WHEN ESLint processes the file
THEN the rule reports an error suggesting WORK_ITEM_STATUSES usage
```

#### Files created/modified

1. `eslint-rules/no-hardcoded-statuses.ts` [new]: Rule implementation
2. `eslint-rules/index.ts` [modify]: Export the new rule

### FR3: Allow status strings in test descriptions

```gherkin
GIVEN a test file containing describe("DONE status handling", () => {})
WHEN ESLint processes the file
THEN no error is reported (test descriptions are allowed contexts)
```

#### Files created/modified

1. `eslint-rules/no-hardcoded-statuses.ts` [modify]: Add whitelist for test description contexts

### FR4: Allow type definitions

```gherkin
GIVEN a file containing type WorkItemStatus = "OPEN" | "IN_PROGRESS" | "DONE"
WHEN ESLint processes the file
THEN no error is reported (type definitions are allowed contexts)
```

#### Files created/modified

1. `eslint-rules/no-hardcoded-statuses.ts` [modify]: Add whitelist for type definitions

## Testing Strategy

> Stories require **Level 1** to prove core logic works.
> See [testing standards](/docs/testing/standards.md) for level definitions.

### Level Assignment

| Component                          | Level | Justification                           |
| ---------------------------------- | ----- | --------------------------------------- |
| WORK_ITEM_STATUSES constant        | 1     | Pure constant definition                |
| AST detection of hardcoded strings | 1     | Pure function operating on AST nodes    |
| Whitelist context checking         | 1     | Pure function with AST parent traversal |

### When to Escalate

This story stays at Level 1 because:

- We're testing AST detection logic, not ESLint's integration
- ESLint RuleTester provides isolated rule testing without full ESLint setup
- Real ESLint integration is tested at the feature level (Level 2)

## Unit Tests (Level 1)

```typescript
// tests/unit/eslint-rules/no-hardcoded-statuses.test.ts
import { RuleTester } from "eslint";
import rule from "../../../eslint-rules/no-hardcoded-statuses";

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: "module" },
});

describe("no-hardcoded-statuses", () => {
  ruleTester.run("no-hardcoded-statuses", rule, {
    valid: [
      // Test descriptions are allowed
      { code: `describe("DONE status handling", () => {})`, filename: "test.test.ts" },
      { code: `it("marks item as IN_PROGRESS", () => {})`, filename: "test.test.ts" },
      // Using constants is allowed
      { code: `expect(item.status).toBe(WORK_ITEM_STATUSES[0])`, filename: "test.test.ts" },
      // Type definitions are allowed
      { code: `type Status = "DONE"`, filename: "types.ts" },
      // Non-test files are not checked
      { code: `const status = "DONE"`, filename: "src/status.ts" },
    ],
    invalid: [
      {
        code: `expect(item.status).toBe("DONE")`,
        filename: "test.test.ts",
        errors: [{ messageId: "useWorkItemStatuses" }],
      },
      {
        code: `expect(status).toEqual("IN_PROGRESS")`,
        filename: "test.test.ts",
        errors: [{ messageId: "useWorkItemStatuses" }],
      },
      {
        code: `expect(result).toMatchObject({ status: "OPEN" })`,
        filename: "test.test.ts",
        errors: [{ messageId: "useWorkItemStatuses" }],
      },
    ],
  });
});

// Test WORK_ITEM_STATUSES constant
describe("WORK_ITEM_STATUSES constant", () => {
  it("exports all status values in order", () => {
    import("../../../src/types").then(({ WORK_ITEM_STATUSES }) => {
      expect(WORK_ITEM_STATUSES).toEqual(["OPEN", "IN_PROGRESS", "DONE"]);
    });
  });

  it("WORK_ITEM_STATUSES is readonly", () => {
    import("../../../src/types").then(({ WORK_ITEM_STATUSES }) => {
      // TypeScript should prevent: WORK_ITEM_STATUSES.push("NEW")
      expect(Object.isFrozen(WORK_ITEM_STATUSES)).toBe(true);
    });
  });
});
```

## Architectural Requirements

### Relevant ADRs

1. [ESLint Testing Harness](../decisions/adr-21_eslint-testing-harness.md) - Testing approach for custom ESLint rules
2. [Isolated Test Fixtures](../../feature-21_testable-validation/decisions/adr-021_isolated-test-fixtures.md) - Test isolation patterns

## Quality Requirements

### QR1: Type Safety

**Requirement:** Rule and constant must have TypeScript type annotations
**Target:** 100% type coverage
**Validation:** `pnpm run typecheck` passes with no errors

### QR2: Error Messages

**Requirement:** Error messages must be actionable
**Target:** Message includes constant name to use
**Validation:** Unit tests verify message content

### QR3: No False Positives

**Requirement:** Rule must not flag legitimate uses
**Target:** Zero false positives in existing codebase after fixing violations
**Validation:** `pnpm run lint` passes after fixing real violations

## Completion Criteria

- [ ] WORK_ITEM_STATUSES constant exported from src/types.ts
- [ ] All Level 1 unit tests pass
- [ ] Rule detects all 148 existing violations
- [ ] Test descriptions and type definitions whitelisted
- [ ] Rule integrated into eslint-rules/index.ts
