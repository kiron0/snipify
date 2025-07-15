import { Browser, launch, Page } from "puppeteer";
import sharp from "sharp";

export type DevicePresetKey = keyof typeof DEVICE_PRESETS;
export type ScreenshotMode = "full" | "viewport";

export const DEVICE_PRESETS = {
  desktop: {
    viewport: { width: 1920, height: 1080 },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...Chrome/121.0.0.0 Safari/537.36",
  },
  laptop: {
    viewport: { width: 1366, height: 768 },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...Chrome/121.0.0.0 Safari/537.36",
  },
  tablet: {
    viewport: { width: 768, height: 1024 },
    userAgent: "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)...Safari/604.1",
  },
  mobile: {
    viewport: { width: 375, height: 667 },
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)...Safari/604.1",
  },
  "mobile-large": {
    viewport: { width: 414, height: 896 },
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)...Safari/604.1",
  },
} as const;

type ScreenshotOptions = {
  format?: "png" | "jpeg";
  quality?: number;
  mode?: ScreenshotMode;
  waitForSelector?: string;
  delay?: number;
  headless?: boolean;
  blockResources?: boolean;
  clip?: { x: number; y: number; width: number; height: number };
  fixedSize?: { width: number; height: number };
};

export async function captureScreenshot(
  url: string,
  device: DevicePresetKey = "desktop",
  options: ScreenshotOptions = {},
): Promise<{ base64: string }> {
  const {
    format = "png",
    quality = 90,
    mode = "full",
    waitForSelector,
    delay = 0,
    headless = true,
    blockResources = true,
    clip = null,
    fixedSize = null,
  } = options;

  if (!DEVICE_PRESETS[device]) {
    throw new Error(`Unknown device preset: ${device}`);
  }

  const browser: Browser = await launch({
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
        const type = req.resourceType();
        const reqUrl = req.url();
        if (
          ["media", "websocket", "font", "stylesheet"].includes(type) ||
          /analytics|tracking/.test(reqUrl)
        ) {
          req.abort();
        } else {
          req.continue();
        }
      });
    }

    await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });

    if (waitForSelector) await page.waitForSelector(waitForSelector);
    if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));

    const screenshotOptions = {
      fullPage: !clip && mode === "full",
      type: format,
      ...(format === "jpeg" && { quality }),
      ...(clip && { clip }),
    } as const;

    let screenshotBuffer = await page.screenshot(screenshotOptions);

    if (fixedSize) {
      screenshotBuffer = await resizeImage(
        Buffer.from(screenshotBuffer),
        fixedSize,
        format,
        quality,
      );
    }

    const base64 = Buffer.from(screenshotBuffer).toString("base64");
    return { base64 };
  } finally {
    if (page) await page.close();
    await browser.close();
  }
}

async function resizeImage(
  buffer: Buffer,
  size: { width: number; height: number },
  format: "png" | "jpeg",
  quality: number,
): Promise<Buffer> {
  let image = sharp(buffer).resize(size.width, size.height, {
    fit: "cover",
    position: "top",
  });

  if (format === "jpeg") image = image.jpeg({ quality });
  else if (format === "png") image = image.png({ compressionLevel: 9 });

  return await image.toBuffer();
}
