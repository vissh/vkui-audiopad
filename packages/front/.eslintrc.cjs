module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
  },
  settings: {
    react: {
      version: "19.3.1"
    }
  },
  extends: [
    "standard-with-typescript",
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:@conarti/feature-sliced/recommended",
  ],
  plugins: [
    "@typescript-eslint",
    "react",
    "@stylistic/ts",
    "@stylistic/jsx"
  ],
  ignorePatterns: ["dist", ".eslintrc.cjs"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  rules: {
    "@stylistic/ts/indent": ["error", 2],
    "@stylistic/jsx/jsx-indent": ["error", 2],
    "react/react-in-jsx-scope": "off",
    "@typescript-eslint/explicit-function-return-type": "off",
  },
  overrides: [
    {
      // React 19 types include Promise in ReactNode (async components),
      // false-positive on functions returning ReactNode
      files: [
        "src/shared/model/notification-atom.ts",
        "src/shared/ui/notification/Notification.tsx",
      ],
      rules: {
        "@typescript-eslint/promise-function-async": "off",
      },
    },
  ],
};
