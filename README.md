# Snipify 📸

[![npm version](https://img.shields.io/npm/v/snipify.svg?style=flat-square)](https://www.npmjs.com/package/snipify)
[![npm downloads](https://img.shields.io/npm/dm/snipify.svg?style=flat-square)](https://www.npmjs.com/package/snipify)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg?style=flat-square)](https://www.typescriptlang.org/)

**Snipify is a production-ready toolkit for capturing, resizing, and exporting high-quality web screenshots using Puppeteer and Sharp.**

_"From page to pixel-perfect screenshot—automate it all."_ 🚀

---

## 🌟 Features

- **Full & Viewport Modes** – Capture the entire page or just the visible area
- **Custom Device Emulation** – Desktop, mobile, tablet & more with custom user-agents
- **Smart Resource Blocking** – Skip heavy/irrelevant assets like analytics & media
- **Image Processing with Sharp** – Resize, crop, compress effortlessly
- **Pure TypeScript** – Strictly typed and modern API
- **No Bloat** – Minimal dependencies, fast and efficient

---

## 📦 Installation

```bash
# Install globally for CLI usage
npm install -g snipify

# Install locally for programmatic usage
npm install snipify
```

---

## 🖥️ CLI Usage

Snipify comes with a powerful CLI for quick screenshots and batch production exports right from your terminal.

### Usage

```bash
snipify [URL] [OPTIONS]
```

#### Arguments
- `URL`                Website URL (default: http://example.com/)

#### Options
- `--device=DEVICE`    Device preset (see list below; default: `mobile`)
- `--size=SIZE`        Production size preset (see table below)
- `--production`       Generate all common production sizes
- `--output=DIR`       Output directory (default: `./screenshots`)
- `--help`, `-h`       Show help

#### Device Presets
- desktop
- laptop
- tablet
- mobile
- mobile-large

#### Production Sizes

| Name               | Dimensions      |
|--------------------|----------------|
| thumbnail          | 300x200        |
| card               | 400x300        |
| social-media       | 1200x630       |
| instagram-post     | 1080x1080      |
| instagram-story    | 1080x1920      |
| youtube-thumbnail  | 1280x720       |
| blog-header        | 800x400        |
| email-banner       | 600x200        |
| preview-small      | 200x150        |
| preview-medium     | 400x300        |
| preview-large      | 800x600        |

### Examples

```bash
snipify                                   # Basic mobile screenshot
snipify https://example.com --device=desktop                # Desktop screenshot
snipify https://example.com --device=mobile --size=thumbnail    # Mobile thumbnail
snipify https://example.com --device=desktop --production       # All production sizes
```

> Screenshots are saved to the output directory (default: `./screenshots`).

---

## 🚀 Quick Start

### 1. Single Screenshot: `captureScreenshot`

```ts
import { captureScreenshot } from "snipify";

const result = await captureScreenshot({
  url: "https://example.com",
  device: "desktop",
  options: {
    format: "jpeg",
    quality: 80,
  },
});

console.log(result);
// {
//   base64: 'data:image/jpeg;base64,...',
//   size: 'original',
//   device: 'desktop',
//   type: 'jpeg'
// }
```

### 2. Batch/Production Screenshots: `captureProductionScreenshots`

```ts
import { captureProductionScreenshots } from "snipify";

const results = await captureProductionScreenshots({
  url: "https://example.com",
  sizes: ["blog-header", "instagram-post"],
  options: {
    format: "jpeg",
    quality: 80,
  },
});

console.log(results);
// [
//   { base64: 'data:image/jpeg;base64,...', size: 'blog-header', type: 'jpeg' },
//   { base64: 'data:image/jpeg;base64,...', size: 'instagram-post', type: 'jpeg' }
// ]
```

---

## ✨ Core API

### 📸 `captureScreenshot(url, device?, options?)`

Capture a screenshot and get a base64 string.

```ts
const result = await captureScreenshot({
  url: "https://example.com",
  device: "mobile",
  options: {
    mode: "viewport",
    format: "png",
  },
});
```

#### Parameters

| Name      | Type                                | Description           |
| --------- | ----------------------------------- | --------------------- |
| `url`     | `string`                            | Web page URL          |
| `device`  | `"desktop" \| "mobile" \| "tablet"` | default - `"desktop"` |
| `options` | `{ mode, format, quality, ... }`    | Screenshot options    |

---

## 📏 Resize Options

You can resize screenshots automatically:

```ts
await captureScreenshot({
  url: "https://example.com",
  device: "mobile",
  options: {
    fixedSize: { width: 800, height: 600 },
  },
});
```

---

## ⚙️ Options

```ts
interface ScreenshotOptions {
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
```

---

## 🧠 Why Snipify?

- **Production Ready** – Battle-tested setup with error handling
- **Fast** – Puppeteer + Sharp combo for fast, clean output
- **Zero UI Dependency** – Works anywhere Node.js runs
- **Typed First** – Built for TypeScript users
- **Modular** – Customize device presets, screenshot settings & more

---

## 🛠️ Contributing

```bash
git clone https://github.com/kiron0/snipify.git
cd snipify
bun install
bun run build
```

Issues and PRs are warmly welcome 🤝

---

## 📜 License

MIT © Toufiq Hasan Kiron

> _“Snip it. Sharpen it. Ship it.”_ – Snipify Motto 📸

---
