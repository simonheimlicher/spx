# Feature: Advanced Session Operations

## Observable Outcome

Users can clean up old **archived** sessions with `spx session prune` and move completed sessions to archive with `spx session archive`, keeping the sessions directory organized.

## Testing Strategy

> Features require **Level 1 + Level 2** to prove the feature works with real tools.
> See [testing standards](/docs/development/testing/standards.md) for level definitions.

### Level Assignment

| Component                   | Level | Justification                             |
| --------------------------- | ----- | ----------------------------------------- |
| Session sorting             | 1     | Pure function: sessions → sorted list     |
| Keep N logic                | 1     | Pure function: count → sessions to delete |
| Pattern matching            | 1     | Pure function: pattern → filter predicate |
| Prune archive file deletion | 2     | Needs real filesystem                     |
| Archive file movement       | 2     | Needs real filesystem                     |

### Escalation Rationale

- **1 → 2**: Unit tests verify sorting and selection logic; integration tests verify actual file deletion from archive and movement to archive

## Feature Integration Tests (Level 2)

These tests verify that **cleanup operations** work correctly.

### FI1: Prune keeps N most recent archived sessions

```typescript
// tests/integration/session/advanced-operations.integration.test.ts
describe("Feature: Advanced Session Operations", () => {
  it("GIVEN 10 archived sessions WHEN prune --keep 5 THEN 5 oldest deleted", async () => {
    // Given: 10 sessions in archive
    const { sessionsDir } = await createTempSessionsDir();
    const sessionIds = [];
    for (let i = 0; i < 10; i++) {
      sessionIds.push(await createArchivedSession(sessionsDir, { content: `Session ${i}` }));
      await sleep(10); // Ensure distinct timestamps
    }

    // When: Prune with keep 5
    await pruneSession(sessionsDir, { keep: 5 });

    // Then: 5 most recent remain in archive
    const remaining = await listSessions(sessionsDir, { status: "archive" });
    expect(remaining).toHaveLength(5);
    // Most recent 5 should remain
    const remainingIds = remaining.map(s => s.id);
    sessionIds.slice(-5).forEach(id => {
      expect(remainingIds).toContain(id);
    });
  });
});
```

### FI2: Prune default keeps 5 archived sessions

```typescript
describe("Feature: Advanced Session Operations", () => {
  it("GIVEN 8 archived sessions WHEN prune (no args) THEN keeps 5", async () => {
    // Given: 8 sessions in archive
    const { sessionsDir } = await createTempSessionsDir();
    for (let i = 0; i < 8; i++) {
      await createArchivedSession(sessionsDir, { content: `Session ${i}` });
      await sleep(10);
    }

    // When: Prune with default
    await pruneSession(sessionsDir);

    // Then: 5 remain in archive
    const remaining = await listSessions(sessionsDir, { status: "archive" });
    expect(remaining).toHaveLength(5);
  });
});
```

### FI3: Archive moves to archive directory

```typescript
describe("Feature: Advanced Session Operations", () => {
  it("GIVEN session in todo WHEN archive THEN session moves to archive", async () => {
    // Given: Session in todo
    const { sessionsDir } = await createTempSessionsDir();
    const sessionId = await createSession(sessionsDir, { content: testContent });

    // When: Archive session
    await archiveSession(sessionsDir, sessionId);

    // Then: Session in archive, not in todo
    expect(await fileExists(path.join(sessionsDir, "archive", `${sessionId}.md`))).toBe(true);
    expect(await fileExists(path.join(sessionsDir, "todo", `${sessionId}.md`))).toBe(false);
  });
});
```

## Capability Contribution

This feature provides maintenance operations:

- **Prune** prevents unbounded growth of archive directory by keeping only N most recent archived sessions
- **Archive** moves completed sessions from todo/doing to archive for historical reference

Depends on: [Core Operations](./../feature-21_core-operations/core-operations.feature.md) for list/delete primitives

## Completion Criteria

- [ ] All Level 1 tests pass (via story completion)
- [ ] All Level 2 integration tests pass
- [ ] `spx session prune` keeps 5 archived sessions by default
- [ ] `spx session prune --keep N` keeps N most recent archived sessions
- [ ] `spx session archive <id>` moves session to archive directory

**Note**: To see current stories in this feature, use `ls` or `find` to list story directories (e.g., `story-*`) within the feature's directory.
