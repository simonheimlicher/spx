import { buildTree, type TreeBuildDeps } from "@/tree/build";
import { WORK_ITEM_KINDS, WORK_ITEM_STATUSES, type WorkItem, type WorkItemKind } from "@/types";
import { describe, expect, it } from "vitest";

/**
 * Helper to create WorkItem with path
 */
function createWorkItemWithPath(
  kind: WorkItemKind,
  number: number,
  slug: string,
  path: string,
): WorkItem {
  return {
    kind,
    number,
    slug,
    path,
  };
}

/**
 * Test dependency: simple status resolver that returns OPEN for all items
 * (For Level 1 testing - pure functions without filesystem access)
 */
const testDeps: TreeBuildDeps = {
  getStatus: async () => WORK_ITEM_STATUSES[0],
};

describe("buildTree - Parent-Child Links", () => {
  describe("GIVEN capability with feature", () => {
    it("WHEN building tree THEN feature is child of capability", async () => {
      const workItems: WorkItem[] = [
        createWorkItemWithPath(
          WORK_ITEM_KINDS[0],
          20,
          "test",
          "/specs/capability-21_test",
        ),
        createWorkItemWithPath(
          WORK_ITEM_KINDS[1],
          32,
          "feat",
          "/specs/capability-21_test/feature-32_feat",
        ),
      ];

      const tree = await buildTree(workItems, testDeps);

      expect(tree.nodes).toHaveLength(1);
      expect(tree.nodes[0].kind).toBe(WORK_ITEM_KINDS[0]);
      expect(tree.nodes[0].children).toHaveLength(1);
      expect(tree.nodes[0].children[0].slug).toBe("feat");
    });
  });

  describe("GIVEN feature with story", () => {
    it("WHEN building tree THEN story is child of feature", async () => {
      const workItems: WorkItem[] = [
        createWorkItemWithPath(
          WORK_ITEM_KINDS[0],
          20,
          "test",
          "/specs/capability-21_test",
        ),
        createWorkItemWithPath(
          WORK_ITEM_KINDS[1],
          32,
          "feat",
          "/specs/capability-21_test/feature-32_feat",
        ),
        createWorkItemWithPath(
          WORK_ITEM_KINDS[2],
          21,
          WORK_ITEM_KINDS[2],
          "/specs/capability-21_test/feature-32_feat/story-21_story",
        ),
      ];

      const tree = await buildTree(workItems, testDeps);

      const feature = tree.nodes[0].children[0];
      expect(feature.children).toHaveLength(1);
      expect(feature.children[0].slug).toBe(WORK_ITEM_KINDS[2]);
    });
  });

  describe("GIVEN capability with multiple features", () => {
    it("WHEN building tree THEN all features linked", async () => {
      const workItems: WorkItem[] = [
        createWorkItemWithPath(
          WORK_ITEM_KINDS[0],
          20,
          "test",
          "/specs/capability-21_test",
        ),
        createWorkItemWithPath(
          WORK_ITEM_KINDS[1],
          32,
          "feat1",
          "/specs/capability-21_test/feature-32_feat1",
        ),
        createWorkItemWithPath(
          WORK_ITEM_KINDS[1],
          43,
          "feat2",
          "/specs/capability-21_test/feature-43_feat2",
        ),
      ];

      const tree = await buildTree(workItems, testDeps);

      expect(tree.nodes[0].children).toHaveLength(2);
    });
  });

  describe("GIVEN orphan work items", () => {
    it("WHEN building tree THEN throws error", async () => {
      const workItems: WorkItem[] = [
        createWorkItemWithPath(WORK_ITEM_KINDS[2], 21, "orphan", "/specs/story-21_orphan"),
      ];

      await expect(buildTree(workItems, testDeps)).rejects.toThrow(
        /orphan|parent/i,
      );
    });
  });

  describe("GIVEN multiple capabilities", () => {
    it("WHEN building tree THEN returns all at root level", async () => {
      const workItems: WorkItem[] = [
        createWorkItemWithPath(
          WORK_ITEM_KINDS[0],
          20,
          "cap1",
          "/specs/capability-21_cap1",
        ),
        createWorkItemWithPath(
          WORK_ITEM_KINDS[0],
          31,
          "cap2",
          "/specs/capability-32_cap2",
        ),
      ];

      const tree = await buildTree(workItems, testDeps);

      expect(tree.nodes).toHaveLength(2);
    });
  });
});

