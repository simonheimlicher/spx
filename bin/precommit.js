#!/usr/bin/env node

/**
 * Pre-commit hook entry point for lefthook.
 *
 * This script runs vitest on staged files that are test-relevant.
 * It is invoked by lefthook during the pre-commit hook.
 *
 * Usage:
 *   node bin/precommit.js
 *
 * Exit codes:
 *   0 - Tests passed or no tests needed
 *   1 - Tests failed
 */

import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distPath = join(__dirname, "../dist/precommit/run.js");

/**
 * Get staged files from git.
 * @returns {Promise<string[]>} Array of staged file paths
 */
async function getStagedFiles() {
  const { execa } = await import("execa");
  const result = await execa("git", ["diff", "--cached", "--name-only", "--diff-filter=ACMR"]);
  return result.stdout.split("\n").filter(Boolean);
}

/**
 * Run vitest with the given arguments.
 * @param {string[]} args - Vitest CLI arguments
 * @returns {Promise<{exitCode: number, output: string}>} Result
 */
async function runVitest(args) {
  const { execa } = await import("execa");
  try {
    const result = await execa("npx", ["vitest", ...args], {
      stdio: "inherit",
      reject: false,
    });
    return {
      exitCode: result.exitCode ?? 0,
      output: result.stdout ?? "",
    };
  } catch (error) {
    return {
      exitCode: 1,
      output: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Main entry point.
 */
async function main() {
  try {
    let runPrecommitTests;

    if (existsSync(distPath)) {
      // Production mode: use built dist
      const module = await import("../dist/precommit/run.js");
      runPrecommitTests = module.runPrecommitTests;
    } else {
      // Development mode: use tsx to run source directly
      try {
        await import("tsx/esm");
        const module = await import("../src/precommit/run.ts");
        runPrecommitTests = module.runPrecommitTests;
      } catch (err) {
        console.error("tsx not available and dist/precommit/run.js not found:", err);
        console.error("Run \"pnpm run build\" to build the CLI");
        process.exit(1);
      }
    }

    const result = await runPrecommitTests({
      getStagedFiles,
      runVitest,
    });

    process.exit(result.exitCode);
  } catch (error) {
    console.error("Pre-commit hook failed:", error);
    process.exit(1);
  }
}

main();
