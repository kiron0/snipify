import { execFile as execFileCallback } from "child_process";
import { mkdtemp, rm, unlink, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { fileURLToPath } from "url";
import { promisify } from "util";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const execFile = promisify(execFileCallback);
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const rootDir = fileURLToPath(new URL("../", import.meta.url));
const npmCacheDir = join(tmpdir(), "snipify-npm-cache");

let tarballPath: string | undefined;
let installDir: string | undefined;

describe("packed tarball", () => {
  beforeAll(async () => {
    await execFile(npmCommand, ["run", "build"], {
      cwd: rootDir,
    });

    const { stdout } = await execFile(
      npmCommand,
      ["pack", "--cache", npmCacheDir],
      {
        cwd: rootDir,
      },
    );

    const tarballName = stdout.trim().split(/\s+/).at(-1);

    if (!tarballName) {
      throw new Error("Failed to determine tarball filename from npm pack.");
    }

    tarballPath = join(rootDir, tarballName);
    installDir = await mkdtemp(join(tmpdir(), "snipify-pack-test-"));

    await writeFile(
      join(installDir, "package.json"),
      JSON.stringify({ name: "snipify-pack-test", private: true }, null, 2),
    );

    await execFile(
      npmCommand,
      ["install", tarballPath, "--cache", npmCacheDir],
      {
        cwd: installDir,
      },
    );
  }, 240000);

  afterAll(async () => {
    if (installDir) {
      await rm(installDir, { recursive: true, force: true });
    }

    if (tarballPath) {
      await unlink(tarballPath).catch(() => undefined);
    }
  });

  it(
    "executes the installed bin from the tarball",
    async () => {
      if (!installDir) {
        throw new Error("Install directory was not prepared.");
      }

      const binPath = join(installDir, "node_modules", ".bin", "snipify");
      const { stdout } = await execFile(binPath, ["--help"], {
        cwd: installDir,
      });

      expect(stdout).toContain("Usage: snipify [URL] [OPTIONS]");
      expect(stdout).toContain("--format=FORMAT");
    },
    120000,
  );
});
