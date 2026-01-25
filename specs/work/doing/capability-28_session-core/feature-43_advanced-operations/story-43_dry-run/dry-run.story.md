# Story: Dry Run Mode

## Functional Requirements

### FR1: Show what would be deleted without deleting

```gherkin
GIVEN sessions selected for pruning
WHEN pruneSessions({ dryRun: true }) is called
THEN selected sessions are returned but NOT deleted
```

#### Files created/modified

1. `src/session/prune.ts` [modify]: Add dryRun option

### FR2: Format output to distinguish dry-run from actual run

```gherkin
GIVEN dry-run mode is active
WHEN prune results are formatted
THEN output clearly indicates "would delete" not "deleted"
```

#### Files created/modified

1. `src/session/prune.ts` [modify]: Add result type distinction

### FR3: Return identical selection as real prune

```gherkin
GIVEN 10 sessions and keep=5
WHEN pruneSessions({ keep: 5, dryRun: true }) is called
THEN returns same 5 sessions that pruneSessions({ keep: 5 }) would delete
```

#### Files created/modified

1. `src/session/prune.ts` [modify]: Share selection logic

## Testing Strategy

> Stories require **Level 1** to prove core logic works.
> See [testing standards](/docs/development/testing/standards.md) for level definitions.

### Level Assignment

| Component            | Level | Justification                             |
| -------------------- | ----- | ----------------------------------------- |
| Dry-run flag parsing | 1     | Pure function: options → boolean          |
| Result type creation | 1     | Pure function: selection → dry-run result |

### When to Escalate

This story stays at Level 1 because:

- Dry-run mode reuses selection logic from story-21
- Actual file deletion (or lack thereof) tested at feature level

## Unit Tests (Level 1)

```typescript
// tests/unit/session/dry-run.test.ts
import { describe, expect, it } from "vitest";
import { formatPruneResult, selectSessionsToDelete } from "../../../src/session/prune";
import { createSession } from "../../fixtures/factories";

describe("dry-run mode", () => {
  it("GIVEN dryRun=true WHEN selecting THEN returns same sessions as real prune", () => {
    // Given
    const sessions = Array.from({ length: 10 }, (_, i) => createSession({ id: `2026-01-${String(i + 1).padStart(2, "0")}_10-00-00` }));

    // When
    const dryRunResult = selectSessionsToDelete(sessions, { keep: 5 });
    const realResult = selectSessionsToDelete(sessions, { keep: 5 });

    // Then - same selection
    expect(dryRunResult.map(s => s.id)).toEqual(realResult.map(s => s.id));
  });

  it("GIVEN dry-run result WHEN formatted THEN indicates would-delete", () => {
    // Given
    const toDelete = [
      createSession({ id: "2026-01-01_10-00-00" }),
      createSession({ id: "2026-01-02_10-00-00" }),
    ];

    // When
    const result = formatPruneResult(toDelete, { dryRun: true });

    // Then
    expect(result.action).toBe("would-delete");
    expect(result.sessions).toHaveLength(2);
  });

  it("GIVEN real prune result WHEN formatted THEN indicates deleted", () => {
    // Given
    const deleted = [
      createSession({ id: "2026-01-01_10-00-00" }),
    ];

    // When
    const result = formatPruneResult(deleted, { dryRun: false });

    // Then
    expect(result.action).toBe("deleted");
  });
});
```

## Architectural Requirements

### Relevant ADRs

1. [Session Directory Structure](./../../decisions/adr-21_session-directory-structure.md) - Directory layout
2. [Timestamp Format](./../../decisions/adr-32_timestamp-format.md) - Sorting by timestamp

## Quality Requirements

### QR1: Deterministic Output

**Requirement:** Same sessions selected in dry-run and real mode
**Target:** Identical session lists regardless of dryRun flag
**Validation:** Unit test comparing both modes

### QR2: Clear Visual Distinction

**Requirement:** User must be able to distinguish dry-run output from real output
**Target:** Output prefix or indicator for dry-run mode
**Validation:** Integration test verifies output contains "would" or similar

## Completion Criteria

- [ ] All Level 1 unit tests pass
- [ ] `dryRun: true` returns sessions without deleting
- [ ] Same selection logic used for dry-run and real prune
- [ ] Output format clearly indicates dry-run mode
