/**
 * Next command implementation
 *
 * Finds the next work item to work on based on BSP order:
 * - BSP order is absolute - lower number must complete first
 * - Status (IN_PROGRESS vs OPEN) is irrelevant to priority
 * - Returns first non-DONE item in BSP order
 */
import { DEFAULT_CONFIG } from "../../config/defaults.js";
import { Scanner } from "../../scanner/scanner.js";
import { buildTree } from "../../tree/build.js";
import type { TreeNode, WorkItemTree } from "../../tree/types.js";

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
 * - BSP order is absolute - lower number must complete first
 * - Status (IN_PROGRESS vs OPEN) is irrelevant to priority
 * - Returns first non-DONE leaf in BSP order
 *
 * Tree is already BSP-sorted at each level (per ADR-002).
 * Traverses depth-first in BSP order to find first non-DONE leaf.
 *
 * @param tree - Work item tree
 * @returns Next leaf node to work on, or null if all done
 *
 * @example
 * ```typescript
 * const tree = buildTreeWithMixedStatus();
 * const next = findNextWorkItem(tree);
 * // => { kind: "story", number: 21, slug: "lowest-bsp-story", status: "OPEN", ... }
 * ```
 */
export function findNextWorkItem(tree: WorkItemTree): TreeNode | null {
  // Tree is already BSP-sorted at each level (per ADR-002)
  // Traverse depth-first in BSP order to find first non-DONE leaf
  return findFirstNonDoneLeaf(tree.nodes);
}

/**
 * Recursively find first non-DONE story node in BSP order
 *
 * Tree children are assumed to be pre-sorted by BSP number (per ADR-002).
 * Only story nodes are considered actionable work items.
 *
 * @param nodes - Tree nodes to traverse (assumed BSP-sorted)
 * @returns First non-DONE story node, or null if all done
 */
function findFirstNonDoneLeaf(nodes: TreeNode[]): TreeNode | null {
  for (const node of nodes) {
    if (node.kind === "story") {
      // Story is an actionable work item - check status
      if (node.status !== "DONE") {
        return node;
      }
    } else {
      // Non-story (capability/feature) - recurse into children (already BSP-sorted)
      const found = findFirstNonDoneLeaf(node.children);
      if (found) {
        return found;
      }
    }
  }
  return null;
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

  // Step 1-3: Use Scanner with config-driven paths
  const scanner = new Scanner(cwd, DEFAULT_CONFIG);
  const workItems = await scanner.scan();

  // Handle empty project
  if (workItems.length === 0) {
    return `No work items found in ${DEFAULT_CONFIG.specs.root}/${DEFAULT_CONFIG.specs.work.dir}/${DEFAULT_CONFIG.specs.work.statusDirs.doing}`;
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
      `  ${formatWorkItemName(parents.capability)} > ${formatWorkItemName(parents.feature)} > ${
        formatWorkItemName(next)
      }`,
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
  target: TreeNode,
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
