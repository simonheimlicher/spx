# ADR 002: Conventional Commits for Automated Versioning

## Problem

Plugin versions need to be incremented when changes are made, but manual version management is error-prone and often forgotten. Need an automated approach that integrates with existing git workflow.

## Context

- **Business**: Plugin consumers rely on version numbers to understand update significance; inconsistent versioning erodes trust
- **Technical**: Projects already use git; Conventional Commits is an established standard; version numbers follow semver

## Decision

**Plugin versions are automatically computed from git history using Conventional Commits, with `feat!` bumping minor and all other commits bumping patch.**

## Rationale

Four versioning strategies were considered:

1. **Manual VERSION file** — Rejected because easily forgotten; creates extra maintenance step
2. **Content hash versioning** — Rejected because version numbers would be meaningless hashes; breaks semver semantics
3. **Changelog-based** — Rejected because requires maintaining separate changelog file; duplicates commit history
4. **Conventional Commits** — Chosen because:
   - Already integrated into git workflow
   - Standard tooling exists (commitlint, conventional-changelog)
   - Semver semantics preserved
   - No extra maintenance step

Version bump rules:

- `feat!:` (breaking change marker) → **Minor** bump (0.1.0 → 0.2.0)
- `feat:`, `fix:`, `chore:`, etc. → **Patch** bump (0.1.0 → 0.1.1)
- **Major** bumps (1.x.x → 2.0.0) require explicit command (`spx claude version major`)

Why minor for breaking changes instead of major:

- Pre-1.0 semver convention: minor = breaking, patch = non-breaking
- Most plugins will be < 1.0 during active development
- Explicit major command provides escape hatch when needed

Version is computed from commits since the last version tag (e.g., `v0.1.0`). If no tag exists, version starts at `0.1.0`.

## Trade-offs Accepted

- **Requires Conventional Commits discipline**: Teams not using Conventional Commits get less accurate versioning. Mitigation: Fall back to patch bump if no conventional commits detected; warn user.
- **Breaking changes as minor**: May confuse users expecting semver major for breaking changes. Mitigation: Clear documentation; explicit major command available.
- **Per-plugin versioning complexity**: Monorepo with multiple plugins needs per-plugin version tracking. Mitigation: Scope version detection to plugin directory; support `v{plugin-name}-0.1.0` tag format.

## Testing Strategy

### Level Coverage

| Level           | Question Answered                                         | Scope                             |
| --------------- | --------------------------------------------------------- | --------------------------------- |
| 1 (Unit)        | Does commit parsing correctly identify conventional type? | Commit parser, version calculator |
| 2 (Integration) | Does version detection work with real git history?        | Git wrapper + version calculator  |

### Escalation Rationale

- **1 → 2**: Unit tests verify parsing logic, but integration tests verify real git command execution and edge cases (merge commits, non-conventional messages)

### Test Harness

| Level | Harness                 | Location/Dependency                       |
| ----- | ----------------------- | ----------------------------------------- |
| 2     | Git-initialized fixture | `test/fixtures/marketplace/with-history/` |

### Behaviors Verified

**Level 1 (Unit):**

- Parse `feat!: breaking change` as breaking feat
- Parse `feat(scope): message` as non-breaking feat
- Parse `fix: message` as fix
- Calculate 0.1.0 → 0.2.0 for feat! commit
- Calculate 0.1.0 → 0.1.1 for fix commit
- Default to 0.1.0 when no previous version

**Level 2 (Integration):**

- Detect version from git tags in real repository
- Enumerate commits since last tag
- Handle repositories with no tags
- Handle repositories with non-conventional commits (fallback to patch)

## Validation

### How to Recognize Compliance

You're following this decision if:

- Commits use Conventional Commits format (`type(scope): message`)
- `feat!:` is used for breaking changes
- `spx claude version` shows expected next version
- Version tags follow `v{version}` or `v{plugin}-{version}` format

### MUST

- Parse commit messages according to Conventional Commits spec
- Bump minor for `feat!:` commits (breaking change marker)
- Bump patch for all other commit types
- Fall back to patch if no conventional commits detected

### NEVER

- Automatically bump major version (requires explicit `spx claude version major`)
- Fail on non-conventional commits (degrade gracefully to patch)
- Compute version from file content or timestamps
