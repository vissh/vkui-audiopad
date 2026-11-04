import { afterEach, expect, it } from 'vitest'
import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { inspectDocumentation } from './check-documentation.mjs'

const roots: string[] = []
const fixture = () => {
  const root = mkdtempSync(join(tmpdir(), 'vk-audiopad-docs-'))
  roots.push(root)
  mkdirSync(join(root, 'docs'))
  mkdirSync(join(root, '.agents/skills/browser-extension-development'), { recursive: true })
  writeFileSync(join(root, '.agents/skills/browser-extension-development/SKILL.md'), '# Extension workflow\n')
  mkdirSync(join(root, '.claude'))
  symlinkSync('../.agents/skills', join(root, '.claude/skills'), 'dir')
  writeFileSync(join(root, 'opencode.json'), JSON.stringify({ skills: { paths: ['.agents/skills'] } }))
  writeFileSync(join(root, 'package.json'), JSON.stringify({ scripts: { check: 'touch should-not-run', 'docs:check': 'node scripts/check-documentation.mjs' } }))
  for (const file of ['README.md', 'AGENTS.md', 'CONTRIBUTING.md']) writeFileSync(join(root, file), '# Guide\n')
  writeFileSync(join(root, 'CLAUDE.md'), '@AGENTS.md\n')
  const write = (file: string, text: string) => { writeFileSync(join(root, file), text) }
  return { root, write }
}
afterEach(() => { roots.splice(0).forEach(root => { rmSync(root, { recursive: true, force: true }) }) })

it('validates actual Markdown links and duplicate Unicode headings without executing documented commands', () => {
  const { root, write } = fixture()
  write('docs/guide (copy).md', '# Привет, **мир**!\n\n# Привет, **мир**!\n')
  write('README.md', '[Guide](<docs/guide%20(copy).md#привет-мир-1>)\n\n```bash\nnpm run check\n```\n\n`[example](missing.md)`\n\n```md\n[example](missing.md)\n```\n')
  expect(inspectDocumentation(root)).toEqual([])
  expect(existsSync(join(root, 'should-not-run'))).toBe(false)
})

it.each([
  ['[Missing](docs/missing.md)', 'missing link target'],
  ['[Heading](AGENTS.md#not-a-heading)', 'missing heading'],
  ['![Image](missing.png)', 'missing link target'],
  ['[reference][target]\n\n[target]: missing.md', 'missing link target'],
  ['[Outside](../outside.md)', 'link leaves repository'],
  ['[Invalid](docs/%zz.md)', 'invalid local link']
])('rejects a broken local reference: %s', (markdown, error) => {
  const { root, write } = fixture()
  write('README.md', markdown)
  expect(inspectDocumentation(root)).toEqual([expect.stringContaining(error)])
})

it('does not fetch external links and supports images, root links and explicit HTML anchors', () => {
  const { root, write } = fixture()
  write('docs/guide.md', '<a id="custom-anchor"></a>\n\n# Heading\n')
  write('README.md', '[External](https://unavailable.invalid/)\n[Guide](/docs/guide.md#custom-anchor)\n![Image](image.png)\n')
  write('image.png', 'synthetic')
  expect(inspectDocumentation(root)).toEqual([])
})

it('detects a removed npm script and a missing shell or node entrypoint in runnable examples', () => {
  const { root, write } = fixture()
  write('README.md', '```bash\nnpm run missing\nnode scripts/missing.mjs\n./missing.sh\n```\n')
  expect(inspectDocumentation(root)).toEqual([
    expect.stringContaining('unknown root npm script: missing'),
    expect.stringContaining('missing command entrypoint: scripts/missing.mjs'),
    expect.stringContaining('missing command entrypoint: ./missing.sh')
  ])
})

it('validates workspace commands against the selected package rather than the root', () => {
  const { root, write } = fixture()
  mkdirSync(join(root, 'packages/front'), { recursive: true })
  write('packages/front/package.json', JSON.stringify({ name: '@vk-audiopad/front', scripts: { lint: 'eslint src' } }))
  write('README.md', '`npm run lint -w @vk-audiopad/front`\n`npm run --workspaces lint`\n')
  expect(inspectDocumentation(root)).toEqual([])
  write('README.md', '`npm run absent --workspaces`\n`npm run lint -w missing`')
  expect(inspectDocumentation(root)).toEqual([expect.stringContaining('unknown npm script absent in @vk-audiopad/front'), expect.stringContaining('unknown workspace: missing')])
})

it('requires the shared Claude instruction import and the main guides', () => {
  const { root, write } = fixture()
  write('CLAUDE.md', '# Copied instructions\n')
  rmSync(join(root, 'AGENTS.md'))
  expect(inspectDocumentation(root)).toEqual([expect.stringContaining('AGENTS.md: missing required guide'), expect.stringContaining('CLAUDE.md: import @AGENTS.md')])
})

it('validates project-owned skill references but leaves vendored instructions out of the maintained set', () => {
  const { root, write } = fixture()
  mkdirSync(join(root, '.agents/skills/vendor'))
  write('.agents/skills/vendor/SKILL.md', '[External vendor structure](not-vendored.md)')
  write('.agents/skills/browser-extension-development/SKILL.md', '[Broken route](../../../docs/removed.md)')
  expect(inspectDocumentation(root)).toEqual([expect.stringContaining('missing link target')])
})

it.each(['missing', 'copied', 'wrong-target'])('rejects a %s Claude skill alias even when copied content matches', change => {
  const { root } = fixture()
  rmSync(join(root, '.claude/skills'))
  if (change === 'copied') cpSync(join(root, '.agents/skills'), join(root, '.claude/skills'), { recursive: true })
  if (change === 'wrong-target') symlinkSync('../docs', join(root, '.claude/skills'), 'dir')
  expect(inspectDocumentation(root)).toEqual([expect.stringContaining('.claude/skills')])
})

it('detects removed OpenCode skill discovery', () => {
  const { root, write } = fixture()
  write('opencode.json', JSON.stringify({ skills: { paths: [] } }))
  expect(inspectDocumentation(root)).toEqual([expect.stringContaining('skills.paths must include .agents/skills')])
})
