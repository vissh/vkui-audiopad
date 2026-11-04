import { accessSync, constants, readFileSync, readdirSync, realpathSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { spawnSync } from 'node:child_process'
import { inspectMcpConfigs } from './mcp-config.mjs'

const projectRoot = fileURLToPath(new URL('../', import.meta.url))
const readJson = path => JSON.parse(readFileSync(path, 'utf8'))

export const validateRuntime = ({ nodeVersion, npmVersion, referenceNode, packageManager }) => {
  const errors = []
  const current = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(nodeVersion)
  const reference = /^(\d+)\.(\d+)\.(\d+)$/.exec(referenceNode)
  const npmPin = /^npm@(\d+\.\d+\.\d+)$/.exec(packageManager)

  if (reference == null || npmPin == null) {
    return ['Invalid toolchain configuration: expected .node-version x.y.z and packageManager npm@x.y.z']
  }

  const supportedNode = current != null && current[1] === reference[1] && (
    Number(current[2]) > Number(reference[2]) ||
    (current[2] === reference[2] && Number(current[3]) >= Number(reference[3]))
  )
  if (!supportedNode) {
    errors.push(`Node ${nodeVersion} is unsupported. Use Node ${referenceNode} from .node-version (same major, at least this version).`)
  }
  if (npmVersion !== npmPin[1]) {
    errors.push(`npm ${npmVersion} differs from ${packageManager}. Run npm install --global ${packageManager}.`)
  }
  return errors
}

export const inspectProject = (root, { runtimeOnly = false, nodeVersion, npmVersion }) => {
  const pkg = readJson(join(root, 'package.json'))
  const referenceNode = readFileSync(join(root, '.node-version'), 'utf8').trim()
  const errors = validateRuntime({ nodeVersion, npmVersion, referenceNode, packageManager: pkg.packageManager })
  if (pkg.engines?.node !== `>=${referenceNode} <${Number(referenceNode.split('.')[0]) + 1}` ||
      pkg.engines?.npm !== pkg.packageManager.replace('npm@', '')) {
    errors.push('engines, packageManager and .node-version disagree. Update the toolchain pins together.')
  }
  if (runtimeOnly) return errors

  for (const tool of ['tsc', 'vite', 'eslint', 'vitest']) {
    try {
      accessSync(join(root, 'node_modules', '.bin', tool), constants.X_OK)
    } catch {
      errors.push(`Missing executable ${tool}. Run npm ci from the repository root.`)
    }
  }

  const workspacePackages = readdirSync(join(root, 'packages'), { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => join(root, 'packages', entry.name, 'package.json'))
  for (const file of workspacePackages) {
    const workspace = readJson(file)
    for (const script of ['build', 'typecheck', 'lint', 'eslint:fix']) {
      if (typeof workspace.scripts?.[script] !== 'string' || workspace.scripts[script].trim() === '') {
        errors.push(`${workspace.name}: required script ${script} is missing.`)
      }
    }
    try {
      if (realpathSync(join(root, 'node_modules', workspace.name)) !== realpathSync(dirname(file))) {
        errors.push(`${workspace.name}: workspace link points outside its package. Run npm ci.`)
      }
    } catch {
      errors.push(`${workspace.name}: workspace link is missing. Run npm ci.`)
    }
  }

  errors.push(...inspectMcpConfigs(root))
  return errors
}

const run = () => {
  const args = process.argv.slice(2)
  if (args.some(arg => arg !== '--runtime-only')) {
    throw new Error('Usage: node scripts/doctor.mjs [--runtime-only]')
  }
  const npmCommand = args => process.env.npm_execpath != null
    ? spawnSync(process.execPath, [process.env.npm_execpath, ...args], { cwd: projectRoot, encoding: 'utf8' })
    : spawnSync('npm', args, { cwd: projectRoot, encoding: 'utf8' })
  const npmResult = npmCommand(['--version'])
  if (npmResult.error != null || npmResult.status !== 0) {
    throw new Error('Cannot run npm. Install the toolchain described in README.md.')
  }
  const runtimeOnly = args.includes('--runtime-only')
  const npmVersion = npmResult.stdout.trim()
  const errors = inspectProject(projectRoot, { runtimeOnly, nodeVersion: process.version, npmVersion })
  if (!runtimeOnly && errors.length === 0) {
    const tree = npmCommand(['ls', '--workspaces', '--include-workspace-root', '--depth=0', '--json'])
    if (tree.error != null || tree.status !== 0) {
      errors.push('Direct dependencies are inconsistent. Run npm ls --workspaces --include-workspace-root --depth=0 for details, then npm ci.')
    }
  }
  if (errors.length > 0) {
    errors.forEach(error => { console.error(`FAIL: ${error}`) })
    process.exitCode = 1
    return
  }
  console.log(`OK: Node ${process.version}, npm ${npmVersion}${runtimeOnly ? '' : ', workspace scripts, tools, dependency tree and shared MCP settings'}`)
  if (!runtimeOnly) {
    console.log('INFO: MCP servers are configured; connection status must be checked in the current agent session.')
  }
}

if (process.argv[1] != null && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    run()
  } catch (error) {
    console.error(`FAIL: ${error.message}`)
    process.exitCode = 1
  }
}
