# Story: Backup, Atomic Writes, and Reporting

## Acceptance Criteria

- [ ] Atomic writes use temp file + rename pattern (ADR-003)
- [ ] **Dependency injection for filesystem operations** (no mocking):
  - [ ] `FileSystem` interface defined with `writeFile()`, `rename()`, `unlink()`, `mkdir()`
  - [ ] `writeSettings()` accepts optional `deps: { fs: FileSystem }` parameter
  - [ ] Default `realFs` implementation wraps Node.js `fs/promises`
- [ ] Timestamped backup creation before any modifications
  - [ ] Format: `settings.json.backup.YYYY-MM-DD-HHmmss` (e.g., `2026-01-08-143022`)
  - [ ] Verifies source file exists and is readable before backup
- [ ] Report formatting with comprehensive statistics:
  - [ ] Files scanned, processed, skipped counts
  - [ ] Permissions added by category (allow/deny/ask) with lists
  - [ ] Subsumed permissions removed (with list)
  - [ ] Conflicts resolved (count + details)
  - [ ] Backup file path shown
- [ ] Dry-run mode prevents all writes:
  - [ ] Shows complete preview of changes
  - [ ] Never modifies global settings file
  - [ ] Never creates backup file
  - [ ] Displays "Run without --dry-run to apply changes" notice
- [ ] Temp file cleanup on errors:
  - [ ] If write fails, temp file deleted
  - [ ] If rename fails, temp file deleted
  - [ ] Original settings file never corrupted
- [ ] Level 2 integration tests verify real filesystem behavior
- [ ] Zero `any` types without justification

## Implementation Tasks

1. Implement backup creation in `src/lib/claude/settings/backup.ts`:
   - Function: `createBackup(settingsPath: string) => Promise<string>`
   - Generate timestamp: `YYYY-MM-DD-HHmmss` format
   - Verify source file exists with `fs.access()` before backup
   - Copy file: `fs.copyFile(source, backup)`
   - Return backup file path

2. Implement atomic writer in `src/lib/claude/settings/writer.ts` per ADR-003:
   - Define `FileSystem` interface:
     ```typescript
     interface FileSystem {
       writeFile(path: string, content: string): Promise<void>;
       rename(oldPath: string, newPath: string): Promise<void>;
       unlink(path: string): Promise<void>;
       mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
     }
     ```
   - Implement `realFs` using `fs/promises` (wraps Node.js built-ins)
   - Function: `writeSettings(filePath, settings, deps = { fs: realFs }) => Promise<void>`
   - Generate unique temp file: `${filePath}.tmp.${timestamp}.${random}`
   - Write to temp file: `deps.fs.writeFile(tempPath, JSON.stringify(settings, null, 2))`
   - Rename atomic: `deps.fs.rename(tempPath, filePath)`
   - Cleanup on error: `try { await deps.fs.unlink(tempPath) } catch { }`
   - Ensure parent directory exists: `deps.fs.mkdir(dirname(filePath), { recursive: true })`

3. Implement reporter in `src/lib/claude/settings/reporter.ts`:
   - Function: `formatReport(result: ConsolidationResult, dryRun: boolean) => string`
   - Header: "Scanning for Claude Code settings files..."
   - Statistics section: files scanned/processed/skipped
   - Permissions added section: grouped by category (allow/deny/ask) with + prefix
   - Subsumed permissions section: list removed permissions
   - Conflicts section: show resolved conflicts with source info
   - Backup section: show backup file path (if not dry-run)
   - Summary section: aggregated counts
   - Dry-run notice: "Run without --dry-run to apply changes" (if dry-run)

4. Write Level 1 tests with dependency injection (4 test cases from ADR-003):
   - Test: Cleans up temp file on write error
     - Mock fs: `writeFile()` throws error
     - Verify: `unlink(tempPath)` called (temp file cleanup)
   - Test: Propagates rename errors
     - Mock fs: `rename()` throws error
     - Verify: Error propagated, temp file cleaned up
   - Test: Generates unique temp file names
     - Call `writeSettings()` twice with same path
     - Verify: Different temp file names used
   - Test: Preserves JSON formatting
     - Write settings with nested objects
     - Verify: Output JSON has 2-space indentation

5. Write Level 2 integration tests with real filesystem:
   - Test: Handles permission denied gracefully
     - Create settings file with mode 000 (no permissions)
     - Attempt write
     - Verify: Error thrown, original file unchanged
   - Test: Backup created before modifications
     - Write settings
     - Verify: Backup file exists with correct timestamp format
     - Verify: Backup content matches original
   - Test: Atomic rename succeeds
     - Write settings
     - Verify: Final file has correct content
     - Verify: No temp files remain

## Testing Strategy

**Level 1 (Unit):**

Tests use **dependency injection** (ADR-003), NOT mocking. Pure functions accept `FileSystem` interface parameter.

Test cases for `backup.ts`:

- Backup file created with correct timestamp format
- Backup content matches source file exactly
- Error thrown if source file doesn't exist
- Error thrown if source file not readable

Test cases for `writer.ts` with DI:

- Temp file cleanup on write error (inject fs that throws on `writeFile`)
- Temp file cleanup on rename error (inject fs that throws on `rename`)
- Unique temp file names generated (timestamp + random)
- JSON formatting preserved (2-space indentation)
- Directory creation if parent doesn't exist

Test cases for `reporter.ts`:

- Report shows all statistics correctly
- Permissions grouped by category (allow/deny/ask)
- Dry-run notice appears when `dryRun = true`
- Backup path shown when `dryRun = false`
- Subsumed permissions listed
- Conflicts formatted with source information

**Level 2 (Integration):**

Tests use **real filesystem** with temp directories (`os.tmpdir()`).

Test cases:

- Backup created before write with real filesystem
- Atomic rename works on real filesystem
- Permission denied handled gracefully (create file with mode 000, attempt write)
- Temp files cleaned up even if process crashes (verify no orphaned temp files)
- Full consolidation workflow: backup → write → verify

## Definition of Done

- [ ] `npm run typecheck` passes with 0 errors
- [ ] `npm test` passes all Level 1 tests (DI-based)
- [ ] `npm test` passes all Level 2 tests (real filesystem)
- [ ] Test coverage ≥80% for `backup.ts`, `writer.ts`, `reporter.ts`
- [ ] No `any` types without justification
- [ ] ADR-003 fully implemented and verified
- [ ] **No mocking used** (DI pattern with `FileSystem` interface)
- [ ] Temp file cleanup verified (no orphaned files)
- [ ] Backup timestamp format verified (YYYY-MM-DD-HHmmss)
- [ ] Dry-run mode verified (no files modified)
- [ ] JSON formatting verified (2-space indentation)
