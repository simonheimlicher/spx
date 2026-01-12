# Story: Global Config Discovery

## User Story

As a developer, I need the system to discover where dprint stores its global configuration on my platform, so that `spx format` commands can read and modify my global formatting preferences without hardcoding platform-specific paths.

## Acceptance Criteria

- [ ] `discoverGlobalDprintConfig()` function executes `EDITOR=echo dprint config edit --global`
- [ ] Function parses stdout to extract absolute path to global config file
- [ ] Function works on macOS, Linux (XDG), and Windows (if applicable)
- [ ] Function handles case when dprint is not installed (graceful error)
- [ ] Function handles case when global config doesn't exist yet (returns expected path)
- [ ] Result is cached for subsequent calls within same process
- [ ] Unit tests verify parsing logic with fixture outputs
- [ ] Integration tests verify discovery with real dprint binary

## Implementation Notes

### Discovery Method

Use the `EDITOR=echo` trick to make dprint reveal its global config path:

```typescript
async function discoverGlobalDprintConfig(): Promise<string> {
  try {
    const { stdout } = await execa("bash", [
      "-c",
      "EDITOR=echo dprint config edit --global",
    ]);

    return stdout.trim(); // e.g., "/Users/shz/.config/dprint/dprint.jsonc"
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error("dprint binary not found. Install dprint first.");
    }
    throw error;
  }
}
```

### Platform Variations

Expected paths:

- **macOS**: `~/.config/dprint/dprint.jsonc` or `$XDG_CONFIG_HOME/dprint/dprint.jsonc`
- **Linux**: `$XDG_CONFIG_HOME/dprint/dprint.jsonc` or `~/.config/dprint/dprint.jsonc`
- **Windows**: `%LOCALAPPDATA%\dprint\config\dprint.jsonc` (if supported)

### Caching Strategy

```typescript
let cachedGlobalConfigPath: string | null = null;

export async function getGlobalDprintConfigPath(): Promise<string> {
  if (cachedGlobalConfigPath) {
    return cachedGlobalConfigPath;
  }

  cachedGlobalConfigPath = await discoverGlobalDprintConfig();
  return cachedGlobalConfigPath;
}
```

## Testing Strategy

### Unit Tests (Level 1)

Location: `tests/unit/formatting/global-config-discovery.test.ts`

```typescript
describe("discoverGlobalDprintConfig", () => {
  it("parses macOS XDG path from dprint output", () => {
    const output = "/Users/shz/.config/dprint/dprint.jsonc\n";
    const result = parseGlobalConfigPath(output);
    expect(result).toBe("/Users/shz/.config/dprint/dprint.jsonc");
  });

  it("parses Linux XDG path from dprint output", () => {
    const output = "/home/user/.config/dprint/dprint.jsonc\n";
    const result = parseGlobalConfigPath(output);
    expect(result).toBe("/home/user/.config/dprint/dprint.jsonc");
  });

  it("throws error when dprint not installed", async () => {
    // Mock execa to throw ENOENT
    await expect(discoverGlobalDprintConfig()).rejects.toThrow(
      "dprint binary not found",
    );
  });
});
```

### Integration Tests (Level 2)

Location: `tests/integration/formatting/global-config-discovery.integration.test.ts`

```typescript
describe("Global Config Discovery (Integration)", () => {
  it("discovers global dprint config path on current platform", async () => {
    const configPath = await getGlobalDprintConfigPath();

    // Verify path is absolute
    expect(path.isAbsolute(configPath)).toBe(true);

    // Verify path contains expected structure
    expect(configPath).toMatch(/dprint/);
    expect(configPath).toMatch(/dprint\.jsonc?$/);
  });

  it("caches result on subsequent calls", async () => {
    const first = await getGlobalDprintConfigPath();
    const second = await getGlobalDprintConfigPath();

    expect(first).toBe(second);
    // Verify only one shell execution (mock/spy on execa)
  });
});
```

## Dependencies

- **Blocks**: story-32 (config management needs discovery), story-54 (spx format commands need discovery)
- **Requires**: dprint binary installed on system (dev dependency, documented in setup)

## Definition of Done

- [ ] `discoverGlobalDprintConfig()` implemented with error handling
- [ ] `getGlobalDprintConfigPath()` implemented with caching
- [ ] All unit tests pass (parsing logic)
- [ ] All integration tests pass (real dprint binary)
- [ ] Error messages are clear and actionable
- [ ] Code follows DI pattern (execa injectable for testing)
- [ ] No mocking of execa in integration tests
- [ ] Documentation updated in function JSDoc
