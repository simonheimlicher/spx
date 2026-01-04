# Feature: E2E Workflow

## Observable Outcome

Complete end-to-end capability tests verify the entire workflow:

- **Performance**: Status analysis completes in <100ms for 50 work items
- **Correctness**: All work item states are accurately detected
- **Formats**: All output formats render correctly
- **Reliability**: Works across different repository structures

This feature contains the E2E tests that prove Capability-21 is complete.

## Testing Strategy

> Features require **Level 1 + Level 2** to prove the feature works with real tools.
> See `context/4-testing-standards.md` for level definitions.

### Level Assignment

| Component                | Level | Justification                        |
| ------------------------ | ----- | ------------------------------------ |
| E2E fixtures             | 3     | Complete repository structures       |
| Performance benchmarks   | 3     | Real-world performance measurement   |
| Multi-format validation  | 3     | Complete output format verification  |
| Error scenarios          | 3     | Complete error handling workflows    |

### Escalation Rationale

- **2 → 3**: E2E tests verify the complete user journey delivers value within performance targets

## E2E Tests (Level 3)

```typescript
// test/e2e/core-cli.e2e.test.ts
describe("Capability: Core CLI - E2E", () => {
  it("GIVEN fixture repo with 50 work items WHEN running spx status --json THEN completes in <100ms", async () => {
    // Given
    const fixtureRoot = "test/fixtures/repos/sample-50-items";

    // When
    const startTime = Date.now();
    const { stdout, exitCode } = await execa("node", ["bin/spx.js", "status", "--json"], {
      cwd: fixtureRoot,
    });
    const elapsed = Date.now() - startTime;

    // Then
    expect(exitCode).toBe(0);
    expect(elapsed).toBeLessThan(100);

    const result = JSON.parse(stdout);
    expect(result).toHaveProperty("summary");
    expect(result.summary).toMatchObject({
      done: expect.any(Number),
      inProgress: expect.any(Number),
      open: expect.any(Number),
    });
  });

  it("GIVEN fixture repo WHEN requesting different formats THEN all formats render correctly", async () => {
    const fixtureRoot = "test/fixtures/repos/sample-10-items";

    // JSON format
    const jsonResult = await execa("node", ["bin/spx.js", "status", "--json"], { cwd: fixtureRoot });
    expect(() => JSON.parse(jsonResult.stdout)).not.toThrow();

    // Text format (default)
    const textResult = await execa("node", ["bin/spx.js", "status"], { cwd: fixtureRoot });
    expect(textResult.stdout).toContain("specs/doing/");

    // Markdown format
    const mdResult = await execa("node", ["bin/spx.js", "status", "--format", "markdown"], { cwd: fixtureRoot });
    expect(mdResult.stdout).toContain("#");

    // Table format
    const tableResult = await execa("node", ["bin/spx.js", "status", "--format", "table"], { cwd: fixtureRoot });
    expect(tableResult.stdout).toMatch(/\|.*\|/);
  });

  it("GIVEN work items in mixed states WHEN running status THEN detects all states correctly", async () => {
    const fixtureRoot = "test/fixtures/repos/mixed-states";

    const { stdout } = await execa("node", ["bin/spx.js", "status", "--json"], { cwd: fixtureRoot });
    const result = JSON.parse(stdout);

    expect(result.summary.done).toBeGreaterThan(0);
    expect(result.summary.inProgress).toBeGreaterThan(0);
    expect(result.summary.open).toBeGreaterThan(0);
  });
});
```

## Capability Contribution

This feature provides the E2E tests that prove Capability-21 is complete and meets its success metric (<100ms for 50 work items).

## Completion Criteria

- [ ] All Level 3 E2E tests pass
- [ ] All 4 stories completed
- [ ] Success metric achieved: <100ms for 50 work items
- [ ] All output formats work end-to-end
- [ ] Error scenarios handled gracefully
- [ ] 100% type coverage

**Proposed Stories**:
- story-21: E2E test fixtures (repos with 10, 50 work items)
- story-32: Performance benchmarks (<100ms target)
- story-43: Multi-format output E2E tests
- story-54: Error scenario E2E tests

**Note**: This feature marks Capability-21 as DONE when complete.
