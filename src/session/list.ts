/**
 * Session listing and sorting utilities.
 *
 * @module session/list
 */

import { parse as parseYaml } from "yaml";

import { parseSessionId } from "./timestamp";
import { DEFAULT_PRIORITY, PRIORITY_ORDER, type Session, type SessionMetadata, type SessionPriority } from "./types";

/**
 * Regular expression to match YAML front matter.
 * Matches content between opening `---` and closing `---` or `...`
 */
const FRONT_MATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n(?:---|\.\.\.)\r?\n?/;

/**
 * Validates if a value is a valid priority.
 */
function isValidPriority(value: unknown): value is SessionPriority {
  return value === "high" || value === "medium" || value === "low";
}

/**
 * Parses YAML front matter from session content to extract metadata.
 *
 * @param content - Full session file content
 * @returns Extracted metadata with defaults for missing fields
 *
 * @example
 * ```typescript
 * const metadata = parseSessionMetadata(`---
 * priority: high
 * tags: [bug, urgent]
 * ---
 * # Session content`);
 * // => { priority: 'high', tags: ['bug', 'urgent'] }
 * ```
 */
export function parseSessionMetadata(content: string): SessionMetadata {
  const match = FRONT_MATTER_PATTERN.exec(content);

  if (!match) {
    return {
      priority: DEFAULT_PRIORITY,
      tags: [],
    };
  }

  try {
    const parsed = parseYaml(match[1]) as Record<string, unknown>;

    if (!parsed || typeof parsed !== "object") {
      return {
        priority: DEFAULT_PRIORITY,
        tags: [],
      };
    }

    // Extract priority with validation
    const priority = isValidPriority(parsed.priority)
      ? parsed.priority
      : DEFAULT_PRIORITY;

    // Extract tags, ensuring it's an array of strings
    let tags: string[] = [];
    if (Array.isArray(parsed.tags)) {
      tags = parsed.tags.filter((t): t is string => typeof t === "string");
    }

    // Build metadata object
    const metadata: SessionMetadata = {
      priority,
      tags,
    };

    // Add optional fields if present
    if (typeof parsed.id === "string") {
      metadata.id = parsed.id;
    }
    if (typeof parsed.branch === "string") {
      metadata.branch = parsed.branch;
    }
    if (typeof parsed.created_at === "string") {
      metadata.createdAt = parsed.created_at;
    }
    if (typeof parsed.working_directory === "string") {
      metadata.workingDirectory = parsed.working_directory;
    }
    if (Array.isArray(parsed.specs)) {
      metadata.specs = parsed.specs.filter(
        (s): s is string => typeof s === "string",
      );
    }
    if (Array.isArray(parsed.files)) {
      metadata.files = parsed.files.filter(
        (f): f is string => typeof f === "string",
      );
    }

    return metadata;
  } catch {
    // Malformed YAML, return defaults
    return {
      priority: DEFAULT_PRIORITY,
      tags: [],
    };
  }
}

/**
 * Sorts sessions by priority (high first) then by timestamp (newest first).
 *
 * @param sessions - Array of sessions to sort
 * @returns New sorted array (does not mutate input)
 *
 * @example
 * ```typescript
 * const sorted = sortSessions([
 *   { id: 'a', metadata: { priority: 'low' } },
 *   { id: 'b', metadata: { priority: 'high' } },
 * ]);
 * // => [{ id: 'b', ... }, { id: 'a', ... }]
 * ```
 */
export function sortSessions(sessions: Session[]): Session[] {
  return [...sessions].sort((a, b) => {
    // First: sort by priority (high = 0, medium = 1, low = 2)
    const priorityA = PRIORITY_ORDER[a.metadata.priority];
    const priorityB = PRIORITY_ORDER[b.metadata.priority];

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // Second: sort by timestamp (newest first = descending)
    const dateA = parseSessionId(a.id);
    const dateB = parseSessionId(b.id);

    // Handle invalid session IDs by treating them as oldest
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1; // a goes after b
    if (!dateB) return -1; // b goes after a

    return dateB.getTime() - dateA.getTime();
  });
}
