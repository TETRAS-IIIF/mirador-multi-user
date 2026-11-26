module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  // Warnings don't fail `npm run lint`: only `any` is a warning, to type
  // gradually. Everything else is an error.
  rules: {
    'react-refresh/only-export-components': [
      'error',
      { allowConstantExport: true },
    ],
    'react-hooks/exhaustive-deps': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
  },
}
