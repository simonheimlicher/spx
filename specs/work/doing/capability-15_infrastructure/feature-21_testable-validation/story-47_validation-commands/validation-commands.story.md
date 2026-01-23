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

**Level 1 (Unit):**

- Command functions accept correct options
- Commands call appropriate validation steps
- Graceful skip logic works

**Level 2 (Integration):**

- `spx validation typescript` on fixture with errors → exit 1
- `spx validation lint` on fixture with errors → exit 1
- `spx validation all` on clean fixture → exit 0
- Missing tool → graceful skip message, exit 0

## Definition of Done

- All four subcommands functional
- Tool discovery integrated
- Graceful degradation works
- Integration tests pass on fixtures
- Exit codes correct
