# Story: Lefthook Integration

## User Story

As a developer, I want dprint to automatically format my Markdown and YAML files on commit via lefthook, so my code stays formatted without manual intervention.

## Acceptance Criteria

- [ ] `lefthook.yml` configured with pre-commit hook for dprint
- [ ] Hook runs `dprint fmt {staged_files}` on `.md`, `.yaml`, `.yml` files
- [ ] Hook uses global dprint config automatically
- [ ] Prettier hook preserved for `.ts`, `.js`, `.json` files
- [ ] Hook order: dprint → prettier (correct sequence)
- [ ] Hook fails commit if formatting changes files (must stage changes)
- [ ] Integration test verifies pre-commit formatting with fixture files

## Implementation Notes

### lefthook.yml Configuration

```yaml
pre-commit:
  commands:
    dprint:
      glob: "*.{md,yaml,yml}"
      run: dprint fmt {staged_files}
      stage_fixed: true # Auto-stage formatted files

    prettier:
      glob: "*.{ts,js,json,jsonc}"
      run: prettier --write {staged_files}
      stage_fixed: true
```

### Execution Order

Lefthook runs commands alphabetically, so `dprint` runs before `prettier` (correct order).

### Global Config Usage

dprint automatically discovers global config via its config resolution:

1. Check current directory for `dprint.json`
2. Check ancestor directories
3. **Check global config** (`~/.config/dprint/dprint.jsonc`)

Since we don't want project-level config (except CI), dprint will use global config by default.

## Testing Strategy

### Integration Test (Level 2)

Location: `tests/integration/formatting/lefthook-integration.integration.test.ts`

```typescript
describe("Lefthook Integration", () => {
  it("formats markdown and yaml files on pre-commit", async () => {
    await withTestEnv({ fixture: FIXTURES.UNFORMATTED_FILES }, async ({ path }) => {
      // Create unformatted files
      const mdFile = `${path}/test.md`;
      const yamlFile = `${path}/config.yaml`;

      await writeFile(mdFile, "# Title\n\n\n\nToo many newlines");
      await writeFile(yamlFile, "key:   value");

      // Stage files
      await execa("git", ["add", "."], { cwd: path });

      // Run lefthook pre-commit (simulated)
      await execa("lefthook", ["run", "pre-commit"], { cwd: path });

      // Verify formatting applied
      const mdContent = await readFile(mdFile, "utf-8");
      const yamlContent = await readFile(yamlFile, "utf-8");

      expect(mdContent).not.toContain("\n\n\n\n");
      expect(yamlContent).toContain("key: value");
    });
  });

  it("preserves prettier for TypeScript files", async () => {
    await withTestEnv({ fixture: FIXTURES.UNFORMATTED_TS }, async ({ path }) => {
      const tsFile = `${path}/index.ts`;

      await writeFile(tsFile, "const x={a:1}"); // Unformatted

      await execa("git", ["add", "."], { cwd: path });
      await execa("lefthook", ["run", "pre-commit"], { cwd: path });

      const content = await readFile(tsFile, "utf-8");
      expect(content).toContain("const x = { a: 1 };"); // Prettier formatted
    });
  });
});
```

## Dependencies

- **Depends on**: story-21 (global config discovery), story-32 (config management)
- **Blocks**: None (parallel with story-54)
- **External**: lefthook binary installed

## Definition of Done

- [ ] `lefthook.yml` configured with dprint + prettier hooks
- [ ] Integration test passes with real lefthook execution
- [ ] Hook auto-stages formatted files (`stage_fixed: true`)
- [ ] Documentation updated in CLAUDE.md (pre-commit setup)
- [ ] No project-level dprint.json created (uses global)
