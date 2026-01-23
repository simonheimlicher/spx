# Story: Validation Domain Registration

## Acceptance Criteria

- [ ] `src/domains/validation/index.ts` implements `Domain` interface
- [ ] Domain registered in `src/cli.ts`
- [ ] `spx validation --help` shows subcommands
- [ ] Subcommands registered: `typescript`, `lint`, `circular`, `knip`, `all`
- [ ] Each subcommand has appropriate options

## Implementation Tasks

1. Create domain file `src/domains/validation/index.ts`:
   ```typescript
   import type { Command } from "commander";
   import type { Domain } from "../types.js";

   export const validationDomain: Domain = {
     name: "validation",
     description: "Run code validation tools",
     register: (program: Command) => {
       const validationCmd = program
         .command("validation")
         .description("Run code validation tools");

       // Subcommands registered here
     },
   };
   ```

2. Register subcommands:
   ```
   spx validation typescript   # Run TypeScript type checking
   spx validation lint         # Run ESLint
   spx validation circular     # Check circular dependencies
   spx validation knip         # Detect unused code
   spx validation all          # Run all validations (default)
   ```

3. Common options for all subcommands:
   ```
   --scope <scope>    Validation scope (full|production)
   --files <paths>    Specific files/directories to validate
   --quiet            Suppress progress output
   --json             Output results as JSON
   ```

4. Lint-specific options:
   ```
   --fix              Auto-fix issues
   ```

5. Register domain in `src/cli.ts`:
   ```typescript
   import { validationDomain } from "./domains/validation/index.js";
   // ...
   validationDomain.register(program);
   ```

6. Create placeholder command handlers in `src/commands/validation/`:
   ```
   src/commands/validation/
   ├── index.ts       # Re-exports
   ├── typescript.ts  # TypeScript command
   ├── lint.ts        # ESLint command
   ├── circular.ts    # Circular deps command
   ├── knip.ts        # Knip command
   └── all.ts         # All validations
   ```

## Testing Strategy

**Level 1 (Unit):**

- Domain implements `Domain` interface
- Domain has correct name and description

**Level 2 (Integration):**

- `spx validation --help` shows all subcommands
- Each subcommand is accessible
- Options are parsed correctly

## Definition of Done

- `spx validation --help` works
- All subcommands accessible (can return stub output)
- Domain follows existing pattern (spec, session)
- Code compiles with `npm run typecheck`
