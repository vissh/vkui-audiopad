import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { compareVersions, versionParts } from './release-version.mjs'

export const prepareRelease = (root, version) => {
  versionParts(version)
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
  if (git('status', '--porcelain', '--untracked-files=all')) throw new Error('Version preparation requires a clean checkout.')
  const manifest = JSON.parse(execFileSync(process.execPath, ['public/manifest.js', 'chrome'], { cwd: root, encoding: 'utf8' }))
  if (compareVersions(version, manifest.version) <= 0) throw new Error(`Version must be higher than ${manifest.version}.`)
  for (const tag of git('tag', '--list', 'v[0-9]*').split('\n').filter(Boolean)) {
    const previous = tag.slice(1)
    try { versionParts(previous) } catch { continue }
    if (compareVersions(version, previous) <= 0) throw new Error(`Version must be higher than existing tag ${tag}.`)
  }

  const path = join(root, 'public/manifest.js')
  const source = readFileSync(path, 'utf8')
  const matches = [...source.matchAll(/("version"\s*:\s*")([^"]*)(")/g)]
  if (matches.length !== 1 || matches[0][2] !== manifest.version) {
    throw new Error('Expected exactly one literal version in public/manifest.js.')
  }
  writeFileSync(path, source.replace(/("version"\s*:\s*")([^"]*)(")/, (_, start, _old, end) => start + version + end))
  git('add', '--', 'public/manifest.js')
  git('-c', 'user.name=github-actions[bot]', '-c', 'user.email=41898282+github-actions[bot]@users.noreply.github.com',
    '-c', 'core.hooksPath=/dev/null', '-c', 'commit.gpgsign=false', 'commit', '-m', `chore(release): v${version}`)
  return { version, tag: `v${version}`, commit: git('rev-parse', 'HEAD') }
}

if (process.argv[1] != null && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const release = prepareRelease(process.cwd(), process.argv[2] ?? process.env.RELEASE_VERSION)
    console.log(`Prepared ${release.tag} in local commit ${release.commit}; no remote changes yet.`)
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
