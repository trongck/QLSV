import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbo: {
      resolve: {
        alias: {
          "@": "./",
        },
      },
    },
  },
};

export default nextConfig;
