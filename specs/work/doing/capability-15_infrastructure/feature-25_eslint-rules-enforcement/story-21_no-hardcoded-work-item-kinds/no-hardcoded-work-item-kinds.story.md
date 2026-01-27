# Story: No Hardcoded Work Item Kinds

## Functional Requirements

### FR1: Detect hardcoded kind literals in test assertions

```gherkin
GIVEN a test file containing expect(item.kind).toBe("story")
WHEN ESLint processes the file
THEN the rule reports an error suggesting WORK_ITEM_KINDS usage
```

#### Files created/modified

1. `eslint-rules/no-hardcoded-work-item-kinds.ts` [new]: Rule implementation
2. `eslint-rules/index.ts` [modify]: Export the new rule

### FR2: Allow kind strings in test descriptions

```gherkin
GIVEN a test file containing describe("story parsing", () => {})
WHEN ESLint processes the file
THEN no error is reported (test descriptions are allowed contexts)
```

#### Files created/modified

1. `eslint-rules/no-hardcoded-work-item-kinds.ts` [modify]: Add whitelist for test description contexts

### FR3: Allow type definitions and regex patterns

```gherkin
GIVEN a file containing type WorkItemKind = "capability" | "feature" | "story"
WHEN ESLint processes the file
THEN no error is reported (type definitions are allowed contexts)
```

#### Files created/modified

1. `eslint-rules/no-hardcoded-work-item-kinds.ts` [modify]: Add whitelist for type definitions

## Testing Strategy

> Stories require **Level 1** to prove core logic works.
> See [testing standards](/docs/testing/standards.md) for level definitions.

### Level Assignment

| Component                          | Level | Justification                           |
| ---------------------------------- | ----- | --------------------------------------- |
| AST detection of hardcoded strings | 1     | Pure function operating on AST nodes    |
| Whitelist context checking         | 1     | Pure function with AST parent traversal |
| Error message formatting           | 1     | Pure string formatting                  |

### When to Escalate

This story stays at Level 1 because:

- We're testing AST detection logic, not ESLint's integration
- ESLint RuleTester provides isolated rule testing without full ESLint setup
- Real ESLint integration is tested at the feature level (Level 2)

## Unit Tests (Level 1)

```typescript
// tests/unit/eslint-rules/no-hardcoded-work-item-kinds.test.ts
import { RuleTester } from "eslint";
import rule from "../../../eslint-rules/no-hardcoded-work-item-kinds";

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: "module" },
});

describe("no-hardcoded-work-item-kinds", () => {
  ruleTester.run("no-hardcoded-work-item-kinds", rule, {
    valid: [
      // Test descriptions are allowed
      { code: `describe("story parsing", () => {})`, filename: "test.test.ts" },
      { code: `it("handles feature correctly", () => {})`, filename: "test.test.ts" },
      // Using constants is allowed
      { code: `expect(item.kind).toBe(WORK_ITEM_KINDS[2])`, filename: "test.test.ts" },
      // Type definitions are allowed
      { code: `type Kind = "story"`, filename: "types.ts" },
      // Non-test files are not checked
      { code: `const kind = "story"`, filename: "src/parser.ts" },
    ],
    invalid: [
      {
        code: `expect(item.kind).toBe("story")`,
        filename: "test.test.ts",
        errors: [{ messageId: "useWorkItemKinds" }],
      },
      {
        code: `expect(kind).toEqual("feature")`,
        filename: "test.test.ts",
        errors: [{ messageId: "useWorkItemKinds" }],
      },
      {
        code: `expect(result).toMatchObject({ kind: "capability" })`,
        filename: "test.test.ts",
        errors: [{ messageId: "useWorkItemKinds" }],
      },
    ],
  });
});
```

## Architectural Requirements

### Relevant ADRs

1. [ESLint Testing Harness](../decisions/adr-21_eslint-testing-harness.md) - Testing approach for custom ESLint rules
2. [Isolated Test Fixtures](../../feature-21_testable-validation/decisions/adr-021_isolated-test-fixtures.md) - Test isolation patterns

## Quality Requirements

### QR1: Type Safety

**Requirement:** Rule must have TypeScript type annotations
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

- [ ] All Level 1 unit tests pass
- [ ] Rule detects all 239 existing violations
- [ ] Test descriptions and type definitions whitelisted
- [ ] Rule integrated into eslint-rules/index.ts
