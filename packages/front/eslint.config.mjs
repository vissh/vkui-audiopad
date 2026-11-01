import neostandard from 'neostandard'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import { createPlugin as featureSliced } from '@conarti/eslint-plugin-feature-sliced'

export default [
  {
    ignores: ['dist'],
  },
  ...neostandard({ ts: true, env: ['browser', 'es2021'] }),
  react.configs.flat.recommended,
  reactHooks.configs.flat.recommended,
  featureSliced(),
  {
    settings: {
      react: {
        version: '19.3.1',
      },
    },
    rules: {
      'no-void': ['error', { allowAsStatement: true }],
      // keep rules from the retired standard-with-typescript preset;
      // promise-function-async is not restorable without type-aware linting
      '@typescript-eslint/no-dynamic-delete': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      'react/react-in-jsx-scope': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
]
