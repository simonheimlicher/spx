# PRD: Spec Domain

> **Purpose**: Defines the spec domain for spx—the philosophy and requirements for consistency-driven product specification.
>
> **Specs Are the Product**: The hierarchy of capabilities, features, and stories defines what the product does. Tests prove those claims. Evidence connects the claims to the proof. This isn't documentation—it's the product definition.
>
> **Consistency, Not Completion**: The goal isn't to mark things "done"—it's to keep specs, evidence, and tests in agreement. When any layer changes, validation shows what's out of sync.

## Spec Structure

Specs live directly under `specs/` with no workflow folders:

```
specs/
├── CLAUDE.md
├── spx-platform.prd.md              ← Product-level ideas (PRD)
├── capability-15_infrastructure/
│   ├── infrastructure.capability.md
│   ├── infrastructure.prd.md        ← Capability-level ideas (optional)
│   └── feature-21_validation/
│       ├── validation.feature.md
│       └── story-21_schema/
│           ├── schema.story.md
│           └── tests/evidence.yaml  ← Proves implementation
└── capability-27_spec-domain/
    └── ...
```

**Key distinction**:

- **PRD/TRD** = Ideas and direction (inform specs, no evidence needed)
- **Capability/Feature/Story** = Product requirements at different granularities (need evidence when implemented)

## Addressing Scheme

All specs are addressed using fully qualified paths:

**Canonical output format:**

```
c15/f21/s99
```

**Lenient input parsing** (all resolve to same address):

| Input                                           | Valid?                  |
| ----------------------------------------------- | ----------------------- |
| `c15/f21/s99`                                   | ✓                       |
| `15/21/99`                                      | ✓                       |
| `capability-15/feature-21/story-99`             | ✓                       |
| `capability-15_foo/feature-21_bar/story-99_baz` | ✓                       |
| `s99`                                           | ✗ (not fully qualified) |
| `story-99`                                      | ✗ (not fully qualified) |

**Rule**: Must have all three levels with two-digit BSP numbers to be valid.

## Required Sections

| Section          | Purpose                                                                    |
| ---------------- | -------------------------------------------------------------------------- |
| Product Vision   | User problem, value proposition, customer journey, and user assumptions    |
| Expected Outcome | Quantified measurable outcome with evidence metrics                        |
| Acceptance Tests | Complete E2E journey test and Gherkin scenarios proving measurable outcome |
| Scope Definition | Explicit boundaries: what's included, what's excluded, and why             |
| Product Approach | Interaction model, UX principles, technical approach (triggers ADRs)       |
| Success Criteria | User outcomes, quality attributes, definition of "done"                    |
| Open Decisions   | Questions for user, ADR triggers, product trade-offs                       |
| Dependencies     | Spec, customer-facing, technical, and performance requirements             |
| Pre-Mortem       | Assumptions to validate (adoption, performance, platform, scope)           |

## Testing Methodology

This PRD follows the three-tier testing methodology for acceptance validation:

- **Level 1 (Unit)**: Component logic with dependency injection. No external systems.
- **Level 2 (Integration)**: Real infrastructure via test harnesses. No mocking.
- **Level 3 (E2E)**: Real credentials and services. Full user workflows validating measurable outcome.

**Build confidence bottom-up**: Level 1 → Level 2 → Level 3.

## Product Vision

### User Problem

**Who** are we building for?

AI coding agents and developers using the SPX framework who need fast, deterministic answers to "what requirement should I implement next?" and reliable verification that requirements are fulfilled.

**What** problem do they face?

```
As an AI coding agent, I am frustrated by ambiguous or slow status checks
because determining spec status requires LLM judgment or file scanning,
which wastes tokens, introduces non-determinism, and prevents reliable automation.
```

### Current Customer Pain

**Core Problems**:

1. **Stale tests**: Graduated tests become orphaned when specs change, breaking CI with no clear ownership
2. **Missing evidence chain**: No verifiable link between spec requirements and test evidence
3. **Drift detection**: No mechanism to detect when spec changes invalidate existing tests
4. **Manual status tracking**: DONE.md is a boolean flag with no structured evidence

**Symptoms**:

