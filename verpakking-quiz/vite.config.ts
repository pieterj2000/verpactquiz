import { defineConfig } from "vite";
import { plugin as markdown, Mode } from "vite-plugin-markdown";

export default defineConfig({
  base: "./",
  plugins: [
    markdown({
      mode: [Mode.HTML],
    }),
  ],
});
