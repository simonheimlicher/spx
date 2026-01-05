/**
 * Next command implementation
 *
 * Finds the next work item to work on based on priority:
 * 1. IN_PROGRESS items first (already started)
 * 2. OPEN items second (not started)
 * 3. Within same status, lowest BSP number first
 */
import path from "path";
import type { TreeNode, WorkItemTree } from "../tree/types.js";
import {
  walkDirectory,
  filterWorkItemDirectories,
  buildWorkItemList,
} from "../scanner/walk.js";
import { buildTree } from "../tree/build.js";

/**
 * Options for next command
 */
export interface NextOptions {
  /** Working directory (defaults to current directory) */
  cwd?: string;
}

/**
 * Find the next work item to work on
 *
 * Priority order:
 * 1. IN_PROGRESS items (already started, should finish first)
 * 2. OPEN items (not started yet)
 * 3. Within same priority, lowest BSP number first (stories only)
 *
 * Only considers story-level work items (leaf nodes).
 *
 * @param tree - Work item tree
 * @returns Next story to work on, or null if all done
 *
 * @example
 * ```typescript
 * const tree = buildTreeWithMixedStatus();
 * const next = findNextWorkItem(tree);
 * // => { kind: "story", number: 32, slug: "in-progress-story", status: "IN_PROGRESS", ... }
 * ```
 */
export function findNextWorkItem(tree: WorkItemTree): TreeNode | null {
  // Collect all stories (leaf nodes) from the tree
  const stories: TreeNode[] = [];
  collectStories(tree.nodes, stories);

  if (stories.length === 0) {
    return null;
  }

  // Filter to IN_PROGRESS and OPEN stories only
  const inProgressStories = stories.filter(
    (story) => story.status === "IN_PROGRESS"
  );
  const openStories = stories.filter((story) => story.status === "OPEN");

  // Priority 1: IN_PROGRESS stories, lowest number first
  if (inProgressStories.length > 0) {
    return inProgressStories.sort((a, b) => a.number - b.number)[0];
  }

  // Priority 2: OPEN stories, lowest number first
  if (openStories.length > 0) {
    return openStories.sort((a, b) => a.number - b.number)[0];
  }

  // All stories are DONE
  return null;
}

/**
 * Recursively collect all story nodes from tree
 *
 * @param nodes - Tree nodes to traverse
 * @param stories - Accumulator for story nodes
 */
function collectStories(nodes: TreeNode[], stories: TreeNode[]): void {
  for (const node of nodes) {
    if (node.kind === "story") {
      stories.push(node);
    } else {
      // Recursively collect from children
      collectStories(node.children, stories);
    }
  }
}

/**
 * Format work item name for display
 *
 * @param node - Tree node to format
 * @returns Formatted name (e.g., "story-32_next-command")
 */
function formatWorkItemName(node: TreeNode): string {
  // Display number (capability needs +1, others as-is)
  const displayNum = node.kind === "capability" ? node.number + 1 : node.number;
  return `${node.kind}-${displayNum}_${node.slug}`;
}

/**
 * Execute next command
 *
 * Finds and displays the next work item to work on.
 * Shows full path information for context.
 *
 * @param options - Command options
 * @returns Formatted output
 * @throws Error if specs directory doesn't exist or is inaccessible
 *
 * @example
 * ```typescript
 * const output = await nextCommand({ cwd: "/path/to/project" });
 * console.log(output);
 * ```
 */
export async function nextCommand(options: NextOptions = {}): Promise<string> {
  const cwd = options.cwd || process.cwd();
  const specsPath = path.join(cwd, "specs", "doing");

  // Step 1: Walk specs directory to get all directories
  const allEntries = await walkDirectory(specsPath);

  // Step 2: Filter to only work item directories
  const workItemEntries = filterWorkItemDirectories(allEntries);

  // Step 3: Build flat list of work items
  const workItems = buildWorkItemList(workItemEntries);

  // Handle empty project
  if (workItems.length === 0) {
    return "No work items found in specs/doing";
  }

  // Step 4: Build hierarchical tree with status
  const tree = await buildTree(workItems);

  // Step 5: Find next work item
  const next = findNextWorkItem(tree);

  if (!next) {
    return "All work items are complete! 🎉";
  }

  // Step 6: Find parent feature and capability for context
  const parents = findParents(tree.nodes, next);

  // Step 7: Format output with context
  const lines: string[] = [];
  lines.push("Next work item:");
  lines.push("");

  if (parents.capability && parents.feature) {
    lines.push(
      `  ${formatWorkItemName(parents.capability)} > ${formatWorkItemName(parents.feature)} > ${formatWorkItemName(next)}`
    );
  } else {
    lines.push(`  ${formatWorkItemName(next)}`);
  }

  lines.push("");
  lines.push(`  Status: ${next.status}`);
  lines.push(`  Path: ${next.path}`);

  return lines.join("\n");
}

/**
 * Find parent capability and feature for a story
 *
 * @param nodes - Tree nodes to search
 * @param target - Story node to find parents for
 * @returns Parent capability and feature, or empty object if not found
 */
function findParents(
  nodes: TreeNode[],
  target: TreeNode
): { capability?: TreeNode; feature?: TreeNode } {
  for (const capability of nodes) {
    for (const feature of capability.children) {
      for (const story of feature.children) {
        if (story.path === target.path) {
          return { capability, feature };
        }
      }
    }
  }
  return {};
}
