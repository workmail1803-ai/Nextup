import type { NextConfig } from "next";

const projectRoot = process.cwd();

const nextConfig: NextConfig = {
  // The reference repos cloned alongside this project (magicui, shadcn-ui, …)
  // carry their own lockfiles, which confuses Next's workspace-root inference.
  // Pin the root to this project directory.
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "owinpapcuwywxlmzomrr.supabase.co",
        pathname: "/storage/**",
      },
    ],
  },
};

export default nextConfig;
