import neostandard from 'neostandard'

export default [
  {
    ignores: ['dist'],
  },
  ...neostandard({ ts: true, noJsx: true, env: ['browser', 'es2021'] }),
  {
    // allow `void promise;` discard idiom;
    // keep rules from the retired standard-with-typescript preset
    rules: {
      'no-void': ['error', { allowAsStatement: true }],
      '@typescript-eslint/no-dynamic-delete': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
]
