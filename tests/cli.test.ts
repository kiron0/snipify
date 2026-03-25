import {
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getHelpText,
  isCliEntrypoint,
  main,
  parseCliArgs,
  runCli,
  type CliDependencies,
} from "../src/cli";
import { generateFilename } from "../src/lib";
import { PRODUCTION_SIZE_KEYS } from "../src/utils";

function createDependencies(overrides: Partial<CliDependencies> = {}) {
  const logger = {
    log: vi.fn(),
    error: vi.fn(),
  };

  const dependencies: CliDependencies = {
    captureProductionScreenshots: vi.fn(async () => []),
    captureScreenshot: vi.fn(async () => Buffer.alloc(2048)),
    generateFilename: vi.fn(async () => "capture.png"),
    cwd: () => "/tmp/project",
    logger,
    ...overrides,
  };

  return { dependencies, logger };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("parseCliArgs", () => {
  it("uses the CLI defaults", () => {
    expect(parseCliArgs([], () => "/workspace")).toEqual({
      help: false,
      url: "http://example.com/",
      device: "mobile",
      sizePreset: undefined,
      isProduction: false,
      outputDir: "/workspace/screenshots",
      format: "png",
      quality: 90,
      fullPage: true,
      delay: 1000,
      waitForSelector: undefined,
      blockResources: false,
    });
  });

  it("supports the short help flag", () => {
    expect(parseCliArgs(["-h"])).toEqual({ help: true });
  });

  it("parses all supported options together", () => {
    expect(
      parseCliArgs(
        [
          "https://example.com",
          "--device=desktop",
          "--size=thumbnail",
          "--production",
          "--output=custom-shots",
          "--format=jpeg",
          "--quality=80",
          "--delay=250",
          "--wait-for-selector=.ready",
          "--block-resources",
          "--viewport",
        ],
        () => "/workspace",
      ),
    ).toEqual({
      help: false,
      url: "https://example.com",
      device: "desktop",
      sizePreset: "thumbnail",
      isProduction: true,
      outputDir: "custom-shots",
      format: "jpeg",
      quality: 80,
      fullPage: false,
      delay: 250,
      waitForSelector: ".ready",
      blockResources: true,
    });
  });

  it("uses the first positional argument as the URL", () => {
    expect(
      parseCliArgs(["https://example.com", "https://ignored.example"], () => {
        return "/workspace";
      }),
    ).toMatchObject({
      url: "https://example.com",
    });
  });

  it("rejects unsupported devices", () => {
    expect(() => parseCliArgs(["--device=watch"])).toThrow(
      "Unknown device preset: watch",
    );
  });

  it("rejects unsupported size presets", () => {
    expect(() => parseCliArgs(["--size=poster"])).toThrow(
      "Unknown size preset: poster",
    );
  });

  it("rejects unsupported formats", () => {
    expect(() => parseCliArgs(["--format=webp"])).toThrow(
      "Unknown format: webp. Available: png, jpeg",
    );
  });

  it("rejects invalid quality values", () => {
    expect(() => parseCliArgs(["--quality=high"])).toThrow(
      "--quality must be an integer.",
    );
    expect(() => parseCliArgs(["--quality=120"])).toThrow(
      "--quality must be at most 100.",
    );
  });

  it("rejects invalid delay values", () => {
    expect(() => parseCliArgs(["--delay=soon"])).toThrow(
      "--delay must be an integer.",
    );
    expect(() => parseCliArgs(["--delay=-1"])).toThrow(
      "--delay must be at least 0.",
    );
  });

  it("rejects an empty wait selector", () => {
    expect(() => parseCliArgs(["--wait-for-selector="])).toThrow(
      "--wait-for-selector must not be empty.",
    );
  });
});

describe("getHelpText", () => {
  it("includes the core usage and advanced options", () => {
    const helpText = getHelpText();

    expect(helpText).toContain("Usage: snipify [URL] [OPTIONS]");
    expect(helpText).toContain("--format=FORMAT");
    expect(helpText).toContain("--wait-for-selector=SELECTOR");
    expect(helpText).toContain("--viewport");
    expect(helpText).toContain("JPEG quality from 0 to 100");
    expect(helpText).toContain("Production sizes available:");
  });
});

describe("runCli", () => {
  it("prints help without invoking screenshot work", async () => {
    const { dependencies, logger } = createDependencies();

    await expect(runCli(["--help"], dependencies)).resolves.toBe(0);

    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining("Usage: snipify [URL] [OPTIONS]"),
    );
    expect(dependencies.captureScreenshot).not.toHaveBeenCalled();
    expect(dependencies.captureProductionScreenshots).not.toHaveBeenCalled();
  });

  it("runs the production workflow with all production presets and advanced options", async () => {
    const { dependencies, logger } = createDependencies({
      captureProductionScreenshots: vi.fn(async () => [{}, {}, {}]),
    });

    await expect(
      runCli(
        [
          "https://example.com",
          "--device=desktop",
          "--production",
          "--output=custom-shots",
          "--format=jpeg",
          "--quality=80",
          "--delay=250",
          "--wait-for-selector=.ready",
          "--block-resources",
        ],
        dependencies,
      ),
    ).resolves.toBe(0);

    expect(dependencies.captureProductionScreenshots).toHaveBeenCalledWith({
      url: "https://example.com",
      device: "desktop",
      sizes: PRODUCTION_SIZE_KEYS,
      options: {
        outputDir: "custom-shots",
        format: "jpeg",
        quality: 80,
        delay: 250,
        waitForSelector: ".ready",
        blockResources: true,
      },
    });
    expect(dependencies.captureScreenshot).not.toHaveBeenCalled();
    expect(logger.log).toHaveBeenCalledWith(
      "Mode: Production (multiple sizes)",
    );
    expect(logger.log).toHaveBeenCalledWith("Total files: 3");
    expect(logger.log).toHaveBeenCalledWith("Saved to: custom-shots");
  });

  it("runs the fixed-size screenshot workflow with CLI options", async () => {
    const { dependencies, logger } = createDependencies();

    await expect(
      runCli(
        [
          "https://example.com",
          "--device=tablet",
          "--size=thumbnail",
          "--output=snaps",
          "--format=jpeg",
          "--quality=75",
          "--delay=250",
          "--wait-for-selector=.card",
          "--block-resources",
          "--viewport",
        ],
        dependencies,
      ),
    ).resolves.toBe(0);

    expect(dependencies.generateFilename).toHaveBeenCalledWith(
      "https://example.com",
      "tablet",
      "jpeg",
      "thumbnail",
    );
    expect(dependencies.captureScreenshot).toHaveBeenCalledWith({
      url: "https://example.com",
      device: "tablet",
      options: {
        outputPath: "snaps/capture.png",
        format: "jpeg",
        quality: 75,
        fullPage: false,
        delay: 250,
        waitForSelector: ".card",
        blockResources: true,
        fixedSize: { width: 300, height: 200 },
      },
    });
    expect(logger.log).toHaveBeenCalledWith(
      "Mode: Production size (thumbnail)",
    );
    expect(logger.log).toHaveBeenCalledWith("Size: 300x200 (thumbnail)");
    expect(logger.log).toHaveBeenCalledWith("File size: 2.00 KB");
    expect(logger.log).toHaveBeenCalledWith("Saved to: snaps/capture.png");
  });

  it("runs the default full-page screenshot workflow", async () => {
    const { dependencies, logger } = createDependencies();

    await expect(runCli(["https://example.com"], dependencies)).resolves.toBe(
      0,
    );

    expect(dependencies.generateFilename).toHaveBeenCalledWith(
      "https://example.com",
      "mobile",
      "png",
    );
    expect(dependencies.captureScreenshot).toHaveBeenCalledWith({
      url: "https://example.com",
      device: "mobile",
      options: {
        outputPath: "/tmp/project/screenshots/capture.png",
        format: "png",
        quality: 90,
        fullPage: true,
        delay: 1000,
        waitForSelector: undefined,
        blockResources: false,
      },
    });
    expect(logger.log).toHaveBeenCalledWith("Mode: Full page screenshot");
    expect(logger.log).toHaveBeenCalledWith(
      "Saved to: /tmp/project/screenshots/capture.png",
    );
  });

  it("prefers production mode when both production and size are provided", async () => {
    const { dependencies } = createDependencies();

    await expect(
      runCli(
        ["https://example.com", "--production", "--size=thumbnail"],
        dependencies,
      ),
    ).resolves.toBe(0);

    expect(dependencies.captureProductionScreenshots).toHaveBeenCalledOnce();
    expect(dependencies.captureScreenshot).not.toHaveBeenCalled();
  });

  it("passes viewport mode through to production captures", async () => {
    const { dependencies } = createDependencies();

    await expect(
      runCli(
        ["https://example.com", "--production", "--viewport"],
        dependencies,
      ),
    ).resolves.toBe(0);

    expect(dependencies.captureProductionScreenshots).toHaveBeenCalledWith({
      url: "https://example.com",
      device: "mobile",
      sizes: PRODUCTION_SIZE_KEYS,
      options: {
        outputDir: "/tmp/project/screenshots",
        format: "png",
        quality: 90,
        delay: 1000,
        waitForSelector: undefined,
        blockResources: false,
      },
    });
  });

  it("returns a failing exit code for argument parsing errors", async () => {
    const { dependencies, logger } = createDependencies();

    await expect(runCli(["--device=watch"], dependencies)).resolves.toBe(1);

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining("Unknown device preset: watch"),
    );
    expect(dependencies.captureScreenshot).not.toHaveBeenCalled();
    expect(dependencies.captureProductionScreenshots).not.toHaveBeenCalled();
  });

  it("returns a failing exit code when screenshot capture fails", async () => {
    const { dependencies, logger } = createDependencies({
      captureScreenshot: vi.fn(async () => {
        throw new Error("capture failed");
      }),
    });

    await expect(runCli(["https://example.com"], dependencies)).resolves.toBe(
      1,
    );

    expect(logger.error).toHaveBeenCalledWith("Error: capture failed");
  });

  it("returns a failing exit code when production capture fails", async () => {
    const { dependencies, logger } = createDependencies({
      captureProductionScreenshots: vi.fn(async () => {
        throw new Error("production failed");
      }),
    });

    await expect(runCli(["--production"], dependencies)).resolves.toBe(1);

    expect(logger.error).toHaveBeenCalledWith("Error: production failed");
  });

  it("returns a failing exit code when filename generation fails", async () => {
    const { dependencies, logger } = createDependencies({
      generateFilename: vi.fn(async () => {
        throw new Error("filename failed");
      }),
    });

    await expect(runCli(["https://example.com"], dependencies)).resolves.toBe(
      1,
    );

    expect(logger.error).toHaveBeenCalledWith("Error: filename failed");
  });
});

