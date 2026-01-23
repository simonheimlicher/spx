/**
 * Constants for tool discovery.
 * @module validation/discovery/constants
 */

/**
 * Tool discovery constants.
 * Using constants ensures DRY principle and makes tests verify behavior via constants.
 */
export const TOOL_DISCOVERY = {
  /** Tool source identifiers */
  SOURCES: {
    /** Tool bundled with spx-cli */
    BUNDLED: "bundled",
    /** Tool in project's node_modules */
    PROJECT: "project",
    /** Tool in system PATH */
    GLOBAL: "global",
  } as const,

  /** Message templates */
  MESSAGES: {
    /** Prefix for skip messages */
    SKIP_PREFIX: "\u23ED", // ⏭ emoji
    /**
     * Format not found reason message.
     * @param tool - The tool name that was not found
     */
    NOT_FOUND_REASON: (tool: string): string =>
      `${tool} not found in bundled deps, project node_modules, or system PATH`,
    /**
     * Format skip message for graceful degradation.
     * @param step - The validation step name
     * @param tool - The tool that was not found
     */
    SKIP_FORMAT: (step: string, tool: string): string =>
      `${TOOL_DISCOVERY.MESSAGES.SKIP_PREFIX} Skipping ${step} (${tool} not available)`,
  },
} as const;

/** Type for tool source */
export type ToolSource = (typeof TOOL_DISCOVERY.SOURCES)[keyof typeof TOOL_DISCOVERY.SOURCES];
