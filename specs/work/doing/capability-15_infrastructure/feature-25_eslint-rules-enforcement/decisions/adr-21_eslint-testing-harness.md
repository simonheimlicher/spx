# ADR: ESLint Testing Harness

## Status

Accepted

## Context

This feature introduces custom ESLint rules to enforce [ADR-21: Type-Derived Code](../../../../decisions/adr-21_type-derived-testing.md). We need a testing strategy that:

1. Provides fast feedback during rule development (Level 1)
2. Verifies rules integrate correctly with real ESLint (Level 2)
3. Avoids mocking ESLint internals, which would create brittle tests

The existing rule `no-bdd-try-catch-anti-pattern` in `eslint-rules/` lacks comprehensive tests, making it difficult to verify behavior and add new rules confidently.

### Options Considered

**Option A: Real ESLint only (Level 2)**

- Run all tests through `new ESLint()` with full config
- Pros: Tests exactly what users see
- Cons: Slow (~500ms per test), hard to isolate rule logic

**Option B: RuleTester only (Level 1)**

- Use ESLint's built-in `RuleTester` for all tests
- Pros: Fast (~5ms per test), isolated rule testing
- Cons: Doesn't verify config loading, plugin registration, or cross-rule interactions

**Option C: Two-tier approach (Level 1 + Level 2)** ← Selected

- RuleTester for unit tests (rule logic)
- Real ESLint for integration tests (config + plugin loading)
- Pros: Fast development cycle + production confidence
- Cons: More test infrastructure to maintain

## Decision

**Use a two-tier testing approach: ESLint RuleTester for Level 1 unit tests and real ESLint instances for Level 2 integration tests.**

### Implementation Constraints

#### Level 1: RuleTester for Rule Logic

```typescript
// specs/.../story-21_no-hardcoded-work-item-kinds/tests/no-hardcoded-work-item-kinds.test.ts
import { RuleTester } from "eslint";
import tseslint from "typescript-eslint";
import rule from "../../../../../../../eslint-rules/no-hardcoded-work-item-kinds";

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parser: tseslint.parser,
  },
});

ruleTester.run("no-hardcoded-work-item-kinds", rule, {
  valid: [
    // Allowed patterns
    { code: `describe("story parsing", () => {})`, filename: "test.test.ts" },
    { code: `expect(item.kind).toBe(WORK_ITEM_KINDS[2])`, filename: "test.test.ts" },
  ],
  invalid: [
    // Violations
    {
      code: `expect(item.kind).toBe("story")`,
      filename: "test.test.ts",
      errors: [{ messageId: "useWorkItemKinds" }],
    },
  ],
});
```

**Constraints:**

1. Each rule MUST have a `ruleTester.run()` test covering all valid and invalid patterns
2. Test filenames MUST use `.test.ts` suffix to trigger test-file-only rules
3. Tests MUST verify specific `messageId` values, not just error count
4. Valid cases MUST include all whitelist scenarios (test descriptions, type definitions, non-test files)

#### Level 2: Real ESLint for Integration

```typescript
// tests/integration/eslint-rules.integration.test.ts
import { ESLint } from "eslint";

describe("ESLint Rules Integration", () => {
  let eslint: ESLint;

  beforeAll(async () => {
    // Load real config dynamically to test actual setup
    const config = await import("../../eslint.config");
    eslint = new ESLint({
      overrideConfigFile: true,
      overrideConfig: config.default,
    });
  });

  it("loads spx plugin and all custom rules", async () => {
    const config = await eslint.calculateConfigForFile("test.test.ts");
    expect(config.plugins).toContain("spx");
    expect(config.rules["spx/no-hardcoded-work-item-kinds"]).toBeDefined();
  });

  it("detects violations in test files", async () => {
    const results = await eslint.lintText(
      `expect(item.kind).toBe("story");`,
      { filePath: "test.test.ts" },
    );
    expect(results[0].messages).toContainEqual(
      expect.objectContaining({ ruleId: "spx/no-hardcoded-work-item-kinds" }),
    );
  });

  it("ignores non-test files", async () => {
    const results = await eslint.lintText(
      `const kind = "story";`,
      { filePath: "src/parser.ts" },
    );
    expect(results[0].errorCount).toBe(0);
  });
});
```

