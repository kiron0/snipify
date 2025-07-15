import { DEVICE_PRESETS } from "../utils";

export type DevicePresetKey = keyof typeof DEVICE_PRESETS;
export type ScreenshotMode = "full" | "viewport";

export interface ScreenshotOptions {
  format?: "png" | "jpeg";
  quality?: number;
  mode?: ScreenshotMode;
  waitForSelector?: string;
  delay?: number;
  headless?: boolean;
  blockResources?: boolean;
  clip?: { x: number; y: number; width: number; height: number };
  fixedSize?: { width: number; height: number };
}
