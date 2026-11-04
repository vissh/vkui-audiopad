import neostandard from 'neostandard'

export default [
  { ignores: ['packages/**', 'dist/**', '.agents/**'] },
  ...neostandard({ ts: true, filesTs: ['**/*.mts'], noJsx: true, env: ['node', 'browser'] })
]
