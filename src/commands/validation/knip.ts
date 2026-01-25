/**
 * Knip command for detecting unused code.
 *
 * Runs knip to find unused exports, dependencies, and files.
 */
import { getTypeScriptScope } from "../../validation/config/scope.js";
import { discoverTool, formatSkipMessage } from "../../validation/discovery/index.js";
import { validateKnip } from "../../validation/steps/knip.js";
import type { KnipCommandOptions, ValidationCommandResult } from "./types";

/**
 * Detect unused code with knip.
 *
 * @param options - Command options
 * @returns Command result with exit code and output
 */
export async function knipCommand(options: KnipCommandOptions): Promise<ValidationCommandResult> {
  const { cwd, quiet } = options;
  const startTime = Date.now();

  // Discover knip
  const toolResult = await discoverTool("knip", { projectRoot: cwd });
  if (!toolResult.found) {
    const skipMessage = formatSkipMessage("unused code detection", toolResult);
    return { exitCode: 0, output: skipMessage, durationMs: Date.now() - startTime };
  }

  // Get scope configuration from tsconfig (knip uses full scope)
  const scopeConfig = getTypeScriptScope("full");

  // Run knip validation
  const result = await validateKnip(scopeConfig);
  const durationMs = Date.now() - startTime;

  // Map result to command output
  if (result.success) {
    const output = quiet ? "" : `Knip: ✓ No unused code found`;
    return { exitCode: 0, output, durationMs };
  } else {
    const output = result.error ?? "Unused code found";
    return { exitCode: 1, output, durationMs };
  }
}
