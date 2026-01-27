/**
 * Integration tests for advanced session CLI commands (prune/archive).
 *
 * Test Level: 2 (Integration)
 * - Tests CLI command execution through Commander.js
 * - Tests option parsing and stdout output
 * - Tests real filesystem operations
 *
 * Graduated from: specs/.../story-54_cli-integration/tests/
 */

import { execa } from "execa";
import { mkdir, mkdtemp, readdir, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("spx session prune/archive commands", () => {
  let tempDir: string;
  let sessionsDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "spx-session-adv-"));
    sessionsDir = join(tempDir, ".spx", "sessions");
    await mkdir(join(sessionsDir, "todo"), { recursive: true });
    await mkdir(join(sessionsDir, "doing"), { recursive: true });
    await mkdir(join(sessionsDir, "archive"), { recursive: true });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe("prune command", () => {
    it("GIVEN 8 sessions WHEN prune (default) THEN 5 remain", async () => {
      // Create 8 sessions in archive
      for (let i = 1; i <= 8; i++) {
        const sessionId = `2026-01-${String(i).padStart(2, "0")}_10-00-00`;
        await writeFile(
          join(sessionsDir, "archive", `${sessionId}.md`),
          `# Session ${i}`,
        );
      }

      const { exitCode, stdout } = await execa(
        "node",
        ["bin/spx.js", "session", "prune", "--sessions-dir", sessionsDir],
        { cwd: process.cwd() },
      );

      expect(exitCode).toBe(0);
      expect(stdout).toContain("Deleted 3 sessions");

      // Verify 5 remain
      const remaining = await readdir(join(sessionsDir, "archive"));
      expect(remaining).toHaveLength(5);
    });

    it("GIVEN 10 sessions WHEN prune --keep 3 THEN 3 remain", async () => {
      for (let i = 1; i <= 10; i++) {
        const sessionId = `2026-01-${String(i).padStart(2, "0")}_10-00-00`;
        await writeFile(
          join(sessionsDir, "archive", `${sessionId}.md`),
          `# Session ${i}`,
        );
      }

      const { exitCode, stdout } = await execa(
        "node",
        ["bin/spx.js", "session", "prune", "--keep", "3", "--sessions-dir", sessionsDir],
        { cwd: process.cwd() },
      );

      expect(exitCode).toBe(0);
      expect(stdout).toContain("Deleted 7 sessions");

      // Verify 3 remain
      const remaining = await readdir(join(sessionsDir, "archive"));
      expect(remaining).toHaveLength(3);
    });

    it("GIVEN 10 sessions WHEN prune --dry-run THEN shows would-delete", async () => {
      for (let i = 1; i <= 10; i++) {
        const sessionId = `2026-01-${String(i).padStart(2, "0")}_10-00-00`;
        await writeFile(
          join(sessionsDir, "archive", `${sessionId}.md`),
          `# Session ${i}`,
        );
      }

      const { exitCode, stdout } = await execa(
        "node",
        ["bin/spx.js", "session", "prune", "--dry-run", "--sessions-dir", sessionsDir],
        { cwd: process.cwd() },
      );

      expect(exitCode).toBe(0);
      expect(stdout).toContain("Would delete 5 sessions");

      // Verify none were actually deleted
      const remaining = await readdir(join(sessionsDir, "archive"));
      expect(remaining).toHaveLength(10);
    });

    it("GIVEN help flag WHEN prune --help THEN shows usage", async () => {
      const { exitCode, stdout } = await execa(
        "node",
        ["bin/spx.js", "session", "prune", "--help"],
        { cwd: process.cwd() },
      );

      expect(exitCode).toBe(0);
      expect(stdout).toContain("--keep");
      expect(stdout).toContain("--dry-run");
    });

    it("GIVEN invalid --keep value WHEN prune --keep -1 THEN exits non-zero", async () => {
      const result = await execa(
        "node",
        ["bin/spx.js", "session", "prune", "--keep", "-1", "--sessions-dir", sessionsDir],
        { cwd: process.cwd(), reject: false },
      );

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain("Invalid --keep value");
    });

    it("GIVEN invalid --keep value WHEN prune --keep 0 THEN exits non-zero", async () => {
      const result = await execa(
        "node",
        ["bin/spx.js", "session", "prune", "--keep", "0", "--sessions-dir", sessionsDir],
        { cwd: process.cwd(), reject: false },
      );

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain("Invalid --keep value");
    });

    it("GIVEN fewer sessions than keep count WHEN prune THEN no sessions deleted", async () => {
      // Create only 3 sessions in archive
      for (let i = 1; i <= 3; i++) {
        const sessionId = `2026-01-${String(i).padStart(2, "0")}_10-00-00`;
        await writeFile(
          join(sessionsDir, "archive", `${sessionId}.md`),
          `# Session ${i}`,
        );
      }

      const { exitCode, stdout } = await execa(
        "node",
        ["bin/spx.js", "session", "prune", "--sessions-dir", sessionsDir],
        { cwd: process.cwd() },
      );

      expect(exitCode).toBe(0);
      expect(stdout).toContain("No sessions to prune");
      expect(stdout).toContain("3 sessions kept");
    });
  });

  describe("archive command", () => {
    it("GIVEN session in todo WHEN archive THEN moves to archive", async () => {
      const sessionId = "2026-01-15_10-00-00";
      await writeFile(
        join(sessionsDir, "todo", `${sessionId}.md`),
        "# Test Session",
      );

      const { exitCode, stdout } = await execa(
        "node",
        ["bin/spx.js", "session", "archive", sessionId, "--sessions-dir", sessionsDir],
        { cwd: process.cwd() },
      );

      expect(exitCode).toBe(0);
      expect(stdout).toContain("Archived");
      expect(stdout).toContain(sessionId);

      // Verify file moved
      const todoFiles = await readdir(join(sessionsDir, "todo"));
      const archiveFiles = await readdir(join(sessionsDir, "archive"));
      expect(todoFiles).not.toContain(`${sessionId}.md`);
      expect(archiveFiles).toContain(`${sessionId}.md`);
    });

    it("GIVEN session in doing WHEN archive THEN moves to archive", async () => {
      const sessionId = "2026-01-15_10-00-00";
      await writeFile(
        join(sessionsDir, "doing", `${sessionId}.md`),
        "# Test Session",
      );

      const { exitCode, stdout } = await execa(
        "node",
        ["bin/spx.js", "session", "archive", sessionId, "--sessions-dir", sessionsDir],
        { cwd: process.cwd() },
      );

      expect(exitCode).toBe(0);
      expect(stdout).toContain("Archived");

      // Verify file moved
      const doingFiles = await readdir(join(sessionsDir, "doing"));
      const archiveFiles = await readdir(join(sessionsDir, "archive"));
      expect(doingFiles).not.toContain(`${sessionId}.md`);
      expect(archiveFiles).toContain(`${sessionId}.md`);
    });

    it("GIVEN non-existent session WHEN archive THEN shows error", async () => {
      const result = await execa(
        "node",
        ["bin/spx.js", "session", "archive", "nonexistent", "--sessions-dir", sessionsDir],
        { cwd: process.cwd(), reject: false },
      );

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain("not found");
    });

    it("GIVEN session already in archive WHEN archive THEN shows error", async () => {
      const sessionId = "2026-01-15_10-00-00";
      await writeFile(
        join(sessionsDir, "archive", `${sessionId}.md`),
        "# Already Archived",
      );

      const result = await execa(
        "node",
        ["bin/spx.js", "session", "archive", sessionId, "--sessions-dir", sessionsDir],
        { cwd: process.cwd(), reject: false },
      );

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain("already archived");
    });

    it("GIVEN archive directory missing WHEN archive THEN creates directory and archives (FR2)", async () => {
      // Setup: Create fresh temp dir with only todo/doing (NO archive directory)
      const noArchiveTempDir = await mkdtemp(join(tmpdir(), "spx-no-archive-"));
      const noArchiveSessionsDir = join(noArchiveTempDir, ".spx", "sessions");
      await mkdir(join(noArchiveSessionsDir, "todo"), { recursive: true });
      await mkdir(join(noArchiveSessionsDir, "doing"), { recursive: true });
      // Intentionally NOT creating archive directory

      try {
        const sessionId = "2026-01-15_10-00-00";
        await writeFile(
          join(noArchiveSessionsDir, "todo", `${sessionId}.md`),
          "# Test Session",
        );

        const { exitCode, stdout } = await execa(
          "node",
          ["bin/spx.js", "session", "archive", sessionId, "--sessions-dir", noArchiveSessionsDir],
          { cwd: process.cwd() },
        );

        expect(exitCode).toBe(0);
        expect(stdout).toContain("Archived");

        // Verify archive directory was created and file moved
        const archiveFiles = await readdir(join(noArchiveSessionsDir, "archive"));
        expect(archiveFiles).toContain(`${sessionId}.md`);
      } finally {
        await rm(noArchiveTempDir, { recursive: true, force: true });
      }
    });
  });
});
