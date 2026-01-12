# Story: Discovery and Parsing of Settings Files

## Acceptance Criteria

- [ ] Recursive discovery finds all `.claude/settings.local.json` files under root directory
- [ ] Discovery handles symlink loops correctly (tracks visited directories to prevent infinite recursion)
- [ ] Parser handles valid JSON files with permissions objects
- [ ] Parser gracefully handles malformed JSON (returns `null` instead of throwing)
- [ ] Parser gracefully handles files without permissions objects
- [ ] Empty directories don't cause errors (discovery continues)
- [ ] Level 1 tests use `os.tmpdir()` fixtures (no mocking)
- [ ] Zero `any` types without justification

## Implementation Tasks

1. Implement recursive file discovery in `src/lib/claude/permissions/discovery.ts`:
   - Function: `findSettingsFiles(root: string) => Promise<string[]>`
   - Use `fs.readdir()` with `withFileTypes: true` for efficient directory traversal
   - Track visited directories in `Set<string>` to prevent symlink loops
   - Look for `.claude/settings.local.json` pattern specifically
   - Validate files exist and are readable before including in results

2. Implement JSON parser in `src/lib/claude/permissions/parser.ts`:
   - Function: `parseSettingsFile(filePath: string) => Promise<ClaudeSettings | null>`
   - Use `try/catch` around `JSON.parse()` to handle malformed files
   - Return `null` for malformed JSON or invalid structure (don't throw)
   - Validate parsed object is an object (not string, number, array, null)
   - Extract permissions from `allow`, `deny`, `ask` arrays if present

3. Write Level 1 tests with temp directory fixtures:
   - Create fixtures: `os.tmpdir()` + unique subdirectory per test
   - Test discovery: multi-level directory structure, symlinks, empty dirs
   - Test parser: valid JSON, malformed JSON, missing permissions, invalid types
   - Verify symlink loop handling (discovery doesn't hang)
   - Verify error handling (parser returns `null` for bad input)

## Testing Strategy

**Level 1 (Unit):**

Tests use temp directory fixtures with `os.tmpdir()` (no mocking). Discovery and parser are pure async functions operating on file system with standard Node.js tools.

Test cases for `discovery.ts`:

- Find settings files in simple directory structure (single level)
- Find settings files in nested directory structure (3+ levels deep)
- Handle symlink loops correctly (visited tracking prevents infinite recursion)
- Handle empty directories without errors (continues traversal)
- Handle permission denied on subdirectories (skips, continues with accessible dirs)

Test cases for `parser.ts`:

- Parse valid settings file with permissions (allow/deny/ask arrays)
- Parse valid settings file without permissions object (returns empty permissions)
- Parse malformed JSON (syntax error) → returns `null`
- Parse non-object JSON (string, number, array) → returns `null`
- Parse file that doesn't exist → returns `null` or throws (document behavior)

**Level 2 (Integration):**

N/A - Discovery and parser are pure functions tested exhaustively at Level 1. Integration with consolidation pipeline tested at feature level (see [settings-consolidation.trd.md](../settings-consolidation.trd.md)).

## Definition of Done

- [ ] `npm run typecheck` passes with 0 errors
- [ ] `npm test` passes all Level 1 tests for discovery and parser
- [ ] Test coverage ≥80% for `discovery.ts` and `parser.ts`
- [ ] No `any` types without justification
- [ ] Symlink loop handling verified (no infinite recursion)
- [ ] Malformed JSON handling verified (no thrown exceptions, returns `null`)
- [ ] Existing test files verified:
  - [ ] `tests/unit/discovery.test.ts` exists and passes
  - [ ] `tests/unit/parser.test.ts` exists and passes
