import { afterEach, expect, it } from 'vitest'
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const fixtures: string[] = []
afterEach(() => { fixtures.splice(0).forEach(path => { rmSync(path, { recursive: true, force: true }) }) })

const project = () => {
  const root = mkdtempSync(join(tmpdir(), 'vk-audiopad-build-'))
  fixtures.push(root)
  copyFileSync(new URL('../build.sh', import.meta.url), join(root, 'build.sh'))
  for (const dir of ['scripts', 'bin', 'node_modules/.bin', 'public', ...['common', 'front', 'offscreen', 'service-worker'].map(name => `packages/${name}/dist`)]) {
    mkdirSync(join(root, dir), { recursive: true })
  }
  writeFileSync(join(root, 'scripts/doctor.mjs'), '')
  writeFileSync(join(root, 'node_modules/.bin/tsc'), '', { mode: 0o755 })
  for (const name of ['common', 'front', 'offscreen', 'service-worker']) writeFileSync(join(root, `packages/${name}/dist/${name}.js`), 'stale')
  for (const name of ['chrome', 'firefox']) writeFileSync(join(root, `public/environment-${name}.json`), '{}')
  writeFileSync(join(root, 'public/manifest.js'), 'console.log("{}")')
  writeFileSync(join(root, 'bin/npm'), `#!/usr/bin/env node
const fs = require('node:fs')
const name = process.argv.at(-1).replace('@vk-audiopad/', '')
fs.appendFileSync('builds.log', name + '\\n')
if (name === 'common' && process.env.FAIL_COMMON === '1') process.exit(1)
if (name !== 'common' && fs.readFileSync('packages/common/dist/common.js', 'utf8') !== 'fresh') process.exit(2)
fs.writeFileSync('packages/' + name + '/dist/' + name + '.js', 'fresh')
`, { mode: 0o755 })
  return root
}

const build = (root: string, args: string[] = [], failCommon = false) => spawnSync('bash', ['build.sh', ...args], {
  cwd: root,
  env: { ...process.env, PATH: `${join(root, 'bin')}:${process.env.PATH}`, FAIL_COMMON: failCommon ? '1' : '0' },
  encoding: 'utf8'
})

it.each(['front', 'offscreen', 'service-worker'])('refreshes existing common output before a partial %s build', consumer => {
  const root = project()
  const result = build(root, [consumer])
  expect(result.status, result.stdout + result.stderr).toBe(0)
  expect(readFileSync(join(root, 'builds.log'), 'utf8').trim().split('\n')).toEqual(['common', consumer])
  expect(readFileSync(join(root, `dist/chrome_extension/${consumer}.js`), 'utf8')).toBe('fresh')
})

it('stops before building a consumer or assembling stale output if common fails', () => {
  const root = project()
  expect(build(root, ['front'], true).status).toBe(1)
  expect(readFileSync(join(root, 'builds.log'), 'utf8')).toBe('common\n')
})

it('builds common once before all consumers in a full build', () => {
  const root = project()
  const result = build(root)
  expect(result.status, result.stdout + result.stderr).toBe(0)
  expect(readFileSync(join(root, 'builds.log'), 'utf8').trim().split('\n')).toEqual(['common', 'offscreen', 'service-worker', 'front'])
})
