# Story: CLI Integration

## Functional Requirements

### FR1: Implement `spx session prune` command

```gherkin
GIVEN spx CLI with session domain
WHEN running `spx session prune [--keep N] [--dry-run]`
THEN prune todo sessions keeping N most recent (default 5)
AND show deleted sessions (or "would delete" in dry-run mode)
```

#### Files created/modified

1. `src/commands/session/prune.ts` [new]: Prune command handler
2. `src/domains/session/index.ts` [modify]: Register prune command

### FR2: Implement `spx session archive` command

```gherkin
GIVEN spx CLI with session domain
WHEN running `spx session archive <id>`
THEN move session to archive directory
AND confirm archive location
```

#### Files created/modified

1. `src/commands/session/archive.ts` [new]: Archive command handler
2. `src/domains/session/index.ts` [modify]: Register archive command

### FR3: Prune command help and validation

```gherkin
GIVEN spx CLI with session domain
WHEN running `spx session prune --help`
THEN show usage with --keep and --dry-run options
```

```gherkin
GIVEN invalid --keep value (negative or zero)
WHEN running `spx session prune --keep -1`
THEN show validation error and exit non-zero
```

#### Files created/modified

1. `src/commands/session/prune.ts` [modify]: Add validation

### FR4: Archive command error handling

```gherkin
GIVEN session ID that does not exist
WHEN running `spx session archive nonexistent`
THEN show "Session not found" error and exit non-zero
```

```gherkin
GIVEN session already in archive
WHEN running `spx session archive <archived-id>`
THEN show "Session already archived" error and exit non-zero
```

#### Files created/modified

1. `src/commands/session/archive.ts` [modify]: Add error handling

## Testing Strategy

> Stories require **Level 2** for CLI integration testing.
> See [testing standards](/docs/testing/standards.md) for level definitions.

### Level Assignment

| Component          | Level | Justification                            |
| ------------------ | ----- | ---------------------------------------- |
| Command routing    | 2     | Requires Commander.js                    |
| CLI option parsing | 2     | Integration with CLI framework           |
| End-to-end flow    | 2     | Requires real spx binary and file system |

### When to Escalate

This story uses Level 2 because:

- Testing the full CLI command execution path through Commander.js
- Verifying command routing, option parsing, and stdout output
- Integration tests validate the complete user experience

## Integration Tests (Level 2)

```typescript
// tests/integration/session/advanced-cli.integration.test.ts
import { execa } from "execa";
import { mkdir, mkdtemp, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("spx session prune/archive commands", () => {
  let tempDir: string;
  let sessionsDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "spx-session-adv-"));
    sessionsDir = join(tempDir, ".spx", "sessions");
    await mkdir(join(sessionsDir, "todo"), { recursive: true });
    await mkdir(join(sessionsDir, "doing"), { recursive: true });
    await mkdir(join(sessionsDir, "archive"), { recursive: true });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe("prune command", () => {
    it("GIVEN 8 sessions WHEN prune (default) THEN 5 remain", async () => {
      // Create 8 sessions
      for (let i = 1; i <= 8; i++) {
        const sessionId = `2026-01-${String(i).padStart(2, "0")}_10-00-00`;
        await writeFile(
          join(sessionsDir, "todo", `${sessionId}.md`),
          `# Session ${i}`,
        );
      }

      const { exitCode, stdout } = await execa(
        "node",
        ["bin/spx.js", "session", "prune", "--sessions-dir", sessionsDir],
        { cwd: process.cwd() },
      );

      expect(exitCode).toBe(0);
      expect(stdout).toContain("Deleted 3 sessions");
    });

    it("GIVEN 10 sessions WHEN prune --keep 3 THEN 3 remain", async () => {
      for (let i = 1; i <= 10; i++) {
        const sessionId = `2026-01-${String(i).padStart(2, "0")}_10-00-00`;
        await writeFile(
          join(sessionsDir, "todo", `${sessionId}.md`),
          `# Session ${i}`,
        );
      }

      const { exitCode, stdout } = await execa(
        "node",
        ["bin/spx.js", "session", "prune", "--keep", "3", "--sessions-dir", sessionsDir],
        { cwd: process.cwd() },
      );

      expect(exitCode).toBe(0);
      expect(stdout).toContain("Deleted 7 sessions");
    });

    it("GIVEN 10 sessions WHEN prune --dry-run THEN shows would-delete", async () => {
      for (let i = 1; i <= 10; i++) {
        const sessionId = `2026-01-${String(i).padStart(2, "0")}_10-00-00`;
        await writeFile(
          join(sessionsDir, "todo", `${sessionId}.md`),
          `# Session ${i}`,
        );
      }

      const { exitCode, stdout } = await execa(
        "node",
        ["bin/spx.js", "session", "prune", "--dry-run", "--sessions-dir", sessionsDir],
        { cwd: process.cwd() },
      );

      expect(exitCode).toBe(0);
      expect(stdout).toContain("Would delete 5 sessions");
    });

    it("GIVEN help flag WHEN prune --help THEN shows usage", async () => {
      const { exitCode, stdout } = await execa(
        "node",
        ["bin/spx.js", "session", "prune", "--help"],
        { cwd: process.cwd() },
      );

      expect(exitCode).toBe(0);
      expect(stdout).toContain("--keep");
      expect(stdout).toContain("--dry-run");
    });
  });

  describe("archive command", () => {
    it("GIVEN session in todo WHEN archive THEN moves to archive", async () => {
      const sessionId = "2026-01-15_10-00-00";
      await writeFile(
        join(sessionsDir, "todo", `${sessionId}.md`),
        "# Test Session",
      );

      const { exitCode, stdout } = await execa(
        "node",
        ["bin/spx.js", "session", "archive", sessionId, "--sessions-dir", sessionsDir],
        { cwd: process.cwd() },
      );

      expect(exitCode).toBe(0);
      expect(stdout).toContain("Archived");
    });

    it("GIVEN non-existent session WHEN archive THEN shows error", async () => {
      const result = await execa(
        "node",
        ["bin/spx.js", "session", "archive", "nonexistent", "--sessions-dir", sessionsDir],
        { cwd: process.cwd(), reject: false },
      );

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain("not found");
    });
  });
});
```

## Architectural Requirements

### Relevant ADRs

1. [Session Directory Structure](./../../decisions/adr-21_session-directory-structure.md) - Directory layout

## Quality Requirements

### QR1: Consistent CLI Patterns

**Requirement:** Commands follow same patterns as other session commands
**Target:** Similar option naming, output format, error handling
**Validation:** Code review against pickup/release commands

### QR2: Exit Codes

**Requirement:** Non-zero exit codes for failures
**Target:** exit(1) for errors, exit(0) for success
**Validation:** Integration tests verify exit codes

## Completion Criteria

- [ ] All Level 2 integration tests pass
- [ ] `spx session prune` works with default keep=5
- [ ] `spx session prune --keep N` keeps N sessions
- [ ] `spx session prune --dry-run` shows without deleting
- [ ] `spx session archive <id>` moves to archive
- [ ] Help text shows all options
- [ ] Error messages are actionable
- [ ] Exit codes are correct (0 for success, non-zero for errors)