- CI breaks with no clear path to fix (which story owns the failing test?)
- Tests exist in `tests/` with no connection to the spec they verify
- Specs change but tests aren't updated, creating false confidence
- Agents can't determine if a "DONE" item is truly verified

**Root Cause**: Status is tracked as a boolean (DONE.md exists), not as verifiable evidence linking spec claims to test proof.

**Customer Impact**: Unreliable automation, broken CI, wasted time debugging orphaned tests.

**Business Impact**: The deterministic promise of spx is undermined when evidence chains break.

### Customer Solution

```
Implement evidence-based completion tracking that links spec requirements to test evidence
through structured evidence.yaml files, enabling deterministic validation of the spec-test-code
chain, automatic orphan detection, and prevention of invalid states via git hooks.
```

### Customer Journey Context

- **Before**: Agent checks DONE.md exists, assumes requirement is fulfilled, later discovers tests are stale or missing
- **During**: Agent learns evidence.yaml structure, validation commands catch inconsistencies early
- **After**: Agent trusts `spx spec validate` to verify evidence chain; broken CI is immediately traceable to owning story

### User Assumptions

| Assumption Category  | Specific Assumption                             | Impact on Product Design                          |
| -------------------- | ----------------------------------------------- | ------------------------------------------------- |
| User Context         | Uses git for version control                    | Git commit tracking enables drift detection       |
| User Goals           | Wants deterministic answers, not options        | Single "next" item, not a list to choose from     |
| Technical Capability | Comfortable with YAML for structured data       | evidence.yaml is acceptable for evidence tracking |
| Workflow Pattern     | Works on one item at a time within a capability | Sequential BSP ordering is appropriate            |

## Design Principles

### 1. Same Question, Same Answer

Given the files on disk, the CLI always returns the same result. No guessing, no AI judgment, <100ms response.

### 2. Specs Are the Product

The hierarchy of capabilities, features, and stories defines what the product does:

- **Capability**: A vertical slice of the product that unlocks valuable outcomes, including functional and quality requirements
- **Feature**: A smaller vertical slice within a capability
- **Story**: An atomic requirement—the smallest unit of product behavior

These are requirement containers, not tasks. They describe outcomes and outputs, not activities. Directory structure mirrors product structure. Tests prove the specs. Evidence connects specs to their proof.

**Example: Authentication**

A capability describes an outcome without prescribing implementation:

```
capability-15_authentication/
├── feature-21_password-login/
├── feature-22_password-reset/
```

When the product evolves to support magic links and passkeys, features are added:

```
capability-15_authentication/
├── feature-21_password-login/        ← legacy, still works
├── feature-22_password-reset/        ← legacy, still works
├── feature-23_magic-link-login/      ← new
├── feature-24_passkey-login/         ← new
```

All four features coexist while users migrate. Once migration completes, legacy features are deleted:

```
capability-15_authentication/
├── feature-23_magic-link-login/
├── feature-24_passkey-login/
```

The capability remains unchanged—"users can authenticate" is the same outcome. Git preserves history of deleted features. The product **is** the current state of specs.

**Lifecycle implications:**

| Action               | What happens                                                   |
| -------------------- | -------------------------------------------------------------- |
| Delete a feature     | Its specs, evidence, and tests are deleted together—no orphans |
| Git history          | Preserves everything—nothing "archived" in the spec tree       |
| Capability unchanged | Same outcome, different requirements to achieve it             |

You don't "archive" completed requirements. You delete requirements that no longer apply to the product.

### 3. Keep It Consistent

The goal isn't to mark things "done"—it's to keep specs, evidence, and tests in agreement.

Consistency can break from any direction:

- **Spec changed** → evidence may not prove the new spec
- **Test deleted** → evidence references missing file
- **Test added** → no evidence links it to a spec

Validation shows what's out of sync. Agents and humans decide how to restore consistency.

### 4. Safe Scaffolding

Creating specs requires handling race conditions and calculating BSP numbers correctly. The CLI handles this so agents don't have to worry about concurrent creation or number collisions.

## Expected Outcome

### Measurable Outcome

```
Users will have complete traceability from specs to tests leading to 100% of graduated tests
being traceable to owning stories and 0 orphaned tests in CI, proven by spx spec validate
passing with no warnings at time of commit.
```

