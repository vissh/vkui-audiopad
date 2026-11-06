import { afterEach, expect, it } from 'vitest'
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { packageRelease } from './package-release.mjs'

const fixtures: string[] = []
afterEach(() => { fixtures.splice(0).forEach(path => { rmSync(path, { recursive: true, force: true }) }) })

const git = (root: string, ...args: string[]) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
const commit = (root: string) => {
  git(root, 'add', '.')
  git(root, '-c', 'user.name=Release Test', '-c', 'user.email=release@example.invalid', 'commit', '-qm', 'Release fixture')
}
const writeJson = (path: string, value: unknown) => { writeFileSync(path, JSON.stringify(value)) }

const project = (version = '3.3.9') => {
  const root = mkdtempSync(join(tmpdir(), 'vk-audiopad-release-'))
  fixtures.push(root)
  git(root, 'init', '-q')
  writeFileSync(join(root, '.gitignore'), '/dist/\n')
  writeJson(join(root, 'package.json'), { packageManager: 'npm@11.19.1' })
  mkdirSync(join(root, 'scripts'))
  copyFileSync(new URL('./verify-build-output.mjs', import.meta.url), join(root, 'scripts/verify-build-output.mjs'))
  mkdirSync(join(root, 'public'))
  writeFileSync(join(root, 'public/manifest.js'), `
const chrome = process.argv[2] === 'chrome'
console.log(JSON.stringify({
  name: 'Test', version: ${JSON.stringify(version)}, description: 'Test extension', manifest_version: 3,
  icons: { '16': 'icons/icon16.png' }, action: { default_popup: 'index.html' },
  background: chrome ? { service_worker: 'service-worker.js' } : { page: 'offscreen.html' },
  ...(!chrome && { browser_specific_settings: { gecko: { id: 'test@example.invalid' } } })
}))
`)
  for (const browser of ['chrome', 'firefox']) {
    const dir = join(root, 'dist', `${browser}_extension`)
    mkdirSync(join(dir, 'rules'), { recursive: true })
    for (const file of ['index.html', 'offscreen.html', 'service-worker.js', 'rules/vkcom.json']) {
      writeFileSync(join(dir, file), 'fixture')
    }
    writeJson(join(dir, 'environment.json'), { 'offscreen-document-support': browser === 'chrome' })
    writeFileSync(join(dir, 'manifest.json'), execFileSync(process.execPath, ['public/manifest.js', browser], { cwd: root }))
  }
  commit(root)
  return root
}

it('packages root-level browser manifests, matching committed source, build identity and valid checksums', () => {
  const root = project()
  const output = join(root, 'dist/release')
  mkdirSync(output)
  writeFileSync(join(output, 'obsolete.zip'), 'old candidate')
  const result = packageRelease(root)
  expect(result).toMatchObject({ version: '3.3.9', tag: 'v3.3.9', commit: git(root, 'rev-parse', 'HEAD') })
  expect(JSON.parse(readFileSync(join(output, 'release.json'), 'utf8'))).toEqual(result)
  expect(readdirSync(output).sort()).toEqual([
    'SHA256SUMS', 'release.json', 'vk-audiopad-3.3.9-chrome.zip', 'vk-audiopad-3.3.9-firefox.zip', 'vk-audiopad-3.3.9-source.zip'
  ])
  for (const browser of ['chrome', 'firefox']) {
    const archive = join(output, `vk-audiopad-3.3.9-${browser}.zip`)
    const manifest = execFileSync('unzip', ['-p', archive, 'manifest.json'], { encoding: 'utf8' })
    expect(manifest).toBe(readFileSync(join(root, 'dist', `${browser}_extension`, 'manifest.json'), 'utf8'))
    const entries = execFileSync('unzip', ['-Z1', archive], { encoding: 'utf8' }).trim().split('\n')
    expect(entries).toContain('manifest.json')
    expect(entries.some(entry => entry.startsWith(`${browser}_extension/`))).toBe(false)
  }
  const source = join(output, 'vk-audiopad-3.3.9-source.zip')
  expect(execFileSync('unzip', ['-p', source, 'vk-audiopad-3.3.9/public/manifest.js'], { encoding: 'utf8' }))
    .toBe(execFileSync('git', ['show', 'HEAD:public/manifest.js'], { cwd: root, encoding: 'utf8' }))
  const sourceEntries = execFileSync('unzip', ['-Z1', source], { encoding: 'utf8' })
  expect(sourceEntries).not.toMatch(/\/(dist|node_modules|\.git)\//)
  const checksums = readFileSync(join(output, 'SHA256SUMS'), 'utf8').trim().split('\n')
  expect(checksums).toHaveLength(4)
  for (const line of checksums) {
    const [hash, file] = line.split('  ')
    expect(hash).toBe(createHash('sha256').update(readFileSync(join(output, file))).digest('hex'))
  }
  expect(git(root, 'status', '--porcelain', '--untracked-files=all')).toBe('')
})

it.each(['tracked', 'untracked'])('rejects %s changes so source and binaries cannot silently use different revisions', kind => {
  const root = project()
  writeFileSync(join(root, kind === 'tracked' ? 'package.json' : 'uncommitted.txt'), '{}')
  expect(() => packageRelease(root)).toThrow('clean checkout')
})

it.each(['chrome', 'firefox'])('rejects stale %s output even when its version alone still matches', browser => {
  const root = project()
  const path = join(root, 'dist', `${browser}_extension`, 'manifest.json')
  writeJson(path, { ...JSON.parse(readFileSync(path, 'utf8')), description: 'Old description' })
  expect(() => packageRelease(root)).toThrow(`${browser} manifest differs`)
})

it.each(['3.3.9-beta', '03.3.9', '65536.1', '0.0.0', '1.2.3.4.5'])('rejects invalid release version %s', version => {
  expect(() => packageRelease(project(version))).toThrow('Manifest version')
})

it('requires a verified build before creating release assets', () => {
  const root = project()
  rmSync(join(root, 'dist/firefox_extension/offscreen.html'))
  expect(() => packageRelease(root)).toThrow()
  expect(readdirSync(join(root, 'dist'))).not.toContain('release')
})
