/**
 * CLI entry point for spx
 */
import { Command } from "commander";
import { claudeDomain } from "./domains/claude/index.js";
import { sessionDomain } from "./domains/session/index.js";
import { specDomain } from "./domains/spec/index.js";

const program = new Command();

program
  .name("spx")
  .description("Fast, deterministic CLI tool for spec workflow management")
  .version("0.2.0");

// Register domains
claudeDomain.register(program);
sessionDomain.register(program);
specDomain.register(program);

program.parse();