### Evidence of Success

| Metric             | Current                        | Target                            | Improvement                          |
| ------------------ | ------------------------------ | --------------------------------- | ------------------------------------ |
| Test Traceability  | 0% (no ownership tracking)     | 100% (all tests in evidence.yaml) | Complete chain from spec to test     |
| Orphaned Tests     | Unknown (currently 4+ failing) | 0 (all tests owned)               | Every test traceable to owning story |
| Status Reliability | Boolean (DONE.md exists)       | Verified (evidence.yaml valid)    | Confidence that DONE means verified  |
| Spec Creation      | Manual directory/file creation | CLI commands handle numbering     | Agents create specs reliably         |

## Acceptance Criteria

### User Scenarios

**Scenario: Agent implements story with evidence chain**

- Given a story spec exists
- When agent writes tests in `specs/.../story-NN/tests/`
- And agent moves passing tests to `tests/unit/`
- And agent creates `evidence.yaml` listing graduated test paths
- Then `spx spec status` shows story as IMPLEMENTED
- And `spx spec validate` passes

**Scenario: Validation detects orphaned tests**

- Given a test file in `tests/unit/` not in any evidence.yaml
- When user runs `spx spec validate`
- Then validation fails (exit code 1)
- And output identifies the orphaned test file
- And output suggests remediation (delete or add to evidence)

**Scenario: Validation detects stale evidence**

- Given evidence.yaml references non-existent test file
- When user runs `spx spec validate`
- Then validation fails with clear error identifying the missing test

**Scenario: Agent finds next incomplete spec**

- Given multiple specs with mixed status
- When agent runs `spx spec next`
- Then exactly one fully-qualified address is returned
- And it is the lowest-BSP item not IMPLEMENTED
- And response time is <100ms

**Scenario: Agent continues prior work**

- Given agent was working on capability-32 in prior session
- When agent runs `spx spec next capability-32`
- Then next item within capability-32 is returned
- And work in other capabilities is unaffected

**Scenario: Agent creates multiple stories**

- Given a feature exists with stories up to story-43
- When agent runs `spx spec append c33/f15/story --times 3`
- Then three new story directories are created with correct BSP numbering
- And each directory contains a template story spec file

**Scenario: Agent creates stories in multiple locations**

- Given features f-15 and f-27 exist in capability-33
- When agent runs `spx spec append c33/f15/story c33/f27/story`
- Then one story is created in each feature
- And BSP numbering is correct for each location

## Scope Definition

### What's Included

This capability includes:

- **evidence.yaml schema**: Structured format linking spec to test evidence
- **Status determination**: Using evidence.yaml presence
- **Validation command**: `spx spec validate` checking reference integrity
- **Orphan detection**: Finding tests not referenced by any evidence.yaml
- **Spec creation**: `spx spec append` and `spx spec insert` commands
- **Next item discovery**: `spx spec next` with optional scope filtering

### What's Explicitly Excluded

| Excluded Capability              | Rationale                                                    |
| -------------------------------- | ------------------------------------------------------------ |
| Automatic test graduation        | Agent/user moves tests; CLI validates consistency            |
| Automatic evidence.yaml creation | Agent/user creates evidence; CLI validates consistency       |
| Automatic invalidation           | Agent/user decides when spec changes require re-verification |
| Pre-commit hooks                 | Validation can block commits but doesn't modify files        |
| Drift detection via hashing      | Consistency is checked, not automatically enforced           |

### Scope Boundaries Rationale

The CLI handles **structural operations** (creating specs with correct numbering) and **consistency checks** (validation). Content operations (writing specs, moving tests, creating evidence) are performed by agents or humans. This separation keeps mutations explicit and predictable.

## Product Approach

### Interaction Model

- **Interface Type**: CLI commands within spx spec domain
- **Invocation Pattern**: `spx spec validate`, `spx spec status`, `spx spec next`
- **User Mental Model**: "Like git status but for specs with evidence verification"

### User Experience Principles