**Constraints:**

1. Integration tests MUST use real ESLint instance with production config
2. Integration tests MUST verify plugin loading and rule registration
3. Integration tests MUST verify file-type filtering (test vs non-test)
4. Integration tests SHOULD NOT duplicate every valid/invalid case from unit tests

### Directory Structure

```
eslint-rules/
├── index.ts                              # Plugin export
├── no-hardcoded-work-item-kinds.ts       # Rule implementation
├── no-hardcoded-statuses.ts              # Rule implementation
└── no-bdd-try-catch-anti-pattern.ts      # Existing rule

specs/work/doing/capability-15_infrastructure/feature-25_eslint-rules-enforcement/
├── story-21_no-hardcoded-work-item-kinds/
│   └── tests/
│       └── no-hardcoded-work-item-kinds.test.ts  # Level 1 progress tests
└── story-32_no-hardcoded-statuses/
    └── tests/
        └── no-hardcoded-statuses.test.ts         # Level 1 progress tests

tests/
└── integration/
    └── eslint-rules.integration.test.ts  # Level 2 integration tests (after graduation)
```

### Test Naming Convention

- Progress tests (during development): `specs/.../story-.../tests/{rule-name}.test.ts`
- Regression tests (after graduation): `tests/unit/eslint-rules/{rule-name}.test.ts`
- Integration tests: `tests/integration/eslint-rules.integration.test.ts`

## Consequences

### Benefits

1. **Fast development**: RuleTester runs in ~5ms per test, enabling TDD for rule logic
2. **Production confidence**: Integration tests verify actual ESLint setup
3. **Isolation**: Unit tests fail only when rule logic breaks, not config changes
4. **Consistency**: Aligns with existing project pattern (Level 1 unit + Level 2 integration)

### Trade-offs Accepted

1. **Two test locations**: Progress tests in `specs/.../tests/`, integration tests in `tests/integration/`
2. **Duplication boundary**: Some overlap between unit and integration tests is acceptable for critical paths
3. **Config sensitivity**: Integration tests may fail on config changes unrelated to rule logic

### Risks Mitigated

1. **False confidence from mocks**: Real ESLint in Level 2 catches config issues
2. **Slow feedback loop**: RuleTester in Level 1 keeps TDD fast
3. **Regression risk**: Both levels must pass for CI green

## Testing Strategy

### Level Assignments

| Component              | Level           | Justification                        |
| ---------------------- | --------------- | ------------------------------------ |
| AST detection logic    | 1 (Unit)        | Pure function operating on AST nodes |
| Whitelist checking     | 1 (Unit)        | Pure function with parent traversal  |
| Error message format   | 1 (Unit)        | Pure string formatting               |
| Plugin registration    | 2 (Integration) | Requires real ESLint to verify       |
| Config file filtering  | 2 (Integration) | Depends on eslint.config.ts patterns |
| Cross-rule interaction | 2 (Integration) | Multiple rules in single ESLint run  |

### Escalation Rationale

- **Level 1 → 2**: Unit tests prove rule detection logic works in isolation. Level 2 verifies the rule loads correctly in the actual ESLint environment, config patterns apply correctly, and rules don't conflict.

### Testing Principles

- **NO MOCKING**: RuleTester is ESLint's official isolated test harness, not a mock
- **Behavior only**: Test what violations are reported, not AST traversal internals
- **Minimum level**: Rule logic at Level 1; integration concerns at Level 2

## Compliance

### Verification

1. All custom rules have progress tests in `specs/.../story-.../tests/{rule-name}.test.ts`
2. Integration test file exists at `tests/integration/eslint-rules.integration.test.ts`
3. Both test levels run in CI (`pnpm test` includes both)
4. Coverage reports show rule files covered by unit tests

### Review Checklist

When adding a new ESLint rule:

- [ ] Rule implementation in `eslint-rules/{rule-name}.ts`
- [ ] Rule exported in `eslint-rules/index.ts`
- [ ] Progress tests in `specs/.../story-.../tests/{rule-name}.test.ts`
- [ ] Rule enabled in `eslint.config.ts`
- [ ] Integration test added for rule loading/detection
- [ ] Tests graduated to `tests/unit/` when story is DONE
