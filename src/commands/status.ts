/**
 * Status command implementation
 *
 * Orchestrates all features to display project status:
 * 1. Scanner (Feature 32) - Walk specs directory
 * 2. Status (Feature 43) - Determine status for each work item
 * 3. Tree Building (Feature 54) - Build hierarchical tree
 * 4. Output Formatting (Feature 65) - Format in specified format
 */
import path from "path";
import {
  walkDirectory,
  filterWorkItemDirectories,
  buildWorkItemList,
} from "../scanner/walk.js";
import { buildTree } from "../tree/build.js";
import { formatText } from "../reporter/text.js";
import { formatJSON } from "../reporter/json.js";
import { formatMarkdown } from "../reporter/markdown.js";
import { formatTable } from "../reporter/table.js";

/**
 * Supported output formats
 */
export type OutputFormat = "text" | "json" | "markdown" | "table";

/**
 * Options for status command
 */
export interface StatusOptions {
  /** Working directory (defaults to current directory) */
  cwd?: string;
  /** Output format (defaults to text) */
  format?: OutputFormat;
}

/**
 * Execute status command
 *
 * Displays current project status by:
 * - Walking specs/doing directory to find work items
 * - Determining status for each work item
 * - Building hierarchical tree structure
 * - Formatting and outputting in specified format
 *
 * @param options - Command options
 * @returns Formatted status output
 * @throws Error if specs directory doesn't exist or is inaccessible
 *
 * @example
 * ```typescript
 * const output = await statusCommand({ cwd: "/path/to/project", format: "json" });
 * console.log(output);
 * ```
 */
export async function statusCommand(
  options: StatusOptions = {}
): Promise<string> {
  const cwd = options.cwd || process.cwd();
  const format = options.format || "text";
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

  // Step 5: Format based on requested format
  switch (format) {
    case "json":
      return formatJSON(tree);
    case "markdown":
      return formatMarkdown(tree);
    case "table":
      return formatTable(tree);
    case "text":
    default:
      return formatText(tree);
  }
}
