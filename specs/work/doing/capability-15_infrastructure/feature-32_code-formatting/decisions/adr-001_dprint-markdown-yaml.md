# ADR 001: Adopt dprint for Markdown and YAML, Preserve Prettier for TypeScript/JavaScript/JSON

## Problem

Prettier enforces opinionated Markdown formatting with zero configuration options, constantly changing files back to its style. Additionally, yamllint requires Python as a dependency, adding cross-language tooling complexity to a TypeScript project. We need configurable Markdown formatting and want to eliminate the Python dependency while maintaining mature, stable tooling for our core TypeScript/JavaScript codebase.

## Context

- **Business**: Developers need consistent code formatting that respects their style preferences. Prettier's inflexibility with Markdown creates friction, and Python dependencies add unnecessary build complexity.
- **Technical**: Current stack uses Prettier (JavaScript) for all formatting and yamllint (Python) for YAML linting. TypeScript project with Vitest testing, npm scripts, and lefthook pre-commit hooks.

## Decision

**Use dprint for Markdown and YAML formatting, preserve Prettier for TypeScript/JavaScript/JSON.**

Specifically:

- Install dprint (Rust binary, ~15MB, zero npm dependencies)
- Configure Markdown plugin: `https://plugins.dprint.dev/markdown-0.17.0.wasm`
- Configure YAML plugin: `https://plugins.dprint.dev/g-plane/pretty_yaml-v0.5.1.wasm`
- Remove yamllint from dependencies
- Keep Prettier for `.ts`, `.js`, `.json`, `.jsonc` files
- **Prioritize global config**: `~/.config/dprint/dprint.jsonc` (XDG) or platform-specific location
- **Project-level config ONLY for CI divergence**: Optional `./dprint.json` if CI needs different settings
- Discover global config via: `EDITOR=echo dprint config edit --global`
- Auto-format via pre-commit hook (lefthook, uses global config)

## Rationale

### Why dprint for Markdown and YAML

**Markdown Configurability** - This is the primary driver. Prettier has zero configuration options for Markdown formatting and forces its opinionated style. dprint provides full configuration control, allowing developers to enforce their preferred style without constant file churn.

**Performance** - dprint is 10-100x faster than Prettier. Real-world benchmarks show TypeScript codebase format checking: Prettier ~40s → dprint <1s (second run). For large projects, this is a significant developer experience improvement.

**Eliminate Python Dependency** - yamllint requires Python installation. Replacing it with dprint's YAML plugin (Rust binary) removes cross-language dependency complexity. This simplifies CI/CD, reduces container image size, and eliminates potential Python version conflicts.

**Zero npm Dependencies** - dprint downloads a single ~15MB binary. No dependency tree, no node_modules bloat. Prettier pulls in ~20MB of npm packages for comparison.

**Unified Tooling** - One binary (dprint) handles both Markdown and YAML instead of two separate tools (Prettier + yamllint). Simpler workflow, single configuration format.

**Global Config Priority** - Per-project config defeats the purpose of consistent formatting across all projects. Global config ensures user's formatting preferences apply everywhere. Project-level config creates divergence and maintenance overhead. Only use project config when CI explicitly requires different settings than developer machines.

### Why NOT dprint for TypeScript/JavaScript/JSON (yet)

**Maturity Gap** - dprint-plugin-typescript has 193 open issues, version 0.95.13 (pre-1.0), and Snyk marks maintenance as "Inactive" despite recent releases. This indicates active development but not production stability.

**Ecosystem Size** - Prettier: 54.5M weekly downloads, 51K GitHub stars. dprint: 118K weekly downloads, 3.6K GitHub stars. The ecosystem difference is 460x in adoption.

**Formatting Churn Risk** - Switching TypeScript/JavaScript formatting could cause codebase-wide changes and introduce subtle formatting differences. Prettier is battle-tested and stable. The risk doesn't justify the performance benefit for our current project size.

**"Good Enough" Performance** - Prettier is fast enough for our TypeScript codebase. The 10-100x improvement matters more for large monorepos, not our current scale.

### Alternatives Considered and Rejected

**Keep Prettier for Everything** - Rejected because Prettier doesn't allow Markdown configuration. This is the core pain point driving this decision.

**Switch Everything to dprint Now** - Rejected because TypeScript plugin isn't mature enough (193 issues, pre-1.0). Accepting fragmentation (dprint + Prettier) is better than accepting instability in core language tooling.

**Keep yamllint, Only Add dprint for Markdown** - Rejected because pretty_yaml is mature enough (553K downloads, v0.5.1) and eliminates Python dependency. The pre-1.0 version risk is acceptable for YAML, which is simpler than TypeScript.

**Biome (alternative Rust formatter)** - Rejected because it's focused on JavaScript/TypeScript replacement for Prettier + ESLint, not Markdown/YAML. Doesn't solve the Markdown configurability problem.

## Trade-offs Accepted

