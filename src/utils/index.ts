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

export const PRODUCTION_SIZES = {
  thumbnail: { width: 300, height: 200 },
  card: { width: 400, height: 300 },
  "social-media": { width: 1200, height: 630 },
  "instagram-post": { width: 1080, height: 1080 },
  "instagram-story": { width: 1080, height: 1920 },
  "youtube-thumbnail": { width: 1280, height: 720 },
  "blog-header": { width: 800, height: 400 },
  "email-banner": { width: 600, height: 200 },
  "preview-small": { width: 200, height: 150 },
  "preview-medium": { width: 400, height: 300 },
  "preview-large": { width: 800, height: 600 },
} as const;
