import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "service-worker",
      fileName: "service-worker",
      // vite 7+ defaults lib formats to ['es']; keep the es+umd pair vite 6 produced
      formats: ["es", "umd"],
    },
  }
});
