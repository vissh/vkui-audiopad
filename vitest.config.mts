import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      '@vk-audiopad/common': fileURLToPath(new URL('./packages/common/src/index.ts', import.meta.url)),
      '@': fileURLToPath(new URL('./packages/front/src', import.meta.url))
    }
  },
  test: {
    include: ['packages/*/src/**/*.test.ts', 'tests/**/*.test.ts', 'scripts/**/*.test.ts'],
    setupFiles: ['./tests/setup.ts'],
    restoreMocks: true,
    unstubGlobals: true
  }
})
