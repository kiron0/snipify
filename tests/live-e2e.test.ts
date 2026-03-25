import { execFile as execFileCallback } from "child_process";
import { mkdtemp, readdir, rm, stat } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { fileURLToPath } from "url";
import { promisify } from "util";
import { describe, expect, it } from "vitest";

const execFile = promisify(execFileCallback);
const rootDir = fileURLToPath(new URL("../", import.meta.url));
const liveE2EEnabled = process.env.SNIPIFY_RUN_LIVE_E2E === "1";
const targetUrl = process.env.SNIPIFY_LIVE_E2E_URL ?? "https://example.com";
const liveDescribe = liveE2EEnabled ? describe : describe.skip;

liveDescribe("live screenshot e2e", () => {
  it(
    "captures a real screenshot with the built CLI",
    async () => {
      const outputDir = await mkdtemp(join(tmpdir(), "snipify-live-e2e-"));

      try {
        await execFile(
          process.execPath,
          ["dist/index.js", targetUrl, "--format=jpeg", `--output=${outputDir}`],
          {
            cwd: rootDir,
          },
        );

        const files = await readdir(outputDir);
        const screenshot = files.find((file) => file.endsWith(".jpeg"));

        expect(screenshot).toBeDefined();

        const screenshotStat = await stat(join(outputDir, screenshot!));
        expect(screenshotStat.size).toBeGreaterThan(0);
      } finally {
        await rm(outputDir, { recursive: true, force: true });
      }
    },
    180000,
  );
});
