import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { validRange } from 'semver'

const root = JSON.parse(readFileSync('package.json', 'utf8'))
const files = ['package.json']

for (const dir of readdirSync('packages')) {
  const p = join('packages', dir, 'package.json')
  if (existsSync(p)) {
    files.push(p)
  }
}

let failed = false

for (const file of files) {
  const pkg = JSON.parse(readFileSync(file, 'utf8'))
  const sections = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']

  for (const section of sections) {
    for (const [name, spec] of Object.entries(pkg[section] ?? {})) {
      // This repo pins everything as plain semver ranges only: git urls,
      // dist-tags, aliases and file: paths are not allowed on purpose.
      if (validRange(spec) === null) {
        console.error(`${file}: "${name}": "${spec}" is not a valid semver range`)
        failed = true
      }
    }
  }
}

if (failed) {
  console.error('\nInvalid dependency specifier(s) found. Fix package.json files.')
  process.exit(1)
}

console.log(`OK: ${files.length} package.json files, all dependency specifiers are valid semver`)
