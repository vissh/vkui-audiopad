import { afterEach, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const directories: string[] = []
afterEach(() => { directories.splice(0).forEach(path => { rmSync(path, { recursive: true, force: true }) }) })

const runFixture = (body: string) => {
  const directory = mkdtempSync(join(tmpdir(), 'vk-audiopad-network-policy-'))
  directories.push(directory)
  symlinkSync(fileURLToPath(new URL('../node_modules', import.meta.url)), join(directory, 'node_modules'), 'dir')
  mkdirSync(join(directory, 'tests'))
  const setup = fileURLToPath(new URL('../tests/setup.ts', import.meta.url))
  writeFileSync(join(directory, 'vitest.config.mjs'), `export default { test: { include: ['tests/*.test.ts'], setupFiles: [${JSON.stringify(setup)}] } }`)
  writeFileSync(join(directory, 'tests/fixture.test.ts'), `import { it, vi } from 'vitest'\nit('offline boundary', async () => { ${body} })`)
  return spawnSync(process.execPath, [fileURLToPath(new URL('../node_modules/vitest/vitest.mjs', import.meta.url)), 'run'], {
    cwd: directory,
    encoding: 'utf8',
    timeout: 20_000,
    env: { ...process.env, NO_COLOR: '1' }
  })
}

it('fails an accidental network call even when the product catches its rejection', () => {
  const result = runFixture("await fetch('https://offline.invalid/').catch(() => {})")
  expect(result.error).toBeUndefined()
  expect(result.status).toBe(1)
  expect(result.stdout + result.stderr).toContain('Unexpected network request')
}, 25_000)

it('accepts explicitly adapted networking without requiring real VK or credentials', () => {
  const result = runFixture("vi.stubGlobal('fetch', vi.fn(async () => new Response('{}'))); await fetch('https://offline.invalid/')")
  expect(result.error).toBeUndefined()
  expect(result.status).toBe(0)
}, 25_000)
