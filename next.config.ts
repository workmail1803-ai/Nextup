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
  // /staff_portal and /crm were two near-identical staff surfaces. They are now
  // one (/crm). These keep every old bookmark, and the links already sent to
  // staff, working — permanent so browsers and search engines stop asking.
  async redirects() {
    return [
      { source: "/staff_portal", destination: "/crm", permanent: true },
      { source: "/staff_portal/login", destination: "/crm/login", permanent: true },
      { source: "/staff_portal/dashboard", destination: "/crm", permanent: true },
      { source: "/staff_portal/clients", destination: "/crm/clients", permanent: true },
      { source: "/staff_portal/:path*", destination: "/crm", permanent: true },
    ];
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
