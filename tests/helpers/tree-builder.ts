/**
 * Synthetic tree builders for testing formatters
 *
 * These create fake trees for testing Feature 65 (formatters) without requiring
 * Feature 54 (tree building) to be complete.
 */
import type { TreeNode, WorkItemTree } from "@/tree/types";
import type { WorkItemStatus, WorkItemKind } from "@/types";

/**
 * Create a synthetic tree node
 *
 * @param kind - Work item type
 * @param number - Internal BSP number
 * @param slug - URL-safe identifier
 * @param status - Work item status
 * @param children - Child nodes (will be BSP-sorted)
 * @returns TreeNode with sorted children
 */
export function createNode(
  kind: WorkItemKind,
  number: number,
  slug: string,
  status: WorkItemStatus,
  children: TreeNode[] = []
): TreeNode {
  return {
    kind,
    number,
    slug,
    path: `/test/${kind}-${kind === "capability" ? number + 1 : number}_${slug}`,
    status,
    children: children.sort((a, b) => a.number - b.number), // BSP sort
  };
}

/**
 * Build a simple tree with single capability, no children
 *
 * Used by: text, markdown, table formatters
 */
export function buildSimpleTree(): WorkItemTree {
  const cap = createNode("capability", 20, "test", "DONE");
  return { nodes: [cap] };
}

/**
 * Build tree with capability containing features
 *
 * Structure:
 * - capability-21_test [IN_PROGRESS]
 *   - feature-21_test [DONE]
 *   - feature-32_test [OPEN]
 *
 * Used by: text, markdown formatters
 */
export function buildTreeWithFeatures(): WorkItemTree {
  const feat1 = createNode("feature", 21, "test", "DONE");
  const feat2 = createNode("feature", 32, "test", "OPEN");
  const cap = createNode("capability", 20, "test", "IN_PROGRESS", [
    feat1,
    feat2,
  ]);

  return { nodes: [cap] };
}

/**
 * Build full 3-level tree
 *
 * Structure:
 * - capability-21_test [DONE]
 *   - feature-21_test [DONE]
 *     - story-21_test [DONE]
 *     - story-32_test [DONE]
 *
 * Used by: text, JSON, markdown, table formatters
 */
export function buildTreeWithStories(): WorkItemTree {
  const story1 = createNode("story", 21, "test", "DONE");
  const story2 = createNode("story", 32, "test", "DONE");
  const feat = createNode("feature", 21, "test", "DONE", [story1, story2]);
  const cap = createNode("capability", 20, "test", "DONE", [feat]);

  return { nodes: [cap] };
}

/**
 * Build tree with mixed statuses for testing status display
 *
 * Structure:
 * - capability-21_test [IN_PROGRESS]
 *   - feature-21_test [DONE]
 *     - story-21_done [DONE]
 *   - feature-32_test [IN_PROGRESS]
 *     - story-32_progress [IN_PROGRESS]
 *     - story-43_open [OPEN]
 *
 * Used by: text, markdown formatters (status display)
 */
export function buildTreeWithStatus(): WorkItemTree {
  const doneStory = createNode("story", 21, "done", "DONE");
  const doneFeat = createNode("feature", 21, "test", "DONE", [doneStory]);

  const progressStory = createNode("story", 32, "progress", "IN_PROGRESS");
  const openStory = createNode("story", 43, "open", "OPEN");
  const mixedFeat = createNode("feature", 32, "test", "IN_PROGRESS", [
    progressStory,
    openStory,
  ]);

  const cap = createNode("capability", 20, "test", "IN_PROGRESS", [
    doneFeat,
    mixedFeat,
  ]);

  return { nodes: [cap] };
}

/**
 * Build tree with mixed statuses for testing summary calculation
 *
 * Structure:
 * - capability-21_test [IN_PROGRESS]
 *   - feature-21_done [DONE]
 *     - story-21_done [DONE]
 *   - feature-32_progress [IN_PROGRESS]
 *     - story-32_progress [IN_PROGRESS]
 *   - feature-43_open [OPEN]
 *     - story-43_open [OPEN]
 *
 * Used by: JSON formatter (summary: { done: 2, inProgress: 2, open: 2 })
 */
export function buildTreeWithMixedStatus(): WorkItemTree {
  const doneStory = createNode("story", 21, "done", "DONE");
  const doneFeat = createNode("feature", 21, "done", "DONE", [doneStory]);

  const progressStory = createNode("story", 32, "progress", "IN_PROGRESS");
  const progressFeat = createNode("feature", 32, "progress", "IN_PROGRESS", [
    progressStory,
  ]);

  const openStory = createNode("story", 43, "open", "OPEN");
  const openFeat = createNode("feature", 43, "open", "OPEN", [openStory]);

  const cap = createNode("capability", 20, "test", "IN_PROGRESS", [
    doneFeat,
    progressFeat,
    openFeat,
  ]);

  return { nodes: [cap] };
}
