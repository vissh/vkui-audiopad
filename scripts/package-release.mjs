import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { isDeepStrictEqual } from 'node:util'
import { versionParts } from './release-version.mjs'

export const packageRelease = (root) => {
  const run = (command, args, cwd = root) => execFileSync(command, args, { cwd, encoding: 'utf8' }).trim()
  const git = (...args) => run('git', args)
  if (git('status', '--porcelain', '--untracked-files=all')) {
    throw new Error('Release packaging requires a clean checkout, including untracked files. Commit changes first.')
  }

  const commit = git('rev-parse', 'HEAD')
  const manifest = JSON.parse(run(process.execPath, ['public/manifest.js', 'chrome']))
  const version = manifest.version
  versionParts(version)

  for (const browser of ['chrome', 'firefox']) {
    const expected = JSON.parse(run(process.execPath, ['public/manifest.js', browser]))
    const built = JSON.parse(readFileSync(join(root, 'dist', `${browser}_extension`, 'manifest.json'), 'utf8'))
    if (!isDeepStrictEqual(built, expected)) {
      throw new Error(`${browser} manifest differs from public/manifest.js. Run a full build first.`)
    }
  }
  run(process.execPath, ['scripts/verify-build-output.mjs'])

  const output = join(root, 'dist', 'release')
  rmSync(output, { recursive: true, force: true })
  mkdirSync(output, { recursive: true })
  try {
    for (const browser of ['chrome', 'firefox']) {
      const archive = join(output, `vk-audiopad-${version}-${browser}.zip`)
      run('zip', ['-q', '-X', '-r', archive, '.'], join(root, 'dist', `${browser}_extension`))
      run('unzip', ['-tq', archive])
    }
    const source = join(output, `vk-audiopad-${version}-source.zip`)
    git('archive', '--format=zip', `--prefix=vk-audiopad-${version}/`, `--output=${source}`, commit)
    run('unzip', ['-tq', source])

    const metadata = {
      version,
      tag: `v${version}`,
      commit,
      node: process.version,
      packageManager: JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).packageManager
    }
    writeFileSync(join(output, 'release.json'), JSON.stringify(metadata, null, 2) + '\n')
    const checksums = readdirSync(output).sort().map(file => {
      const hash = createHash('sha256').update(readFileSync(join(output, file))).digest('hex')
      return `${hash}  ${file}\n`
    }).join('')
    writeFileSync(join(output, 'SHA256SUMS'), checksums)
    return metadata
  } catch (error) {
    rmSync(output, { recursive: true, force: true })
    throw error
  }
}

if (process.argv[1] != null && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const release = packageRelease(process.cwd())
    console.log(`Packaged ${release.tag} (${release.commit}) in dist/release`)
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
