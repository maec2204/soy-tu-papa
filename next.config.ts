import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El indicador de desarrollo tapaba la barra inferior.
  devIndicators: false,
  serverExternalPackages: ["@electric-sql/pglite"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
