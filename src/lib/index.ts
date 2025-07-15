import { mkdir, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { launch, Page } from "puppeteer";
import sharp from "sharp";
import { fileURLToPath } from "url";
import { DevicePresetKey, ScreenshotOptions } from "../interface";
import { DEVICE_PRESETS, PRODUCTION_SIZES } from "../utils";

const __dirname = dirname(fileURLToPath(import.meta.url));

function normalizeScreenshotOptions(options: ScreenshotOptions = {}) {
  const {
    outputPath,
    format = "png",
    quality = 90,
    fullPage = true,
    waitForSelector,
    delay = 0,
    headless = true,
    blockResources = false,
    clip = null,
    fixedSize = null,
  } = options;

  return {
    outputPath,
    format,
    quality,
    fullPage,
    waitForSelector,
    delay,
    headless,
    blockResources,
    clip,
    fixedSize,
  };
}

export async function captureScreenshot({
  url,
  device = "desktop",
  options = {},
}: {
  url: string;
  device?: DevicePresetKey;
  options?: ScreenshotOptions;
}) {
  const {
    outputPath,
    format,
    quality,
    fullPage,
    waitForSelector,
    delay,
    headless,
    blockResources,
    clip,
    fixedSize,
  } = normalizeScreenshotOptions(options);

  if (!DEVICE_PRESETS[device]) {
    throw new Error(
      `Unknown device preset: ${device}. Available: ${Object.keys(DEVICE_PRESETS).join(", ")}`,
    );
  }

  const browser = await launch({
    headless,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-web-security",
      "--disable-features=VizDisplayCompositor",
    ],
  });

  let page: Page | null = null;

  try {
    page = await browser.newPage();

    const { viewport, userAgent } = DEVICE_PRESETS[device];

    await page.setViewport(viewport);
    await page.setUserAgent(userAgent);

    if (blockResources) {
      await page.setRequestInterception(true);
      page.on("request", (req) => {
        try {
          const resourceType = req.resourceType();
          const url = req.url();
          if (
            resourceType === "media" ||
            (resourceType === "image" &&
              (url.includes(".mp4") || url.includes(".webm"))) ||
            resourceType === "websocket" ||
            url.includes("analytics") ||
            url.includes("tracking")
          ) {
            req.abort();
          } else {
            req.continue();
          }
        } catch {
          req.continue();
        }
      });
    }

    await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });

    if (waitForSelector) {
      await page.waitForSelector(waitForSelector, { timeout: 10000 });
    }

    if (delay > 0) await new Promise((res) => setTimeout(res, delay));

    const screenshotOptions = {
      fullPage: clip ? false : fullPage,
      type: format,
      ...(format === "jpeg" && { quality }),
      ...(clip && { clip }),
    };

    let screenshotBuffer = await page.screenshot(screenshotOptions);

    if (fixedSize) {
      screenshotBuffer = await resizeImage(
        Buffer.from(screenshotBuffer),
        fixedSize,
        format,
        quality,
      );
    }

    if (outputPath) {
      await saveScreenshot(Buffer.from(screenshotBuffer), outputPath);
      console.log(`Screenshot saved to: ${outputPath}`);
    }

    return screenshotBuffer;
  } finally {
    if (page) await page.close();
    await browser.close();
  }
}

export async function captureProductionScreenshots({
  url,
  device = "desktop",
  sizes = ["thumbnail", "card", "social-media"],
  options = {},
}: {
  url: string;
  device?: DevicePresetKey;
  sizes?: (keyof typeof PRODUCTION_SIZES)[];
  options?: ScreenshotOptions;
}) {
  const {
    outputDir = join(__dirname, "screenshots"),
    format = "png",
    quality = 90,
  } = options;

  console.log(`Capturing production screenshots for: ${url}`);
  console.log(`Sizes: ${sizes.join(", ")}`);

  const results = [];

  const baseScreenshot = await captureScreenshot({
    url,
    device,
    options: {
      ...options,
      outputPath: undefined,
      fullPage: true,
    },
  });

  for (const sizeKey of sizes) {
    try {
      const size = PRODUCTION_SIZES[sizeKey];
      if (!size.width || !size.height) {
        console.warn(`Unknown size preset: ${sizeKey}, skipping...`);
        continue;
      }

      const resizedBuffer = await resizeImage(
        Buffer.from(baseScreenshot),
        size,
        format,
        quality,
      );
      const filename = await generateFilename(url, device, format, sizeKey);
      const outputPath = join(outputDir, filename);

      await saveScreenshot(resizedBuffer, outputPath);

      results.push({
        size: sizeKey,
        dimensions: size,
        buffer: resizedBuffer,
        path: outputPath,
        fileSize: `${(resizedBuffer.length / 1024).toFixed(2)} KB`,
      });

      console.log(
        `✓ ${sizeKey} (${size.width}x${size.height}): ${(resizedBuffer.length / 1024).toFixed(2)} KB`,
      );
    } catch (error: any) {
      console.error(`✗ Failed to create ${sizeKey}: ${error.message}`);
    }
  }

  return results;
}

async function saveScreenshot(buffer: Buffer, filePath: string) {
  try {
    const dir = dirname(filePath);
    await mkdir(dir, { recursive: true });
    await writeFile(filePath, buffer);
  } catch (error: any) {
    throw new Error(`Failed to save screenshot: ${error.message}`);
  }
}

async function resizeImage(
  buffer: Buffer,
  size: { width: number; height: number },
  format = "png",
  quality = 100,
) {
  try {
    let sharpInstance = sharp(buffer).resize(size.width, size.height, {
      fit: "cover",
      position: "top",
    });

    if (format === "jpeg") {
      sharpInstance = sharpInstance.jpeg({ quality });
    } else if (format === "png") {
      sharpInstance = sharpInstance.png({ compressionLevel: 9 });
    }

    return await sharpInstance.toBuffer();
  } catch (error: any) {
    throw new Error(`Failed to resize image: ${error.message}`);
  }
}

export async function generateFilename(
  url: string,
  device: DevicePresetKey,
  format: "png" | "jpeg" = "png",
  size?:
    | {
        width: number;
        height: number;
      }
    | string,
) {
  const domain = new URL(url).hostname.replace(/\./g, "-");
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .split("T")[0];

  let sizeStr = "";
  if (size) {
    if (typeof size === "string") {
      sizeStr = `-${size}`;
    } else if (size.width && size.height) {
      sizeStr = `-${size.width}x${size.height}`;
    }
  }

  return `screenshot-${domain}-${device}${sizeStr}-${timestamp}.${format}`;
}
