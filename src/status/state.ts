/**
 * Status determination state machine for work items
 */
import type { WorkItemStatus } from "../types";

/**
 * Input flags for status determination
 */
export interface StatusFlags {
  /** Whether tests/ directory exists */
  hasTestsDir: boolean;
  /** Whether tests/DONE.md exists */
  hasDoneMd: boolean;
  /** Whether tests/ directory is empty (excluding DONE.md) */
  testsIsEmpty: boolean;
}

/**
 * Determines work item status based on tests/ directory state
 *
 * Truth Table:
 * | hasTestsDir | testsIsEmpty | hasDoneMd | Status      |
 * |-------------|--------------|-----------|-------------|
 * | false       | N/A          | N/A       | OPEN        |
 * | true        | true         | false     | OPEN        |
 * | true        | true         | true      | DONE        |
 * | true        | false        | false     | IN_PROGRESS |
 * | true        | false        | true      | DONE        |
 *
 * @param flags - Status determination flags
 * @returns Work item status as OPEN, IN_PROGRESS, or DONE
 *
 * @example
 * ```typescript
 * // No tests directory
 * determineStatus({ hasTestsDir: false, hasDoneMd: false, testsIsEmpty: true })
 * // => "OPEN"
 *
 * // Tests directory with files, no DONE.md
 * determineStatus({ hasTestsDir: true, hasDoneMd: false, testsIsEmpty: false })
 * // => "IN_PROGRESS"
 *
 * // Tests directory with DONE.md
 * determineStatus({ hasTestsDir: true, hasDoneMd: true, testsIsEmpty: false })
 * // => "DONE"
 * ```
 */
export function determineStatus(flags: StatusFlags): WorkItemStatus {
  // No tests directory → OPEN
  if (!flags.hasTestsDir) {
    return "OPEN";
  }

  // Has DONE.md → DONE (regardless of other files)
  if (flags.hasDoneMd) {
    return "DONE";
  }

  // Has tests directory but empty → OPEN
  if (flags.testsIsEmpty) {
    return "OPEN";
  }

  // Has tests directory with files, no DONE.md → IN_PROGRESS
  return "IN_PROGRESS";
}
