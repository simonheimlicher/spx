# Technical Requirements Document (TRD)

## Status of this Document: DoR Checklist

| DoR checkbox          | Description                                                                 |
| --------------------- | --------------------------------------------------------------------------- |
| [x] **Outcome**       | Unified code formatting with configurable Markdown, replacing Python deps   |
| [x] **Test Evidence** | Pre-commit hook auto-formats files, dprint.json validates in CI             |
| [x] **Assumptions**   | dprint (Rust binary) available, YAML plugin pre-1.0 acceptable              |
| [x] **Dependencies**  | Prettier (keep for TS/JS/JSON), remove yamllint, add dprint                 |
| [x] **Pre-Mortem**    | YAML plugin breaking changes possible (v0.5.1), config migration complexity |

## Problem Statement

### Technical Problem

```
When developers format code, they encounter inconsistent tooling
because Prettier doesn't allow configuring Markdown style and yamllint requires Python,
which blocks unified formatting workflow and adds dependency overhead.
```

### Current Pain

- **Symptom**: Prettier keeps changing Markdown files back to its opinionated style; yamllint requires Python installation
- **Root Cause**: Prettier has no Markdown configuration options; yamllint is separate Python tool creating cross-language dependency
- **Impact**: Developers can't enforce their preferred Markdown style; build toolchain requires Python for single YAML linter

## Solution Design

### Technical Solution

```
Implement dprint-based formatting that enables developers to configure Markdown and YAML styles
through unified Rust-binary tooling with global configuration (consistent across all projects),
with project-level config only for CI divergence, resulting in fast formatting without Python dependencies.
```

### Technical Architecture

**Components**:

1. **dprint binary** - Single Rust executable (~15MB), no npm dependencies
2. **Plugin system**:
   - Markdown plugin (official, mature)
   - pretty_yaml plugin (v0.5.1, 553K downloads)
3. **Configuration management**:
   - Global dprint config (discovered via `EDITOR=echo dprint config edit --global`)
   - Platform-aware: `$XDG_CONFIG_HOME/dprint/dprint.jsonc` or `~/.config/dprint/dprint.jsonc`
   - Project-level config ONLY for CI divergence (not primary use case)
   - Managed via `spx format update` (modifies global) and `spx format update --force` (overwrites global)
   - `spx init` shows deviation between global config and project needs
4. **Pre-commit integration** - Auto-format on commit via lefthook (uses global config)
5. **Preserve Prettier** for TypeScript/JavaScript/JSON (mature, stable ecosystem)

**Data Flow**:

```
Developer commits → lefthook pre-commit → dprint fmt (uses global config) → prettier (TS/JS/JSON) → staged files updated
                                                      ↓
                                          Global: ~/.config/dprint/dprint.jsonc
                                          Fallback: ./dprint.json (CI only)
```

**Config Priority**: Global config → Project config (CI divergence) → Defaults

## Expected Outcome

### Technical Capability

```
The system will provide unified code formatting enabling developers to configure Markdown style
through dprint with YAML formatting included, resolving Prettier's lack of configurability
and eliminating Python dependency for YAML linting.
```

### Evidence of Success (BDD Tests)

- [ ] `Markdown Formatting: dprint formats .md files with custom configuration`
- [ ] `YAML Formatting: dprint formats .yml/.yaml files without yamllint`
- [ ] `Pre-commit Hook: Files auto-format before commit`
- [ ] `Prettier Preserved: TS/JS/JSON continue using Prettier`
- [ ] `No Python Dependency: yamllint removed from devDependencies`

## End-to-End Tests

Complete technical integration test that provides irrefutable evidence the Technical Outcome is achieved:

```typescript
// E2E test
import { execa } from "execa";
import { readFile, writeFile } from "fs/promises";
import { describe, expect, it } from "vitest";

describe("Capability: Code Formatting", () => {
  it("GIVEN unformatted MD/YAML WHEN pre-commit runs THEN files auto-format", async () => {
    // Given
    const projectDir = "tests/fixtures/formatting-project";
    const mdFile = `${projectDir}/test.md`;
    const yamlFile = `${projectDir}/test.yaml`;

    // Unformatted content
    await writeFile(mdFile, "# Heading\n\n\n\nToo many newlines");
    await writeFile(yamlFile, "key:   value");

    // When
    const { exitCode } = await execa("dprint", ["fmt"], { cwd: projectDir });

    // Then
    expect(exitCode).toBe(0);
    const mdContent = await readFile(mdFile, "utf-8");
    const yamlContent = await readFile(yamlFile, "utf-8");
    expect(mdContent).not.toContain("\n\n\n\n"); // Normalized newlines
    expect(yamlContent).toContain("key: value"); // Normalized spacing
  });
});
```

## Dependencies

### Work Item Dependencies

- [ ] None - standalone infrastructure feature

### Technical Dependencies

- **Required Tools**: dprint (Rust binary)
- **npm Packages**: Remove yamllint, keep prettier
- **Plugins**:
  - `https://plugins.dprint.dev/markdown-0.17.0.wasm`
  - `https://plugins.dprint.dev/g-plane/pretty_yaml-v0.5.1.wasm`

## Pre-Mortem Analysis

### Assumption: pretty_yaml (v0.5.1) introduces breaking changes

- **Likelihood**: Medium (pre-1.0 version, actively developed)
- **Impact**: Medium (config migration, potential formatting churn)
- **Mitigation**: Pin version in dprint.json, monitor releases, test before upgrading

### Assumption: Global config location varies across platforms

- **Likelihood**: Medium (XDG on Linux, different paths on macOS/Windows)
- **Impact**: Medium (spx format commands must discover config reliably)
- **Mitigation**: Use `EDITOR=echo dprint config edit --global` to discover location, cache discovery result, handle platform differences

### Assumption: dprint performance benefits justify tooling fragmentation

- **Likelihood**: High (10-100x faster confirmed in research)
- **Impact**: Low (developers benefit from faster formatting)
- **Mitigation**: Accept dprint (MD/YAML) + Prettier (TS/JS/JSON) split, plan consolidation when dprint TS plugin matures
