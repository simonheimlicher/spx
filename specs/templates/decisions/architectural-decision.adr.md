# ADR NNN: [Decision Title]

## Problem

[1-3 sentences. What's broken, missing, or unclear? No wrapper sections.]

## Context

- **Business**: [Why this matters to users/product]
- **Technical**: [Existing systems, language, constraints]

## Decision

**[The actual decision in one sentence.]**

## Rationale

[Why this decision. What alternatives were considered and why rejected. This is coherent reasoning, not a manufactured list of pros/cons. The argument should flow naturally and reference specific constraints that made this the right choice.]

## Trade-offs Accepted

- **[Trade-off]**: [Mitigation or acceptance reasoning]
- **[Trade-off]**: [Mitigation or acceptance reasoning]

## Testing Strategy

> **Architect**: Invoke the following skills efore writing this section:
>
> 1. `spx-claude:test` skill
> 2. `spx-claude:{language}-test` where `{language}` is the language-specific skill
>
> This section is the contract between architect and coder.

### Level Coverage

| Level           | Question Answered                             | Scope                |
| --------------- | --------------------------------------------- | -------------------- |
| 1 (Unit)        | [What uncertainty does unit testing resolve?] | [Components covered] |
| 2 (Integration) | [What uncertainty does integration resolve?]  | [Components covered] |
| 3 (E2E)         | [What uncertainty does E2E resolve?]          | [Workflows covered]  |

*Delete rows for levels not needed. Every level included must have escalation rationale.*

### Escalation Rationale

- **1 → 2**: [What unit tests cannot verify] → [What integration adds]
- **2 → 3**: [What integration cannot verify] → [What E2E adds]

*Only include escalation paths for levels present in Level Coverage.*

### Test Harness

| Level | Harness        | Location/Dependency                                   |
| ----- | -------------- | ----------------------------------------------------- |
| 2     | [Harness name] | `path/to/harness.ts` or "Built by Feature NN"         |
| 3     | [Harness name] | `path/to/harness.ts` or "Built by ADR-NNN/Feature NN" |

*Level 1 typically needs no harness (pure functions). Include only levels that require test infrastructure.*

### Behaviors Verified

**Level 1 (Unit):**

- [Specific testable behavior for pure functions/modules]

**Level 2 (Integration):**

- [Specific testable behavior involving component collaboration]

**Level 3 (E2E):**

- [Specific user workflow from start to finish]

*Behaviors should be concrete and testable, not vague ("test the X").*

## Validation

### How to Recognize Compliance

You're following this decision if:

- [Concrete recognition criterion]
- [Concrete recognition criterion]

### MUST

- [Mandatory rule — violation breaks the architecture]
- [Mandatory rule]

### NEVER

- [Prohibition — doing this violates the decision]
- [Prohibition]
