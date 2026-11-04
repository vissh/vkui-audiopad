import { afterEach, describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { inspectMcpConfigs, renderMcpConfigs, syncMcpConfigs } from './mcp-config.mjs'

const fixtures: string[] = []
const source = () => ({
  mcpServers: {
    vkui: { command: 'npx', args: ['-y', '@vkontakte/vkui-mcp@1.1.0'], env: { VKUI_VERSION: '8.4.3' } },
    'chrome-devtools': { command: 'npx', args: ['-y', 'chrome-devtools-mcp@1.12.0', '--categoryExtensions', '--no-usage-statistics'] },
    'firefox-devtools': { command: 'npx', args: ['-y', '@mozilla/firefox-devtools-mcp-moz@0.10.7', '--tools', 'pages', 'snapshot', 'input', 'network', 'console', 'screenshot', 'utilities', 'management', 'webextension', 'script', 'privileged', '--auto-profile', '--viewport', '780x600'], env: { MOZ_REMOTE_ALLOW_SYSTEM_ACCESS: '1' } }
  }
})
const writeJson = (path: string, value: unknown) => { writeFileSync(path, JSON.stringify(value)) }
const readJson = (path: string) => JSON.parse(readFileSync(path, 'utf8'))
const project = () => {
  const root = mkdtempSync(join(tmpdir(), 'vk-audiopad-mcp-'))
  fixtures.push(root)
  mkdirSync(join(root, 'packages/front'), { recursive: true })
  writeJson(join(root, 'packages/front/package.json'), { dependencies: { '@vkontakte/vkui': '8.4.3' } })
  writeJson(join(root, '.mcp.json'), source())
  syncMcpConfigs(root)
  return root
}

afterEach(() => { fixtures.splice(0).forEach(path => { rmSync(path, { recursive: true, force: true }) }) })

describe('shared MCP settings', () => {
  it('maps the same commands, flags and environment to native client formats', () => {
    const result = renderMcpConfigs(source())
    expect(result.opencode).toEqual({
      vkui: { type: 'local', command: ['npx', '-y', '@vkontakte/vkui-mcp@1.1.0'], enabled: true, environment: { VKUI_VERSION: '8.4.3' } },
      'chrome-devtools': { type: 'local', command: ['npx', '-y', 'chrome-devtools-mcp@1.12.0', '--categoryExtensions', '--no-usage-statistics'], enabled: true },
      'firefox-devtools': { type: 'local', command: ['npx', '-y', '@mozilla/firefox-devtools-mcp-moz@0.10.7', '--tools', 'pages', 'snapshot', 'input', 'network', 'console', 'screenshot', 'utilities', 'management', 'webextension', 'script', 'privileged', '--auto-profile', '--viewport', '780x600'], enabled: true, environment: { MOZ_REMOTE_ALLOW_SYSTEM_ACCESS: '1' } }
    })
    expect(result.codex).toBe(`# Generated from .mcp.json by npm run mcp:sync. Do not edit by hand.

[mcp_servers."vkui"]
enabled = true
command = "npx"
args = ["-y","@vkontakte/vkui-mcp@1.1.0"]

[mcp_servers."vkui".env]
"VKUI_VERSION" = "8.4.3"

[mcp_servers."chrome-devtools"]
enabled = true
command = "npx"
args = ["-y","chrome-devtools-mcp@1.12.0","--categoryExtensions","--no-usage-statistics"]

[mcp_servers."firefox-devtools"]
enabled = true
command = "npx"
args = ["-y","@mozilla/firefox-devtools-mcp-moz@0.10.7","--tools","pages","snapshot","input","network","console","screenshot","utilities","management","webextension","script","privileged","--auto-profile","--viewport","780x600"]

[mcp_servers."firefox-devtools".env]
"MOZ_REMOTE_ALLOW_SYSTEM_ACCESS" = "1"
`)
  })

  it('escapes quoted and multiline values for TOML without changing their meaning in OpenCode', () => {
    const config = source()
    config.mcpServers.vkui.env.VKUI_VERSION = 'a"b\\c\nстрока'
    const result = renderMcpConfigs(config)
    expect(result.codex).toContain('"VKUI_VERSION" = "a\\"b\\\\c\\nстрока"')
    expect(result.opencode.vkui.environment).toEqual({ VKUI_VERSION: 'a"b\\c\nстрока' })
  })

  it('keeps other OpenCode settings and synchronizes idempotently', () => {
    const root = project()
    const file = join(root, 'opencode.json')
    writeJson(file, { ...readJson(file), skills: { paths: ['custom/skills'] }, instructions: ['AGENTS.md'] })
    syncMcpConfigs(root)
    const first = readFileSync(file, 'utf8')
    const codex = readFileSync(join(root, '.codex/config.toml'), 'utf8')
    syncMcpConfigs(root)
    expect(readFileSync(file, 'utf8')).toBe(first)
    expect(readJson(file)).toMatchObject({ skills: { paths: ['custom/skills'] }, instructions: ['AGENTS.md'] })
    expect(readFileSync(join(root, '.codex/config.toml'), 'utf8')).toBe(codex)
    expect(inspectMcpConfigs(root)).toEqual([])
  })

  it('requires regeneration of both clients when the shared source changes', () => {
    const root = project()
    const config = source()
    config.mcpServers['chrome-devtools'].args.push('--headless')
    writeJson(join(root, '.mcp.json'), config)
    expect(inspectMcpConfigs(root)).toEqual([
      expect.stringContaining('drift in opencode.json'), expect.stringContaining('drift in .codex/config.toml')
    ])
    syncMcpConfigs(root)
    expect(inspectMcpConfigs(root)).toEqual([])
    expect(readJson(join(root, 'opencode.json')).mcp['chrome-devtools'].command).toContain('--headless')
    expect(readFileSync(join(root, '.codex/config.toml'), 'utf8')).toContain('--headless')
  })

  it.each(['command', 'version', 'flag', 'env', 'disabled', 'missing', 'extra', 'option', 'firefox-env', 'firefox-missing', 'firefox-disabled'])('rejects OpenCode drift: %s', change => {
    const root = project()
    const file = join(root, 'opencode.json')
    const config = readJson(file)
    const chrome = config.mcp['chrome-devtools']
    switch (change) {
      case 'command': chrome.command[0] = 'pnpm'; break
      case 'version': chrome.command[2] = 'chrome-devtools-mcp@latest'; break
      case 'flag': chrome.command.push('--headless'); break
      case 'env': config.mcp.vkui.environment.VKUI_VERSION = '7.0.0'; break
      case 'disabled': chrome.enabled = false; break
      case 'missing': delete config.mcp['chrome-devtools']; break
      case 'extra': config.mcp.other = chrome; break
      case 'option': chrome.timeout = 1; break
      case 'firefox-env': config.mcp['firefox-devtools'].environment.MOZ_REMOTE_ALLOW_SYSTEM_ACCESS = '0'; break
      case 'firefox-missing': delete config.mcp['firefox-devtools']; break
      case 'firefox-disabled': config.mcp['firefox-devtools'].enabled = false; break
    }
    writeJson(file, config)
    expect(inspectMcpConfigs(root)).toEqual([expect.stringContaining('drift in opencode.json')])
  })

  it.each([
    ['command = "npx"', 'command = "pnpm"'],
    ['chrome-devtools-mcp@1.12.0', 'chrome-devtools-mcp@latest'],
    ['--categoryExtensions', '--headless'],
    ['8.4.3', '7.0.0'],
    ['@mozilla/firefox-devtools-mcp-moz@0.10.7', '@mozilla/firefox-devtools-mcp-moz@latest'],
    ['--auto-profile', '--headless'],
    ['enabled = true', 'enabled = false'],
    ['[mcp_servers."chrome-devtools"]', '[mcp_servers."other"]']
  ])('rejects Codex drift: %s', (before, after) => {
    const root = project()
    const file = join(root, '.codex/config.toml')
    writeFileSync(file, readFileSync(file, 'utf8').replace(before, after))
    expect(inspectMcpConfigs(root)).toEqual([expect.stringContaining('drift in .codex/config.toml')])
  })

  it.each(['opencode.json', '.codex/config.toml'])('reports missing %s and can recreate it', file => {
    const root = project()
    rmSync(join(root, file))
    expect(inspectMcpConfigs(root)).toEqual([expect.stringContaining('npm run mcp:sync')])
    syncMcpConfigs(root)
    expect(inspectMcpConfigs(root)).toEqual([])
  })

  it('reports malformed JSON without overwriting it or the other client', () => {
    const root = project()
    writeFileSync(join(root, 'opencode.json'), '{bad json')
    const codex = readFileSync(join(root, '.codex/config.toml'), 'utf8')
    expect(inspectMcpConfigs(root)).toEqual([expect.stringContaining('invalid opencode.json')])
    expect(() => syncMcpConfigs(root)).toThrow()
    expect(readFileSync(join(root, 'opencode.json'), 'utf8')).toBe('{bad json')
    expect(readFileSync(join(root, '.codex/config.toml'), 'utf8')).toBe(codex)
  })

  it.each(['cwd', 'url', 'env_vars', 'disabledTools'])('rejects unsupported source options instead of dropping %s', key => {
    const config = source()
    Object.assign(config.mcpServers['chrome-devtools'], { [key]: 'value' })
    expect(() => renderMcpConfigs(config)).toThrow('Update all client adapters and tests')
  })

  it.each([
    { command: '' }, { command: 1 }, { args: null }, { args: [1] },
    { env: null }, { env: { TOKEN: false } }, { env: { 'INVALID-KEY': 'value' } }, { type: 'http' }
  ])('rejects malformed source server settings: %j', invalid => {
    const config = source()
    Object.assign(config.mcpServers['chrome-devtools'], invalid)
    expect(() => renderMcpConfigs(config)).toThrow()
  })

  it.each(['vkui', 'chrome-devtools', 'firefox-devtools'])('requires the shared %s server', name => {
    const config = source()
    Reflect.deleteProperty(config.mcpServers, name)
    expect(() => renderMcpConfigs(config)).toThrow(`Missing required project MCP server: ${name}`)
  })

  it.each(['$' + '{TOKEN}', '{env:TOKEN}', '{file:token}'])('rejects client-specific substitution: %s', value => {
    const config = source()
    config.mcpServers.vkui.env.VKUI_VERSION = value
    expect(() => renderMcpConfigs(config)).toThrow('client-specific variable substitution')
  })

  it('rejects VKUI drift even after the client files have been synchronized', () => {
    const root = project()
    writeJson(join(root, 'packages/front/package.json'), { dependencies: { '@vkontakte/vkui': '8.5.0' } })
    expect(inspectMcpConfigs(root)).toEqual([expect.stringContaining('VKUI MCP version drift')])
    expect(() => syncMcpConfigs(root)).toThrow('VKUI MCP version drift')
  })

  it('keeps the committed native configs synchronized in the real repository', () => {
    expect(inspectMcpConfigs(fileURLToPath(new URL('../', import.meta.url)))).toEqual([])
  })
})
