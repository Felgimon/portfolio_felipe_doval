import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // Todas las imágenes viven en /public. Formatos modernos para el LCP.
    formats: ["image/avif", "image/webp"],
  },
  // Los modelos .glb se sirven desde /public (no pasan por webpack).
};

export default withAnalyzer(nextConfig);
