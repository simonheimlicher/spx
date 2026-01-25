# Feature: Validation CLI Domain

## Observable Outcome

Validation is a first-class CLI domain (`spx validation`) that works as a globally-installed tool across TypeScript projects:

- **CLI commands**: `spx validation typescript`, `spx validation lint`, `spx validation circular`, `spx validation all`
- **Global install use case**: Users install `npm i -g spx-cli` and validation tools are bundled
- **Graceful degradation**: Missing tools are skipped with informative messages
- **Project config detection**: Uses local `tsconfig.json`, `eslint.config.ts` when present
- **Backward compatibility**: `npm run validate` continues to work via thin wrapper

### Technical Quality

- All validation steps accept dependency injection interfaces
- Pure functions separate from subprocess spawning
- 80%+ test coverage with Level 1 + Level 2 tests
- Zero `any` types in validation logic

## Testing Strategy

> Features require **Level 1 + Level 2** to prove the feature works with real tools.
> See `docs/testing/standards.md` for level definitions.

### Level Assignment

| Component                  | Level  | Justification                                     |
| -------------------------- | ------ | ------------------------------------------------- |
| `discoverTool()`           | 1      | Pure function with injectable filesystem          |
| `detectProjectConfig()`    | 1      | Pure function finding config files                |
| `buildEslintArgs()`        | 1      | Pure function constructing CLI argument arrays    |
| `buildTypeScriptArgs()`    | 1      | Pure function selecting tsconfig based on scope   |
| `parseStdinJson()`         | 1      | Pure async parser for hook input                  |
| `validateAndExpandFiles()` | 1      | Pure function expanding paths to TypeScript files |
| Tool discovery integration | 2      | Integration finding real tools in PATH            |
| ESLint validation step     | 2      | Integration with real ESLint binary on fixtures   |
| TypeScript validation      | 2      | Integration with real tsc binary on fixtures      |
| Circular dependency check  | 2      | Integration with real madge binary on fixtures    |
| CLI command functions      | 2 only | Thin orchestration; pure logic already tested     |

### Escalation Rationale

- **1 → 2**: Unit tests verify argument construction and discovery logic, Level 2 verifies real validation tools work on fixture projects and CLI commands produce expected output

### CLI Commands: Level 2 Only

CLI command functions (`typescriptCommand()`, `lintCommand()`, etc.) are **thin orchestration layers**:

1. Call `discoverTool()` → already unit tested
2. Call validation step functions → already unit tested
3. Map results to exit codes → trivial (`success ? 0 : 1`)

No additional unit tests needed. Integration tests with temp fixtures verify the wiring works.

## Feature Integration Tests (Level 2)

### Test Harness

Uses `withTestEnv()` with fixture projects:

- `FIXTURES.WITH_TYPE_ERRORS` - Known TypeScript errors
- `FIXTURES.WITH_LINT_ERRORS` - Known ESLint violations
- `FIXTURES.WITH_CIRCULAR_DEPS` - Known circular imports
- `FIXTURES.CLEAN_PROJECT` - Passes all validations

### Integration Test: CLI Command

```typescript
// tests/integration/cli/validation.integration.test.ts
describe("spx validation", () => {
  it("GIVEN fixture with lint errors WHEN running spx validation lint THEN exits with error", async () => {
    await withTestEnv(
      { fixture: FIXTURES.WITH_LINT_ERRORS },
      async ({ path }) => {
        const result = await execa("node", [CLI_PATH, "validation", "lint"], {
          cwd: path,
          reject: false,
        });

        expect(result.exitCode).toBe(1);
        expect(result.stdout).toContain("ESLint");
      },
    );
  });

  it("GIVEN clean project WHEN running spx validation all THEN exits with success", async () => {
    await withTestEnv(
      { fixture: FIXTURES.CLEAN_PROJECT },
      async ({ path }) => {
        const result = await execa("node", [CLI_PATH, "validation", "all"], {
          cwd: path,
          reject: false,
        });

        expect(result.exitCode).toBe(0);
      },
    );
  });
});
```

### Integration Test: Graceful Degradation

```typescript
describe("spx validation graceful degradation", () => {
  it("GIVEN missing tool WHEN running validation THEN skips with message", async () => {
    // Test with PATH manipulation to hide madge
    const result = await execa("node", [CLI_PATH, "validation", "circular"], {
      env: { PATH: "" }, // Hide all tools
      reject: false,
    });

    expect(result.stdout).toContain("Skipping");
    expect(result.exitCode).toBe(0); // Skip is not an error
  });
});
```

## Capability Contribution

This feature enables the entire validation infrastructure capability:

- Provides `spx validation` CLI domain for cross-project validation
- Establishes dependency injection pattern for all validation tools
- Enables regression testing of validation logic
- Supports global install use case for pre-commit hooks

## Completion Criteria

- [ ] All Level 1 tests pass
- [ ] All Level 2 tests pass
- [ ] Test coverage ≥80% for `src/validation/`
- [ ] `spx validation all` command works
- [ ] `spx validation typescript|lint|circular` subcommands work
- [ ] Graceful degradation when tools unavailable
- [ ] `npm run validate` backward compatibility maintained
- [ ] No mocking used (DI pattern throughout)
- [ ] Zero `any` types without justification

## Stories

### Completed (from original scope)

- **Story-21**: Configure TypeScript checking for scripts - DONE
- **Story-22**: Create test harness for validation tests - DONE
- **Story-32**: Extract pure functions with dependency injection - DONE

### New Stories (CLI domain)

- **Story-44**: Tool discovery infrastructure
- **Story-45**: Extract validation core to `src/validation/`
- **Story-46**: Validation domain registration
- **Story-47**: Individual validation commands
- **Story-48**: Project config detection
- **Story-49**: Dependency migration (optional dependencies)

### Revised

- **Story-43**: Validation test suite - target `src/validation/` instead of `scripts/run/`

**Note**: To see current stories in this feature, use `ls` or `find` to list story directories (e.g., `story-*`) within the feature's directory.
