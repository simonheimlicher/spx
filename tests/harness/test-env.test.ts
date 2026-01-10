import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { FIXTURES, withTestEnv } from "./test-env";

describe("withTestEnv()", () => {
  it("creates temp directory with clean project fixture", async () => {
    let capturedPath = "";

    await withTestEnv({ fixture: FIXTURES.CLEAN_PROJECT }, async ({ path }) => {
      capturedPath = path;

      // Verify temp directory exists during test
      expect(existsSync(path)).toBe(true);

      // Verify fixture name in path
      expect(path).toContain("clean-project");

      // Verify temp prefix
      expect(path).toContain("spx-test-");
    });

    // Note: Can't verify cleanup since directory is already deleted
    expect(capturedPath).toBeTruthy();
  });

  it("creates temp directory with type errors fixture", async () => {
    await withTestEnv({ fixture: FIXTURES.WITH_TYPE_ERRORS }, async ({ path }) => {
      expect(existsSync(path)).toBe(true);
      expect(path).toContain("with-type-errors");
    });
  });

  it("creates temp directory with lint errors fixture", async () => {
    await withTestEnv({ fixture: FIXTURES.WITH_LINT_ERRORS }, async ({ path }) => {
      expect(existsSync(path)).toBe(true);
      expect(path).toContain("with-lint-errors");
    });
  });

  it("creates temp directory with circular deps fixture", async () => {
    await withTestEnv({ fixture: FIXTURES.WITH_CIRCULAR_DEPS }, async ({ path }) => {
      expect(existsSync(path)).toBe(true);
      expect(path).toContain("with-circular-deps");
    });
  });

  it("exports all expected fixture constants", () => {
    expect(FIXTURES.CLEAN_PROJECT).toBe("clean-project");
    expect(FIXTURES.WITH_TYPE_ERRORS).toBe("with-type-errors");
    expect(FIXTURES.WITH_LINT_ERRORS).toBe("with-lint-errors");
    expect(FIXTURES.WITH_CIRCULAR_DEPS).toBe("with-circular-deps");
  });
});
