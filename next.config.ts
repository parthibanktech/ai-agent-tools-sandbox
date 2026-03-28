import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Workaround: using .next_dev because .next/dev/types got locked by VS Code's TS server.
  // To revert: delete .next and .next_dev folders, remove this line, restart VS Code.
  //distDir: ".next_dev",
  output: "standalone",
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
