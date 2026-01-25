/**
 * TypeScript validation command.
 *
 * Runs TypeScript type checking using tsc.
 */
import { getTypeScriptScope } from "../../validation/config/scope.js";
import { discoverTool, formatSkipMessage } from "../../validation/discovery/index.js";
import { validateTypeScript } from "../../validation/steps/typescript.js";
import type { TypeScriptCommandOptions, ValidationCommandResult } from "./types";

/**
 * Run TypeScript type checking.
 *
 * @param options - Command options
 * @returns Command result with exit code and output
 */
export async function typescriptCommand(options: TypeScriptCommandOptions): Promise<ValidationCommandResult> {
  const { cwd, scope = "full", files, quiet } = options;

  // Discover tsc (provided by typescript package)
  const toolResult = await discoverTool("typescript", { projectRoot: cwd });
  if (!toolResult.found) {
    const skipMessage = formatSkipMessage("TypeScript", toolResult);
    return { exitCode: 0, output: skipMessage };
  }

  // Get scope configuration from tsconfig
  const scopeConfig = getTypeScriptScope(scope);

  // Run TypeScript validation
  const result = await validateTypeScript(scope, scopeConfig, files);

  // Map result to command output
  if (result.success) {
    const output = quiet ? "" : `TypeScript: ✓ No type errors`;
    return { exitCode: 0, output };
  } else {
    const output = result.error ?? "TypeScript validation failed";
    return { exitCode: 1, output };
  }
}
