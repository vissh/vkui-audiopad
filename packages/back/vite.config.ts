import { defineConfig } from "vite";

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                app: "./background.html",
            },
            output: {
                assetFileNames: "background_assets/[name]-[hash].[extname]",
                chunkFileNames: "background_assets/[name]-[hash].js",
                entryFileNames: "background_assets/[name]-[hash].js",
            }
        },
    },
});
