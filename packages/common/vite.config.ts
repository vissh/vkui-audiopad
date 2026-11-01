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
      insertTypesEntry: true,
      // fail the build on type errors instead of only logging them,
      // so `npm run check` catches what the declaration pass sees
      afterDiagnostic: (diagnostics) => {
        if (diagnostics.length > 0) {
          throw new Error(`Declaration build has ${diagnostics.length} type error(s), see log above`)
        }
      },
    }),
  ],
});