1. **Deterministic**: Same filesystem state = same output, always
2. **Fast**: <100ms for any operation
3. **Fail-fast with clarity**: Invalid states produce clear errors with remediation guidance
4. **Explicit mutations**: CLI creates specs on command; never modifies existing content as a side effect

### CLI Command Reference

**Finding work:**

```bash
spx spec next                      # Lowest-BSP incomplete item globally
spx spec next capability-32        # Lowest-BSP incomplete within capability-32
spx spec next c32/f21              # Lowest-BSP incomplete within feature
```

**Creating specs:**

```bash
# Append after last item at level
spx spec append capability                     # New capability after last
spx spec append capability-17                  # New capability after cap-17
spx spec append capability-33/feature          # New feature after last in cap-33
spx spec append capability-33/feature-15       # New feature after f-15 in cap-33
spx spec append c33/f15/story                  # New story after last in feature

# Insert before existing item
spx spec insert capability-23                  # New capability before cap-23
spx spec insert capability-33/feature-15       # New feature before f-15

# Multiple items (variadic addresses)
spx spec append c33/f15/story c33/f27/story    # One story in each feature

# Multiple items at same location
spx spec append c33/f15/story --times 3        # Three stories in f-15

# Combined: --times applies to all addresses
spx spec append --times 3 c33/f15/story c33/f27/story  # 3 in each = 6 total
```

**Checking status:**

```bash
spx spec status                    # All specs with status
spx spec status c27/f21/s43        # Specific item status
```

**Validation:**

```bash
spx spec validate                  # Check all evidence.yaml integrity
```

### evidence.yaml Schema

Located at `specs/.../story-NN/tests/evidence.yaml`:

```yaml
tests:
  - tests/unit/module/component.test.ts
  - tests/unit/module/helper.test.ts
```

Paths are relative to product root.

### Status Determination

| Condition                           | Status      |
| ----------------------------------- | ----------- |
| No `tests/` directory               | OPEN        |
| Has `tests/` but no `evidence.yaml` | IN_PROGRESS |
| Has `evidence.yaml`                 | IMPLEMENTED |

### Validation Checks

`spx spec validate` verifies:

1. Every evidence.yaml references existing test files
2. Every test in `tests/` is referenced by exactly one evidence.yaml
3. No orphaned tests (tests without ownership)

Validation can be run in CI. Exit code 1 blocks commits when validation fails.

### Technical Constraints

| Constraint                | Impact                      |
| ------------------------- | --------------------------- |
| YAML parsing for evidence | Add YAML dependency         |
| Filesystem scanning       | Must scale to 1000+ items   |
| <100ms response time      | Limits complexity per query |

## Success Criteria

### User Outcomes

| Outcome                                 | Success Indicator                                                   |
| --------------------------------------- | ------------------------------------------------------------------- |
| Users trust IMPLEMENTED status          | `spx spec validate` catches inconsistencies                         |
| Users can trace failing tests to owners | Every CI failure traceable to owning story via evidence             |
| Agents automate reliably                | `spx spec next` returns fully-qualified address (e.g., c15/f21/s43) |
| Agents create specs easily              | `spx spec append` creates properly numbered specs                   |

### Quality Attributes

| Attribute       | Target                                      | Measurement Approach                     |
| --------------- | ------------------------------------------- | ---------------------------------------- |
| **Speed**       | <100ms for status, validate, next           | Benchmark all commands                   |
| **Reliability** | 100% deterministic output                   | Run same command 100x, verify identical  |
| **Clarity**     | Error messages include remediation guidance | Review all error paths for actionability |
| **Coverage**    | 100% of tests traceable to evidence.yaml    | `spx spec validate` passes in CI         |

### Definition of "Implemented"

This capability is implemented when:

1. evidence.yaml schema is defined and documented
2. Status determination uses evidence.yaml (not DONE.md)
3. Flat spec structure (no work/ folder) is supported
4. Fully-qualified addressing (c15/f21/s99) used in all output
5. Lenient input parsing accepts multiple address formats
6. `spx spec validate` checks all reference integrity
7. `spx spec validate` detects orphaned tests
8. `spx spec append` and `spx spec insert` create specs with correct BSP numbering
9. `spx spec next` accepts optional scope filter
10. All commands complete in <100ms

## Open Decisions

