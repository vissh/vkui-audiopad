import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, "src/index.ts"),
            name: "vk-audiopad-common-lib",
            fileName: "vk-audiopad-common-lib",
        },
    },
    plugins: [
        dts({
            insertTypesEntry: true
        }),
    ],
});