describe("main", () => {
  it("does not exit on success", async () => {
    const { dependencies } = createDependencies();
    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation(((code?: string | number | null) => {
        throw new Error(`unexpected exit: ${code}`);
      }) as never);

    await expect(main(["--help"], dependencies)).resolves.toBeUndefined();

    expect(exitSpy).not.toHaveBeenCalled();
  });

  it("exits with the failing status code", async () => {
    const { dependencies } = createDependencies({
      captureScreenshot: vi.fn(async () => {
        throw new Error("capture failed");
      }),
    });
    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation(((code?: string | number | null) => {
        throw new Error(`process.exit:${code}`);
      }) as never);

    await expect(main(["https://example.com"], dependencies)).rejects.toThrow(
      "process.exit:1",
    );

    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});

describe("isCliEntrypoint", () => {
  it("returns false when there is no executable path", () => {
    expect(isCliEntrypoint(["node"])).toBe(false);
  });

  it("returns false for a different script path", () => {
    expect(isCliEntrypoint(["node", "/tmp/other-script.mjs"])).toBe(false);
  });

  it("returns true for the current module path", () => {
    const moduleUrl = "file:///tmp/snipify-cli.mjs";

    expect(isCliEntrypoint(["node", "/tmp/snipify-cli.mjs"], moduleUrl)).toBe(
      true,
    );
  });

  it("returns true when the entry path is a symlink to the module", () => {
    const tempDir = mkdtempSync("/tmp/snipify-cli-test-");
    const realPath = `${tempDir}/real-cli.mjs`;
    const symlinkPath = `${tempDir}/symlinked-cli.mjs`;

    try {
      writeFileSync(realPath, "");
      symlinkSync(realPath, symlinkPath);

      expect(
        isCliEntrypoint(["node", symlinkPath], `file://${realPath}`),
      ).toBe(true);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

describe("generateFilename", () => {
  it("includes the full timestamp to avoid same-day collisions", async () => {
    const date = new Date("2026-03-25T12:34:56.789Z");

    vi.useFakeTimers();
    vi.setSystemTime(date);

    await expect(
      generateFilename("https://example.com", "desktop", "png", "thumbnail"),
    ).resolves.toBe(
      "screenshot-example-com-desktop-thumbnail-2026-03-25T12-34-56-789Z.png",
    );
  });
});