- **Tooling Fragmentation (dprint + Prettier)**: We accept running two formatters instead of one. Mitigation: Pre-commit hook orchestrates both automatically. Future migration path when dprint TypeScript plugin reaches 1.0.

- **YAML Plugin Pre-1.0 Risk (v0.5.1)**: We accept potential breaking changes in pretty_yaml updates. Mitigation: Pin version in dprint.json config, test before upgrading, monitor release notes. Impact is low because YAML is less complex than TypeScript.

- **Global Config Discovery Complexity**: Platform-specific paths (XDG on Linux, different on macOS/Windows) require discovery mechanism. Mitigation: Use `EDITOR=echo dprint config edit --global` to discover location reliably, cache result, document platform differences.

- **CI Divergence Potential**: CI might need different config than developer machines (rare). Mitigation: Support optional project-level `dprint.json` for CI-specific settings, document when to use it, prefer global config alignment.

## Testing Strategy

### Level Coverage

| Level           | Question Answered                                                  | Scope                                       |
| --------------- | ------------------------------------------------------------------ | ------------------------------------------- |
| 1 (Unit)        | Does config generation create valid dprint.json with correct URLs? | Config builder functions, plugin URL format |
| 2 (Integration) | Do real dprint/prettier binaries format fixture files correctly?   | Markdown, YAML, TypeScript formatting flows |

*No Level 3 (E2E) needed - formatting is infrastructure, not user-facing workflow.*

### Escalation Rationale

- **1 → 2**: Unit tests verify JSON structure (valid syntax, plugin URLs match pattern), but Level 2 verifies real binaries accept configs and produce deterministic formatting output on fixture files with known formatting issues.

### Test Harness

| Level | Harness          | Location/Dependency                                   |
| ----- | ---------------- | ----------------------------------------------------- |
| 2     | `withTestEnv()`  | `tests/integration/harness/test-env.ts` (existing)    |
| 2     | Fixture projects | `tests/fixtures/formatting/` (unformatted MD/YAML/TS) |

### Behaviors Verified

**Level 1 (Unit):**

- `discoverGlobalDprintConfig()` finds global config via `EDITOR=echo dprint config edit --global`
- `buildDprintConfig()` generates valid JSON with markdown + YAML plugins
- `buildDprintConfig()` includes correct plugin URLs (wasm format)
- `detectConfigDeviation()` compares global config with project needs
- `preservePrettierConfig()` ensures .prettierrc remains for TS/JS/JSON

**Level 2 (Integration):**

- `dprint fmt` formats unformatted Markdown files (normalizes newlines, spacing)
- `dprint fmt` formats unformatted YAML files (normalizes indentation, spacing)
- `prettier --write` still formats TypeScript files (semicolons, quotes per .prettierrc)
- Pre-commit hook runs both formatters in correct order (dprint → prettier)
- `dprint check` detects unformatted files (CI validation)
- `prettier --check` detects unformatted TS/JS/JSON files (CI validation)

## Validation

### How to Recognize Compliance

You're following this decision if:

- Markdown and YAML files are formatted via `dprint fmt`
- TypeScript, JavaScript, and JSON files are formatted via `prettier --write`
- yamllint is NOT in package.json dependencies
- **Global dprint config** exists in `~/.config/dprint/dprint.jsonc` (or platform-specific location)
- Project-level `dprint.json` ONLY exists if CI requires different config than global
- lefthook pre-commit hook auto-formats using global config (or project fallback)
- `spx format update` modifies global config, `spx format update --force` overwrites it
- `spx init` shows deviation between global config and project needs
- CI runs `dprint check` for MD/YAML and `prettier --check` for TS/JS/JSON

### MUST

- Use dprint for `.md`, `.yaml`, `.yml` files - NEVER use Prettier for these
- Use Prettier for `.ts`, `.js`, `.json`, `.jsonc` files - NEVER use dprint for these
- **Prioritize global config** - use `~/.config/dprint/dprint.jsonc` (or platform location)
- Discover global config via `EDITOR=echo dprint config edit --global` - do NOT hardcode paths
- Only create project-level `dprint.json` if CI needs different config - NOT for developer preferences
- Pin dprint plugin versions in config - do NOT use floating "latest" URLs
- Test config changes against fixture files before committing
- Run both formatters in lefthook pre-commit hook - do NOT skip either
- `spx format update` MUST modify global config, NOT create project config

### NEVER

- Use Prettier for Markdown or YAML - defeats configurability purpose
- Use dprint for TypeScript/JavaScript until plugin reaches 1.0 - too risky
- **Create project-level config for developer preferences** - defeats global consistency
- Hardcode platform-specific config paths - always discover via `dprint config edit --global`
- Skip version pinning for pretty_yaml - pre-1.0 breaking changes possible
- Mock formatting binaries in tests - must use real dprint/prettier executables
- Commit unformatted files - pre-commit hook MUST catch all formatting issues
- Remove .prettierrc - TypeScript/JavaScript still need Prettier config
