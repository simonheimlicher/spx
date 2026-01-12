# Feature: Settings Consolidation

## Observable Outcome

The `spx claude settings consolidate` command successfully consolidates all project-local Claude Code permissions into the global settings file:

- Discovers all `.claude/settings.local.json` files recursively under a root directory (default: `~/Code/`)
- Merges permissions with subsumption-based deduplication (removes narrower permissions when broader exists)
- Resolves conflicts with security-first approach (deny always wins over allow)
- Creates timestamped backups before modifying global settings
- Supports dry-run mode for safe preview
- Processes 20 projects in <2 seconds with zero duplicate permissions after consolidation

## Testing Strategy

> Features require **Level 1 + Level 2** to prove the feature works with real tools.
> See [docs/testing/standards.md](../../../../docs/testing/standards.md) for level definitions.

### Level Assignment

| Component                       | Level | Justification                                                                |
| ------------------------------- | ----- | ---------------------------------------------------------------------------- |
| Permission parsing/merging      | 1     | Pure functions operating on data structures                                  |
| Conflict resolution logic       | 1     | Pure logic: given allow/deny sets, prefer deny                               |
| Settings file discovery         | 1     | FS operations with `os.tmpdir()` fixtures (standard tools)                   |
| Settings JSON read/write        | 1     | FS operations with temp fixtures (standard tools)                            |
| Backup creation                 | 1     | FS operations with temp fixtures (standard tools)                            |
| Settings consolidation workflow | 2     | Integrates with real Claude Code settings structure across multiple projects |

### Escalation Rationale

- **1 → 2**: Unit tests with real FS operations prove core functionality (discovery, parsing, merging, backup), but Level 2 verifies integration with Claude Code settings file structure and multi-project consolidation workflow

## Feature Integration Tests (Level 2)

### Integration Test: Multi-Project Consolidation

```typescript
// tests/integration/claude/settings-consolidation.integration.test.ts
import { execa } from "execa";
import fs from "fs/promises";
import path from "path";
import { describe, expect, it } from "vitest";

describe("Feature: Settings Consolidation", () => {
  it("GIVEN 20 projects with local permissions WHEN running consolidate THEN all permissions merged in <2s", async () => {
    // Given: 20 projects with various permissions
    const tempHome = await createTempHome();
    const projectsRoot = path.join(tempHome, "Code");

    await createMultiProjectFixture(projectsRoot, 20, {
      commonPermissions: ["Bash(git:*)", "Bash(npm:*)"],
      uniquePermissionsPerProject: 3,
      conflictingPermissions: ["Bash(docker:*)"], // Some allow, some deny
    });

    // When: Run consolidation
    const startTime = Date.now();
    const { exitCode, stdout } = await execa("spx", [
      "claude",
      "settings",
      "consolidate",
      "--root",
      projectsRoot,
    ], {
      env: { HOME: tempHome },
    });
    const elapsed = Date.now() - startTime;

    // Then: Consolidation completes quickly
    expect(exitCode).toBe(0);
    expect(elapsed).toBeLessThan(2000); // < 2s for 20 projects

    // Verify all files scanned
    expect(stdout).toContain("Files scanned: 20");

    // Verify backup created
    expect(stdout).toMatch(/Backup created:.*settings\.json\.backup/);

    // Verify global settings updated
    const globalSettings = await readJson(
      path.join(tempHome, ".claude/settings.json"),
    );

    // Common permissions should appear exactly once
    expect(globalSettings.allow).toContain("Bash(git:*)");
    expect(globalSettings.allow).toContain("Bash(npm:*)");
    expect(
      globalSettings.allow.filter((p: string) => p === "Bash(git:*)").length,
    ).toBe(1);

    // Conflicts resolved (prefer deny)
    expect(stdout).toContain("Conflict detected");
    expect(globalSettings.deny).toContain("Bash(docker:*)");
    expect(globalSettings.allow).not.toContain("Bash(docker:*)");

    // Verify backup exists and is valid
    const backupFiles = await glob(
      path.join(tempHome, ".claude/settings.json.backup.*"),
    );
    expect(backupFiles.length).toBe(1);
  });
});
```

## Capability Contribution

This feature enables the permission consolidation workflow in [capability-33 (Claude Code Settings Management)](../claude-settings.capability.md):

- Provides core consolidation command for `spx claude settings consolidate`
- Implements subsumption-based deduplication per [ADR-001](../decisions/adr-001_subsumption-over-deduplication.md)
- Implements security-first conflict resolution per [ADR-002](../decisions/adr-002_security-first-conflict-resolution.md)
- Implements atomic writes with backups per [ADR-003](../decisions/adr-003_atomic-writes-with-temp-files.md)
- Achieves capability success metric: processes 20 projects in <2s with zero duplicate permissions

## Completion Criteria

- [ ] All Level 1 tests pass (via story completion)
- [ ] All Level 2 tests pass (integration test above)
- [ ] All stories completed:
  - [ ] Story-21: Discovery and parsing
  - [ ] Story-32: Subsumption and merging
  - [ ] Story-43: Backup, writing, and reporting
- [ ] ADRs fully implemented:
  - [ ] ADR-001: Subsumption algorithm with property-based tests
  - [ ] ADR-002: Conflict resolution with property-based tests
  - [ ] ADR-003: Atomic writes with dependency injection
- [ ] Performance target achieved: <2s for 20 projects
- [ ] Zero duplicate permissions after consolidation
- [ ] Backup safety mechanism verified
- [ ] Dry-run mode prevents all file modifications
- [ ] No mocking used (DI pattern throughout)

**Note**: To see current stories in this feature, use `ls` or `find` to list story directories (e.g., `story-*`) within the feature's directory.
