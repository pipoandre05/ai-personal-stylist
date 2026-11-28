import path from "node:path";
import type { NextConfig } from "next";

// Raiz del monorepo (un nivel sobre web/). Se fija a mano porque los worktrees viven dentro del checkout
// principal y Next infiere la raiz desde el lockfile mas cercano.
const repoRoot = path.join(__dirname, "..");

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  transpilePackages: ["@aps/core"],
  outputFileTracingRoot: repoRoot,
  turbopack: {
    root: repoRoot,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
