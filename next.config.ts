import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  experimental: {
    cpus: 2,
    workerThreads: false,
  },
  outputFileTracingIncludes: {
    '/**/*': [
      './node_modules/@libsql/**/*',
      './node_modules/libsql/**/*',
    ],
  },
  // ponytail: hide the floating Next.js dev indicator (the "N" button) — it overlaps
  // the sidebar footer on every page. Use browser devtools for error/info instead.
  devIndicators: false,
};

export default nextConfig;
