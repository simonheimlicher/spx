# ADR: Lefthook Pre-Commit Test Enforcement

## Problem

Tests can be added or modified without running them before commit. This allows broken tests to be committed, only to be discovered later in CI or by other developers. There is no automated gate preventing commits with failing tests.

## Context

- **Business**: Broken tests waste CI compute time and block other developers. Fast feedback at commit time catches issues before they propagate.
- **Technical**: The project uses Vitest for testing and pnpm for package management. Lefthook is a fast, cross-platform Git hooks manager written in Go that can be configured via YAML.

## Decision

**Use lefthook to run tests on modified files before every commit.**

The pre-commit hook will:

1. Detect modified test files (`*.test.ts`, `*.test.tsx`)
2. Detect modified source files and find their corresponding tests
3. Run only the affected tests (not the full suite)
4. Block the commit if any tests fail

## Rationale

**Why lefthook over alternatives:**

- **husky + lint-staged**: Node-based, slower startup, requires npm postinstall scripts
- **pre-commit (Python)**: Additional runtime dependency, complex configuration
- **lefthook**: Single Go binary, fast startup (~10ms), simple YAML config, supports parallel execution

**Why selective test execution:**

- Running the full test suite (~870 tests) takes 10+ seconds
- Running only affected tests typically takes <2 seconds
- Vitest's `--related` flag finds tests that import modified files

**Why not make this optional:**

- Optional hooks get disabled when they're inconvenient, defeating the purpose
- The ADR-021 (Isolated Test Fixtures) incident showed tests can pass locally but fail due to repository state
- Enforcement at commit time catches issues before they reach CI

## Trade-offs Accepted

- **Commit time increases**: Adds 1-5 seconds to commits with test changes. Mitigated by running only affected tests.
- **Hook bypass via --no-verify**: Developers can bypass with `git commit --no-verify`. Mitigated by CI enforcement as backup.
- **False positives from --related**: Vitest's related detection may run more tests than strictly necessary. Acceptable over-testing vs under-testing.

## Testing Strategy

### Level Coverage

| Level           | Question Answered                                  | Scope                        |
| --------------- | -------------------------------------------------- | ---------------------------- |
| 1 (Unit)        | Does file categorization logic work correctly?     | `categorizeChangedFiles()`   |
| 2 (Integration) | Does lefthook config execute correctly with Vitest | `lefthook.yml` + test runner |

### Escalation Rationale

- **1 → 2**: Unit tests verify file categorization logic, but Level 2 verifies lefthook actually invokes Vitest with correct arguments and interprets exit codes properly.

### Test Harness

| Level | Harness         | Location/Dependency              |
| ----- | --------------- | -------------------------------- |
| 2     | `withTestEnv()` | `tests/helpers/with-test-env.ts` |

### Behaviors Verified

**Level 1 (Unit):**

- Modified `.test.ts` files are categorized as test files
- Modified source files are mapped to their corresponding test files
- Files outside `src/` and `tests/` are ignored

**Level 2 (Integration):**

- `lefthook run pre-commit` exits 0 when tests pass
- `lefthook run pre-commit` exits non-zero when tests fail
- Hook skips when no test-related files are staged

## Validation

### How to Recognize Compliance

You're following this decision if:

- `lefthook.yml` exists in project root with pre-commit configuration
- Commits with failing tests are blocked locally
- Only affected tests run (not full suite)

### MUST

- Pre-commit hook MUST run affected tests before allowing commit
- Hook MUST use `vitest --related` for selective execution
- Hook MUST exit non-zero if any tests fail

### NEVER

- NEVER commit `lefthook.yml` changes without verifying hook works
- NEVER disable the hook in CI (it's the backup gate)
- NEVER use `--no-verify` as standard practice
