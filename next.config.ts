import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // ─── Image Optimization ───────────────────────────────────────────
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
    // Optimize image sizes and formats
    formats: ["image/avif", "image/webp"],
    // Cache optimized images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // ─── Compiler Optimizations ───────────────────────────────────────
  productionBrowserSourceMaps: false, // Exclude source maps in production

  // ─── Headers for Caching ──────────────────────────────────────────
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, must-revalidate",
          },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },

  // ─── Compression ──────────────────────────────────────────────────
  compress: true,

  // ─── Performance Features ─────────────────────────────────────────
  poweredByHeader: false, // Remove X-Powered-By header
};

export default withNextIntl(nextConfig);
