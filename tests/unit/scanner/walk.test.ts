/**
 * Level 1: Unit tests for directory walking functions
 * Graduated from story-32, story-43, and story-54
 */
import { describe, it, expect } from "vitest";
import { filterWorkItemDirectories, buildWorkItemList, normalizePath, walkDirectory } from "@/scanner/walk";
import type { DirectoryEntry } from "@/types";

describe("filterWorkItemDirectories", () => {
  /**
   * Story-32: Pattern Filter
   * Level 1 unit tests for filtering work item directories
   */

  it("GIVEN directories with work item names WHEN filtering THEN includes them", () => {
    // Given
    const entries = [
      { name: "capability-21_core-cli", path: "/specs/capability-21_core-cli", isDirectory: true },
      { name: "feature-32_walk", path: "/specs/cap/feature-32_walk", isDirectory: true },
      { name: "story-21_test", path: "/specs/cap/feat/story-21_test", isDirectory: true },
    ];

    // When
    const filtered = filterWorkItemDirectories(entries);

    // Then
    expect(filtered).toHaveLength(3);
  });

  it("GIVEN directories with non-work-item names WHEN filtering THEN excludes them", () => {
    // Given
    const entries = [
      { name: "node_modules", path: "/specs/node_modules", isDirectory: true },
      { name: "dist", path: "/specs/dist", isDirectory: true },
      { name: ".git", path: "/specs/.git", isDirectory: true },
      { name: "capability-21_core-cli", path: "/specs/capability-21_core-cli", isDirectory: true },
    ];

    // When
    const filtered = filterWorkItemDirectories(entries);

    // Then
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe("capability-21_core-cli");
  });

  it("GIVEN mixed valid and invalid patterns WHEN filtering THEN includes only valid", () => {
    // Given
    const entries = [
      { name: "capability-21_test", path: "/specs/capability-21_test", isDirectory: true },
      { name: "invalid-pattern", path: "/specs/invalid-pattern", isDirectory: true },
      { name: "feature-32_walk", path: "/specs/feature-32_walk", isDirectory: true },
      { name: "README.md", path: "/specs/README.md", isDirectory: true },
    ];

    // When
    const filtered = filterWorkItemDirectories(entries);

    // Then
    expect(filtered).toHaveLength(2);
    expect(filtered.map(f => f.name)).toEqual([
      "capability-21_test",
      "feature-32_walk",
    ]);
  });
});

describe("buildWorkItemList", () => {
  /**
   * Story-43: Build Work Item List
   * Level 1 unit tests for converting directory entries to WorkItem objects
   */

  it("GIVEN directory entries WHEN building list THEN creates WorkItem objects", () => {
    // Given
    const entries: DirectoryEntry[] = [
      { name: "capability-21_core-cli", path: "/specs/capability-21_core-cli", isDirectory: true },
    ];

    // When
    const workItems = buildWorkItemList(entries);

    // Then
    expect(workItems).toHaveLength(1);
    expect(workItems[0]).toEqual({
      kind: "capability",
      number: 20,
      slug: "core-cli",
      path: "/specs/capability-21_core-cli",
    });
  });

  it("GIVEN entries with all three kinds WHEN building list THEN parses each correctly", () => {
    // Given
    const entries: DirectoryEntry[] = [
      { name: "capability-21_test", path: "/specs/capability-21_test", isDirectory: true },
      { name: "feature-32_test", path: "/specs/cap/feature-32_test", isDirectory: true },
      { name: "story-43_test", path: "/specs/cap/feat/story-43_test", isDirectory: true },
    ];

    // When
    const workItems = buildWorkItemList(entries);

    // Then
    expect(workItems).toHaveLength(3);
    expect(workItems[0].kind).toBe("capability");
    expect(workItems[1].kind).toBe("feature");
    expect(workItems[2].kind).toBe("story");
  });

  it("GIVEN invalid directory entry WHEN building list THEN throws error", () => {
    // Given
    const entries: DirectoryEntry[] = [
      { name: "invalid-pattern", path: "/specs/invalid-pattern", isDirectory: true },
    ];

    // When/Then
    expect(() => buildWorkItemList(entries)).toThrow("Invalid work item name");
  });

  it("GIVEN empty entries array WHEN building list THEN returns empty array", () => {
    // Given
    const entries: DirectoryEntry[] = [];

    // When
    const workItems = buildWorkItemList(entries);

    // Then
    expect(workItems).toEqual([]);
  });
});

describe("normalizePath", () => {
  /**
   * Story-54: Edge Cases - Path Normalization
   * Level 1 unit tests for cross-platform path handling
   */

  it("GIVEN Windows path WHEN normalizing THEN uses forward slashes", () => {
    // Given
    const windowsPath = "C:\\Users\\test\\specs\\capability-21_test";

    // When
    const normalized = normalizePath(windowsPath);

    // Then
    expect(normalized).toContain("/");
    expect(normalized).not.toContain("\\");
  });

  it("GIVEN Unix path WHEN normalizing THEN preserves forward slashes", () => {
    // Given
    const unixPath = "/home/user/specs/capability-21_test";

    // When
    const normalized = normalizePath(unixPath);

    // Then
    expect(normalized).toBe(unixPath);
  });
});

describe("walkDirectory - Path Traversal Security", () => {
  /**
   * Security tests for path traversal vulnerability mitigation
   * Tests various path traversal attack vectors
   */

  it("GIVEN path with parent directory traversal WHEN walking THEN throws error", async () => {
    // Given: Path with .. attempting to traverse up
    const maliciousPath = "../../../etc/passwd";

    // When/Then: Should reject the path
    await expect(walkDirectory(maliciousPath)).rejects.toThrow("Invalid directory path provided");
  });

  it("GIVEN path with embedded parent directory WHEN walking THEN throws error", async () => {
    // Given: Path with .. in the middle
    const maliciousPath = "specs/../../../etc/passwd";

    // When/Then: Should reject the path
    await expect(walkDirectory(maliciousPath)).rejects.toThrow("Invalid directory path provided");
  });

  it("GIVEN absolute path WHEN walking THEN throws error", async () => {
    // Given: Absolute path starting with /
    const absolutePath = "/etc/passwd";

    // When/Then: Should reject absolute paths
    await expect(walkDirectory(absolutePath)).rejects.toThrow("Invalid directory path provided");
  });

  it("GIVEN path with multiple parent traversals WHEN walking THEN throws error", async () => {
    // Given: Path with multiple .. sequences
    const maliciousPath = "../../../../../../etc/shadow";

    // When/Then: Should reject the path
    await expect(walkDirectory(maliciousPath)).rejects.toThrow("Invalid directory path provided");
  });

  it("GIVEN valid relative path WHEN walking THEN accepts path", async () => {
    // Given: Valid relative path without traversal
    const validPath = "specs/doing";

    // When/Then: Should accept valid relative paths
    // This will fail if directory doesn't exist, but won't fail the security check
    await expect(walkDirectory(validPath)).rejects.toThrow(/Failed to walk directory/);
  });
});