describe("buildTree - BSP Sorting", () => {
  describe("GIVEN features with mixed BSP numbers", () => {
    it("WHEN building tree THEN sorted ascending by number", async () => {
      const workItems: WorkItem[] = [
        createWorkItemWithPath(
          WORK_ITEM_KINDS[0],
          20,
          "test",
          "/specs/capability-21_test",
        ),
        createWorkItemWithPath(
          WORK_ITEM_KINDS[1],
          65,
          "feat3",
          "/specs/capability-21_test/feature-65_feat3",
        ),
        createWorkItemWithPath(
          WORK_ITEM_KINDS[1],
          32,
          "feat1",
          "/specs/capability-21_test/feature-32_feat1",
        ),
        createWorkItemWithPath(
          WORK_ITEM_KINDS[1],
          43,
          "feat2",
          "/specs/capability-21_test/feature-43_feat2",
        ),
      ];

      const tree = await buildTree(workItems, testDeps);

      const features = tree.nodes[0].children;
      expect(features.map((f) => f.number)).toEqual([32, 43, 65]);
      expect(features.map((f) => f.slug)).toEqual(["feat1", "feat2", "feat3"]);
    });
  });

  describe("GIVEN stories with mixed BSP numbers", () => {
    it("WHEN building tree THEN sorted ascending by number", async () => {
      const workItems: WorkItem[] = [
        createWorkItemWithPath(
          WORK_ITEM_KINDS[0],
          20,
          "test",
          "/specs/capability-21_test",
        ),
        createWorkItemWithPath(
          WORK_ITEM_KINDS[1],
          32,
          "feat",
          "/specs/capability-21_test/feature-32_feat",
        ),
        createWorkItemWithPath(
          WORK_ITEM_KINDS[2],
          54,
          "story3",
          "/specs/capability-21_test/feature-32_feat/story-54_story3",
        ),
        createWorkItemWithPath(
          WORK_ITEM_KINDS[2],
          21,
          "story1",
          "/specs/capability-21_test/feature-32_feat/story-21_story1",
        ),
        createWorkItemWithPath(
          WORK_ITEM_KINDS[2],
          43,
          "story2",
          "/specs/capability-21_test/feature-32_feat/story-43_story2",
        ),
      ];

      const tree = await buildTree(workItems, testDeps);

      const stories = tree.nodes[0].children[0].children;
      expect(stories.map((s) => s.number)).toEqual([21, 43, 54]);
    });
  });

  describe("GIVEN multiple capabilities with mixed BSP numbers", () => {
    it("WHEN building tree THEN sorted ascending by number", async () => {
      const workItems: WorkItem[] = [
        createWorkItemWithPath(
          WORK_ITEM_KINDS[0],
          31,
          "cap2",
          "/specs/capability-32_cap2",
        ),
        createWorkItemWithPath(
          WORK_ITEM_KINDS[0],
          20,
          "cap1",
          "/specs/capability-21_cap1",
        ),
        createWorkItemWithPath(
          WORK_ITEM_KINDS[0],
          42,
          "cap3",
          "/specs/capability-43_cap3",
        ),
      ];

      const tree = await buildTree(workItems, testDeps);

      expect(tree.nodes.map((c) => c.number)).toEqual([20, 31, 42]);
    });
  });
});

