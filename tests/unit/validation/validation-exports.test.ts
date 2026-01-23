/**
 * Level 1: Unit tests for validation module exports
 * Story: story-45_extract-validation-core
 *
 * Verifies that all types and functions are exported correctly from
 * the src/validation/ module.
 */

import { describe, expect, it } from "vitest";

// Import everything from the validation module to verify exports
import * as validation from "../../../src/validation/index.js";

describe("src/validation module exports", () => {
  describe("types", () => {
    it("GIVEN validation module WHEN importing THEN exports VALIDATION_SCOPES constant", () => {
      expect(validation.VALIDATION_SCOPES).toBeDefined();
      expect(validation.VALIDATION_SCOPES.FULL).toBe("full");
      expect(validation.VALIDATION_SCOPES.PRODUCTION).toBe("production");
    });

    it("GIVEN validation module WHEN importing THEN exports EXECUTION_MODES constant", () => {
      expect(validation.EXECUTION_MODES).toBeDefined();
      expect(validation.EXECUTION_MODES.READ).toBe("read");
      expect(validation.EXECUTION_MODES.WRITE).toBe("write");
    });
  });

  describe("config", () => {
    it("GIVEN validation module WHEN importing THEN exports TSCONFIG_FILES constant", () => {
      expect(validation.TSCONFIG_FILES).toBeDefined();
      expect(validation.TSCONFIG_FILES.full).toBe("tsconfig.json");
      expect(validation.TSCONFIG_FILES.production).toBe("tsconfig.production.json");
    });

    it("GIVEN validation module WHEN importing THEN exports getTypeScriptScope function", () => {
      expect(validation.getTypeScriptScope).toBeDefined();
      expect(typeof validation.getTypeScriptScope).toBe("function");
    });
  });

  describe("discovery", () => {
    it("GIVEN validation module WHEN importing THEN exports discoverTool function", () => {
      expect(validation.discoverTool).toBeDefined();
      expect(typeof validation.discoverTool).toBe("function");
    });

    it("GIVEN validation module WHEN importing THEN exports formatSkipMessage function", () => {
      expect(validation.formatSkipMessage).toBeDefined();
      expect(typeof validation.formatSkipMessage).toBe("function");
    });

    it("GIVEN validation module WHEN importing THEN exports TOOL_DISCOVERY constant", () => {
      expect(validation.TOOL_DISCOVERY).toBeDefined();
      expect(validation.TOOL_DISCOVERY.SOURCES).toBeDefined();
      expect(validation.TOOL_DISCOVERY.MESSAGES).toBeDefined();
    });
  });

  describe("steps", () => {
    it("GIVEN validation module WHEN importing THEN exports STEP_IDS constant", () => {
      expect(validation.STEP_IDS).toBeDefined();
      expect(validation.STEP_IDS.CIRCULAR).toBe("circular-deps");
      expect(validation.STEP_IDS.ESLINT).toBe("eslint");
      expect(validation.STEP_IDS.TYPESCRIPT).toBe("typescript");
      expect(validation.STEP_IDS.KNIP).toBe("knip");
    });

    it("GIVEN validation module WHEN importing THEN exports VALIDATION_STEPS array", () => {
      expect(validation.VALIDATION_STEPS).toBeDefined();
      expect(Array.isArray(validation.VALIDATION_STEPS)).toBe(true);
      expect(validation.VALIDATION_STEPS.length).toBe(4);
    });

    it("GIVEN validation module WHEN importing THEN exports validateCircularDependencies function", () => {
      expect(validation.validateCircularDependencies).toBeDefined();
      expect(typeof validation.validateCircularDependencies).toBe("function");
    });

    it("GIVEN validation module WHEN importing THEN exports validateESLint function", () => {
      expect(validation.validateESLint).toBeDefined();
      expect(typeof validation.validateESLint).toBe("function");
    });

    it("GIVEN validation module WHEN importing THEN exports validateTypeScript function", () => {
      expect(validation.validateTypeScript).toBeDefined();
      expect(typeof validation.validateTypeScript).toBe("function");
    });

    it("GIVEN validation module WHEN importing THEN exports validateKnip function", () => {
      expect(validation.validateKnip).toBeDefined();
      expect(typeof validation.validateKnip).toBe("function");
    });

    it("GIVEN validation module WHEN importing THEN exports buildEslintArgs function", () => {
      expect(validation.buildEslintArgs).toBeDefined();
      expect(typeof validation.buildEslintArgs).toBe("function");
    });

    it("GIVEN validation module WHEN importing THEN exports buildTypeScriptArgs function", () => {
      expect(validation.buildTypeScriptArgs).toBeDefined();
      expect(typeof validation.buildTypeScriptArgs).toBe("function");
    });
  });
});
