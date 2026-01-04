# Story: Multi-Format E2E

## Functional Requirements

### FR1: Verify all output formats work end-to-end

```gherkin
GIVEN fixture repository
WHEN running status with each format option
THEN all formats render correctly with same data
```

Formats to test:
- Text (default)
- JSON
- Markdown
- Table

#### Files created/modified

1. `test/e2e/formats.e2e.test.ts` [new]: Implement format E2E tests

### FR2: Verify format consistency

```gherkin
GIVEN fixture repository
WHEN running status with different formats
THEN all formats show same work item count and statuses
```

#### Files created/modified

1. `test/e2e/formats.e2e.test.ts` [modify]: Add consistency verification

## Testing Strategy

### Level Assignment

| Component           | Level | Justification                      |
| ------------------- | ----- | ---------------------------------- |
| Format rendering    | 3     | E2E with complete CLI workflow     |
| Data consistency    | 3     | Verifies end-to-end data integrity |

### When to Escalate

This story uses Level 3 because:

- Must verify complete workflow produces correct output
- Tests all formatters with real CLI execution
- Verifies data consistency across formats

## E2E Tests (Level 3)

```typescript
// test/e2e/formats.e2e.test.ts
import { describe, it, expect } from "vitest";
import { execa } from "execa";

describe("E2E: Output Formats", () => {
  const fixtureRoot = "test/fixtures/repos/sample-10-items";

  it("GIVEN fixture repo WHEN running status (text) THEN renders tree correctly", async () => {
    const { stdout, exitCode } = await execa("node", ["bin/spx.js", "status"], {
      cwd: fixtureRoot,
    });

    expect(exitCode).toBe(0);
    expect(stdout).toContain("capability-");
    expect(stdout).toContain("  feature-");
    expect(stdout).toContain("    story-");
  });

  it("GIVEN fixture repo WHEN running status --json THEN produces valid JSON", async () => {
    const { stdout, exitCode } = await execa("node", ["bin/spx.js", "status", "--json"], {
      cwd: fixtureRoot,
    });

    expect(exitCode).toBe(0);
    expect(() => JSON.parse(stdout)).not.toThrow();

    const result = JSON.parse(stdout);
    expect(result.summary).toBeDefined();
    expect(result.capabilities).toBeInstanceOf(Array);
  });

  it("GIVEN fixture repo WHEN running status --format markdown THEN produces markdown", async () => {
    const { stdout, exitCode } = await execa("node", ["bin/spx.js", "status", "--format", "markdown"], {
      cwd: fixtureRoot,
    });

    expect(exitCode).toBe(0);
    expect(stdout).toMatch(/^# capability-/m);
    expect(stdout).toMatch(/^## feature-/m);
    expect(stdout).toMatch(/^### story-/m);
  });

  it("GIVEN fixture repo WHEN running status --format table THEN produces table", async () => {
    const { stdout, exitCode } = await execa("node", ["bin/spx.js", "status", "--format", "table"], {
      cwd: fixtureRoot,
    });

    expect(exitCode).toBe(0);
    expect(stdout).toMatch(/\|.*\|/);
    expect(stdout).toContain("| Level");
  });

  it("GIVEN fixture repo WHEN running all formats THEN work item counts match", async () => {
    // Get JSON output as source of truth
    const { stdout: jsonOut } = await execa("node", ["bin/spx.js", "status", "--json"], {
      cwd: fixtureRoot,
    });
    const jsonData = JSON.parse(jsonOut);
    const expectedTotal = jsonData.summary.done + jsonData.summary.inProgress + jsonData.summary.open;

    // Verify text output mentions all work items
    const { stdout: textOut } = await execa("node", ["bin/spx.js", "status"], {
      cwd: fixtureRoot,
    });
    const textLines = textOut.split("\n").filter(l => l.match(/capability-|feature-|story-/));
    expect(textLines.length).toBe(expectedTotal);

    // Verify markdown has all work items
    const { stdout: mdOut } = await execa("node", ["bin/spx.js", "status", "--format", "markdown"], {
      cwd: fixtureRoot,
    });
    const mdHeadings = mdOut.split("\n").filter(l => l.match(/^#{1,3} /));
    expect(mdHeadings.length).toBe(expectedTotal);
  });
});
```

## Architectural Requirements

### Relevant ADRs

1. `context/4-testing-standards.md` - E2E testing with real CLI

## Quality Requirements

### QR1: Format Correctness

**Requirement:** Each format renders valid output
**Target:** JSON parseable, Markdown valid, Table aligned
**Validation:** E2E tests verify format validity

### QR2: Data Consistency

**Requirement:** All formats show same work items
**Target:** Same count and statuses across all formats
**Validation:** E2E test compares format outputs

### QR3: Complete Coverage

**Requirement:** Test all format options
**Target:** Text, JSON, Markdown, Table all tested
**Validation:** E2E test suite covers all formats

## Completion Criteria

- [ ] All Level 3 E2E tests pass
- [ ] All formats render correctly
- [ ] Data consistent across formats
- [ ] Format-specific features verified (JSON parse, Markdown headers, Table borders)

## Documentation

1. Examples of each format output
2. Format specification documented
3. Consistency guarantees explained
