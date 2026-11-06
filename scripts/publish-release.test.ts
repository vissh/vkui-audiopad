import { afterEach, expect, it } from 'vitest'
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { prepareRelease } from './prepare-release.mjs'

const roots: string[] = []
afterEach(() => { roots.splice(0).forEach(root => { rmSync(root, { recursive: true, force: true }) }) })
const git = (root: string, ...args: string[]) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim()
const commit = (root: string) => {
  git(root, 'add', '.')
  git(root, '-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'Fixture')
}
const project = () => {
  const root = mkdtempSync(join(tmpdir(), 'vk-audiopad-publish-'))
  roots.push(root)
  const source = join(root, 'source')
  const remote = join(root, 'remote.git')
  const worker = join(root, 'worker')
  const temporary = join(root, 'tmp')
  const bin = join(root, 'bin')
  for (const dir of [source, temporary, bin]) mkdirSync(dir)
  mkdirSync(join(source, 'public'))
  writeFileSync(join(source, 'public/manifest.js'), 'console.log(JSON.stringify({ "version": "3.3.9" }))\n')
  git(source, 'init', '-qb', 'master')
  commit(source)
  const base = git(source, 'rev-parse', 'HEAD')
  git(root, 'clone', '-q', '--bare', source, remote)
  git(source, 'remote', 'add', 'origin', remote)
  git(root, 'clone', '-q', remote, worker)
  const release = prepareRelease(source, '3.3.10')
  git(source, 'bundle', 'create', join(temporary, 'release.bundle'), 'HEAD', `^${base}`)
  mkdirSync(join(worker, 'release'))
  writeFileSync(join(worker, 'release', 'fixture.zip'), 'Verified asset fixture')
  const log = join(root, 'gh.log')
  writeFileSync(join(bin, 'gh'), `#!/usr/bin/env node
if (process.argv[2] === 'release' && process.argv[3] === 'view') process.exit(process.env.EXISTING_RELEASE === '1' ? 0 : 1)
if (process.env.FAIL_CREATE === '1') process.exit(1)
require('node:fs').appendFileSync(${JSON.stringify(log)}, JSON.stringify(process.argv.slice(2)) + '\\n')
`, { mode: 0o755 })
  const publish = (extra: Record<string, string> = {}) => spawnSync('bash', [fileURLToPath(new URL('./publish-release.sh', import.meta.url))], {
    cwd: worker,
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${bin}:${process.env.PATH}`,
      GITHUB_SHA: base,
      RUNNER_TEMP: temporary,
      RELEASE_VERSION: release.version,
      RELEASE_TAG: release.tag,
      RELEASE_COMMIT: release.commit,
      RELEASE_DRAFT: 'true',
      GITHUB_STEP_SUMMARY: join(root, 'summary'),
      ...extra
    }
  })
  return { source, remote, base, release, log, publish }
}

it('pushes the verified version commit and tag, then creates a draft with the retained assets', () => {
  const fixture = project()
  const result = fixture.publish()
  expect(result.status, result.stdout + result.stderr).toBe(0)
  expect(git(fixture.remote, 'rev-parse', 'refs/heads/master')).toBe(fixture.release.commit)
  expect(git(fixture.remote, 'rev-parse', 'refs/tags/v3.3.10')).toBe(fixture.release.commit)
  const args: string[] = JSON.parse(readFileSync(fixture.log, 'utf8'))
  expect(args.slice(0, 4)).toEqual(['release', 'create', 'v3.3.10', 'release/fixture.zip'])
  expect(args).toContain('--draft')
})

it('rejects a moving master without changing it or creating a tag/release', () => {
  const fixture = project()
  git(fixture.source, 'switch', '-qc', 'racing', fixture.base)
  writeFileSync(join(fixture.source, 'README.md'), 'Concurrent change')
  commit(fixture.source)
  git(fixture.source, 'push', '-q', 'origin', 'racing:master')
  const newer = git(fixture.remote, 'rev-parse', 'master')
  const result = fixture.publish()
  expect(result.status).toBe(1)
  expect(result.stdout).toContain('master changed')
  expect(git(fixture.remote, 'rev-parse', 'master')).toBe(newer)
  expect(git(fixture.remote, 'tag', '--list')).toBe('')
  expect(existsSync(fixture.log)).toBe(false)
})

it('rejects an existing tag at another commit without pushing the version commit', () => {
  const fixture = project()
  git(fixture.source, 'tag', 'v3.3.10', fixture.base)
  git(fixture.source, 'push', '-q', 'origin', 'refs/tags/v3.3.10')
  expect(fixture.publish().status).toBe(1)
  expect(git(fixture.remote, 'rev-parse', 'master')).toBe(fixture.base)
  expect(existsSync(fixture.log)).toBe(false)
})

it('keeps master unchanged when the server rejects the tag in the atomic push', () => {
  const fixture = project()
  writeFileSync(join(fixture.remote, 'hooks/update'), '#!/bin/sh\ncase "$1" in refs/tags/*) exit 1;; esac\n', { mode: 0o755 })
  expect(fixture.publish().status).not.toBe(0)
  expect(git(fixture.remote, 'rev-parse', 'master')).toBe(fixture.base)
  expect(git(fixture.remote, 'tag', '--list')).toBe('')
  expect(existsSync(fixture.log)).toBe(false)
})

it('can retry only the failed publish job after a release-API failure with the same commit and tag', () => {
  const fixture = project()
  expect(fixture.publish({ FAIL_CREATE: '1' }).status).toBe(1)
  expect(git(fixture.remote, 'rev-parse', 'master')).toBe(fixture.release.commit)
  expect(fixture.publish().status).toBe(0)
})

it('does not overwrite an existing draft or published release', () => {
  const fixture = project()
  expect(fixture.publish({ EXISTING_RELEASE: '1' }).status).toBe(1)
  expect(git(fixture.remote, 'rev-parse', 'master')).toBe(fixture.base)
  expect(existsSync(fixture.log)).toBe(false)
})
