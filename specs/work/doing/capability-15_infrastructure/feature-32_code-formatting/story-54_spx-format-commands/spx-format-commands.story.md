# Story: spx format Commands

## User Story

As a developer, I want `spx format` commands to manage my global dprint configuration, so I can easily update formatting preferences and detect deviations between global and project needs.

## Acceptance Criteria

- [ ] `spx format init` creates global config if missing (with defaults)
- [ ] `spx format update` merges changes into global config (interactive prompts)
- [ ] `spx format update --force` overwrites global config completely
- [ ] `spx format check` validates global config has required plugins
- [ ] Commands discover global config path automatically (story-21)
- [ ] Commands preserve JSONC comments when modifying config
- [ ] Error messages guide user when dprint not installed
- [ ] Integration tests verify commands with real global config manipulation

## Implementation Notes

### Command Structure

```typescript
// src/cli/commands/format.ts
import { Command } from "commander";

export function createFormatCommand(): Command {
  const format = new Command("format")
    .description("Manage global dprint formatting configuration");

  format
    .command("init")
    .description("Initialize global dprint config with defaults")
    .action(async () => {
      const configPath = await getGlobalDprintConfigPath();
      const existing = await readDprintConfig(configPath);

      if (existing) {
        console.log(`✓ Global config already exists: ${configPath}`);
        return;
      }

      const defaultConfig = buildDprintConfig();
      await writeDprintConfig(configPath, defaultConfig);
      console.log(`✓ Created global config: ${configPath}`);
    });

  format
    .command("update")
    .description("Update global dprint config (merges changes)")
    .option("--force", "Overwrite config completely (no merge)")
    .action(async (options) => {
      const configPath = await getGlobalDprintConfigPath();

      if (options.force) {
        const newConfig = buildDprintConfig();
        await writeDprintConfig(configPath, newConfig);
        console.log(`✓ Overwrote global config: ${configPath}`);
      } else {
        // Interactive prompts for updates
        const updates = await promptForUpdates();
        await mergeDprintConfig(configPath, updates);
        console.log(`✓ Updated global config: ${configPath}`);
      }
    });

  format
    .command("check")
    .description("Validate global dprint config")
    .action(async () => {
      const configPath = await getGlobalDprintConfigPath();
      const config = await readDprintConfig(configPath);

      if (!config) {
        console.error(`✗ Global config not found. Run: spx format init`);
        process.exit(1);
      }

      const validation = validateDprintConfig(config);
      if (!validation.valid) {
        console.error(`✗ Config validation failed:`);
        validation.errors.forEach((err) => console.error(`  - ${err}`));
        process.exit(1);
      }

      console.log(`✓ Global config valid: ${configPath}`);
    });

  return format;
}
```

### Interactive Prompts (Future Enhancement)

For `spx format update`, prompt user for preferences:

- Line width for Markdown
- YAML indentation (2 or 4 spaces)
- Plugin version updates

For MVP, use defaults and focus on `--force` flag.

## Testing Strategy

### Integration Tests (Level 2)

Location: `tests/integration/cli/format-commands.integration.test.ts`

```typescript
describe("spx format commands", () => {
  let tempConfigPath: string;

  beforeEach(async () => {
    const tempDir = await fs.mkdtemp("/tmp/spx-format-test-");
    tempConfigPath = path.join(tempDir, "dprint.jsonc");

    // Mock getGlobalDprintConfigPath to use temp location
    jest.spyOn(configModule, "getGlobalDprintConfigPath")
      .mockResolvedValue(tempConfigPath);
  });

  it("spx format init creates global config", async () => {
    const { exitCode, stdout } = await execa("node", [
      "bin/spx.js",
      "format",
      "init",
    ]);

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Created global config");

    const config = await readDprintConfig(tempConfigPath);
    expect(config?.plugins).toContain("markdown");
    expect(config?.plugins).toContain("pretty_yaml");
  });

  it("spx format update --force overwrites config", async () => {
    // Create initial config with custom settings
    await writeDprintConfig(tempConfigPath, {
      plugins: ["https://plugins.dprint.dev/old-plugin.wasm"],
    });

    const { exitCode } = await execa("node", [
      "bin/spx.js",
      "format",
      "update",
      "--force",
    ]);

    expect(exitCode).toBe(0);

    const config = await readDprintConfig(tempConfigPath);
    expect(config?.plugins).not.toContain("old-plugin");
    expect(config?.plugins).toContain("markdown-0.17.0");
  });

  it("spx format check validates config", async () => {
    await writeDprintConfig(tempConfigPath, buildDprintConfig());

    const { exitCode, stdout } = await execa("node", [
      "bin/spx.js",
      "format",
      "check",
    ]);

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Global config valid");
  });

  it("spx format check fails on invalid config", async () => {
    await writeDprintConfig(tempConfigPath, {
      plugins: [], // Missing required plugins
    });

    await expect(
      execa("node", ["bin/spx.js", "format", "check"]),
    ).rejects.toThrow();
  });
});
```

## Dependencies

- **Depends on**: story-21 (global config discovery), story-32 (config management)
- **Blocks**: None
- **External**: commander (already in dependencies)

## Definition of Done

- [ ] All `spx format` commands implemented (init, update, check)
- [ ] `--force` flag works for overwrite
- [ ] Error handling for missing dprint binary
- [ ] Integration tests pass with real CLI execution
- [ ] Help text clear and actionable (`spx format --help`)
- [ ] Documentation updated in CLAUDE.md
