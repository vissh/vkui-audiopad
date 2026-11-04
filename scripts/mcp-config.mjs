import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { isDeepStrictEqual } from 'node:util'

const projectRoot = fileURLToPath(new URL('../', import.meta.url))
const readJson = path => JSON.parse(readFileSync(path, 'utf8'))
const isObject = value => value != null && typeof value === 'object' && !Array.isArray(value)
const remedy = 'Edit .mcp.json, then run npm run mcp:sync.'

export const renderMcpConfigs = source => {
  if (!isObject(source) || Object.keys(source).some(key => key !== 'mcpServers') || !isObject(source.mcpServers)) {
    throw new Error('.mcp.json must contain only a mcpServers object.')
  }
  for (const name of ['vkui', 'chrome-devtools', 'firefox-devtools']) {
    if (!Object.hasOwn(source.mcpServers, name)) throw new Error(`Missing required project MCP server: ${name}.`)
  }

  /** @type {Record<string, { type: 'local', command: string[], enabled: boolean, environment?: Record<string, string> }>} */
  const opencode = {}
  const codex = ['# Generated from .mcp.json by npm run mcp:sync. Do not edit by hand.']
  for (const [name, server] of Object.entries(source.mcpServers)) {
    if (!/^[a-z][a-z0-9-]*$/.test(name) || !isObject(server)) throw new Error(`Invalid MCP server: ${name}.`)
    const unsupported = Object.keys(server).filter(key => !['type', 'command', 'args', 'env'].includes(key))
    if (unsupported.length > 0 || (server.type !== undefined && server.type !== 'stdio')) {
      throw new Error(`${name}: unsupported MCP options (${unsupported.join(', ') || 'type'}). Update all client adapters and tests before using them.`)
    }
    if (typeof server.command !== 'string' || server.command.trim() === '' ||
        (server.args !== undefined && (!Array.isArray(server.args) || server.args.some(arg => typeof arg !== 'string'))) ||
        (server.env !== undefined && (!isObject(server.env) || Object.entries(server.env).some(([key, value]) => !/^[A-Z_][A-Z0-9_]*$/.test(key) || typeof value !== 'string')))) {
      throw new Error(`${name}: expected a command, string args and string environment variables.`)
    }
    const args = server.args ?? []
    const env = server.env ?? {}
    if ([server.command, ...args, ...Object.values(env)].some(value => /\$\{|\{(?:env|file):/.test(value))) {
      throw new Error(`${name}: client-specific variable substitution is unsupported. Use literal shared settings.`)
    }
    opencode[name] = {
      type: 'local',
      command: [server.command, ...args],
      enabled: true,
      ...(Object.keys(env).length > 0 ? { environment: env } : {})
    }
    codex.push('', `[mcp_servers.${JSON.stringify(name)}]`, 'enabled = true',
      `command = ${JSON.stringify(server.command)}`, `args = ${JSON.stringify(args)}`)
    if (Object.keys(env).length > 0) {
      codex.push('', `[mcp_servers.${JSON.stringify(name)}.env]`,
        ...Object.entries(env).map(([key, value]) => `${JSON.stringify(key)} = ${JSON.stringify(value)}`))
    }
  }
  return { opencode, codex: codex.join('\n') + '\n' }
}

const loadProject = root => {
  const source = readJson(join(root, '.mcp.json'))
  const rendered = renderMcpConfigs(source)
  const vkuiVersion = readJson(join(root, 'packages/front/package.json')).dependencies['@vkontakte/vkui']
  if (source.mcpServers.vkui.env?.VKUI_VERSION !== vkuiVersion) {
    throw new Error(`VKUI MCP version drift: frontend ${vkuiVersion}, .mcp.json ${source.mcpServers.vkui.env?.VKUI_VERSION}. Update .mcp.json, then run npm run mcp:sync.`)
  }
  return rendered
}

export const inspectMcpConfigs = root => {
  let expected
  try {
    expected = loadProject(root)
  } catch (error) {
    return [`MCP source configuration: ${error.message}`]
  }
  const errors = []
  try {
    if (!isDeepStrictEqual(readJson(join(root, 'opencode.json')).mcp, expected.opencode)) {
      errors.push(`MCP configuration drift in opencode.json (mcp). ${remedy}`)
    }
  } catch {
    errors.push('Missing or invalid opencode.json. Restore valid JSON, then run npm run mcp:sync.')
  }
  try {
    if (readFileSync(join(root, '.codex/config.toml'), 'utf8').replaceAll('\r\n', '\n') !== expected.codex) {
      errors.push(`MCP configuration drift in .codex/config.toml. ${remedy}`)
    }
  } catch {
    errors.push('Missing .codex/config.toml. Run npm run mcp:sync.')
  }
  return errors
}

export const syncMcpConfigs = root => {
  const expected = loadProject(root)
  let opencode
  try {
    opencode = readJson(join(root, 'opencode.json'))
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    opencode = { $schema: 'https://opencode.ai/config.json', skills: { paths: ['.agents/skills'] } }
  }
  if (!isObject(opencode)) throw new Error('opencode.json must be an object.')
  mkdirSync(join(root, '.codex'), { recursive: true })
  writeFileSync(join(root, '.codex/config.toml'), expected.codex)
  writeFileSync(join(root, 'opencode.json'), JSON.stringify({ ...opencode, mcp: expected.opencode }, null, 2) + '\n')
}

if (process.argv[1] != null && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    const args = process.argv.slice(2)
    if (args.length !== 1 || !['--check', '--write'].includes(args[0])) {
      throw new Error('Usage: node scripts/mcp-config.mjs --check|--write')
    }
    if (args[0] === '--write') syncMcpConfigs(projectRoot)
    const errors = inspectMcpConfigs(projectRoot)
    if (errors.length > 0) throw new Error(errors.join('\n'))
    console.log('OK: MCP settings agree for Claude Code, OpenCode and Codex.')
  } catch (error) {
    console.error(`FAIL: ${error.message}`)
    process.exitCode = 1
  }
}
