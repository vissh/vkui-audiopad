import { afterEach, expect, it } from 'vitest'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const roots: string[] = []
afterEach(() => { roots.splice(0).forEach(path => { rmSync(path, { recursive: true, force: true }) }) })

it.each(['common', 'front', 'offscreen', 'service-worker'])('%s rejects implicit parameters, nullable access and unsafe callback variance', workspace => {
  const configPath = fileURLToPath(new URL(`../packages/${workspace}/tsconfig.json`, import.meta.url))
  const config = ts.readConfigFile(configPath, ts.sys.readFile)
  expect(config.error).toBeUndefined()
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, fileURLToPath(new URL(`../packages/${workspace}/`, import.meta.url)))
  expect(parsed.errors).toEqual([])
  const directory = mkdtempSync(join(tmpdir(), 'vk-audiopad-types-'))
  roots.push(directory)
  const source = join(directory, 'unsafe.ts')
  writeFileSync(source, [
    'export const identity = value => value',
    'export const uppercase = (value: string | undefined) => value.toUpperCase()',
    'export const acceptsStringOrNumber: (value: string | number) => void = (value: string) => { console.log(value) }'
  ].join('\n'))
  const program = ts.createProgram([source], { ...parsed.options, types: [], incremental: false, tsBuildInfoFile: undefined, outDir: undefined })
  const diagnostics = ts.getPreEmitDiagnostics(program).filter(diagnostic => diagnostic.file?.fileName === source)
  expect(diagnostics.map(diagnostic => diagnostic.code)).toEqual(expect.arrayContaining([7006, 18048, 2322]))
})

it('uses one exact TypeScript compiler version for tooling and every workspace', () => {
  const root = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
  const version = root.devDependencies.typescript
  expect(version).toBe(ts.version)
  for (const workspace of ['common', 'front', 'offscreen', 'service-worker']) {
    const pkg = JSON.parse(readFileSync(new URL(`../packages/${workspace}/package.json`, import.meta.url), 'utf8'))
    expect(pkg.devDependencies.typescript).toBe(version)
  }
})
