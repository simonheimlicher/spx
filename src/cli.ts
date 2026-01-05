/**
 * CLI entry point for spx
 */
import { Command } from "commander";
import { statusCommand, type OutputFormat } from "./commands/status.js";
import { nextCommand } from "./commands/next.js";

const program = new Command();

program
  .name("spx")
  .description("Fast, deterministic CLI tool for spec workflow management")
  .version("0.1.0");

program
  .command("status")
  .description("Get project status")
  .option("--json", "Output as JSON")
  .option("--format <format>", "Output format (text|json|markdown|table)")
  .action(async (options: { json?: boolean; format?: string }) => {
    try {
      // Determine format: --json flag overrides --format option
      let format: OutputFormat = "text";
      if (options.json) {
        format = "json";
      } else if (options.format) {
        // Validate format option
        const validFormats = ["text", "json", "markdown", "table"];
        if (validFormats.includes(options.format)) {
          format = options.format as OutputFormat;
        } else {
          console.error(
            `Error: Invalid format "${options.format}". Must be one of: ${validFormats.join(", ")}`
          );
          process.exit(1);
        }
      }

      const output = await statusCommand({ cwd: process.cwd(), format });
      console.log(output);
    } catch (error) {
      console.error(
        "Error:",
        error instanceof Error ? error.message : String(error)
      );
      process.exit(1);
    }
  });

program
  .command("next")
  .description("Find next work item to work on")
  .action(async () => {
    try {
      const output = await nextCommand({ cwd: process.cwd() });
      console.log(output);
    } catch (error) {
      console.error(
        "Error:",
        error instanceof Error ? error.message : String(error)
      );
      process.exit(1);
    }
  });

program.parse();
