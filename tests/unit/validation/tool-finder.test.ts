/**
 * Test Levels for Tool Discovery:
 *
 * Level 1 (Unit):
 * - Discovery priority logic with controlled deps
 * - Result type construction
 * - Skip message formatting
 * - Error handling paths
 *
 * ESCALATION 1 → 2:
 * Level 1 proves the logic for checking each tier is correct,
 * but cannot verify that require.resolve(), existsSync(), and which
 * actually find real tools on the system.
 */

import { TOOL_DISCOVERY } from "@/validation/discovery/constants.js";
import {
  discoverTool,
  formatSkipMessage,
  type ToolDiscoveryDeps,
  type ToolDiscoveryResult,
} from "@/validation/discovery/tool-finder.js";
import { describe, expect, it } from "vitest";

describe("discoverTool", () => {
  describe("GIVEN bundled tool available", () => {
    it("WHEN discovering THEN returns bundled source", async () => {
      const deps: ToolDiscoveryDeps = {
        resolveModule: (path) => path.includes("eslint") ? "/bundled/eslint/package.json" : null,
        existsSync: () => false,
        whichSync: () => null,
      };

      const result = await discoverTool("eslint", { deps });

      expect(result.found).toBe(true);
      if (result.found) {
        expect(result.location.source).toBe(TOOL_DISCOVERY.SOURCES.BUNDLED);
        expect(result.location.tool).toBe("eslint");
      }
    });

    it("WHEN bundled found THEN does not check project or global", async () => {
      let projectChecked = false;
      let globalChecked = false;

      const deps: ToolDiscoveryDeps = {
        resolveModule: () => "/bundled/tool/package.json",
        existsSync: () => {
          projectChecked = true;
          return true;
        },
        whichSync: () => {
          globalChecked = true;
          return "/global/tool";
        },
      };

      await discoverTool("tool", { deps });

      expect(projectChecked).toBe(false);
      expect(globalChecked).toBe(false);
    });
  });

  describe("GIVEN tool only in project node_modules", () => {
    it("WHEN discovering THEN returns project source", async () => {
      const deps: ToolDiscoveryDeps = {
        resolveModule: () => null, // Not bundled
        existsSync: (path) => path.includes("node_modules/.bin/madge"),
        whichSync: () => null,
      };

      const result = await discoverTool("madge", {
        projectRoot: "/project",
        deps,
      });

      expect(result.found).toBe(true);
      if (result.found) {
        expect(result.location.source).toBe(TOOL_DISCOVERY.SOURCES.PROJECT);
        expect(result.location.path).toContain("node_modules/.bin/madge");
      }
    });

    it("WHEN project found THEN does not check global", async () => {
      let globalChecked = false;

      const deps: ToolDiscoveryDeps = {
        resolveModule: () => null,
        existsSync: () => true, // Project has it
        whichSync: () => {
          globalChecked = true;
          return "/global/tool";
        },
      };

      await discoverTool("tool", { projectRoot: "/project", deps });

      expect(globalChecked).toBe(false);
    });
  });

  describe("GIVEN tool only in system PATH", () => {
    it("WHEN discovering THEN returns global source", async () => {
      const deps: ToolDiscoveryDeps = {
        resolveModule: () => null,
        existsSync: () => false,
        whichSync: (tool) => (tool === "git" ? "/usr/bin/git" : null),
      };

      const result = await discoverTool("git", { deps });

      expect(result.found).toBe(true);
      if (result.found) {
        expect(result.location.source).toBe(TOOL_DISCOVERY.SOURCES.GLOBAL);
        expect(result.location.path).toBe("/usr/bin/git");
      }
    });
  });

  describe("GIVEN tool not found anywhere", () => {
    it("WHEN discovering THEN returns not found with reason", async () => {
      const deps: ToolDiscoveryDeps = {
        resolveModule: () => null,
        existsSync: () => false,
        whichSync: () => null,
      };

      const result = await discoverTool("nonexistent", { deps });

      expect(result.found).toBe(false);
      if (!result.found) {
        expect(result.notFound.tool).toBe("nonexistent");
        expect(result.notFound.reason).toContain("not found");
      }
    });
  });

  describe("GIVEN no projectRoot provided", () => {
    it("WHEN discovering THEN uses cwd for project check", async () => {
      let checkedPath = "";

      const deps: ToolDiscoveryDeps = {
        resolveModule: () => null,
        existsSync: (path) => {
          checkedPath = path;
          return false;
        },
        whichSync: () => null,
      };

      await discoverTool("tool", { deps });

      // Should check cwd's node_modules
      expect(checkedPath).toContain("node_modules/.bin/tool");
    });
  });
});

describe("formatSkipMessage", () => {
  it("GIVEN not found result WHEN formatting THEN includes step name and tool", () => {
    const result: ToolDiscoveryResult = {
      found: false,
      notFound: { tool: "madge", reason: "not installed" },
    };

    const message = formatSkipMessage("Circular dependency check", result);

    expect(message).toContain(TOOL_DISCOVERY.MESSAGES.SKIP_PREFIX);
    expect(message).toContain("Circular dependency check");
    expect(message).toContain("madge");
  });

  it("GIVEN found result WHEN formatting THEN returns empty string", () => {
    const result: ToolDiscoveryResult = {
      found: true,
      location: {
        tool: "eslint",
        path: "/path/to/eslint",
        source: "bundled",
      },
    };

    const message = formatSkipMessage("Linting", result);

    expect(message).toBe("");
  });
});
