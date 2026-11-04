import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs'
import { dirname, extname, isAbsolute, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { fromMarkdown } from 'mdast-util-from-markdown'
import GithubSlugger from 'github-slugger'

const rootGuides = ['README.md', 'AGENTS.md', 'CONTRIBUTING.md', 'CLAUDE.md', '.agents/skills/browser-extension-development/SKILL.md']
const visit = (node, action) => {
  action(node)
  for (const child of node.children ?? []) visit(child, action)
}
const textContent = node => node.value ?? node.alt ?? (node.children ?? []).map(textContent).join('')
const isOutside = (root, file) => {
  const path = relative(root, file)
  return path === '..' || path.startsWith('../') || isAbsolute(path)
}
const collectDocs = directory => readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
  const file = join(directory, entry.name)
  return entry.isDirectory() ? collectDocs(file) : entry.isFile() && extname(file) === '.md' ? [file] : []
})

export const inspectDocumentation = root => {
  root = resolve(root)
  const errors = []
  const trees = new Map()
  const anchors = new Map()
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  const scripts = pkg.scripts ?? {}
  const workspaces = existsSync(join(root, 'packages'))
    ? readdirSync(join(root, 'packages')).flatMap(directory => {
      const file = join(root, 'packages', directory, 'package.json')
      return existsSync(file) ? [{ path: `packages/${directory}`, ...JSON.parse(readFileSync(file, 'utf8')) }] : []
    })
    : []
  const files = rootGuides.map(file => join(root, file))
  const docs = join(root, 'docs')
  if (existsSync(docs)) files.push(...collectDocs(docs))
  else errors.push('docs/: missing documentation directory')

  const treeFor = file => {
    if (!trees.has(file)) trees.set(file, fromMarkdown(readFileSync(file, 'utf8')))
    return trees.get(file)
  }
  const anchorsFor = file => {
    if (!anchors.has(file)) {
      const slugger = new GithubSlugger()
      const ids = new Set()
      visit(treeFor(file), node => {
        if (node.type === 'heading') ids.add(slugger.slug(textContent(node)))
        if (node.type === 'html') {
          for (const match of node.value.matchAll(/\b(?:id|name)=["']([^"']+)["']/g)) ids.add(match[1])
        }
      })
      anchors.set(file, ids)
    }
    return anchors.get(file)
  }

  for (const file of files) {
    const name = relative(root, file)
    if (!existsSync(file)) {
      errors.push(`${name}: missing required guide`)
      continue
    }
    const tree = treeFor(file)
    const definitions = new Map()
    visit(tree, node => {
      if (node.type === 'definition') definitions.set(node.identifier, node.url)
    })
    const fail = (node, message) => { errors.push(`${name}:${node.position?.start.line ?? 1}: ${message}`) }
    const checkLink = (node, url) => {
      if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(url)) return
      try {
        const [path, fragment] = url.split('#', 2).map(part => decodeURIComponent(part))
        const target = path === '' ? file : resolve(path.startsWith('/') ? root : dirname(file), path.replace(/^\//, ''))
        if (isOutside(root, target)) return fail(node, `link leaves repository: ${url}`)
        if (!existsSync(target)) return fail(node, `missing link target: ${url}`)
        if (fragment && extname(target) === '.md' && !anchorsFor(target).has(fragment)) fail(node, `missing heading: ${url}`)
      } catch {
        fail(node, `invalid local link: ${url}`)
      }
    }
    visit(tree, node => {
      if (node.type === 'link' || node.type === 'image') checkLink(node, node.url)
      if (node.type === 'linkReference' || node.type === 'imageReference') {
        const target = definitions.get(node.identifier)
        if (target != null) checkLink(node, target)
      }
      if (node.type !== 'inlineCode' && !(node.type === 'code' && ['bash', 'sh', 'shell'].includes(node.lang))) return
      for (const match of node.value.matchAll(/\bnpm (?:run|run-script) (?:(--workspaces) )?([\w][\w:.-]*)([^\n`]*)/g)) {
        const selector = /(?:^|\s)(?:-w|--workspace)(?:=|\s+)([\w@/.-]+)/.exec(match[3])?.[1]
        const all = match[1] != null || /(?:^|\s)--workspaces(?:$|\s)/.test(match[3])
        const selected = selector == null ? workspaces : workspaces.filter(pkg => [pkg.name, pkg.path, pkg.path.replace('packages/', '')].includes(selector))
        if (selector != null && selected.length === 0) fail(node, `unknown workspace: ${selector}`)
        else if (selector != null || all) {
          for (const workspace of selected) {
            if (typeof workspace.scripts?.[match[2]] !== 'string') fail(node, `unknown npm script ${match[2]} in ${workspace.name}`)
          }
        } else if (typeof scripts[match[2]] !== 'string') fail(node, `unknown root npm script: ${match[2]}`)
      }
      for (const match of node.value.matchAll(/\bnode (scripts\/[\w./-]+\.(?:mjs|js|ts))\b|(?:^|\s)(\.\/[\w./-]+\.sh)\b/g)) {
        const path = match[1] ?? match[2]
        const target = resolve(root, path)
        if (isOutside(root, target) || !existsSync(target) || !statSync(target).isFile()) fail(node, `missing command entrypoint: ${path}`)
      }
    })
  }
  const claude = join(root, 'CLAUDE.md')
  if (existsSync(claude) && readFileSync(claude, 'utf8').trim() !== '@AGENTS.md') {
    errors.push('CLAUDE.md: import @AGENTS.md as the single instruction source; do not duplicate instructions')
  }
  try {
    if (realpathSync(join(root, '.claude/skills')) !== realpathSync(join(root, '.agents/skills'))) {
      errors.push('.claude/skills: must link to ../.agents/skills; do not maintain a separate skill copy')
    }
  } catch {
    errors.push('.claude/skills: missing shared skill alias; restore the symlink to ../.agents/skills')
  }
  try {
    const opencode = JSON.parse(readFileSync(join(root, 'opencode.json'), 'utf8'))
    if (!opencode.skills?.paths?.includes('.agents/skills')) errors.push('opencode.json: skills.paths must include .agents/skills')
  } catch {
    errors.push('opencode.json: missing or invalid shared skill discovery settings')
  }
  return errors
}

if (process.argv[1] != null && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const errors = inspectDocumentation(fileURLToPath(new URL('../', import.meta.url)))
  for (const error of errors) console.error(`FAIL: ${error}`)
  if (errors.length > 0) process.exitCode = 1
  else console.log('OK: maintained Markdown links/headings, documented command entrypoints and shared instructions')
}
