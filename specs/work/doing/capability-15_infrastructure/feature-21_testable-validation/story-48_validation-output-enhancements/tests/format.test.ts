/**
 * Level 1: Unit tests for validation output formatting functions.
 * Story: story-48_validation-output-enhancements
 *
 * Tests pure functions that format validation output for display.
 * These functions are testable without external dependencies.
 */

import { describe, expect, it } from "vitest";

import {
  DURATION_THRESHOLD_MS,
  formatDuration,
  formatStepOutput,
  formatSummary,
  VALIDATION_SYMBOLS,
} from "../../../../../../../src/commands/validation/format.js";

describe("formatDuration", () => {
  describe("milliseconds display (below threshold)", () => {
    it("GIVEN duration = 0 WHEN formatting THEN shows 0ms", () => {
      expect(formatDuration(0)).toBe("0ms");
    });

    it("GIVEN duration = 500 WHEN formatting THEN shows 500ms", () => {
      expect(formatDuration(500)).toBe("500ms");
    });

    it("GIVEN duration = 999 WHEN formatting THEN shows 999ms", () => {
      expect(formatDuration(999)).toBe("999ms");
    });

    it("GIVEN duration just below threshold WHEN formatting THEN shows milliseconds", () => {
      expect(formatDuration(DURATION_THRESHOLD_MS - 1)).toBe(
        `${DURATION_THRESHOLD_MS - 1}ms`,
      );
    });
  });

  describe("seconds display (at or above threshold)", () => {
    it("GIVEN duration = 1000 WHEN formatting THEN shows 1.0s", () => {
      expect(formatDuration(1000)).toBe("1.0s");
    });

    it("GIVEN duration = 1500 WHEN formatting THEN shows 1.5s", () => {
      expect(formatDuration(1500)).toBe("1.5s");
    });

    it("GIVEN duration = 2750 WHEN formatting THEN shows 2.8s (rounded)", () => {
      expect(formatDuration(2750)).toBe("2.8s");
    });

    it("GIVEN duration at threshold WHEN formatting THEN shows seconds", () => {
      expect(formatDuration(DURATION_THRESHOLD_MS)).toBe("1.0s");
    });

    it("GIVEN large duration WHEN formatting THEN shows seconds with one decimal", () => {
      expect(formatDuration(12345)).toBe("12.3s");
    });
  });
});

describe("formatStepOutput", () => {
  it("GIVEN step result with seconds duration WHEN formatting THEN includes step number, name, result, and timing in seconds", () => {
    const output = formatStepOutput({
      stepNumber: 1,
      totalSteps: 4,
      name: "Circular dependencies",
      result: `${VALIDATION_SYMBOLS.SUCCESS} None found`,
      durationMs: 1600,
    });

    expect(output).toBe(
      "[1/4] Circular dependencies: ✓ None found (1.6s)",
    );
  });

  it("GIVEN step with millisecond duration WHEN formatting THEN shows ms", () => {
    const output = formatStepOutput({
      stepNumber: 2,
      totalSteps: 4,
      name: "ESLint",
      result: `${VALIDATION_SYMBOLS.SUCCESS} No issues found`,
      durationMs: 500,
    });

    expect(output).toBe("[2/4] ESLint: ✓ No issues found (500ms)");
  });

  it("GIVEN step with failure WHEN formatting THEN includes failure symbol", () => {
    const output = formatStepOutput({
      stepNumber: 3,
      totalSteps: 4,
      name: "TypeScript",
      result: `${VALIDATION_SYMBOLS.FAILURE} 5 type errors`,
      durationMs: 1300,
    });

    expect(output).toBe("[3/4] TypeScript: ✗ 5 type errors (1.3s)");
  });
});

describe("formatSummary", () => {
  it("GIVEN all steps passed WHEN formatting summary THEN shows success with checkmark", () => {
    const summary = formatSummary({ success: true, totalDurationMs: 2700 });

    expect(summary).toBe(`${VALIDATION_SYMBOLS.SUCCESS} Validation passed (2.7s total)`);
  });

  it("GIVEN any step failed WHEN formatting summary THEN shows failure with X", () => {
    const summary = formatSummary({ success: false, totalDurationMs: 1500 });

    expect(summary).toBe(`${VALIDATION_SYMBOLS.FAILURE} Validation failed (1.5s total)`);
  });

  it("GIVEN short duration WHEN formatting summary THEN shows milliseconds", () => {
    const summary = formatSummary({ success: true, totalDurationMs: 500 });

    expect(summary).toBe(`${VALIDATION_SYMBOLS.SUCCESS} Validation passed (500ms total)`);
  });
});

describe("VALIDATION_SYMBOLS constant", () => {
  it("has expected success symbol", () => {
    expect(VALIDATION_SYMBOLS.SUCCESS).toBe("✓");
  });

  it("has expected failure symbol", () => {
    expect(VALIDATION_SYMBOLS.FAILURE).toBe("✗");
  });
});

describe("DURATION_THRESHOLD_MS constant", () => {
  it("is set to 1000ms (1 second)", () => {
    expect(DURATION_THRESHOLD_MS).toBe(1000);
  });
});
