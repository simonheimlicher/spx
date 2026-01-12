# Story: dprint Config Management

## User Story

As a developer, I need functions to read, validate, and modify dprint global configuration, so that `spx format` commands can manage my formatting preferences programmatically.

## Acceptance Criteria

- [ ] `readDprintConfig()` reads and parses global config (JSON/JSONC)
- [ ] `validateDprintConfig()` ensures config has required plugins (markdown, YAML)
- [ ] `buildDprintConfig()` generates valid config with pinned plugin versions
- [ ] `mergeDprintConfig()` merges user preferences with existing config
- [ ] `writeDprintConfig()` writes config to global location (atomic write)
- [ ] Functions handle missing config file (create with defaults)
- [ ] Functions preserve user comments in JSONC files
- [ ] Unit tests verify config building/validation logic
- [ ] Integration tests verify read/write with fixture configs

## Implementation Notes

### Config Structure

```typescript
interface DprintConfig {
  plugins: string[]; // Pinned plugin URLs
  markdown?: object; // Markdown plugin config
  yaml?: object; // YAML plugin config (pretty_yaml)
  includes?: string[]; // File patterns to format
  excludes?: string[]; // File patterns to skip
}
```

### Core Functions

```typescript
// Read existing config
export async function readDprintConfig(
  configPath: string,
): Promise<DprintConfig | null> {
  try {
    const content = await fs.readFile(configPath, "utf-8");
    return parse(content); // Use jsonc-parser for JSONC support
  } catch (error) {
    if (error.code === "ENOENT") {
      return null; // Config doesn't exist yet
    }
    throw error;
  }
}

// Build default config
export function buildDprintConfig(): DprintConfig {
  return {
    plugins: [
      "https://plugins.dprint.dev/markdown-0.17.0.wasm",
      "https://plugins.dprint.dev/g-plane/pretty_yaml-v0.5.1.wasm",
    ],
    markdown: {
      // User customizable
    },
    yaml: {
      // User customizable
    },
    includes: ["**/*.{md,yaml,yml}"],
    excludes: ["node_modules", "**/node_modules"],
  };
}

// Validate config has required plugins
export function validateDprintConfig(config: DprintConfig): ValidationResult {
  const requiredPlugins = ["markdown", "pretty_yaml"];
  const missingPlugins = requiredPlugins.filter(
    (plugin) => !config.plugins.some((url) => url.includes(plugin)),
  );

  if (missingPlugins.length > 0) {
    return {
      valid: false,
      errors: [`Missing required plugins: ${missingPlugins.join(", ")}`],
    };
  }

  return { valid: true, errors: [] };
}

// Write config (atomic)
export async function writeDprintConfig(
  configPath: string,
  config: DprintConfig,
): Promise<void> {
  const content = JSON.stringify(config, null, 2);
  const tempPath = `${configPath}.tmp`;

  await fs.writeFile(tempPath, content, "utf-8");
  await fs.rename(tempPath, configPath); // Atomic on POSIX systems
}
```

### JSONC Preservation

Use `jsonc-parser` to preserve comments when reading/writing:

```typescript
import { applyEdits, modify, parse } from "jsonc-parser";

export async function mergeDprintConfig(
  configPath: string,
  updates: Partial<DprintConfig>,
): Promise<void> {
  const content = await fs.readFile(configPath, "utf-8");
  const edits = modify(content, ["plugins"], updates.plugins, {});
  const updated = applyEdits(content, edits);

  await fs.writeFile(configPath, updated, "utf-8");
}
```

## Testing Strategy

### Unit Tests (Level 1)

Location: `tests/unit/formatting/dprint-config-management.test.ts`

```typescript
describe("buildDprintConfig", () => {
  it("generates config with pinned plugin versions", () => {
    const config = buildDprintConfig();

    expect(config.plugins).toContain(
      "https://plugins.dprint.dev/markdown-0.17.0.wasm",
    );
    expect(config.plugins).toContain(
      "https://plugins.dprint.dev/g-plane/pretty_yaml-v0.5.1.wasm",
    );
  });

  it("includes markdown and yaml file patterns", () => {
    const config = buildDprintConfig();

    expect(config.includes).toContain("**/*.{md,yaml,yml}");
    expect(config.excludes).toContain("node_modules");
  });
});

describe("validateDprintConfig", () => {
  it("passes when markdown and yaml plugins present", () => {
    const config = buildDprintConfig();
    const result = validateDprintConfig(config);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("fails when markdown plugin missing", () => {
    const config = {
      plugins: ["https://plugins.dprint.dev/g-plane/pretty_yaml-v0.5.1.wasm"],
    };
    const result = validateDprintConfig(config);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(expect.stringContaining("markdown"));
  });
});
```

### Integration Tests (Level 2)

Location: `tests/integration/formatting/dprint-config-management.integration.test.ts`

```typescript
describe("dprint Config Management (Integration)", () => {
  it("writes and reads config file", async () => {
    const tempDir = await fs.mkdtemp("/tmp/dprint-test-");
    const configPath = path.join(tempDir, "dprint.json");

    const originalConfig = buildDprintConfig();
    await writeDprintConfig(configPath, originalConfig);

    const readConfig = await readDprintConfig(configPath);
    expect(readConfig).toEqual(originalConfig);

    await fs.rm(tempDir, { recursive: true });
  });

  it("preserves comments in JSONC file", async () => {
    const tempDir = await fs.mkdtemp("/tmp/dprint-test-");
    const configPath = path.join(tempDir, "dprint.jsonc");

    // Write config with comments
    const withComments = `{
  // User preferences
  "plugins": [
    "https://plugins.dprint.dev/markdown-0.17.0.wasm"
  ]
}`;
    await fs.writeFile(configPath, withComments, "utf-8");

    // Merge updates
    await mergeDprintConfig(configPath, {
      plugins: [
        "https://plugins.dprint.dev/markdown-0.17.0.wasm",
        "https://plugins.dprint.dev/g-plane/pretty_yaml-v0.5.1.wasm",
      ],
    });

    // Verify comments preserved
    const updated = await fs.readFile(configPath, "utf-8");
    expect(updated).toContain("// User preferences");

    await fs.rm(tempDir, { recursive: true });
  });
});
```

## Dependencies

- **Depends on**: story-21 (global config discovery)
- **Blocks**: story-54 (spx format commands), story-65 (deviation detection)
- **External**: `jsonc-parser` package (already in devDependencies)

## Definition of Done

- [ ] All config management functions implemented
- [ ] JSONC comment preservation working
- [ ] All unit tests pass (config building/validation)
- [ ] All integration tests pass (real file I/O)
- [ ] Atomic writes implemented (temp file + rename)
- [ ] Error handling for corrupt config files
- [ ] Code follows DI pattern (fs injectable for testing)
- [ ] JSDoc documentation complete
