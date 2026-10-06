import type { NextConfig } from "next";

// GitHub Pages serves the app from /walksafe-app; locally it is at the root.
const basePath = process.env.BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",             // plain files: GitHub Pages runs no server
  basePath,
  trailingSlash: true,          // /login → login/index.html, which Pages serves
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
