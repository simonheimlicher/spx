/**
 * Unit tests for session archive utilities.
 *
 * Test Level: 1 (Unit)
 * - Pure functions for path building and session location finding
 * - No external dependencies
 *
 * Covers story-32_archive-command requirements:
 * - FR1: Build paths for todo → archive
 * - FR3: Build paths for doing → archive
 * - FR4: Detect already archived sessions
 *
 * @see ADR-21 (Session Directory Structure) for directory layout
 */

import { describe, expect, it } from "vitest";

import {
  type ArchivePathConfig,
  buildArchivePaths,
  type ExistingPathsMap,
  findSessionForArchive,
  SESSION_FILE_EXTENSION,
} from "@/session/archive";

/**
 * Test configuration constants matching production directory structure.
 */
const TODO_DIR = ".spx/sessions/todo";
const DOING_DIR = ".spx/sessions/doing";
const ARCHIVE_DIR = ".spx/sessions/archive";

/**
 * Test session IDs following ADR-32 timestamp format.
 */
const SESSION_ID = "2026-01-13_08-01-05";

describe("buildArchivePaths", () => {
  describe("GIVEN session in todo", () => {
    it("WHEN built THEN returns todo→archive paths", () => {
      // Given
      const config: ArchivePathConfig = {
        todoDir: TODO_DIR,
        archiveDir: ARCHIVE_DIR,
      };
      const currentStatus = "todo" as const;

      // When
      const result = buildArchivePaths(SESSION_ID, currentStatus, config);

      // Then
      expect(result).toEqual({
        source: `${TODO_DIR}/${SESSION_ID}${SESSION_FILE_EXTENSION}`,
        target: `${ARCHIVE_DIR}/${SESSION_ID}${SESSION_FILE_EXTENSION}`,
      });
    });
  });

  describe("GIVEN session in doing", () => {
    it("WHEN built THEN returns doing→archive paths", () => {
      // Given
      const config: ArchivePathConfig = {
        doingDir: DOING_DIR,
        archiveDir: ARCHIVE_DIR,
      };
      const currentStatus = "doing" as const;

      // When
      const result = buildArchivePaths(SESSION_ID, currentStatus, config);

      // Then
      expect(result.source).toBe(`${DOING_DIR}/${SESSION_ID}${SESSION_FILE_EXTENSION}`);
      expect(result.target).toBe(`${ARCHIVE_DIR}/${SESSION_ID}${SESSION_FILE_EXTENSION}`);
    });
  });

  describe("GIVEN missing config directory", () => {
    it("WHEN todo status but no todoDir THEN throws error", () => {
      // Given
      const config: ArchivePathConfig = {
        archiveDir: ARCHIVE_DIR,
        // todoDir intentionally missing
      };
      const currentStatus = "todo" as const;

      // When/Then
      expect(() => buildArchivePaths(SESSION_ID, currentStatus, config)).toThrow(
        "Missing todoDir in config",
      );
    });

    it("WHEN doing status but no doingDir THEN throws error", () => {
      // Given
      const config: ArchivePathConfig = {
        archiveDir: ARCHIVE_DIR,
        // doingDir intentionally missing
      };
      const currentStatus = "doing" as const;

      // When/Then
      expect(() => buildArchivePaths(SESSION_ID, currentStatus, config)).toThrow(
        "Missing doingDir in config",
      );
    });
  });

  describe("GIVEN various session IDs", () => {
    it("WHEN different timestamp THEN builds correct paths", () => {
      // Given
      const config: ArchivePathConfig = {
        todoDir: TODO_DIR,
        archiveDir: ARCHIVE_DIR,
      };
      const sessionId = "2026-12-31_23-59-59";

      // When
      const result = buildArchivePaths(sessionId, "todo", config);

      // Then
      expect(result.source).toContain(sessionId);
      expect(result.target).toContain(sessionId);
    });
  });
});

describe("findSessionForArchive", () => {
  describe("GIVEN session in todo only", () => {
    it("WHEN found THEN returns todo location", () => {
      // Given
      const todoPath = `${TODO_DIR}/test${SESSION_FILE_EXTENSION}`;
      const existingPaths: ExistingPathsMap = {
        todo: todoPath,
        doing: null,
        archive: null,
      };

      // When
      const result = findSessionForArchive(existingPaths);

      // Then
      expect(result).toEqual({ status: "todo", path: todoPath });
    });
  });

  describe("GIVEN session in doing only", () => {
    it("WHEN found THEN returns doing location", () => {
      // Given
      const doingPath = `${DOING_DIR}/test${SESSION_FILE_EXTENSION}`;
      const existingPaths: ExistingPathsMap = {
        todo: null,
        doing: doingPath,
        archive: null,
      };

      // When
      const result = findSessionForArchive(existingPaths);

      // Then
      expect(result).toEqual({ status: "doing", path: doingPath });
    });
  });

  describe("GIVEN session already archived", () => {
    it("WHEN searched THEN returns null", () => {
      // Given
      const archivePath = `${ARCHIVE_DIR}/test${SESSION_FILE_EXTENSION}`;
      const existingPaths: ExistingPathsMap = {
        todo: null,
        doing: null,
        archive: archivePath,
      };

      // When
      const result = findSessionForArchive(existingPaths);

      // Then
      expect(result).toBeNull();
    });

    it("WHEN also in todo THEN returns null (archive takes precedence)", () => {
      // Given - edge case: file somehow in both places
      const existingPaths: ExistingPathsMap = {
        todo: `${TODO_DIR}/test${SESSION_FILE_EXTENSION}`,
        doing: null,
        archive: `${ARCHIVE_DIR}/test${SESSION_FILE_EXTENSION}`,
      };

      // When
      const result = findSessionForArchive(existingPaths);

      // Then - already archived takes precedence
      expect(result).toBeNull();
    });
  });

  describe("GIVEN session not found anywhere", () => {
    it("WHEN searched THEN returns null", () => {
      // Given
      const existingPaths: ExistingPathsMap = {
        todo: null,
        doing: null,
        archive: null,
      };

      // When
      const result = findSessionForArchive(existingPaths);

      // Then
      expect(result).toBeNull();
    });
  });

  describe("GIVEN session in both todo and doing", () => {
    it("WHEN searched THEN returns todo (checked first)", () => {
      // Given - edge case: file somehow in both places
      const todoPath = `${TODO_DIR}/test${SESSION_FILE_EXTENSION}`;
      const existingPaths: ExistingPathsMap = {
        todo: todoPath,
        doing: `${DOING_DIR}/test${SESSION_FILE_EXTENSION}`,
        archive: null,
      };

      // When
      const result = findSessionForArchive(existingPaths);

      // Then - todo is checked first per ADR-21
      expect(result).toEqual({ status: "todo", path: todoPath });
    });
  });
});
