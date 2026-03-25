# Snipify

[![npm version](https://img.shields.io/npm/v/snipify.svg?style=flat-square)](https://www.npmjs.com/package/snipify)
[![npm downloads](https://img.shields.io/npm/dm/snipify.svg?style=flat-square)](https://www.npmjs.com/package/snipify)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)

**Snipify is a CLI tool for capturing, resizing, and exporting high-quality web screenshots using Puppeteer and Sharp.**

_"From page to pixel-perfect screenshot—automate it all."_

---

## Features

- **Full & Viewport Modes** – Capture the entire page or just the visible area
- **Custom Device Emulation** – Desktop, mobile, tablet & more with custom user-agents
- **Smart Resource Blocking** – Skip heavy/irrelevant assets like analytics & media
- **Image Processing with Sharp** – Resize, crop, compress effortlessly
- **CLI First** – Focused on terminal usage without a public Node API
- **No Bloat** – Minimal dependencies, fast and efficient

---

## CLI Usage

Snipify comes with a powerful CLI for quick screenshots and batch production exports right from your terminal.

Node.js 18 or newer is required.

### Usage

```bash
npx snipify@latest [URL] [OPTIONS]
```

#### Arguments

- `URL` Website URL (default: http://example.com/)

#### Options

- `--device=DEVICE` Device preset (see list below; default: `mobile`)
- `--size=SIZE` Production size preset (see table below)
- `--production` Generate all production sizes listed below
- `--output=DIR` Output directory (default: `./screenshots`)
- `--format=FORMAT` Output format: `png`, `jpeg` (default: `png`)
- `--quality=VALUE` JPEG quality from `0` to `100` (default: `90`)
- `--delay=MS` Wait before capture in milliseconds (default: `1000`)
- `--wait-for-selector=SELECTOR` Wait for a CSS selector before capture
- `--block-resources` Block media, analytics, tracking, and websocket requests
- `--viewport` Capture only the current viewport instead of the full page, including in production mode
- `--help`, `-h` Show help

#### Device Presets

- desktop
- laptop
- tablet
- mobile
- mobile-large

#### Production Sizes

| Name              | Dimensions |
| ----------------- | ---------- |
| thumbnail         | 300x200    |
| card              | 400x300    |
| social-media      | 1200x630   |
| instagram-post    | 1080x1080  |
| instagram-story   | 1080x1920  |
| youtube-thumbnail | 1280x720   |
| blog-header       | 800x400    |
| email-banner      | 600x200    |
| preview-small     | 200x150    |
| preview-medium    | 400x300    |
| preview-large     | 800x600    |

### Examples

```bash
npx snipify@latest                                                                 # Basic mobile screenshot
npx snipify@latest https://example.com --device=desktop                              # Desktop screenshot
npx snipify@latest https://example.com --device=mobile --size=thumbnail   # Mobile thumbnail
npx snipify@latest https://example.com --viewport --format=jpeg --quality=80
npx snipify@latest https://example.com --wait-for-selector=.app --delay=1500
npx snipify@latest https://example.com --block-resources --output=./shots
npx snipify@latest https://example.com --device=desktop --production         # All production sizes
```

> Screenshots are saved to the output directory (default: `./screenshots`).

---

## Why Snipify?

- **Production Ready** – Battle-tested setup with error handling
- **Fast** – Puppeteer + Sharp combo for fast, clean output
- **CLI Focused** – Built strictly for terminal-based screenshot workflows
- **Simple Distribution** – Ships as a command, not a reusable runtime API

---

## License

MIT © Toufiq Hasan Kiron

> _“Snip it. Sharpen it. Ship it.”_ – Snipify Motto

---
