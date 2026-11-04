import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'
import { commonTypes } from '@vk-audiopad/common'
import { runFirefoxSmoke } from '../tests/browser/firefox-probe.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const build = join(root, 'dist/firefox_extension')
if (!existsSync(join(build, 'manifest.json'))) throw new Error('Run ./build.sh and npm run verify:build before smoke:firefox')
const manifest = JSON.parse(readFileSync(join(build, 'manifest.json'), 'utf8'))
if (manifest.background?.page !== 'offscreen.html') throw new Error('Expected the Firefox build')
const extensionId = manifest.browser_specific_settings.gecko.id
const config = JSON.parse(readFileSync(join(root, '.mcp.json'), 'utf8')).mcpServers['firefox-devtools']
if (config.args.some(arg => /^--(?:connect-?existing|profile-?path|firefox-?arg)(?:=|$)/i.test(arg))) throw new Error('smoke:firefox requires managed launch settings, without existing-session/profile overrides')
const temporary = mkdtempSync(join(tmpdir(), 'vk-audiopad-firefox-smoke-'))
const extensionPath = join(temporary, 'extension')
const args = config.args.filter(arg => arg !== '--auto-profile')
args.push('--headless', '--profile-path', join(temporary, 'profile'), '--output-file', join(temporary, 'firefox.log'))
if (process.env.VKAP_FIREFOX_BINARY) args.push('--firefox-path', resolve(process.env.VKAP_FIREFOX_BINARY))
const transport = new StdioClientTransport({ command: config.command, args, env: { ...process.env, ...config.env }, stderr: 'pipe', cwd: root })
const client = new Client({ name: 'vk-audiopad-firefox-smoke', version: '1.0.0' })
const text = result => (result.content ?? []).filter(item => item.type === 'text').map(item => item.text).join('\n')
const call = async (name, args = {}) => {
  const result = await client.callTool({ name, arguments: args }, undefined, { timeout: 120_000 })
  if (result.isError) throw new Error(`Firefox MCP ${name} failed: ${text(result).slice(0, 500)}`)
  return text(result)
}
let connected = false
let browserStarted = false
try {
  cpSync(build, extensionPath, { recursive: true })
  const options = { targets: commonTypes.MessageTarget, types: commonTypes.MessageType, repeatModes: commonTypes.RepeatMode }
  writeFileSync(join(extensionPath, 'smoke-probe.html'), '<!doctype html><html><head><title>VK Audiopad runtime smoke</title><script src="smoke-probe.js" defer></script></head><body>Isolated runtime smoke</body></html>')
  writeFileSync(join(extensionPath, 'smoke-probe.js'), `window.runFirefoxSmoke = () => (${runFirefoxSmoke.toString()})(${JSON.stringify(options)})`)
  await client.connect(transport)
  connected = true
  const { tools } = await client.listTools()
  for (const name of ['install_extension', 'list_extensions', 'list_privileged_contexts', 'evaluate_privileged_script', 'select_page', 'evaluate_script', 'close_firefox_session']) {
    if (!tools.some(tool => tool.name === name)) throw new Error(`Firefox MCP is missing ${name}; check the shared moz build and tool modules`)
  }
  browserStarted = true
  await call('install_extension', { type: 'path', path: extensionPath })
  const installed = await call('list_extensions', { ids: [extensionId] })
  const uuid = /UUID: ([\da-f-]{36})/i.exec(installed)?.[1]
  if (!uuid) throw new Error('Firefox MCP did not report the installed addon UUID')
  const contexts = await call('list_privileged_contexts')
  const context = /([\da-f-]{36}): chrome:\/\/browser\//i.exec(contexts)?.[1]
  if (!context) throw new Error('Firefox browser context unavailable; check MOZ_REMOTE_ALLOW_SYSTEM_ACCESS')
  const url = `moz-extension://${uuid}/smoke-probe.html`
  await call('evaluate_privileged_script', { context, function: `() => { const tab = gBrowser.addTab(${JSON.stringify(url)}, { triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal() }); gBrowser.selectedTab = tab; return true }` })
  let result
  const deadline = Date.now() + 15_000
  do {
    const pages = await call('list_pages')
    if (!pages.includes(url)) {
      await delay(50)
      continue
    }
    await call('select_page', { url })
    const raw = await call('evaluate_script', { function: 'async () => typeof window.runFirefoxSmoke === "function" ? await window.runFirefoxSmoke() : null' })
    const json = /```json\s*([\s\S]*?)\s*```/.exec(raw)?.[1]
    if (!json) throw new Error('Unexpected Firefox evaluation result format')
    result = JSON.parse(json)
    if (result !== null) break
    await delay(50)
  } while (Date.now() < deadline)
  const expectedModes = [commonTypes.RepeatMode.REPEAT, commonTypes.RepeatMode.REPEAT_ONE, commonTypes.RepeatMode.NONE]
  if (result?.ready !== true || result?.snapshotRoundTrip !== true || JSON.stringify(result.repeatModes) !== JSON.stringify(expectedModes)) throw new Error('Firefox runtime smoke did not finish')
  console.log(`OK: Firefox temporary addon startup, empty Audio snapshot and applied repeat commands ${JSON.stringify(result)}`)
} finally {
  try {
    if (connected && browserStarted) await call('close_firefox_session')
  } finally {
    await client.close()
    rmSync(temporary, { recursive: true, force: true })
  }
}
