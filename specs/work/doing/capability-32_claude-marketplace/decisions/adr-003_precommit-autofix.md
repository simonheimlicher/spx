# ADR 003: Pre-commit Hook Auto-fix and Stage Behavior

## Problem

When SKILL.md files are modified but JSON manifests are not updated, commits will contain drift. Need to decide how pre-commit hooks should handle this: block, warn, or auto-fix.

## Context

- **Business**: Developers want fast, non-blocking workflows; manual JSON updates are friction
- **Technical**: Pre-commit hooks can modify files and stage them; lefthook/husky support this pattern

## Decision

**Pre-commit hooks automatically regenerate out-of-sync JSON files and stage them, allowing the commit to proceed.**

## Rationale

Three behaviors were considered:

1. **Block commit + show diff** — Rejected because creates friction; requires manual intervention; breaks flow
2. **Warn only** — Rejected because drift still gets committed; warning fatigue leads to ignoring
3. **Auto-fix + stage** — Chosen because:
   - Zero friction for developers
   - Drift is automatically corrected
   - JSON is always in sync with committed SKILL.md
   - Follows "make the right thing easy" principle

The auto-fix behavior assumes JSON is a derived artifact (per ADR-001). Since JSON can always be regenerated from SKILL.md, auto-fixing is safe and non-destructive.

Edge case handling:

- If SKILL.md has syntax errors → Hook fails with clear error message (blocking)
- If JSON has uncommitted manual edits → Auto-fix overwrites (with warning); manual edits are not preserved

## Trade-offs Accepted

- **Manual JSON edits lost**: Any manual JSON customization is overwritten. Mitigation: ADR-001 establishes SKILL.md as source of truth; no valid use case for manual JSON edits.
- **Commit includes unexpected files**: Developers may be surprised by auto-staged JSON. Mitigation: Clear hook output showing what was regenerated.
- **Slower commits**: Hook adds overhead for JSON regeneration. Mitigation: Only regenerate changed plugins; target <500ms.

## Testing Strategy

### Level Coverage

| Level           | Question Answered                         | Scope                             |
| --------------- | ----------------------------------------- | --------------------------------- |
| 2 (Integration) | Does hook correctly detect and fix drift? | Hook script + spx claude commands |

### Escalation Rationale

- **Direct to 2**: Hook behavior requires real git staging area; pure unit tests cannot verify git integration

### Test Harness

| Level | Harness                 | Location/Dependency                       |
| ----- | ----------------------- | ----------------------------------------- |
| 2     | Git-initialized fixture | `test/fixtures/marketplace/with-history/` |

### Behaviors Verified

**Level 2 (Integration):**

- Hook detects when SKILL.md is staged but JSON is not updated
- Hook regenerates JSON via `spx marketplace update --staged` and stages it
- Hook exits 0 after successful auto-fix
- Hook exits non-zero with error message on SKILL.md syntax error
- Hook warns when overwriting manual JSON edits

## Validation

### How to Recognize Compliance

You're following this decision if:

- Pre-commit hook is configured to run `spx marketplace update --staged`
- Hook output shows which files were regenerated
- Commits always include updated JSON when SKILL.md changes

### MUST

- Regenerate JSON for any staged SKILL.md with drift
- Stage regenerated JSON files automatically
- Exit 0 after successful auto-fix
- Exit non-zero with clear error on SKILL.md syntax errors
- Show warning when overwriting uncommitted JSON changes

### NEVER

- Block commits for fixable drift (auto-fix instead)
- Silently overwrite manual edits (must warn)
- Regenerate unchanged plugins (performance)
