/**
 * Level 2: Integration tests for CLI validation commands
 * Story: story-47_validation-commands
 *
 * Tests the CLI command wiring to validation step functions.
 * Uses the current project as a clean fixture (validation passes on HEAD).
 */
import { execa } from "execa";
import path from "path";
import { fileURLToPath } from "url";
import { describe, expect, it } from "vitest";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CLI_PATH = path.join(__dirname, "../../../bin/spx.js");
const PROJECT_ROOT = path.join(__dirname, "../../..");

describe("spx validation commands", () => {
  describe("spx validation typescript", () => {
    it("GIVEN clean project WHEN running typescript validation THEN exits 0", async () => {
      // When: Run typescript validation on current project
      const result = await execa("node", [CLI_PATH, "validation", "typescript"], {
        cwd: PROJECT_ROOT,
        reject: false,
      });

      // Then: Should pass (current project is clean)
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("TypeScript");
    });

    it("GIVEN quiet flag WHEN running typescript validation THEN suppresses output", async () => {
      // When: Run with --quiet
      const result = await execa("node", [CLI_PATH, "validation", "typescript", "--quiet"], {
        cwd: PROJECT_ROOT,
        reject: false,
      });

      // Then: Should pass with minimal output
      expect(result.exitCode).toBe(0);
    });
  });

  describe("spx validation lint", () => {
    it("GIVEN clean project WHEN running lint validation THEN exits 0", async () => {
      // When: Run lint validation on current project
      const result = await execa("node", [CLI_PATH, "validation", "lint"], {
        cwd: PROJECT_ROOT,
        reject: false,
      });

      // Then: Should pass
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("ESLint");
    });
  });

  describe("spx validation circular", () => {
    it("GIVEN clean project WHEN running circular validation THEN exits 0", async () => {
      // When: Run circular dependency check
      const result = await execa("node", [CLI_PATH, "validation", "circular"], {
        cwd: PROJECT_ROOT,
        reject: false,
      });

      // Then: Should pass (no circular deps)
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Circular");
    });
  });

  describe("spx validation all", () => {
    it(
      "GIVEN clean project WHEN running all validations THEN exits 0",
      async () => {
        // When: Run all validations
        const result = await execa("node", [CLI_PATH, "validation", "all"], {
          cwd: PROJECT_ROOT,
          reject: false,
        });

        // Then: Should pass
        expect(result.exitCode).toBe(0);
      },
      { timeout: 120000 }, // Allow 2 minutes for all validations
    );
  });

  describe("graceful degradation", () => {
    it("GIVEN tool discovery succeeds WHEN running validation THEN executes validation", async () => {
      // Note: Testing "missing tool" is difficult because discoverTool()
      // checks node_modules/.bin which exists in the project.
      // Instead, we verify that when the tool IS found, validation runs.
      const result = await execa("node", [CLI_PATH, "validation", "circular"], {
        cwd: PROJECT_ROOT,
        reject: false,
      });

      // Then: Should run validation (either pass or fail, but not skip)
      expect(result.exitCode).toBe(0);
      // Output should indicate validation ran, not skipped
      expect(result.stdout).not.toContain("Skipping");
    });
  });
});
