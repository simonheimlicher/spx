/**
 * Validation module for spx CLI.
 *
 * Provides validation infrastructure for TypeScript projects including:
 * - Tool discovery (eslint, tsc, madge)
 * - Validation steps
 * - Graceful degradation
 *
 * @module validation
 */

export * from "./discovery/index.js";
