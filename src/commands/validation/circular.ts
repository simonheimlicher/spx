/**
 * Circular dependency check command.
 *
 * Runs madge to detect circular dependencies.
 */
import { getTypeScriptScope } from "../../validation/config/scope.js";
import { discoverTool, formatSkipMessage } from "../../validation/discovery/index.js";
import { validateCircularDependencies } from "../../validation/steps/circular.js";
import type { CircularCommandOptions, ValidationCommandResult } from "./types";

/**
 * Check for circular dependencies.
 *
 * @param options - Command options
 * @returns Command result with exit code and output
 */
export async function circularCommand(options: CircularCommandOptions): Promise<ValidationCommandResult> {
  const { cwd, quiet } = options;
  const startTime = Date.now();

  // Discover madge
  const toolResult = await discoverTool("madge", { projectRoot: cwd });
  if (!toolResult.found) {
    const skipMessage = formatSkipMessage("circular dependency check", toolResult);
    return { exitCode: 0, output: skipMessage, durationMs: Date.now() - startTime };
  }

  // Get scope configuration from tsconfig (circular always uses full scope)
  const scopeConfig = getTypeScriptScope("full");

  // Run circular dependency validation
  const result = await validateCircularDependencies("full", scopeConfig);
  const durationMs = Date.now() - startTime;

  // Map result to command output
  if (result.success) {
    const output = quiet ? "" : `Circular dependencies: ✓ None found`;
    return { exitCode: 0, output, durationMs };
  } else {
    // Format circular dependency output
    let output = result.error ?? "Circular dependencies found";
    if (result.circularDependencies && result.circularDependencies.length > 0) {
      const cycles = result.circularDependencies
        .map((cycle) => `  ${cycle.join(" → ")}`)
        .join("\n");
      output = `Circular dependencies found:\n${cycles}`;
    }
    return { exitCode: 1, output, durationMs };
  }
}
