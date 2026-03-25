#!/usr/bin/env node

import { realpathSync } from "fs";
import { join } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import type { DevicePresetKey, ScreenshotOptions } from "../interface";
import {
  captureProductionScreenshots,
  captureScreenshot,
  generateFilename,
} from "../lib";
import {
  DEVICE_PRESETS,
  PRODUCTION_SIZE_KEYS,
  PRODUCTION_SIZES,
} from "../utils";

type ProductionSizeKey = keyof typeof PRODUCTION_SIZES;
type ScreenshotFormat = NonNullable<ScreenshotOptions["format"]>;

type ParsedCliArgs =
  | {
      help: true;
    }
  | {
      help: false;
      url: string;
      device: DevicePresetKey;
      sizePreset?: ProductionSizeKey;
      isProduction: boolean;
      outputDir: string;
      format: ScreenshotFormat;
      quality: number;
      fullPage: boolean;
      delay: number;
      waitForSelector?: string;
      blockResources: boolean;
    };

type CliLogger = Pick<Console, "error" | "log">;

export interface CliDependencies {
  captureProductionScreenshots: typeof captureProductionScreenshots;
  captureScreenshot: typeof captureScreenshot;
  generateFilename: typeof generateFilename;
  cwd: () => string;
  logger: CliLogger;
}

const DEFAULT_DEVICE: DevicePresetKey = "mobile";
const DEFAULT_URL = "http://example.com/";
const DEFAULT_FORMAT: ScreenshotFormat = "png";
const DEFAULT_QUALITY = 90;
const DEFAULT_DELAY = 1000;
const DEFAULT_PRODUCTION_SIZES: ProductionSizeKey[] = [...PRODUCTION_SIZE_KEYS];

const defaultCliDependencies: CliDependencies = {
  captureProductionScreenshots,
  captureScreenshot,
  generateFilename,
  cwd: () => process.cwd(),
  logger: console,
};

function isDevicePresetKey(value: string): value is DevicePresetKey {
  return value in DEVICE_PRESETS;
}

function isProductionSizeKey(value: string): value is ProductionSizeKey {
  return value in PRODUCTION_SIZES;
}

function isScreenshotFormat(value: string): value is ScreenshotFormat {
  return value === "png" || value === "jpeg";
}

