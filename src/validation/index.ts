/**
 * Validation module for spx CLI.
 *
 * Provides validation infrastructure for TypeScript projects including:
 * - Tool discovery (eslint, tsc, madge)
 * - Validation steps (circular, eslint, typescript, knip)
 * - Scope resolution from tsconfig
 * - Graceful degradation
 *
 * @module validation
 */

// Types
export * from "./types.js";

// Configuration
export * from "./config/index.js";

// Tool discovery
export * from "./discovery/index.js";

// Validation steps
export * from "./steps/index.js";
