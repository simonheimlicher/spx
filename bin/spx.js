#!/usr/bin/env node

// CLI entry point
import('../dist/cli.js').catch((err) => {
  console.error('Failed to load CLI:', err);
  process.exit(1);
});