describe("buildTree - Status Rollup", () => {
  describe("GIVEN own DONE and all children DONE", () => {
    it("WHEN rolling up status THEN parent is DONE", async () => {
      const statusMap: Record<string, string> = {
        "/specs/capability-21_test": WORK_ITEM_STATUSES[2],
        "/specs/capability-21_test/feature-32_feat1": WORK_ITEM_STATUSES[2],
        "/specs/capability-21_test/feature-43_feat2": WORK_ITEM_STATUSES[2],
      };

      const depsWithStatus: TreeBuildDeps = {
        getStatus: async (path) => statusMap[path] || WORK_ITEM_STATUSES[0],
      };

      const workItems: WorkItem[] = [
        createWorkItemWithPath(
          WORK_ITEM_KINDS[0],
          20,
          "test",
          "/specs/capability-21_test",
        ),
        createWorkItemWithPath(
          WORK_ITEM_KINDS[1],
          32,
          "feat1",
          "/specs/capability-21_test/feature-32_feat1",
        ),
        createWorkItemWithPath(
          WORK_ITEM_KINDS[1],
          43,
          "feat2",
          "/specs/capability-21_test/feature-43_feat2",
        ),
      ];

      const tree = await buildTree(workItems, depsWithStatus);

      expect(tree.nodes[0].status).toBe(WORK_ITEM_STATUSES[2]);
    });
  });

  describe("GIVEN own OPEN but all children DONE", () => {
    it("WHEN rolling up status THEN parent is IN_PROGRESS (own work pending)", async () => {
      const statusMap: Record<string, string> = {
        "/specs/capability-21_test": WORK_ITEM_STATUSES[0],
        "/specs/capability-21_test/feature-32_feat1": WORK_ITEM_STATUSES[2],
        "/specs/capability-21_test/feature-43_feat2": WORK_ITEM_STATUSES[2],
      };

      const depsWithStatus: TreeBuildDeps = {
        getStatus: async (path) => statusMap[path] || WORK_ITEM_STATUSES[0],
      };

      const workItems: WorkItem[] = [
        createWorkItemWithPath(
          WORK_ITEM_KINDS[0],
          20,
          "test",
          "/specs/capability-21_test",
        ),
        createWorkItemWithPath(
          WORK_ITEM_KINDS[1],
          32,
          "feat1",
          "/specs/capability-21_test/feature-32_feat1",
        ),
        createWorkItemWithPath(
          WORK_ITEM_KINDS[1],
          43,
          "feat2",
          "/specs/capability-21_test/feature-43_feat2",
        ),
      ];

      const tree = await buildTree(workItems, depsWithStatus);

      expect(tree.nodes[0].status).toBe(WORK_ITEM_STATUSES[1]);
    });
  });

  describe("GIVEN own DONE but any child IN_PROGRESS", () => {
    it("WHEN rolling up status THEN parent is IN_PROGRESS", async () => {
      const statusMap: Record<string, string> = {
        "/specs/capability-21_test": WORK_ITEM_STATUSES[2],
        "/specs/capability-21_test/feature-32_feat1": WORK_ITEM_STATUSES[2],
        "/specs/capability-21_test/feature-43_feat2": WORK_ITEM_STATUSES[1],
      };

      const depsWithStatus: TreeBuildDeps = {
        getStatus: async (path) => statusMap[path] || WORK_ITEM_STATUSES[0],
      };

      const workItems: WorkItem[] = [
        createWorkItemWithPath(
          WORK_ITEM_KINDS[0],
          20,
          "test",
          "/specs/capability-21_test",
        ),
        createWorkItemWithPath(
          WORK_ITEM_KINDS[1],
          32,
          "feat1",
          "/specs/capability-21_test/feature-32_feat1",
        ),
        createWorkItemWithPath(
          WORK_ITEM_KINDS[1],
          43,
          "feat2",
          "/specs/capability-21_test/feature-43_feat2",
        ),
      ];

      const tree = await buildTree(workItems, depsWithStatus);

      expect(tree.nodes[0].status).toBe(WORK_ITEM_STATUSES[1]);
    });
  });

  describe("GIVEN mixed DONE and OPEN children", () => {
    it("WHEN rolling up status THEN parent is IN_PROGRESS", async () => {
      const statusMap: Record<string, string> = {
        "/specs/capability-21_test": WORK_ITEM_STATUSES[0],
        "/specs/capability-21_test/feature-32_feat1": WORK_ITEM_STATUSES[2],
        "/specs/capability-21_test/feature-43_feat2": WORK_ITEM_STATUSES[0],
      };

      const depsWithStatus: TreeBuildDeps = {
        getStatus: async (path) => statusMap[path] || WORK_ITEM_STATUSES[0],
      };

      const workItems: WorkItem[] = [
        createWorkItemWithPath(
          WORK_ITEM_KINDS[0],
          20,
          "test",
          "/specs/capability-21_test",
        ),
        createWorkItemWithPath(
          WORK_ITEM_KINDS[1],
          32,
          "feat1",
          "/specs/capability-21_test/feature-32_feat1",
        ),
        createWorkItemWithPath(
          WORK_ITEM_KINDS[1],
          43,
          "feat2",
          "/specs/capability-21_test/feature-43_feat2",
        ),
      ];

      const tree = await buildTree(workItems, depsWithStatus);

      expect(tree.nodes[0].status).toBe(WORK_ITEM_STATUSES[1]);
    });
  });

  describe("GIVEN own OPEN and all children OPEN", () => {
    it("WHEN rolling up status THEN parent is OPEN", async () => {
      const statusMap: Record<string, string> = {
        "/specs/capability-21_test": WORK_ITEM_STATUSES[0],
        "/specs/capability-21_test/feature-32_feat1": WORK_ITEM_STATUSES[0],
        "/specs/capability-21_test/feature-43_feat2": WORK_ITEM_STATUSES[0],
      };

      const depsWithStatus: TreeBuildDeps = {
        getStatus: async (path) => statusMap[path] || WORK_ITEM_STATUSES[0],
      };

      const workItems: WorkItem[] = [
        createWorkItemWithPath(
          WORK_ITEM_KINDS[0],
          20,
          "test",
          "/specs/capability-21_test",
        ),
        createWorkItemWithPath(
          WORK_ITEM_KINDS[1],
          32,
          "feat1",
          "/specs/capability-21_test/feature-32_feat1",
        ),
        createWorkItemWithPath(
          WORK_ITEM_KINDS[1],
          43,
          "feat2",
          "/specs/capability-21_test/feature-43_feat2",
        ),
      ];

      const tree = await buildTree(workItems, depsWithStatus);

      expect(tree.nodes[0].status).toBe(WORK_ITEM_STATUSES[0]);
    });
  });

  describe("GIVEN own IN_PROGRESS and all children OPEN", () => {
    it("WHEN rolling up status THEN parent is IN_PROGRESS", async () => {
      const statusMap: Record<string, string> = {
        "/specs/capability-21_test": WORK_ITEM_STATUSES[1],
        "/specs/capability-21_test/feature-32_feat1": WORK_ITEM_STATUSES[0],
        "/specs/capability-21_test/feature-43_feat2": WORK_ITEM_STATUSES[0],
      };

      const depsWithStatus: TreeBuildDeps = {
        getStatus: async (path) => statusMap[path] || WORK_ITEM_STATUSES[0],
      };

      const workItems: WorkItem[] = [
        createWorkItemWithPath(
          WORK_ITEM_KINDS[0],
          20,
          "test",
          "/specs/capability-21_test",
        ),
        createWorkItemWithPath(
          WORK_ITEM_KINDS[1],
          32,
          "feat1",
          "/specs/capability-21_test/feature-32_feat1",
        ),
        createWorkItemWithPath(
          WORK_ITEM_KINDS[1],
          43,
          "feat2",
          "/specs/capability-21_test/feature-43_feat2",
        ),
      ];

      const tree = await buildTree(workItems, depsWithStatus);

      expect(tree.nodes[0].status).toBe(WORK_ITEM_STATUSES[1]);
    });
  });
});
