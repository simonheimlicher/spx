/**
 * ESLint validation command.
 *
 * Runs ESLint for code quality checks.
 */
import { getTypeScriptScope } from "../../validation/config/scope.js";
import { discoverTool, formatSkipMessage } from "../../validation/discovery/index.js";
import { validateESLint } from "../../validation/steps/eslint.js";
import type { ValidationContext } from "../../validation/types.js";
import type { LintCommandOptions, ValidationCommandResult } from "./types";

/**
 * Run ESLint validation.
 *
 * @param options - Command options
 * @returns Command result with exit code and output
 */
export async function lintCommand(options: LintCommandOptions): Promise<ValidationCommandResult> {
  const { cwd, scope = "full", files, fix, quiet } = options;
  const startTime = Date.now();

  // Discover eslint
  const toolResult = await discoverTool("eslint", { projectRoot: cwd });
  if (!toolResult.found) {
    const skipMessage = formatSkipMessage("ESLint", toolResult);
    return { exitCode: 0, output: skipMessage, durationMs: Date.now() - startTime };
  }

  // Get scope configuration from tsconfig
  const scopeConfig = getTypeScriptScope(scope);

  // Build validation context
  const context: ValidationContext = {
    projectRoot: cwd,
    scope,
    scopeConfig,
    mode: fix ? "write" : "read",
    enabledValidations: { ESLINT: true },
    validatedFiles: files,
    isFileSpecificMode: Boolean(files && files.length > 0),
  };

  // Run ESLint validation
  const result = await validateESLint(context);
  const durationMs = Date.now() - startTime;

  // Map result to command output
  if (result.success) {
    const output = quiet ? "" : `ESLint: ✓ No issues found`;
    return { exitCode: 0, output, durationMs };
  } else {
    const output = result.error ?? "ESLint validation failed";
    return { exitCode: 1, output, durationMs };
  }
}
