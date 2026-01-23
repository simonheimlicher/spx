/**
 * Knip validation step.
 *
 * Detects unused exports, dependencies, and files using knip.
 *
 * @module validation/steps/knip
 */

import { spawn } from "node:child_process";

import type { ProcessRunner, ScopeConfig, ValidationContext, ValidationStep, ValidationStepResult } from "../types.js";

import { STEP_DESCRIPTIONS, STEP_IDS, STEP_NAMES, VALIDATION_DEFAULTS, VALIDATION_KEYS } from "./constants.js";
import { validationEnabled } from "./eslint.js";

// =============================================================================
// DEFAULT DEPENDENCIES
// =============================================================================

/**
 * Default production process runner for Knip.
 */
export const defaultKnipProcessRunner: ProcessRunner = { spawn };

// =============================================================================
// VALIDATION FUNCTION
// =============================================================================

/**
 * Validate unused code using knip with TypeScript-derived scope.
 *
 * @param scope - Validation scope
 * @param typescriptScope - Scope configuration from tsconfig
 * @param runner - Injectable process runner
 * @returns Promise resolving to validation result
 *
 * @example
 * ```typescript
 * const result = await validateKnip("full", scopeConfig);
 * if (!result.success) {
 *   console.error("Knip found issues:", result.error);
 * }
 * ```
 */
export async function validateKnip(
  typescriptScope: ScopeConfig,
  runner: ProcessRunner = defaultKnipProcessRunner,
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Use TypeScript-derived directories for perfect scope alignment
    const analyzeDirectories = typescriptScope.directories;

    if (analyzeDirectories.length === 0) {
      return { success: true };
    }

    return new Promise((resolve) => {
      const knipProcess = runner.spawn("npx", ["knip"], {
        cwd: process.cwd(),
        stdio: "pipe",
      });

      let knipOutput = "";
      let knipError = "";

      knipProcess.stdout?.on("data", (data: Buffer) => {
        knipOutput += data.toString();
      });

      knipProcess.stderr?.on("data", (data: Buffer) => {
        knipError += data.toString();
      });

      knipProcess.on("close", (code) => {
        if (code === 0) {
          resolve({ success: true });
        } else {
          const errorOutput = knipOutput || knipError || "Unused code detected";
          resolve({
            success: false,
            error: errorOutput,
          });
        }
      });

      knipProcess.on("error", (error) => {
        resolve({ success: false, error: error.message });
      });
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}

// =============================================================================
// VALIDATION STEP DEFINITION
// =============================================================================

/**
 * Knip unused code validation step.
 *
 * Enabled when knip validation is enabled and not in file-specific mode.
 * Knip is disabled by default.
 */
export const knipStep: ValidationStep = {
  id: STEP_IDS.KNIP,
  name: STEP_NAMES.KNIP,
  description: STEP_DESCRIPTIONS.KNIP,
  enabled: (context: ValidationContext) =>
    context.enabledValidations[VALIDATION_KEYS.KNIP] === true
    && validationEnabled(VALIDATION_KEYS.KNIP, VALIDATION_DEFAULTS)
    && !context.isFileSpecificMode,
  execute: async (context: ValidationContext): Promise<ValidationStepResult> => {
    const startTime = performance.now();
    try {
      const result = await validateKnip(context.scopeConfig);
      return {
        success: result.success,
        error: result.error,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: performance.now() - startTime,
      };
    }
  },
};
