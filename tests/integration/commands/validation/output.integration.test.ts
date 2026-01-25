/**
 * Level 2: Integration tests for validation CLI output formatting.
 * Story: story-48_validation-output-enhancements
 *
 * Tests verify the CLI produces expected output format when running
 * real validation tools.
 *
 * These tests are consolidated to minimize CLI invocations since
 * `spx validation all` takes several seconds.
 *
 * Note: Tests use reject: false because the project may have intentional
 * errors (e.g., scripts/test-type-error.ts for testing purposes).
 */

import { execa } from "execa";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Navigate up from tests dir to project root (4 levels)
const CLI_PATH = path.join(__dirname, "../../../../bin/spx.js");

/** Pattern matching step numbering like [1/4] */
const STEP_NUMBER_PATTERN = /\[\d+\/\d+\]/;

/** Pattern matching timing like (500ms) or (1.5s) */
const TIMING_PATTERN = /\(\d+(\.\d)?m?s\)/;

/** Pattern matching summary line like "✓ Validation passed (2.7s total)" or "✗ Validation failed" */
const SUMMARY_PATTERN = /[✓✗] Validation (passed|failed) \(\d+(\.\d)?s total\)/;

describe("Validation CLI Output Format", () => {
  // Cache the result to avoid running validation multiple times
  let validationResult: Awaited<ReturnType<typeof execa>>;
  let quietResult: Awaited<ReturnType<typeof execa>>;

  beforeAll(async () => {
    // Run validation all once and cache the result
    // Use reject: false to not throw on validation errors (the project may have intentional errors)
    validationResult = await execa("node", [CLI_PATH, "validation", "all"], { reject: false });

    // Run with --quiet once
    quietResult = await execa("node", [CLI_PATH, "validation", "all", "--quiet"], { reject: false });
  }, 30000); // 30 second timeout for beforeAll

  describe("Step numbering and timing", () => {
    it("GIVEN spx validation all WHEN running THEN output includes step numbers [1/4] through [4/4]", () => {
      // Test output format regardless of pass/fail status
      expect(validationResult.stdout).toMatch(STEP_NUMBER_PATTERN);
      expect(validationResult.stdout).toContain("[1/4]");
      expect(validationResult.stdout).toContain("[4/4]");
    });

    it("GIVEN spx validation all WHEN running THEN output includes timing for each step", () => {
      expect(validationResult.stdout).toMatch(TIMING_PATTERN);
    });
  });

  describe("Summary line", () => {
    it("GIVEN spx validation all WHEN running THEN shows summary with total time", () => {
      // Test format regardless of pass/fail - could be "passed" or "failed"
      expect(validationResult.stdout).toMatch(SUMMARY_PATTERN);
      expect(validationResult.stdout).toMatch(/\(\d+(\.\d)?s total\)/);
    });
  });

  describe("Quiet mode", () => {
    it("GIVEN --quiet flag WHEN running THEN suppresses step output and summary", () => {
      expect(quietResult.stdout).not.toMatch(STEP_NUMBER_PATTERN);
      expect(quietResult.stdout).not.toMatch(SUMMARY_PATTERN);
    });
  });
});

describe("Individual command timing", () => {
  it(
    "GIVEN spx validation typescript WHEN running THEN output contains TypeScript info",
    async () => {
      // Use reject: false because project may have intentional type errors
      const result = await execa("node", [CLI_PATH, "validation", "typescript"], { reject: false });

      // Individual commands show their output (may pass or fail depending on project state)
      expect(result.stdout).toContain("TypeScript");
    },
    15000,
  ); // 15 second timeout
});
