# ADR 001: TypeScript Const for Default Config Structure

## Problem

The spx CLI has directory paths hardcoded as string literals scattered throughout scanner and command code, making it impossible to centralize configuration or support custom directory structures without a refactoring nightmare.

## Context

- **Business**: Users need to customize specs directory structure (e.g., `docs/specifications` instead of `specs`, `active` instead of `work`), but hardcoded paths prevent this. Feature 21 must establish a single source of truth for default config before Feature 31+ can add override functionality.
- **Technical**: TypeScript codebase using tsup for bundling. Scanner and CLI commands currently use string literals like `"specs"`, `"work"`, `"doing"` directly in code. Need type-safe config structure that provides compile-time guarantees and zero runtime overhead.

## Decision

**Define default configuration as a TypeScript const object exported from `src/config/defaults.ts`, not as a separate JSON file loaded at runtime.**

## Rationale

We considered three approaches:

**Option A: Separate JSON file bundled with CLI**

- Pros: Human-readable, can be inspected without code knowledge
- Cons: Requires file I/O at runtime, no compile-time type checking, bundling complexity, potential for missing file errors

**Option B: Generate TypeScript from JSON at build time**

- Pros: Single source of truth in JSON, type-safe output
- Cons: Build complexity, debugging confusion (edit JSON but debug TypeScript), tooling overhead

**Option C: TypeScript const (CHOSEN)**

- Pros: Zero runtime overhead (inline by compiler), compile-time type safety, immediate access, no file I/O, perfect for defaults
- Cons: Requires TypeScript knowledge to modify defaults (acceptable for internal constant)

**Why Option C wins:**

Default config is **internal to the CLI**, not user-facing. Users will configure via `.spx/config.json` (future feature), not by editing this default. The default serves as:

1. Fallback when no user config exists
2. Schema reference for validation
3. Type definition for config structure

Since it's internal, TypeScript const provides:

- **Type safety**: Invalid structure caught at compile time
- **Performance**: No runtime file I/O or parsing
- **Simplicity**: One file to read (`defaults.ts`), no build steps
- **Refactoring support**: TypeScript renames propagate automatically

The disadvantage (requires TS knowledge) is irrelevant because users never edit this file—they create `.spx/config.json` instead.

## Trade-offs Accepted

- **Less discoverable for contributors**: New contributors must know to look in `src/config/defaults.ts` for the schema. Mitigated by clear documentation in README and this ADR.
- **Cannot hot-reload defaults**: Changing defaults requires recompilation. Acceptable because defaults should be stable—customization happens via user config files, not by changing defaults.

## Testing Strategy

### Level Coverage

| Level           | Question Answered                                                       | Scope                                                    |
| --------------- | ----------------------------------------------------------------------- | -------------------------------------------------------- |
| 1 (Unit)        | Is the config structure type-safe and does scanner use injected config? | Type definitions, const object, scanner DI, meta-testing |
| 2 (Integration) | Does the CLI command correctly wire up scanner with DEFAULT_CONFIG?     | Full CLI execution with `spx status`                     |

*Level 3 not needed: E2E config override testing belongs to Feature 31+ (test harness), not default config itself.*

### Escalation Rationale

- **1 → 2**: Level 1 verifies scanner uses injected config correctly via dependency injection (proves scanner honors config), but cannot verify that CLI commands actually instantiate scanner with DEFAULT_CONFIG. Level 2 runs actual `spx status` command to confirm the full CLI integration: command parsing → scanner instantiation with DEFAULT_CONFIG → reporter output.

### Test Harness

| Level | Harness                    | Location/Dependency                                                 |
| ----- | -------------------------- | ------------------------------------------------------------------- |
| 2     | `createTestProject` helper | Built by Feature 21 (creates temp directory with default structure) |

*Level 1 needs no harness—uses dependency injection and standard Unix tools (grep).*

### Behaviors Verified

**Level 1 (Unit):**

- Config object has required properties: `specs.root`, `specs.work.dir`, `specs.work.statusDirs.*`
- Config structure matches TypeScript interface `SpxConfig`
- Path resolution logic joins config paths correctly
- Config is exported and importable from `@/config/defaults`
- Scanner accepts config via constructor (dependency injection)
- Scanner uses `config.specs.root` when constructing paths (test with injected test config)
- Scanner uses `config.specs.work.dir` when constructing paths (test with injected test config)
- Scanner uses `config.specs.work.statusDirs.*` when constructing paths (test with injected test config)
- Meta-test: `grep` scanner source files for hardcoded path strings (must find none)

**Level 2 (Integration):**

- Running actual `spx status` CLI command succeeds with default directory structure
- CLI output includes config values matching `DEFAULT_CONFIG`
- Full CLI workflow: command parsing → scanner instantiation with DEFAULT_CONFIG → reporter output integration

## Validation

### How to Recognize Compliance

You're following this decision if:

- All directory path configuration lives in `src/config/defaults.ts` as a single exported const
- Scanner accepts config as constructor parameter (dependency injection)
- CLI commands import and use `DEFAULT_CONFIG` for all path operations
- No string literals for directory names appear in scanner or command code

### MUST

- Export `DEFAULT_CONFIG` as `const` from `src/config/defaults.ts`
- Define TypeScript interface `SpxConfig` matching config structure
- Use TypeScript `as const` assertion for literal type inference
- Pass config to scanner via constructor injection (enables testing with different configs)
- Document all config properties with JSDoc comments

### NEVER

- Load config from JSON file at runtime for default values (defeats type safety)
- Use string literals for directory names outside `defaults.ts`
- Mutate `DEFAULT_CONFIG` at runtime (it's a constant, not mutable state)
- Embed config in multiple files (single source of truth)

## Config Structure

The `DEFAULT_CONFIG` constant must include:

```typescript
export const DEFAULT_CONFIG = {
  specs: {
    root: "specs", // Base directory for all specs
    work: {
      dir: "work", // Work items container
      statusDirs: {
        doing: "doing", // Active work
        backlog: "backlog", // Future work
        done: "archive", // Completed work
      },
    },
    decisions: "decisions", // Product-level ADRs
    templates: "templates", // Templates location (optional)
  },
  sessions: {
    dir: ".spx/sessions", // Session handoff files location
  },
} as const satisfies SpxConfig;
```

## Refactoring Checklist

To comply with this ADR, the following refactoring is required:

- [ ] Create `src/config/defaults.ts` with `SpxConfig` interface
- [ ] Define `DEFAULT_CONFIG` const matching interface
- [ ] Export both interface and const
- [ ] Refactor scanner to accept config in constructor
- [ ] Replace all hardcoded `"specs"` with `config.specs.root`
- [ ] Replace all hardcoded `"work"` with `config.specs.work.dir`
- [ ] Replace all hardcoded `"doing"/"backlog"/"archive"` with `config.specs.work.statusDirs.*`
- [ ] Update CLI commands to pass `DEFAULT_CONFIG` to scanner
- [ ] Add Level 1 tests for config structure
- [ ] Add Level 2 tests verifying scanner uses config
- [ ] Add Level 2 meta-test: grep scanner files for hardcoded paths (should find none)
