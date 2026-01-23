# Story: Extract Validation Core to src/

## Acceptance Criteria

- [ ] `src/validation/` directory structure created
- [ ] Types exported: `ValidationContext`, `ValidationStepResult`, `ProcessRunner`
- [ ] Each step in separate file: `circular.ts`, `eslint.ts`, `typescript.ts`, `knip.ts`
- [ ] `scripts/run/validate.ts` imports from `src/validation/`
- [ ] All existing tests still pass
- [ ] `npm run validate` backward compatibility maintained

## Implementation Tasks

1. Create directory structure:
   ```
   src/validation/
   ├── index.ts           # Public exports
   ├── types.ts           # Shared interfaces
   ├── steps/
   │   ├── index.ts       # Step exports
   │   ├── circular.ts    # Circular dependency validation
   │   ├── eslint.ts      # ESLint validation
   │   ├── typescript.ts  # TypeScript validation
   │   └── knip.ts        # Knip validation
   └── config/
       └── scope.ts       # Scope resolution (getTypeScriptScope)
   ```

2. Extract types to `src/validation/types.ts`:
   ```typescript
   export interface ProcessRunner {
     spawn(cmd: string, args: readonly string[], opts?: SpawnOptions): ChildProcess;
   }

   export interface ValidationContext {
     projectRoot: string;
     scope: "full" | "production" | "file-specific";
     scopeConfig: TypeScriptScope;
     enabledValidations: Record<string, boolean>;
     isFileSpecificMode: boolean;
     validatedFiles?: string[];
   }

   export interface ValidationStepResult {
     success: boolean;
     skipped?: boolean;
     error?: string;
     // Step-specific fields
   }
   ```

3. Extract each validation step to its own file:
   - Move `validateCircularDependencies()` → `src/validation/steps/circular.ts`
   - Move `validateESLint()` → `src/validation/steps/eslint.ts`
   - Move `validateTypeScript()` → `src/validation/steps/typescript.ts`
   - Move `validateKnip()` → `src/validation/steps/knip.ts`

4. Update `scripts/run/validate.ts`:
   - Import from `../dist/validation/index.js` (built output)
   - Keep CLI argument parsing and orchestration
   - Delegate to library functions

5. Ensure tsup builds the validation library:
   - Add `src/validation/index.ts` to entry points if needed

## Testing Strategy

**Level 1 (Unit):**

- Existing unit tests continue to pass
- Types are correctly exported

**Level 2 (Integration):**

- `npm run validate` still works
- Existing integration tests pass

## Definition of Done

- `src/validation/` structure matches plan
- Script imports from library
- All existing tests pass
- `npm run build && npm run validate` works
