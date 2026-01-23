# ADR: Type-Derived Testing

## Problem

Tests that hardcode type names, hierarchy depth, or magic strings break silently when the domain model changes. A test comparing `expect(next?.slug).toBe("first")` passes today but provides no confidence that renaming `"capability"` to `"epic"` would be caught.

## Context

- **Business**: spx manages hierarchical work items (capability → feature → story). The hierarchy depth and kind names may evolve.
- **Technical**: TypeScript provides `WorkItemKind` type and `WORK_ITEM_KINDS` constant. Tests should derive structure from these, not hardcode assumptions.

## Decision

**All tests involving hierarchical structures must derive type names and depth from the type system, not hardcode them.**

## Rationale

During bug fix for `spx spec next`, initial test proposals hardcoded:

- Kind strings: `"capability"`, `"feature"`, `"story"`
- Hierarchy depth: 3 nested loops
- Magic slugs: `"first"`, `"second"` for comparison

Each required correction:

1. Hardcoded kinds → Use `WORK_ITEM_KINDS` constant
2. Fixed depth → Use recursive/iterative approach based on `WORK_ITEM_KINDS.length`
3. Magic strings → Use object reference comparison

The type system already encodes these constraints. Tests should leverage it.

## Trade-offs Accepted

- **Slightly more complex test setup**: Builders like `buildTreePath(bspNumbers[])` require understanding array-to-hierarchy mapping. Mitigated by clear documentation and single builder location.
- **Generated test case descriptions less readable**: `level 0 (capability)` vs `lower capability wins`. Mitigated by including kind name in description via `WORK_ITEM_KINDS[level]`.

## Testing Strategy

### Level Coverage

| Level    | Question Answered                          | Scope              |
| -------- | ------------------------------------------ | ------------------ |
| 1 (Unit) | Does BSP ordering respect hierarchy depth? | `findNextWorkItem` |

### Behaviors Verified

**Level 1 (Unit):**

- Given two paths differing at level L, the path with lower BSP at level L wins
- This holds for all levels from 0 to DEPTH-1
- Tree insertion order does not affect result (tree assumed pre-sorted)

## Validation

### How to Recognize Compliance

You're following this decision if:

- Test data uses `WORK_ITEM_KINDS` for kind values, not string literals
- Test logic uses `WORK_ITEM_KINDS.length` for depth, not hardcoded loops
- Assertions compare by object reference, not by slug/string matching

### MUST

- Derive hierarchy kinds from `WORK_ITEM_KINDS` constant
- Use `WORK_ITEM_KINDS.length` for any depth-dependent logic
- Use object reference comparison (`toBe`) for node assertions
- Generate test cases programmatically when testing across hierarchy levels

### NEVER

- Hardcode `"capability"`, `"feature"`, `"story"` in test logic
- Use fixed nested loops (3 levels) when hierarchy could change
- Compare nodes by slug or other string properties
- Write separate test cases for each hierarchy level manually
