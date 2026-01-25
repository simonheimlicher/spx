#!/usr/bin/env node

// CLI entry point
// Use tsx for development when dist/cli.js doesn't exist
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distPath = join(__dirname, "../dist/cli.js");

if (existsSync(distPath)) {
  try {
    await import("../dist/cli.js");
  } catch (err) {
    console.error("Failed to load CLI:", err);
    process.exit(1);
  }
} else {
  // Development mode: use tsx to run source directly
  try {
    await import("tsx/esm");
    await import("../src/cli.ts");
  } catch (err) {
    console.error("tsx not available and dist/cli.js not found:", err);
    console.error("Run \"pnpm run build\" to build the CLI");
    process.exit(1);
  }
}
