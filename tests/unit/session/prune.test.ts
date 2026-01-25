/**
 * Unit tests for session prune utilities.
 *
 * Test Level: 1 (Unit)
 * - Pure functions for selecting sessions to delete
 * - No external dependencies
 *
 * Covers story-21_prune-command requirements:
 * - FR1: Delete oldest sessions keeping N most recent
 * - FR2: Default to keeping 5 sessions
 * - FR4: Handle keep > available gracefully
 *
 * @see ADR-32 (Timestamp Format) for session ID sorting
 */

import { describe, expect, it } from "vitest";

import { DEFAULT_KEEP_COUNT, selectSessionsToDelete } from "@/session/prune";
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

describe("selectSessionsToDelete", () => {
  it("GIVEN 10 sessions and keep=5 WHEN selected THEN returns 5 oldest", () => {
    // Given
    const sessions = Array.from(
      { length: 10 },
      (_, i) => createSession({ id: `2026-01-${String(i + 1).padStart(2, "0")}_10-00-00` }),
    );

    // When
    const result = selectSessionsToDelete(sessions, { keep: 5 });

    // Then
    expect(result).toHaveLength(5);
    expect(result.map((s) => s.id)).toEqual([
      "2026-01-01_10-00-00",
      "2026-01-02_10-00-00",
      "2026-01-03_10-00-00",
      "2026-01-04_10-00-00",
      "2026-01-05_10-00-00",
    ]);
  });

  it("GIVEN 3 sessions and keep=5 WHEN selected THEN returns empty array", () => {
    // Given
    const sessions = [
      createSession({ id: "2026-01-01_10-00-00" }),
      createSession({ id: "2026-01-02_10-00-00" }),
      createSession({ id: "2026-01-03_10-00-00" }),
    ];

    // When
    const result = selectSessionsToDelete(sessions, { keep: 5 });

    // Then
    expect(result).toHaveLength(0);
  });

  it("GIVEN default keep WHEN selected THEN uses DEFAULT_KEEP_COUNT", () => {
    // Given
    const sessions = Array.from(
      { length: 8 },
      (_, i) => createSession({ id: `2026-01-${String(i + 1).padStart(2, "0")}_10-00-00` }),
    );

    // When
    const result = selectSessionsToDelete(sessions); // No keep specified

    // Then - uses DEFAULT_KEEP_COUNT (5), so 8 - 5 = 3 deleted
    expect(result).toHaveLength(8 - DEFAULT_KEEP_COUNT);
  });

  it("GIVEN exactly keep sessions WHEN selected THEN returns empty array", () => {
    // Given
    const sessions = Array.from(
      { length: 5 },
      (_, i) => createSession({ id: `2026-01-${String(i + 1).padStart(2, "0")}_10-00-00` }),
    );

    // When
    const result = selectSessionsToDelete(sessions, { keep: 5 });

    // Then
    expect(result).toHaveLength(0);
  });

  it("GIVEN empty sessions array WHEN selected THEN returns empty array", () => {
    // Given
    const sessions: Session[] = [];

    // When
    const result = selectSessionsToDelete(sessions, { keep: 5 });

    // Then
    expect(result).toHaveLength(0);
  });

  it("GIVEN sessions with invalid IDs WHEN selected THEN invalid IDs selected first", () => {
    // Given - mix of valid and invalid IDs
    const sessions = [
      createSession({ id: "invalid-id" }),
      createSession({ id: "2026-01-13_10-00-00" }),
      createSession({ id: "2026-01-14_10-00-00" }),
    ];

    // When - keep 2, delete 1
    const result = selectSessionsToDelete(sessions, { keep: 2 });

    // Then - invalid ID should be selected for deletion first
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("invalid-id");
  });

  it("GIVEN input array WHEN selected THEN does not mutate original", () => {
    // Given
    const sessions = [
      createSession({ id: "2026-01-01_10-00-00" }),
      createSession({ id: "2026-01-02_10-00-00" }),
      createSession({ id: "2026-01-03_10-00-00" }),
    ];
    const originalOrder = sessions.map((s) => s.id);

    // When
    selectSessionsToDelete(sessions, { keep: 1 });

    // Then
    expect(sessions.map((s) => s.id)).toEqual(originalOrder);
  });

  it("GIVEN deterministic input WHEN called multiple times THEN returns same result", () => {
    // Given
    const sessions = Array.from(
      { length: 10 },
      (_, i) => createSession({ id: `2026-01-${String(i + 1).padStart(2, "0")}_10-00-00` }),
    );

    // When - call multiple times
    const result1 = selectSessionsToDelete(sessions, { keep: 5 });
    const result2 = selectSessionsToDelete(sessions, { keep: 5 });

    // Then - results are identical (deterministic)
    expect(result1.map((s) => s.id)).toEqual(result2.map((s) => s.id));
  });
});
