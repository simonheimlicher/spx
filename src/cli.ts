/**
 * CLI entry point for spx
 */
import { Command } from "commander";

const program = new Command();

program
  .name("spx")
  .description("Fast, deterministic CLI tool for spec workflow management")
  .version("0.1.0");

program
  .command("status")
  .description("Get project status")
  .option("--json", "Output as JSON")
  .action(() => {
    console.log("Status command - not yet implemented");
  });

program.parse();
