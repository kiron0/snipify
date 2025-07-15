# Snipify 📸

> ⚠️ **Node.js Only**
>
> This package is designed for Node.js environments only. It uses Node.js APIs and dependencies (`puppeteer`, `sharp`) that are not available in browsers. Do **not** attempt to use this package in browser environments.
>
> **Requirements:** Node.js v16 or higher

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
npm install snipify
# or
yarn add snipify
# or
bun add snipify
```

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
