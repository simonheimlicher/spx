# ADR 001: SKILL.md as Source of Truth with Derived Metadata

## Problem

Claude Code plugin maintenance requires keeping multiple JSON files (marketplace.json, plugin.json, skill.json) in sync with SKILL.md files. Currently this is manual, error-prone, and leads to drift between source content and published manifests.

## Context

- **Business**: Plugin maintainers waste time on manual JSON updates; out-of-sync manifests cause publishing failures and user confusion
- **Technical**: Claude Code plugins have established JSON schema; SKILL.md files contain authoritative skill definitions; directory structure follows consistent naming conventions

## Decision

**SKILL.md files combined with directory structure are the single source of truth; all JSON manifests are derived artifacts.**

## Rationale

Three alternatives were considered:

1. **JSON as source of truth** — Rejected because JSON lacks the rich documentation content of SKILL.md; would require maintaining duplicate information
2. **Bidirectional sync** — Rejected because creates conflict resolution complexity; unclear which source wins when both change
3. **SKILL.md as source of truth** — Chosen because:
   - SKILL.md already contains the authoritative skill definition
   - Directory structure provides reliable naming (e.g., `plugins/typescript/` → `typescript`)
   - One-way derivation eliminates sync conflicts
   - Aligns with "single source of truth" principle

Metadata derivation strategy:

- **Name**: Derived from directory path (`plugins/{name}/` → plugin name, `skills/{name}/` → skill name)
- **Description**: Extracted from SKILL.md content (first paragraph after title, or explicit frontmatter)
- **Version**: Computed from git history using Conventional Commits (see ADR-002)

This approach means JSON files are gitignored or treated as build artifacts—always regeneratable from source.

## Trade-offs Accepted

- **No manual JSON customization**: Any JSON edits are overwritten on regeneration. Mitigation: All customizable properties must be expressible in SKILL.md or directory structure.
- **Extraction heuristics**: Description extraction from SKILL.md may not be perfect for all formats. Mitigation: Support explicit frontmatter override; provide clear extraction rules.
- **Directory naming constraints**: Plugin/skill names are limited by valid directory names. Mitigation: Accept this constraint; directory names are already slugified by convention.

## Testing Strategy

### Level Coverage

| Level           | Question Answered                                   | Scope                              |
| --------------- | --------------------------------------------------- | ---------------------------------- |
| 1 (Unit)        | Does extraction logic correctly parse SKILL.md?     | Extractors for name, description   |
| 2 (Integration) | Does generation produce valid JSON from real files? | Generator + extractor + filesystem |
| 3 (E2E)         | Does spx claude update produce correct marketplace? | Full CLI workflow on fixture       |

### Escalation Rationale

- **1 → 2**: Unit tests verify extraction logic with synthetic input, but integration tests verify real file parsing, encoding, and edge cases
- **2 → 3**: Integration tests verify components work together, but E2E verifies the complete user workflow produces usable marketplace JSON

### Test Harness

| Level | Harness                 | Location/Dependency                       |
| ----- | ----------------------- | ----------------------------------------- |
| 2     | Fixture marketplace     | `test/fixtures/marketplace/valid/`        |
| 3     | Git-initialized fixture | `test/fixtures/marketplace/with-history/` |

### Behaviors Verified

**Level 1 (Unit):**

- Extract plugin name from directory path `plugins/typescript/` → `typescript`
- Extract skill name from directory path `skills/testing-typescript/` → `testing-typescript`
- Extract description from SKILL.md first paragraph
- Extract description from SKILL.md frontmatter when present

**Level 2 (Integration):**

- Generate valid plugin.json from real SKILL.md files
- Generate valid skill.json with correct metadata
- Handle missing optional fields gracefully

**Level 3 (E2E):**

- `spx marketplace status` detects drift between SKILL.md and JSON
- `spx marketplace update` regenerates all JSON correctly
- Generated JSON validates against Claude Code schema

## Validation

### How to Recognize Compliance

You're following this decision if:

- SKILL.md files are edited for content changes, never JSON files directly
- `spx marketplace update` is run (or pre-commit hook runs) before committing JSON changes
- Directory names match desired plugin/skill names

### MUST

- Derive plugin/skill names from directory structure, never from JSON or external config
- Extract description from SKILL.md content or frontmatter
- Treat JSON files as derived artifacts that can be regenerated

### NEVER

- Edit JSON files directly for content that should come from SKILL.md
- Store plugin metadata in JSON that isn't derivable from source
- Allow JSON to diverge from SKILL.md content
