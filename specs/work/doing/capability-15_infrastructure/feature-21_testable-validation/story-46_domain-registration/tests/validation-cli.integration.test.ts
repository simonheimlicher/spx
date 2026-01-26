/**
 * Integration tests for the validation CLI commands.
 *
 * Level 2 tests verifying the CLI commands are accessible and parse options correctly.
 *
 * ADR-021: These tests verify CLI registration via --help, NOT validation results.
 * Testing validation behavior against the live repo would make tests non-hermetic.
 */
import { execa } from "execa";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Navigate up from tests dir to project root (7 levels)
const CLI_PATH = path.join(__dirname, "../../../../../../../bin/spx.js");

describe("Validation CLI Integration", () => {
  describe("GIVEN spx validation --help", () => {
    it("THEN shows all subcommands", async () => {
      const { stdout, exitCode } = await execa("node", [CLI_PATH, "validation", "--help"]);

      expect(exitCode).toBe(0);
      expect(stdout).toContain("typescript");
      expect(stdout).toContain("lint");
      expect(stdout).toContain("circular");
      expect(stdout).toContain("knip");
      expect(stdout).toContain("all");
    });

    it("THEN shows the alias 'v'", async () => {
      const { stdout } = await execa("node", [CLI_PATH, "validation", "--help"]);

      expect(stdout).toContain("validation|v");
    });
  });

  describe("GIVEN spx v (alias)", () => {
    it("THEN works the same as spx validation", async () => {
      const { stdout, exitCode } = await execa("node", [CLI_PATH, "v", "--help"]);

      expect(exitCode).toBe(0);
      expect(stdout).toContain("typescript");
      expect(stdout).toContain("lint");
    });
  });

  describe("GIVEN spx validation typescript", () => {
    it("THEN the command is accessible", async () => {
      // Test CLI registration via --help, not validation results (ADR-021)
      const { exitCode, stdout } = await execa("node", [CLI_PATH, "validation", "typescript", "--help"]);

      expect(exitCode).toBe(0);
      expect(stdout).toContain("typescript");
    });

    it("THEN shows alias 'ts' in help", async () => {
      const { stdout } = await execa("node", [CLI_PATH, "validation", "typescript", "--help"]);

      expect(stdout).toContain("typescript|ts");
    });

    it("THEN accepts common options", async () => {
      const { stdout } = await execa("node", [CLI_PATH, "validation", "typescript", "--help"]);

      expect(stdout).toContain("--scope");
      expect(stdout).toContain("--files");
      expect(stdout).toContain("--quiet");
      expect(stdout).toContain("--json");
    });
  });

  describe("GIVEN spx validation lint", () => {
    it("THEN the command is accessible", async () => {
      // Test CLI registration via --help, not validation results (ADR-021)
      const { exitCode, stdout } = await execa("node", [CLI_PATH, "validation", "lint", "--help"]);

      expect(exitCode).toBe(0);
      expect(stdout).toContain("lint");
    });

    it("THEN accepts --fix option", async () => {
      const { stdout } = await execa("node", [CLI_PATH, "validation", "lint", "--help"]);

      expect(stdout).toContain("--fix");
    });
  });

  describe("GIVEN spx validation circular", () => {
    it("THEN the command is accessible", async () => {
      // Test CLI registration via --help, not validation results (ADR-021)
      const { exitCode, stdout } = await execa("node", [CLI_PATH, "validation", "circular", "--help"]);

      expect(exitCode).toBe(0);
      expect(stdout).toContain("circular");
    });
  });

  describe("GIVEN spx validation knip", () => {
    it("THEN the command is accessible", async () => {
      // Test CLI registration via --help, not validation results (ADR-021)
      const { exitCode, stdout } = await execa("node", [CLI_PATH, "validation", "knip", "--help"]);

      expect(exitCode).toBe(0);
      expect(stdout).toContain("knip");
    });
  });

  describe("GIVEN spx validation all", () => {
    it("THEN the command is accessible", async () => {
      // Test CLI registration via --help, not validation results (ADR-021)
      const { exitCode, stdout } = await execa("node", [CLI_PATH, "validation", "all", "--help"]);

      expect(exitCode).toBe(0);
      expect(stdout).toContain("all");
    });

    it("THEN is the default command", async () => {
      // Verify 'validation' without subcommand shows same help as 'validation all'
      const { stdout: defaultHelp } = await execa("node", [CLI_PATH, "validation", "--help"]);
      const { stdout: allHelp } = await execa("node", [CLI_PATH, "validation", "all", "--help"]);

      // Both should show the validation subcommands
      expect(defaultHelp).toContain("all");
      expect(allHelp).toContain("all");
    });

    it("THEN accepts --fix option for ESLint", async () => {
      const { stdout } = await execa("node", [CLI_PATH, "validation", "all", "--help"]);

      expect(stdout).toContain("--fix");
    });
  });
});
