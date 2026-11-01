import neostandard from 'neostandard'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import { fixupPluginRules } from '@eslint/compat'
import { createPlugin as featureSliced } from '@conarti/eslint-plugin-feature-sliced'

// eslint-plugin-react uses ESLint APIs removed in v10; the official
// @eslint/compat adapter patches them until native support lands (jsx-eslint#3977)
const compatibleReactPlugin = fixupPluginRules(react)
const reactRecommended = {
  ...react.configs.flat.recommended,
  plugins: {
    ...react.configs.flat.recommended.plugins,
    react: compatibleReactPlugin,
  },
}

export default [
  {
    ignores: ['dist'],
  },
  ...neostandard({ ts: true, env: ['browser', 'es2021'] }),
  reactRecommended,
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