### Questions Requiring User Input

| Question                                 | Option A         | Option B                | Trade-offs                             | Recommendation |
| ---------------------------------------- | ---------------- | ----------------------- | -------------------------------------- | -------------- |
| Keep DONE.md for backward compatibility? | Yes (both files) | No (evidence.yaml only) | A = gradual migration, B = clean break | Option B       |
| Should validate run automatically in CI? | Yes (fail CI)    | No (advisory only)      | A = strict, B = flexible               | Option A       |

### Decisions Triggering ADRs

| Decision Topic     | Key Question                                      | Options to Evaluate                 |
| ------------------ | ------------------------------------------------- | ----------------------------------- |
| Test path format   | Absolute vs relative paths in evidence.yaml?      | Absolute / Relative to root         |
| Validation scope   | Check references during status or only validate?  | Status-time / Validate-time / Both  |
| Address format     | Canonical output format for addresses?            | c15/f21/s99 / 15/21/99 / Full paths |
| Migration strategy | How to migrate existing DONE.md and work/ folder? | Script / Manual / Parallel support  |

### Product Trade-offs

| Trade-off             | Option A           | Option B            | Impact                           |
| --------------------- | ------------------ | ------------------- | -------------------------------- |
| Validation strictness | Fail on any orphan | Warn but don't fail | A = cleaner, B = less disruptive |

## Dependencies

### Spec Dependencies

This capability depends on:

| Dependency                | Status | Rationale                       |
| ------------------------- | ------ | ------------------------------- |
| capability-21_core-cli    | DONE   | CLI infrastructure for commands |
| capability-42_core-config | DONE   | Config system for paths         |

### Customer-Facing Dependencies

| Dependency Type   | Specific Need                            | Impact If Missing               |
| ----------------- | ---------------------------------------- | ------------------------------- |
| **Documentation** | Migration guide from DONE.md to evidence | Users confused about transition |
| **Examples**      | Sample evidence.yaml for each work level | Users don't know correct format |

### Technical Dependencies

| Dependency | Version/Constraint | Purpose      | Availability      |
| ---------- | ------------------ | ------------ | ----------------- |
| Node.js    | >=18.0.0           | Runtime      | Assumed available |
| js-yaml    | >=4.0              | YAML parsing | Add as dependency |

### Performance Requirements

| Requirement Area  | Target                            | Measurement Approach           |
| ----------------- | --------------------------------- | ------------------------------ |
| **Status check**  | <100ms including evidence parsing | Benchmark with 100 specs       |
| **Validation**    | <100ms for full spec tree         | Benchmark with 1000 test files |
| **Spec creation** | <100ms for append/insert          | Benchmark with 100 siblings    |

## Pre-Mortem Analysis

### Assumption: evidence.yaml won't be forgotten

- **Likelihood**: Medium - agents might implement a story but forget to create evidence
- **Impact**: High - defeats the purpose of evidence-based tracking
- **Mitigation**: `spx spec status` warns when tests exist but no evidence.yaml; `spx spec validate` in CI catches missing evidence

### Assumption: Agents will use correct BSP numbering

- **Likelihood**: High - BSP calculation is straightforward
- **Impact**: Medium - wrong numbering breaks dependency order
- **Mitigation**: `spx spec append` and `spx spec insert` handle numbering automatically

### Assumption: Migration from DONE.md is feasible

- **Likelihood**: High - DONE.md contains no structured data to migrate
- **Impact**: Medium - existing "DONE" items need evidence.yaml created
- **Mitigation**: Provide migration guide; agents can create evidence.yaml for existing items

## Readiness Criteria

This PRD is ready for implementation when:

1. **Design principles** are agreed upon (all 4 documented)
2. **Flat structure** is defined (no work/ folder)
3. **Addressing scheme** is defined (c15/f21/s99 format)
4. **evidence.yaml schema** is defined with examples
5. **Status determination** rules are clear (OPEN/IN_PROGRESS/IMPLEMENTED)
6. **Validation checks** are enumerated
7. **CLI commands** are specified (next, status, validate, append, insert)
8. **Migration path** from DONE.md and work/ folder is documented
9. **ADR triggers** are identified for implementation decisions
