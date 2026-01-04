# Story: Performance Benchmarks

## Functional Requirements

### FR1: Verify <100ms performance target

```gherkin
GIVEN fixture repo with 50 work items
WHEN running `spx status --json`
THEN complete in less than 100ms
```

This is the core success metric for Capability-21.

#### Files created/modified

1. `test/e2e/performance.e2e.test.ts` [new]: Implement performance benchmarks

### FR2: Measure performance across formats

```gherkin
GIVEN fixture repo
WHEN running status command with different formats
THEN all formats complete within performance budget
```

#### Files created/modified

1. `test/e2e/performance.e2e.test.ts` [modify]: Add format-specific benchmarks

## Testing Strategy

### Level Assignment

| Component              | Level | Justification                     |
| ---------------------- | ----- | --------------------------------- |
| Performance benchmarks | 3     | E2E with real CLI execution       |
| Timing measurement     | 3     | Real process execution time       |

### When to Escalate

This story uses Level 3 because:

- Must measure actual CLI process execution time
- End-to-end performance including all overhead
- Verifies capability success metric

## E2E Tests (Level 3)

```typescript
// test/e2e/performance.e2e.test.ts
import { describe, it, expect } from "vitest";
import { execa } from "execa";

describe("Performance: Core CLI", () => {
  it("GIVEN 50 work items WHEN running status --json THEN completes in <100ms", async () => {
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
    expect(result.summary.total).toBe(50);
  });

  it("GIVEN 50 work items WHEN running status (text) THEN completes in <100ms", async () => {
    const fixtureRoot = "test/fixtures/repos/sample-50-items";

    const startTime = Date.now();
    const { exitCode } = await execa("node", ["bin/spx.js", "status"], {
      cwd: fixtureRoot,
    });
    const elapsed = Date.now() - startTime;

    expect(exitCode).toBe(0);
    expect(elapsed).toBeLessThan(100);
  });

  it("GIVEN 50 work items WHEN running multiple times THEN performance consistent", async () => {
    const fixtureRoot = "test/fixtures/repos/sample-50-items";
    const times: number[] = [];

    // Run 5 times to check consistency
    for (let i = 0; i < 5; i++) {
      const startTime = Date.now();
      await execa("node", ["bin/spx.js", "status", "--json"], {
        cwd: fixtureRoot,
      });
      times.push(Date.now() - startTime);
    }

    // All runs should be under target
    expect(Math.max(...times)).toBeLessThan(100);

    // Calculate average and standard deviation
    const avg = times.reduce((a, b) => a + b) / times.length;
    console.log(`Average: ${avg}ms, Times: ${times.join(", ")}ms`);
  });
});
```

## Architectural Requirements

### Relevant ADRs

1. `context/4-testing-standards.md` - E2E performance testing

## Quality Requirements

### QR1: Success Metric

**Requirement:** Meet capability success metric
**Target:** <100ms for 50 work items
**Validation:** E2E test verifies target met

### QR2: Consistency

**Requirement:** Performance is consistent across runs
**Target:** Low variance in timing measurements
**Validation:** Multiple runs show consistent performance

### QR3: All Formats

**Requirement:** All output formats meet performance target
**Target:** Text, JSON, Markdown, Table all <100ms
**Validation:** E2E tests verify all formats

## Completion Criteria

- [ ] All Level 3 E2E tests pass
- [ ] <100ms target met for 50 work items
- [ ] Performance consistent across runs
- [ ] All formats within budget
- [ ] Benchmarks document actual performance

## Documentation

1. Performance benchmark results documented
2. Target vs actual performance recorded
3. Profiling notes if optimizations needed
