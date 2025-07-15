import { launch, Page } from "puppeteer";
import sharp from "sharp";
import { DevicePresetKey, ScreenshotOptions } from "../interface";
import { DEVICE_PRESETS, PRODUCTION_SIZES } from "../utils";

function normalizeScreenshotOptions(options: ScreenshotOptions = {}) {
  const {
    format = "png",
    quality = 100,
    fullPage = true,
    waitForSelector,
    delay = 0,
    headless = true,
    blockResources = true,
    clip = null,
    fixedSize = null,
  } = options;

  return {
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
}): Promise<{
  base64: string;
  size: string;
  device: DevicePresetKey;
  type: string;
}> {
  const {
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
    throw new Error(`Unknown device preset: ${device}`);
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

    const base64 = `data:image/${format};base64,${Buffer.from(screenshotBuffer).toString("base64")}`;

    return {
      base64,
      size: fixedSize ? `${fixedSize.width}x${fixedSize.height}` : "original",
      device,
      type: format,
    };
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
}): Promise<{ base64: string; size: string; type: string }[]> {
  const {
    format,
    quality,
    fullPage,
    waitForSelector,
    delay,
    headless,
    blockResources,
    clip,
  } = normalizeScreenshotOptions(options);

  const results: {
    base64: string;
    size: string;
    type: string;
  }[] = [];

  const baseScreenshot = await captureScreenshot({
    url,
    device,
    options: {
      format,
      quality,
      fullPage,
      waitForSelector,
      delay,
      headless,
      blockResources,
      clip: clip ?? undefined,
    },
  });

  for (const sizeKey of sizes) {
    try {
      const size = PRODUCTION_SIZES[sizeKey];
      if (!size?.width || !size?.height) {
        continue;
      }

      const buffer = Buffer.from(baseScreenshot.base64.split(",")[1], "base64");
      const resizedBuffer = await resizeImage(buffer, size, format, quality);

      results.push({
        base64: `data:image/${format};base64,${resizedBuffer.toString("base64")}`,
        size: sizeKey,
        type: format,
      });
    } catch (error: any) {
      console.error(`✗ Failed to create ${sizeKey}: ${error.message}`);
    }
  }

  return results;
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
