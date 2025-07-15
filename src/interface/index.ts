import { DEVICE_PRESETS } from "../utils";

export type DevicePresetKey = keyof typeof DEVICE_PRESETS;

export interface ScreenshotOptions {
  outputPath?: string;
  outputDir?: string;
  format?: "png" | "jpeg";
  quality?: number;
  fullPage?: boolean;
  waitForSelector?: string;
  delay?: number;
  headless?: boolean;
  blockResources?: boolean;
  clip?: { x: number; y: number; width: number; height: number };
  fixedSize?: { width: number; height: number };
}
