/**
 * Session archiving utilities with pure functions for path resolution.
 *
 * This module provides pure functions for archive path building and session
 * location finding. Actual filesystem operations are handled by the CLI
 * command handler in commands/session/archive.ts.
 *
 * @module session/archive
 */

/**
 * File extension for session files.
 */
export const SESSION_FILE_EXTENSION = ".md";

/**
 * Configuration for archive path building.
 */
export interface ArchivePathConfig {
  /** Directory for todo sessions */
  todoDir?: string;
  /** Directory for doing (claimed) sessions */
  doingDir?: string;
  /** Directory for archived sessions */
  archiveDir: string;
}

/**
 * Result of building archive paths.
 */
export interface ArchivePaths {
  /** Source path where session currently exists */
  source: string;
  /** Target path in archive directory */
  target: string;
}

/**
 * Map of existing paths for session lookup.
 * Each key maps to the full path if file exists, or null if not found.
 */
export interface ExistingPathsMap {
  /** Path in todo directory, or null if not found */
  todo: string | null;
  /** Path in doing directory, or null if not found */
  doing: string | null;
  /** Path in archive directory, or null if not found */
  archive: string | null;
}

/**
 * Result of finding a session for archiving.
 */
export interface SessionLocation {
  /** Status/directory where session was found */
  status: "todo" | "doing";
  /** Full path to the session file */
  path: string;
}

/**
 * Builds source and target paths for archiving a session.
 *
 * This is a pure function that computes paths based on session ID,
 * current status, and directory configuration.
 *
 * @param sessionId - Session ID (timestamp format)
 * @param currentStatus - Current status/directory of the session
 * @param config - Directory configuration
 * @returns Source and target paths for the archive operation
 *
 * @example
 * ```typescript
 * const paths = buildArchivePaths("2026-01-13_08-01-05", "todo", {
 *   todoDir: ".spx/sessions/todo",
 *   archiveDir: ".spx/sessions/archive",
 * });
 * // paths.source === ".spx/sessions/todo/2026-01-13_08-01-05.md"
 * // paths.target === ".spx/sessions/archive/2026-01-13_08-01-05.md"
 * ```
 */
export function buildArchivePaths(
  sessionId: string,
  currentStatus: "todo" | "doing",
  config: ArchivePathConfig,
): ArchivePaths {
  const filename = `${sessionId}${SESSION_FILE_EXTENSION}`;
  const sourceDir = currentStatus === "todo" ? config.todoDir : config.doingDir;

  if (!sourceDir) {
    throw new Error(`Missing ${currentStatus}Dir in config`);
  }

  return {
    source: `${sourceDir}/${filename}`,
    target: `${config.archiveDir}/${filename}`,
  };
}

/**
 * Finds a session's location for archiving.
 *
 * This is a pure function that determines the session's location based
 * on a map of existing paths. Returns null if the session is already
 * archived or not found.
 *
 * @param existingPaths - Map of paths where session might exist
 * @returns Session location if found in todo or doing, null otherwise
 *
 * @example
 * ```typescript
 * // Session in todo
 * const location = findSessionForArchive({
 *   todo: ".spx/sessions/todo/test.md",
 *   doing: null,
 *   archive: null,
 * });
 * // location === { status: "todo", path: ".spx/sessions/todo/test.md" }
 *
 * // Session already archived
 * const location = findSessionForArchive({
 *   todo: null,
 *   doing: null,
 *   archive: ".spx/sessions/archive/test.md",
 * });
 * // location === null
 * ```
 */
export function findSessionForArchive(
  existingPaths: ExistingPathsMap,
): SessionLocation | null {
  // If session is already in archive, return null
  if (existingPaths.archive !== null) {
    return null;
  }

  // Check todo first (per ADR-21 directory structure)
  if (existingPaths.todo !== null) {
    return { status: "todo", path: existingPaths.todo };
  }

  // Check doing
  if (existingPaths.doing !== null) {
    return { status: "doing", path: existingPaths.doing };
  }

  // Session not found anywhere
  return null;
}
