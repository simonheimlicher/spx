# Story: Individual Validation Commands

## Acceptance Criteria

- [ ] `spx validation typescript` runs TypeScript type checking
- [ ] `spx validation lint` runs ESLint
- [ ] `spx validation circular` runs madge
- [ ] `spx validation knip` runs knip
- [ ] `spx validation all` runs all enabled validations
- [ ] Each command uses tool discovery
- [ ] Graceful skip message when tool unavailable
- [ ] Exit codes: 0 (pass), 1 (validation failed), 0 (skipped with warning)

## Implementation Tasks

1. Implement `src/commands/validation/typescript.ts`:
   ```typescript
   export interface TypeScriptOptions {
     cwd?: string;
     scope?: "full" | "production";
     files?: string[];
     quiet?: boolean;
     json?: boolean;
   }

   export async function typescriptCommand(options: TypeScriptOptions): Promise<{
     exitCode: number;
     output: string;
   }>;
   ```

2. Implement `src/commands/validation/lint.ts`:
   ```typescript
   export interface LintOptions {
     cwd?: string;
     scope?: "full" | "production";
     files?: string[];
     fix?: boolean;
     quiet?: boolean;
     json?: boolean;
   }

   export async function lintCommand(options: LintOptions): Promise<{
     exitCode: number;
     output: string;
   }>;
   ```

3. Implement `src/commands/validation/circular.ts`:
   ```typescript
   export interface CircularOptions {
     cwd?: string;
     quiet?: boolean;
     json?: boolean;
   }

   export async function circularCommand(options: CircularOptions): Promise<{
     exitCode: number;
     output: string;
   }>;
   ```

4. Implement `src/commands/validation/all.ts`:
   - Run all validation steps in sequence
   - Stop on first failure (fail-fast)
   - Show progress for each step
   - Aggregate results

5. Each command must:
   - Use `discoverTool()` to find the validation tool
   - Handle graceful skip if tool not found
   - Detect project config (`tsconfig.json`, `eslint.config.ts`)
   - Use existing DI patterns from `src/validation/steps/`

6. Wire commands to domain in `src/domains/validation/index.ts`

## Testing Strategy

### Rationale: Integration Tests Only

The command functions are **thin orchestration layers** that:

1. Call `discoverTool()` (already unit tested in `src/validation/discovery/`)
2. Call validation step functions (already unit tested in `src/validation/steps/`)
3. Map results to exit codes (`success ? 0 : 1` - trivial)

**No Level 1 unit tests needed** because:

- Pure functions (`buildTypeScriptArgs()`, `buildEslintArgs()`, etc.) already have unit tests
- Command argument parsing is handled by Commander.js (trusted library)
- The commands contain no complex pure logic worth isolating

**Level 2 integration tests provide:**

- Progress tests: Fast feedback during implementation
- Regression tests: Catch if wiring breaks
- Debug value: Fixture projects make failures reproducible

### Level 2 (Integration) - In `tests/integration/validation/`

Uses `withTestEnv()` with temp fixture projects in `os.tmpdir()`:

| Test Case               | Fixture                       | Expected                      |
| ----------------------- | ----------------------------- | ----------------------------- |
| TypeScript finds errors | Project with type errors      | exit 1, output contains error |
| TypeScript passes       | Clean project                 | exit 0                        |
| ESLint finds errors     | Project with lint violations  | exit 1                        |
| ESLint passes           | Clean project                 | exit 0                        |
| Circular finds cycles   | Project with circular imports | exit 1                        |
| Circular passes         | Clean project                 | exit 0                        |
| All passes              | Clean project                 | exit 0                        |
| Missing tool            | Empty PATH                    | exit 0, skip message          |

### Test File Location

```
tests/integration/validation/
├── commands.integration.test.ts  # CLI command tests (story-47)
└── ... (existing validation step tests)
```

## Definition of Done

- All four subcommands functional
- Tool discovery integrated
- Graceful degradation works
- Integration tests pass on fixtures
- Exit codes correct
