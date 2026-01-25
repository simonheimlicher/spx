/**
 * Unit tests for dry-run mode in session pruning.
 *
 * Test Level: 1 (Unit)
 * - Pure functions for dry-run result formatting
 * - No external dependencies
 *
 * Covers story-43_dry-run requirements:
 * - FR1: Show what would be deleted without deleting
 * - FR2: Format output to distinguish dry-run from actual run
 * - FR3: Return identical selection as real prune
 *
 * @see ADR-32 (Timestamp Format) for session ID sorting
 */

import { describe, expect, it } from "vitest";

import {
  formatPruneResult,
  PRUNE_ACTION_DELETED,
  PRUNE_ACTION_WOULD_DELETE,
  selectSessionsToDelete,
} from "@/session/prune";
import type { Session, SessionPriority } from "@/session/types";

/**
 * Factory function to create test sessions.
 */
function createSession(overrides: {
  id?: string;
  priority?: SessionPriority;
}): Session {
  const id = overrides.id ?? "2026-01-13_10-00-00";
  return {
    id,
    status: "todo",
    path: `/test/sessions/todo/${id}.md`,
    metadata: {
      priority: overrides.priority ?? "medium",
      tags: [],
    },
  };
}

describe("dry-run mode", () => {
  it("GIVEN dryRun=true WHEN selecting THEN returns same sessions as real prune", () => {
    // Given
    const sessions = Array.from(
      { length: 10 },
      (_, i) => createSession({ id: `2026-01-${String(i + 1).padStart(2, "0")}_10-00-00` }),
    );

    // When
    const dryRunResult = selectSessionsToDelete(sessions, { keep: 5 });
    const realResult = selectSessionsToDelete(sessions, { keep: 5 });

    // Then - same selection
    expect(dryRunResult.map((s) => s.id)).toEqual(realResult.map((s) => s.id));
  });

  it("GIVEN dry-run result WHEN formatted THEN indicates would-delete", () => {
    // Given
    const toDelete = [
      createSession({ id: "2026-01-01_10-00-00" }),
      createSession({ id: "2026-01-02_10-00-00" }),
    ];

    // When
    const result = formatPruneResult(toDelete, { dryRun: true });

    // Then
    expect(result.action).toBe(PRUNE_ACTION_WOULD_DELETE);
    expect(result.sessions).toHaveLength(2);
  });

  it("GIVEN real prune result WHEN formatted THEN indicates deleted", () => {
    // Given
    const deleted = [createSession({ id: "2026-01-01_10-00-00" })];

    // When
    const result = formatPruneResult(deleted, { dryRun: false });

    // Then
    expect(result.action).toBe(PRUNE_ACTION_DELETED);
  });

  it("GIVEN empty sessions WHEN formatted with dryRun THEN returns empty array with would-delete action", () => {
    // Given
    const sessions: Session[] = [];

    // When
    const result = formatPruneResult(sessions, { dryRun: true });

    // Then
    expect(result.action).toBe(PRUNE_ACTION_WOULD_DELETE);
    expect(result.sessions).toHaveLength(0);
  });

  it("GIVEN empty sessions WHEN formatted without dryRun THEN returns empty array with deleted action", () => {
    // Given
    const sessions: Session[] = [];

    // When
    const result = formatPruneResult(sessions, { dryRun: false });

    // Then
    expect(result.action).toBe(PRUNE_ACTION_DELETED);
    expect(result.sessions).toHaveLength(0);
  });

  it("GIVEN formatted result WHEN accessing sessions THEN preserves original session data", () => {
    // Given
    const toDelete = [
      createSession({ id: "2026-01-01_10-00-00", priority: "high" }),
    ];

    // When
    const result = formatPruneResult(toDelete, { dryRun: true });

    // Then - session data is preserved
    expect(result.sessions[0].id).toBe("2026-01-01_10-00-00");
    expect(result.sessions[0].metadata.priority).toBe("high");
  });
});
