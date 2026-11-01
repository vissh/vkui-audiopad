import neostandard from 'neostandard'

export default [
  {
    // unmask.js — vendored minified code, do not lint or reformat
    ignores: ['dist', 'src/fetchers/unmask.js'],
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
