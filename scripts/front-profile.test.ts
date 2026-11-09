import { expect, it } from 'vitest'
import { fileURLToPath } from 'node:url'
import { loadConfigFromFile } from 'vite'

const configFor = async (mode: string) => {
  const loaded = await loadConfigFromFile({ command: 'build', mode }, fileURLToPath(new URL('../packages/front/vite.config.ts', import.meta.url)))
  if (loaded == null) throw new Error('Missing frontend configuration')
  return loaded.config
}

it('keeps React profiling output and instrumentation separate from production builds', async () => {
  const normal = await configFor('production')
  const profile = await configFor('profile')
  expect(normal.build).toMatchObject({ outDir: 'dist', sourcemap: false, minify: true })
  expect(profile.build).toMatchObject({ outDir: 'dist-profile', sourcemap: true, minify: false })
  expect(normal.resolve?.alias).not.toContainEqual(expect.objectContaining({ replacement: 'react-dom/profiling' }))
  expect(profile.resolve?.alias).toContainEqual({ find: 'react-dom/client', replacement: 'react-dom/profiling' })
  expect(normal.plugins).not.toContainEqual(expect.objectContaining({ name: 'react-devtools-profile' }))
  const plugin = profile.plugins?.find(plugin => plugin != null && typeof plugin === 'object' && 'name' in plugin && plugin.name === 'react-devtools-profile')
  if (plugin == null || typeof plugin !== 'object' || !('transform' in plugin) || typeof plugin.transform !== 'function') throw new Error('Missing React profile registration')
  const transformed: unknown = Reflect.apply(plugin.transform, null, ['import { createRoot } from "react-dom/client"', '/app/src/index.tsx'])
  expect(transformed).toMatchObject({ code: expect.stringMatching(/^import 'react-devtools-cdt-mcp\/register'\nimport \{ createRoot \}/) })
})
