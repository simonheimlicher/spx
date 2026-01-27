/**
 * Core type definitions for spx
 */

/**
 * Work item types in the spec hierarchy
 */
export type WorkItemKind = "capability" | "feature" | "story";

/**
 * Ordered hierarchy of work item kinds (root to leaf)
 *
 * Used by both production code and tests to derive hierarchy structure.
 * Per ADR-21: Never hardcode kind names - derive from this constant.
 */
export const WORK_ITEM_KINDS: readonly WorkItemKind[] = [
  "capability",
  "feature",
  "story",
] as const;

/**
 * The leaf kind (actionable work items)
 *
 * Derived from WORK_ITEM_KINDS to ensure consistency if hierarchy changes.
 */
export const LEAF_KIND: WorkItemKind = WORK_ITEM_KINDS.at(-1)!;

/**
 * Parsed work item structure
 */
export interface WorkItem {
  /** The type of work item */
  kind: WorkItemKind;
  /** BSP number (0-indexed for capabilities, as-is for features/stories) */
  number: number;
  /** URL-safe slug identifier */
  slug: string;
  /** Full filesystem path to work item directory */
  path: string;
}

/**
 * Directory entry from filesystem traversal
 */
export interface DirectoryEntry {
  /** Directory name (basename) */
  name: string;
  /** Full absolute path */
  path: string;
  /** Whether this is a directory */
  isDirectory: boolean;
}

/**
 * Work item status
 */
export type WorkItemStatus = "OPEN" | "IN_PROGRESS" | "DONE";

/**
 * Ordered list of work item statuses
 *
 * Used by both production code and tests to derive status values.
 * Per ADR-21: Never hardcode status names - derive from this constant.
 */
export const WORK_ITEM_STATUSES: readonly WorkItemStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "DONE",
] as const;
