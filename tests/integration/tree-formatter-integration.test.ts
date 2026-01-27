/**
 * Integration test: Feature 54 (Tree Building) + Feature 65 (Output Formatting)
 *
 * Verifies that trees built by buildTree() can be consumed by all formatters.
 */
import { DEFAULT_CONFIG } from "@/config/defaults";
import { formatJSON } from "@/reporter/json";
import { formatMarkdown } from "@/reporter/markdown";
import { formatTable } from "@/reporter/table";
import { formatText } from "@/reporter/text";
import { buildTree, type TreeBuildDeps } from "@/tree/build";
import { WORK_ITEM_KINDS, WORK_ITEM_STATUSES, type WorkItem } from "@/types";
import { describe, expect, it } from "vitest";

/**
 * Test dependency: simple status resolver
 */
const testDeps: TreeBuildDeps = {
  getStatus: async (path) => {
    // Simulate different statuses
    if (path.includes("story-21")) return WORK_ITEM_STATUSES[2];
    if (path.includes("story-32")) return WORK_ITEM_STATUSES[1];
    if (path.includes("story-43")) return WORK_ITEM_STATUSES[0];
    // Features and capabilities will get their status from rollup
    return WORK_ITEM_STATUSES[0];
  },
};

describe("Feature 54 + Feature 65 Integration", () => {
  it("GIVEN tree from buildTree WHEN formatting as text THEN renders correctly", async () => {
    // Given - add multiple stories with different statuses
    const workItems: WorkItem[] = [
      {
        kind: WORK_ITEM_KINDS[0],
        number: 20,
        slug: "core-cli",
        path: "/specs/capability-21_core-cli",
      },
      {
        kind: WORK_ITEM_KINDS[1],
        number: 32,
        slug: "tree-building",
        path: "/specs/capability-21_core-cli/feature-32_tree-building",
      },
      {
        kind: WORK_ITEM_KINDS[2],
        number: 21,
        slug: "parent-child",
        path: "/specs/capability-21_core-cli/feature-32_tree-building/story-21_parent-child",
      },
      {
        kind: WORK_ITEM_KINDS[2],
        number: 32,
        slug: "sorting",
        path: "/specs/capability-21_core-cli/feature-32_tree-building/story-32_sorting",
      },
    ];

    // When
    const tree = await buildTree(workItems, testDeps);
    const output = formatText(tree);

    // Then
    expect(output).toContain("capability-21_core-cli");
    expect(output).toContain("feature-32_tree-building");
    expect(output).toContain("story-21_parent-child");
    expect(output).toContain("[DONE]"); // Story 21 status
    expect(output).toContain("[IN_PROGRESS]"); // Rolled up from mixed DONE/IN_PROGRESS
  });

  it("GIVEN tree from buildTree WHEN formatting as JSON THEN produces valid JSON", async () => {
    // Given
    const workItems: WorkItem[] = [
      {
        kind: WORK_ITEM_KINDS[0],
        number: 20,
        slug: "test",
        path: "/specs/capability-21_test",
      },
      {
        kind: WORK_ITEM_KINDS[1],
        number: 32,
        slug: "feat",
        path: "/specs/capability-21_test/feature-32_feat",
      },
    ];

    // When
    const tree = await buildTree(workItems, testDeps);
    const output = formatJSON(tree, DEFAULT_CONFIG);

    // Then
    expect(() => JSON.parse(output)).not.toThrow();
    const parsed = JSON.parse(output);
    expect(parsed.capabilities).toBeDefined();
    expect(parsed.capabilities[0].number).toBe(21); // Display number
    expect(parsed.capabilities[0].features[0].number).toBe(32);
  });

  it("GIVEN tree from buildTree WHEN formatting as markdown THEN uses correct heading levels", async () => {
    // Given
    const workItems: WorkItem[] = [
      {
        kind: WORK_ITEM_KINDS[0],
        number: 20,
        slug: "test",
        path: "/specs/capability-21_test",
      },
      {
        kind: WORK_ITEM_KINDS[1],
        number: 32,
        slug: "feat",
        path: "/specs/capability-21_test/feature-32_feat",
      },
    ];

    // When
    const tree = await buildTree(workItems, testDeps);
    const output = formatMarkdown(tree);

    // Then
    expect(output).toMatch(/^# capability-21_test/m);
    expect(output).toMatch(/^## feature-32_feat/m);
  });

  it("GIVEN tree from buildTree WHEN formatting as table THEN has proper structure", async () => {
    // Given
    const workItems: WorkItem[] = [
      {
        kind: WORK_ITEM_KINDS[0],
        number: 20,
        slug: "test",
        path: "/specs/capability-21_test",
      },
    ];

    // When
    const tree = await buildTree(workItems, testDeps);
    const output = formatTable(tree);

    // Then
    expect(output).toContain("| Level");
    expect(output).toContain("| Capability");
    expect(output).toMatch(/\|\s*21\s*\|/); // Display number
  });

  it("GIVEN tree with BSP-sorted children WHEN formatting THEN preserves order", async () => {
    // Given - features out of order in input
    const workItems: WorkItem[] = [
      {
        kind: WORK_ITEM_KINDS[0],
        number: 20,
        slug: "test",
        path: "/specs/capability-21_test",
      },
      {
        kind: WORK_ITEM_KINDS[1],
        number: 65,
        slug: "feat3",
        path: "/specs/capability-21_test/feature-65_feat3",
      },
      {
        kind: WORK_ITEM_KINDS[1],
        number: 32,
        slug: "feat1",
        path: "/specs/capability-21_test/feature-32_feat1",
      },
    ];

    // When
    const tree = await buildTree(workItems, testDeps);
    const output = formatText(tree);

    // Then - should be in BSP order (32 before 65)
    const feat1Index = output.indexOf("feature-32_feat1");
    const feat3Index = output.indexOf("feature-65_feat3");
    expect(feat1Index).toBeLessThan(feat3Index);
  });
});
