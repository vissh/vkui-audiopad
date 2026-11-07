import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { expect, it } from 'vitest'

it.each(['chrome', 'firefox'])('keeps Mix audio access optional rather than granting it on %s installation', browser => {
  const manifest = JSON.parse(execFileSync(process.execPath, [fileURLToPath(new URL('../public/manifest.js', import.meta.url)), browser], { encoding: 'utf8' })) as Record<string, string[] | undefined>
  const origin = 'https://*.okcdn.ru/*'
  expect(manifest.host_permissions).toEqual(['*://*.vk.ru/*'])
  expect(manifest.permissions).not.toContain(origin)
  // Firefox 113 uses optional_permissions for host origins; the newer key starts at 128.
  const optional = browser === 'chrome' ? manifest.optional_host_permissions : manifest.optional_permissions
  expect(optional).toEqual([origin])
})
