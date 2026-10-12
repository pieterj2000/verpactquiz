import { defineConfig } from "vite";
import { plugin as markdown, Mode } from "vite-plugin-markdown";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";

export default defineConfig({
  base: "./",
  plugins: [
    markdown({
      mode: [Mode.HTML],
    }),
    ViteImageOptimizer({
      test: /\.(jpe?g|png|gif|tiff|webp|svg|avif)$/i,
      includePublic: true,
      logStats: true,
      png: {
        quality: 100,
      },
      jpeg: {
        quality: 100,
      },
      jpg: {
        quality: 100,
      },
      webp: {
        quality: 100,
      },
    }),
  ],
});
