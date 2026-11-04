import { afterEach, describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { inspectProject, validateRuntime } from './doctor.mjs'
import { syncMcpConfigs } from './mcp-config.mjs'

const runtime = { nodeVersion: 'v24.22.2', npmVersion: '11.19.1' }
const pins = { referenceNode: '24.22.2', packageManager: 'npm@11.19.1' }
const fixtures: string[] = []
const writeJson = (path: string, value: unknown) => { writeFileSync(path, JSON.stringify(value)) }

afterEach(() => { fixtures.splice(0).forEach(path => { rmSync(path, { recursive: true, force: true }) }) })

const project = () => {
  const root = mkdtempSync(join(tmpdir(), 'vk-audiopad-doctor-'))
  fixtures.push(root)
  writeJson(join(root, 'package.json'), { engines: { node: '>=24.22.2 <25', npm: '11.19.1' }, packageManager: pins.packageManager })
  writeFileSync(join(root, '.node-version'), pins.referenceNode)
  mkdirSync(join(root, 'packages/front'), { recursive: true })
  writeJson(join(root, 'packages/front/package.json'), {
    name: '@vk-audiopad/front',
    dependencies: { '@vkontakte/vkui': '8.4.3' },
    scripts: { build: 'vite build', typecheck: 'tsc', lint: 'eslint src', 'eslint:fix': 'eslint --fix src' }
  })
  mkdirSync(join(root, 'node_modules/.bin'), { recursive: true })
  for (const name of ['tsc', 'vite', 'eslint', 'vitest']) {
    writeFileSync(join(root, 'node_modules/.bin', name), '', { mode: 0o755 })
  }
  mkdirSync(join(root, 'node_modules/@vk-audiopad'), { recursive: true })
  symlinkSync(join(root, 'packages/front'), join(root, 'node_modules/@vk-audiopad/front'))
  writeJson(join(root, '.mcp.json'), {
    mcpServers: {
      vkui: { command: 'npx', args: ['-y', '@vkontakte/vkui-mcp@1.1.0'], env: { VKUI_VERSION: '8.4.3' } },
      'chrome-devtools': { command: 'npx', args: ['-y', 'chrome-devtools-mcp@1.12.0', '--categoryExtensions'] },
      'firefox-devtools': { command: 'npx', args: ['-y', '@mozilla/firefox-devtools-mcp-moz@0.10.7'] }
    }
  })
  syncMcpConfigs(root)
  return root
}

describe('runtime preflight', () => {
  it.each(['v24.22.2', 'v24.22.3', 'v24.23.0'])('accepts supported Node %s', nodeVersion => {
    expect(validateRuntime({ ...runtime, ...pins, nodeVersion })).toEqual([])
  })

  it.each(['v20.20.0', 'v24.22.1', 'v25.0.0', 'v24.23.0-rc.1'])('rejects unsupported Node %s', nodeVersion => {
    expect(validateRuntime({ ...runtime, ...pins, nodeVersion })).toEqual([expect.stringContaining('is unsupported')])
  })

  it('requires the pinned npm with an actionable remedy', () => {
    expect(validateRuntime({ ...runtime, ...pins, npmVersion: '10.0.0' })).toEqual([
      expect.stringContaining('npm install --global npm@11.19.1')
    ])
  })

  it('runs before node_modules or MCP configs exist', () => {
    const root = project()
    rmSync(join(root, 'node_modules'), { recursive: true })
    rmSync(join(root, '.mcp.json'))
    expect(inspectProject(root, { ...runtime, runtimeOnly: true })).toEqual([])
    expect(inspectProject(root, { ...runtime, runtimeOnly: true, npmVersion: '10.0.0' })).not.toEqual([])
  })
})

describe('project preflight', () => {
  it('accepts an installed project with matching configurations', () => {
    expect(inspectProject(project(), runtime)).toEqual([])
  })

  it('rejects a missing check script instead of skipping the workspace', () => {
    const root = project()
    writeJson(join(root, 'packages/front/package.json'), {
      name: '@vk-audiopad/front', dependencies: { '@vkontakte/vkui': '8.4.3' }, scripts: { build: 'vite build' }
    })
    expect(inspectProject(root, runtime)).toContain('@vk-audiopad/front: required script typecheck is missing.')
  })

  it('rejects missing tools and workspace links', () => {
    const root = project()
    rmSync(join(root, 'node_modules'), { recursive: true })
    const errors = inspectProject(root, runtime)
    expect(errors).toContain('Missing executable tsc. Run npm ci from the repository root.')
    expect(errors).toContain('@vk-audiopad/front: workspace link is missing. Run npm ci.')
  })

  it.each(['opencode.json', '.codex/config.toml'])('includes full MCP drift checks for %s', client => {
    const root = project()
    writeFileSync(join(root, client), client.endsWith('.json') ? '{}' : '')
    expect(inspectProject(root, runtime)).toEqual([expect.stringContaining('MCP configuration drift')])
  })

  it('rejects inconsistent toolchain metadata', () => {
    const root = project()
    writeFileSync(join(root, '.node-version'), '24.22.3')
    expect(inspectProject(root, { ...runtime, nodeVersion: 'v24.22.3' })).toEqual([
      expect.stringContaining('engines, packageManager and .node-version disagree')
    ])
  })
})
