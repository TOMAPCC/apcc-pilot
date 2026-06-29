import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  output: process.env.DOCKER_BUILD === "1" ? "standalone" : undefined
};

export default nextConfig;
