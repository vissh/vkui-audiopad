import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        app: "./offscreen.html",
      },
      output: {
        assetFileNames: "offscreen_assets/[name]-[hash].[extname]",
        chunkFileNames: "offscreen_assets/[name]-[hash].js",
        entryFileNames: "offscreen_assets/[name]-[hash].js",
      }
    },
  },
});
