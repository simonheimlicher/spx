/**
 * Level 1: Unit tests for scope resolution
 * Story: story-45_extract-validation-core
 *
 * Tests scope resolution functions with dependency injection.
 */

import type { Dirent, PathLike, PathOrFileDescriptor } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  getTypeScriptScope,
  hasTypeScriptFilesRecursive,
  parseTypeScriptConfig,
  type ScopeDeps,
  VALIDATION_SCOPES,
} from "../../../src/validation/index.js";

/**
 * Create a mock Dirent object for testing.
 */
function createMockDirent(name: string, isFile: boolean, isDirectory: boolean): Dirent {
  return {
    name,
    isFile: () => isFile,
    isDirectory: () => isDirectory,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isFIFO: () => false,
    isSocket: () => false,
    isSymbolicLink: () => false,
    parentPath: "",
    path: "",
  } as Dirent;
}

/**
 * Create test dependencies with proper type casting.
 * Uses function overload patterns to satisfy TypeScript's strict checking.
 */
function createTestDeps(config: {
  readFileContent?: string;
  existsCheck?: (path: string) => boolean;
  readdirResult?: Dirent[] | ((path: string) => Dirent[]);
}): ScopeDeps {
  return {
    readFileSync: ((_path: PathOrFileDescriptor) => config.readFileContent ?? "") as ScopeDeps["readFileSync"],
    existsSync: (path: PathLike) => (config.existsCheck ? config.existsCheck(String(path)) : true),
    readdirSync: ((path: PathLike) => {
      if (typeof config.readdirResult === "function") {
        return config.readdirResult(String(path));
      }
      return config.readdirResult ?? [];
    }) as unknown as ScopeDeps["readdirSync"],
  };
}

describe("parseTypeScriptConfig", () => {
  it("GIVEN valid tsconfig content WHEN parsing THEN returns config object", () => {
    const mockDeps = createTestDeps({
      readFileContent: JSON.stringify({
        include: ["src/**/*.ts"],
        exclude: ["node_modules/**"],
      }),
    });

    const config = parseTypeScriptConfig("tsconfig.json", mockDeps);

    expect(config.include).toEqual(["src/**/*.ts"]);
    expect(config.exclude).toEqual(["node_modules/**"]);
  });

  it("GIVEN invalid JSON WHEN parsing THEN returns empty config (graceful degradation)", () => {
    const mockDeps = createTestDeps({
      readFileContent: "{ invalid json",
    });

    const config = parseTypeScriptConfig("tsconfig.json", mockDeps);

    // Should return an object (even if partially populated)
    // The function gracefully handles parse errors
    expect(config).toBeDefined();
    expect(typeof config).toBe("object");
  });
});

describe("hasTypeScriptFilesRecursive", () => {
  it("GIVEN directory with TypeScript files WHEN checking THEN returns true", () => {
    const mockDeps = createTestDeps({
      readdirResult: [createMockDirent("index.ts", true, false)],
    });

    const result = hasTypeScriptFilesRecursive("src", 2, mockDeps);

    expect(result).toBe(true);
  });

  it("GIVEN directory with TSX files WHEN checking THEN returns true", () => {
    const mockDeps = createTestDeps({
      readdirResult: [createMockDirent("App.tsx", true, false)],
    });

    const result = hasTypeScriptFilesRecursive("src", 2, mockDeps);

    expect(result).toBe(true);
  });

  it("GIVEN directory with no TypeScript files WHEN checking THEN returns false", () => {
    const mockDeps = createTestDeps({
      readdirResult: [
        createMockDirent("index.js", true, false),
        createMockDirent("README.md", true, false),
      ],
    });

    const result = hasTypeScriptFilesRecursive("src", 2, mockDeps);

    expect(result).toBe(false);
  });

  it("GIVEN maxDepth of 0 WHEN checking THEN returns false", () => {
    const mockDeps = createTestDeps({
      readdirResult: [createMockDirent("index.ts", true, false)],
    });

    const result = hasTypeScriptFilesRecursive("src", 0, mockDeps);

    expect(result).toBe(false);
  });
});

describe("getTypeScriptScope", () => {
  it("GIVEN full scope WHEN resolving THEN returns ScopeConfig with directories", () => {
    const mockDeps = createTestDeps({
      readFileContent: JSON.stringify({
        include: ["src/**/*.ts", "tests/**/*.ts"],
        exclude: ["node_modules/**", "dist/**"],
      }),
      existsCheck: (p) => p === "src" || p === "tests",
      readdirResult: (p) => {
        if (p === ".") {
          return [
            createMockDirent("src", false, true),
            createMockDirent("tests", false, true),
            createMockDirent("node_modules", false, true),
          ];
        }
        // Return TypeScript files in src and tests
        return [createMockDirent("index.ts", true, false)];
      },
    });

    const scope = getTypeScriptScope(VALIDATION_SCOPES.FULL, mockDeps);

    expect(scope.directories).toBeDefined();
    expect(scope.filePatterns).toBeDefined();
    expect(scope.excludePatterns).toBeDefined();
    expect(Array.isArray(scope.directories)).toBe(true);
  });
});
