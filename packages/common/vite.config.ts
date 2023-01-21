import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'vk-audiopad-common-lib',
            fileName: (format) => `vk-audiopad-common-lib.${format}.js`,
        },
        outDir: './build',
    },
    plugins: [
        dts({
            insertTypesEntry: true
        }),
    ],
});
