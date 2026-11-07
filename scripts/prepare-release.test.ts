import { afterEach, expect, it } from 'vitest'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { prepareRelease } from './prepare-release.mjs'
import { compareVersions } from './release-version.mjs'

const roots: string[] = []
afterEach(() => { roots.splice(0).forEach(root => { rmSync(root, { recursive: true, force: true }) }) })
const git = (root: string, ...args: string[]) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
const project = () => {
  const root = mkdtempSync(join(tmpdir(), 'vk-audiopad-version-'))
  roots.push(root)
  mkdirSync(join(root, 'public'))
  writeFileSync(join(root, 'public/manifest.js'), 'console.log(JSON.stringify({ "version": "3.3.9", "name": "Unchanged" }))\n')
  writeFileSync(join(root, 'README.md'), 'Unchanged documentation\n')
  git(root, 'init', '-q')
  git(root, 'add', '.')
  git(root, '-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'Initial')
  return root
}

it('creates one version-only commit while preserving manifest formatting and other files', () => {
  const root = project()
  const base = git(root, 'rev-parse', 'HEAD')
  const before = readFileSync(join(root, 'public/manifest.js'), 'utf8')
  const release = prepareRelease(root, '3.3.10')
  expect(release).toEqual({ version: '3.3.10', tag: 'v3.3.10', commit: git(root, 'rev-parse', 'HEAD') })
  expect(git(root, 'rev-parse', 'HEAD^')).toBe(base)
  expect(git(root, 'diff-tree', '--no-commit-id', '--name-only', '-r', 'HEAD')).toBe('public/manifest.js')
  expect(readFileSync(join(root, 'public/manifest.js'), 'utf8')).toBe(before.replace('3.3.9', '3.3.10'))
  expect(git(root, 'log', '-1', '--format=%s')).toBe('chore(release): v3.3.10')
  expect(git(root, 'status', '--porcelain')).toBe('')
})

it.each(['3.3.9', '3.3.9.0', '3.3.8'])('rejects unchanged or decreasing version %s without modifying files', version => {
  const root = project()
  expect(() => prepareRelease(root, version)).toThrow('higher than 3.3.9')
  expect(git(root, 'status', '--porcelain')).toBe('')
})

it('also requires a version higher than previously released tags', () => {
  const root = project()
  git(root, 'tag', 'v3.3.12')
  expect(() => prepareRelease(root, '3.3.10')).toThrow('higher than existing tag v3.3.12')
})

it('rejects dirty input instead of committing someone else’s changes', () => {
  const root = project()
  writeFileSync(join(root, 'README.md'), 'Other work\n')
  expect(() => prepareRelease(root, '3.3.10')).toThrow('clean checkout')
  expect(git(root, 'log', '-1', '--format=%s')).toBe('Initial')
})

it('compares version components numerically with zero padding', () => {
  expect(compareVersions('3.3.10', '3.3.9')).toBe(1)
  expect(compareVersions('3.3.10', '3.3.10.0')).toBe(0)
  expect(compareVersions('3.3.9', '3.4')).toBe(-1)
})
