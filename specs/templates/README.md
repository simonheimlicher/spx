# specs/templates/

Templates and structure definition for the specs directory.

## Files

| File             | Purpose                                              |
| ---------------- | ---------------------------------------------------- |
| `structure.yaml` | Machine-readable structure definition for spx parser |
| `work-items/`    | Templates for capability, feature, story, DONE.md    |
| `decisions/`     | Template for ADRs                                    |
| `requirements/`  | Template for TRDs                                    |

## Why structure.yaml?

The spx CLI needs to parse the specs directory to determine work item status. We have two options:

1. **Hardcode the structure** in TypeScript
2. **Define it declaratively** in YAML

We chose YAML because:

- **Configurable**: Users can rename levels (capability → epic) or add levels without code changes
- **Self-documenting**: The structure is visible and version-controlled
- **No LLM required**: A markdown file would need an LLM to parse; YAML is deterministic

## Parsing Guide

### Pattern Types

The structure uses three pattern types:

```yaml
name: "tests" # Exact match: dir === "tests"
pattern: "{level}-{bsp}_{slug}" # Variable substitution
glob: "*.test.ts" # Filesystem glob
```

### Parsing a Pattern

To match `pattern: "{level}-{bsp}_{slug}"` against `"capability-21_core-cli"`:

```typescript
// 1. Convert pattern to regex
const pattern = "{level}-{bsp}_{slug}";
const regex = pattern
  .replace("{level}", "(?<level>[a-z]+)")
  .replace("{bsp}", "(?<bsp>\\d{2})")
  .replace("{slug}", "(?<slug>[a-z0-9-]+)");
// Result: /(?<level>[a-z]+)-(?<bsp>\d{2})_(?<slug>[a-z0-9-]+)/

// 2. Match and extract
const match = "capability-21_core-cli".match(new RegExp(regex));
// match.groups = { level: "capability", bsp: "21", slug: "core-cli" }
```

### Variables

| Variable  | Type   | Description                                       |
| --------- | ------ | ------------------------------------------------- |
| `{level}` | string | Work item level name (capability, feature, story) |
| `{bsp}`   | number | Two-digit BSP number (10-99)                      |
| `{slug}`  | string | Kebab-case identifier                             |
| `{nnn}`   | number | Three-digit sequence number for ADRs              |

### Determining Hierarchy

Levels are ordered in the YAML. The hierarchy is implicit:

```yaml
levels:
  - name: capability # Level 0 (root)
  - name: feature # Level 1 (child of capability)
  - name: story # Level 2 (child of feature, leaf)
```

To find valid children of a work item:

1. Find the item's level index
2. Children use the pattern for `levels[index + 1]`
3. If `index + 1 >= levels.length`, item is a leaf

### Determining Status

```typescript
function getStatus(workItemPath: string, config: Structure): Status {
  const testsDir = path.join(
    workItemPath,
    config.patterns.tests.directory.name,
  );
  const doneFile = path.join(testsDir, config.patterns.tests.done_marker.name);

  if (!existsSync(testsDir) || readdirSync(testsDir).length === 0) {
    return "OPEN";
  }

  if (existsSync(doneFile)) {
    return "DONE";
  }

  return "IN_PROGRESS";
}
```

### Walking the Tree

```typescript
function walkSpecs(specsRoot: string, config: Structure): WorkItem[] {
  const items: WorkItem[] = [];

  for (const root of config.roots) {
    const rootPath = path.join(specsRoot, root);
    walkLevel(rootPath, 0, config, items);
  }

  return items;
}

function walkLevel(
  dir: string,
  levelIndex: number,
  config: Structure,
  items: WorkItem[],
) {
  const level = config.levels[levelIndex];
  if (!level) return;

  const pattern = config.patterns.work_item.directory.pattern;
  const regex = patternToRegex(pattern, level.name);

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;

    const match = entry.name.match(regex);
    if (!match) continue;

    const itemPath = path.join(dir, entry.name);
    items.push({
      level: level.name,
      bsp: parseInt(match.groups.bsp),
      slug: match.groups.slug,
      path: itemPath,
      status: getStatus(itemPath, config),
    });

    // Recurse to children
    walkLevel(itemPath, levelIndex + 1, config, items);
  }
}
```

## Extensibility Examples

### Rename "story" to "task"

```yaml
levels:
  - name: capability
    # ...
  - name: feature
    # ...
  - name: task # Changed from "story"
    tests:
      type: unit
      graduate_to: "tests/unit/"
```

Directories auto-match `task-{bsp}_{slug}`, files match `{slug}.task.md`.

### Add "epic" level above capability

```yaml
levels:
  - name: epic # New top level
    catalyst:
      glob: "*.vision.md"
    decisions: true
    tests:
      type: e2e
      graduate_to: "tests/e2e/"
  - name: capability
    # ...
```

### Custom directory pattern

```yaml
levels:
  - name: capability
    directory:
      pattern: "cap-{bsp}_{slug}" # Override default
    # ...
```
