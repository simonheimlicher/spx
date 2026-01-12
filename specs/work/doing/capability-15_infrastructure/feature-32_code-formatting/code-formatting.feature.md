# Feature: Code Formatting

## Observable Outcome

The project has unified code formatting infrastructure:

- Markdown and YAML formatted via dprint (Rust binary, zero npm dependencies)
- TypeScript, JavaScript, and JSON continue using Prettier (mature ecosystem)
- yamllint dependency removed (eliminates Python requirement)
- Pre-commit hook (lefthook) auto-formats files before commit using global config
- **Global dprint config** (`~/.config/dprint/dprint.jsonc`) managed via `spx format update`
- `spx init` shows deviation between global config and project needs
- Project-level `dprint.json` ONLY for CI divergence (rare)

## Testing Strategy

> Features require **Level 1 + Level 2** to prove the feature works with real tools.
> See `docs/testing/standards.md` for level definitions.

### Level Assignment

| Component                        | Level | Justification                                                 |
| -------------------------------- | ----- | ------------------------------------------------------------- |
| Global config discovery          | 1     | Pure function using `EDITOR=echo dprint config edit --global` |
| Config deviation detection       | 1     | Pure function comparing global config with project needs      |
| dprint config generation         | 1     | Pure function building dprint.json from preferences           |
| prettier config preservation     | 1     | Pure function ensuring .prettierrc remains for TS/JS/JSON     |
| Pre-commit hook integration      | 2     | Integration with lefthook and actual dprint/prettier binaries |
| Markdown formatting              | 2     | Integration with real dprint binary on fixture .md files      |
| YAML formatting                  | 2     | Integration with real dprint binary on fixture .yaml files    |
| Global config usage              | 2     | Verify dprint respects global config in `~/.config/dprint/`   |
| TS/JS/JSON formatting (Prettier) | 2     | Verify Prettier still handles these files correctly           |

### Escalation Rationale

- **1 → 2**: Unit tests verify config discovery logic (parsing `EDITOR=echo dprint config edit --global` output) and config file structure (JSON validity, plugin URLs correct), but Level 2 verifies real formatting tools discover global config correctly and produce consistent output on fixture files

## Feature Integration Tests (Level 2)

### Test Harness

Uses fixture projects with intentionally unformatted files:

- `FIXTURES.UNFORMATTED_MARKDOWN` - Markdown with inconsistent spacing/newlines
- `FIXTURES.UNFORMATTED_YAML` - YAML with spacing issues
- `FIXTURES.UNFORMATTED_TYPESCRIPT` - TypeScript to verify Prettier still works
- `FIXTURES.MIXED_FILES` - Project with MD, YAML, TS, JSON files

### Integration Test: dprint Markdown Formatting

```typescript
// tests/integration/formatting/dprint-markdown.integration.test.ts
describe("dprint Markdown Formatting", () => {
  it("GIVEN unformatted .md WHEN running dprint fmt THEN normalizes formatting", async () => {
    await withTestEnv(
      { fixture: FIXTURES.UNFORMATTED_MARKDOWN },
      async ({ path }) => {
        const mdFile = `${path}/test.md`;

        // Verify file is unformatted
        const before = await readFile(mdFile, "utf-8");
        expect(before).toContain("\n\n\n\n"); // Multiple blank lines

        // Run dprint
        const { exitCode } = await execa("dprint", ["fmt"], { cwd: path });
        expect(exitCode).toBe(0);

        // Verify formatting applied
        const after = await readFile(mdFile, "utf-8");
        expect(after).not.toContain("\n\n\n\n");
      },
    );
  });
});
```

### Integration Test: dprint YAML Formatting

```typescript
// tests/integration/formatting/dprint-yaml.integration.test.ts
describe("dprint YAML Formatting", () => {
  it("GIVEN unformatted .yaml WHEN running dprint fmt THEN normalizes spacing", async () => {
    await withTestEnv(
      { fixture: FIXTURES.UNFORMATTED_YAML },
      async ({ path }) => {
        const yamlFile = `${path}/config.yaml`;

        // Verify file is unformatted
        const before = await readFile(yamlFile, "utf-8");
        expect(before).toContain("key:   value"); // Extra spaces

        // Run dprint
        const { exitCode } = await execa("dprint", ["fmt"], { cwd: path });
        expect(exitCode).toBe(0);

        // Verify formatting applied
        const after = await readFile(yamlFile, "utf-8");
        expect(after).toContain("key: value");
      },
    );
  });
});
```

### Integration Test: Prettier Still Works for TS/JS/JSON

```typescript
// tests/integration/formatting/prettier-typescript.integration.test.ts
describe("Prettier TypeScript Formatting", () => {
  it("GIVEN unformatted .ts WHEN running prettier THEN formats correctly", async () => {
    await withTestEnv(
      { fixture: FIXTURES.UNFORMATTED_TYPESCRIPT },
      async ({ path }) => {
        const tsFile = `${path}/src/index.ts`;

        // Run prettier
        const { exitCode } = await execa("prettier", ["--write", tsFile], { cwd: path });
        expect(exitCode).toBe(0);

        // Verify prettier formatting (semicolons, quotes, etc)
        const after = await readFile(tsFile, "utf-8");
        expect(after).toContain(";"); // Prettier adds semicolons
      },
    );
  });
});
```

## Capability Contribution

This feature enables consistent code formatting across ALL projects:

- **Global config priority** - formatting preferences apply everywhere, not per-project
- Eliminates Python dependency (yamllint removal)
- Provides configurable Markdown formatting (Prettier limitation solved)
- Maintains mature tooling for TS/JS/JSON (Prettier preserved)
- 10-100x faster formatting for Markdown/YAML (dprint performance)
- `spx format update` manages global config, `spx init` shows deviations

## Completion Criteria

- [ ] All Level 1 tests pass (global config discovery, deviation detection)
- [ ] All Level 2 tests pass (real binary integration with global config)
- [ ] dprint binary installed and uses global config
- [ ] Global config discoverable via `EDITOR=echo dprint config edit --global`
- [ ] `spx format update` modifies global config
- [ ] `spx format update --force` overwrites global config
- [ ] `spx init` shows deviation between global config and project needs
- [ ] yamllint removed from dependencies
- [ ] Prettier preserved for TS/JS/JSON
- [ ] Pre-commit hook (lefthook) auto-formats using global config
- [ ] Project-level `dprint.json` NOT created unless CI divergence needed
- [ ] ADR-001 documents global-first rationale
- [ ] No mocking used (DI pattern throughout)
- [ ] Documentation updated in CLAUDE.md

**Dependencies**: None - standalone infrastructure feature
