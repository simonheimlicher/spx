# ADR-21: Type-Derived Code

## Problem

Code that hardcodes type names, hierarchy depth, or magic strings breaks silently when the domain model changes. Both production code checking `if (node.kind === "story")` and tests comparing `expect(next?.slug).toBe("first")` fail to adapt when the hierarchy evolves.

## Context

- **Business**: spx manages hierarchical work items (capability → feature → story). The hierarchy depth and kind names may evolve.
- **Technical**: TypeScript provides `WorkItemKind` type. Both production and test code should derive structure from shared constants, not hardcode assumptions.

## Decision

**All code involving hierarchical structures must derive type names and depth from the type system, not hardcode them.**

This applies to:

- Production code (e.g., checking if a node is a leaf)
- Test code (e.g., generating test cases for each hierarchy level)
- Test fixtures (e.g., building synthetic trees)

## Source of Truth

**`src/types.ts`** defines the canonical constants:

```typescript
export const WORK_ITEM_KINDS: readonly WorkItemKind[] = [
  "capability",
  "feature",
  "story",
] as const;

export const LEAF_KIND: WorkItemKind = WORK_ITEM_KINDS.at(-1)!;
```

Test fixtures re-export from production code:

```typescript
// tests/fixtures/constants.ts
export { LEAF_KIND, WORK_ITEM_KINDS } from "@/types";
```

## Rationale

During bug fix for `spx spec next`, both production and test code hardcoded assumptions:

**Production code**:

- Checked `node.kind === "story"` instead of `node.kind === LEAF_KIND`

**Test code**:

- Used kind strings: `"capability"`, `"feature"`, `"story"`
- Used hierarchy depth: 3 nested loops
- Used magic slugs: `"first"`, `"second"` for comparison

Each required correction to derive from the type system.

## Trade-offs Accepted

- **Slightly more complex code**: Using `LEAF_KIND` instead of `"story"` requires understanding the constant. Mitigated by clear documentation.
- **Generated test case descriptions less readable**: `level 0 (capability)` vs `lower capability wins`. Mitigated by including kind name in description via `WORK_ITEM_KINDS[level]`.

## Validation

### How to Recognize Compliance

You're following this decision if:

- Production code uses `LEAF_KIND` to identify actionable work items
- Test data uses `WORK_ITEM_KINDS` for kind values, not string literals
- Test logic uses `WORK_ITEM_KINDS.length` for depth, not hardcoded loops
- Assertions compare by object reference, not by slug/string matching

### MUST

**Production code**:

- Use `LEAF_KIND` to check if a node is an actionable work item
- Use `WORK_ITEM_KINDS` when iterating over all kinds

**Test code**:

- Derive hierarchy kinds from `WORK_ITEM_KINDS` constant
- Use `WORK_ITEM_KINDS.length` for any depth-dependent logic
- Use object reference comparison (`toBe`) for node assertions
- Generate test cases programmatically when testing across hierarchy levels

### NEVER

- Hardcode `"capability"`, `"feature"`, `"story"` in production or test logic
- Hardcode `"story"` when checking for leaf nodes
- Use fixed nested loops (3 levels) when hierarchy could change
- Compare nodes by slug or other string properties
- Write separate test cases for each hierarchy level manually
