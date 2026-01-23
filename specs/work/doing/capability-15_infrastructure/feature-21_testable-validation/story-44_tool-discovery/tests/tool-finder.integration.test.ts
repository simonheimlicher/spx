/**
 * Level 2 (Integration):
 * - Real require.resolve on typescript package
 * - Real filesystem check for node_modules/.bin
 * - Real PATH lookup for system tools like git
 * - Actual graceful degradation with missing tools
 */

import { TOOL_DISCOVERY } from "@/validation/discovery/constants.js";
import { discoverTool } from "@/validation/discovery/tool-finder.js";
import { describe, expect, it } from "vitest";

describe("discoverTool integration", () => {
  it("GIVEN typescript installed WHEN discovering THEN finds it", async () => {
    // Real discovery with default deps
    const result = await discoverTool("typescript");

    expect(result.found).toBe(true);
    if (result.found) {
      // Should find either bundled or project version
      expect([
        TOOL_DISCOVERY.SOURCES.BUNDLED,
        TOOL_DISCOVERY.SOURCES.PROJECT,
      ]).toContain(result.location.source);
      expect(result.location.tool).toBe("typescript");
    }
  });

  it("GIVEN eslint installed WHEN discovering THEN finds it", async () => {
    const result = await discoverTool("eslint");

    expect(result.found).toBe(true);
    if (result.found) {
      expect([
        TOOL_DISCOVERY.SOURCES.BUNDLED,
        TOOL_DISCOVERY.SOURCES.PROJECT,
      ]).toContain(result.location.source);
    }
  });

  it("GIVEN git in PATH WHEN discovering THEN finds global", async () => {
    const result = await discoverTool("git");

    expect(result.found).toBe(true);
    if (result.found) {
      expect(result.location.source).toBe(TOOL_DISCOVERY.SOURCES.GLOBAL);
      expect(result.location.path).toContain("git");
    }
  });

  it("GIVEN node in PATH WHEN discovering THEN finds global", async () => {
    const result = await discoverTool("node");

    expect(result.found).toBe(true);
    if (result.found) {
      expect(result.location.source).toBe(TOOL_DISCOVERY.SOURCES.GLOBAL);
    }
  });

  it("GIVEN nonexistent tool WHEN discovering THEN returns not found", async () => {
    const result = await discoverTool("definitely-not-a-real-tool-12345");

    expect(result.found).toBe(false);
    if (!result.found) {
      expect(result.notFound.tool).toBe("definitely-not-a-real-tool-12345");
      expect(result.notFound.reason).toBeDefined();
    }
  });

  it("GIVEN madge installed WHEN discovering THEN finds it", async () => {
    // madge is in devDependencies
    const result = await discoverTool("madge");

    expect(result.found).toBe(true);
    if (result.found) {
      expect([
        TOOL_DISCOVERY.SOURCES.BUNDLED,
        TOOL_DISCOVERY.SOURCES.PROJECT,
      ]).toContain(result.location.source);
    }
  });
});
