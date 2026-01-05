/**
 * Level 1: Unit tests for next command logic
 * Story: story-32_next-command
 */
import { describe, it, expect } from "vitest";
import { findNextWorkItem } from "@/commands/next";
import { createNode } from "../../helpers/tree-builder";
import type { WorkItemTree } from "@/tree/types";

describe("findNextWorkItem", () => {
  /**
   * Level 1: Pure selection logic tests
   */

  it("GIVEN IN_PROGRESS and OPEN items WHEN finding next THEN returns IN_PROGRESS with lowest number", () => {
    // Given: Tree with IN_PROGRESS story-32 and OPEN story-21
    const inProgressStory = createNode("story", 32, "in-progress", "IN_PROGRESS");
    const openStory = createNode("story", 21, "open", "OPEN");
    const feat = createNode("feature", 21, "test", "IN_PROGRESS", [
      openStory,
      inProgressStory,
    ]);
    const cap = createNode("capability", 20, "test", "IN_PROGRESS", [feat]);
    const tree: WorkItemTree = { nodes: [cap] };

    // When
    const next = findNextWorkItem(tree);

    // Then: Should return IN_PROGRESS story-32 (not the lower numbered OPEN story-21)
    expect(next).not.toBeNull();
    expect(next?.status).toBe("IN_PROGRESS");
    expect(next?.number).toBe(32);
    expect(next?.slug).toBe("in-progress");
  });

  it("GIVEN multiple IN_PROGRESS items WHEN finding next THEN returns lowest numbered", () => {
    // Given: Tree with IN_PROGRESS story-43 and story-32
    const story32 = createNode("story", 32, "second", "IN_PROGRESS");
    const story43 = createNode("story", 43, "third", "IN_PROGRESS");
    const feat = createNode("feature", 21, "test", "IN_PROGRESS", [
      story43,
      story32,
    ]);
    const cap = createNode("capability", 20, "test", "IN_PROGRESS", [feat]);
    const tree: WorkItemTree = { nodes: [cap] };

    // When
    const next = findNextWorkItem(tree);

    // Then: Should return story-32 (lowest BSP number)
    expect(next).not.toBeNull();
    expect(next?.number).toBe(32);
    expect(next?.slug).toBe("second");
  });

  it("GIVEN only OPEN items WHEN finding next THEN returns OPEN with lowest number", () => {
    // Given: Tree with OPEN story-21 and story-32
    const story21 = createNode("story", 21, "first", "OPEN");
    const story32 = createNode("story", 32, "second", "OPEN");
    const feat = createNode("feature", 21, "test", "OPEN", [story21, story32]);
    const cap = createNode("capability", 20, "test", "OPEN", [feat]);
    const tree: WorkItemTree = { nodes: [cap] };

    // When
    const next = findNextWorkItem(tree);

    // Then: Should return story-21 (lowest number)
    expect(next).not.toBeNull();
    expect(next?.status).toBe("OPEN");
    expect(next?.number).toBe(21);
    expect(next?.slug).toBe("first");
  });

  it("GIVEN all DONE WHEN finding next THEN returns null", () => {
    // Given: Tree with all stories DONE
    const story1 = createNode("story", 21, "done1", "DONE");
    const story2 = createNode("story", 32, "done2", "DONE");
    const feat = createNode("feature", 21, "test", "DONE", [story1, story2]);
    const cap = createNode("capability", 20, "test", "DONE", [feat]);
    const tree: WorkItemTree = { nodes: [cap] };

    // When
    const next = findNextWorkItem(tree);

    // Then: Should return null (all done)
    expect(next).toBeNull();
  });

  it("GIVEN empty tree WHEN finding next THEN returns null", () => {
    // Given: Empty tree
    const tree: WorkItemTree = { nodes: [] };

    // When
    const next = findNextWorkItem(tree);

    // Then: Should return null
    expect(next).toBeNull();
  });

  it("GIVEN tree with no stories WHEN finding next THEN returns null", () => {
    // Given: Tree with only capability and feature, no stories
    const feat = createNode("feature", 21, "test", "OPEN", []);
    const cap = createNode("capability", 20, "test", "OPEN", [feat]);
    const tree: WorkItemTree = { nodes: [cap] };

    // When
    const next = findNextWorkItem(tree);

    // Then: Should return null (no stories to work on)
    expect(next).toBeNull();
  });

  it("GIVEN multiple capabilities WHEN finding next THEN searches all", () => {
    // Given: Two capabilities, second has IN_PROGRESS story with lower number
    const story21Cap1 = createNode("story", 43, "cap1-story", "OPEN");
    const feat1 = createNode("feature", 21, "test1", "OPEN", [story21Cap1]);
    const cap1 = createNode("capability", 20, "test1", "OPEN", [feat1]);

    const story21Cap2 = createNode("story", 21, "cap2-story", "IN_PROGRESS");
    const feat2 = createNode("feature", 21, "test2", "IN_PROGRESS", [
      story21Cap2,
    ]);
    const cap2 = createNode("capability", 21, "test2", "IN_PROGRESS", [feat2]);

    const tree: WorkItemTree = { nodes: [cap1, cap2] };

    // When
    const next = findNextWorkItem(tree);

    // Then: Should return story-21 from cap2 (IN_PROGRESS, lowest number)
    expect(next).not.toBeNull();
    expect(next?.status).toBe("IN_PROGRESS");
    expect(next?.number).toBe(21);
    expect(next?.slug).toBe("cap2-story");
  });
});
