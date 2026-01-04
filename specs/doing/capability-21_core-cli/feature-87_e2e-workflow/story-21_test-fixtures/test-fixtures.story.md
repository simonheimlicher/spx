# Story: Test Fixtures

## Functional Requirements

### FR1: Create fixture repository with 10 work items

```gherkin
GIVEN test fixture directory
WHEN setting up fixtures
THEN create realistic repo structure with 10 work items in mixed states
```

Structure:
- 1 capability (DONE)
- 3 features (1 DONE, 1 IN_PROGRESS, 1 OPEN)
- 6 stories (3 DONE, 2 IN_PROGRESS, 1 OPEN)

#### Files created/modified

1. `test/fixtures/repos/sample-10-items/` [new]: Create fixture repository

### FR2: Create fixture repository with 50 work items

```gherkin
GIVEN test fixture directory
WHEN setting up performance test fixtures
THEN create large repo structure with 50 work items for perf testing
```

Structure:
- 2 capabilities
- 10 features (5 per capability)
- 38 stories

#### Files created/modified

1. `test/fixtures/repos/sample-50-items/` [new]: Create large fixture repository

## Testing Strategy

### Level Assignment

| Component            | Level | Justification                    |
| -------------------- | ----- | -------------------------------- |
| Fixture creation     | 3     | E2E test infrastructure          |
| Realistic structure  | 3     | Must mirror real repositories    |

### When to Escalate

This story uses Level 3 because:

- Fixtures are for E2E tests that verify complete capability
- Must represent realistic repository structures
- Used by performance benchmarks

## E2E Test Fixtures

```bash
# test/fixtures/repos/sample-10-items/
test/fixtures/repos/sample-10-items/
└── specs/
    └── doing/
        └── capability-21_test-project/
            ├── capability-21_test-project.capability.md
            ├── tests/
            │   └── DONE.md
            ├── feature-32_feature-one/
            │   ├── feature-32_feature-one.feature.md
            │   ├── tests/
            │   │   └── DONE.md
            │   ├── story-21_story-one/
            │   │   ├── story-21_story-one.story.md
            │   │   └── tests/
            │   │       ├── test.test.ts
            │   │       └── DONE.md
            │   └── story-32_story-two/
            │       ├── story-32_story-two.story.md
            │       └── tests/
            │           └── test.test.ts  # IN_PROGRESS
            ├── feature-43_feature-two/
            │   ├── feature-43_feature-two.feature.md
            │   └── tests/
            │       └── test.test.ts  # IN_PROGRESS
            └── feature-54_feature-three/
                ├── feature-54_feature-three.feature.md
                └── tests/  # Empty = OPEN
```

## Architectural Requirements

### Relevant ADRs

1. `context/4-testing-standards.md` - E2E testing with real fixtures

## Quality Requirements

### QR1: Realistic Structure

**Requirement:** Fixtures mirror real repository patterns
**Target:** Follow BSP numbering, proper hierarchy, realistic work items
**Validation:** Manual review confirms realism

### QR2: Mixed States

**Requirement:** Fixtures include all three states
**Target:** DONE, IN_PROGRESS, and OPEN work items present
**Validation:** Fixture includes all states

### QR3: Performance Scale

**Requirement:** 50-item fixture sufficient for performance testing
**Target:** Representative of medium-sized project
**Validation:** Performance tests use this fixture

## Completion Criteria

- [ ] 10-item fixture created with mixed states
- [ ] 50-item fixture created for performance testing
- [ ] Fixtures follow BSP numbering conventions
- [ ] Realistic directory structure and file contents
- [ ] All three states represented

## Documentation

1. README in fixtures/ explaining structure
2. Comments in fixture files explaining purpose
3. Script to regenerate fixtures if needed