function getOptionValue(args: string[], prefix: string) {
  return args.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

function parseIntegerOption(
  value: string | undefined,
  optionName: string,
  {
    min,
    max,
  }: {
    min?: number;
    max?: number;
  } = {},
) {
  if (value === undefined) {
    return undefined;
  }

  if (!/^-?\d+$/.test(value)) {
    throw new Error(`${optionName} must be an integer.`);
  }

  const parsed = Number(value);

  if (min !== undefined && parsed < min) {
    throw new Error(`${optionName} must be at least ${min}.`);
  }

  if (max !== undefined && parsed > max) {
    throw new Error(`${optionName} must be at most ${max}.`);
  }

  return parsed;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function getOutputPath(outputDir: string, filename: string) {
  return join(outputDir, filename);
}

function createBaseOptions(
  parsed: Extract<ParsedCliArgs, { help: false }>,
  outputPath: string,
): ScreenshotOptions {
  return {
    outputPath,
    format: parsed.format,
    quality: parsed.quality,
    fullPage: parsed.fullPage,
    delay: parsed.delay,
    waitForSelector: parsed.waitForSelector,
    blockResources: parsed.blockResources,
  };
}

export function getHelpText() {
  return `
Usage: snipify [URL] [OPTIONS]

Arguments:
  URL                Website URL (default: ${DEFAULT_URL})

Options:
  --device=DEVICE   Device preset: desktop, laptop, tablet, mobile, mobile-large (default: ${DEFAULT_DEVICE})
  --size=SIZE       Production size preset: thumbnail, card, social-media, etc.
  --production      Generate all production sizes
  --output=DIR      Output directory (default: ./screenshots)
  --format=FORMAT   Image format: png, jpeg (default: ${DEFAULT_FORMAT})
  --quality=VALUE   JPEG quality from 0 to 100 (default: ${DEFAULT_QUALITY})
  --delay=MS        Wait time before capture in milliseconds (default: ${DEFAULT_DELAY})
  --wait-for-selector=SELECTOR
                    Wait for a CSS selector before capture
  --block-resources Block media, analytics, tracking, and websocket requests
  --viewport        Capture only the current viewport instead of the full page
  --help, -h        Show this help

Examples:
  snipify                                                    # Basic mobile screenshot
  snipify https://example.com --device=desktop               # Desktop screenshot
  snipify https://example.com --device=mobile --size=thumbnail    # Mobile thumbnail
  snipify https://example.com --viewport --format=jpeg --quality=80
  snipify https://example.com --device=desktop --production       # All production sizes

Production sizes available: ${Object.keys(PRODUCTION_SIZES).join(", ")}
`.trim();
}

export function parseCliArgs(
  args: string[],
  cwd: () => string = () => process.cwd(),
): ParsedCliArgs {
  if (args.includes("--help") || args.includes("-h")) {
    return { help: true };
  }

  const url = args.find((arg) => !arg.startsWith("-")) ?? DEFAULT_URL;
  const deviceValue = getOptionValue(args, "--device=") ?? DEFAULT_DEVICE;
  const sizeValue = getOptionValue(args, "--size=");
  const outputDir =
    getOptionValue(args, "--output=") ?? join(cwd(), "screenshots");
  const formatValue = getOptionValue(args, "--format=") ?? DEFAULT_FORMAT;
  const quality =
    parseIntegerOption(getOptionValue(args, "--quality="), "--quality", {
      min: 0,
      max: 100,
    }) ?? DEFAULT_QUALITY;
  const delay =
    parseIntegerOption(getOptionValue(args, "--delay="), "--delay", {
      min: 0,
    }) ?? DEFAULT_DELAY;
  const waitForSelector = getOptionValue(args, "--wait-for-selector=");

  if (!isDevicePresetKey(deviceValue)) {
    throw new Error(
      `Unknown device preset: ${deviceValue}. Available: ${Object.keys(DEVICE_PRESETS).join(", ")}`,
    );
  }

  if (!isScreenshotFormat(formatValue)) {
    throw new Error(
      `Unknown format: ${formatValue}. Available: png, jpeg`,
    );
  }

  if (sizeValue && !isProductionSizeKey(sizeValue)) {
    throw new Error(
      `Unknown size preset: ${sizeValue}. Available: ${Object.keys(PRODUCTION_SIZES).join(", ")}`,
    );
  }

  if (waitForSelector === "") {
    throw new Error("--wait-for-selector must not be empty.");
  }

  const sizePreset =
    sizeValue && isProductionSizeKey(sizeValue) ? sizeValue : undefined;

  return {
    help: false,
    url,
    device: deviceValue,
    sizePreset,
    isProduction: args.includes("--production"),
    outputDir,
    format: formatValue,
    quality,
    fullPage: !args.includes("--viewport"),
    delay,
    waitForSelector: waitForSelector || undefined,
    blockResources: args.includes("--block-resources"),
  };
}

export async function runCli(
  args: string[],
  dependencies: CliDependencies = defaultCliDependencies,
) {
  const { logger } = dependencies;

  try {
    const parsed = parseCliArgs(args, dependencies.cwd);

    if (parsed.help) {
      logger.log(getHelpText());
      return 0;
    }

    logger.log(`Capturing screenshot of: ${parsed.url}`);
    logger.log(`Device preset: ${parsed.device}`);

    if (parsed.isProduction) {
      logger.log("Mode: Production (multiple sizes)");

      const results = await dependencies.captureProductionScreenshots({
        url: parsed.url,
        device: parsed.device,
        sizes: DEFAULT_PRODUCTION_SIZES,
        options: {
          outputDir: parsed.outputDir,
          format: parsed.format,
          quality: parsed.quality,
          delay: parsed.delay,
          waitForSelector: parsed.waitForSelector,
          blockResources: parsed.blockResources,
        },
      });

      logger.log("");
      logger.log("Production screenshots captured successfully!");
      logger.log(`Total files: ${results.length}`);
      logger.log(`Saved to: ${parsed.outputDir}`);

      return 0;
    }

    if (parsed.sizePreset) {
      logger.log(`Mode: Production size (${parsed.sizePreset})`);

      const size = PRODUCTION_SIZES[parsed.sizePreset];
      const filename = await dependencies.generateFilename(
        parsed.url,
        parsed.device,
        parsed.format,
        parsed.sizePreset,
      );
      const outputPath = getOutputPath(parsed.outputDir, filename);
      const screenshot = await dependencies.captureScreenshot({
        url: parsed.url,
        device: parsed.device,
        options: {
          ...createBaseOptions(parsed, outputPath),
          fixedSize: size,
        },
      });

      logger.log("Screenshot captured successfully!");
      logger.log(`Size: ${size.width}x${size.height} (${parsed.sizePreset})`);
      logger.log(`File size: ${(screenshot.length / 1024).toFixed(2)} KB`);
      logger.log(`Saved to: ${outputPath}`);

      return 0;
    }

    logger.log("Mode: Full page screenshot");

    const filename = await dependencies.generateFilename(
      parsed.url,
      parsed.device,
      parsed.format,
    );
    const outputPath = getOutputPath(parsed.outputDir, filename);
    const screenshot = await dependencies.captureScreenshot({
      url: parsed.url,
      device: parsed.device,
      options: createBaseOptions(parsed, outputPath),
    });

    logger.log("Screenshot captured successfully!");
    logger.log(`File size: ${(screenshot.length / 1024).toFixed(2)} KB`);
    logger.log(`Saved to: ${outputPath}`);

    return 0;
  } catch (error) {
    logger.error(`Error: ${getErrorMessage(error)}`);
    return 1;
  }
}

export async function main(
  args: string[] = process.argv.slice(2),
  dependencies: CliDependencies = defaultCliDependencies,
) {
  const exitCode = await runCli(args, dependencies);

  if (exitCode !== 0) {
    process.exit(exitCode);
  }
}

export function isCliEntrypoint(
  argv: string[] = process.argv,
  moduleUrl: string = import.meta.url,
) {
  const entryPath = argv[1];

  if (!entryPath) {
    return false;
  }

  try {
    return (
      pathToFileURL(realpathSync(entryPath)).href ===
      pathToFileURL(realpathSync(fileURLToPath(moduleUrl))).href
    );
  } catch {
    return moduleUrl === pathToFileURL(entryPath).href;
  }
}

if (isCliEntrypoint()) {
  void main();
}
