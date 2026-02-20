import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
