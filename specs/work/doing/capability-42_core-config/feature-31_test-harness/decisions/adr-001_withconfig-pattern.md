# ADR 001: Context Manager Pattern for Config Test Harness

## Problem

Testing config functionality requires creating isolated temporary project structures with custom `.spx/config.json` files, but manual setup/cleanup in every test is error-prone, verbose, and doesn't guarantee cleanup on test failure.

## Context

- **Business**: Feature 21 establishes default config infrastructure that must be tested with various custom configurations. Tests need realistic project structures (with/without git repos, custom directory layouts) to verify config loading, validation, and path resolution work correctly across different scenarios.
- **Technical**: TypeScript/Vitest codebase. Need reusable test infrastructure that creates isolated projects in `os.tmpdir()`, supports git simulation, and guarantees cleanup even on test failures. Reference implementation exists: CraftFinal's `withTestEnv` pattern (lines 1170-1245) demonstrates resource tracking, path safety, and try-finally cleanup.

## Decision

**Implement a `withConfig` context manager function following CraftFinal's `withTestEnv` pattern, providing automatic setup, resource tracking, and guaranteed cleanup for config testing scenarios.**

## Rationale

We considered three approaches for test isolation:

**Option A: Manual setup/cleanup functions**

```typescript
const projectDir = await setupTestProject();
try {
  // test code
} finally {
  await cleanupTestProject(projectDir);
}
```

- Cons: Requires boilerplate in every test, easy to forget cleanup, not composable, cleanup responsibility on caller

**Option B: Test fixture directories**

- Cons: Static fixtures can't test dynamic config scenarios, conflicts between parallel tests, requires committing test artifacts to repo

**Option C: Context manager pattern (CHOSEN)**

```typescript
await withConfig(config, async ({ projectDir }) => {
  // test code - cleanup automatic
});
```

- Pros: Cleanup guaranteed by try-finally in harness, concise API (single function call), composable (can nest contexts), matches proven CraftFinal pattern
- Cons: Requires understanding async callback pattern (acceptable - standard in JavaScript/TypeScript testing)

**Why Option C wins:**

Context managers solve the fundamental problem: **cleanup must be structurally guaranteed, not caller-dependent**. By encapsulating try-finally within `withConfig`, we make it impossible for tests to skip cleanup. The callback pattern ensures resources are scoped to test execution.

The CraftFinal reference demonstrates this pattern at scale (1550 lines, 5 infrastructure levels). We can simplify for our single-level needs while maintaining the core guarantees:

1. **Resource tracking**: Arrays track all created resources (tempDirs, tempFiles)
2. **Path safety**: Validate cleanup paths are under `os.tmpdir()` (lines 1186-1236 in reference)
3. **Automatic cleanup**: try-finally ensures cleanup runs even on error
4. **Flexible API**: TypeScript overloads support config-only, config+options, config+options+callback

Since all operations are in `os.tmpdir()`, path traversal protection is defense-in-depth rather than critical safety (user trusts tmpdir operations).

## Trade-offs Accepted

- **Learning curve for callback pattern**: Developers unfamiliar with context managers must learn the async callback API. Mitigated by clear documentation, examples in feature spec (FI1-FI4), and commonality with existing patterns (Vitest's `test()` uses same pattern).
- **Cannot access projectDir after callback completes**: Cleanup happens immediately, so tests cannot inspect artifacts post-execution. Mitigated by capturing state within callback scope (standard test pattern - arrange, act, assert all within callback).

## Testing Strategy

### Level Coverage

| Level    | Question Answered                                                                                           | Scope                                                           |
| -------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| 1 (Unit) | Does the context manager track resources, invoke cleanup correctly, AND create working temp dirs/git repos? | withConfig logic, resource tracking, real fs ops, real git init |

*Level 2+ not needed: Test harness uses only Level 1 tools (Node.js fs built-ins, git standard dev tool). No project-specific binaries required.*

### Test Harness

*Level 1 needs no external harness—the test harness tests itself using Level 1 tools (Node.js fs, git). Uses both dependency injection for logic verification and real operations for actual behavior verification.*

### Behaviors Verified

**Level 1 (Unit):**

*Logic verification (via dependency injection with controlled implementations):*

- withConfig accepts config object and returns context with projectDir property
- withConfig accepts config + options (git, createStructure) and passes options through
- Resource tracking: tempDirs array populated when mkdtemp called
- Resource tracking: tempFiles array populated when writeFile called
- Cleanup function called in finally block even when callback throws error
- Cleanup function validates paths are under tmpdir before removal (path traversal check)
- TypeScript types: config parameter typed as Partial<SpxConfig>
- TypeScript types: context object provides projectDir: string, config: SpxConfig, isGitRepo: boolean

*Actual operation verification (real Node.js fs and git):*

- Given config override WHEN using withConfig THEN .spx/config.json created with custom values in real tmpdir
- Given git: true option WHEN using withConfig THEN .git directory exists and real git commands work
- Given git: false option WHEN using withConfig THEN no .git directory exists
- Given createStructure: true WHEN using withConfig THEN specs/work/doing directories created on real filesystem
- Given workItems array WHEN using withConfig THEN capability/feature/story directories created with BSP numbers
- Given callback completes successfully WHEN withConfig finishes THEN temp directory actually removed from disk
- Given callback throws error WHEN withConfig catches THEN temp directory still removed from disk (cleanup guarantee)

## Validation

### How to Recognize Compliance

You're following this decision if:

- Test files import `withConfig` from `@test/helpers/with-config`
- Config tests use `withConfig` callback pattern instead of manual setup/teardown
- All temp directory creation happens within `withConfig` context
- No test code manually calls cleanup functions (cleanup is automatic)

### MUST

- Implement `withConfig` in `tests/helpers/with-config.ts` (shared test utility location)
- Use try-finally pattern to guarantee cleanup runs
- Track all created resources in arrays (`tempDirs: string[]`, `tempFiles: string[]`)
- Validate cleanup paths are under `os.tmpdir()` before removal (path traversal protection)
- Export type definitions: `WithConfigOptions`, `WithConfigContext`, `SpxConfig` (partial)
- Support TypeScript overloads for flexible API:
  ```typescript
  function withConfig(config: Partial<SpxConfig>, callback: Callback): Promise<void>;
  function withConfig(config: Partial<SpxConfig>, options: Options, callback: Callback): Promise<void>;
  ```

### NEVER

- Skip cleanup on error (cleanup MUST run in finally block)
- Remove directories outside `os.tmpdir()` (path traversal protection required)
- Mutate global state or leave side effects after callback completes
- Require manual cleanup calls from test code (defeats context manager purpose)
- Use mocking for filesystem operations in integration tests (use real fs, real git)
