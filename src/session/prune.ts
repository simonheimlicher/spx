/**
 * Session pruning utilities for cleaning up old sessions.
 *
 * @module session/prune
 */

import { parseSessionId } from "./timestamp";
import type { Session } from "./types";

/**
 * Default number of sessions to keep when pruning.
 */
export const DEFAULT_KEEP_COUNT = 5;

/**
 * Action type for prune results indicating sessions would be deleted (dry-run mode).
 */
export const PRUNE_ACTION_WOULD_DELETE = "would-delete" as const;

/**
 * Action type for prune results indicating sessions were actually deleted.
 */
export const PRUNE_ACTION_DELETED = "deleted" as const;

/**
 * Union type for prune action types.
 */
export type PruneAction = typeof PRUNE_ACTION_WOULD_DELETE | typeof PRUNE_ACTION_DELETED;

/**
 * Options for selecting sessions to delete.
 */
export interface SelectSessionsOptions {
  /**
   * Number of most recent sessions to keep.
   * Defaults to DEFAULT_KEEP_COUNT (5).
   */
  keep?: number;
}

/**
 * Options for formatting prune results.
 */
export interface FormatPruneOptions {
  /**
   * Whether this is a dry-run (no actual deletion).
   * When true, action will be "would-delete".
   * When false, action will be "deleted".
   */
  dryRun: boolean;
}

/**
 * Result of a prune operation.
 */
export interface PruneResult {
  /**
   * Action taken: "would-delete" for dry-run, "deleted" for actual deletion.
   */
  action: PruneAction;
  /**
   * Sessions that were (or would be) deleted.
   */
  sessions: Session[];
}

/**
 * Selects sessions to delete based on keep count.
 *
 * Sessions are sorted by timestamp (oldest first), and the oldest sessions
 * beyond the keep count are selected for deletion.
 *
 * @param sessions - Array of sessions to consider
 * @param options - Selection options including keep count
 * @returns Array of sessions to delete (oldest sessions beyond keep count)
 *
 * @example
 * ```typescript
 * // Given 10 sessions, keep 5 newest
 * const toDelete = selectSessionsToDelete(sessions, { keep: 5 });
 * // Returns the 5 oldest sessions
 *
 * // Using default keep count (5)
 * const toDelete = selectSessionsToDelete(sessions);
 * ```
 */
export function selectSessionsToDelete(
  sessions: Session[],
  options: SelectSessionsOptions = {},
): Session[] {
  const keep = options.keep ?? DEFAULT_KEEP_COUNT;

  // If we have fewer sessions than the keep count, delete nothing
  if (sessions.length <= keep) {
    return [];
  }

  // Sort sessions by timestamp (oldest first for deletion selection)
  const sorted = [...sessions].sort((a, b) => {
    const dateA = parseSessionId(a.id);
    const dateB = parseSessionId(b.id);

    // Handle invalid session IDs by treating them as oldest (delete first)
    if (!dateA && !dateB) return 0;
    if (!dateA) return -1; // a (invalid) goes before b (to be deleted first)
    if (!dateB) return 1; // b (invalid) goes before a

    return dateA.getTime() - dateB.getTime();
  });

  // Return the oldest sessions (those beyond the keep count)
  const deleteCount = sessions.length - keep;
  return sorted.slice(0, deleteCount);
}

/**
 * Formats the result of a prune operation.
 *
 * @param sessions - Sessions that were (or would be) deleted
 * @param options - Format options including dry-run flag
 * @returns Prune result with action type and session list
 *
 * @example
 * ```typescript
 * // Dry-run mode
 * const result = formatPruneResult(toDelete, { dryRun: true });
 * // result.action === "would-delete"
 *
 * // Actual deletion
 * const result = formatPruneResult(deleted, { dryRun: false });
 * // result.action === "deleted"
 * ```
 */
export function formatPruneResult(
  sessions: Session[],
  options: FormatPruneOptions,
): PruneResult {
  return {
    action: options.dryRun ? PRUNE_ACTION_WOULD_DELETE : PRUNE_ACTION_DELETED,
    sessions,
  };
}
