/**
 * Core type definitions for spx
 */

/**
 * Work item types in the spec hierarchy
 */
export type WorkItemKind = "capability" | "feature" | "story";

/**
 * Parsed work item structure
 */
export interface WorkItem {
  /** The type of work item */
  kind: WorkItemKind;
  /** BSP number (0-indexed, stored as directory number - 1) */
  number: number;
  /** URL-safe slug identifier */
  slug: string;
}
